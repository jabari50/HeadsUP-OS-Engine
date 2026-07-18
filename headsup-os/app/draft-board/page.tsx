'use client'

import { useState, useMemo } from 'react'

type Tier = '1+' | '1' | '2' | '3'
type PEG  = 'Franchise' | 'Core' | 'Top Starter' | 'Starter' | 'Key Reserve' | 'Reserve'
type Trend = 'up' | 'down' | 'steady'
type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'SG/SF' | 'PF/C' | 'SF/PF' | 'F' | 'G'

interface Prospect {
  rank: number
  tier: Tier
  name: string
  pos: Position
  ht: string          // display height (rounded up)
  htBf: string        // barefoot combine measurement
  wt: number
  wing: string
  reach: string
  age: number
  school: string
  schoolAbbr: string
  country: string
  class: string
  modelRank: number
  peg: PEG
  trend: Trend
  hometown: string
  ppg?: number
  rpg?: number
  apg?: number
  note?: string
}

// All measurements sourced from 2026 NBA Draft Combine (Chicago, Wintrust Arena)
// Rankings consensus across ESPN, CBS Sports, Bleacher Report, The Ringer — June 2026
const PROSPECTS: Prospect[] = [
  {
    rank: 1, tier: '1+', name: 'AJ Dybantsa',        pos: 'SF',    ht: "6'9\"",  htBf: "6'8.5\"",  wt: 217, wing: "7'0.25\"", reach: "8'10\"", age: 19.3,
    school: 'BYU',          schoolAbbr: 'BYU', country: 'USA', class: 'Freshman',  modelRank: 2,  peg: 'Franchise',   trend: 'up',
    hometown: 'North Attleborough, MA', ppg: 25.5, rpg: 6.8, apg: 3.7,
    note: 'Led nation with 25.5 PPG. Broke BYU freshman scoring record (43-pt eruption). Highest max vertical at 2026 Combine. Elite scoring wing with elite creation ability.',
  },
  {
    rank: 2, tier: '1+', name: 'Darryn Peterson',    pos: 'SG',    ht: "6'5\"",  htBf: "6'4.5\"",  wt: 199, wing: "6'9.75\"", reach: "8'7\"",  age: 19.2,
    school: 'Kansas',       schoolAbbr: 'KU',  country: 'USA', class: 'Sophomore', modelRank: 1,  peg: 'Franchise',   trend: 'steady',
    hometown: 'Prolific Prep, CA', ppg: 18.4, rpg: 4.1, apg: 4.8,
    note: 'Some boards have him #1 over Dybantsa. Exceptional feel for the game, playmaking IQ. NBA-ready two-way wing guard.',
  },
  {
    rank: 3, tier: '1+', name: 'Cameron Boozer',     pos: 'PF',    ht: "6'9\"",  htBf: "6'8.25\"", wt: 253, wing: "7'1.5\"",  reach: "9'0\"",  age: 19.1,
    school: 'Duke',         schoolAbbr: 'DU',  country: 'USA', class: 'Freshman',  modelRank: 3,  peg: 'Franchise',   trend: 'up',
    hometown: 'Miami, FL', ppg: 17.2, rpg: 8.9, apg: 3.1,
    note: 'Son of Carlos Boozer. Superior ball-handling and vision for a PF. Elite rebounder. Some evaluators rank him #1 overall.',
  },
  {
    rank: 4, tier: '1+', name: 'Caleb Wilson',       pos: 'SF/PF', ht: "6'9\"",  htBf: "6'9.25\"", wt: 211, wing: "7'0.25\"", reach: "9'0\"",  age: 20.0,
    school: 'North Carolina', schoolAbbr: 'UNC', country: 'USA', class: 'Sophomore', modelRank: 4, peg: 'Core',       trend: 'up',
    hometown: 'Charlotte, NC', ppg: 16.8, rpg: 7.2, apg: 2.9,
    note: 'NBA evaluators rate him higher than his consensus slot. Versatile two-way forward with elite length and 9\'0" standing reach.',
  },
  {
    rank: 5, tier: '1',  name: 'Keaton Wagler',      pos: 'SG',    ht: "6'6\"",  htBf: "6'5\"",    wt: 188, wing: "6'6.25\"", reach: "8'4\"",  age: 21.3,
    school: 'Illinois',     schoolAbbr: 'ILL', country: 'USA', class: 'Freshman',  modelRank: 6,  peg: 'Core',        trend: 'up',
    hometown: 'Peoria, IL', ppg: 17.9, rpg: 5.1, apg: 4.2,
    note: 'Jerry West Award winner. Led Illinois to Final Four. Shot 39.7% from 3 on high volume. Named consensus 2nd-team All-American. Stock soaring.',
  },
  {
    rank: 6, tier: '1',  name: 'Brayden Burries',    pos: 'SG',    ht: "6'4\"",  htBf: "6'4\"",    wt: 215, wing: "6'7\"",   reach: "8'5\"",  age: 20.8,
    school: 'Arizona',      schoolAbbr: 'UA',  country: 'USA', class: 'Freshman',  modelRank: 5,  peg: 'Core',        trend: 'steady',
    hometown: 'Eastvale, CA', ppg: 16.1, rpg: 4.9, apg: 2.4,
    note: 'CA Gatorade Player of the Year (2025). Led Wildcats in scoring and steals. Physical 2-guard with 1.5 SPG and a 215-lb frame as a freshman.',
  },
  {
    rank: 7, tier: '1',  name: 'Darius Acuff Jr.',   pos: 'PG',    ht: "6'2\"",  htBf: "6'2\"",    wt: 186, wing: "6'7\"",   reach: "8'2.5\"",age: 19.0,
    school: 'Arkansas',     schoolAbbr: 'ARK', country: 'USA', class: 'Freshman',  modelRank: 8,  peg: 'Top Starter', trend: 'up',
    hometown: 'Memphis, TN', ppg: 19.3, rpg: 3.7, apg: 5.1,
    note: 'Elite quickness and burst. 6\'7" wingspan at 6\'2" frame is a huge positive for a PG. Lethal pick-and-roll operator.',
  },
  {
    rank: 8, tier: '1',  name: 'Yaxel Lendeborg',    pos: 'PF',    ht: "6'9\"",  htBf: "6'9\"",    wt: 240, wing: "7'3\"",   reach: "9'1\"",  age: 24.1,
    school: 'Michigan',     schoolAbbr: 'UM',  country: 'Venezuela', class: 'Graduate', modelRank: 7, peg: 'Top Starter', trend: 'up',
    hometown: 'Valencia, Venezuela', ppg: 15.1, rpg: 6.8, apg: 3.2,
    note: 'Big Ten Player of the Year. Led Michigan to Big Ten & NCAA Tournament championships. Premier two-way connector. 7\'3" wingspan.',
  },
  {
    rank: 9, tier: '1',  name: 'Labaron Philon Jr.',  pos: 'PG',    ht: "6'3\"",  htBf: "6'2.5\"",  wt: 176, wing: "6'6.25\"", reach: "8'3.5\"",age: 20.4,
    school: 'Alabama',      schoolAbbr: 'UA',  country: 'USA', class: 'Sophomore', modelRank: 9, peg: 'Top Starter',  trend: 'up',
    hometown: 'Macon, GA', ppg: 22.0, rpg: 3.5, apg: 5.0,
    note: 'Led Crimson Tide with 22.0 PPG and 5.0 APG. Shot 50.1% from the field and 39.9% from 3. One of SEC\'s most impactful players.',
  },
  {
    rank: 10, tier: '1', name: 'Kingston Flemings',   pos: 'PG',    ht: "6'3\"",  htBf: "6'2.5\"",  wt: 183, wing: "6'6\"",   reach: "8'3\"",  age: 19.1,
    school: 'Houston',      schoolAbbr: 'HOU', country: 'USA', class: 'Freshman',  modelRank: 11, peg: 'Top Starter', trend: 'steady',
    hometown: 'Houston, TX', ppg: 17.6, rpg: 3.9, apg: 5.8,
    note: 'One of the safest lead guard prospects in the class. Elite court vision. Dallas Mavericks among teams linked in mock drafts.',
  },
  {
    rank: 11, tier: '1', name: 'Mikel Brown Jr.',     pos: 'PG',    ht: "6'3\"",  htBf: "6'2.75\"", wt: 185, wing: "6'7\"",   reach: "8'4\"",  age: 19.3,
    school: 'Louisville',   schoolAbbr: 'LOU', country: 'USA', class: 'Freshman',  modelRank: 10, peg: 'Starter',     trend: 'steady',
    hometown: 'Daytona Beach, FL', ppg: 15.8, rpg: 3.4, apg: 5.2,
    note: 'High basketball IQ point guard with transition savvy. Strong first step and improving from 3. Major first-year impact at Louisville.',
  },
  {
    rank: 12, tier: '1', name: 'Jayden Quaintance',   pos: 'PF/C',  ht: "6'9\"",  htBf: "6'9\"",    wt: 253, wing: "7'2\"",   reach: "9'0\"",  age: 20.1,
    school: 'Kentucky',     schoolAbbr: 'UK',  country: 'USA', class: 'Sophomore', modelRank: 13, peg: 'Starter',     trend: 'down',
    hometown: 'Raleigh, NC', ppg: 13.2, rpg: 7.8, apg: 1.4,
    note: 'Torn ACL in Feb 2025, then lingering knee issue in sophomore year. When healthy, lottery-level talent. Stock dipped on health concerns.',
  },
  {
    rank: 13, tier: '1', name: 'Dailyn Swain',        pos: 'SF',    ht: "6'7\"",  htBf: "6'6.75\"", wt: 210, wing: "7'0\"",   reach: "8'9\"",  age: 19.5,
    school: 'Texas',        schoolAbbr: 'TX',  country: 'USA', class: 'Freshman',  modelRank: 12, peg: 'Starter',     trend: 'steady',
    hometown: 'Columbus, OH', ppg: 14.4, rpg: 5.3, apg: 2.0,
    note: 'Long, versatile wing with 7\'0" wingspan. Projects as a 3-and-D contributor at the next level. Strong frame for NBA physicality.',
  },
  {
    rank: 14, tier: '1', name: 'Aday Mara',           pos: 'C',     ht: "7'3\"",  htBf: "7'3\"",    wt: 260, wing: "7'6\"",   reach: "9'9\"",  age: 21.4,
    school: 'Michigan',     schoolAbbr: 'UM',  country: 'Spain', class: 'Junior',  modelRank: 15, peg: 'Starter',     trend: 'up',
    hometown: 'Castellón, Spain', ppg: 14.2, rpg: 8.5, apg: 1.2,
    note: '9\'9" standing reach — second only to Tacko Fall all-time at NBA Combine. 7\'3" barefoot. Combine measurements winner. Rare modern big.',
  },
  {
    rank: 15, tier: '1', name: 'Nate Ament',          pos: 'PF',    ht: "6'10\"", htBf: "6'9.75\"", wt: 215, wing: "7'0\"",   reach: "8'11\"", age: 19.4,
    school: 'Tennessee',    schoolAbbr: 'TN',  country: 'USA', class: 'Freshman',  modelRank: 14, peg: 'Starter',     trend: 'up',
    hometown: 'Neenah, WI', ppg: 16.8, rpg: 6.3, apg: 2.4,
    note: 'Started all 35 games as a Vols freshman. Ball-handling big who initiates offense. 40%/33%/79% shooting splits. Lottery upside.',
  },
  {
    rank: 16, tier: '1', name: 'Bennett Stirtz',      pos: 'SG',    ht: "6'4\"",  htBf: "6'4\"",    wt: 190, wing: "6'5\"",   reach: "8'3\"",  age: 22.2,
    school: 'Iowa',         schoolAbbr: 'IA',  country: 'USA', class: 'Senior',    modelRank: 18, peg: 'Key Reserve',  trend: 'up',
    hometown: 'Sheldon, IA', ppg: 19.8, rpg: 2.6, apg: 4.4,
    note: 'D-II to NBA journey — Northwest Missouri State → Drake → Iowa. 47.7% FG, 35.8% 3PT, 84.8% FT as Iowa\'s engine. Shined at combine.',
  },
  {
    rank: 17, tier: '1', name: 'Henri Veesaar',       pos: 'C',     ht: "7'0\"",  htBf: "7'0\"",    wt: 230, wing: "7'4\"",   reach: "9'3\"",  age: 21.0,
    school: 'North Carolina', schoolAbbr: 'UNC', country: 'Estonia', class: 'Junior', modelRank: 17, peg: 'Key Reserve', trend: 'steady',
    hometown: 'Tallinn, Estonia', ppg: 17.0, rpg: 8.7, apg: 1.0,
    note: '15 double-doubles in 31 games. Modern post player with mobility. After transferring to UNC, second in ACC in double-doubles. 7\'0" with range.',
  },
  {
    rank: 18, tier: '1', name: 'Isaiah Evans',        pos: 'SF',    ht: "6'6\"",  htBf: "6'5.5\"",  wt: 200, wing: "6'9\"",   reach: "8'7\"",  age: 20.2,
    school: 'Duke',         schoolAbbr: 'DU',  country: 'USA', class: 'Sophomore', modelRank: 19, peg: 'Key Reserve',  trend: 'steady',
    hometown: 'Monroe, NC', ppg: 15.0, rpg: 3.2, apg: 1.3,
    note: 'ESPN\'s Jeremy Woo ranked Evans 19th. Cited as an elite scorer with upside. Projected late first round — 24 to 28 range.',
  },
  {
    rank: 19, tier: '2', name: 'Morez Johnson Jr.',   pos: 'PF',    ht: "6'9\"",  htBf: "6'9\"",    wt: 251, wing: "7'3.5\"", reach: "8'11\"", age: 21.1,
    school: 'Michigan',     schoolAbbr: 'UM',  country: 'USA', class: 'Sophomore', modelRank: 21, peg: 'Key Reserve',  trend: 'up',
    hometown: 'Detroit, MI', ppg: 13.8, rpg: 7.1, apg: 1.5,
    note: '39.0" max vertical — elite athleticism for his size. 7\'3.5" wingspan. Michigan combine double — rose with Aday Mara. Strong at rim.',
  },
  {
    rank: 20, tier: '2', name: 'Cameron Carr',        pos: 'SG',    ht: "6'5\"",  htBf: "6'4.5\"",  wt: 184, wing: "7'0.75\"", reach: "8'8\"", age: 21.3,
    school: 'Michigan State', schoolAbbr: 'MSU', country: 'USA', class: 'Junior', modelRank: 16, peg: 'Key Reserve',  trend: 'up',
    hometown: 'Detroit, MI', ppg: 16.2, rpg: 3.4, apg: 3.1,
    note: 'Biggest combine riser. 7\'0.75" wingspan on a 6\'4.5" guard frame was a revelation. Model has him 4 spots higher than consensus.',
  },
]

