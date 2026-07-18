'use client'

import { useState, useMemo } from 'react'

type Tier = '1+' | '1' | '2' | '3'
type PEG = 'Franchise' | 'Core' | 'Top Starter' | 'Starter' | 'Key Reserve' | 'Reserve'
type Trend = 'up' | 'down' | 'steady'
type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'SG/SF' | 'PF/C' | 'G' | 'F'

interface Prospect {
  rank: number
  tier: Tier
  name: string
  pos: Position
  ht: string
  wt: number
  wing: string
  age: number
  school: string
  schoolColor: string
  class: string
  modelRank: number
  peg: PEG
  trend: Trend
  notes?: string
  hometown?: string
}

const PROSPECTS: Prospect[] = [
  { rank: 1,  tier: '1+', name: 'Jalen Marquette',  pos: 'PG',    ht: "6'4\"",  wt: 190, wing: "6'6\"",  age: 19.6, school: 'Duke',         schoolColor: '#003087', class: 'Freshman',   modelRank: 1,  peg: 'Franchise',   trend: 'up',     hometown: 'Atlanta, GA' },
  { rank: 2,  tier: '1+', name: 'Mason Caldwell',   pos: 'SG',    ht: "6'6\"",  wt: 205, wing: "6'9\"",  age: 19.8, school: 'Rutgers',       schoolColor: '#CC0033', class: 'Freshman',   modelRank: 2,  peg: 'Franchise',   trend: 'up',     hometown: 'Dallas, TX' },
  { rank: 3,  tier: '1+', name: 'Elijah Booker',    pos: 'SF',    ht: "6'8\"",  wt: 210, wing: "7'0\"",  age: 20.0, school: 'Kansas',        schoolColor: '#0051A5', class: 'Sophomore',  modelRank: 3,  peg: 'Franchise',   trend: 'steady', hometown: 'Memphis, TN' },
  { rank: 4,  tier: '1+', name: 'Darius King',      pos: 'PF',    ht: "6'9\"",  wt: 225, wing: "7'1\"",  age: 19.7, school: 'UCLA',          schoolColor: '#2D68C4', class: 'Freshman',   modelRank: 4,  peg: 'Core',        trend: 'up',     hometown: 'Inglewood, CA' },
  { rank: 5,  tier: '1+', name: 'Braylen Carter',   pos: 'C',     ht: "7'1\"",  wt: 245, wing: "7'5\"",  age: 20.1, school: 'Tennessee',     schoolColor: '#FF8200', class: 'Sophomore',  modelRank: 6,  peg: 'Core',        trend: 'up',     hometown: 'Nashville, TN' },
  { rank: 6,  tier: '1+', name: 'Caleb Rivers',     pos: 'SG',    ht: "6'5\"",  wt: 195, wing: "6'7\"",  age: 19.5, school: 'Kentucky',      schoolColor: '#0033A0', class: 'Freshman',   modelRank: 7,  peg: 'Core',        trend: 'up',     hometown: 'Chicago, IL' },
  { rank: 7,  tier: '1+', name: 'Isaac Moore',      pos: 'PG',    ht: "6'3\"",  wt: 185, wing: "6'5\"",  age: 19.4, school: 'Villanova',     schoolColor: '#003594', class: 'Freshman',   modelRank: 8,  peg: 'Core',        trend: 'down',   hometown: 'Philadelphia, PA' },
  { rank: 8,  tier: '1+', name: 'Trey Donovan',     pos: 'SF',    ht: "6'7\"",  wt: 210, wing: "6'10\"", age: 19.9, school: 'UConn',         schoolColor: '#003087', class: 'Freshman',   modelRank: 10, peg: 'Top Starter', trend: 'steady', hometown: 'Hartford, CT' },
  { rank: 9,  tier: '1',  name: 'Kobe Langston',    pos: 'PF',    ht: "6'10\"", wt: 230, wing: "7'2\"",  age: 20.2, school: 'Auburn',        schoolColor: '#0C2340', class: 'Sophomore',  modelRank: 9,  peg: 'Top Starter', trend: 'up',     hometown: 'Birmingham, AL' },
  { rank: 10, tier: '1',  name: 'Nolan Hayes',      pos: 'SG',    ht: "6'6\"",  wt: 200, wing: "6'9\"",  age: 19.6, school: 'Iowa State',    schoolColor: '#C8102E', class: 'Freshman',   modelRank: 11, peg: 'Top Starter', trend: 'steady', hometown: 'Des Moines, IA' },
  { rank: 11, tier: '1',  name: 'Jace Whitaker',    pos: 'SF',    ht: "6'8\"",  wt: 215, wing: "7'1\"",  age: 19.8, school: 'Arizona',       schoolColor: '#003366', class: 'Freshman',   modelRank: 12, peg: 'Top Starter', trend: 'up',     hometown: 'Tucson, AZ' },
  { rank: 12, tier: '1',  name: 'Camden Powell',    pos: 'PG',    ht: "6'2\"",  wt: 180, wing: "6'4\"",  age: 19.3, school: 'Houston',       schoolColor: '#C8102E', class: 'Sophomore',  modelRank: 14, peg: 'Top Starter', trend: 'down',   hometown: 'Houston, TX' },
  { rank: 13, tier: '1',  name: 'Ryan Ellis',       pos: 'PF/C',  ht: "6'10\"", wt: 235, wing: "7'3\"",  age: 20.0, school: 'Texas',         schoolColor: '#BF5700', class: 'Freshman',   modelRank: 5,  peg: 'Starter',     trend: 'down',   hometown: 'Austin, TX' },
  { rank: 14, tier: '1',  name: 'Jalen Knox',       pos: 'SG',    ht: "6'4\"",  wt: 190, wing: "6'8\"",  age: 19.4, school: 'Michigan State',schoolColor: '#18453B', class: 'Freshman',   modelRank: 13, peg: 'Starter',     trend: 'steady', hometown: 'Flint, MI' },
  { rank: 15, tier: '1',  name: 'Marcus Bell',      pos: 'SF',    ht: "6'7\"",  wt: 205, wing: "6'10\"", age: 19.7, school: 'Florida',       schoolColor: '#003087', class: 'Freshman',   modelRank: 15, peg: 'Starter',     trend: 'up',     hometown: 'Gainesville, FL' },
  { rank: 16, tier: '1',  name: 'Jordan Pierce',    pos: 'PG',    ht: "6'3\"",  wt: 185, wing: "6'5\"",  age: 19.6, school: 'Illinois',      schoolColor: '#E84A27', class: 'Freshman',   modelRank: 16, peg: 'Starter',     trend: 'steady', hometown: 'Chicago, IL' },
  { rank: 17, tier: '1',  name: 'Malik Thompson',   pos: 'C',     ht: "7'0\"",  wt: 240, wing: "7'3\"",  age: 20.1, school: 'BYU',           schoolColor: '#002E5D', class: 'Sophomore',  modelRank: 17, peg: 'Key Reserve', trend: 'up',     hometown: 'Salt Lake City, UT' },
  { rank: 18, tier: '1',  name: 'Evan Brooks',      pos: 'SG/SF', ht: "6'6\"",  wt: 200, wing: "6'9\"",  age: 19.5, school: 'Oregon',        schoolColor: '#154733', class: 'Freshman',   modelRank: 18, peg: 'Key Reserve', trend: 'steady', hometown: 'Portland, OR' },
  { rank: 19, tier: '2',  name: 'Devon Strickland', pos: 'G',     ht: "6'3\"",  wt: 185, wing: "6'6\"",  age: 20.3, school: 'Gonzaga',       schoolColor: '#002161', class: 'Junior',     modelRank: 20, peg: 'Starter',     trend: 'up',     hometown: 'Spokane, WA' },
  { rank: 20, tier: '2',  name: 'Trayce Coleman',   pos: 'F',     ht: "6'8\"",  wt: 220, wing: "7'0\"",  age: 20.5, school: 'Baylor',        schoolColor: '#154734', class: 'Sophomore',  modelRank: 22, peg: 'Key Reserve', trend: 'steady', hometown: 'Waco, TX' },
  { rank: 21, tier: '2',  name: 'Aaron Whitfield',  pos: 'C',     ht: "6'11\"", wt: 245, wing: "7'4\"",  age: 21.0, school: 'Arkansas',      schoolColor: '#9D2235', class: 'Junior',     modelRank: 19, peg: 'Key Reserve', trend: 'down',   hometown: 'Little Rock, AR' },
  { rank: 22, tier: '2',  name: 'Quincy Lawson',    pos: 'SF',    ht: "6'7\"",  wt: 210, wing: "7'0\"",  age: 20.8, school: 'Purdue',        schoolColor: '#CEB888', class: 'Sophomore',  modelRank: 24, peg: 'Reserve',     trend: 'up',     hometown: 'Indianapolis, IN' },
  { rank: 23, tier: '3',  name: 'Brandon Cole',     pos: 'PG',    ht: "6'1\"",  wt: 175, wing: "6'3\"",  age: 21.5, school: 'VCU',           schoolColor: '#000000', class: 'Senior',     modelRank: 30, peg: 'Reserve',     trend: 'steady', hometown: 'Richmond, VA' },
  { rank: 24, tier: '3',  name: 'Kyle Reeves',      pos: 'SG',    ht: "6'4\"",  wt: 195, wing: "6'7\"",  age: 22.0, school: 'Xavier',        schoolColor: '#003057', class: 'Senior',     modelRank: 28, peg: 'Reserve',     trend: 'down',   hometown: 'Cincinnati, OH' },
]

