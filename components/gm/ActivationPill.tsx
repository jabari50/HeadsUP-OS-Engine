'use client'

import { cn } from '@/lib/utils'
import type { ActivationStatus } from '@/lib/vgm-types'

interface ActivationPillProps {
  status: ActivationStatus
  className?: string
}

const STATUS_STYLES: Record<ActivationStatus, { bg: string; text: string; label: string }> = {
  locked:    { bg: 'bg-[#374151]', text: 'text-white',      label: 'Locked' },
  preview:   { bg: 'bg-[#D97706]', text: 'text-white',      label: 'Preview' },
  full:      { bg: 'bg-teal',      text: 'text-navy',       label: 'Full Unlock' },
  exclusive: { bg: 'bg-gold',      text: 'text-navy',       label: 'Exclusive' },
}

/** Status pill showing activation lock state */
export function ActivationPill({ status, className }: ActivationPillProps) {
  const { bg, text, label } = STATUS_STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        bg, text, className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  )
}
