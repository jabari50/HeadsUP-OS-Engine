import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import type { Player, Program } from './vgm-types'

const DB_DIR = path.join(process.cwd(), 'storage')
const DB_PATH = path.join(DB_DIR, 'virtual_gm.db')

let _db: Database.Database | null = null

/** Get or create the singleton SQLite connection */
export function getDB(): Database.Database {
  if (_db) return _db
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  initSchema(_db)
  return _db
}

function initSchema(db: Database.Database): void {
  // Idempotent migration: add academic column if missing
  const cols = db.prepare("PRAGMA table_info(players)").all() as { name: string }[]
  if (cols.length > 0 && !cols.find(c => c.name === 'academic')) {
    db.exec("ALTER TABLE players ADD COLUMN academic TEXT")
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      player_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      position TEXT NOT NULL,
      class_year TEXT NOT NULL,
      high_school TEXT NOT NULL,
      aau_program TEXT NOT NULL,
      height_inches INTEGER NOT NULL,
      weight_lbs INTEGER NOT NULL,
      ovr INTEGER NOT NULL,
      tier TEXT NOT NULL,
      activation_status TEXT NOT NULL DEFAULT 'locked',
      technical TEXT NOT NULL,
      neural TEXT NOT NULL,
      academic TEXT,
      fit_score REAL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS programs (
      program_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      head_coach TEXT NOT NULL,
      system TEXT NOT NULL,
      season TEXT NOT NULL,
      record TEXT NOT NULL,
      conference TEXT NOT NULL,
      roster_gaps TEXT NOT NULL,
      portal_window_open INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activation_log (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      operator TEXT NOT NULL,
      credits_used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

/** Upsert a player row (serializes JSONB fields) */
export function upsertPlayer(db: Database.Database, player: Player): void {
  const stmt = db.prepare(`
    INSERT INTO players (player_id, full_name, position, class_year, high_school, aau_program,
      height_inches, weight_lbs, ovr, tier, activation_status, technical, neural, academic, fit_score, updated_at)
    VALUES (@player_id, @full_name, @position, @class_year, @high_school, @aau_program,
      @height_inches, @weight_lbs, @ovr, @tier, @activation_status, @technical, @neural, @academic, @fit_score, datetime('now'))
    ON CONFLICT(player_id) DO UPDATE SET
      full_name=excluded.full_name, position=excluded.position, class_year=excluded.class_year,
      high_school=excluded.high_school, aau_program=excluded.aau_program,
      height_inches=excluded.height_inches, weight_lbs=excluded.weight_lbs,
      ovr=excluded.ovr, tier=excluded.tier, activation_status=excluded.activation_status,
      technical=excluded.technical, neural=excluded.neural, academic=excluded.academic,
      fit_score=excluded.fit_score, updated_at=datetime('now')
  `)
  stmt.run({
    ...player,
    technical: JSON.stringify(player.technical),
    neural: JSON.stringify(player.neural),
    academic: JSON.stringify(player.academic),
    fit_score: player.fit_score ?? null,
  })
}

/** Deserialize a raw DB row back into a Player */
function rowToPlayer(row: Record<string, unknown>): Player {
  return {
    ...(row as Omit<Player, 'technical' | 'neural' | 'academic'>),
    technical: JSON.parse(row.technical as string),
    neural: JSON.parse(row.neural as string),
    academic: row.academic ? JSON.parse(row.academic as string) : {
      gpa: 0, gpa_tier: 'at_risk', eligibility_status: 'at_risk',
      core_courses_complete: false, academic_accountability_score: 1, program_fit: 'gap',
    },
  } as Player
}

/** Fetch all players, ordered by OVR descending */
export function getAllPlayers(db: Database.Database): Player[] {
  const rows = db.prepare('SELECT * FROM players ORDER BY ovr DESC').all()
  return rows.map(r => rowToPlayer(r as Record<string, unknown>))
}

/** Fetch a single player by ID */
export function getPlayerById(db: Database.Database, player_id: string): Player | undefined {
  const row = db.prepare('SELECT * FROM players WHERE player_id = ?').get(player_id)
  return row ? rowToPlayer(row as Record<string, unknown>) : undefined
}

/** Update activation status and log the change */
export function updateActivationStatus(
  db: Database.Database,
  player_id: string,
  to_status: Player['activation_status'],
  operator: string,
  credits_used: number,
): void {
  const player = getPlayerById(db, player_id)
  if (!player) throw new Error(`Player ${player_id} not found`)

  db.transaction(() => {
    db.prepare(`UPDATE players SET activation_status = ?, updated_at = datetime('now') WHERE player_id = ?`)
      .run(to_status, player_id)
    db.prepare(`INSERT INTO activation_log (player_id, from_status, to_status, operator, credits_used) VALUES (?, ?, ?, ?, ?)`)
      .run(player_id, player.activation_status, to_status, operator, credits_used)
  })()
}

/** Upsert the demo program */
export function upsertProgram(db: Database.Database, program: Program): void {
  const stmt = db.prepare(`
    INSERT INTO programs (program_id, name, head_coach, system, season, record, conference, roster_gaps, portal_window_open)
    VALUES (@program_id, @name, @head_coach, @system, @season, @record, @conference, @roster_gaps, @portal_window_open)
    ON CONFLICT(program_id) DO UPDATE SET
      name=excluded.name, head_coach=excluded.head_coach, system=excluded.system,
      season=excluded.season, record=excluded.record, conference=excluded.conference,
      roster_gaps=excluded.roster_gaps, portal_window_open=excluded.portal_window_open
  `)
  stmt.run({
    ...program,
    roster_gaps: JSON.stringify(program.roster_gaps),
    portal_window_open: program.portal_window_open ? 1 : 0,
  })
}

/** Fetch the demo program */
export function getProgram(db: Database.Database, program_id: string): Program | undefined {
  const row = db.prepare('SELECT * FROM programs WHERE program_id = ?').get(program_id) as Record<string, unknown> | undefined
  if (!row) return undefined
  return {
    ...(row as Omit<Program, 'roster_gaps' | 'portal_window_open'>),
    roster_gaps: JSON.parse(row.roster_gaps as string),
    portal_window_open: Boolean(row.portal_window_open),
  } as Program
}
