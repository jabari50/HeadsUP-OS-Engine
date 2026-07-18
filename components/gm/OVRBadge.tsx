'use client'

import { cn } from '@/lib/utils'

interface OVRBadgeProps {
  ovr: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = {
  sm: { outer: 'w-8 h-8 text-xs', border: 'border-2' },
  md: { outer: 'w-12 h-12 text-sm', border: 'border-2' },
  lg: { outer: 'w-16 h-16 text-lg', border: 'border-[3px]' },
} as const

/** Circular OVR badge — navy fill, teal border, Oswald Bold white number */
export function OVRBadge({ ovr, size = 'md', className }: OVRBadgeProps) {
  const { outer, border } = SIZE_MAP[size]
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center bg-navy border-teal font-display font-bold text-white shrink-0',
        outer,
        border,
        className,
      )}
      aria-label={`OVR ${ovr}`}
    >
      {ovr}
    </div>
  )
}
