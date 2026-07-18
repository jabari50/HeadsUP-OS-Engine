/**
 * SOVEREIGN Escalation Service
 * Writes Tier 2 interactions to neural_audit_log (append-only)
 * and sovereign_escalation_queue (pending Jabari review).
 * Tier 1 interactions are audit-logged only — no queue entry.
 *
 * Uses supabase-admin (service role) — server-side only.
 */

import { createClient } from "@supabase/supabase-js";
import type { ClassificationResult } from "./tier-classifier";
import type { UserRole } from "./system-prompt";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface AuditPayload {
  athleteId?: string;
  conversationId?: string;
  userRole: UserRole;
  query: string;
  responseText: string;
  classification: ClassificationResult;
  confidenceBand: string;
}

export interface EscalationRecord {
  id: string;
  query: string;
  draftResponse: string;
  tierReason: string;
  riskFlags: string[];
  confidenceBand: string;
  userRole: UserRole;
  status: "pending" | "approved" | "rejected" | "modified";
  jabariNotes: string | null;
  finalResponse: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

// Writes audit row + optional escalation queue entry.
// Returns { auditLogId, escalationId? }
export async function logAndEscalate(payload: AuditPayload): Promise<{
  auditLogId: string;
  escalationId?: string;
}> {
  const supabase = getAdminClient();

  const auditRow = {
    log_source: "sovereign",
    sovereign_query: payload.query,
    user_role: payload.userRole,
    tier: payload.classification.tier,
    confidence_band: payload.confidenceBand,
    escalation_required: payload.classification.tier === 2,
    conversation_id: payload.conversationId ?? null,
    athlete_id: payload.athleteId ?? null,
    // Required by existing schema — null for SOVEREIGN-sourced rows
    metrics_snapshot: {},
  };

  const { data: auditData, error: auditError } = await supabase
    .from("neural_audit_log")
    .insert(auditRow)
    .select("id")
    .single();

  if (auditError || !auditData) {
    throw new Error(`neural_audit_log insert failed: ${auditError?.message}`);
  }

  if (payload.classification.tier !== 2) {
    return { auditLogId: auditData.id };
  }

  const queueRow = {
    audit_log_id: auditData.id,
    athlete_id: payload.athleteId ?? null,
    conversation_id: payload.conversationId ?? null,
    user_role: payload.userRole,
    query: payload.query,
    draft_response: payload.responseText,
    tier_reason: payload.classification.reason,
    risk_flags: payload.classification.riskFlags,
    confidence_band: payload.confidenceBand,
    status: "pending",
  };

  const { data: queueData, error: queueError } = await supabase
    .from("sovereign_escalation_queue")
    .insert(queueRow)
    .select("id")
    .single();

  if (queueError || !queueData) {
    throw new Error(`sovereign_escalation_queue insert failed: ${queueError?.message}`);
  }

  return { auditLogId: auditData.id, escalationId: queueData.id };
}

// Jabari review actions
export async function approveEscalation(
  escalationId: string,
  jabariNotes?: string
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("sovereign_escalation_queue")
    .update({
      status: "approved",
      jabari_notes: jabariNotes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", escalationId)
    .eq("status", "pending");

  if (error) throw new Error(`approve failed: ${error.message}`);
}

export async function rejectEscalation(
  escalationId: string,
  jabariNotes: string
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("sovereign_escalation_queue")
    .update({
      status: "rejected",
      jabari_notes: jabariNotes,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", escalationId)
    .eq("status", "pending");

  if (error) throw new Error(`reject failed: ${error.message}`);
}

export async function modifyEscalation(
  escalationId: string,
  finalResponse: string,
  jabariNotes?: string
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("sovereign_escalation_queue")
    .update({
      status: "modified",
      final_response: finalResponse,
      jabari_notes: jabariNotes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", escalationId)
    .eq("status", "pending");

  if (error) throw new Error(`modify failed: ${error.message}`);
}

export async function getPendingEscalations(): Promise<EscalationRecord[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("sovereign_escalation_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`fetch escalations failed: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    query: row.query,
    draftResponse: row.draft_response,
    tierReason: row.tier_reason,
    riskFlags: row.risk_flags ?? [],
    confidenceBand: row.confidence_band,
    userRole: row.user_role,
    status: row.status,
    jabariNotes: row.jabari_notes,
    finalResponse: row.final_response,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }));
}
