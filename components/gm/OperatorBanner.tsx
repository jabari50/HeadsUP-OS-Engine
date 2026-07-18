'use client'

import type { OperatorContext } from '@/lib/vgm-types'

interface OperatorBannerProps {
  operator: OperatorContext
}

/** Sticky top banner showing operator name, license tier, credits, and portal status */
export function OperatorBanner({ operator }: OperatorBannerProps) {
  return (
    <div className="bg-navy border-b border-border-subtle px-4 py-2 flex items-center justify-between text-xs text-vgm-gray gap-2 flex-wrap">
      <div className="flex items-center gap-3">
        <span className="font-bold text-cream">{operator.name}</span>
        <span className="text-border-subtle">|</span>
        <span>GM License</span>
        <span className="text-border-subtle">|</span>
        <span>
          <span className="text-teal font-bold">{operator.credits_remaining}</span> Unlock Credits
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 font-semibold ${
            operator.portal_open ? 'text-teal' : 'text-vgm-gray'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${operator.portal_open ? 'bg-teal' : 'bg-vgm-gray'}`} />
          Portal: {operator.portal_open ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
    </div>
  )
}
