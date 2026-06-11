"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export type PortalState = { message: string } | null;

export async function openBillingPortal(): Promise<PortalState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Not signed in." };

  const { data: operator } = await supabase
    .from("operators")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!operator?.stripe_customer_id) {
    return {
      message:
        "No billing account is linked to this operator yet. Contact HeadsUP to activate your license.",
    };
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return { message: "Billing is not configured yet. Check back soon." };
  }

  const stripe = new Stripe(stripeKey);
  const origin = headers().get("origin") ?? "";
  const session = await stripe.billingPortal.sessions.create({
    customer: operator.stripe_customer_id,
    return_url: `${origin}/dashboard/license`,
  });

  redirect(session.url);
}