const C = {
  dark:   '#0a1628',
  navy:   '#112240',
  navyL:  '#1E3A5F',
  card:   '#162032',
  border: '#1e3a5f',
  teal:   '#00c896',
  gold:   '#F5C518',
  cream:  '#F4F4F0',
  gray:   '#8A8F99',
}

const TIER_CFG: Record<Tier, { bg: string; color: string }> = {
  '1+': { bg: '#7c3aed', color: '#fff' },
  '1':  { bg: '#2563eb', color: '#fff' },
  '2':  { bg: C.teal,    color: C.dark },
  '3':  { bg: C.gold,    color: C.dark },
}

const PEG_COLOR: Record<PEG, string> = {
  'Franchise':   '#a78bfa',
  'Core':        '#60a5fa',
  'Top Starter': C.teal,
  'Starter':     '#4ade80',
  'Key Reserve': '#facc15',
  'Reserve':     C.gray,
}

const TABS = ['BOARD','BIG BOARD','TEAM NEEDS','WATCH LIST','WORKOUTS','INTERVIEWS','MEDICALS','NOTES']
const POSITIONS = ['All Positions','PG','SG','SF','PF','C','G','F']

type SortKey = 'rank'|'name'|'pos'|'age'|'wt'|'modelRank'|'peg'|'trend'|'ppg'

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'up')   return <span style={{ color:'#4ade80', fontSize:16, fontWeight:700 }}>↑</span>
  if (trend === 'down') return <span style={{ color:'#f87171', fontSize:16, fontWeight:700 }}>↓</span>
  return                       <span style={{ color:C.gray,   fontSize:16 }}>—</span>
}

