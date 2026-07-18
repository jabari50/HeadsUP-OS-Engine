import type { TechnicalScores, NeuralScores, Tier } from './vgm-types'
import {
  OVR_WEIGHTS,
  OVR_TIERS,
  TECHNICAL_SCALE_MIN,
  TECHNICAL_SCALE_MAX,
  OVR_SCALE_MIN,
  OVR_SCALE_MAX,
  HEIGHT_PERCENTILE_MAX_INCHES,
  HEIGHT_PERCENTILE_MIN_INCHES,
} from './vgm-constants'

/** Scale a 1–10 technical score to 1–99 OVR range */
function scaleTechnical(score: number): number {
  const clamped = Math.max(TECHNICAL_SCALE_MIN, Math.min(TECHNICAL_SCALE_MAX, score))
  return OVR_SCALE_MIN + ((clamped - TECHNICAL_SCALE_MIN) / (TECHNICAL_SCALE_MAX - TECHNICAL_SCALE_MIN)) * (OVR_SCALE_MAX - OVR_SCALE_MIN)
}

/** Average all technical sub-scores, scaled to 1–99 */
function technicalAvg(t: TechnicalScores): number {
  const raw = [t.ball_handling, t.shooting, t.finishing, t.passing, t.defense, t.rebounding, t.athleticism]
  const avg = raw.reduce((a, b) => a + b, 0) / raw.length
  return scaleTechnical(avg)
}

/** Average all neural sub-scores (already 1–99) */
function neuralAvg(n: NeuralScores): number {
  const raw = [n.composure, n.coachability, n.iq, n.resilience, n.leadership, n.drive]
  return raw.reduce((a, b) => a + b, 0) / raw.length
}

/** Derive a physical score (1–99) from height and weight */
function physicalScore(heightInches: number, weightLbs: number): number {
  const heightScore =
    ((heightInches - HEIGHT_PERCENTILE_MIN_INCHES) /
      (HEIGHT_PERCENTILE_MAX_INCHES - HEIGHT_PERCENTILE_MIN_INCHES)) *
    OVR_SCALE_MAX
  const weightScore = Math.min(OVR_SCALE_MAX, (weightLbs / 260) * OVR_SCALE_MAX)
  return Math.max(OVR_SCALE_MIN, Math.min(OVR_SCALE_MAX, (heightScore * 0.7 + weightScore * 0.3)))
}

/**
 * Compute OVR for a player.
 * OVR = (technical_avg × 0.45) + (neural_avg × 0.35) + (physical_score × 0.20)
 */
export function computeOVR(
  technical: TechnicalScores,
  neural: NeuralScores,
  heightInches: number,
  weightLbs: number,
): number {
  const t = technicalAvg(technical)
  const n = neuralAvg(neural)
  const p = physicalScore(heightInches, weightLbs)
  const raw = t * OVR_WEIGHTS.TECHNICAL + n * OVR_WEIGHTS.NEURAL + p * OVR_WEIGHTS.PHYSICAL
  return Math.round(Math.max(OVR_SCALE_MIN, Math.min(OVR_SCALE_MAX, raw)))
}

/**
 * Derive Tier from OVR.
 * Elite ≥ 85 | Impact ≥ 70 | Contributor ≥ 55 | Developing ≥ 40 | Prospect < 40
 */
export function deriveTier(ovr: number): Tier {
  if (ovr >= OVR_TIERS.ELITE) return 'Elite'
  if (ovr >= OVR_TIERS.IMPACT) return 'Impact'
  if (ovr >= OVR_TIERS.CONTRIBUTOR) return 'Contributor'
  if (ovr >= OVR_TIERS.DEVELOPING) return 'Developing'
  return 'Prospect'
}
