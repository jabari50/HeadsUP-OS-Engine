/* GET /api/roster/[programId] — roster state + gaps for operators. */

import { NextRequest, NextResponse } from "next/server";

import { getOperator, requireAuth } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/routeUtils";
import { serviceClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { programId: string } }) {
  try {
    const auth = await requireAuth();
    const operator = await getOperator(auth.user.id);
    if (!operator && auth.role !== "System_Admin") {
      return jsonError(403, "Operator access required");
    }

    const db = serviceClient();
    const [programRes, rosterRes, gapsRes] = await Promise.all([
      db.from("programs").select("*").eq("id", params.programId).maybeSingle(),
      db
        .from("program_roster")
        .select("athlete_id, added_at, athletes(id, name, position, class_year, ovr, tier)")
        .eq("program_id", params.programId),
      db.from("roster_gaps").select("*").eq("program_id", params.programId).order("priority"),
    ]);
    if (!programRes.data) return jsonError(404, "Program not found");

    return NextResponse.json({
      program: programRes.data,
      roster: rosterRes.data ?? [],
      gaps: gapsRes.data ?? [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
