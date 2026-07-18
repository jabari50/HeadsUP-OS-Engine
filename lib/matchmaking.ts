import type { Player, Program, MatchResult } from './vgm-types'
import { FIT_WEIGHTS } from './vgm-constants'

/**
 * Score style fit: does the player's skill profile match the program system?
 * Returns 0–10.
 */
function styleScore(player: Player, program: Program): number {
  const { technical } = player
  switch (program.system) {
    case 'Pace-and-Space':
      // Values shooting, ball handling, athleticism
      return (technical.shooting * 0.4 + technical.ball_handling * 0.3 + technical.athleticism * 0.3)
    case 'Positionless':
      // Values passing, defense, versatility (averaged across all)
      return (technical.passing * 0.3 + technical.defense * 0.3 + technical.finishing * 0.2 + technical.ball_handling * 0.2)
    case 'Traditional':
      // Values finishing, rebounding, defense
      return (technical.finishing * 0.35 + technical.rebounding * 0.35 + technical.defense * 0.3)
    default:
      return 5
  }
}

/**
 * Score need fit: does the player fill a verified roster gap?
 * Returns 0–10.
 */
function needScore(player: Player, program: Program): number {
  const gap = program.roster_gaps.find(g => g.position === player.position)
  if (!gap) return 2
  const priorityBonus = gap.priority === 'HIGH' ? 3 : gap.priority === 'MED' ? 1.5 : 0
  return Math.min(10, 7 + priorityBonus)
}

/**
 * Score level fit: is the program's competition level realistic for player's OVR tier?
 * Returns 0–10. Simplified for demo — uses OVR as proxy for level fit.
 */
function levelScore(player: Player): number {
  if (player.ovr >= 85) return 10
  if (player.ovr >= 70) return 8
  if (player.ovr >= 55) return 6
  if (player.ovr >= 40) return 4
  return 2
}

/**
 * Score cultural fit: neural scores vs. program culture proxy.
 * Returns 0–10.
 */
function culturalScore(player: Player): number {
  const { neural } = player
  const avg = (neural.coachability + neural.composure + neural.resilience + neural.iq) / 4
  return Math.min(10, avg / 10)
}

/**
 * Compute a full Fit Score for a player against a program.
 * FIT_SCORE = (style×0.30) + (need×0.30) + (level×0.25) + (cultural×0.15)
 */
export function computeFitScore(player: Player, program: Program): number {
  const style = styleScore(player, program)
  const need = needScore(player, program)
  const level = levelScore(player)
  const cultural = culturalScore(player)
  const raw =
    style * FIT_WEIGHTS.STYLE +
    need * FIT_WEIGHTS.NEED +
    level * FIT_WEIGHTS.LEVEL +
    cultural * FIT_WEIGHTS.CULTURAL
  return Math.round(Math.min(10, raw) * 10) // Scale 0–10 → 0–100
}

/**
 * Rank a list of players against a program and return MatchResult[].
 * Sorted by fit_score descending.
 */
export function rankCandidates(players: Player[], program: Program): (Player & { fit_score: number })[] {
  return players
    .map(p => ({ ...p, fit_score: computeFitScore(p, program) }))
    .sort((a, b) => b.fit_score - a.fit_score)
}
