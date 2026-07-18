'use client'

import { useEffect, useState } from 'react'
import { OVRBadge } from '@/components/gm/OVRBadge'
import { TierBadge } from '@/components/gm/TierBadge'
import { ActivationPill } from '@/components/gm/ActivationPill'
import { ACTIVATION_CYCLE, UNLOCK_CREDIT_COST, DEMO_OPERATOR } from '@/lib/vgm-constants'
import type { Player, ActivationStatus } from '@/lib/vgm-types'

export default function ActivationPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<number>(DEMO_OPERATOR.credits_remaining)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/virtual-gm/players')
      .then(r => r.json())
      .then(data => { setPlayers(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  function nextStatus(current: ActivationStatus): ActivationStatus {
    const idx = ACTIVATION_CYCLE.indexOf(current)
    return ACTIVATION_CYCLE[(idx + 1) % ACTIVATION_CYCLE.length]
  }

  async function cycleStatus(player: Player) {
    const to = nextStatus(player.activation_status)
    const cost = UNLOCK_CREDIT_COST[to] ?? 0
    if (cost > credits) {
      alert('Insufficient unlock credits.')
      return
    }
    setUpdating(player.player_id)
    try {
      const res = await fetch('/api/virtual-gm/activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: player.player_id, to_status: to }),
      })
      if (!res.ok) throw new Error('Update failed')
      setPlayers(prev => prev.map(p =>
        p.player_id === player.player_id ? { ...p, activation_status: to } : p,
      ))
      setCredits(c => c - cost)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating status')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">Activation Lock Manager</h1>
          <p className="text-xs text-vgm-gray mt-0.5">Click any card to cycle activation status</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-bold text-teal">{credits}</p>
          <p className="text-[10px] text-vgm-gray uppercase tracking-wider">Unlock Credits</p>
        </div>
      </div>

      {/* Credit cost legend */}
      <div className="flex flex-wrap gap-3 mb-5 text-xs text-vgm-gray">
        <span>Preview → <span className="text-cream">Free</span></span>
        <span>Full Unlock → <span className="text-teal">1 credit</span></span>
        <span>Exclusive → <span className="text-gold">3 credits</span></span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 bg-card-bg border border-border-subtle rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map(player => {
            const next = nextStatus(player.activation_status)
            const cost = UNLOCK_CREDIT_COST[next] ?? 0
            const canAfford = cost <= credits
            const isUpdating = updating === player.player_id

            return (
              <button
                key={player.player_id}
                onClick={() => cycleStatus(player)}
                disabled={isUpdating || !canAfford}
                className={`relative bg-card-bg border border-border-subtle rounded-xl p-4 text-left hover:border-teal transition-all group ${
                  isUpdating ? 'opacity-50 cursor-wait' : !canAfford ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <OVRBadge ovr={player.ovr} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-cream text-sm truncate">{player.full_name}</p>
                    <p className="text-xs text-vgm-gray">{player.position} · {player.class_year}</p>
                  </div>
                </div>
                <TierBadge tier={player.tier} className="mb-3" />
                <div className="flex items-center justify-between">
                  <ActivationPill status={player.activation_status} />
                  <span className="text-[10px] text-vgm-gray group-hover:text-teal transition-colors">
                    → {next}{cost > 0 ? ` (${cost}cr)` : ''}
                  </span>
                </div>
                {isUpdating && (
                  <div className="absolute inset-0 bg-dark-bg/60 rounded-xl flex items-center justify-center">
                    <span className="text-teal text-xs">Updating…</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
