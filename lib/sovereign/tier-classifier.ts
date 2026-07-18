/**
 * SOVEREIGN Tier Classifier
 * Determines Tier 1 (execute) vs Tier 2 (draft + escalate to Jabari)
 * before the LLM call — catches obvious Tier 2 signals with zero latency.
 * Post-LLM pass runs again on the response text for anything the pre-scan missed.
 */

import type { UserRole, SovereignContext } from "./system-prompt";

export interface ClassificationResult {
  tier: 1 | 2;
  reason: string;
  riskFlags: string[];
}

// Roles that are always Tier 2 regardless of query content
const ALWAYS_TIER2_ROLES: UserRole[] = ["Investor", "Partner"];

// Document types that are always Tier 2
const ALWAYS_TIER2_DOCUMENTS = ["NIL_CONTRACT", "LOI", "PARTNERSHIP_AGREEMENT"];

// Keyword patterns that signal Tier 2 — ordered by specificity
const TIER2_PATTERNS: Array<{ pattern: RegExp; flag: string }> = [
  { pattern: /\bsign\b.*\b(deal|contract|agreement|offer|loi|letter of intent)\b/i, flag: "contract signing intent" },
  { pattern: /\b(binding|execute|executed)\b.*\b(contract|agreement|deal)\b/i,        flag: "binding contract language" },
  { pattern: /\bletter of intent\b|\bLOI\b/,                                           flag: "Letter of Intent (LOI)" },
  { pattern: /\bnil contract\b|\bnil agreement\b/i,                                    flag: "NIL contract review" },
  { pattern: /\bpartnership agreement\b|\bsponsor(ship)? agreement\b/i,                flag: "partnership/sponsorship agreement" },
  { pattern: /\bdraft.*clause\b|\bcontract language\b|\bcontract term\b/i,             flag: "contract language drafting" },
  { pattern: /\binvestor\b.*\b(brief|deck|memo|report|summary)\b/i,                    flag: "investor-facing output" },
  { pattern: /\bformal (advisory|brief|recommendation|report)\b/i,                     flag: "formal advisory brief" },
  { pattern: /\bagent representation\b|\brepresent(ation)? agreement\b/i,              flag: "agent engagement" },
  { pattern: /\bshould (i|he|she|they) sign\b/i,                                       flag: "sign/reject recommendation requested" },
  { pattern: /\breject.*offer\b|\bwalk away\b|\bturn down\b/i,                         flag: "deal rejection guidance" },
  { pattern: /\bscholarship promise\b|\bguarantee.*roster\b/i,                         flag: "scholarship/roster promise" },
  { pattern: /\bsend.*jabari\b|\bescalate\b/i,                                         flag: "explicit escalation request" },
];

// Patterns in LLM response that confirm Tier 2 (post-LLM check)
const RESPONSE_TIER2_SIGNALS: RegExp[] = [
  /\[TIER 2 ESCALATION REQUIRED\]/i,
  /advisory intelligence only — not legal counsel/i,
  /draft held pending jabari/i,
];

export function classifyQuery(
  query: string,
  role: UserRole,
  ctx: SovereignContext
): ClassificationResult {
  const riskFlags: string[] = [];

  // Role-level hard gate
  if (ALWAYS_TIER2_ROLES.includes(role)) {
    return {
      tier: 2,
      reason: `${role} role auto-escalates all queries per autonomy framework`,
      riskFlags: [`user role: ${role}`],
    };
  }

  // Document type gate
  if (ctx.documentType && ALWAYS_TIER2_DOCUMENTS.includes(ctx.documentType)) {
    return {
      tier: 2,
      reason: `Document type ${ctx.documentType} requires Jabari review before any advisory output`,
      riskFlags: [`document type: ${ctx.documentType}`],
    };
  }

  // Portal event — not auto-Tier 2 but adds risk flag
  if (ctx.portalEvent) {
    riskFlags.push("active transfer portal event");
  }

  // Keyword scan
  for (const { pattern, flag } of TIER2_PATTERNS) {
    if (pattern.test(query)) {
      riskFlags.push(flag);
    }
  }

  if (riskFlags.filter((f) => f !== "active transfer portal event").length > 0) {
    return {
      tier: 2,
      reason: `Query contains Tier 2 signal(s): ${riskFlags.join("; ")}`,
      riskFlags,
    };
  }

  return {
    tier: 1,
    reason: "Query falls within Tier 1 autonomous scope",
    riskFlags,
  };
}

// Post-LLM pass — catches anything the pre-scan missed
export function classifyResponse(
  responseText: string,
  preResult: ClassificationResult
): ClassificationResult {
  if (preResult.tier === 2) return preResult;

  const triggeredByResponse = RESPONSE_TIER2_SIGNALS.some((p) => p.test(responseText));
  if (triggeredByResponse) {
    return {
      tier: 2,
      reason: "SOVEREIGN self-escalated based on response content",
      riskFlags: [...preResult.riskFlags, "agent self-escalation"],
    };
  }

  return preResult;
}
