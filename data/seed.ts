import type { Player, Program, AcademicProfile } from '@/lib/vgm-types'
import { computeOVR, deriveTier } from '@/lib/ovr-engine'

function calcAcademicScore(academic: Omit<AcademicProfile, 'academic_accountability_score'>): number {
  const gpa_normalized = (academic.gpa / 4.0) * 99
  const eligibility_bonus = academic.eligibility_status === 'eligible' ? 99 : academic.eligibility_status === 'at_risk' ? 50 : 1
  const core_completion = academic.core_courses_complete ? 99 : 40
  return Math.round((gpa_normalized * 0.50) + (eligibility_bonus * 0.30) + (core_completion * 0.20))
}

function makeAcademic(
  gpa: number,
  eligibility_status: AcademicProfile['eligibility_status'],
  core_courses_complete: boolean,
  program_fit: AcademicProfile['program_fit'],
): AcademicProfile {
  const gpa_tier: AcademicProfile['gpa_tier'] = gpa >= 3.5 ? 'high' : gpa >= 2.5 ? 'solid' : 'at_risk'
  const base = { gpa, gpa_tier, eligibility_status, core_courses_complete, program_fit }
  return { ...base, academic_accountability_score: calcAcademicScore(base) }
}

function makePlayer(
  id: string,
  full_name: string,
  position: Player['position'],
  class_year: string,
  high_school: string,
  aau_program: string,
  height_inches: number,
  weight_lbs: number,
  technical: Player['technical'],
  neural: Player['neural'],
  activation_status: Player['activation_status'],
  academic: AcademicProfile,
): Player {
  const ovr = computeOVR(technical, neural, height_inches, weight_lbs)
  return {
    player_id: id,
    full_name,
    position,
    class_year,
    high_school,
    aau_program,
    height_inches,
    weight_lbs,
    ovr,
    tier: deriveTier(ovr),
    activation_status,
    technical,
    neural,
    academic,
  }
}

