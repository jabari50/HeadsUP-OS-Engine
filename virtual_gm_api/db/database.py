"""
database.py — The Virtual GM · Local SQLite Operator Node
7 tables: players, operators, fit_scores, activation_locks, ribs, sync_log, auth_events.
All datetimes stored as ISO-8601 UTC strings.  No secrets in this file.
"""
from __future__ import annotations

import json
import logging
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Generator, Optional

logger = logging.getLogger(__name__)

# ── Schema DDL ─────────────────────────────────────────────────────────────────

_DDL = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS players (
    player_id          TEXT PRIMARY KEY,
    full_name          TEXT NOT NULL,
    position           TEXT NOT NULL,
    grad_year          INTEGER NOT NULL,
    high_school        TEXT,
    aau_program        TEXT,
    height_inches      INTEGER,
    weight_lbs         INTEGER,
    wingspan_inches    INTEGER,
    gpa                REAL,
    eligibility_status TEXT NOT NULL DEFAULT 'active',
    committed_college  TEXT,
    ncaa_id            TEXT,
    data_source        TEXT NOT NULL DEFAULT 'manual',
    activation_status  TEXT NOT NULL DEFAULT 'locked',
    pro_file_os_id     TEXT,
    sync_status        TEXT NOT NULL DEFAULT 'pending',
    ingestion_date     TEXT NOT NULL,
    last_modified      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS operators (
    operator_id          TEXT PRIMARY KEY,
    operator_name        TEXT NOT NULL,
    email                TEXT NOT NULL UNIQUE,
    license_tier         TEXT NOT NULL DEFAULT 'solo',
    license_key          TEXT NOT NULL UNIQUE,
    program_name         TEXT,
    program_city         TEXT,
    program_state        TEXT,
    unlock_credits_used  INTEGER NOT NULL DEFAULT 0,
    max_unlocks          INTEGER NOT NULL DEFAULT 5,
    session_token        TEXT,
    token_issued_at      TEXT,
    token_expires_at     TEXT,
    session_state        TEXT NOT NULL DEFAULT 'locked',
    approved_by_master   INTEGER NOT NULL DEFAULT 0,
    created_at           TEXT NOT NULL,
    last_login           TEXT
);

CREATE TABLE IF NOT EXISTS fit_scores (
    score_id        TEXT PRIMARY KEY,
    player_id       TEXT NOT NULL,
    operator_id     TEXT NOT NULL,
    system_fit      REAL NOT NULL,
    need_fit        REAL NOT NULL,
    level_fit       REAL NOT NULL,
    cultural_fit    REAL NOT NULL,
    composite_score REAL NOT NULL,
    recommendation  TEXT NOT NULL,
    signals         TEXT NOT NULL DEFAULT '[]',   -- JSON array
    computed_at     TEXT NOT NULL,
    FOREIGN KEY (player_id)   REFERENCES players(player_id),
    FOREIGN KEY (operator_id) REFERENCES operators(operator_id)
);

CREATE TABLE IF NOT EXISTS activation_locks (
    lock_id                  TEXT PRIMARY KEY,
    player_id                TEXT NOT NULL,
    operator_id              TEXT NOT NULL,
    requested_status         TEXT NOT NULL,
    current_status           TEXT NOT NULL DEFAULT 'locked',
    requires_master_approval INTEGER NOT NULL DEFAULT 1,
    approved                 INTEGER NOT NULL DEFAULT 0,
    approved_by              TEXT,
    approved_at              TEXT,
    requested_at             TEXT NOT NULL,
    notes                    TEXT,
    FOREIGN KEY (player_id)   REFERENCES players(player_id),
    FOREIGN KEY (operator_id) REFERENCES operators(operator_id)
);

CREATE TABLE IF NOT EXISTS ribs (
    rib_id               TEXT PRIMARY KEY,
    operator_id          TEXT NOT NULL,
    week_label           TEXT NOT NULL,
    generated_at         TEXT NOT NULL,
    roster_count         INTEGER NOT NULL DEFAULT 0,
    eligible_count       INTEGER NOT NULL DEFAULT 0,
    ineligible_count     INTEGER NOT NULL DEFAULT 0,
    watch_count          INTEGER NOT NULL DEFAULT 0,
    team_gpa             REAL,
    raw_json             TEXT,           -- full JSON blob of the RIB
    FOREIGN KEY (operator_id) REFERENCES operators(operator_id)
);

CREATE TABLE IF NOT EXISTS sync_log (
    log_id       TEXT PRIMARY KEY,
    operator_id  TEXT,
    player_id    TEXT,
    event_type   TEXT NOT NULL,   -- sync_roster | verify_school | verify_ncaa | unlock | rib
    status       TEXT NOT NULL,   -- success | failure | pending
    message      TEXT,
    created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_events (
    event_id    TEXT PRIMARY KEY,
    operator_id TEXT,
    event_type  TEXT NOT NULL,    -- login | token_issued | token_expired | admin_action
    ip_hint     TEXT,             -- first 3 octets only for privacy
    detail      TEXT,
    created_at  TEXT NOT NULL
);
"""

# ── Context manager ────────────────────────────────────────────────────────────

@contextmanager
def _conn(db_path: str) -> Generator[sqlite3.Connection, None, None]:
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


# ── Init ───────────────────────────────────────────────────────────────────────

def initialize_db(db_path: str) -> None:
    """Create all 7 tables (idempotent)."""
    with _conn(db_path) as con:
        con.executescript(_DDL)
    logger.info("DB initialised at %s", db_path)


# ── Utilities ──────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    import uuid
    return str(uuid.uuid4())


def _log(db_path: str, event_type: str, status: str, message: str = "",
         operator_id: Optional[str] = None, player_id: Optional[str] = None) -> None:
    row = {
        "log_id": _new_id(), "operator_id": operator_id, "player_id": player_id,
        "event_type": event_type, "status": status, "message": message,
        "created_at": _now(),
    }
    try:
        with _conn(db_path) as con:
            con.execute(
                "INSERT INTO sync_log VALUES (:log_id,:operator_id,:player_id,"
                ":event_type,:status,:message,:created_at)", row)
    except Exception as exc:
        logger.warning("sync_log insert failed: %s", exc)


def _auth_event(db_path: str, event_type: str, operator_id: Optional[str] = None,
                detail: str = "") -> None:
    row = {
        "event_id": _new_id(), "operator_id": operator_id,
        "event_type": event_type, "ip_hint": None, "detail": detail,
        "created_at": _now(),
    }
    try:
        with _conn(db_path) as con:
            con.execute(
                "INSERT INTO auth_events VALUES "
                "(:event_id,:operator_id,:event_type,:ip_hint,:detail,:created_at)", row)
    except Exception as exc:
        logger.warning("auth_events insert failed: %s", exc)


# ── Players ────────────────────────────────────────────────────────────────────

def insert_player(player: dict, db_path: str) -> str:
    """Upsert a player row. Returns player_id."""
    player.setdefault("player_id", _new_id())
    player.setdefault("ingestion_date", _now())
    player.setdefault("last_modified", _now())
    cols = ",".join(player.keys())
    placeholders = ",".join(f":{k}" for k in player)
    with _conn(db_path) as con:
        con.execute(f"INSERT OR REPLACE INTO players ({cols}) VALUES ({placeholders})", player)
    _log(db_path, "insert_player", "success", f"player_id={player['player_id']}")
    logger.info("Player inserted: %s", player.get("full_name"))
    return player["player_id"]


def get_player(player_id: str, db_path: str) -> Optional[dict]:
    with _conn(db_path) as con:
        row = con.execute("SELECT * FROM players WHERE player_id=?", (player_id,)).fetchone()
    return dict(row) if row else None


def get_all_players(db_path: str) -> list[dict]:
    with _conn(db_path) as con:
        rows = con.execute("SELECT * FROM players ORDER BY grad_year,position").fetchall()
    return [dict(r) for r in rows]


def update_player_field(player_id: str, field: str, value, db_path: str) -> None:
    with _conn(db_path) as con:
        con.execute(
            f"UPDATE players SET {field}=?, last_modified=? WHERE player_id=?",
            (value, _now(), player_id))


def update_activation_status(player_id: str, status: str, db_path: str) -> None:
    update_player_field(player_id, "activation_status", status, db_path)
    _log(db_path, "unlock", "success", f"status→{status}", player_id=player_id)
    logger.info("Activation updated: %s → %s", player_id, status)


# ── Operators ──────────────────────────────────────────────────────────────────

def insert_operator(op: dict, db_path: str) -> str:
    op.setdefault("operator_id", _new_id())
    op.setdefault("created_at", _now())
    cols = ",".join(op.keys())
    placeholders = ",".join(f":{k}" for k in op)
    with _conn(db_path) as con:
        con.execute(f"INSERT OR REPLACE INTO operators ({cols}) VALUES ({placeholders})", op)
    _auth_event(db_path, "onboard", op["operator_id"], f"tier={op.get('license_tier')}")
    logger.info("Operator onboarded: %s", op.get("operator_name"))
    return op["operator_id"]


def get_operator_by_token(token: str, db_path: str) -> Optional[dict]:
    with _conn(db_path) as con:
        row = con.execute(
            "SELECT * FROM operators WHERE session_token=?", (token,)).fetchone()
    return dict(row) if row else None


def get_operator(operator_id: str, db_path: str) -> Optional[dict]:
    with _conn(db_path) as con:
        row = con.execute(
            "SELECT * FROM operators WHERE operator_id=?", (operator_id,)).fetchone()
    return dict(row) if row else None


def set_operator_token(operator_id: str, token: str, expires_at: str,
                       db_path: str) -> None:
    with _conn(db_path) as con:
        con.execute(
            "UPDATE operators SET session_token=?,token_issued_at=?,token_expires_at=?,"
            "session_state='active',last_login=? WHERE operator_id=?",
            (token, _now(), expires_at, _now(), operator_id))
    _auth_event(db_path, "token_issued", operator_id, f"expires={expires_at}")
    logger.info("Token issued for operator %s", operator_id)


def update_operator_session_state(operator_id: str, state: str, db_path: str) -> None:
    with _conn(db_path) as con:
        con.execute(
            "UPDATE operators SET session_state=? WHERE operator_id=?",
            (state, operator_id))


def consume_unlock_credit(operator_id: str, db_path: str) -> bool:
    """
    Decrement one unlock credit.
    Returns True on success, False if credits exhausted.
    Logs every call to sync_log.
    """
    op = get_operator(operator_id, db_path)
    if op is None:
        logger.warning("consume_unlock_credit: operator %s not found", operator_id)
        return False
    used = op["unlock_credits_used"]
    cap  = op["max_unlocks"]
    if used >= cap:
        _log(db_path, "unlock", "failure",
             f"credits exhausted ({used}/{cap})", operator_id=operator_id)
        logger.warning("Unlock credits exhausted for %s (%s/%s)", operator_id, used, cap)
        return False
    with _conn(db_path) as con:
        con.execute(
            "UPDATE operators SET unlock_credits_used=unlock_credits_used+1 "
            "WHERE operator_id=?", (operator_id,))
    _log(db_path, "unlock", "success",
         f"credit consumed ({used+1}/{cap})", operator_id=operator_id)
    return True


# ── Fit Scores ─────────────────────────────────────────────────────────────────

def insert_fit_score(score: dict, db_path: str) -> str:
    score.setdefault("score_id", _new_id())
    score.setdefault("computed_at", _now())
    if "signals" in score and isinstance(score["signals"], list):
        score["signals"] = json.dumps(score["signals"])
    cols = ",".join(score.keys())
    placeholders = ",".join(f":{k}" for k in score)
    with _conn(db_path) as con:
        con.execute(f"INSERT OR REPLACE INTO fit_scores ({cols}) VALUES ({placeholders})", score)
    _log(db_path, "fit_score", "success",
         f"composite={score.get('composite_score')}",
         operator_id=score.get("operator_id"), player_id=score.get("player_id"))
    return score["score_id"]


def get_fit_scores_for_operator(operator_id: str, db_path: str) -> list[dict]:
    with _conn(db_path) as con:
        rows = con.execute(
            "SELECT * FROM fit_scores WHERE operator_id=? ORDER BY composite_score DESC",
            (operator_id,)).fetchall()
    results = []
    for r in rows:
        d = dict(r)
        d["signals"] = json.loads(d.get("signals") or "[]")
        results.append(d)
    return results


# ── Activation Locks ───────────────────────────────────────────────────────────

def insert_activation_lock(lock: dict, db_path: str) -> str:
    lock.setdefault("lock_id", _new_id())
    lock.setdefault("requested_at", _now())
    lock["requires_master_approval"] = int(lock.get("requires_master_approval", 1))
    lock["approved"]                 = int(lock.get("approved", 0))
    cols = ",".join(lock.keys())
    placeholders = ",".join(f":{k}" for k in lock)
    with _conn(db_path) as con:
        con.execute(f"INSERT OR REPLACE INTO activation_locks ({cols}) VALUES ({placeholders})",
                    lock)
    _log(db_path, "unlock", "pending",
         f"requested_status={lock.get('requested_status')}",
         operator_id=lock.get("operator_id"), player_id=lock.get("player_id"))
    return lock["lock_id"]


def get_activation_lock(lock_id: str, db_path: str) -> Optional[dict]:
    with _conn(db_path) as con:
        row = con.execute(
            "SELECT * FROM activation_locks WHERE lock_id=?", (lock_id,)).fetchone()
    return dict(row) if row else None


def get_pending_locks(db_path: str) -> list[dict]:
    with _conn(db_path) as con:
        rows = con.execute(
            "SELECT * FROM activation_locks WHERE approved=0 "
            "AND requires_master_approval=1 ORDER BY requested_at").fetchall()
    return [dict(r) for r in rows]


def approve_activation_lock(lock_id: str, approved_by: str, approved: bool,
                             notes: Optional[str], db_path: str) -> None:
    now = _now()
    with _conn(db_path) as con:
        con.execute(
            "UPDATE activation_locks SET approved=?,approved_by=?,approved_at=?,notes=? "
            "WHERE lock_id=?",
            (int(approved), approved_by, now, notes, lock_id))
    _auth_event(db_path, "admin_action", approved_by,
                f"lock_id={lock_id} approved={approved}")
    logger.info("Activation lock %s approved=%s by %s", lock_id, approved, approved_by)


# ── RIBs ───────────────────────────────────────────────────────────────────────

def insert_rib(rib: dict, db_path: str) -> str:
    rib.setdefault("rib_id", _new_id())
    rib.setdefault("generated_at", _now())
    cols = ",".join(rib.keys())
    placeholders = ",".join(f":{k}" for k in rib)
    with _conn(db_path) as con:
        con.execute(f"INSERT OR REPLACE INTO ribs ({cols}) VALUES ({placeholders})", rib)
    _log(db_path, "rib", "success", f"week={rib.get('week_label')}",
         operator_id=rib.get("operator_id"))
    logger.info("RIB generated: %s / %s", rib.get("operator_id"), rib.get("week_label"))
    return rib["rib_id"]


def get_latest_rib(operator_id: str, db_path: str) -> Optional[dict]:
    with _conn(db_path) as con:
        row = con.execute(
            "SELECT * FROM ribs WHERE operator_id=? ORDER BY generated_at DESC LIMIT 1",
            (operator_id,)).fetchone()
    return dict(row) if row else None


# ── Sync log (read) ────────────────────────────────────────────────────────────

def get_sync_events(operator_id: str, db_path: str, limit: int = 50) -> list[dict]:
    with _conn(db_path) as con:
        rows = con.execute(
            "SELECT * FROM sync_log WHERE operator_id=? ORDER BY created_at DESC LIMIT ?",
            (operator_id, limit)).fetchall()
    return [dict(r) for r in rows]
