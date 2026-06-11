export type LicenseTier = "scout" | "coordinator" | "gm" | "white_label";

export type ActivationStatus =
  | "locked"
  | "preview_unlocked"
  | "full_unlocked"
  | "exclusive_lock";

export type MatchStatus = "pending" | "matched" | "closed";

export interface Operator {
  id: string;
  name: string;
  email: string;
  license_tier: LicenseTier;
  stripe_customer_id: string | null;
  active: boolean;
  created_at: string;
}

export interface Athlete {
  id: string;
  full_name: string | null;
  position: string | null;
  graduation_year: number | null;
  school: string | null;
  ovr: number | null;
  market_position: string | null;
}

export interface RosterEntry {
  id: string;
  activation_status: ActivationStatus;
  added_at: string;
  athletes: Athlete | null;
}

export interface MatchRequest {
  id: string;
  position: string;
  height_min: number | null;
  height_max: number | null;
  class_year: string | null;
  status: MatchStatus;
  created_at: string;
}

export const ACTIVATION_STATUSES: ActivationStatus[] = [
  "locked",
  "preview_unlocked",
  "full_unlocked",
  "exclusive_lock",
];

export const ACTIVATION_LABELS: Record<ActivationStatus, string> = {
  locked: "Locked",
  preview_unlocked: "Preview",
  full_unlocked: "Full Unlock",
  exclusive_lock: "Exclusive",
};

export const TIER_LABELS: Record<LicenseTier, string> = {
  scout: "Scout",
  coordinator: "Coordinator",
  gm: "GM",
  white_label: "White Label",
};

export const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
