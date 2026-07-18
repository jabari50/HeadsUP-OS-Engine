'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type BarColor = 'teal' | 'gold' | 'purple' | 'coral'

interface FitScoreBarProps {
  score: number       // 0–100
  label?: string
  showValue?: boolean
  color?: BarColor
  className?: string
}

const COLOR_CLASSES: Record<BarColor, { bar: string; text: string }> = {
  teal:   { bar: 'bg-teal',         text: 'text-teal' },
  gold:   { bar: 'bg-[#f5c518]',    text: 'text-[#f5c518]' },
  purple: { bar: 'bg-[#c084fc]',    text: 'text-[#c084fc]' },
  coral:  { bar: 'bg-[#ff6b6b]',    text: 'text-[#ff6b6b]' },
}

/** Full-width animated fit score bar */
export function FitScoreBar({ score, label, showValue = true, color = 'teal', className }: FitScoreBarProps) {
  const [animated, setAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timeout)
  }, [])

  const pct = Math.max(0, Math.min(100, score))
  const { bar, text } = COLOR_CLASSES[color]

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-vgm-gray uppercase tracking-wide">{label}</span>}
          {showValue && (
            <span className={cn('text-xs font-bold ml-auto', text)}>{pct}</span>
          )}
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-border-subtle overflow-hidden" ref={ref}>
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', bar)}
          style={{ width: animated ? `${pct}%` : '0%' }}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>
    </div>
  )
}
