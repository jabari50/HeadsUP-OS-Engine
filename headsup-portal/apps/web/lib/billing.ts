/* Stripe server plumbing (Gate 6).
   Price IDs are whitelisted HERE, server-side — the client only ever names a
   tier. Real price IDs are [NEEDS INPUT] from Jabari; until the placeholders
   are replaced, checkout returns 503 rather than guessing. */

import Stripe from "stripe";

import { serverEnv } from "./env";

if (typeof window !== "undefined") {
  throw new Error("billing.ts was imported in a browser bundle — Gate 3 violation.");
}

let cached: Stripe | null = null;

export function stripeClient(): Stripe {
  if (!cached) cached = new Stripe(serverEnv.stripeSecretKey);
  return cached;
}

export const LICENSE_TIERS = ["Scout", "Coordinator", "GM", "White Label"] as const;
export type LicenseTier = (typeof LICENSE_TIERS)[number];

/* [NEEDS INPUT] Replace with live Stripe price IDs before launch. */
export const PRICE_ID_BY_TIER: Record<LicenseTier, string> = {
  Scout: "_YOUR_STRIPE_PRICE_ID_SCOUT_HERE",
  Coordinator: "_YOUR_STRIPE_PRICE_ID_COORDINATOR_HERE",
  GM: "_YOUR_STRIPE_PRICE_ID_GM_HERE",
  "White Label": "_YOUR_STRIPE_PRICE_ID_WHITE_LABEL_HERE",
};

/* v1 default credit grants per tier — pricing/credits are [NEEDS INPUT]. */
export const CREDITS_BY_TIER: Record<LicenseTier, number> = {
  Scout: 0,
  Coordinator: 5,
  GM: 10,
  "White Label": 25,
};

export function tierForPriceId(priceId: string): LicenseTier | null {
  const entry = Object.entries(PRICE_ID_BY_TIER).find(([, id]) => id === priceId);
  return (entry?.[0] as LicenseTier) ?? null;
}

export function billingConfigured(): boolean {
  return Object.values(PRICE_ID_BY_TIER).every((id) => !id.startsWith("_YOUR_"));
}
