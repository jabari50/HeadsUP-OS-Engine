/** OVR tier thresholds (upper bound inclusive) */
export const OVR_TIERS = {
  ELITE: 85,
  IMPACT: 70,
  CONTRIBUTOR: 55,
  DEVELOPING: 40,
} as const

/** OVR formula weights */
export const OVR_WEIGHTS = {
  TECHNICAL: 0.45,
  NEURAL: 0.35,
  PHYSICAL: 0.20,
} as const

/** Matchmaking fit score weights */
export const FIT_WEIGHTS = {
  STYLE: 0.25,
  NEED: 0.25,
  LEVEL: 0.20,
  CULTURAL: 0.15,
  ACADEMIC: 0.15,
} as const

/** Technical score scale (input 1–10 → OVR 1–99) */
export const TECHNICAL_SCALE_MIN = 1
export const TECHNICAL_SCALE_MAX = 10
export const OVR_SCALE_MIN = 1
export const OVR_SCALE_MAX = 99

/** Physical score constants */
export const HEIGHT_PERCENTILE_MAX_INCHES = 90  // 7'6" baseline ceiling
export const HEIGHT_PERCENTILE_MIN_INCHES = 60  // 5'0" baseline floor
export const WEIGHT_BASELINE_LBS = 200

/** Activation unlock credit cost per action */
export const UNLOCK_CREDIT_COST: Record<string, number> = {
  preview: 0,
  full: 1,
  exclusive: 3,
}

/** Demo operator defaults */
export const DEMO_OPERATOR = {
  name: 'Westbrook University',
  license_tier: 'GM' as const,
  credits_remaining: 20,
  portal_open: true,
} as const

/** Positions */
export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const

/** Class years */
export const CLASS_YEARS = ['2025', '2026', '2027', '2028'] as const

/** Priority levels */
export const PRIORITIES = ['HIGH', 'MED', 'LOW'] as const

/** Activation states in cycle order */
export const ACTIVATION_CYCLE = ['locked', 'preview', 'full', 'exclusive'] as const
