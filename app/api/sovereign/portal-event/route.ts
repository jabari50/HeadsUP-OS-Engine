/**
 * POST /api/sovereign/portal-event
 * Triggered when an athlete enters the transfer portal.
 * Sources: manual admin entry OR VerbalCommits scraper webhook.
 *
 * Runs:
 *  1. VerbalCommits confirmation check
 *  2. Athlete data fetch from Supabase
 *  3. Deficiency report from neural_audit_log
 *  4. SOVEREIGN portal risk assessment (auto Tier 2 → escalation queue)
 *
 * Request body:
 *   athlete_id   string — Supabase UUID
 *   athlete_name string — used for VerbalCommits lookup
 *   source?      string — "verbalcommits" | "manual"
 *
 * Auth: X-Portal-Secret header must match HU_CIRCUIT_SCRAPER_SECRET
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAthleteForSovereign } from "@/lib/sovereign/data/athletes";
import { getDeficiencyReport } from "@/lib/sovereign/data/engine";
import { checkPortalStatus, formatPortalContextForSovereign } from "@/lib/sovereign/data/portal";
import { buildSovereignSystemPrompt } from "@/lib/sovereign/system-prompt";
import { logAndEscalate } from "@/lib/sovereign/escalation";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-portal-secret") ?? "";
  if (!process.env.HU_CIRCUIT_SCRAPER_SECRET || secret !== process.env.HU_CIRCUIT_SCRAPER_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.athlete_id || !body?.athlete_name) {
    return NextResponse.json({ error: "athlete_id and athlete_name are required" }, { status: 400 });
  }

  const { athlete_id, athlete_name, source = "manual" } = body as {
    athlete_id: string;
    athlete_name: string;
    source?: string;
  };

  // Run athlete fetch, portal check, and deficiency report in parallel
  const [athlete, deficiencies, portalResult] = await Promise.all([
    getAthleteForSovereign(athlete_id, "System_Admin"),
    getDeficiencyReport(athlete_id),
    checkPortalStatus(athlete_name),
  ]);

  if (!athlete) {
    return NextResponse.json({ error: "athlete not found or not authorized" }, { status: 404 });
  }

  const portalContext = formatPortalContextForSovereign(portalResult, athlete_name);

  const systemPrompt = buildSovereignSystemPrompt({
    userRole: "System_Admin",
    athleteName: athlete.fullName,
    proScore: athlete.proScore ?? undefined,
    ner: athlete.ner ?? undefined,
    ovr: athlete.ovr ?? undefined,
    deficiencyFlags: deficiencies?.deficiencies ?? [],
    activeQuests: athlete.completedQuests ?? [],
    portalEvent: true,
  });

  const userPrompt = [
    `PORTAL EVENT — Generate full risk assessment package for ${athlete.fullName}.`,
    ``,
    portalContext,
    ``,
    `Athlete profile:`,
    `- School: ${athlete.school ?? "unconfirmed"}`,
    `- Position: ${athlete.position ?? "unconfirmed"}`,
    `- Graduation year: ${athlete.graduationYear}`,
    `- PRO-Score: ${athlete.proScore ?? "not available"}`,
    `- NER: ${athlete.ner ?? "not available"}`,
    `- OVR: ${athlete.ovr ?? "not available"}`,
    `- Neural Market Position: ${athlete.marketPosition ?? "not available"}`,
    `- Confidence Band: ${athlete.confidenceBand ?? "not available"}`,
    `- GPA: ${athlete.gpa ?? "not available"}`,
    `- NIL Score: ${athlete.nilScore ?? "not available"}`,
    `- Injury status: ${athlete.injuryStatus ? `Yes — ${athlete.injuryNotes ?? "see records"}` : "No"}`,
    `- Deficiency flags: ${deficiencies?.deficiencies.length ? deficiencies.deficiencies.join(", ") : "none"}`,
    `- Placement interest: ${athlete.placementInterest ?? "not specified"}`,
    ``,
    `Produce: PRO-Score summary, Neural Market Position, NIL valuation estimate, program fit shortlist (DFW / CIAA / D2 focus), open deficiency flags, active PRO-Quest status, and escalation memo for Jabari.`,
    `Event source: ${source}`,
  ].join("\n");

  const client = new Anthropic({ apiKey: process.env.HU_LLM_API_KEY });
  const completion = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseText =
    completion.content[0].type === "text" ? completion.content[0].text : "";

  // Portal assessments are always Tier 2
  let escalationId: string | undefined;
  try {
    const result = await logAndEscalate({
      athleteId: athlete_id,
      userRole: "System_Admin",
      query: `PORTAL EVENT: ${athlete_name} (source: ${source})`,
      responseText,
      classification: {
        tier: 2,
        reason: "Transfer portal event — auto Tier 2 per autonomy framework",
        riskFlags: ["portal event", `source: ${source}`],
      },
      confidenceBand: "MEDIUM",
    });
    escalationId = result.escalationId;
  } catch (err) {
    console.error("[SOVEREIGN] portal event escalation write failed:", err);
  }

  return NextResponse.json({
    athlete_id,
    athlete_name,
    portal_confirmed: portalResult.found,
    source_reachable: portalResult.sourceReachable,
    assessment: responseText,
    escalation_id: escalationId,
    tier: 2,
    tokens_used: completion.usage,
  });
}
