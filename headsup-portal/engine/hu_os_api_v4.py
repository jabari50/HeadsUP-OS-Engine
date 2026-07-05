"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        HeadsUp OS — Unified Portal Scoring Engine API v4                     ║
║        FastAPI · stateless · HMAC-authenticated                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

Security model (handoff v1.1 §2, §7):
  - STATELESS: this service imports no database client and holds no Supabase,
    Stripe, or LLM credentials. It computes and returns. All persistence
    happens in the Next.js server layer.
  - Every request except /health must carry X-HU-Timestamp and
    X-HU-Signature = HMAC_SHA256(HU_ENGINE_SECRET, "{timestamp}.{raw_body}").
    Stale timestamps (>300s skew) and bad signatures are rejected before
    any parsing. Comparison is constant-time.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

import pipeline
from badge_engine import evaluate_badges
from data_models import MatchmakeRequest, ScoreRequest
from ovr_engine import calculate_ovr
from quest_engine import seed_starter_quests

ENGINE_VERSION = "4.0.0"
REPLAY_WINDOW_SECONDS = 300

# Matchmaking weights — grounded constants (handoff §7). Recommendation
# thresholds are v1 defaults pending calibration [NEEDS INPUT].
FIT_WEIGHTS = {"style": 0.30, "need": 0.30, "level": 0.25, "cultural": 0.15}
PURSUE_MIN = 75.0
MONITOR_MIN = 55.0

app = FastAPI(title="HU-OS Engine", version=ENGINE_VERSION, docs_url=None, redoc_url=None)


def _unauthorized(detail: str) -> JSONResponse:
    return JSONResponse(status_code=401, content={"detail": detail})


@app.middleware("http")
async def verify_hmac(request: Request, call_next):
    """Reject any non-/health request without a valid, fresh HMAC signature."""
    if request.url.path == "/health":
        return await call_next(request)

    secret = os.environ.get("HU_ENGINE_SECRET", "")
    if not secret:
        # Fail closed: an unconfigured engine serves nothing.
        return JSONResponse(status_code=503, content={"detail": "engine secret not configured"})

    timestamp = request.headers.get("x-hu-timestamp")
    signature = request.headers.get("x-hu-signature")
    if not timestamp or not signature:
        return _unauthorized("missing signature headers")

    try:
        ts_value = int(timestamp)
    except ValueError:
        return _unauthorized("invalid timestamp")
    if abs(time.time() - ts_value) > REPLAY_WINDOW_SECONDS:
        return _unauthorized("stale timestamp")

    body = await request.body()
    expected = hmac.new(
        secret.encode(), f"{timestamp}.".encode() + body, hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return _unauthorized("bad signature")

    return await call_next(request)


def _score(technical: dict, neural: dict, physical_score: float) -> dict:
    """Run the full scoring stack: OVR → badges → starter quests."""
    result = calculate_ovr(technical, neural, physical_score)
    player_data = {
        "technical": {f"{k}_converted": v for k, v in result["technical_converted"].items()},
        "neural": neural,
        "ovr": result["ovr"],
    }
    badges = [
        {
            "badge_id": b.badge_id,
            "name": b.name,
            "category": b.category,
            "description": b.description,
            "icon": b.icon,
        }
        for b in evaluate_badges(player_data)
    ]
    quests = [
        {
            "title": q.title,
            "target_attribute": q.target_attribute,
            "target_value": q.target_value,
            "current_value": q.current_value,
            "progress_pct": q.progress_pct,
            "status": q.status,
        }
        for q in seed_starter_quests(player_data)
    ]
    return {
        "computed": {
            "ovr": result["ovr"],
            "tier": result["tier"],
            "technical_avg": result["technical_avg"],
            "neural_avg": result["neural_avg"],
            "breakdown": result["breakdown"],
        },
        "badges": badges,
        "quests": quests,
    }


def _validation_response(exc: ValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"status": "rejected", "errors": json.loads(exc.json(include_url=False))},
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": ENGINE_VERSION}


@app.post("/v4/score")
async def score(request: Request):
    """Score already-validated technical/neural/physical inputs."""
    try:
        parsed = ScoreRequest(**(await request.json()))
    except ValidationError as exc:
        return _validation_response(exc)
    scored = _score(parsed.technical.model_dump(), parsed.neural.model_dump(), parsed.physical_score)
    return {"status": "ok", **scored}


@app.post("/v4/intake/process")
async def intake_process(request: Request):
    """Validate an intake payload; score it when the source provides scores.

    Returns 422 with structured errors on rejection — the caller records them
    in intake_raw.validation_errors and marks the session rejected.
    """
    body = await request.json()
    source = body.get("source")
    payload = body.get("payload")
    if not isinstance(payload, dict):
        return JSONResponse(status_code=422, content={"status": "rejected", "errors": [{"msg": "payload must be an object"}]})

    try:
        normalized = pipeline.normalize(source, payload)
    except ValidationError as exc:
        return _validation_response(exc)
    except ValueError as exc:
        return JSONResponse(status_code=422, content={"status": "rejected", "errors": [{"msg": str(exc)}]})

    kind = normalized["kind"]

    if kind == "scored":
        canonical = normalized["canonical"]
        scored = _score(canonical["technical"], canonical["neural"], canonical["physical_score"])
        return {"status": "validated", "kind": kind, "canonical": canonical, **scored}

    if kind == "batch":
        rows = []
        for row in normalized["rows"]:
            if not row["ok"]:
                rows.append(row)
                continue
            canonical = row["canonical"]
            scored = _score(canonical["technical"], canonical["neural"], canonical["physical_score"])
            rows.append({"index": row["index"], "ok": True, "canonical": canonical, **scored})
        return {"status": "validated", "kind": kind, "rows": rows}

    # provisional / neural_update / observations: no scoring — never fabricate.
    response = {"status": "validated", "kind": kind, "canonical": normalized["canonical"],
                "computed": None, "badges": [], "quests": []}
    if kind == "observations":
        response["observations"] = normalized["observations"]
    return response


@app.post("/v4/matchmake")
async def matchmake(request: Request):
    """Weighted VGM Fit Score from decision-layer subscores."""
    try:
        parsed = MatchmakeRequest(**(await request.json()))
    except ValidationError as exc:
        return _validation_response(exc)

    fit = round(
        parsed.style_fit * FIT_WEIGHTS["style"]
        + parsed.need_fit * FIT_WEIGHTS["need"]
        + parsed.level_fit * FIT_WEIGHTS["level"]
        + parsed.cultural_fit * FIT_WEIGHTS["cultural"],
        1,
    )
    if fit >= PURSUE_MIN:
        recommendation = "Pursue"
    elif fit >= MONITOR_MIN:
        recommendation = "Monitor"
    else:
        recommendation = "Pass"

    return {
        "status": "ok",
        "fit_score": fit,
        "recommendation": recommendation,
        "subscores": parsed.model_dump(),
        "weights": FIT_WEIGHTS,
    }
