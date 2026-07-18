"""
admin.py — The Virtual GM · Admin Auth Middleware & Token Issuance
Jabari-only endpoints.  Protected by VIRTUAL_GM_ADMIN_KEY env var.
Never hardcode secrets — all keys read from environment at runtime.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from db.database import (
    _auth_event,
    approve_activation_lock,
    get_operator,
    get_pending_locks,
    get_player,
    insert_operator,
    update_activation_status,
)
from models.data_models import (
    ApproveActivationRequest,
    IssueTokenRequest,
    LicenseTier,
    OnboardOperatorRequest,
    OperatorLicense,
    TIER_UNLOCK_LIMITS,
)
from utils.session import issue_token

logger        = logging.getLogger(__name__)
admin_router  = APIRouter(prefix="/admin", tags=["admin"])
_bearer       = HTTPBearer(auto_error=False)

# ── Admin key guard ───────────────────────────────────────────────────────────

def _admin_key() -> str:
    key = os.getenv("VIRTUAL_GM_ADMIN_KEY", "")
    if not key:
        raise RuntimeError("VIRTUAL_GM_ADMIN_KEY is not configured in environment")
    return key


def require_admin(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> str:
    """
    Dependency that validates the VIRTUAL_GM_ADMIN_KEY Bearer token.
    Returns the admin key string on success; raises 401 otherwise.
    All admin auth attempts are written to auth_events.
    """
    db_path = request.app.state.db_path
    provided = creds.credentials if creds else None

    if not provided:
        _auth_event(db_path, "admin_action", None, "missing Bearer token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin Bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Constant-time comparison via secrets module
    import secrets as _s
    expected = _admin_key()
    if not _s.compare_digest(provided.encode(), expected.encode()):
        _auth_event(db_path, "admin_action", None, "invalid admin token")
        logger.warning("Admin auth failed — invalid key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return provided


# ── POST /admin/operator/onboard ──────────────────────────────────────────────

@admin_router.post("/operator/onboard", status_code=status.HTTP_201_CREATED)
def onboard_operator(
    body:    OnboardOperatorRequest,
    request: Request,
    _admin:  str = Depends(require_admin),
) -> dict:
    """
    Jabari-only: onboard a new program operator and issue their first session token.
    Returns operator_id, license_key, and session token.
    """
    db_path = request.app.state.db_path
    tier    = body.license_tier if body.license_tier in [t.value for t in LicenseTier] \
              else LicenseTier.SOLO.value

    op = OperatorLicense(
        operator_name        = body.operator_name,
        email                = body.email,
        license_tier         = tier,
        program_name         = body.program_name,
        program_city         = body.program_city,
        program_state        = body.program_state,
        max_unlocks          = TIER_UNLOCK_LIMITS.get(tier, 5),
        approved_by_master   = True,   # admin-created operators are pre-approved
    )
    op_dict             = op.model_dump()
    op_dict["approved_by_master"] = int(op_dict["approved_by_master"])
    operator_id         = insert_operator(op_dict, db_path)

    token = issue_token(operator_id, db_path)

    logger.info(
        "Admin onboarded operator: %s / %s / tier=%s",
        body.operator_name, body.email, tier,
    )
    return {
        "operator_id":  operator_id,
        "license_key":  op.license_key,
        "license_tier": tier,
        "session_token": token,
        "message": f"Operator '{body.operator_name}' onboarded. Token valid 7 days.",
    }


# ── POST /admin/operator/token/issue ─────────────────────────────────────────

@admin_router.post("/operator/token/issue")
def issue_operator_token(
    body:    IssueTokenRequest,
    request: Request,
    _admin:  str = Depends(require_admin),
) -> dict:
    """
    Jabari-only: generate (or regenerate) a session token for an existing operator.
    Useful after a token expires or is revoked.
    """
    db_path  = request.app.state.db_path
    op       = get_operator(body.operator_id, db_path)
    if op is None:
        raise HTTPException(status_code=404, detail="Operator not found")

    token = issue_token(body.operator_id, db_path)
    logger.info("Admin issued token for operator %s", body.operator_id)
    return {
        "operator_id":   body.operator_id,
        "operator_name": op["operator_name"],
        "session_token": token,
        "message":       "Token issued. Valid for 7 days (read-only after day 5).",
    }


# ── GET /admin/activation/pending ────────────────────────────────────────────

@admin_router.get("/activation/pending")
def list_pending_activations(
    request: Request,
    _admin:  str = Depends(require_admin),
) -> dict:
    """
    Jabari-only: list all Full/Exclusive unlock requests awaiting master approval.
    """
    db_path = request.app.state.db_path
    locks   = get_pending_locks(db_path)
    return {"pending_count": len(locks), "locks": locks}


# ── POST /admin/activation/approve ───────────────────────────────────────────

@admin_router.post("/activation/approve")
def approve_activation(
    body:    ApproveActivationRequest,
    request: Request,
    _admin:  str = Depends(require_admin),
) -> dict:
    """
    Jabari-only: approve or deny a Full/Exclusive activation lock.
    If approved, updates the player's activation_status in the players table.
    All approval actions are logged to auth_events and sync_log.
    """
    db_path = request.app.state.db_path

    from db.database import get_activation_lock
    lock = get_activation_lock(body.lock_id, db_path)
    if lock is None:
        raise HTTPException(status_code=404, detail="Activation lock not found")

    approve_activation_lock(
        lock_id     = body.lock_id,
        approved_by = "master_admin",
        approved    = body.approved,
        notes       = body.notes,
        db_path     = db_path,
    )

    if body.approved:
        # Apply the status upgrade to the player record
        update_activation_status(lock["player_id"], lock["requested_status"], db_path)
        message = (f"Player {lock['player_id']} upgraded to "
                   f"'{lock['requested_status']}' activation.")
    else:
        message = f"Activation request {body.lock_id} denied."

    logger.info("Admin activation decision: lock=%s approved=%s", body.lock_id, body.approved)
    return {"lock_id": body.lock_id, "approved": body.approved, "message": message}


# ── GET /admin/health ─────────────────────────────────────────────────────────

@admin_router.get("/health")
def admin_health(
    request: Request,
    _admin:  str = Depends(require_admin),
) -> dict:
    """Jabari-only: internal health check with DB path confirmation."""
    return {
        "status":  "ok",
        "db_path": request.app.state.db_path,
        "ts":      datetime.now(timezone.utc).isoformat(),
    }