const TIER_CONFIG: Record<Tier, { label: string; bg: string; text: string; borderColor: string }> = {
  '1+': { label: '1+', bg: 'bg-purple-600',   text: 'text-white', borderColor: 'border-purple-500' },
  '1':  { label: '1',  bg: 'bg-blue-600',     text: 'text-white', borderColor: 'border-blue-500' },
  '2':  { label: '2',  bg: 'bg-teal',         text: 'text-dark-bg', borderColor: 'border-teal' },
  '3':  { label: '3',  bg: 'bg-gold',         text: 'text-dark-bg', borderColor: 'border-gold' },
}

const PEG_COLOR: Record<PEG, string> = {
  'Franchise':   'text-purple-400',
  'Core':        'text-blue-400',
  'Top Starter': 'text-teal',
  'Starter':     'text-green-400',
  'Key Reserve': 'text-yellow-400',
  'Reserve':     'text-gray-400',
}

const TABS = ['BOARD', 'BIG BOARD', 'TEAM NEEDS', 'WATCH LIST', 'WORKOUTS', 'INTERVIEWS', 'MEDICALS', 'NOTES']
const POSITIONS = ['All Positions', 'PG', 'SG', 'SF', 'PF', 'C', 'G', 'F']

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'up')     return <span className="text-green-400 text-lg font-bold">↑</span>
  if (trend === 'down')   return <span className="text-red-400  text-lg font-bold">↓</span>
  return                         <span className="text-gray-500 text-lg font-bold">—</span>
}

