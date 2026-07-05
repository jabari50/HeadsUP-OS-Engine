/* POST /api/score/run — System_Admin re-scores an athlete from stored inputs.
   Inputs must exist in full; nothing is fabricated for missing fields. */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { engineFetch } from "@/lib/engineClient";
import { handleRouteError, jsonError } from "@/lib/routeUtils";
import { serviceClient } from "@/lib/supabaseServer";
import type { AthleteRow } from "@/types/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ athlete_id: z.string().uuid() });

interface EngineScoreResponse {
  status: string;
  computed?: { ovr: number; tier: string };
  badges?: unknown[];
  quests?: unknown[];
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("System_Admin");

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError(400, "athlete_id (uuid) required");

    const db = serviceClient();
    const { data, error } = await db
      .from("athletes")
      .select("*")
      .eq("id", parsed.data.athlete_id)
      .maybeSingle();
    if (error || !data) return jsonError(404, "Athlete not found");
    const athlete = data as AthleteRow;

    const technical = {
      ball_handling: athlete.tech_ball_handling,
      shooting: athlete.tech_shooting,
      finishing: athlete.tech_finishing,
      passing: athlete.tech_passing,
      defense: athlete.tech_defense,
      rebounding: athlete.tech_rebounding,
      athleticism: athlete.tech_athleticism,
    };
    const neural = {
      composure: athlete.neural_composure,
      coachability: athlete.neural_coachability,
      iq: athlete.neural_iq,
      resilience: athlete.neural_resilience,
      leadership: athlete.neural_leadership,
      drive: athlete.neural_drive,
    };
    const missing = [
      ...Object.entries(technical).filter(([, v]) => v == null).map(([k]) => `technical.${k}`),
      ...Object.entries(neural).filter(([, v]) => v == null).map(([k]) => `neural.${k}`),
      ...(athlete.physical_score == null ? ["physical_score"] : []),
    ];
    if (missing.length > 0) {
      return jsonError(409, `Cannot score: missing inputs (${missing.join(", ")})`);
    }

    const engine = await engineFetch<EngineScoreResponse>("/v4/score", {
      technical,
      neural,
      physical_score: athlete.physical_score,
    });
    if (!engine.computed) return jsonError(502, "Engine returned no computed scores");

    // process_intake with a null session = score-write + audit append in one
    // transaction, matched to the existing athlete by external_id/natural key.
    const { data: athleteId, error: rpcError } = await db.rpc("process_intake", {
      p_session: null,
      p_actor: auth.user.id,
      p_canonical: {
        external_id: athlete.external_id,
        name: athlete.name,
        school: athlete.school,
        class_year: athlete.class_year,
      },
      p_computed: engine.computed,
      p_badges: engine.badges ?? [],
      p_quests: engine.quests ?? [],
    });
    if (rpcError) return jsonError(500, `Re-score failed: ${rpcError.message}`);

    return NextResponse.json({ athlete_id: athleteId, computed: engine.computed });
  } catch (error) {
    return handleRouteError(error);
  }
}
