/* POST /api/stripe/checkout — create a subscription checkout.
   Gate 6: price IDs come from the server whitelist only; user_id rides in
   metadata so the webhook can provision without trusting client input. */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { billingConfigured, LICENSE_TIERS, PRICE_ID_BY_TIER, stripeClient, type LicenseTier } from "@/lib/billing";
import { handleRouteError, jsonError } from "@/lib/routeUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ tier: z.enum(LICENSE_TIERS) });

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();

    if (!billingConfigured()) {
      return jsonError(503, "Billing is not configured (price IDs pending)");
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError(400, "A valid license tier is required");
    const tier: LicenseTier = parsed.data.tier;

    const origin = request.nextUrl.origin;
    const session = await stripeClient().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRICE_ID_BY_TIER[tier], quantity: 1 }],
      customer_email: auth.user.email ?? undefined,
      metadata: { user_id: auth.user.id, tier },
      subscription_data: { metadata: { user_id: auth.user.id, tier } },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleRouteError(error);
  }
}