function TierBadge({ tier }: { tier: Tier }) {
  const cfg = TIER_CONFIG[tier]
  return (
    <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

type SortKey = keyof Pick<Prospect, 'rank' | 'name' | 'pos' | 'age' | 'wt' | 'modelRank' | 'peg' | 'trend'>

export default function DraftBoard() {
  const [activeTab, setActiveTab] = useState('BOARD')
  const [posFilter, setPosFilter] = useState('All Positions')
  const [tierFilter, setTierFilter] = useState<Tier | 'All'>('All')
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Prospect | null>(null)
  const lastUpdated = 'JUN 6, 2026  |  9:42 AM'

  const filtered = useMemo(() => {
    let data = [...PROSPECTS]
    if (search)                  data = data.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.school.toLowerCase().includes(search.toLowerCase()))
    if (posFilter !== 'All Positions') data = data.filter(p => p.pos.includes(posFilter))
    if (tierFilter !== 'All')    data = data.filter(p => p.tier === tierFilter)
    data.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return data
  }, [search, posFilter, tierFilter, sortKey, sortDir])

  const tierCounts = useMemo(() => ({
    'All': PROSPECTS.length,
    '1+': PROSPECTS.filter(p => p.tier === '1+').length,
    '1':  PROSPECTS.filter(p => p.tier === '1').length,
    '2':  PROSPECTS.filter(p => p.tier === '2').length,
    '3':  PROSPECTS.filter(p => p.tier === '3').length,
  }), [])

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k
    return (
      <th
        className={`px-3 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors ${active ? 'text-teal' : 'text-gray-400 hover:text-cream'}`}
        onClick={() => handleSort(k)}
      >
        {label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
      </th>
    )
  }

  const ranked   = PROSPECTS.length
  const tier1plus = tierCounts['1+']
  const tier1    = tierCounts['1']
  const tier2    = tierCounts['2']
  const tier3    = tierCounts['3']

  return (
    <div className="min-h-screen bg-dark-bg text-cream font-sans">

      {/* Header */}
      <div className="bg-navy border-b border-border-subtle px-6 py-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal flex items-center justify-center text-dark-bg font-display font-bold text-xl shadow-lg">
              HU
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-cream tracking-wide leading-none">NBA DRAFT BOARD</h1>
              <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase">2025 NBA Draft &nbsp;|&nbsp; HeadsUP Intelligence — Internal Use Only</p>
            </div>
          </div>

          {/* Stat Chips */}
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { label: 'Players Tracked', value: 612 },
              { label: 'Players Ranked',  value: ranked },
              { label: 'Tier 1+',         value: tier1plus },
              { label: 'Tier 1',          value: tier1 },
              { label: 'Tier 2',          value: tier2 },
              { label: 'Tier 3',          value: tier3 },
            ].map(s => (
              <div key={s.label} className="text-center bg-card-bg border border-border-subtle rounded-lg px-4 py-2 min-w-[80px]">
                <div className="text-2xl font-display font-bold text-teal">{s.value}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
            <div className="text-right">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Last Updated</div>
              <div className="text-xs text-gray-300 font-mono mt-0.5">{lastUpdated}</div>
              <button className="mt-1 text-[10px] text-teal border border-teal rounded px-2 py-0.5 hover:bg-teal hover:text-dark-bg transition-colors">↺ REFRESH</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-navy border-b border-border-subtle px-6 flex items-center gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab
                ? 'text-teal border-teal'
                : 'text-gray-400 border-transparent hover:text-cream'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="px-6 py-3 flex items-center gap-3 flex-wrap border-b border-border-subtle bg-navy/50">
        <input
          type="text"
          placeholder="Search player or school..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-card-bg border border-border-subtle rounded px-3 py-1.5 text-sm text-cream placeholder-gray-500 focus:outline-none focus:border-teal w-52"
        />
        <select
          value={posFilter}
          onChange={e => setPosFilter(e.target.value)}
          className="bg-card-bg border border-border-subtle rounded px-3 py-1.5 text-sm text-cream focus:outline-none focus:border-teal"
        >
          {POSITIONS.map(p => <option key={p}>{p}</option>)}
        </select>
        <div className="flex items-center gap-1">
          {(['All', '1+', '1', '2', '3'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                tierFilter === t
                  ? t === 'All' ? 'bg-teal text-dark-bg' : `${TIER_CONFIG[t as Tier]?.bg} ${TIER_CONFIG[t as Tier]?.text}`
                  : 'bg-card-bg text-gray-400 border border-border-subtle hover:text-cream'
              }`}
            >
              {t === 'All' ? 'All Tiers' : `Tier ${t}`}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-gray-500">{filtered.length} prospects</div>
      </div>

      {/* Main Content */}
      <div className="flex" style={{ height: 'calc(100vh - 230px)' }}>

        {/* Table */}
        <div className={`overflow-auto flex-1 transition-all ${selected ? 'mr-80' : ''}`}>
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-navy border-b-2 border-border-subtle">
                <SortHeader label="Rank"       k="rank" />
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Tier</th>
                <SortHeader label="Player"     k="name" />
                <SortHeader label="Pos"        k="pos" />
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Ht</th>
                <SortHeader label="Wt"         k="wt" />
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Wing</th>
                <SortHeader label="Age"        k="age" />
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">School / Team</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Class</th>
                <SortHeader label="Model Rank" k="modelRank" />
                <SortHeader label="PEG"        k="peg" />
                <SortHeader label="Trend"      k="trend" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const isSelected = selected?.name === p.name
                const isEven = i % 2 === 0
                return (
                  <tr
                    key={p.name}
                    onClick={() => setSelected(isSelected ? null : p)}
                    className={`border-b border-border-subtle cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-teal/10 border-l-2 border-l-teal'
                        : isEven
                        ? 'bg-dark-bg hover:bg-card-bg'
                        : 'bg-card-bg/40 hover:bg-card-bg'
                    }`}
                  >
                    <td className="px-3 py-2.5 font-display text-lg font-bold text-gray-300">{p.rank}</td>
                    <td className="px-3 py-2.5"><TierBadge tier={p.tier} /></td>
                    <td className="px-3 py-2.5 font-semibold text-cream whitespace-nowrap">{p.name}</td>
                    <td className="px-3 py-2.5 text-gray-300">{p.pos}</td>
                    <td className="px-3 py-2.5 text-gray-300 font-mono text-xs">{p.ht}</td>
                    <td className="px-3 py-2.5 text-gray-300">{p.wt}</td>
                    <td className="px-3 py-2.5 text-gray-300 font-mono text-xs">{p.wing}</td>
                    <td className="px-3 py-2.5 text-gray-300">{p.age}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-cream">{p.school}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs">{p.class}</td>
                    <td className="px-3 py-2.5">
                      <span className={`font-display text-base font-bold ${p.modelRank <= 5 ? 'text-teal' : p.modelRank <= 10 ? 'text-blue-400' : 'text-gray-400'}`}>
                        {p.modelRank}
                      </span>
                    </td>
                    <td className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap ${PEG_COLOR[p.peg]}`}>{p.peg}</td>
                    <td className="px-3 py-2.5"><TrendIcon trend={p.trend} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="text-4xl mb-3">🏀</div>
              <p className="text-sm">No prospects match your filters.</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-navy border-l border-border-subtle overflow-y-auto z-20 shadow-2xl" style={{ top: 0 }}>
            <div className="p-5">
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-cream text-xs mb-4 flex items-center gap-1"
              >
                ← Close
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-display font-bold"
                     style={{ backgroundColor: selected.schoolColor }}>
                  {selected.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-cream leading-tight">{selected.name}</h2>
                  <p className="text-xs text-gray-400">{selected.school} &bull; {selected.class}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-5">
                <TierBadge tier={selected.tier} />
                <span className={`text-sm font-semibold ${PEG_COLOR[selected.peg]}`}>{selected.peg}</span>
                <TrendIcon trend={selected.trend} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Draft Rank',   value: `#${selected.rank}` },
                  { label: 'Model Rank',   value: `#${selected.modelRank}` },
                  { label: 'Position',     value: selected.pos },
                  { label: 'Age',          value: selected.age },
                  { label: 'Height',       value: selected.ht },
                  { label: 'Weight',       value: `${selected.wt} lbs` },
                  { label: 'Wingspan',     value: selected.wing },
                  { label: 'Hometown',     value: selected.hometown ?? '—' },
                ].map(row => (
                  <div key={row.label} className="bg-card-bg rounded-lg p-3 border border-border-subtle">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{row.label}</div>
                    <div className="text-sm font-semibold text-cream mt-0.5">{row.value}</div>
                  </div>
                ))}
              </div>

              {/* Model vs Scout gap */}
              <div className="mb-5">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Model vs Scout Delta</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Scout #{selected.rank}</span>
                  <div className="flex-1 h-1.5 bg-card-bg rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${selected.modelRank < selected.rank ? 'bg-teal' : selected.modelRank > selected.rank ? 'bg-red-400' : 'bg-gray-500'}`}
                      style={{ width: `${Math.max(10, 100 - Math.abs(selected.modelRank - selected.rank) * 10)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">Model #{selected.modelRank}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {selected.modelRank < selected.rank
                    ? '↑ Model higher — potential upside not fully priced in'
                    : selected.modelRank > selected.rank
                    ? '↓ Model lower — scout consensus ahead of algorithm'
                    : 'Model and scout consensus aligned'}
                </p>
              </div>

              <div className="border-t border-border-subtle pt-4">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Quick Actions</div>
                <div className="flex flex-col gap-2">
                  <button className="w-full bg-teal text-dark-bg rounded py-2 text-xs font-bold hover:bg-teal/80 transition-colors">+ Add to Watch List</button>
                  <button className="w-full bg-card-bg border border-border-subtle text-cream rounded py-2 text-xs font-semibold hover:border-teal transition-colors">Schedule Workout</button>
                  <button className="w-full bg-card-bg border border-border-subtle text-cream rounded py-2 text-xs font-semibold hover:border-teal transition-colors">Add Note</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-navy border-t border-border-subtle px-6 py-2 flex items-center gap-8 text-[10px] text-gray-500 uppercase tracking-wider flex-wrap z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-400">Tier Key:</span>
          {(['1+', '1', '2', '3'] as Tier[]).map(t => (
            <span key={t} className="flex items-center gap-1">
              <TierBadge tier={t} />
              <span className="normal-case text-gray-500">
                {t === '1+' ? 'Elite / Franchise' : t === '1' ? 'First Round' : t === '2' ? 'Second Round' : 'Fringe'}
              </span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-400">PEG Key:</span>
          {(['Franchise', 'Core', 'Top Starter', 'Starter', 'Key Reserve'] as PEG[]).map(p => (
            <span key={p} className={`normal-case ${PEG_COLOR[p]}`}>{p}</span>
          ))}
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <span className="font-bold text-gray-400">Trend:</span>
          <span className="text-green-400">↑ Rising</span>
          <span className="text-red-400">↓ Falling</span>
          <span className="text-gray-500">— Steady</span>
        </div>
      </div>
    </div>
  )
}
