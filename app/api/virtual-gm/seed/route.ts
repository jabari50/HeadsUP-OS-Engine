import { NextResponse } from 'next/server'
import { getDB, upsertPlayer, upsertProgram } from '@/lib/db'
import { DEMO_PLAYERS, DEMO_PROGRAM } from '@/data/seed'
import { computeFitScore } from '@/lib/matchmaking'

/** POST /api/virtual-gm/seed — seed DB with demo data */
export async function POST() {
  try {
    const db = getDB()
    upsertProgram(db, DEMO_PROGRAM)
    for (const player of DEMO_PLAYERS) {
      const fit_score = computeFitScore(player, DEMO_PROGRAM)
      upsertPlayer(db, { ...player, fit_score })
    }
    return NextResponse.json({ ok: true, seeded: DEMO_PLAYERS.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/** GET /api/virtual-gm/seed — check seed status */
export async function GET() {
  try {
    const db = getDB()
    const count = (db.prepare('SELECT COUNT(*) as n FROM players').get() as { n: number }).n
    return NextResponse.json({ seeded: count > 0, player_count: count })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
