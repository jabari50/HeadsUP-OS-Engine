/**
 * POST /api/oracle/nil-scan
 *
 * HeadsUp OS Oracle — NIL Intelligence Scan
 * Next.js server-side proxy to the Render engine's Oracle NIL endpoint.
 *
 * Execution chain (all server-side):
 *   1. Validate request
 *   2. Proxy to Python engine → run_oracle_nil_scan()
 *      a. CIR gate (check_cir_oracle_clearance via Supabase)
 *      b. Neural Audit (nda_score)
 *      c. PEG matrix (generate_peg_report)
 *      d. Unified Oracle package (format_oracle_output)
 *      e. LLM NIL narrative (Claude claude-sonnet-4-20250514)
 *   3. Return complete Oracle output to client
 *
 * SECURITY:
 *   - HU_ENGINE_URL, HU_ENGINE_API_KEY, SUPABASE_SERVICE_ROLE_KEY
 *     are server-side only — never NEXT_PUBLIC_
 *   - CIR data is NEVER surfaced in the response to any public view
 *   - AIS_EXCLUSION returns suppressed output only — no underlying data
 */

import { NextRequest, NextResponse } from "next/server";

const ENGINE_URL = process.env.HU_ENGINE_URL ?? "";
const ENGINE_KEY = process.env.HU_ENGINE_API_KEY ?? "";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Env guard ──────────────────────────────────────────────────────────────
  if (!ENGINE_URL || !ENGINE_KEY) {
    console.error("[oracle/nil-scan] HU_ENGINE_URL or HU_ENGINE_API_KEY not set.");
    return NextResponse.json(
      { error: "Oracle engine not configured." },
      { status: 500 }
    );
  }

  // ── Parse request body ────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // ── Required field guard ──────────────────────────────────────────────────
  const payload = body as Record<string, unknown>;
  if (!payload?.athlete_id || !payload?.full_name) {
    return NextResponse.json(
      { error: "athlete_id and full_name are required." },
      { status: 400 }
    );
  }

  // ── Forward to Oracle engine ──────────────────────────────────────────────
  let engineRes: Response;
  try {
    engineRes = await fetch(`${ENGINE_URL}/api/v1/oracle/nil-scan`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${ENGINE_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[oracle/nil-scan] Engine unreachable:", msg);
    return NextResponse.json(
      { error: `HeadsUp OS Oracle unreachable: ${msg}` },
      { status: 502 }
    );
  }

  // ── Relay response ────────────────────────────────────────────────────────
  const data = await engineRes.json().catch(() => ({
    error: "Oracle engine returned a non-JSON response.",
  }));

  if (!engineRes.ok) {
    console.error("[oracle/nil-scan] Engine error %d:", engineRes.status, data);
    return NextResponse.json(data, { status: engineRes.status });
  }

  // ── Return Oracle output (CIR internals already stripped by engine) ───────
  return NextResponse.json(
    {
      ...data,
      pre_decision_intel: data.pre_decision_intel ?? null,
      peg_matrix:         data.peg_matrix         ?? null,
    },
    { status: 200 }
  );
}
