/* POST /api/stripe/webhook — subscription lifecycle (Gate 6).
   Signature verified on the RAW body. Every event id is recorded in
   stripe_events first (U9): Stripe redelivers, we process once. */

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { CREDITS_BY_TIER, stripeClient, tierForPriceId, type LicenseTier } from "@/lib/billing";
import { serverEnv } from "@/lib/env";
import { jsonError } from "@/lib/routeUtils";
import { serviceClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function provisionOperator(userId: string, tier: LicenseTier | null) {
  const db = serviceClient();
  const { data: existing } = await db
    .from("operators")
    .select("id, activation_credits")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await db.from("operators").update({ license_tier: tier }).eq("id", existing.id);
    return;
  }
  if (tier) {
    await db.from("operators").insert({
      user_id: userId,
      org_name: null,
      license_tier: tier,
      seat_count: 1,
      activation_credits: CREDITS_BY_TIER[tier],
    });
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonError(400, "Missing signature");

  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      serverEnv.stripeWebhookSecret
    );
  } catch {
    return jsonError(400, "Invalid signature");
  }

  const db = serviceClient();

  // Idempotency: first delivery wins; replays acknowledge and exit.
  const { data: recorded } = await db
    .from("stripe_events")
    .upsert({ id: event.id, type: event.type }, { onConflict: "id", ignoreDuplicates: true })
    .select("id");
  if (!recorded || recorded.length === 0) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const tier = (session.metadata?.tier as LicenseTier | undefined) ?? null;
      if (userId) {
        await db.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id:
              typeof session.customer === "string" ? session.customer : null,
            stripe_sub_id:
              typeof session.subscription === "string" ? session.subscription : null,
            tier,
            status: "active",
          },
          { onConflict: "stripe_sub_id" }
        );
        await provisionOperator(userId, tier);
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price?.id ?? "";
      const tier = tierForPriceId(priceId) ?? (subscription.metadata?.tier as LicenseTier | undefined) ?? null;
      await db
        .from("subscriptions")
        .update({
          status: subscription.status,
          tier,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_sub_id", subscription.id);
      const userId = subscription.metadata?.user_id;
      if (userId && tier) await provisionOperator(userId, tier);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await db
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_sub_id", subscription.id);
      const userId = subscription.metadata?.user_id;
      if (userId) await provisionOperator(userId, null);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
