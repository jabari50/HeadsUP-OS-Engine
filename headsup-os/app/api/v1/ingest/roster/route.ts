// ============================================================================
// app/api/v1/ingest/roster/route.ts
// HU-OS v4.0.0 | Roster Ingestion Endpoint (server-to-server)
// ----------------------------------------------------------------------------
// Auth:      X-HU-Ingest-Secret header === process.env.HU_INGEST_SECRET
// Writes:    ingestion_staging + cir_raw_intake (service role, server-only)
// Protocol:  Zero Hallucination enforced AT THE BOUNDARY — any payload that
//            carries a non-null score field is rejected wholesale. Scores are
//            born only inside the Neural Audit engine, never via ingestion.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-only env — never NEXT_PUBLIC_
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const INGEST_SECRET = process.env.HU_INGEST_SECRET!;

const VALID_SPORTS = new Set(["basketball", "football", "track"]);
const VALID_STAGES = new Set([
  "identity_only", "gauntlet_entry", "audit_window",
  "full_verification", "unstaged",
]);
const VALID_MODES = new Set(["insert", "update_only"]);

// Fields that MUST be null on every inbound record (Zero Hallucination gate)
const FORBIDDEN_SCORE_FIELDS = [
  "neck_up_pro_score", "neck_up_culture_equity", "neck_up_resilience",
  "neck_up_coachability", "neck_up_ner", "ovr", "market_position",
] as const;

const MAX_BATCH_RECORDS = 200;
const MAX_CIR_KEYS = 40;
const MAX_CIR_TEXT = 2000;

interface InboundAthlete {
  ingest_id: string;
  full_name: string;
  graduation_year: number | null;
  school: string | null;
  position: string | null;
  sport: string;
  location_city: string;
  location_state: string;
  sport_specific_metrics: Record<string, unknown>;
  cir_raw_notes: Record<string, string>;
  contact: Record<string, string>;
  source_file: string;
  ingest_mode: string;
  evaluation_stage: string;
  provisional: boolean;
  engine_version: string;
  algo_version_at_ingest: string;
  [key: string]: unknown;
}

