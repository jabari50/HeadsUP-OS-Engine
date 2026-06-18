"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        Athlete Onboarding FastAPI Router                                     ║
║        POST /api/v1/athletes            — live intake → full HU-OS profile  ║
║        GET  /api/v1/athletes            — roster summaries                  ║
║        GET  /api/v1/athletes/{id}       — full profile                      ║
║        GET  /api/v1/athletes/health     — subsystem health                  ║
║        HeadsUp OS v3.1.0 | Render Deployment Target                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

MOUNT IN hu_os_engine.py:
    from athlete_api import router as athlete_router
    app.include_router(athlete_router)

SECURITY:
    - All routes require Authorization: Bearer {HU_ENGINE_API_KEY}
    - Intake payloads are fully bounds-checked by Pydantic — no raw writes
    - Persistence is local SQLite (storage/hu_os.db); profile JSON is the
      single source of truth, written server-side only
"""

from __future__ import annotations

import json
import os
import sqlite3
import uuid
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from badge_engine import evaluate_badges
from data_models import CLASSIFICATIONS, POSITIONS
from ovr_engine import calculate_ovr
from quest_engine import seed_starter_quests


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — ROUTER + AUTH
# ─────────────────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/v1/athletes", tags=["Athlete Onboarding"])

_ENGINE_API_KEY: str = os.environ.get("HU_ENGINE_API_KEY", "")

DB_PATH = Path(__file__).parent / "storage" / "hu_os.db"


def verify_key(authorization: str = Header(...)) -> str:
    """Validate the Bearer token against HU_ENGINE_API_KEY (fails closed)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must use Bearer scheme.",
        )
    token = authorization.removeprefix("Bearer ").strip()
    if not _ENGINE_API_KEY or token != _ENGINE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key.",
        )
    return token


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — REQUEST MODELS (bounds-checked intake)
# ─────────────────────────────────────────────────────────────────────────────

class TechnicalIntake(BaseModel):
    """Seven technical skills, each scored 1-10 by the evaluating scout."""

    ball_handling: float = Field(..., ge=1, le=10)
    shooting: float = Field(..., ge=1, le=10)
    finishing: float = Field(..., ge=1, le=10)
    passing: float = Field(..., ge=1, le=10)
    defense: float = Field(..., ge=1, le=10)
    rebounding: float = Field(..., ge=1, le=10)
    athleticism: float = Field(..., ge=1, le=10)


class NeuralIntake(BaseModel):
    """Six neural attributes, each scored 1-99 from the Neural Audit."""

    composure: float = Field(..., ge=1, le=99)
    coachability: float = Field(..., ge=1, le=99)
    iq: float = Field(..., ge=1, le=99)
    resilience: float = Field(..., ge=1, le=99)
    leadership: float = Field(..., ge=1, le=99)
    drive: float = Field(..., ge=1, le=99)


class AthleteIntakeRequest(BaseModel):
    """Request body for POST /api/v1/athletes — live onboarding intake."""

    name: str = Field(..., min_length=2, max_length=120)
    position: str = Field(..., description="PG | SG | SF | PF | C")
    school: str = Field(..., min_length=2, max_length=160)
    class_year: str = Field(..., min_length=4, max_length=8)
    classification: str = Field("HS", description="HS | JUCO | College | Pro")
    physical_score: float = Field(..., ge=1, le=99)
    technical: TechnicalIntake
    neural: NeuralIntake
    scout_id: Optional[str] = Field(None, max_length=120)


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — PERSISTENCE (SQLite, server-side only)
# ─────────────────────────────────────────────────────────────────────────────

def _connect() -> sqlite3.Connection:
    """Open the athlete store, creating the schema on first use."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS athletes (
            player_id   TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            position    TEXT NOT NULL,
            school      TEXT NOT NULL,
            class_year  TEXT NOT NULL,
            ovr         REAL NOT NULL,
            tier        TEXT NOT NULL,
            created_at  TEXT NOT NULL,
            profile_json TEXT NOT NULL
        )
        """
    )
    return conn


def _save_profile(profile: dict) -> None:
    """Insert a finished athlete profile into the store."""
    conn = _connect()
    try:
        conn.execute(
            "INSERT INTO athletes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                profile["player_id"],
                profile["name"],
                profile["position"],
                profile["school"],
                profile["class_year"],
                profile["ovr"],
                profile["tier"],
                profile["created_at"],
                json.dumps(profile),
            ),
        )
        conn.commit()
    finally:
        conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/health")
