'use client'

import { useEffect, useState } from 'react'
import type { Player } from '@/lib/vgm-types'

const GPA_TIER_STYLES = {
  high:     { badge: 'bg-teal/20 text-teal border border-teal/40',           label: 'HIGH' },
  solid:    { badge: 'bg-[#f5c518]/20 text-[#f5c518] border border-[#f5c518]/40', label: 'SOLID' },
  at_risk:  { badge: 'bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/40', label: 'AT-RISK' },
}

const ELIG_STYLES = {
  eligible:   { cls: 'text-teal',     label: 'ELIGIBLE' },
  at_risk:    { cls: 'text-[#ff6b6b]', label: 'AT-RISK' },
  ineligible: { cls: 'text-red-500',  label: 'INELIGIBLE' },
}

export default function AcademicAccountabilityPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/virtual-gm/players')
      .then(r => r.json())
      .then(data => { setPlayers(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const atRiskCount = players.filter(p => p.academic.eligibility_status !== 'eligible').length

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full pb-20 md:pb-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-cream">Academic Accountability</h1>
        <p className="text-xs text-vgm-gray mt-0.5">
          Read-only academic signals from athlete HeadsUp OS profiles
          {!loading && atRiskCount > 0 && (
            <span className="ml-2 text-[#ff6b6b] font-semibold">— {atRiskCount} prospect{atRiskCount > 1 ? 's' : ''} require attention</span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-card-bg border border-border-subtle rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-card-bg border border-border-subtle rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_100px_90px_80px_80px] gap-3 px-4 py-2 border-b border-border-subtle">
            <span className="text-[10px] text-vgm-gray uppercase tracking-widest">Player</span>
            <span className="text-[10px] text-vgm-gray uppercase tracking-widest text-center">GPA Tier</span>
            <span className="text-[10px] text-vgm-gray uppercase tracking-widest text-center">Eligibility</span>
            <span className="text-[10px] text-vgm-gray uppercase tracking-widest text-center">Acad. Score</span>
            <span className="text-[10px] text-vgm-gray uppercase tracking-widest text-center">Core</span>
            <span className="text-[10px] text-vgm-gray uppercase tracking-widest text-center">Fit</span>
          </div>

          <div className="divide-y divide-border-subtle">
            {players.map(player => {
              const { gpa_tier, eligibility_status, core_courses_complete, academic_accountability_score, program_fit, gpa } = player.academic
              const gpaStyle = GPA_TIER_STYLES[gpa_tier]
              const eligStyle = ELIG_STYLES[eligibility_status]
              return (
                <div
                  key={player.player_id}
                  className={`grid grid-cols-[1fr_80px_100px_90px_80px_80px] gap-3 px-4 py-3 items-center ${
                    eligibility_status === 'ineligible' ? 'bg-red-900/10' :
                    eligibility_status === 'at_risk' ? 'bg-[#ff6b6b]/5' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-cream">{player.full_name}</p>
                    <p className="text-xs text-vgm-gray">{player.position} · GPA {gpa.toFixed(1)}</p>
                  </div>
                  <div className="flex justify-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${gpaStyle.badge}`}>
                      {gpaStyle.label}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className={`text-xs font-bold ${eligStyle.cls}`}>{eligStyle.label}</span>
                  </div>
                  <div className="text-center">
                    <span className="font-display text-xl font-bold text-cream">{academic_accountability_score}</span>
                  </div>
                  <div className="text-center">
                    <span className={core_courses_complete ? 'text-teal text-sm' : 'text-[#ff6b6b] text-sm'}>
                      {core_courses_complete ? '✓' : '⚠'}
                    </span>
                    <p className="text-[10px] text-vgm-gray">{core_courses_complete ? 'Complete' : 'Incomplete'}</p>
                  </div>
                  <div className="text-center">
                    <span className={`text-[10px] font-bold ${program_fit === 'aligned' ? 'text-teal' : 'text-[#ff6b6b]'}`}>
                      {program_fit === 'aligned' ? 'ALIGNED' : 'GAP'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-vgm-gray mt-4 italic text-center">
        Academic data sourced from athlete&apos;s HeadsUp OS Academic Profile. Raw transcripts are athlete-owned and not accessible here.
      </p>
    </div>
  )
}
