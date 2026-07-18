"""
session.py — The Virtual GM · 7-Day Session Token Lifecycle
States:  Active (days 0–5) → Read-Only (days 5–7) → Locked (>7 days)

All tokens are 64-character hex secrets generated via secrets.token_hex.
Tokens are stored ONLY in the local SQLite DB and compared in constant-time.
"""
from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from db.database import (
    _auth_event,
    get_operator_by_token,
    set_operator_token,
    update_operator_session_state,
)
from models.data_models import SessionState

logger = logging.getLogger(__name__)

# Session window constants
_ACTIVE_DAYS    = 5
_READ_ONLY_DAYS = 7   # read-only between day 5 and day 7
_TOKEN_BYTES    = 32  # 32 bytes → 64 hex chars


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        dt = datetime.fromisoformat(ts)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


# ── Issue ─────────────────────────────────────────────────────────────────────

def issue_token(operator_id: str, db_path: str) -> str:
    """
    Generate a new 64-char session token valid for READ_ONLY_DAYS days.
    Stores it in the operators table and logs the auth event.
    Returns the raw token string (caller must deliver it to the operator).
    """
    token      = secrets.token_hex(_TOKEN_BYTES)
    expires_at = (_now() + timedelta(days=_READ_ONLY_DAYS)).isoformat()
    set_operator_token(operator_id, token, expires_at, db_path)
    logger.info("Token issued for operator %s (expires %s)", operator_id, expires_at)
    return token


# ── Validate ──────────────────────────────────────────────────────────────────

def validate_token(token: str, db_path: str) -> tuple[bool, Optional[str], SessionState]:
    """
    Validate a Bearer token and return (valid, operator_id, state).

    State transitions are computed on every call — no cron needed:
      • days 0–5  → ACTIVE
      • days 5–7  → READ_ONLY  (DB state updated once)
      • >7 days   → LOCKED     (DB state updated, token nulled)

    Returns (False, None, LOCKED) for any invalid/expired token.
    """
    if not token:
        return False, None, SessionState.LOCKED

    op = get_operator_by_token(token, db_path)
    if op is None:
        logger.debug("Token not found in DB")
        return False, None, SessionState.LOCKED

    operator_id = op["operator_id"]
    issued_at   = _parse(op.get("token_issued_at"))

    if issued_at is None:
        logger.warning("Token has no issued_at for operator %s", operator_id)
        return False, operator_id, SessionState.LOCKED

    age_days = (_now() - issued_at).total_seconds() / 86_400

    if age_days > _READ_ONLY_DAYS:
        # Expire: clear token, flip state
        if op.get("session_state") != SessionState.LOCKED.value:
            _expire_token(operator_id, db_path)
        _auth_event(db_path, "token_expired", operator_id, f"age={age_days:.1f}d")
        logger.info("Token expired for operator %s (age=%.1fd)", operator_id, age_days)
        return False, operator_id, SessionState.LOCKED

    if age_days > _ACTIVE_DAYS:
        state = SessionState.READ_ONLY
        if op.get("session_state") != state.value:
            update_operator_session_state(operator_id, state.value, db_path)
            _auth_event(db_path, "session_read_only", operator_id)
            logger.info("Operator %s → READ_ONLY", operator_id)
    else:
        state = SessionState.ACTIVE

    return True, operator_id, state


def _expire_token(operator_id: str, db_path: str) -> None:
    """Null out the token and set state to LOCKED."""
    from db.database import _conn
    with _conn(db_path) as con:
        con.execute(
            "UPDATE operators SET session_token=NULL,session_state='locked' "
            "WHERE operator_id=?", (operator_id,))
    logger.info("Token cleared for operator %s", operator_id)


# ── Revoke ────────────────────────────────────────────────────────────────────

def revoke_token(operator_id: str, db_path: str) -> None:
    """Hard-revoke a token (admin action)."""
    _expire_token(operator_id, db_path)
    _auth_event(db_path, "token_revoked", operator_id, "admin revoke")
    logger.info("Token revoked for operator %s (admin)", operator_id)


# ── Require-write guard ───────────────────────────────────────────────────────

def require_write_access(state: SessionState) -> bool:
    """
    Returns True only for ACTIVE sessions.
    READ_ONLY sessions may not mutate data (add players, unlock, generate RIBs).
    """
    return state == SessionState.ACTIVE
