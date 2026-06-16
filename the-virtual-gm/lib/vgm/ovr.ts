/* Faithful TypeScript port of ovr_engine.py (HeadsUp OS OVR Engine v3.1.0).
   Composite: technical 45% · neural 35% · physical 20%.
   This is the existing documented engine formula — not a new methodology.
   Inputs are collected on a 1-10 scale and converted onto the 1-99 OVR scale. */

const TECHNICAL_WEIGHT = 0.45;
const NEURAL_WEIGHT = 0.35;
const PHYSICAL_WEIGHT = 0.2;
const SCALE_MIN = 1.0;
const SCALE_MAX = 99.0;

const TIER_THRESHOLDS: [number, string][] = [
  [85.0, "Elite"],
  [70.0, "Impact"],
  [55.0, "Contributor"],
  [40.0, "Developing"],
];
const FLOOR_TIER = "Prospect";

// 1-10 → 1-99 (matches convert_technical_to_99)
export function to99(score1to10: number): number {
  return ((score1to10 - 1) / 9) * 98 + 1;
}

export function getTier(ovr: number): string {
  for (const [threshold, tier] of TIER_THRESHOLDS) {
    if (ovr >= threshold) return tier;
  }
  return FLOOR_TIER;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface OvrResult {
  ovr: number;
  tier: string;
  technicalAvg: number;
  neuralAvg: number;
  physical99: number;
}

/** technical10: 7 skills (1-10); neural10: 6 attributes (1-10); physical10: 1-10. */
export function calculateOvr(
  technical10: number[],
  neural10: number[],
  physical10: number
): OvrResult {
  const technicalAvg = mean(technical10.map(to99));
  const neuralAvg = mean(neural10.map(to99));
  const physical99 = to99(physical10);
  const raw =
    technicalAvg * TECHNICAL_WEIGHT +
    neuralAvg * NEURAL_WEIGHT +
    physical99 * PHYSICAL_WEIGHT;
  const ovr = Math.round(clamp(raw, SCALE_MIN, SCALE_MAX) * 10) / 10;
  return {
    ovr,
    tier: getTier(ovr),
    technicalAvg: Math.round(technicalAvg * 10) / 10,
    neuralAvg: Math.round(neuralAvg * 10) / 10,
    physical99: Math.round(physical99 * 10) / 10,
  };
}

// Intake field definitions (mirror athlete_api.py TechnicalIntake / NeuralIntake)
export const TECHNICAL_FIELDS = [
  ["ball_handling", "Ball Handling"],
  ["shooting", "Shooting"],
  ["finishing", "Finishing"],
  ["passing", "Passing"],
  ["defense", "Defense"],
  ["rebounding", "Rebounding"],
  ["athleticism", "Athleticism"],
] as const;

export const NEURAL_FIELDS = [
  ["composure", "Composure"],
  ["coachability", "Coachability"],
  ["iq", "Basketball IQ"],
  ["resilience", "Resilience"],
  ["leadership", "Leadership"],
  ["drive", "Drive"],
] as const;

export const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
