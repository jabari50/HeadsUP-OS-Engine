import type { ReactNode } from 'react'
import Link from 'next/link'
import { OperatorBanner } from '@/components/gm/OperatorBanner'
import { DEMO_OPERATOR } from '@/lib/vgm-constants'

const NAV_LINKS = [
  { href: '/virtual-gm/dashboard',   label: 'Dashboard',   icon: '⬛' },
  { href: '/virtual-gm/draft-board', label: 'Draft Board', icon: '📋' },
  { href: '/virtual-gm/matchmaking', label: 'Matchmaking', icon: '🎯' },
  { href: '/virtual-gm/activation',  label: 'Activation',  icon: '🔐' },
  { href: '/virtual-gm/rib',         label: 'RIB',         icon: '📊' },
  { href: '/virtual-gm/academic',    label: 'Academic',    icon: '🎓' },
] as const

export default function VGMLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-bg text-cream flex flex-col">
      <OperatorBanner operator={{ ...DEMO_OPERATOR, license_tier: 'GM' }} />

      {/* Top nav brand strip */}
      <header className="bg-navy border-b border-border-subtle px-4 py-3 flex items-center gap-4">
        <Link href="/virtual-gm/dashboard" className="flex items-center gap-2 mr-4">
          <span className="font-display text-xl font-bold text-teal tracking-widest">VGM</span>
          <span className="hidden sm:block text-xs text-vgm-gray uppercase tracking-wider">The Virtual GM</span>
        </Link>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded text-sm text-vgm-gray hover:text-cream hover:bg-border-subtle transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <a
            href="/vgm-command/index.html"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-teal/10 text-teal border border-teal/30 hover:bg-teal hover:text-navy transition-colors"
          >
            <span>⚡</span> Command Center
          </a>
          <span className="text-xs bg-teal text-navy font-bold px-2 py-0.5 rounded">HeadsUp OS v2</span>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy border-t border-border-subtle flex">
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="flex-1 flex flex-col items-center py-2 text-[10px] text-vgm-gray hover:text-teal transition-colors gap-0.5"
          >
            <span className="text-lg leading-none">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
