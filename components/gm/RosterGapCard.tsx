'use client'

import { cn } from '@/lib/utils'
import type { RosterGap } from '@/lib/vgm-types'

interface RosterGapCardProps {
  gap: RosterGap
  className?: string
}

const PRIORITY_STYLES = {
  HIGH: 'bg-red-600 text-white',
  MED:  'bg-[#D97706] text-white',
  LOW:  'bg-[#374151] text-white',
} as const

/** Navy card with teal left accent — shows position gap, need, and priority */
export function RosterGapCard({ gap, className }: RosterGapCardProps) {
  return (
    <div className={cn('relative bg-card-bg border border-border-subtle rounded-lg pl-4 pr-4 py-4 border-l-4 border-l-teal', className)}>
      <span className={cn('absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded', PRIORITY_STYLES[gap.priority])}>
        {gap.priority}
      </span>
      <p className="font-display text-2xl font-bold text-teal leading-none">{gap.position}</p>
      <p className="text-sm text-cream mt-1">{gap.attribute_need}</p>
    </div>
  )
}
