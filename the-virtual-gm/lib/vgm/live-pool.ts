"use client";

/* Live verified-athlete pool — replaces the demo mock data on the GM
   front-office screens with the real HU-OS Supabase pool (RLS-scoped to the
   logged-in operator). OVR + Neck Up attribute scores are REAL engine output;
   the relational Fit Score / comps (Coach DNA x athlete) are matchmaking IP and
   are NOT fabricated here — Fit defaults to OVR until that engine is wired. */

import React from "react";
import { createClient } from "@/lib/supabase/client";
import type { Player, Recommendation } from "@/lib/vgm/data";

const POOL_COLS =
  "id, full_name, position, graduation_year, school, gpa, ovr, market_position, confidence_band, secondary_tags, neck_up_pro_score, neck_up_culture_equity, neck_up_resilience, neck_up_coachability, neck_up_ner, neck_up_playmaking, neck_up_defense, neck_up_physical_output";

export interface NeckUpRow {
  label: string;
  value: number; // 0–10 (raw 0–100 score / 10)
}

export interface LivePlayer extends Player {
  neckUp: NeckUpRow[];
  rated: boolean; // has a real OVR from the engine (vs. awaiting evaluation)
}

const num = (v: unknown): number => (v == null ? 0 : Number(v));
// Neck Up scores are stored 0–100; scale to a 0–10 bar value.
const to10 = (v: unknown): number =>
  Math.max(0, Math.min(10, Math.round(num(v)) / 10));

// Transparent OVR-band tiering for the board filters — NOT the proprietary
// matchmaking recommendation (which needs Coach DNA).
function recFromOvr(ovr: number): Recommendation {
  if (ovr >= 80) return "PURSUE";
  if (ovr >= 72) return "MONITOR";
  if (ovr >= 64) return "EVALUATE";
  return "PASS";
}

export function mapAthleteToPlayer(r: Record<string, unknown>): LivePlayer {
  const ovr = Math.round(num(r.ovr));
  const tags: string[] = Array.isArray(r.secondary_tags)
    ? (r.secondary_tags as unknown[]).filter(Boolean).map(String)
    : [];
  const neckUp: NeckUpRow[] = [
    { label: "PRO Score", value: to10(r.neck_up_pro_score) },
    { label: "Culture Equity", value: to10(r.neck_up_culture_equity) },
    { label: "Resilience", value: to10(r.neck_up_resilience) },
    { label: "Coachability", value: to10(r.neck_up_coachability) },
    { label: "NER", value: to10(r.neck_up_ner) },
    { label: "Playmaking", value: to10(r.neck_up_playmaking) },
    { label: "Defense", value: to10(r.neck_up_defense) },
    { label: "Physical Output", value: to10(r.neck_up_physical_output) },
  ];
  const d = neckUp.map((n) => n.value);
  return {
    id: String(r.id),
    name: (r.full_name as string) ?? "Athlete",
    pos: (r.position as string) ?? "—",
    height: "",
    classYear: r.graduation_year ? String(r.graduation_year) : "—",
    school: (r.school as string) ?? "—",
    aau: "",
    gpa: r.gpa != null ? String(r.gpa) : "",
    stats: "",
    archetype: (r.market_position as string) ?? "Prospect",
    tier: (r.confidence_band as string) ?? "Verified",
    ovr,
    fit: ovr, // no Coach DNA adjustment yet — Fit shows Overall
    fit5: ovr,
    rec: recFromOvr(ovr),
    compShort: tags.slice(0, 3).join(" · ") || "—",
    dims: {
      style: d[0], need: d[1], level: d[2], cultural: d[3],
      compOutcome: d[4], archetype: d[5], pattern: d[6], market: d[7],
    },
    rationale: "",
    neckUp,
    rated: num(r.ovr) > 0,
  };
}

type PoolState = { players: LivePlayer[] | null; error: string | null };

export function useLivePool(): PoolState & { loading: boolean } {
  const [state, setState] = React.useState<PoolState>({ players: null, error: null });
  React.useEffect(() => {
    let active = true;
    createClient()
      .from("athletes")
      .select(POOL_COLS)
      .eq("sovereign_verified", true)
      .order("ovr", { ascending: false, nullsFirst: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setState({ players: null, error: error.message });
        else
          setState({
            players: (data ?? []).map((r) =>
              mapAthleteToPlayer(r as Record<string, unknown>)
            ),
            error: null,
          });
      });
    return () => { active = false; };
  }, []);
  return { ...state, loading: state.players === null && !state.error };
}

export function useLivePlayer(id: string): {
  player: LivePlayer | null;
  loading: boolean;
  error: string | null;
} {
  const [player, setPlayer] = React.useState<LivePlayer | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    createClient()
      .from("athletes")
      .select(POOL_COLS)
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setPlayer(data ? mapAthleteToPlayer(data as Record<string, unknown>) : null);
        setLoading(false);
      });
    return () => { active = false; };
  }, [id]);
  return { player, loading, error };
}
