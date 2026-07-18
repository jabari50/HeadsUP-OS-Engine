/**
 * /api/sovereign/escalation
 * Jabari's review queue for Tier 2 SOVEREIGN drafts.
 *
 * GET  — returns all pending escalations
 * PATCH — approve | reject | modify a specific escalation
 *
 * All routes require SUPABASE_SERVICE_ROLE_KEY (server-side).
 * In production: gate with session/JWT check confirming System_Admin role.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getPendingEscalations,
  approveEscalation,
  rejectEscalation,
  modifyEscalation,
} from "@/lib/sovereign/escalation";

export async function GET() {
  const escalations = await getPendingEscalations();
  return NextResponse.json({ escalations, count: escalations.length });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.id || !body?.action) {
    return NextResponse.json(
      { error: "id and action are required" },
      { status: 400 }
    );
  }

  const { id, action, jabari_notes, final_response } = body;

  if (!["approve", "reject", "modify"].includes(action)) {
    return NextResponse.json(
      { error: "action must be approve | reject | modify" },
      { status: 400 }
    );
  }

  if (action === "reject" && !jabari_notes) {
    return NextResponse.json(
      { error: "jabari_notes required when rejecting" },
      { status: 400 }
    );
  }

  if (action === "modify" && !final_response) {
    return NextResponse.json(
      { error: "final_response required when modifying" },
      { status: 400 }
    );
  }

  if (action === "approve") {
    await approveEscalation(id, jabari_notes);
  } else if (action === "reject") {
    await rejectEscalation(id, jabari_notes);
  } else {
    await modifyEscalation(id, final_response, jabari_notes);
  }

  return NextResponse.json({ success: true, id, action });
}
