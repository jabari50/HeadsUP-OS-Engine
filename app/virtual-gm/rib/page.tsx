'use client'

import { useState } from 'react'
import { DEMO_PROGRAM } from '@/data/seed'
import type { RIBSection } from '@/lib/vgm-types'

function RIBSectionBlock({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className={`print-section bg-card-bg border border-border-subtle rounded-xl p-5 border-l-4 ${accent}`}>
      <h3 className="text-[10px] uppercase tracking-widest text-vgm-gray mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-cream">
            <span className="text-teal mt-0.5 shrink-0">▸</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function RIBPage() {
  const [rib, setRib] = useState<RIBSection | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    setRib(null)
    try {
      const res = await fetch('/api/virtual-gm/rib', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'RIB generation failed')
      setRib(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">Roster Intelligence Brief</h1>
          <p className="text-xs text-vgm-gray mt-0.5">AI-generated weekly front-office summary for {DEMO_PROGRAM.name}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {rib && (
            <button
              onClick={() => window.print()}
              className="border border-border-subtle text-vgm-gray hover:text-cream px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Export PDF
            </button>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="bg-teal text-navy font-bold px-5 py-2 rounded-lg text-sm hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating…' : rib ? 'Regenerate RIB' : 'Generate RIB →'}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="h-8 w-64 bg-card-bg border border-border-subtle rounded animate-pulse" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-card-bg border border-border-subtle rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">{error}</div>
      )}

      {/* RIB content */}
      {rib && !loading && (
        <div className="animate-fade-in">
          {/* RIB masthead */}
          <div className="bg-navy border border-border-subtle rounded-xl p-5 mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] text-vgm-gray uppercase tracking-widest">Roster Intelligence Brief</p>
              <h2 className="font-display text-2xl font-bold text-cream mt-1">{DEMO_PROGRAM.name}</h2>
              <p className="text-sm text-vgm-gray mt-1">
                Coach {DEMO_PROGRAM.head_coach} · {DEMO_PROGRAM.system} · {DEMO_PROGRAM.conference}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-vgm-gray">Generated</p>
              <p className="text-xs text-cream">{new Date(rib.generated_at).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
              })}</p>
              <div className="flex items-center gap-1.5 mt-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                <span className="text-[10px] text-teal">Portal OPEN</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <RIBSectionBlock
              title="Portal Entries — Gap Matches"
              items={rib.portal_entries}
              accent="border-l-teal"
            />
            <RIBSectionBlock
              title="OVR Tier Changes — Tracked Prospects"
              items={rib.tier_changes}
              accent="border-l-gold"
            />
            <RIBSectionBlock
              title="Competitor Confirmed Signings"
              items={rib.competitor_signings}
              accent="border-l-red-600"
            />
            <RIBSectionBlock
              title="Academic Alerts"
              items={rib.academic_alerts ?? ['No academic eligibility changes this week.']}
              accent="border-l-[#ff6b6b]"
            />
            <div className="print-section bg-navy border border-teal rounded-xl p-5">
              <h3 className="text-[10px] uppercase tracking-widest text-teal mb-3">Top 3 Recommended Actions</h3>
              <ol className="space-y-3">
                {rib.recommended_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="font-display text-2xl font-bold text-teal leading-none shrink-0">{i + 1}</span>
                    <p className="text-sm text-cream pt-0.5">{action}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!rib && !loading && !error && (
        <div className="text-center py-20">
          <div className="font-display text-6xl text-border-subtle mb-4">RIB</div>
          <p className="text-vgm-gray text-sm">Click "Generate RIB" to produce this week's front-office intelligence brief.</p>
        </div>
      )}
    </div>
  )
}
