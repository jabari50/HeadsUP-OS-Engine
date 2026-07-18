/**
 * SOVEREIGN — Athlete Data Connector
 * Read-only Supabase access via service role (server-side only).
 * RBAC gate enforced before any data is returned.
 *
 * ZHR: all numeric fields may be null — never coerce to 0.
 */

import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "../system-prompt";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface AthleteProfile {
  id: string;
  fullName: string;
  graduationYear: number;
  school: string | null;
  sport: string;
  position: string | null;
  locationCity: string | null;
  locationState: string | null;
  // Neck Up Multipliers
  proScore: number | null;
  ner: number | null;
  ovr: number | null;
  cultureEquity: number | null;
  resilience: number | null;
  coachability: number | null;
  playmaking: number | null;
  defense: number | null;
  physicalOutput: number | null;
  cognitiveStability: number | null;
  selfAwarenessScore: number | null;
  authenticityScore: number | null;
  leadershipIdentity: string | null;
  locusOfControl: string | null;
  // Neural Market Position
  marketPosition: string | null;
  confidenceBand: string | null;
  secondaryTags: string[] | null;
  // Neck Down Metrics (summary only — full JSONB in neckDownMetrics)
  gpa: number | null;
  nilScore: number | null;
  socialFollowing: number | null;
  // Status flags
  injuryStatus: boolean | null;
  injuryNotes: string | null;
  placementInterest: string | null;
  entryStatus: string | null;
  sovereignVerified: boolean | null;
  superagentUnlocked: boolean;
  // Quest data
  completedQuests: string[] | null;
  xpTotal: number | null;
  badgesEarned: string[] | null;
  // Key insight
  keyQuote: string | null;
  founderNotes: string | null;
  // Raw JSONB — available to NDA_Analyst and System_Admin only
  neckUpMarkers?: Record<string, unknown>;
  neckDownMetrics?: Record<string, unknown>;
  sportSpecificMetrics?: Record<string, unknown>;
  selfAwarenessGap?: Record<string, unknown>;
  llmAnalysis?: string | null;
}

// Columns returned to all authorized roles
const BASE_COLUMNS = [
  "id", "full_name", "graduation_year", "school", "sport", "position",
  "location_city", "location_state",
  "neck_up_pro_score", "neck_up_ner", "ovr",
  "neck_up_culture_equity", "neck_up_resilience", "neck_up_coachability",
  "neck_up_playmaking", "neck_up_defense", "neck_up_physical_output",
  "neck_up_cognitive_stability", "self_awareness_score", "authenticity_score",
  "leadership_identity", "locus_of_control",
  "market_position", "confidence_band", "secondary_tags",
  "gpa", "nil_score", "social_following",
  "injury_status", "injury_notes",
  "placement_interest", "entry_status",
  "sovereign_verified", "superagent_unlocked",
  "completed_quests", "xp_total", "badges_earned",
  "key_quote", "founder_notes",
].join(", ");

// Additional JSONB columns for privileged roles
const PRIVILEGED_COLUMNS = [
  "neck_up_markers", "neck_down_metrics", "sport_specific_metrics",
  "self_awareness_gap", "llm_analysis",
].join(", ");

const PRIVILEGED_ROLES: UserRole[] = ["NDA_Analyst", "System_Admin"];

