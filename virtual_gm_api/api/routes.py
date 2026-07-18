"""
routes.py — The Virtual GM · Operator API (8 endpoints)
All routes require a valid Bearer session token validated via utils/session.py.
READ_ONLY sessions may call GET routes but not mutate data.
Secrets live in environment only — none hardcoded here.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.matchmaking_engine import calculate_fit_score
from core.roster_sync import sync_roster, verify_ncaa, verify_school
from db.database import (
    consume_unlock_credit,
    get_activation_lock,
    get_all_players,
    get_fit_scores_for_operator,
    get_latest_rib,
    get_operator,
    get_player,
    get_sync_events,
    insert_activation_lock,
    insert_fit_score,
    insert_player,
)
from models.data_models import (
    ActivatePlayerRequest,
    ActivationLock,
    ActivationStatus,
    AddPlayerRequest,
    FitScoreRequest,
    PlayerProfile,
    SessionState,
)
from utils.rib_generator import generate_rib
from utils.session import require_write_access, validate_token

logger       = logging.getLogger(__name__)
api_router   = APIRouter(prefix="/api/v1", tags=["operator"])
_bearer      = HTTPBearer(auto_error=False)

# ── Auth dependency ───────────────────────────────────────────────────────────

class _AuthContext:
    def __init__(self, operator_id: str, state: SessionState):
        self.operator_id = operator_id
        self.state       = state
        self.is_writable = require_write_access(state)


def _get_auth(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> _AuthContext:
    """
    Validate Bearer token.  Returns auth context with operator_id + session state.
    READ_ONLY sessions are permitted for GET routes only.
    LOCKED / missing tokens always raise 401.
    """
    db_path = request.app.state.db_path
    token   = creds.credentials if creds else None

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    valid, operator_id, state = validate_token(token, db_path)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid or expired. Request a new token from your administrator.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _AuthContext(operator_id, state)


def _require_write(auth: _AuthContext) -> None:
    """Raise 403 if session is READ_ONLY."""
    if not auth.is_writable:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session is read-only (>5 days old). Request a token reissue.",
        )


# ── 1 · GET /api/v1/health ────────────────────────────────────────────────────

@api_router.get("/health")
def health() -> dict:
    """Public health check — no auth required."""
    return {"status": "ok", "service": "The Virtual GM API", "ts": datetime.now(timezone.utc).isoformat()}


# ── 2 · GET /api/v1/roster ───────────────────────────────────────────────────

@api_router.get("/roster")
def get_roster(
    request: Request,
    auth:    _AuthContext = Depends(_get_auth),
) -> dict:
    """
    Return the operator's full player list with activation status.
    Each player's visible fields depend on their activation_status.
    """
    db_path = request.app.state.db_path
    players = get_all_players(db_path)
    return {
        "operator_id":   auth.operator_id,
        "session_state": auth.state.value,
        "count":         len(players),
        "players":       [_filter_player_fields(p, auth.operator_id) for p in players],
    }


def _filter_player_fields(p: dict, operator_id: str) -> dict:
    """
    Apply activation-level field masking.
    LOCKED    → name, position, grad_year only
    PREVIEW   → adds height, weight, school, GPA
    FULL/EXCLUSIVE → full profile
    """
    status = p.get("activation_status", "locked")
    base = {
        "player_id":        p["player_id"],
        "full_name":        p["full_name"],
        "position":         p["position"],
        "grad_year":        p["grad_year"],
        "activation_status":p.get("activation_status"),
        "eligibility_status":p.get("eligibility_status"),
    }
    if status in ("preview", "full", "exclusive"):
        base.update({
            "high_school":   p.get("high_school"),
            "height_inches": p.get("height_inches"),
            "weight_lbs":    p.get("weight_lbs"),
            "gpa":           p.get("gpa"),
            "sync_status":   p.get("sync_status"),
        })
    if status in ("full", "exclusive"):
        base.update({
            "aau_program":       p.get("aau_program"),
            "wingspan_inches":   p.get("wingspan_inches"),
            "committed_college": p.get("committed_college"),
            "ncaa_id":           p.get("ncaa_id"),
            "pro_file_os_id":    p.get("pro_file_os_id"),
            "ingestion_date":    p.get("ingestion_date"),
        })
    return base


# ── 3 · POST /api/v1/player/add ──────────────────────────────────────────────

@api_router.post("/player/add", status_code=status.HTTP_201_CREATED)
def add_player(
    body:    AddPlayerRequest,
    request: Request,
    auth:    _AuthContext = Depends(_get_auth),
) -> dict:
    """Add a new player to the operator's roster."""
    _require_write(auth)
    db_path = request.app.state.db_path

    profile = PlayerProfile(
        full_name         = body.full_name,
        position          = body.position,
        grad_year         = body.grad_year,
        high_school       = body.high_school,
        aau_program       = body.aau_program,
        height_inches     = body.height_inches,
        weight_lbs        = body.weight_lbs,
        gpa               = body.gpa,
        data_source       = body.data_source,
    )
    player_id = insert_player(profile.model_dump(), db_path)
    logger.info("Player added: %s by operator %s", body.full_name, auth.operator_id)
    return {"player_id": player_id, "full_name": body.full_name, "message": "Player added."}


# ── 4 · POST /api/v1/player/fit-score ────────────────────────────────────────

