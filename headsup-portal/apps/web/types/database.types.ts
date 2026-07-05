/* Row shapes for the portal schema (supabase/migrations 0001-0003).
   Regenerate with `supabase gen types typescript` once a project is linked;
   until then these are hand-maintained against the migrations. */

export interface AthleteRow {
  id: string;
  user_id: string | null;
  external_id: string | null;
  name: string;
  position: "PG" | "SG" | "SF" | "PF" | "C" | null;
  school: string | null;
  class_year: string | null;
  classification: "HS" | "JUCO" | "College" | "Pro" | null;
  scout_id: string | null;
  height_in: number | null;
  weight_lb: number | null;
  wingspan_in: number | null;
  physical_score: number | null;
  tech_ball_handling: number | null;
  tech_shooting: number | null;
  tech_finishing: number | null;
  tech_passing: number | null;
  tech_defense: number | null;
  tech_rebounding: number | null;
  tech_athleticism: number | null;
  neural_composure: number | null;
  neural_coachability: number | null;
  neural_iq: number | null;
  neural_resilience: number | null;
  neural_leadership: number | null;
  neural_drive: number | null;
  ovr: number | null;
  tier: "Elite" | "Impact" | "Contributor" | "Developing" | "Prospect" | null;
  activation_state: "Locked" | "Preview Unlocked" | "Full Unlocked" | "Exclusive Lock";
  sovereign_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface OperatorRow {
  id: string;
  user_id: string | null;
  org_name: string | null;
  license_tier: "Scout" | "Coordinator" | "GM" | "White Label" | null;
  seat_count: number | null;
  activation_credits: number;
}

export interface ProgramRow {
  id: string;
  name: string;
  head_coach: string | null;
  system: "Positionless" | "Traditional" | "Pace-and-Space" | null;
  level: string | null;
  conference: string | null;
}

export interface RosterGapRow {
  id: string;
  program_id: string;
  position: "PG" | "SG" | "SF" | "PF" | "C" | null;
  attribute_need: string | null;
  priority: "HIGH" | "MED" | "LOW" | null;
}

export interface MatchRow {
  id: string;
  athlete_id: string;
  program_id: string;
  fit_score: number | null;
  style_fit: number | null;
  need_fit: number | null;
  level_fit: number | null;
  cultural_fit: number | null;
  recommendation: "Pursue" | "Monitor" | "Pass" | null;
  created_at: string;
}

export interface DraftBoardRow {
  id: string;
  operator_id: string;
  athlete_id: string;
  rank: number | null;
  notes: string | null;
}

export interface IntakeSessionRow {
  id: string;
  source: "scout_manual" | "combine_csv" | "free_agents" | "ner_anchor" | "film_event";
  submitted_by: string | null;
  idempotency_key: string | null;
  status: "received" | "validated" | "rejected" | "processed";
  created_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string | null;
  stripe_customer_id: string | null;
  stripe_sub_id: string | null;
  tier: string | null;
  status: string | null;
  current_period_end: string | null;
}
