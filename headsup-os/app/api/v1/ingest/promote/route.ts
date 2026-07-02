// ============================================================================
// app/api/v1/ingest/promote/route.ts
// HU-OS v4.0.0 | Staging Promotion Endpoint
// ----------------------------------------------------------------------------
// Auth:   Supabase session required; role must be System_Admin (app_metadata).
// Action: Calls promote_staging_record() for every unpromoted staging row.
//         Each promotion: dedup-merge into athletes → re-key CIR → seed
//         activation-locked VirtualGM pool row.
// Scores: never touched here — promotion moves identity + Neck Down only.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.SUPABASE_ANON_KEY!;

const PROMOTE_BATCH_LIMIT = 250;

async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // app_metadata is server-controlled — user_metadata is NEVER acceptable here
  const role = (data.user.app_metadata as Record<string, unknown>)?.role;
  if (role !== "System_Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Optional filter: promote a single pipeline run only
  let pipelineId: string | null = null;
  try {
    const body = await req.json();
    pipelineId = typeof body?.pipeline_id === "string" ? body.pipeline_id : null;
  } catch {
    /* empty body is fine — promote all unpromoted */
  }

  let query = supabaseAdmin
    .from("ingestion_staging")
    .select("id, full_name, ingest_mode")
    .eq("promoted", false)
    .limit(PROMOTE_BATCH_LIMIT);
  if (pipelineId) query = query.eq("pipeline_id", pipelineId);

  const { data: pending, error: listError } = await query;
  if (listError) {
    return NextResponse.json(
      { error: "Failed to list staging rows", detail: listError.message },
      { status: 500 },
    );
  }
  if (!pending || pending.length === 0) {
    return NextResponse.json({ status: "NOTHING_TO_PROMOTE", promoted: 0 });
  }

  const results = {
    promoted: 0,
    manual_review: [] as Array<{ full_name: string; reason: string }>,
    errors: [] as Array<{ full_name: string; detail: string }>,
  };

  // Sequential promotion — each row is an independent transaction inside the
  // SECURITY DEFINER function; one failure never blocks the rest of the batch.
  for (const row of pending) {
    const { error: rpcError } = await supabaseAdmin.rpc(
      "promote_staging_record",
      { p_staging_id: row.id },
    );
    if (rpcError) {
      if (rpcError.message.includes("update_only")) {
        results.manual_review.push({
          full_name: row.full_name,
          reason: "update_only record with no existing athlete row",
        });
      } else {
        results.errors.push({ full_name: row.full_name, detail: rpcError.message });
      }
    } else {
      results.promoted += 1;
    }
  }

  return NextResponse.json({
    status: results.errors.length === 0 ? "PROMOTED" : "PROMOTED_WITH_ERRORS",
    total_pending: pending.length,
    ...results,
    engine_version: "4.0.0",
  });
}
