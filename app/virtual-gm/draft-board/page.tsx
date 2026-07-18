'use client'

import { useEffect, useState, useMemo } from 'react'
import { ProspectRow } from '@/components/gm/ProspectRow'
import type { Player, Position, Tier, ActivationStatus } from '@/lib/vgm-types'
import { POSITIONS } from '@/lib/vgm-constants'

const TIERS: Tier[] = ['Elite', 'Impact', 'Contributor', 'Developing', 'Prospect']
const ACTIVATIONS: ActivationStatus[] = ['locked', 'preview', 'full', 'exclusive']

export default function DraftBoardPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPos, setFilterPos] = useState<Position | 'ALL'>('ALL')
  const [filterTier, setFilterTier] = useState<Tier | 'ALL'>('ALL')
  const [filterActivation, setFilterActivation] = useState<ActivationStatus | 'ALL'>('ALL')
  const [filterYear, setFilterYear] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'ovr' | 'fit_score' | 'academic'>('ovr')

  useEffect(() => {
    fetch('/api/virtual-gm/players')
      .then(r => r.json())
      .then(data => { setPlayers(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const classYears = useMemo(() => ['ALL', ...new Set(players.map(p => p.class_year))], [players])

  const filtered = useMemo(() => {
    return players
      .filter(p => filterPos === 'ALL' || p.position === filterPos)
      .filter(p => filterTier === 'ALL' || p.tier === filterTier)
      .filter(p => filterActivation === 'ALL' || p.activation_status === filterActivation)
      .filter(p => filterYear === 'ALL' || p.class_year === filterYear)
      .sort((a, b) =>
        sortBy === 'ovr' ? b.ovr - a.ovr :
        sortBy === 'academic' ? b.academic.academic_accountability_score - a.academic.academic_accountability_score :
        (b.fit_score ?? 0) - (a.fit_score ?? 0)
      )
  }, [players, filterPos, filterTier, filterActivation, filterYear, sortBy])

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">Draft Board</h1>
          <p className="text-xs text-vgm-gray mt-0.5">{filtered.length} prospects {filterPos !== 'ALL' || filterTier !== 'ALL' ? '(filtered)' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-vgm-gray">Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'ovr' | 'fit_score' | 'academic')}
            className="bg-card-bg border border-border-subtle text-cream text-xs rounded px-2 py-1"
          >
            <option value="ovr">OVR</option>
            <option value="fit_score">Fit Score</option>
            <option value="academic">Academic Score</option>
          </select>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        <FilterSelect label="Position" value={filterPos} onChange={v => setFilterPos(v as Position | 'ALL')} options={['ALL', ...POSITIONS]} />
        <FilterSelect label="Tier" value={filterTier} onChange={v => setFilterTier(v as Tier | 'ALL')} options={['ALL', ...TIERS]} />
        <FilterSelect label="Activation" value={filterActivation} onChange={v => setFilterActivation(v as ActivationStatus | 'ALL')} options={['ALL', ...ACTIVATIONS]} />
        <FilterSelect label="Class" value={filterYear} onChange={setFilterYear} options={classYears} />
        {(filterPos !== 'ALL' || filterTier !== 'ALL' || filterActivation !== 'ALL' || filterYear !== 'ALL') && (
          <button
            onClick={() => { setFilterPos('ALL'); setFilterTier('ALL'); setFilterActivation('ALL'); setFilterYear('ALL') }}
            className="text-xs text-teal hover:underline px-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Prospect list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-card-bg border border-border-subtle rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-vgm-gray py-16">No prospects match your filters.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p, i) => <ProspectRow key={p.player_id} player={p} rank={i + 1} />)}
        </div>
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-vgm-gray uppercase tracking-wider">{label}:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-card-bg border border-border-subtle text-cream text-xs rounded px-2 py-1"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