@api_router.post("/player/fit-score")
def compute_fit_score(
    body:    FitScoreRequest,
    request: Request,
    auth:    _AuthContext = Depends(_get_auth),
) -> dict:
    """
    Compute a 4-dimension fit score for a player vs. this operator's program.
    Writes the result to fit_scores and returns the full FitScore object.
    """
    _require_write(auth)
    db_path = request.app.state.db_path

    player = get_player(body.player_id, db_path)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    fit = calculate_fit_score(
        player_id          = body.player_id,
        operator_id        = auth.operator_id,
        position           = player["position"],
        grad_year          = player["grad_year"],
        height_inches      = player.get("height_inches"),
        gpa                = player.get("gpa"),
        eligibility_status = player.get("eligibility_status", "active"),
        roster_positions   = body.roster_positions,
        program_system     = body.program_system,
        target_grad_year   = body.target_grad_year,
    )

    score_dict = fit.model_dump()
    insert_fit_score(score_dict, db_path)

    logger.info(
        "Fit score: player=%s composite=%.1f rec=%s op=%s",
        body.player_id, fit.composite_score, fit.recommendation, auth.operator_id,
    )
    return fit.model_dump()


# ── 5 · POST /api/v1/player/activate ─────────────────────────────────────────

@api_router.post("/player/activate")
def request_activation(
    body:    ActivatePlayerRequest,
    request: Request,
    auth:    _AuthContext = Depends(_get_auth),
) -> dict:
    """
    Request an activation status upgrade for a player.

    • preview  → applied immediately, consumes 1 unlock credit.
    • full / exclusive → creates a pending ActivationLock; requires master approval
                         from Jabari before the status is updated.

    Logs every unlock attempt.
    """
    _require_write(auth)
    db_path = request.app.state.db_path

    player = get_player(body.player_id, db_path)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    requested = body.requested_status.lower()
    if requested not in ("preview", "full", "exclusive"):
        raise HTTPException(
            status_code=422,
            detail="requested_status must be 'preview', 'full', or 'exclusive'",
        )

    # Consume an unlock credit
    ok = consume_unlock_credit(auth.operator_id, db_path)
    if not ok:
        raise HTTPException(
            status_code=402,
            detail="Unlock credits exhausted. Upgrade your license tier or contact admin.",
        )

    # PREVIEW — immediate, no master approval needed
    if requested == "preview":
        from db.database import update_activation_status as _upd
        _upd(body.player_id, "preview", db_path)
        return {
            "player_id": body.player_id,
            "new_status": "preview",
            "requires_approval": False,
            "message": "Preview unlocked. Player contact info not yet included.",
        }

    # FULL / EXCLUSIVE — create lock, pend master approval
    lock = ActivationLock(
        player_id        = body.player_id,
        operator_id      = auth.operator_id,
        requested_status = requested,
        current_status   = player.get("activation_status", "locked"),
        notes            = body.notes,
    )
    lock_dict = lock.model_dump()
    lock_dict["requires_master_approval"] = int(lock_dict["requires_master_approval"])
    lock_dict["approved"]                 = int(lock_dict["approved"])
    lock_id = insert_activation_lock(lock_dict, db_path)

    logger.info(
        "Activation lock created: player=%s op=%s type=%s lock=%s",
        body.player_id, auth.operator_id, requested, lock_id,
    )
    return {
        "player_id":          body.player_id,
        "lock_id":            lock_id,
        "requested_status":   requested,
        "requires_approval":  True,
        "message": (
            f"'{requested}' activation requires master approval. "
            "You will be notified when approved. Credit has been reserved."
        ),
    }


# ── 6 · GET /api/v1/rib/latest ───────────────────────────────────────────────

@api_router.get("/rib/latest")
def get_latest_rib_route(
    request: Request,
    auth:    _AuthContext = Depends(_get_auth),
) -> dict:
    """Return the most recently generated RIB for this operator."""
    db_path = request.app.state.db_path
    rib     = get_latest_rib(auth.operator_id, db_path)
    if rib is None:
        raise HTTPException(status_code=404, detail="No RIB found. Generate one first.")
    return rib


# ── 7 · POST /api/v1/rib/generate ────────────────────────────────────────────

@api_router.post("/rib/generate")
def generate_rib_route(
    request: Request,
    auth:    _AuthContext = Depends(_get_auth),
) -> dict:
    """Generate a fresh Roster Intelligence Brief for this operator's program."""
    _require_write(auth)
    db_path = request.app.state.db_path
    op      = get_operator(auth.operator_id, db_path)

    if op is None:
        raise HTTPException(status_code=404, detail="Operator record not found.")

    rib = generate_rib(auth.operator_id, db_path)
    logger.info("RIB generated via API: op=%s week=%s", auth.operator_id, rib.week_label)
    return rib.model_dump()


# ── 8 · POST /api/v1/roster/sync ─────────────────────────────────────────────

@api_router.post("/roster/sync")
def sync_roster_route(
    request: Request,
    auth:    _AuthContext = Depends(_get_auth),
) -> dict:
    """
    Push operator roster to PRO-File OS for cross-platform enrichment.
    Uses PRO_FILE_OS_API_URL and PRO_FILE_OS_API_KEY from environment.
    """
    _require_write(auth)
    db_path = request.app.state.db_path
    players = get_all_players(db_path)
    result  = sync_roster(auth.operator_id, players)
    logger.info("Roster sync triggered: op=%s result=%s", auth.operator_id, result.get("status"))
    return result
