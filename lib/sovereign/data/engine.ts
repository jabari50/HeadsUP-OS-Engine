/**
 * SOVEREIGN — HU-OS Engine Connector
 * Reads live Neural Audit data from Supabase neural_audit_log.
 * Also proxies health and future computation triggers to the Render engine.
 *
 * ZHR: returns null for any field not present in verified DB records.
 */

import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function engineUrl(path: string): string {
  const base = (process.env.HU_ENGINE_URL ?? "http://localhost:8000").replace(/\/$/, "");
  return `${base}${path}`;
}

export interface NeuralAuditSnapshot {
  id: string;
  athleteId: string | null;
  auditTimestamp: string | null;
  engineVersion: string | null;
  metricsSnapshot: Record<string, unknown>;
  questsAssigned: string[] | null;
  // SOVEREIGN-sourced entries
  logSource: string | null;
  tier: number | null;
  confidenceBand: string | null;
}

export interface DeficiencyReport {
  athleteId: string;
  deficiencies: string[];
  threshold: number;
  snapshotId: string | null;
  auditTimestamp: string | null;
}

// Returns the most recent Neural Audit snapshot for an athlete
export async function getLatestNeuralAudit(
  athleteId: string
): Promise<NeuralAuditSnapshot | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("neural_audit_log")
    .select("id, athlete_id, audit_timestamp, engine_version, metrics_snapshot, quests_assigned, log_source, tier, confidence_band")
    .eq("athlete_id", athleteId)
    .eq("log_source", "engine")
    .order("audit_timestamp", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    athleteId: (row.athlete_id as string) ?? null,
    auditTimestamp: (row.audit_timestamp as string) ?? null,
    engineVersion: (row.engine_version as string) ?? null,
    metricsSnapshot: (row.metrics_snapshot as Record<string, unknown>) ?? {},
    questsAssigned: (row.quests_assigned as string[]) ?? null,
    logSource: (row.log_source as string) ?? null,
    tier: (row.tier as number) ?? null,
    confidenceBand: (row.confidence_band as string) ?? null,
  };
}

// Derives deficiency flags from the athletes table directly (locked ALGO threshold: 80.0)
export async function getDeficiencyReport(
  athleteId: string
): Promise<DeficiencyReport | null> {
  const supabase = getAdminClient();
  const THRESHOLD = 80.0;

  const { data, error } = await supabase
    .from("athletes")
    .select(
      "id, neck_up_culture_equity, neck_up_resilience, neck_up_coachability, neck_up_playmaking, neck_up_defense, neck_up_physical_output"
    )
    .eq("id", athleteId)
    .single();

  if (error || !data) return null;

  const row = data as Record<string, number | null>;
  const PILLAR_MAP: Record<string, keyof typeof row> = {
    culture_equity:  "neck_up_culture_equity",
    resilience:      "neck_up_resilience",
    coachability:    "neck_up_coachability",
    playmaking:      "neck_up_playmaking",
    defense:         "neck_up_defense",
    physical_output: "neck_up_physical_output",
  };

  const deficiencies: string[] = [];
  for (const [label, col] of Object.entries(PILLAR_MAP)) {
    const val = row[col];
    if (val !== null && val !== undefined && val < THRESHOLD) {
      deficiencies.push(label);
    }
  }

  const audit = await getLatestNeuralAudit(athleteId);

  return {
    athleteId,
    deficiencies,
    threshold: THRESHOLD,
    snapshotId: audit?.id ?? null,
    auditTimestamp: audit?.auditTimestamp ?? null,
  };
}

// Engine health check — confirms Render service is reachable
export async function pingEngine(): Promise<{ healthy: boolean; version?: string }> {
  try {
    const res = await fetch(engineUrl("/health"), {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { healthy: false };
    const body = await res.json() as Record<string, unknown>;
    return { healthy: true, version: body.version as string | undefined };
  } catch {
    return { healthy: false };
  }
}

// Proxy: trigger a fresh Neural Audit computation on the engine (Phase 3+)
export async function triggerNeuralAudit(
  athleteId: string,
  scraperSecret: string
): Promise<{ triggered: boolean; sessionId?: string }> {
  try {
    const res = await fetch(engineUrl("/athlete/audit"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Scraper-Secret": scraperSecret,
      },
      body: JSON.stringify({ athlete_id: athleteId }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { triggered: false };
    const body = await res.json() as Record<string, unknown>;
    return { triggered: true, sessionId: body.session_id as string | undefined };
  } catch {
    return { triggered: false };
  }
}
