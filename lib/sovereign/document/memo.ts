/**
 * SOVEREIGN — JSON Escalation Memo
 * Structured system-to-system format for Tier 2 escalations.
 * Written to the escalation queue and returned in API responses.
 */

import type { UserRole } from "../system-prompt";

export interface EscalationMemo {
  schema_version: "1.0.0";
  generated_at: string;
  sovereign_version: "1.0.0";
  escalation: {
    id: string | null;
    audit_log_id: string | null;
    status: "pending";
  };
  subject: {
    user_role: UserRole;
    athlete_id: string | null;
    athlete_name: string | null;
    conversation_id: string | null;
  };
  classification: {
    tier: 2;
    reason: string;
    risk_flags: string[];
    confidence_band: string;
  };
  document?: {
    file_name: string;
    document_type: string;
    page_count: number | null;
    character_count: number;
    parse_warnings: string[];
  };
  draft_response: string;
  instructions_for_jabari: string;
  disclaimer: "Advisory intelligence only — not legal counsel.";
}

export function buildEscalationMemo(params: {
  escalationId: string | null;
  auditLogId: string | null;
  userRole: UserRole;
  athleteId?: string;
  athleteName?: string;
  conversationId?: string;
  tierReason: string;
  riskFlags: string[];
  confidenceBand: string;
  draftResponse: string;
  document?: {
    fileName: string;
    documentType: string;
    pageCount: number | null;
    characterCount: number;
    parseWarnings: string[];
  };
}): EscalationMemo {
  return {
    schema_version: "1.0.0",
    generated_at: new Date().toISOString(),
    sovereign_version: "1.0.0",
    escalation: {
      id: params.escalationId,
      audit_log_id: params.auditLogId,
      status: "pending",
    },
    subject: {
      user_role: params.userRole,
      athlete_id: params.athleteId ?? null,
      athlete_name: params.athleteName ?? null,
      conversation_id: params.conversationId ?? null,
    },
    classification: {
      tier: 2,
      reason: params.tierReason,
      risk_flags: params.riskFlags,
      confidence_band: params.confidenceBand,
    },
    ...(params.document && {
      document: {
        file_name: params.document.fileName,
        document_type: params.document.documentType,
        page_count: params.document.pageCount,
        character_count: params.document.characterCount,
        parse_warnings: params.document.parseWarnings,
      },
    }),
    draft_response: params.draftResponse,
    instructions_for_jabari:
      "Review the draft_response above. Use PATCH /api/sovereign/escalation with " +
      "action: 'approve' to release as-is, 'modify' to set a final_response, " +
      "or 'reject' with jabari_notes explaining the decision.",
    disclaimer: "Advisory intelligence only — not legal counsel.",
  };
}