async def athlete_health() -> dict:
    """Subsystem health + roster count (no auth: liveness only)."""
    conn = _connect()
    try:
        count = conn.execute("SELECT COUNT(*) FROM athletes").fetchone()[0]
    finally:
        conn.close()
    return {
        "status": "operational",
        "subsystem": "Athlete Onboarding",
        "athletes_onboarded": count,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def onboard_athlete(
    intake: AthleteIntakeRequest,
    _key: str = Depends(verify_key),
) -> dict:
    """Run the full HU-OS onboarding pipeline on a live intake.

    Computes OVR + tier, evaluates badges, seeds the starter quest arc,
    persists the profile, and returns it for instant display.
    """
    if intake.position not in POSITIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"position must be one of {POSITIONS}",
        )
    if intake.classification not in CLASSIFICATIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"classification must be one of {CLASSIFICATIONS}",
        )

    technical_raw = intake.technical.dict()
    neural = intake.neural.dict()

    ovr_result = calculate_ovr(technical_raw, neural, intake.physical_score)

    player_data = {
        "ovr": ovr_result["ovr"],
        "technical": {
            **technical_raw,
            **{f"{k}_converted": v for k, v in ovr_result["technical_converted"].items()},
        },
        "neural": neural,
    }

    badges = evaluate_badges(player_data)
    quests = seed_starter_quests(player_data)

    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    profile = {
        "player_id": str(uuid.uuid4()),
        "name": intake.name.strip(),
        "position": intake.position,
        "school": intake.school.strip(),
        "class_year": intake.class_year.strip(),
        "classification": intake.classification,
        "scout_id": intake.scout_id,
        "created_at": now,
        "updated_at": now,
        "physical_score": intake.physical_score,
        "technical": player_data["technical"],
        "neural": neural,
        "ovr": ovr_result["ovr"],
        "tier": ovr_result["tier"],
        "ovr_breakdown": {
            "technical_avg": ovr_result["technical_avg"],
            "neural_avg": ovr_result["neural_avg"],
            **ovr_result["breakdown"],
        },
        "badges": [
            {**asdict(b), "awarded_at": b.awarded_at.isoformat().replace("+00:00", "Z")}
            for b in badges
        ],
        "quests": [asdict(q) for q in quests],
    }

    _save_profile(profile)
    return profile


@router.post("/score")
async def score_athlete(
    intake: AthleteIntakeRequest,
    _key: str = Depends(verify_key),
) -> dict:
    """Score an intake WITHOUT persisting (stateless).

    The single source of truth for OVR used by external stores (e.g. The
    Virtual GM's Supabase). Runs the same OVR/badge/quest pipeline as the
    onboarding route but writes nothing to the engine's local store — the
    caller owns persistence. Same Pydantic bounds, so the score is identical
    to what onboarding would have produced.
    """
    if intake.position not in POSITIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"position must be one of {POSITIONS}",
        )
    if intake.classification not in CLASSIFICATIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"classification must be one of {CLASSIFICATIONS}",
        )

    technical_raw = intake.technical.dict()
    neural = intake.neural.dict()

    ovr_result = calculate_ovr(technical_raw, neural, intake.physical_score)

    player_data = {
        "ovr": ovr_result["ovr"],
        "technical": {
            **technical_raw,
            **{f"{k}_converted": v for k, v in ovr_result["technical_converted"].items()},
        },
        "neural": neural,
    }

    badges = evaluate_badges(player_data)
    quests = seed_starter_quests(player_data)

    return {
        "ovr": ovr_result["ovr"],
        "tier": ovr_result["tier"],
        "ovr_breakdown": {
            "technical_avg": ovr_result["technical_avg"],
            "neural_avg": ovr_result["neural_avg"],
            **ovr_result["breakdown"],
        },
        "technical_converted": ovr_result["technical_converted"],
        "badges": [
            {**asdict(b), "awarded_at": b.awarded_at.isoformat().replace("+00:00", "Z")}
            for b in badges
        ],
        "quests": [asdict(q) for q in quests],
    }


@router.get("")
async def list_athletes(_key: str = Depends(verify_key)) -> List[dict]:
    """Return roster summaries, newest first."""
    conn = _connect()
    try:
        rows = conn.execute(
            """
            SELECT player_id, name, position, school, class_year, ovr, tier, created_at
            FROM athletes ORDER BY created_at DESC
            """
        ).fetchall()
    finally:
        conn.close()
    columns = ["player_id", "name", "position", "school", "class_year", "ovr", "tier", "created_at"]
    return [dict(zip(columns, row)) for row in rows]


@router.get("/{player_id}")
async def get_athlete(player_id: str, _key: str = Depends(verify_key)) -> dict:
    """Return the full stored profile for one athlete."""
    conn = _connect()
    try:
        row = conn.execute(
            "SELECT profile_json FROM athletes WHERE player_id = ?", (player_id,)
        ).fetchone()
    finally:
        conn.close()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Athlete not found.",
        )
    return json.loads(row[0])
