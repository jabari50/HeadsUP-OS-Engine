'use client'

import { useState } from 'react'
import { OVRBadge } from './OVRBadge'
import { TierBadge } from './TierBadge'
import { FitScoreBar } from './FitScoreBar'
import { ActivationPill } from './ActivationPill'
import { formatHeight } from '@/lib/utils'
import type { Player } from '@/lib/vgm-types'

interface ProspectRowProps {
  player: Player
  rank?: number
}

function AcademicBadge({ status }: { status: Player['academic']['eligibility_status'] }) {
  if (status === 'ineligible') {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-700 text-white">
        🚫 INELIGIBLE
      </span>
    )
  }
  if (status === 'at_risk') {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/40">
        ⚠ ACAD
      </span>
    )
  }
  return null
}

/** Expandable row for the Draft Board — shows OVR, tier, fit, activation */
export function ProspectRow({ player, rank }: ProspectRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-card-bg border border-border-subtle rounded-lg overflow-hidden animate-fade-in">
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-navy/60 transition-colors"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        {rank && (
          <span className="text-vgm-gray text-sm font-mono w-5 shrink-0">#{rank}</span>
        )}
        <OVRBadge ovr={player.ovr} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-cream">{player.full_name}</span>
            <TierBadge tier={player.tier} />
            <AcademicBadge status={player.academic.eligibility_status} />
          </div>
          <p className="text-xs text-vgm-gray mt-0.5">
            {player.position} · {player.class_year} · {player.high_school}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-36">
          {player.fit_score != null && (
            <FitScoreBar score={player.fit_score} showValue className="w-28" />
          )}
          <ActivationPill status={player.activation_status} />
        </div>
        <span className="text-vgm-gray text-xs ml-1">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border-subtle pt-3 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <div>
            <p className="text-[10px] text-vgm-gray uppercase tracking-widest mb-1">Physical</p>
            <p className="text-sm text-cream">{formatHeight(player.height_inches)} · {player.weight_lbs} lbs</p>
            <p className="text-xs text-vgm-gray mt-1">{player.aau_program}</p>
          </div>
          <div>
            <p className="text-[10px] text-vgm-gray uppercase tracking-widest mb-1">Technical</p>
            <div className="space-y-1">
              {Object.entries(player.technical).map(([k, v]) => (
                <FitScoreBar key={k} label={k.replace('_', ' ')} score={(v / 10) * 100} className="w-full" />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-vgm-gray uppercase tracking-widest mb-1">Neural</p>
            <div className="space-y-1">
              {Object.entries(player.neural).map(([k, v]) => (
                <FitScoreBar key={k} label={k} score={v} className="w-full" />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-vgm-gray uppercase tracking-widest mb-1">Academic</p>
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-xs">
                <span className="text-vgm-gray">GPA</span>
                <span className={
                  player.academic.gpa_tier === 'high' ? 'text-teal font-bold' :
                  player.academic.gpa_tier === 'solid' ? 'text-[#f5c518] font-bold' :
                  'text-[#ff6b6b] font-bold'
                }>{player.academic.gpa.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-vgm-gray">Eligibility</span>
                <span className={
                  player.academic.eligibility_status === 'eligible' ? 'text-teal' :
                  player.academic.eligibility_status === 'at_risk' ? 'text-[#ff6b6b]' : 'text-red-500'
                }>{player.academic.eligibility_status.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-vgm-gray">Core Courses</span>
                <span className={player.academic.core_courses_complete ? 'text-teal' : 'text-[#ff6b6b]'}>
                  {player.academic.core_courses_complete ? '✓ Complete' : '⚠ Incomplete'}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-vgm-gray uppercase tracking-widest mb-1">Acad. Score</p>
            <p className="text-2xl font-display font-bold text-[#ff6b6b]">{player.academic.academic_accountability_score}</p>
            {player.fit_score != null && (
              <div className="mt-3">
                <p className="text-[10px] text-vgm-gray uppercase tracking-widest mb-1">Fit Score</p>
                <p className="text-2xl font-display font-bold text-teal">{player.fit_score}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
