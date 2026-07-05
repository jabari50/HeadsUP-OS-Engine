/* GET/POST /api/draft-board — ranked prospect queue, scoped to the calling
   operator. Newly processed athletes auto-surface in the queue (§6.2 step 6). */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getOperator, requireAuth } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/routeUtils";
import { serviceClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Scouts see verified-only; operators see the working pool. Card-level
   columns only — full profiles stay behind /api/athletes/[id] gating. */
const BOARD_ATHLETE_COLUMNS = "id, name, position, school, class_year, ovr, tier, sovereign_verified";

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuth();
    const operator = await getOperator(auth.user.id);
    if (!operator && auth.role !== "System_Admin" && auth.role !== "College_Scout") {
      return jsonError(403, "Operator or scout access required");
    }

    const db = serviceClient();

    let queueQuery = db
      .from("athletes")
      .select(BOARD_ATHLETE_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(25);
    if (auth.role === "College_Scout") {
      queueQuery = queueQuery.eq("sovereign_verified", true);
    }
    const { data: queue } = await queueQuery;

    let board: unknown[] = [];
    if (operator) {
      const { data } = await db
        .from("draft_board")
        .select(`id, rank, notes, athletes(${BOARD_ATHLETE_COLUMNS})`)
        .eq("operator_id", operator.id)
        .order("rank", { ascending: true, nullsFirst: false });
      board = data ?? [];
    }

    return NextResponse.json({ board, queue: queue ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}

const postSchema = z.object({
  athlete_id: z.string().uuid(),
  rank: z.number().int().min(1).max(500).optional(),
  notes: z.string().max(2000).optional(),
  action: z.enum(["upsert", "remove"]).default("upsert"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const operator = await getOperator(auth.user.id);
    if (!operator) return jsonError(403, "Operator access required");

    const parsed = postSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError(400, "Invalid draft board request");
    const { athlete_id, rank, notes, action } = parsed.data;

    const db = serviceClient();

    if (action === "remove") {
      await db.from("draft_board").delete().eq("operator_id", operator.id).eq("athlete_id", athlete_id);
      return NextResponse.json({ removed: true });
    }

    const { error } = await db.from("draft_board").upsert(
      { operator_id: operator.id, athlete_id, rank: rank ?? null, notes: notes ?? null },
      { onConflict: "operator_id,athlete_id" }
    );
    if (error) return jsonError(500, `Board write failed: ${error.message}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
