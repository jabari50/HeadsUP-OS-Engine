import { NextRequest, NextResponse } from 'next/server'
import { generateRIB } from '@/lib/vgm-anthropic'
import { getDB, getAllPlayers } from '@/lib/db'
import { DEMO_PROGRAM } from '@/data/seed'

/** POST /api/virtual-gm/rib — generate a Roster Intelligence Brief via Claude */
export async function POST(_req: NextRequest) {
  try {
    const db = getDB()
    const players = getAllPlayers(db)
    const rib = await generateRIB(DEMO_PROGRAM, players)
    return NextResponse.json(rib)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
