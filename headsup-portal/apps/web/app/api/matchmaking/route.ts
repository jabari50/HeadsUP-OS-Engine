/* POST /api/matchmaking — athlete ↔ program Fit Score.
   Subscores derive deterministically here (lib/vgm); the LOCKED weighted
   combination runs in the engine; the result upserts through the service
   role (the only context the fit_score gate admits). */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getOperator, requireAuth } from "@/lib/auth";
import { engineFetch } from "@/lib/engineClient";
import { handleRouteError, jsonError } from "@/lib/routeUtils";
import { serviceClient } from "@/lib/supabaseServer";
import { deriveSubscores } from "@/lib/vgm";
import type { AthleteRow, ProgramRow, RosterGapRow } from "@/types/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  athlete_id: z.string().uuid(),
  program_id: z.string().uuid(),
});

const MATCHMAKING_TIERS = ["GM", "Coordinator", "White Label"];

interface EngineMatchResponse {
  status: string;
  fit_score: number;
  recommendation: "Pursue" | "Monitor" | "Pass";
  subscores: Record<string, number>;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const operator = await getOperator(auth.user.id);
    const licensed =
      auth.role === "System_Admin" ||
      (operator?.license_tier && MATCHMAKING_TIERS.includes(operator.license_tier));
    if (!licensed) return jsonError(403, "Matchmaking requires a GM or Coordinator license");

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError(400, "athlete_id and program_id (uuid) required");

    const db = serviceClient();
    const [athleteRes, programRes, gapsRes] = await Promise.all([
      db.from("athletes").select("*").eq("id", parsed.data.athlete_id).maybeSingle(),
      db.from("programs").select("*").eq("id", parsed.data.program_id).maybeSingle(),
      db.from("roster_gaps").select("*").eq("program_id", parsed.data.program_id),
    ]);
    if (!athleteRes.data) return jsonError(404, "Athlete not found");
    if (!programRes.data) return jsonError(404, "Program not found");

    const subscores = deriveSubscores(
      athleteRes.data as AthleteRow,
      programRes.data as ProgramRow,
      (gapsRes.data ?? []) as RosterGapRow[]
    );

    const engine = await engineFetch<EngineMatchResponse>("/v4/matchmake", subscores);

    const { error: upsertError } = await db.from("matches").upsert(
      {
        athlete_id: parsed.data.athlete_id,
        program_id: parsed.data.program_id,
        fit_score: engine.fit_score,
        style_fit: subscores.style_fit,
        need_fit: subscores.need_fit,
        level_fit: subscores.level_fit,
        cultural_fit: subscores.cultural_fit,
        recommendation: engine.recommendation,
      },
      { onConflict: "athlete_id,program_id" }
    );
    if (upsertError) return jsonError(500, `Match write failed: ${upsertError.message}`);

    return NextResponse.json({
      fit_score: engine.fit_score,
      recommendation: engine.recommendation,
      subscores,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
