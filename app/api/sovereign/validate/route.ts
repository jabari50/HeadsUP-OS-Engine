/**
 * GET /api/sovereign/validate
 * Runs all 8 architecture checkpoints + Mike Boone validation vector.
 * Returns a full pass/fail report.
 *
 * Auth: X-Scraper-Secret header (System_Admin only — never expose to public).
 * Must pass before any deploy step per SOVEREIGN_Claude_Code_Primer.md.
 */

import { NextRequest, NextResponse } from "next/server";
import { runAllCheckpoints } from "@/lib/sovereign/validation/checkpoints";
import { runBoonevVector } from "@/lib/sovereign/validation/mike-boone";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-scraper-secret") ?? "";
  if (!process.env.HU_CIRCUIT_SCRAPER_SECRET || secret !== process.env.HU_CIRCUIT_SCRAPER_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  const [checkpoints, boone] = await Promise.all([
    runAllCheckpoints(),
    runBoonevVector(),
  ]);

  const elapsed = Date.now() - t0;
  const checkpointsPassed = checkpoints.filter((c) => c.pass).length;
  const checkpointsFailed = checkpoints.filter((c) => !c.pass).length;
  const allPass = checkpointsFailed === 0 && boone.pass;

  const report = {
    sovereign_version: "1.0.0",
    validation_schema: "arch-spec-v1.0.0",
    started_at: startedAt,
    elapsed_ms: elapsed,
    overall: allPass ? "PASS" : "FAIL",
    summary: {
      checkpoints_total: checkpoints.length,
      checkpoints_passed: checkpointsPassed,
      checkpoints_failed: checkpointsFailed,
      boone_vector: boone.pass ? "PASS" : "FAIL",
    },
    checkpoints: checkpoints.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.pass ? "PASS" : "FAIL",
      message: c.message,
      ...(c.detail ? { detail: c.detail } : {}),
    })),
    boone_vector: {
      status: boone.pass ? "PASS" : "FAIL",
      athlete_id: boone.athleteId,
      summary: boone.summary,
      checks: boone.checks.map((c) => ({
        field: c.field,
        expected: c.expected,
        actual: c.actual,
        status: c.pass ? "PASS" : "FAIL",
      })),
    },
    deploy_gate: allPass
      ? "CLEAR — all validation checkpoints passed. Safe to deploy."
      : `BLOCKED — ${checkpointsFailed} checkpoint(s) failed + Boone vector: ${boone.pass ? "PASS" : "FAIL"}. Fix before deploying.`,
  };

  return NextResponse.json(report, { status: allPass ? 200 : 422 });
}
