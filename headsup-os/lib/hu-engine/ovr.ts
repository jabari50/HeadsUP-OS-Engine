// TypeScript port of ovr_engine.py — keep formulas in lockstep with the Python engine.

export const TECHNICAL_WEIGHT = 0.45;
export const NEURAL_WEIGHT = 0.35;
export const PHYSICAL_WEIGHT = 0.2;

export const SCALE_MIN = 1.0;
export const SCALE_MAX = 99.0;

const TIER_THRESHOLDS: [number, string][] = [
  [85.0, "Elite"],
  [70.0, "Impact"],
  [55.0, "Contributor"],
  [40.0, "Developing"],
];
const FLOOR_TIER = "Prospect";

const round1 = (n: number): number => Math.round(n * 10) / 10;

export function convertTechnicalTo99(score1to10: number): number {
  return ((score1to10 - 1) / 9) * 98 + 1;
}

export function getTier(ovr: number): string {
  for (const [threshold, tier] of TIER_THRESHOLDS) {
    if (ovr >= threshold) return tier;
  }
  return FLOOR_TIER;
}

export function nextTierTarget(ovr: number): { tier: string; threshold: number } | null {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    const [threshold, tier] = TIER_THRESHOLDS[i];
    if (ovr < threshold) return { tier, threshold };
  }
  return null;
}

export interface OvrResult {
  ovr: number;
  tier: string;
  technical_avg: number;
  neural_avg: number;
  physical_score: number;
  technical_converted: Record<string, number>;
  breakdown: {
    technical_contribution: number;
    neural_contribution: number;
    physical_contribution: number;
  };
}

export function calculateOvr(
  technicalScores: Record<string, number>,
  neuralScores: Record<string, number>,
  physicalScore: number,
): OvrResult {
  const technicalConverted: Record<string, number> = {};
  for (const [k, v] of Object.entries(technicalScores)) {
    technicalConverted[k] = convertTechnicalTo99(v);
  }
  const techValues = Object.values(technicalConverted);
  const neuralValues = Object.values(neuralScores);
  const technicalAvg = techValues.reduce((a, b) => a + b, 0) / techValues.length;
  const neuralAvg = neuralValues.reduce((a, b) => a + b, 0) / neuralValues.length;

  let ovr =
    technicalAvg * TECHNICAL_WEIGHT +
    neuralAvg * NEURAL_WEIGHT +
    physicalScore * PHYSICAL_WEIGHT;
  ovr = round1(Math.min(SCALE_MAX, Math.max(SCALE_MIN, ovr)));

  const converted: Record<string, number> = {};
  for (const [k, v] of Object.entries(technicalConverted)) converted[k] = round1(v);

  return {
    ovr,
    tier: getTier(ovr),
    technical_avg: round1(technicalAvg),
    neural_avg: round1(neuralAvg),
    physical_score: physicalScore,
    technical_converted: converted,
    breakdown: {
      technical_contribution: round1(technicalAvg * TECHNICAL_WEIGHT),
      neural_contribution: round1(neuralAvg * NEURAL_WEIGHT),
      physical_contribution: round1(physicalScore * PHYSICAL_WEIGHT),
    },
  };
}
