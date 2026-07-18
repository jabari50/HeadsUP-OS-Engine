"""
SQLite interface layer for The Digital GM.

Uses pandas for all reads and bulk inserts; direct sqlite3 cursor for
single-row updates. Every operation is logged and wrapped in try/except.
"""

import sqlite3
import traceback
from typing import Optional

import pandas as pd

from core.schema import PLAYER_SCHEMA, TEAM_SCHEMA, PROGRAM_SCHEMA
from utils.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# DDL — table creation statements
# ---------------------------------------------------------------------------
_CREATE_PLAYERS = """
CREATE TABLE IF NOT EXISTS players (
    player_id           TEXT PRIMARY KEY,
    full_name           TEXT,
    grad_year           INTEGER,
    position            TEXT,
    high_school         TEXT,
    aau_program         TEXT,
    height_inches       INTEGER,
    weight_lbs          INTEGER,
    wingspan_inches     INTEGER,
    eligibility_status  TEXT,
    committed_college   TEXT,
    ncaa_id             TEXT,
    data_source         TEXT,
    ingestion_date      TEXT,
    last_modified       TEXT,
    ingested_by         TEXT,
    verification_needed INTEGER,
    verification_reason TEXT,
    sync_status         TEXT
);
"""

_CREATE_TEAMS = """
CREATE TABLE IF NOT EXISTS teams (
    team_id      TEXT PRIMARY KEY,
    program_id   TEXT,
    team_name    TEXT,
    age_group    TEXT,
    head_coach   TEXT,
    season_year  INTEGER,
    created_date TEXT
);
"""

_CREATE_PROGRAMS = """
CREATE TABLE IF NOT EXISTS programs (
    program_id      TEXT PRIMARY KEY,
    program_name    TEXT,
    city            TEXT,
    state           TEXT,
    operator_name   TEXT,
    operator_email  TEXT,
    os_license_tier TEXT,
    license_key     TEXT,
    created_date    TEXT
);
"""


# ---------------------------------------------------------------------------
# Initialization
# ---------------------------------------------------------------------------

def initialize_db(db_path: str) -> None:
    """
    Create all tables if they do not already exist.

    Args:
        db_path: Filesystem path to the SQLite database file.
    """
    logger.info("Initializing database at '%s'", db_path)
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.executescript(_CREATE_PLAYERS + _CREATE_TEAMS + _CREATE_PROGRAMS)
            conn.commit()
        logger.info("Database tables verified / created.")
    except Exception:
        logger.error("Failed to initialize database:\n%s", traceback.format_exc())
        raise


# ---------------------------------------------------------------------------
# Player operations
# ---------------------------------------------------------------------------

def insert_player(df_row: pd.DataFrame, db_path: str) -> None:
    """
    Insert one sanitized player row into the players table.

    Args:
        df_row:  Single-row DataFrame matching PLAYER_SCHEMA column order.
        db_path: Path to the SQLite database.
    """
    logger.info("Inserting player: %s", df_row.get("player_id", ["unknown"]).values[0]
                if hasattr(df_row.get("player_id", None), "values") else df_row.iloc[0].get("player_id", "unknown"))
    try:
        with sqlite3.connect(db_path) as conn:
            df_row.to_sql("players", conn, if_exists="append", index=False)
        logger.info("Player inserted successfully.")
    except Exception:
        logger.error("Failed to insert player:\n%s", traceback.format_exc())
        raise


def get_all_players(db_path: str, team_id: Optional[str] = None) -> pd.DataFrame:
    """
    Return all players, optionally filtered by team_id.

    Args:
        db_path: Path to the SQLite database.
        team_id: If provided, filter players by this team (requires a join — stub for Phase 2).

    Returns:
        DataFrame with all matching player rows.
    """
    logger.info("Fetching all players (team_id filter: %s)", team_id)
    try:
        with sqlite3.connect(db_path) as conn:
            query = "SELECT * FROM players"
            df = pd.read_sql_query(query, conn)
        logger.info("Fetched %d player records.", len(df))
        return df
    except Exception:
        logger.error("Failed to fetch players:\n%s", traceback.format_exc())
        raise


def get_player_by_id(player_id: str, db_path: str) -> pd.DataFrame:
    """
    Return a single player row as a DataFrame.

    Args:
        player_id: UUID string identifying the player.
        db_path:   Path to the SQLite database.

    Returns:
        Single-row DataFrame, or empty DataFrame if not found.
    """
    logger.info("Fetching player by id: %s", player_id)
    try:
        with sqlite3.connect(db_path) as conn:
            query = "SELECT * FROM players WHERE player_id = ?"
            df = pd.read_sql_query(query, conn, params=(player_id,))
        logger.info("Player fetch returned %d row(s).", len(df))
        return df
    except Exception:
        logger.error("Failed to fetch player %s:\n%s", player_id, traceback.format_exc())
        raise


