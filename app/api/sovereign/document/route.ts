/**
 * POST /api/sovereign/document
 * Accepts a document upload (PDF, DOCX, JSON) for SOVEREIGN review.
 * Always Tier 2 for NIL_CONTRACT, LOI, PARTNERSHIP_AGREEMENT.
 *
 * Multipart form fields:
 *   file         File    — the document to review (PDF / DOCX / JSON)
 *   role         string  — UserRole
 *   athlete_id?  string  — Supabase UUID (optional context)
 *   output?      string  — "pdf" | "docx" | "json" (default: "json")
 *
 * Response (json output):  EscalationMemo JSON + base64 advisory files
 * Response (pdf output):   application/pdf stream
 * Response (docx output):  application/vnd.openxmlformats... stream
 *
 * Security: server-side only. File bytes never logged or persisted.
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/lib/sovereign/document/reader";
import { generateAdvisoryPdf } from "@/lib/sovereign/document/pdf-writer";
import { generateAdvisoryDocx } from "@/lib/sovereign/document/docx-writer";
import { buildEscalationMemo } from "@/lib/sovereign/document/memo";
import { buildSovereignSystemPrompt, type UserRole } from "@/lib/sovereign/system-prompt";
import { classifyQuery } from "@/lib/sovereign/tier-classifier";
import { logAndEscalate } from "@/lib/sovereign/escalation";
import { getAthleteForSovereign } from "@/lib/sovereign/data/athletes";

const VALID_ROLES: UserRole[] = [
  "Athlete", "Parent", "College_Scout", "Coach",
  "Partner", "Investor", "NDA_Analyst", "System_Admin",
];

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function extractConfidenceBand(text: string): string {
  const match = text.match(/\[CONFIDENCE:\s*(HIGH|MEDIUM|LOW)\]/i);
  return match ? match[1].toUpperCase() : "MEDIUM";
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "multipart/form-data required" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const roleRaw = formData.get("role") as string | null;
  const athleteId = (formData.get("athlete_id") as string | null) ?? undefined;
  const outputFormat = ((formData.get("output") as string | null) ?? "json").toLowerCase();

  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
  }

  const role: UserRole = VALID_ROLES.includes(roleRaw as UserRole) ? (roleRaw as UserRole) : "Athlete";

  // Parse document
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parseDocument(buffer, file.name, file.type);

  if (!parsed.textContent) {
    return NextResponse.json(
      { error: "Document could not be read", warnings: parsed.parseWarnings },
      { status: 422 }
    );
  }

  // Fetch athlete context if provided
  let athleteProfile = null;
  if (athleteId) {
    athleteProfile = await getAthleteForSovereign(athleteId, role);
  }

  // Classify — documents auto-Tier 2 for NIL_CONTRACT, LOI, PARTNERSHIP_AGREEMENT
  const classification = classifyQuery(
    `Document review: ${parsed.documentType} — ${file.name}`,
    role,
    {
      userRole: role,
      documentType: parsed.documentType,
      athleteName: athleteProfile?.fullName,
    }
  );

  const systemPrompt = buildSovereignSystemPrompt({
    userRole: role,
    athleteName: athleteProfile?.fullName,
    proScore: athleteProfile?.proScore ?? undefined,
    ner: athleteProfile?.ner ?? undefined,
    ovr: athleteProfile?.ovr ?? undefined,
    deficiencyFlags: undefined,
    documentType: parsed.documentType,
  });

  const userPrompt = [
    `Document submitted for SOVEREIGN review.`,
    `File: ${file.name}`,
    `Type: ${parsed.documentType}`,
    `Pages: ${parsed.pageCount ?? "unknown"}`,
    parsed.parseWarnings.length ? `Parse warnings: ${parsed.parseWarnings.join("; ")}` : "",
    ``,
    `--- DOCUMENT CONTENT ---`,
    parsed.textContent.slice(0, 24000), // Cap at ~24k chars to stay within token budget
    parsed.textContent.length > 24000 ? "\n[Document truncated — review full file for complete analysis]" : "",
    `--- END DOCUMENT ---`,
    ``,
    `Perform a full SOVEREIGN review: identify risk language, flag key clauses, provide market context, and produce a structured advisory output. Include confidence band.`,
  ]
    .filter(Boolean)
    .join("\n");

  const client = new Anthropic({ apiKey: process.env.HU_LLM_API_KEY });
  const completion = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseText =
    completion.content[0].type === "text" ? completion.content[0].text : "";
  const confidence = extractConfidenceBand(responseText);

  // Log + queue
  let escalationId: string | undefined;
  let auditLogId: string | undefined;
  try {
    const result = await logAndEscalate({
      athleteId,
      userRole: role,
      query: `Document review: ${file.name} (${parsed.documentType})`,
      responseText,
      classification,
      confidenceBand: confidence,
    });
    escalationId = result.escalationId;
    auditLogId = result.auditLogId;
  } catch (err) {
    console.error("[SOVEREIGN] document audit write failed:", err);
  }

  const briefInput = {
    title: `SOVEREIGN Advisory Brief — ${file.name}`,
    athleteName: athleteProfile?.fullName,
    userRole: role,
    advisoryText: responseText,
    confidenceBand: confidence,
    tierReason: classification.reason,
    riskFlags: classification.riskFlags,
    escalationId,
    generatedAt: new Date().toISOString().split("T")[0],
  };

  // PDF output
  if (outputFormat === "pdf") {
    const pdfBuffer = await generateAdvisoryPdf(briefInput);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="sovereign-brief-${Date.now()}.pdf"`,
      },
    });
  }

  // DOCX output
  if (outputFormat === "docx") {
    const docxBuffer = await generateAdvisoryDocx(briefInput);
    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="sovereign-draft-${Date.now()}.docx"`,
      },
    });
  }

  // JSON output (default)
  const memo = buildEscalationMemo({
    escalationId: escalationId ?? null,
    auditLogId: auditLogId ?? null,
    userRole: role,
    athleteId,
    athleteName: athleteProfile?.fullName,
    tierReason: classification.reason,
    riskFlags: classification.riskFlags,
    confidenceBand: confidence,
    draftResponse: responseText,
    document: {
      fileName: file.name,
      documentType: parsed.documentType,
      pageCount: parsed.pageCount,
      characterCount: parsed.characterCount,
      parseWarnings: parsed.parseWarnings,
    },
  });

  return NextResponse.json({
    tier: classification.tier,
    escalation_required: classification.tier === 2,
    escalation_id: escalationId ?? null,
    confidence,
    memo,
    tokens_used: completion.usage,
  });
}
