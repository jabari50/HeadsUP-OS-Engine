export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'
export type Tier = 'Elite' | 'Impact' | 'Contributor' | 'Developing' | 'Prospect'
export type ActivationStatus = 'locked' | 'preview' | 'full' | 'exclusive'
export type Priority = 'HIGH' | 'MED' | 'LOW'
export type ProgramSystem = 'Positionless' | 'Traditional' | 'Pace-and-Space'
export type LicenseTier = 'Scout' | 'Coordinator' | 'GM' | 'White Label'

export interface TechnicalScores {
  ball_handling: number   // 1–10
  shooting: number
  finishing: number
  passing: number
  defense: number
  rebounding: number
  athleticism: number
}

export interface NeuralScores {
  composure: number       // 1–99
  coachability: number
  iq: number
  resilience: number
  leadership: number
  drive: number
}

export type GPATier = 'high' | 'solid' | 'at_risk'
export type EligibilityStatus = 'eligible' | 'at_risk' | 'ineligible'
export type ProgramFit = 'aligned' | 'gap'

export interface AcademicProfile {
  gpa: number                               // 0.0–4.0
  gpa_tier: GPATier
  eligibility_status: EligibilityStatus
  core_courses_complete: boolean
  academic_accountability_score: number     // 1–99
  program_fit: ProgramFit
}

export interface Player {
  player_id: string
  full_name: string
  position: Position
  class_year: string
  high_school: string
  aau_program: string
  height_inches: number
  weight_lbs: number
  ovr: number             // 1–99 computed
  tier: Tier
  activation_status: ActivationStatus
  technical: TechnicalScores
  neural: NeuralScores
  academic: AcademicProfile
  fit_score?: number
}

export interface RosterGap {
  position: Position
  attribute_need: string
  priority: Priority
}

export interface Program {
  program_id: string
  name: string
  head_coach: string
  system: ProgramSystem
  season: string
  record: string
  conference: string
  roster_gaps: RosterGap[]
  portal_window_open: boolean
}

export interface MatchResult {
  program_name: string
  fit_score: number
  style_fit: number
  need_fit: number
  level_fit: number
  cultural_fit: number
  academic_fit: number
  rationale: string
  activation_status: ActivationStatus
}

export interface RIBSection {
  portal_entries: string[]
  tier_changes: string[]
  competitor_signings: string[]
  recommended_actions: string[]
  academic_alerts: string[]
  generated_at: string
}

export interface OperatorContext {
  name: string
  license_tier: LicenseTier
  credits_remaining: number
  portal_open: boolean
}
