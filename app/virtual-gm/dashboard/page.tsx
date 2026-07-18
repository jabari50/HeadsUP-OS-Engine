'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RosterGapCard } from '@/components/gm/RosterGapCard'
import { OVRBadge } from '@/components/gm/OVRBadge'
import { TierBadge } from '@/components/gm/TierBadge'
import { ActivationPill } from '@/components/gm/ActivationPill'
import { DEMO_PROGRAM } from '@/data/seed'
import type { Player } from '@/lib/vgm-types'

const RECOMMENDED_ACTIONS = [
  { priority: 'HIGH', action: 'Pursue Marcus Webb (PG, OVR 84) — fills top-priority playmaking gap. Portal window open.', href: '/virtual-gm/matchmaking' },
  { priority: 'MED', action: 'Preview unlock Darius Cole (SF) to evaluate perimeter defense potential.', href: '/virtual-gm/activation' },
  { priority: 'LOW', action: 'Generate this week\'s RIB to track competitor portal moves.', href: '/virtual-gm/rib' },
]

export default function DashboardPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [seeded, setSeeded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      // Auto-seed if empty
      const status = await fetch('/api/virtual-gm/seed').then(r => r.json())
      if (!status.seeded) {
        await fetch('/api/virtual-gm/seed', { method: 'POST' })
      }
      setSeeded(true)
      const data = await fetch('/api/virtual-gm/players').then(r => r.json())
      setPlayers(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    init()
  }, [])

  const tracked = players.length
  const pendingUnlocks = players.filter(p => p.activation_status === 'locked').length
  const topPlayers = players.slice(0, 3)

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full pb-20 md:pb-6">
      {/* Program header */}
      <div className="bg-card-bg border border-border-subtle rounded-xl p-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-cream tracking-wide">{DEMO_PROGRAM.name}</h1>
            <p className="text-vgm-gray text-sm mt-1">
              Head Coach: <span className="text-cream">{DEMO_PROGRAM.head_coach}</span>
              {' · '}System: <span className="text-teal">{DEMO_PROGRAM.system}</span>
              {' · '}Conference: <span className="text-cream">{DEMO_PROGRAM.conference}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-4xl font-bold text-teal">{DEMO_PROGRAM.record}</p>
            <p className="text-xs text-vgm-gray">{DEMO_PROGRAM.season}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Roster Needs', value: DEMO_PROGRAM.roster_gaps.length, color: 'text-red-400' },
              { label: 'Tracked', value: loading ? '—' : tracked, color: 'text-teal' },
              { label: 'Pending Unlocks', value: loading ? '—' : pendingUnlocks, color: 'text-gold' },
            ].map(stat => (
              <div key={stat.label} className="bg-card-bg border border-border-subtle rounded-lg p-4 text-center">
                <p className={`font-display text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-vgm-gray mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Roster gaps */}
          <div>
            <h2 className="text-xs text-vgm-gray uppercase tracking-widest mb-3">Roster Gaps</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_PROGRAM.roster_gaps.map(gap => (
                <RosterGapCard key={gap.position} gap={gap} />
              ))}
            </div>
          </div>

          {/* Top tracked prospects */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs text-vgm-gray uppercase tracking-widest">Top Tracked Prospects</h2>
              <Link href="/virtual-gm/draft-board" className="text-xs text-teal hover:underline">View All →</Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-card-bg border border-border-subtle rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {topPlayers.map((p, i) => (
                  <div key={p.player_id} className="bg-card-bg border border-border-subtle rounded-lg px-4 py-3 flex items-center gap-3">
                    <span className="text-vgm-gray text-sm font-mono w-4">#{i + 1}</span>
                    <OVRBadge ovr={p.ovr} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-cream">{p.full_name}</p>
                      <p className="text-xs text-vgm-gray">{p.position} · {p.class_year}</p>
                    </div>
                    <TierBadge tier={p.tier} />
                    <ActivationPill status={p.activation_status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommended actions sidebar */}
        <div>
          <h2 className="text-xs text-vgm-gray uppercase tracking-widest mb-3">Top 3 Recommended Actions</h2>
          <div className="space-y-3">
            {RECOMMENDED_ACTIONS.map((item, i) => (
              <Link key={i} href={item.href} className="block bg-card-bg border border-border-subtle rounded-lg p-4 hover:border-teal transition-colors group">
                <div className="flex items-start gap-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                    item.priority === 'HIGH' ? 'bg-red-600 text-white' :
                    item.priority === 'MED' ? 'bg-[#D97706] text-white' : 'bg-[#374151] text-white'
                  }`}>
                    {item.priority}
                  </span>
                  <p className="text-sm text-cream group-hover:text-teal transition-colors">{item.action}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Portal status */}
          <div className="mt-4 bg-card-bg border border-border-subtle rounded-lg p-4">
            <p className="text-xs text-vgm-gray uppercase tracking-widest mb-2">Portal Status</p>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal animate-pulse" />
              <span className="text-teal font-semibold text-sm">OPEN</span>
            </div>
            <p className="text-xs text-vgm-gray mt-2">Transfer portal is active. Monitor tracked prospects for eligibility changes.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