function TierBadge({ tier }: { tier: Tier }) {
  const cfg = TIER_CFG[tier]
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:32, height:24, borderRadius:4, fontSize:11, fontWeight:700,
      background: cfg.bg, color: cfg.color,
    }}>
      {tier}
    </span>
  )
}

function FlagIcon({ country }: { country: string }) {
  const flags: Record<string, string> = {
    'USA': '🇺🇸', 'Spain': '🇪🇸', 'Venezuela': '🇻🇪', 'Estonia': '🇪🇪',
  }
  return <span title={country} style={{ fontSize:12 }}>{flags[country] ?? '🌍'}</span>
}

function SortableTh({
  label, k, sortKey, sortDir, onSort,
}: {
  label: string
  k: SortKey
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSort: (k: SortKey) => void
}) {
  const active = sortKey === k
  return (
    <th onClick={() => onSort(k)} style={{
      padding:'12px 10px', textAlign:'left', fontSize:10, fontWeight:700,
      textTransform:'uppercase', letterSpacing:'0.08em', cursor:'pointer',
      color: active ? C.teal : C.gray, whiteSpace:'nowrap', userSelect:'none',
      background: C.navy,
    }}>
      {label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  )
}

export default function DraftBoard() {
  const [activeTab, setActiveTab] = useState('BOARD')
  const [posFilter, setPosFilter] = useState('All Positions')
  const [tierFilter, setTierFilter] = useState<Tier|'All'>('All')
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Prospect|null>(null)

  const filtered = useMemo(() => {
    let data = [...PROSPECTS]
    if (search) data = data.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.school.toLowerCase().includes(search.toLowerCase()) ||
      p.hometown.toLowerCase().includes(search.toLowerCase())
    )
    if (posFilter !== 'All Positions') data = data.filter(p => p.pos.includes(posFilter))
    if (tierFilter !== 'All') data = data.filter(p => p.tier === tierFilter)
    data.sort((a, b) => {
      const av = sortKey === 'ppg' ? (a.ppg ?? 0) : a[sortKey as keyof Prospect]
      const bv = sortKey === 'ppg' ? (b.ppg ?? 0) : b[sortKey as keyof Prospect]
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return data
  }, [search, posFilter, tierFilter, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const counts = {
    '1+': PROSPECTS.filter(p => p.tier === '1+').length,
    '1':  PROSPECTS.filter(p => p.tier === '1').length,
    '2':  PROSPECTS.filter(p => p.tier === '2').length,
    '3':  PROSPECTS.filter(p => p.tier === '3').length,
  }

  return (
    <div style={{ minHeight:'100vh', background:C.dark, color:C.cream, fontFamily:'Inter, system-ui, sans-serif', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ background:C.navy, borderBottom:`1px solid ${C.border}`, padding:'16px 24px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:C.teal, display:'flex', alignItems:'center', justifyContent:'center', color:C.dark, fontWeight:700, fontSize:20 }}>
              HU
            </div>
            <div>
              <div style={{ fontFamily:'Impact, Arial Narrow, sans-serif', fontSize:28, fontWeight:700, color:C.cream, letterSpacing:'0.05em', lineHeight:1 }}>
                NBA DRAFT BOARD
              </div>
              <div style={{ fontSize:10, color:C.gray, marginTop:4, letterSpacing:'0.12em', textTransform:'uppercase' }}>
                2026 NBA Draft &nbsp;|&nbsp; HeadsUP Intelligence — Internal Use Only
              </div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            {[
              { label:'Players Tracked', value:612 },
              { label:'Prospects Ranked', value:PROSPECTS.length },
              { label:'Tier 1+', value:counts['1+'] },
              { label:'Tier 1',  value:counts['1'] },
              { label:'Tier 2',  value:counts['2'] },
              { label:'Tier 3',  value:counts['3'] },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center', background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 14px', minWidth:72 }}>
                <div style={{ fontFamily:'Impact, Arial Narrow, sans-serif', fontSize:22, fontWeight:700, color:C.teal }}>{s.value}</div>
                <div style={{ fontSize:9, color:C.gray, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:9, color:C.gray, textTransform:'uppercase', letterSpacing:'0.1em' }}>Last Updated</div>
              <div style={{ fontSize:11, color:'#cbd5e1', fontFamily:'monospace', marginTop:2 }}>JUN 6, 2026 &nbsp;9:42 AM</div>
              <button style={{ marginTop:4, fontSize:9, color:C.teal, border:`1px solid ${C.teal}`, borderRadius:4, padding:'2px 8px', background:'transparent', cursor:'pointer' }}>
                ↺ REFRESH
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:C.navy, borderBottom:`1px solid ${C.border}`, padding:'0 24px', display:'flex', overflowX:'auto', gap:4 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding:'12px 14px', fontSize:11, fontWeight:700, letterSpacing:'0.1em',
            textTransform:'uppercase', whiteSpace:'nowrap', background:'transparent',
            border:'none', borderBottom: activeTab === tab ? `2px solid ${C.teal}` : '2px solid transparent',
            color: activeTab === tab ? C.teal : C.gray, cursor:'pointer',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background:`${C.navy}88`, borderBottom:`1px solid ${C.border}`, padding:'10px 24px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <input
          type="text"
          placeholder="Search player, school, or hometown..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:'6px 12px', fontSize:13, color:C.cream, outline:'none', width:260 }}
        />
        <select
          value={posFilter}
          onChange={e => setPosFilter(e.target.value)}
          style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:'6px 12px', fontSize:13, color:C.cream, outline:'none' }}
        >
          {POSITIONS.map(p => <option key={p} style={{ background:C.dark }}>{p}</option>)}
        </select>
        <div style={{ display:'flex', gap:6 }}>
          {(['All','1+','1','2','3'] as const).map(t => (
            <button key={t} onClick={() => setTierFilter(t)} style={{
              padding:'4px 12px', fontSize:11, fontWeight:700, borderRadius:6, cursor:'pointer',
              border:`1px solid ${tierFilter === t && t !== 'All' ? TIER_CFG[t as Tier]?.bg : C.border}`,
              background: tierFilter === t
                ? t === 'All' ? C.teal : (TIER_CFG[t as Tier]?.bg ?? C.card)
                : C.card,
              color: tierFilter === t
                ? t === 'All' ? C.dark : (TIER_CFG[t as Tier]?.color ?? C.cream)
                : C.gray,
            }}>
              {t === 'All' ? 'All Tiers' : `Tier ${t}`}
            </button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', fontSize:11, color:C.gray }}>{filtered.length} prospects &nbsp;|&nbsp; <span style={{ color:C.teal }}>Combine measurements from Chicago, May 2026</span></div>
      </div>

      {/* Table + Panel */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <div style={{ flex:1, overflowY:'auto', marginRight: selected ? 340 : 0, transition:'margin 0.2s' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead style={{ position:'sticky', top:0, zIndex:10 }}>
              <tr>
                <SortableTh sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Rank"       k="rank" />
                <th style={{ padding:'12px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:C.gray, background:C.navy, textAlign:'left' }}>Tier</th>
                <SortableTh sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Player"     k="name" />
                <SortableTh sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Pos"        k="pos" />
                <th style={{ padding:'12px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', color:C.gray, background:C.navy, textAlign:'left' }}>Ht (BF)</th>
                <SortableTh sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Wt"         k="wt" />
                <th style={{ padding:'12px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', color:C.gray, background:C.navy, textAlign:'left', whiteSpace:'nowrap' }}>Wingspan</th>
                <th style={{ padding:'12px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', color:C.gray, background:C.navy, textAlign:'left', whiteSpace:'nowrap' }}>Reach</th>
                <SortableTh sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Age"        k="age" />
                <th style={{ padding:'12px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', color:C.gray, background:C.navy, textAlign:'left', whiteSpace:'nowrap' }}>School / Team</th>
                <th style={{ padding:'12px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', color:C.gray, background:C.navy, textAlign:'left' }}>Class</th>
                <SortableTh sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Model #"    k="modelRank" />
                <SortableTh sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="PPG"        k="ppg" />
                <SortableTh sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="PEG"        k="peg" />
                <SortableTh sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Trend"      k="trend" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const isSelected = selected?.name === p.name
                const delta = p.modelRank - p.rank
                return (
                  <tr
                    key={p.name}
                    onClick={() => setSelected(isSelected ? null : p)}
                    style={{
                      background: isSelected ? `${C.teal}18` : i % 2 === 0 ? C.dark : `${C.card}66`,
                      borderBottom:`1px solid ${C.border}`,
                      borderLeft: isSelected ? `3px solid ${C.teal}` : '3px solid transparent',
                      cursor:'pointer',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = C.card }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? C.dark : `${C.card}66` }}
                  >
                    <td style={{ padding:'9px 10px', fontFamily:'Impact, Arial Narrow, sans-serif', fontSize:18, fontWeight:700, color:C.gray }}>{p.rank}</td>
                    <td style={{ padding:'9px 10px' }}><TierBadge tier={p.tier} /></td>
                    <td style={{ padding:'9px 10px', fontWeight:600, color:C.cream, whiteSpace:'nowrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <FlagIcon country={p.country} />
                        {p.name}
                      </div>
                    </td>
                    <td style={{ padding:'9px 10px', color:C.gray, fontSize:12 }}>{p.pos}</td>
                    <td style={{ padding:'9px 10px', color:C.gray, fontFamily:'monospace', fontSize:11 }}>{p.htBf}</td>
                    <td style={{ padding:'9px 10px', color:C.gray }}>{p.wt}</td>
                    <td style={{ padding:'9px 10px', fontFamily:'monospace', fontSize:11, color: p.wing.includes('7\'') ? C.teal : C.gray }}>{p.wing}</td>
                    <td style={{ padding:'9px 10px', fontFamily:'monospace', fontSize:11, color: p.reach.includes('9\'') ? '#a78bfa' : C.gray }}>{p.reach}</td>
                    <td style={{ padding:'9px 10px', color:C.gray }}>{p.age}</td>
                    <td style={{ padding:'9px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:26, height:26, borderRadius:'50%', background:C.navyL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:C.teal }}>
                          {p.schoolAbbr.slice(0,3)}
                        </div>
                        <span style={{ color:C.cream, fontWeight:500 }}>{p.school}</span>
                      </div>
                    </td>
                    <td style={{ padding:'9px 10px', color:C.gray, fontSize:11 }}>{p.class}</td>
                    <td style={{ padding:'9px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ fontFamily:'Impact, Arial Narrow, sans-serif', fontSize:15, fontWeight:700, color: p.modelRank <= 5 ? C.teal : p.modelRank <= 10 ? '#60a5fa' : C.gray }}>
                          {p.modelRank}
                        </span>
                        {delta !== 0 && (
                          <span style={{ fontSize:9, color: delta < 0 ? '#4ade80' : '#f87171' }}>
                            {delta < 0 ? `▲${Math.abs(delta)}` : `▼${delta}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding:'9px 10px', fontWeight:600, color: p.ppg && p.ppg >= 20 ? C.gold : C.cream }}>
                      {p.ppg ?? '—'}
                    </td>
                    <td style={{ padding:'9px 10px', fontSize:11, fontWeight:600, color: PEG_COLOR[p.peg], whiteSpace:'nowrap' }}>{p.peg}</td>
                    <td style={{ padding:'9px 10px' }}><TrendIcon trend={p.trend} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', color:C.gray }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🏀</div>
              <p style={{ fontSize:14 }}>No prospects match your filters.</p>
            </div>
          )}

          <div style={{ padding:'16px 24px', fontSize:10, color:C.gray, borderTop:`1px solid ${C.border}` }}>
            Data sourced from ESPN, CBS Sports, Bleacher Report, The Ringer, NBADraft.net big boards and 2026 NBA Draft Combine official measurements.
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{
            position:'fixed', right:0, top:0, bottom:0, width:340,
            background:C.navy, borderLeft:`1px solid ${C.border}`,
            overflowY:'auto', zIndex:20, boxShadow:'-4px 0 24px rgba(0,0,0,0.5)',
          }}>
            <div style={{ padding:20 }}>
              <button onClick={() => setSelected(null)} style={{ color:C.gray, background:'none', border:'none', cursor:'pointer', fontSize:12, marginBottom:16 }}>
                ← Close
              </button>

              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:TIER_CFG[selected.tier].bg, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15 }}>
                  {selected.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontFamily:'Impact, Arial Narrow, sans-serif', fontSize:19, fontWeight:700, color:C.cream, lineHeight:1.1 }}>{selected.name}</div>
                  <div style={{ fontSize:11, color:C.gray, marginTop:3 }}>
                    <FlagIcon country={selected.country} /> {selected.school} · {selected.class}
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <TierBadge tier={selected.tier} />
                <span style={{ fontSize:13, fontWeight:600, color:PEG_COLOR[selected.peg] }}>{selected.peg}</span>
                <TrendIcon trend={selected.trend} />
                <span style={{ marginLeft:'auto', fontSize:11, color:C.gray }}>#{selected.rank} Scout</span>
              </div>

              {/* Season Stats */}
              {(selected.ppg || selected.rpg || selected.apg) && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
                  {[
                    { label:'PPG', value:selected.ppg },
                    { label:'RPG', value:selected.rpg },
                    { label:'APG', value:selected.apg },
                  ].map(s => (
                    <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px', textAlign:'center' }}>
                      <div style={{ fontFamily:'Impact, Arial Narrow, sans-serif', fontSize:22, color:C.teal }}>{s.value ?? '—'}</div>
                      <div style={{ fontSize:9, color:C.gray, textTransform:'uppercase', marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Measurements Grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                {[
                  { label:'Draft Rank',   value:`#${selected.rank}` },
                  { label:'Model Rank',   value:`#${selected.modelRank}` },
                  { label:'Position',     value:selected.pos },
                  { label:'Age',          value:selected.age },
                  { label:'Ht (Barefoot)',value:selected.htBf },
                  { label:'Weight',       value:`${selected.wt} lbs` },
                  { label:'Wingspan',     value:selected.wing },
                  { label:'Standing Reach', value:selected.reach },
                  { label:'Class',        value:selected.class },
                  { label:'Hometown',     value:selected.hometown },
                ].map(row => (
                  <div key={row.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:9, color:C.gray, textTransform:'uppercase', letterSpacing:'0.1em' }}>{row.label}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:C.cream, marginTop:2 }}>{row.value}</div>
                  </div>
                ))}
              </div>

              {/* Scout Note */}
              {selected.note && (
                <div style={{ background:`${C.teal}0f`, border:`1px solid ${C.teal}33`, borderRadius:8, padding:'12px', marginBottom:16 }}>
                  <div style={{ fontSize:9, color:C.teal, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Scout Note</div>
                  <p style={{ fontSize:12, color:C.cream, lineHeight:1.6, margin:0 }}>{selected.note}</p>
                </div>
              )}

              {/* Model vs Scout */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:9, color:C.gray, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Model vs Scout Delta</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:C.gray }}>
                  <span>Scout #{selected.rank}</span>
                  <div style={{ flex:1, height:6, background:C.card, borderRadius:3, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:3,
                      background: selected.modelRank < selected.rank ? '#4ade80' : selected.modelRank > selected.rank ? '#f87171' : C.gray,
                      width:`${Math.max(10, 100 - Math.abs(selected.modelRank - selected.rank) * 8)}%`,
                    }} />
                  </div>
                  <span>Model #{selected.modelRank}</span>
                </div>
                <p style={{ fontSize:10, color:C.gray, marginTop:6 }}>
                  {selected.modelRank < selected.rank
                    ? `↑ Model higher by ${selected.rank - selected.modelRank} spots — upside may be underpriced`
                    : selected.modelRank > selected.rank
                    ? `↓ Model lower by ${selected.modelRank - selected.rank} spots — scout consensus ahead of algorithm`
                    : 'Model and scout consensus aligned'}
                </p>
              </div>

              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
                <div style={{ fontSize:9, color:C.gray, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Quick Actions</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {['+ Add to Watch List','Schedule Workout','Add Scout Note'].map((label, i) => (
                    <button key={label} style={{
                      width:'100%', padding:'8px 0', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer',
                      background: i === 0 ? C.teal : C.card,
                      color: i === 0 ? C.dark : C.cream,
                      border: i === 0 ? 'none' : `1px solid ${C.border}`,
                    }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div style={{
        background:C.navy, borderTop:`1px solid ${C.border}`, padding:'8px 24px',
        display:'flex', alignItems:'center', gap:20, flexWrap:'wrap', fontSize:10,
        color:C.gray, letterSpacing:'0.08em', textTransform:'uppercase',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontWeight:700, color:C.cream }}>Tier Key:</span>
          {(['1+','1','2','3'] as Tier[]).map(t => (
            <span key={t} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <TierBadge tier={t} />
              <span style={{ textTransform:'none', color:C.gray, fontSize:10 }}>
                {t === '1+' ? 'Elite / Franchise' : t === '1' ? 'First Round' : t === '2' ? 'Second Round' : 'Fringe'}
              </span>
            </span>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontWeight:700, color:C.cream }}>PEG:</span>
          {(['Franchise','Core','Top Starter','Starter','Key Reserve'] as PEG[]).map(p => (
            <span key={p} style={{ color:PEG_COLOR[p], textTransform:'none', fontSize:10 }}>{p}</span>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontWeight:700, color:C.cream }}>Model Δ:</span>
          <span style={{ color:'#4ade80', textTransform:'none' }}>▲ Model higher</span>
          <span style={{ color:'#f87171', textTransform:'none' }}>▼ Model lower</span>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:12 }}>
          <span style={{ color:'#4ade80' }}>↑ Rising</span>
          <span style={{ color:'#f87171' }}>↓ Falling</span>
          <span>— Steady</span>
        </div>
      </div>
    </div>
  )
}
