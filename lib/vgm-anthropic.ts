import Anthropic from '@anthropic-ai/sdk'
import type { Player, Program, MatchResult, RIBSection } from './vgm-types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-20250514'

/**
 * Call the Matchmaking Engine via Claude.
 * Returns a ranked array of program matches with sub-scores and rationale.
 */
export async function runMatchmaking(player: Player, programs: Program[]): Promise<MatchResult[]> {
  const systemPrompt = `You are The Virtual GM, an elite basketball front-office intelligence engine powered by HeadsUp OS. Given an athlete's OVR, tier, position, technical scores, neural scores, and academic profile, calculate Fit Scores for the provided programs using:

FIT_SCORE = (style_fit×0.25) + (need_fit×0.25) + (level_fit×0.20) + (cultural_fit×0.15) + (academic_fit×0.15)

Sub-scores are each 0–10. Final Fit Score is 0–100.
academic_fit: based on athlete's GPA tier, eligibility status, and academic accountability score. Higher scores for eligible, solid+ GPA, complete core courses.

Return a JSON array of program matches. Each element:
{
  "program_name": string,
  "fit_score": number (0-100),
  "style_fit": number (0-10),
  "need_fit": number (0-10),
  "level_fit": number (0-10),
  "cultural_fit": number (0-10),
  "academic_fit": number (0-10),
  "rationale": "2 sentences max",
  "activation_status": "locked" | "preview" | "full" | "exclusive",
  "gm_recommendation": "PURSUE" | "MONITOR" | "PASS",
  "next_action": "1 sentence specific next step"
}

Sort by fit_score descending. Zero hallucination — use only the provided data. Return valid JSON only, no markdown.`

  const userContent = `ATHLETE:
Name: ${player.full_name}
OVR: ${player.ovr} | Tier: ${player.tier} | Position: ${player.position} | Class: ${player.class_year}
Height: ${Math.floor(player.height_inches / 12)}'${player.height_inches % 12}" | Weight: ${player.weight_lbs}lbs

TECHNICAL SCORES (1-10):
Ball Handling: ${player.technical.ball_handling}
Shooting: ${player.technical.shooting}
Finishing: ${player.technical.finishing}
Passing: ${player.technical.passing}
Defense: ${player.technical.defense}
Rebounding: ${player.technical.rebounding}
Athleticism: ${player.technical.athleticism}

NEURAL SCORES (1-99):
Composure: ${player.neural.composure}
Coachability: ${player.neural.coachability}
IQ: ${player.neural.iq}
Resilience: ${player.neural.resilience}
Leadership: ${player.neural.leadership}
Drive: ${player.neural.drive}

ACADEMIC PROFILE (from HeadsUp OS):
GPA: ${player.academic.gpa} (${player.academic.gpa_tier})
Eligibility: ${player.academic.eligibility_status}
Core Courses: ${player.academic.core_courses_complete ? 'Complete' : 'Incomplete'}
Academic Accountability Score: ${player.academic.academic_accountability_score}
Program Fit: ${player.academic.program_fit}

PROGRAMS TO EVALUATE:
${programs.map((p, i) => `
${i + 1}. ${p.name} | System: ${p.system} | Conference: ${p.conference} | Record: ${p.record}
   Open Gaps: ${p.roster_gaps.map(g => `${g.position} (${g.attribute_need}, ${g.priority})`).join(', ')}
   Portal: ${p.portal_window_open ? 'OPEN' : 'CLOSED'}
`).join('')}`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(cleaned) as MatchResult[]
}

/**
 * Generate a Roster Intelligence Brief (RIB) via Claude.
 */
export async function generateRIB(program: Program, trackedPlayers: Player[]): Promise<RIBSection> {
  const systemPrompt = `You are The Virtual GM generating a weekly Roster Intelligence Brief (RIB) for a licensed operator. Format your response as valid JSON with these exact keys:
{
  "portal_entries": ["..."],        // Portal entries matching open gaps (2-3 items)
  "tier_changes": ["..."],          // OVR tier changes in tracked prospects (2-3 items)
  "competitor_signings": ["..."],   // Competitor confirmed signings (2-3 items)
  "recommended_actions": ["..."],   // Top 3 recommended actions — be direct, lead with the recommendation
  "academic_alerts": ["..."]        // Academic eligibility alerts for at-risk or ineligible prospects (1-3 items, or ["No academic eligibility changes this week."] if none)
}

Be direct. Lead with recommendations. Zero hallucination — only use provided data. No markdown, return valid JSON only.`

  const userContent = `PROGRAM: ${program.name} | Coach: ${program.head_coach} | System: ${program.system}
Record: ${program.record} | Conference: ${program.conference}
Portal: ${program.portal_window_open ? 'OPEN' : 'CLOSED'}

OPEN ROSTER GAPS:
${program.roster_gaps.map(g => `- ${g.position}: ${g.attribute_need} (Priority: ${g.priority})`).join('\n')}

TRACKED PROSPECTS (${trackedPlayers.length}):
${trackedPlayers.map(p => `- ${p.full_name} | ${p.position} | OVR: ${p.ovr} | Tier: ${p.tier} | Status: ${p.activation_status} | School: ${p.high_school} | GPA: ${p.academic?.gpa ?? 'N/A'} | Eligibility: ${p.academic?.eligibility_status ?? 'unknown'} | Core Courses: ${p.academic?.core_courses_complete ? 'Complete' : 'Incomplete'}`).join('\n')}`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
  const parsed = JSON.parse(cleaned)
  return { ...parsed, generated_at: new Date().toISOString() } as RIBSection
}
