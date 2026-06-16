import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

// Row from the column-scoped, profile_public-only view (see migration 0006).
// This is the ONLY athlete surface the public profile reads — never the table.
export type PublicAthleteCard =
  Database["public"]["Views"]["public_athlete_cards"]["Row"];

// React-cached so generateMetadata and the page share a single query per request.
export const getPublicAthlete = cache(
  async (slug: string): Promise<PublicAthleteCard | null> => {
    const supabase = createClient();
    const { data } = await supabase
      .from("public_athlete_cards")
      .select("*")
      .eq("profile_slug", slug)
      .maybeSingle();
    return data ?? null;
  }
);

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://the-virtual-gm.vercel.app";

export function fmtScore(n: number | null): string {
  return n == null ? "—" : Math.round(Number(n)).toString();
}