interface InboundBatch {
  pipeline_id: string;
  batch_index: number;
  engine_version: string;
  algo_version: string;
  record_count: number;
  athletes: InboundAthlete[];
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function validateAthlete(a: InboundAthlete, idx: number): string | null {
  if (!a.full_name || a.full_name.trim().split(/\s+/).length < 2)
    return `athletes[${idx}]: full_name must contain first and last name`;
  if (a.graduation_year !== null &&
      (a.graduation_year < 2020 || a.graduation_year > 2032))
    return `athletes[${idx}]: graduation_year out of bounds (2020–2032)`;
  if (!VALID_SPORTS.has(a.sport))
    return `athletes[${idx}]: sport '${a.sport}' not whitelisted`;
  if (!VALID_STAGES.has(a.evaluation_stage))
    return `athletes[${idx}]: evaluation_stage '${a.evaluation_stage}' invalid`;
  if (!VALID_MODES.has(a.ingest_mode))
    return `athletes[${idx}]: ingest_mode '${a.ingest_mode}' invalid`;

  // Zero Hallucination boundary gate — reject any non-null score field
  for (const f of FORBIDDEN_SCORE_FIELDS) {
    if (a[f] !== null && a[f] !== undefined)
      return `athletes[${idx}]: PROTOCOL VIOLATION — '${f}' must be null at ingest (got ${JSON.stringify(a[f])})`;
  }

  // CIR raw notes bounds
  const notes = a.cir_raw_notes ?? {};
  if (Object.keys(notes).length > MAX_CIR_KEYS)
    return `athletes[${idx}]: cir_raw_notes exceeds ${MAX_CIR_KEYS} entries`;
  for (const [k, v] of Object.entries(notes)) {
    if (typeof v !== "string" || v.length > MAX_CIR_TEXT)
      return `athletes[${idx}]: cir_raw_notes['${k.slice(0, 40)}'] invalid or exceeds ${MAX_CIR_TEXT} chars`;
  }

  // Neck Down plausibility (verbatim-derived only, still bounded)
  const m = a.sport_specific_metrics ?? {};
  const h = m["height_inches"];
  if (h !== undefined && (typeof h !== "number" || h < 48 || h > 96))
    return `athletes[${idx}]: height_inches implausible`;
  const w = m["weight_lbs"];
  if (w !== undefined && (typeof w !== "number" || w < 90 || w > 350))
    return `athletes[${idx}]: weight_lbs implausible`;

  return null;
}

export async function POST(req: NextRequest) {
  // ── Gate 1: shared secret (constant-time compare) ─────────────────────────
  const secret = req.headers.get("x-hu-ingest-secret") ?? "";
  if (!INGEST_SECRET || !timingSafeEqual(secret, INGEST_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Gate 2: payload shape ─────────────────────────────────────────────────
  let batch: InboundBatch;
  try {
    batch = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!batch?.pipeline_id || !Array.isArray(batch.athletes)) {
    return NextResponse.json({ error: "Missing pipeline_id or athletes[]" }, { status: 400 });
  }
  if (batch.athletes.length === 0 || batch.athletes.length > MAX_BATCH_RECORDS) {
    return NextResponse.json(
      { error: `athletes[] must contain 1–${MAX_BATCH_RECORDS} records` },
      { status: 400 },
    );
  }
  if (batch.record_count !== batch.athletes.length) {
    return NextResponse.json(
      { error: "record_count does not match athletes[] length" },
      { status: 400 },
    );
  }

  // ── Gate 3: per-record validation (all-or-nothing batch) ─────────────────
  for (let i = 0; i < batch.athletes.length; i++) {
    const err = validateAthlete(batch.athletes[i], i);
    if (err) return NextResponse.json({ error: err }, { status: 422 });
  }

  // ── Write: staging + CIR (service role, server-side only) ────────────────
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const stagingRows = batch.athletes.map((a) => ({
    pipeline_id: batch.pipeline_id,
    batch_index: batch.batch_index,
    full_name: a.full_name.trim(),
    graduation_year: a.graduation_year,
    school: a.school,
    position: a.position,
    sport: a.sport,
    location_city: a.location_city ?? "Dallas",
    location_state: a.location_state ?? "TX",
    sport_specific_metrics: a.sport_specific_metrics ?? {},
    contact: a.contact ?? {},
    evaluation_stage: a.evaluation_stage,
    provisional: a.provisional !== false,
    ingest_mode: a.ingest_mode,
    source_file: a.source_file,
    engine_version: a.engine_version ?? "4.0.0",
    algo_version_at_ingest: a.algo_version_at_ingest ?? "4.1.0",
  }));

  const { data: staged, error: stagingError } = await supabaseAdmin
    .from("ingestion_staging")
    .insert(stagingRows)
    .select("id, full_name");

  if (stagingError) {
    return NextResponse.json(
      { error: "Staging write failed", detail: stagingError.message },
      { status: 500 },
    );
  }

  // CIR raw intake — verbatim, keyed to staging row
  const cirRows: Array<Record<string, unknown>> = [];
  staged!.forEach((row, i) => {
    const notes = batch.athletes[i].cir_raw_notes ?? {};
    for (const [question, response] of Object.entries(notes)) {
      cirRows.push({
        staging_id: row.id,
        question_label: question.slice(0, 120),
        response_verbatim: response,
        source_file: batch.athletes[i].source_file,
        engine_version: "4.0.0",
      });
    }
  });

  let cirInserted = 0;
  if (cirRows.length > 0) {
    const { error: cirError, count } = await supabaseAdmin
      .from("cir_raw_intake")
      .insert(cirRows, { count: "exact" });
    if (cirError) {
      // Staging succeeded; report partial state honestly — do not roll forward
      return NextResponse.json(
        {
          status: "PARTIAL",
          staged: staged!.length,
          cir_error: cirError.message,
          action_required: "Re-run CIR backfill for this batch before promotion",
        },
        { status: 207 },
      );
    }
    cirInserted = count ?? cirRows.length;
  }

  return NextResponse.json({
    status: "STAGED",
    pipeline_id: batch.pipeline_id,
    batch_index: batch.batch_index,
    staged_records: staged!.length,
    cir_notes_written: cirInserted,
    engine_version: "4.0.0",
    algo_version: batch.algo_version ?? "4.1.0",
  });
}
