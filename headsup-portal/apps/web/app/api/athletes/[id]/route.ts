/* GET /api/athletes/[id] — Activation-gated profile (Gate 8).
   Field shaping happens HERE, server-side, per role + activation state.
   No select * ever reaches a non-admin caller. */

import { NextRequest, NextResponse } from "next/server";

import { resolveActivation, shapeAthlete } from "@/lib/activation";
import { getOperator, requireAuth } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/routeUtils";
import { serviceClient } from "@/lib/supabaseServer";
import type { AthleteRow } from "@/types/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth();

    if (auth.role === "NDA_Analyst") {
      // NDA analysts get aggregate analytics views only — never raw profiles.
      return jsonError(403, "Analytics-only role");
    }

    const { data, error } = await serviceClient()
      .from("athletes")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (error || !data) return jsonError(404, "Athlete not found");
    const athlete = data as AthleteRow;

    const isSelf = athlete.user_id === auth.user.id;

    if (auth.role === "College_Scout" && !athlete.sovereign_verified && !isSelf) {
      // Scouts only ever learn about sovereign-verified athletes.
      return jsonError(404, "Athlete not found");
    }
    if (auth.role === "Athlete" && !isSelf) {
      return jsonError(403, "Athletes may only view their own profile");
    }

    const operator = await getOperator(auth.user.id);
    const activation = await resolveActivation(athlete.id, operator?.id ?? null);
    const shaped = shapeAthlete(athlete, auth.role, activation, isSelf);

    return NextResponse.json({ athlete: shaped, activation });
  } catch (error) {
    return handleRouteError(error);
  }
}
