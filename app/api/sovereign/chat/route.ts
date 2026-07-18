/**
 * POST /api/sovereign/chat
 * SOVEREIGN HU-OS Super Agent — primary advisory endpoint.
 *
 * Request body:
 *   query            string         — user's question or document content
 *   role             UserRole       — RBAC role (Athlete | Parent | Coach | ...)
 *   conversation_id? string         — optional thread ID for multi-turn context
 *   history?         Message[]      — prior turns [{ role, content }]
 *   athlete_context? SovereignContext fields (athleteName, proScore, etc.)
 *
 * Response (Tier 1):
 *   response, tier, confidence, escalation_required, tokens_used
 *
 * Response (Tier 2):
 *   tier: 2, escalation_required: true, escalation_id, confidence
 *   response: null — draft is held in sovereign_escalation_queue pending Jabari review
 *
 * Security: HU_LLM_API_KEY is server-side only — never NEXT_PUBLIC_.
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { buildSovereignSystemPrompt, type UserRole, type SovereignContext } from "@/lib/sovereign/system-prompt";
import { classifyQuery, classifyResponse } from "@/lib/sovereign/tier-classifier";
import { logAndEscalate } from "@/lib/sovereign/escalation";

const VALID_ROLES: UserRole[] = [
  "Athlete", "Parent", "College_Scout", "Coach",
  "Partner", "Investor", "NDA_Analyst", "System_Admin",
];

function extractConfidenceBand(text: string): string {
  const match = text.match(/\[CONFIDENCE:\s*(HIGH|MEDIUM|LOW)\]/i);
  return match ? match[1].toUpperCase() : "MEDIUM";
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.query || typeof body.query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const query: string = body.query.trim();
  const role: UserRole = VALID_ROLES.includes(body.role) ? body.role : "Athlete";
  const conversationId: string | undefined = body.conversation_id;
  const history: ConversationMessage[] = Array.isArray(body.history) ? body.history : [];

  const athleteCtx: SovereignContext = {
    userRole: role,
    athleteName: body.athlete_context?.athleteName,
    proScore: body.athlete_context?.proScore,
    ner: body.athlete_context?.ner,
    ovr: body.athlete_context?.ovr,
    deficiencyFlags: body.athlete_context?.deficiencyFlags,
    activeQuests: body.athlete_context?.activeQuests,
    portalEvent: body.athlete_context?.portalEvent ?? false,
    documentType: body.athlete_context?.documentType,
  };

  // Pre-LLM tier classification
  const preClassification = classifyQuery(query, role, athleteCtx);

  const systemPrompt = buildSovereignSystemPrompt(athleteCtx);

  const messages: ConversationMessage[] = [
    ...history.slice(-10),
    { role: "user", content: query },
  ];

  const client = new Anthropic({ apiKey: process.env.HU_LLM_API_KEY });

  const completion = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  const responseText =
    completion.content[0].type === "text" ? completion.content[0].text : "";

  // Post-LLM tier check — catches agent self-escalation
  const finalClassification = classifyResponse(responseText, preClassification);
  const confidence = extractConfidenceBand(responseText);

  // Audit log + escalation queue write (non-blocking — fire and forget errors to console)
  let escalationId: string | undefined;
  try {
    const result = await logAndEscalate({
      athleteId: body.athlete_context?.athleteId,
      conversationId,
      userRole: role,
      query,
      responseText,
      classification: finalClassification,
      confidenceBand: confidence,
    });
    escalationId = result.escalationId;
  } catch (err) {
    console.error("[SOVEREIGN] audit/escalation write failed:", err);
  }

  // Tier 2 — withhold response; draft is in the queue
  if (finalClassification.tier === 2) {
    return NextResponse.json({
      response: null,
      tier: 2,
      confidence,
      escalation_required: true,
      escalation_id: escalationId,
      tier_reason: finalClassification.reason,
      risk_flags: finalClassification.riskFlags,
      message:
        "This query requires Jabari Johnson's review before delivery. " +
        "Your request has been queued and will be addressed shortly.",
      tokens_used: completion.usage,
    });
  }

  return NextResponse.json({
    response: responseText,
    tier: 1,
    confidence,
    escalation_required: false,
    tokens_used: completion.usage,
  });
}