def update_player(player_id: str, updates_dict: dict, db_path: str) -> None:
    """
    Update arbitrary fields on a player record.

    Args:
        player_id:   UUID string identifying the player.
        updates_dict: Dict of {column: new_value} pairs to update.
        db_path:     Path to the SQLite database.
    """
    if not updates_dict:
        logger.warning("update_player called with empty updates_dict for %s — no-op.", player_id)
        return

    set_clause = ", ".join(f"{col} = ?" for col in updates_dict)
    values = list(updates_dict.values()) + [player_id]
    sql = f"UPDATE players SET {set_clause} WHERE player_id = ?"
    logger.info("Updating player %s: fields=%s", player_id, list(updates_dict.keys()))

    try:
        with sqlite3.connect(db_path) as conn:
            conn.execute(sql, values)
            conn.commit()
        logger.info("Player %s updated successfully.", player_id)
    except Exception:
        logger.error("Failed to update player %s:\n%s", player_id, traceback.format_exc())
        raise


def update_sync_status(player_id: str, status: str, db_path: str) -> None:
    """
    Update only the sync_status field for a player.

    Args:
        player_id: UUID string identifying the player.
        status:    One of VALID_SYNC_STATUS values.
        db_path:   Path to the SQLite database.
    """
    logger.info("Updating sync_status for player %s → '%s'", player_id, status)
    try:
        with sqlite3.connect(db_path) as conn:
            conn.execute(
                "UPDATE players SET sync_status = ? WHERE player_id = ?",
                (status, player_id),
            )
            conn.commit()
        logger.info("sync_status updated for %s.", player_id)
    except Exception:
        logger.error("Failed to update sync_status for %s:\n%s", player_id, traceback.format_exc())
        raise


def get_pending_sync(db_path: str) -> pd.DataFrame:
    """
    Return all players with sync_status = 'pending'.

    Args:
        db_path: Path to the SQLite database.

    Returns:
        DataFrame of unsynced player rows.
    """
    logger.info("Fetching players with pending sync status.")
    try:
        with sqlite3.connect(db_path) as conn:
            df = pd.read_sql_query(
                "SELECT * FROM players WHERE sync_status = 'pending'", conn
            )
        logger.info("Found %d pending sync records.", len(df))
        return df
    except Exception:
        logger.error("Failed to fetch pending sync records:\n%s", traceback.format_exc())
        raise


# ---------------------------------------------------------------------------
# Program operations
# ---------------------------------------------------------------------------

def initialize_program(program_data_dict: dict, db_path: str) -> None:
    """
    Insert a program record into the programs table.

    Args:
        program_data_dict: Dict matching PROGRAM_SCHEMA columns.
        db_path:           Path to the SQLite database.
    """
    logger.info("Inserting program: %s", program_data_dict.get("program_name", "unknown"))
    try:
        df = pd.DataFrame([program_data_dict])
        with sqlite3.connect(db_path) as conn:
            df.to_sql("programs", conn, if_exists="append", index=False)
        logger.info("Program inserted successfully.")
    except Exception:
        logger.error("Failed to insert program:\n%s", traceback.format_exc())
        raise


# ---------------------------------------------------------------------------
# Team operations
# ---------------------------------------------------------------------------

def create_team(team_data_dict: dict, db_path: str) -> None:
    """
    Insert a team record into the teams table.

    Args:
        team_data_dict: Dict matching TEAM_SCHEMA columns.
        db_path:        Path to the SQLite database.
    """
    logger.info("Inserting team: %s", team_data_dict.get("team_name", "unknown"))
    try:
        df = pd.DataFrame([team_data_dict])
        with sqlite3.connect(db_path) as conn:
            df.to_sql("teams", conn, if_exists="append", index=False)
        logger.info("Team inserted successfully.")
    except Exception:
        logger.error("Failed to insert team:\n%s", traceback.format_exc())
        raise


def get_all_teams(db_path: str) -> pd.DataFrame:
    """
    Return all team records.

    Args:
        db_path: Path to the SQLite database.

    Returns:
        DataFrame of all team rows.
    """
    logger.info("Fetching all teams.")
    try:
        with sqlite3.connect(db_path) as conn:
            df = pd.read_sql_query("SELECT * FROM teams", conn)
        logger.info("Fetched %d team records.", len(df))
        return df
    except Exception:
        logger.error("Failed to fetch teams:\n%s", traceback.format_exc())
        raise
