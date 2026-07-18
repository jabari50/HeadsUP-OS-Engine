'use client'

import { cn } from '@/lib/utils'
import type { Tier } from '@/lib/vgm-types'

interface TierBadgeProps {
  tier: Tier
  className?: string
}

const TIER_STYLES: Record<Tier, string> = {
  Elite: 'bg-gold text-navy',
  Impact: 'bg-teal text-navy',
  Contributor: 'bg-white text-navy',
  Developing: 'bg-vgm-gray text-white',
  Prospect: 'bg-navy-light text-white',
}

/** Pill-shaped tier badge with tier-specific color coding */
export function TierBadge({ tier, className }: TierBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase',
        TIER_STYLES[tier],
        className,
      )}
    >
      {tier}
    </span>
  )
}
