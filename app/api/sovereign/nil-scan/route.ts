/**
 * POST /api/sovereign/nil-scan
 *
 * Next.js proxy route for the SOVEREIGN NIL Contract Risk Scanner.
 * Accepts a multipart form from the browser, verifies RBAC, forwards the
 * PDF to the Python engine's /api/v1/sovereign/nil-scan endpoint, and
 * returns the structured JSON risk report.
 *
 * SOVEREIGN hard constraints enforced here:
 *   • RBAC: superagent_unlocked required for non-privileged roles
 *   • File type: PDF only, 20 MB cap (matches engine limit)
 *   • HU_LLM_API_KEY and SUPABASE_SERVICE_ROLE_KEY never exposed to browser
 *   • All contract reviews are Tier 2 — no auto-approve path
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Roles that may access nil-scan without superagent_unlocked
const PRIVILEGED_ROLES = new Set(["NDA_Analyst", "System_Admin", "Coach"]);

// 20 MB — matches the Python engine hard cap
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Env guards ────────────────────────────────────────────────────────────
  const engineUrl    = process.env.FASTAPI_URL ?? "http://localhost:8000";
  const scraperSecret = process.env.HU_CIRCUIT_SCRAPER_SECRET;

  if (!scraperSecret) {
    return NextResponse.json(
      { error: "HU_CIRCUIT_SCRAPER_SECRET is not configured." },
      { status: 500 }
    );
  }

  // ── Parse multipart form ──────────────────────────────────────────────────
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form." }, { status: 400 });
  }

  const athleteId    = form.get("athlete_id") as string | null;
  const role         = (form.get("role") as string | null) ?? "Athlete";
  const contractName = (form.get("contract_name") as string | null) ?? "";
  const file         = form.get("file") as File | null;

  if (!athleteId) {
    return NextResponse.json({ error: "athlete_id is required." }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: "file (PDF) is required." }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
  }

  // ── RBAC: verify athlete exists and check superagent_unlocked ─────────────
  if (!PRIVILEGED_ROLES.has(role)) {
    const { data: athlete, error } = await supabaseAdmin
      .from("athletes")
      .select("id, superagent_unlocked")
      .eq("id", athleteId)
      .single();

    if (error || !athlete) {
      return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
    }
    if (!athlete.superagent_unlocked) {
      return NextResponse.json(
        { error: "AI Superagent is not unlocked for this athlete." },
        { status: 403 }
      );
    }
  }

  // ── Size cap ──────────────────────────────────────────────────────────────
  const fileBytes = await file.arrayBuffer();
  if (fileBytes.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { error: `PDF exceeds the 20 MB size limit (${(fileBytes.byteLength / 1024 / 1024).toFixed(1)} MB received).` },
      { status: 413 }
    );
  }

  // ── Forward to Python engine ──────────────────────────────────────────────
  const upstream = new FormData();
  upstream.append("file", new Blob([fileBytes], { type: "application/pdf" }), file.name);
  upstream.append("athlete_id",    athleteId);
  upstream.append("role",          role);
  upstream.append("contract_name", contractName || file.name);

  let engineRes: Response;
  try {
    engineRes = await fetch(`${engineUrl}/api/v1/sovereign/nil-scan`, {
      method:  "POST",
      headers: { "X-Scraper-Secret": scraperSecret },
      body:    upstream,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[nil-scan] Engine unreachable:", msg);
    return NextResponse.json(
      { error: `HU-OS Engine unreachable: ${msg}` },
      { status: 502 }
    );
  }

  // ── Relay engine response ─────────────────────────────────────────────────
  const body = await engineRes.json().catch(() => ({ error: "Engine returned non-JSON response." }));

  if (!engineRes.ok) {
    console.error("[nil-scan] Engine error %d:", engineRes.status, body);
    return NextResponse.json(body, { status: engineRes.status });
  }

  return NextResponse.json(body, { status: 200 });
}
