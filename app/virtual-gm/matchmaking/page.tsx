'use client'

import { useEffect, useState } from 'react'
import { FitScoreBar } from '@/components/gm/FitScoreBar'
import { OVRBadge } from '@/components/gm/OVRBadge'
import { TierBadge } from '@/components/gm/TierBadge'
import { ActivationPill } from '@/components/gm/ActivationPill'
import type { Player, MatchResult } from '@/lib/vgm-types'

interface ExtendedMatchResult extends MatchResult {
  gm_recommendation?: 'PURSUE' | 'MONITOR' | 'PASS'
  next_action?: string
}

const REC_STYLES = {
  PURSUE: 'bg-teal text-navy',
  MONITOR: 'bg-gold text-navy',
  PASS: 'bg-[#374151] text-white',
}

export default function MatchmakingPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [results, setResults] = useState<ExtendedMatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topRec, setTopRec] = useState<ExtendedMatchResult | null>(null)

  useEffect(() => {
    fetch('/api/virtual-gm/players')
      .then(r => r.json())
      .then(data => setPlayers(Array.isArray(data) ? data : []))
  }, [])

  async function runMatch() {
    if (!selectedPlayer) return
    setLoading(true)
    setError(null)
    setResults([])
    setTopRec(null)
    try {
      const res = await fetch('/api/virtual-gm/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: selectedPlayer }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Matchmaking failed')
      const sorted: ExtendedMatchResult[] = data.results ?? []
      setResults(sorted)
      setTopRec(sorted[0] ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full pb-20 md:pb-6">
      <h1 className="font-display text-2xl font-bold text-cream mb-1">Matchmaking Engine</h1>
      <p className="text-xs text-vgm-gray mb-5">AI-powered athlete → program fit scoring via HeadsUp OS</p>

      {/* Athlete selector */}
      <div className="bg-card-bg border border-border-subtle rounded-xl p-5 mb-5">
        <h2 className="text-xs text-vgm-gray uppercase tracking-widest mb-3">Select Athlete</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {players.map(p => (
            <button
              key={p.player_id}
              onClick={() => { setSelectedPlayer(p); setResults([]); setTopRec(null) }}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                selectedPlayer?.player_id === p.player_id
                  ? 'border-teal bg-teal/10'
                  : 'border-border-subtle hover:border-vgm-gray'
              }`}
            >
              <OVRBadge ovr={p.ovr} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cream truncate">{p.full_name}</p>
                <p className="text-xs text-vgm-gray">{p.position} · {p.class_year}</p>
              </div>
              <TierBadge tier={p.tier} />
            </button>
          ))}
        </div>

        {selectedPlayer && (
          <div className="border-t border-border-subtle pt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <OVRBadge ovr={selectedPlayer.ovr} size="lg" />
              <div>
                <p className="font-semibold text-cream">{selectedPlayer.full_name}</p>
                <div className="flex gap-2 mt-1">
                  <TierBadge tier={selectedPlayer.tier} />
                  <ActivationPill status={selectedPlayer.activation_status} />
                </div>
              </div>
            </div>
            <button
              onClick={runMatch}
              disabled={loading}
              className="bg-teal text-navy font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Running AI…' : 'Run Matchmaking →'}
            </button>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-card-bg border border-border-subtle rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">{error}</div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {/* GM Recommendation pill */}
          {topRec?.gm_recommendation && (
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-vgm-gray">GM Recommendation:</span>
              <span className={`font-display font-bold text-sm px-3 py-1 rounded-full ${REC_STYLES[topRec.gm_recommendation]}`}>
                {topRec.gm_recommendation}
              </span>
              {topRec.next_action && (
                <span className="text-xs text-cream">— {topRec.next_action}</span>
              )}
            </div>
          )}

          {results.map((r, i) => (
            <div key={i} className="bg-card-bg border border-border-subtle rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-[10px] text-vgm-gray uppercase tracking-widest">Match #{i + 1}</p>
                  <h3 className="font-display text-xl font-bold text-cream mt-0.5">{r.program_name}</h3>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-4xl font-bold text-teal">{r.fit_score}</p>
                  <p className="text-[10px] text-vgm-gray">Fit Score</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <FitScoreBar label="Style Fit" score={r.style_fit * 10} color="teal" />
                <FitScoreBar label="Need Fit" score={r.need_fit * 10} color="teal" />
                <FitScoreBar label="Level Fit" score={r.level_fit * 10} color="gold" />
                <FitScoreBar label="Cultural Fit" score={r.cultural_fit * 10} color="purple" />
                <div className="col-span-2">
                  <FitScoreBar label="Academic Fit" score={(r.academic_fit ?? 0) * 10} color="coral" />
                  <p className="text-[10px] text-vgm-gray mt-1 italic">Sourced from athlete&apos;s HeadsUp OS Academic Profile</p>
                </div>
              </div>

              <p className="text-sm text-vgm-gray border-t border-border-subtle pt-3">{r.rationale}</p>

              <div className="flex items-center justify-between mt-3">
                <ActivationPill status={r.activation_status} />
                {r.gm_recommendation && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${REC_STYLES[r.gm_recommendation]}`}>
                    {r.gm_recommendation}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