export const DEMO_PLAYERS: Player[] = [
  makePlayer(
    'p001', 'Marcus Webb', 'PG', '2026',
    'Duncanville HS', 'Texas Titans 17U',
    72, 175,
    { ball_handling: 9, shooting: 8, finishing: 7, passing: 9, defense: 7, rebounding: 4, athleticism: 8 },
    { composure: 82, coachability: 88, iq: 91, resilience: 85, leadership: 80, drive: 90 },
    'full',
    makeAcademic(3.7, 'eligible', true, 'aligned'),
  ),
  makePlayer(
    'p002', 'Darius Cole', 'SF', '2026',
    'South Garland HS', 'DFW Mustangs 17U',
    78, 210,
    { ball_handling: 6, shooting: 7, finishing: 8, passing: 6, defense: 8, rebounding: 7, athleticism: 8 },
    { composure: 74, coachability: 80, iq: 72, resilience: 78, leadership: 65, drive: 85 },
    'preview',
    makeAcademic(3.1, 'eligible', true, 'aligned'),
  ),
  makePlayer(
    'p003', 'Elijah Thomas', 'C', '2025',
    'Allen HS', 'Prime Time Hoops',
    84, 245,
    { ball_handling: 4, shooting: 5, finishing: 8, passing: 5, defense: 9, rebounding: 9, athleticism: 7 },
    { composure: 88, coachability: 92, iq: 78, resilience: 90, leadership: 72, drive: 88 },
    'full',
    makeAcademic(3.4, 'eligible', true, 'aligned'),
  ),
  makePlayer(
    'p004', 'Jordan Ray', 'SG', '2026',
    'McKinney Boyd HS', 'TeamWork Athletics',
    75, 190,
    { ball_handling: 7, shooting: 9, finishing: 7, passing: 6, defense: 6, rebounding: 5, athleticism: 8 },
    { composure: 68, coachability: 75, iq: 70, resilience: 72, leadership: 60, drive: 80 },
    'locked',
    makeAcademic(2.8, 'at_risk', false, 'gap'),
  ),
  makePlayer(
    'p005', 'Tre Booker', 'PF', '2027',
    'Plano West HS', 'North Texas Stars',
    80, 228,
    { ball_handling: 5, shooting: 6, finishing: 7, passing: 6, defense: 8, rebounding: 8, athleticism: 7 },
    { composure: 70, coachability: 78, iq: 68, resilience: 75, leadership: 58, drive: 82 },
    'locked',
    makeAcademic(3.2, 'eligible', true, 'aligned'),
  ),
  makePlayer(
    'p006', 'Caleb Monroe', 'PG', '2025',
    'Frisco Lone Star HS', 'Texas Select',
    70, 168,
    { ball_handling: 8, shooting: 7, finishing: 6, passing: 8, defense: 6, rebounding: 3, athleticism: 7 },
    { composure: 79, coachability: 84, iq: 86, resilience: 80, leadership: 75, drive: 78 },
    'exclusive',
    makeAcademic(3.8, 'eligible', true, 'aligned'),
  ),
  makePlayer(
    'p007', 'Isaiah Pruitt', 'SF', '2027',
    'Mesquite HS', 'UA Texas',
    77, 205,
    { ball_handling: 6, shooting: 5, finishing: 7, passing: 5, defense: 9, rebounding: 7, athleticism: 9 },
    { composure: 65, coachability: 70, iq: 62, resilience: 68, leadership: 55, drive: 88 },
    'preview',
    makeAcademic(2.2, 'at_risk', false, 'gap'),
  ),
  makePlayer(
    'p008', 'Devon Stokes', 'C', '2026',
    'Cedar Hill HS', 'DFW Elite',
    82, 255,
    { ball_handling: 3, shooting: 4, finishing: 7, passing: 4, defense: 8, rebounding: 9, athleticism: 6 },
    { composure: 75, coachability: 82, iq: 70, resilience: 80, leadership: 62, drive: 76 },
    'locked',
    makeAcademic(2.9, 'eligible', true, 'aligned'),
  ),
  makePlayer(
    'p009', 'Malik Fountain', 'SG', '2026',
    'Lancaster HS', 'Hardnock Youth',
    74, 185,
    { ball_handling: 7, shooting: 8, finishing: 7, passing: 5, defense: 7, rebounding: 5, athleticism: 8 },
    { composure: 72, coachability: 76, iq: 74, resilience: 70, leadership: 62, drive: 83 },
    'preview',
    makeAcademic(3.0, 'eligible', true, 'aligned'),
  ),
  makePlayer(
    'p010', 'Quentin Hargrove', 'PF', '2025',
    'South Oak Cliff HS', 'Team Griffin',
    81, 235,
    { ball_handling: 4, shooting: 5, finishing: 8, passing: 5, defense: 9, rebounding: 8, athleticism: 8 },
    { composure: 80, coachability: 85, iq: 75, resilience: 82, leadership: 70, drive: 86 },
    'full',
    makeAcademic(1.9, 'ineligible', false, 'gap'),
  ),
  makePlayer(
    'p011', 'Aaron Delgado', 'PG', '2027',
    'Skyline HS', 'Dallas United Hoops',
    71, 170,
    { ball_handling: 8, shooting: 6, finishing: 6, passing: 7, defense: 7, rebounding: 3, athleticism: 7 },
    { composure: 69, coachability: 72, iq: 78, resilience: 65, leadership: 60, drive: 75 },
    'locked',
    makeAcademic(3.5, 'eligible', true, 'aligned'),
  ),
  makePlayer(
    'p012', 'Tyrese Caldwell', 'C', '2026',
    'Carter HS', 'Texas Phenom',
    83, 250,
    { ball_handling: 3, shooting: 4, finishing: 8, passing: 4, defense: 8, rebounding: 9, athleticism: 7 },
    { composure: 77, coachability: 80, iq: 72, resilience: 78, leadership: 65, drive: 79 },
    'locked',
    makeAcademic(2.6, 'eligible', false, 'gap'),
  ),
]

export const DEMO_PROGRAM: Program = {
  program_id: 'prog001',
  name: 'Westbrook University',
  head_coach: 'Marcus Reid',
  system: 'Pace-and-Space',
  season: '2025–26',
  record: '18-12',
  conference: 'SoCon',
  roster_gaps: [
    { position: 'PG', attribute_need: 'Playmaking & Vision', priority: 'HIGH' },
    { position: 'SF', attribute_need: 'Perimeter Defense', priority: 'MED' },
  ],
  portal_window_open: true,
}
