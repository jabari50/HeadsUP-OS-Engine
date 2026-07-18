import { NextRequest, NextResponse } from 'next/server'
import { getDB, updateActivationStatus } from '@/lib/db'
import { UNLOCK_CREDIT_COST, ACTIVATION_CYCLE } from '@/lib/vgm-constants'
import type { ActivationStatus } from '@/lib/vgm-types'

/** POST /api/virtual-gm/activation — cycle a player's activation status */
export async function POST(req: NextRequest) {
  try {
    const { player_id, to_status } = await req.json() as { player_id: string; to_status: ActivationStatus }

    if (!player_id || !to_status) {
      return NextResponse.json({ error: 'player_id and to_status required' }, { status: 400 })
    }

    if (!ACTIVATION_CYCLE.includes(to_status)) {
      return NextResponse.json({ error: `Invalid status: ${to_status}` }, { status: 400 })
    }

    const credits_used = UNLOCK_CREDIT_COST[to_status] ?? 0
    const db = getDB()
    updateActivationStatus(db, player_id, to_status, 'Westbrook University', credits_used)

    return NextResponse.json({ ok: true, player_id, to_status, credits_used })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