function mapRow(row: Record<string, unknown>, privileged: boolean): AthleteProfile {
  const profile: AthleteProfile = {
    id: row.id as string,
    fullName: row.full_name as string,
    graduationYear: row.graduation_year as number,
    school: (row.school as string) ?? null,
    sport: row.sport as string,
    position: (row.position as string) ?? null,
    locationCity: (row.location_city as string) ?? null,
    locationState: (row.location_state as string) ?? null,
    proScore: (row.neck_up_pro_score as number) ?? null,
    ner: (row.neck_up_ner as number) ?? null,
    ovr: (row.ovr as number) ?? null,
    cultureEquity: (row.neck_up_culture_equity as number) ?? null,
    resilience: (row.neck_up_resilience as number) ?? null,
    coachability: (row.neck_up_coachability as number) ?? null,
    playmaking: (row.neck_up_playmaking as number) ?? null,
    defense: (row.neck_up_defense as number) ?? null,
    physicalOutput: (row.neck_up_physical_output as number) ?? null,
    cognitiveStability: (row.neck_up_cognitive_stability as number) ?? null,
    selfAwarenessScore: (row.self_awareness_score as number) ?? null,
    authenticityScore: (row.authenticity_score as number) ?? null,
    leadershipIdentity: (row.leadership_identity as string) ?? null,
    locusOfControl: (row.locus_of_control as string) ?? null,
    marketPosition: (row.market_position as string) ?? null,
    confidenceBand: (row.confidence_band as string) ?? null,
    secondaryTags: (row.secondary_tags as string[]) ?? null,
    gpa: (row.gpa as number) ?? null,
    nilScore: (row.nil_score as number) ?? null,
    socialFollowing: (row.social_following as number) ?? null,
    injuryStatus: (row.injury_status as boolean) ?? null,
    injuryNotes: (row.injury_notes as string) ?? null,
    placementInterest: (row.placement_interest as string) ?? null,
    entryStatus: (row.entry_status as string) ?? null,
    sovereignVerified: (row.sovereign_verified as boolean) ?? null,
    superagentUnlocked: (row.superagent_unlocked as boolean) ?? false,
    completedQuests: (row.completed_quests as string[]) ?? null,
    xpTotal: (row.xp_total as number) ?? null,
    badgesEarned: (row.badges_earned as string[]) ?? null,
    keyQuote: (row.key_quote as string) ?? null,
    founderNotes: (row.founder_notes as string) ?? null,
  };

  if (privileged) {
    profile.neckUpMarkers = (row.neck_up_markers as Record<string, unknown>) ?? undefined;
    profile.neckDownMetrics = (row.neck_down_metrics as Record<string, unknown>) ?? undefined;
    profile.sportSpecificMetrics = (row.sport_specific_metrics as Record<string, unknown>) ?? undefined;
    profile.selfAwarenessGap = (row.self_awareness_gap as Record<string, unknown>) ?? undefined;
    profile.llmAnalysis = (row.llm_analysis as string) ?? null;
  }

  return profile;
}

export async function getAthleteForSovereign(
  athleteId: string,
  requesterRole: UserRole
): Promise<AthleteProfile | null> {
  const supabase = getAdminClient();
  const privileged = PRIVILEGED_ROLES.includes(requesterRole);
  const columns = privileged
    ? `${BASE_COLUMNS}, ${PRIVILEGED_COLUMNS}`
    : BASE_COLUMNS;

  const { data, error } = await supabase
    .from("athletes")
    .select(columns)
    .eq("id", athleteId)
    .single();

  if (error || !data) return null;

  const row = data as unknown as Record<string, unknown>;

  // Non-privileged roles require superagent_unlocked
  if (!privileged && !row.superagent_unlocked) return null;

  return mapRow(row, privileged);
}

export interface AthleteSearchResult {
  id: string;
  fullName: string;
  school: string | null;
  graduationYear: number;
  position: string | null;
  proScore: number | null;
  ovr: number | null;
  marketPosition: string | null;
  injuryStatus: boolean | null;
  placementInterest: string | null;
}

// Virtual GM — portal fit search
export async function searchAthletes(params: {
  graduationYears?: number[];
  positions?: string[];
  minProScore?: number;
  minOvr?: number;
  marketPositions?: string[];
  placementInterest?: string;
  limit?: number;
}): Promise<AthleteSearchResult[]> {
  const supabase = getAdminClient();

  let query = supabase
    .from("athletes")
    .select(
      "id, full_name, school, graduation_year, position, neck_up_pro_score, ovr, market_position, injury_status, placement_interest"
    )
    .eq("superagent_unlocked", true);

  if (params.graduationYears?.length) {
    query = query.in("graduation_year", params.graduationYears);
  }
  if (params.positions?.length) {
    query = query.in("position", params.positions);
  }
  if (params.minProScore !== undefined) {
    query = query.gte("neck_up_pro_score", params.minProScore);
  }
  if (params.minOvr !== undefined) {
    query = query.gte("ovr", params.minOvr);
  }
  if (params.marketPositions?.length) {
    query = query.in("market_position", params.marketPositions);
  }
  if (params.placementInterest) {
    query = query.ilike("placement_interest", `%${params.placementInterest}%`);
  }

  const { data, error } = await query
    .order("ovr", { ascending: false })
    .limit(params.limit ?? 20);

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    fullName: row.full_name as string,
    school: (row.school as string) ?? null,
    graduationYear: row.graduation_year as number,
    position: (row.position as string) ?? null,
    proScore: (row.neck_up_pro_score as number) ?? null,
    ovr: (row.ovr as number) ?? null,
    marketPosition: (row.market_position as string) ?? null,
    injuryStatus: (row.injury_status as boolean) ?? null,
    placementInterest: (row.placement_interest as string) ?? null,
  }));
}
