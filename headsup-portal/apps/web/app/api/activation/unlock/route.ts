/* POST /api/activation/unlock — consume one credit, unlock one profile.
   The entire spend+unlock is ONE row-locked RPC (U8): concurrent clicks can
   never double-spend or double-unlock. */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getOperator, requireAuth } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/routeUtils";
import { serviceClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNLOCK_TIERS = ["GM", "White Label"];

const bodySchema = z.object({
  athlete_id: z.string().uuid(),
  state: z.enum(["Preview Unlocked", "Full Unlocked", "Exclusive Lock"]),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const operator = await getOperator(auth.user.id);
    const licensed =
      operator && (auth.role === "System_Admin" ||
        (operator.license_tier && UNLOCK_TIERS.includes(operator.license_tier)));
    if (!operator || !licensed) {
      return jsonError(403, "Activation unlock requires a GM license");
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError(400, "athlete_id and a valid unlock state required");

    const { data: unlocked, error } = await serviceClient().rpc("consume_activation_credit", {
      p_operator: operator.id,
      p_athlete: parsed.data.athlete_id,
      p_state: parsed.data.state,
    });
    if (error) return jsonError(500, `Unlock failed: ${error.message}`);
    if (!unlocked) return jsonError(402, "No activation credits remaining");

    return NextResponse.json({
      unlocked: true,
      state: parsed.data.state,
      credits_remaining: Math.max(0, operator.activation_credits - 1),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
