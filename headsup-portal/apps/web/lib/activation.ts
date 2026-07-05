/* Activation Lock field gating (§9, U5/U14).
   ONE resolver + ONE shaping function — no view re-implements this logic.
   RLS handles rows; this module handles which FIELDS leave the server. */

import { serviceClient } from "./supabaseServer";
import type { AthleteRow } from "@/types/database.types";
import type { PortalRole } from "./auth";

export type ActivationState =
  | "Locked"
  | "Preview Unlocked"
  | "Full Unlocked"
  | "Exclusive Lock";

/* Per-operator lock wins when present and unexpired; else the global floor. */
export async function resolveActivation(
  athleteId: string,
  operatorId: string | null
): Promise<ActivationState> {
  const { data, error } = await serviceClient().rpc("resolve_activation", {
    p_athlete: athleteId,
    p_operator: operatorId,
  });
  if (error || !data) return "Locked";
  return data as ActivationState;
}

/* §9 approved Sovereign Asset card fields — the ONLY fields a Locked profile
   ever exposes. Never: quests, open-response text, deficiency flags, raw NER. */
const CARD_FIELDS = [
  "id", "name", "position", "school", "class_year", "ovr", "tier",
  "height_in", "weight_lb", "wingspan_in",
] as const;

const PREVIEW_FIELDS = [
  ...CARD_FIELDS,
  "classification", "physical_score", "sovereign_verified", "activation_state",
] as const;

const FULL_FIELDS = [
  ...PREVIEW_FIELDS,
  "tech_ball_handling", "tech_shooting", "tech_finishing", "tech_passing",
  "tech_defense", "tech_rebounding", "tech_athleticism",
  "neural_composure", "neural_coachability", "neural_iq",
  "neural_resilience", "neural_leadership", "neural_drive",
  "created_at", "updated_at",
] as const;

function pick(athlete: AthleteRow, fields: readonly string[]) {
  const shaped: Record<string, unknown> = {};
  for (const field of fields) {
    shaped[field] = (athlete as unknown as Record<string, unknown>)[field] ?? null;
  }
  return shaped;
}

/* Field visibility by role + activation state. System_Admin and the athlete's
   own view get the full record; everyone else is activation-gated. */
export function shapeAthlete(
  athlete: AthleteRow,
  role: PortalRole | "",
  activation: ActivationState,
  isSelf: boolean
): Record<string, unknown> {
  if (role === "System_Admin" || isSelf) {
    return { ...athlete };
  }
  if (activation === "Full Unlocked" || activation === "Exclusive Lock") {
    return pick(athlete, FULL_FIELDS);
  }
  if (activation === "Preview Unlocked") {
    return pick(athlete, PREVIEW_FIELDS);
  }
  return pick(athlete, CARD_FIELDS);
}
