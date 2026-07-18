import { NextResponse } from 'next/server'
import { getDB, getAllPlayers } from '@/lib/db'

/** GET /api/virtual-gm/players — return all players ordered by OVR */
export async function GET() {
  try {
    const db = getDB()
    const players = getAllPlayers(db)
    return NextResponse.json(players)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
