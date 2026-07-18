import { NextRequest, NextResponse } from 'next/server'
import { runMatchmaking } from '@/lib/vgm-anthropic'
import { DEMO_PROGRAM } from '@/data/seed'
import type { Player } from '@/lib/vgm-types'

/** POST /api/virtual-gm/matchmaking — run AI matchmaking for a player */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { player: Player; programs?: typeof DEMO_PROGRAM[] }
    const { player } = body
    if (!player) {
      return NextResponse.json({ error: 'player object required' }, { status: 400 })
    }

    const programs = body.programs ?? [DEMO_PROGRAM]
    const results = await runMatchmaking(player, programs)
    return NextResponse.json({ results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
