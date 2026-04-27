"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        Neural Data Agency (NDA) — FastAPI Router                            ║
║        POST /api/v1/nda/neural-score                                        ║
║        POST /api/v1/nda/neural-score/batch                                  ║
║        HeadsUp OS v3.0.0 | Render Deployment Target                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

MOUNT IN hu_os_engine.py (main FastAPI app):
    from nda_router import nda_router
    app.include_router(nda_router, prefix="/api/v1/nda", tags=["Neural Data Agency"])

ENDPOINTS:
    POST /api/v1/nda/neural-score
        → Single athlete behavioral intelligence score
        → Calls nda_score() from nda_hughes_neural_score.py
        → Returns NDAScoreResult (JSON)

    POST /api/v1/nda/neural-score/batch
        → Batch evaluation (1–50 athletes per call)
        → Returns NDABatchResult with per-athlete scores + aggregate summary

    GET  /api/v1/nda/health
        → NDA service health check (separate from main /health)

SECURITY:
    All routes require Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
    This header is validated server-side — never exposed to the browser.
    The Next.js API route at app/api/nda/score/route.ts proxies all calls.

PYDANTIC VERSION:
    v1.10.21 — pinned for Render compatibility.
"""

from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, Header, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from nda_hughes_neural_score import (
    NDAScoreRequest,
    NDAScoreResult,
    nda_score,
    ALGO_VERSION,
)


# ─────────────────────────────────────────────────────────────────────────────
# ROUTER INIT
# ─────────────────────────────────────────────────────────────────────────────

nda_router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — AUTH DEPENDENCY
# ─────────────────────────────────────────────────────────────────────────────

import os

NDA_API_KEY: str = os.environ.get("HU_ENGINE_API_KEY", "")


def verify_nda_key(authorization: str = Header(...)) -> str:
    """
    Bearer token validation for all NDA endpoints.

    The token must match HU_ENGINE_API_KEY set in the Render environment.
    Next.js API routes pass this header server-side — never from the browser.

    Args:
        authorization: 'Authorization: Bearer <token>' header value.

    Returns:
        Validated token string.

    Raises:
        HTTPException 401 if token is missing or invalid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must use Bearer scheme.",
        )
    token = authorization.removeprefix("Bearer ").strip()
    if not NDA_API_KEY or token != NDA_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid NDA API key.",
        )
    return token


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — BATCH MODELS
# ─────────────────────────────────────────────────────────────────────────────

class NDABatchRequest(BaseModel):
    """
    Batch neural score request — up to 50 athletes per call.
    Used by the NDA pipeline for combine/showcase bulk evaluation.
    """
    athletes: List[NDAScoreRequest] = Field(
        ..., min_items=1, max_items=50,
        description="List of athlete score requests (max 50 per batch call).",
    )
    batch_label: Optional[str] = Field(
        None,
        description="Optional label for this batch (e.g., 'Unsigned Diamonds Combine March 2026').",
    )

    class Config:
        schema_extra = {
            "example": {
                "batch_label": "Unsigned Diamonds Combine March 2026",
                "athletes": [
                    {
                        "athlete_id":      "uuid-0004-boone",
                        "full_name":       "Mike Boone",
                        "graduation_year": 2026,
                        "school":          "DFW Elite Prep",
                        "entitlement_flags": 0,
                        "injury_status":   False,
                        "neck_up": {
                            "culture_equity":  88.0,
                            "resilience":      76.0,
                            "coachability":    82.0,
                            "playmaking":      85.0,
                            "defense":         78.5,
                            "physical_output": 84.0,
                        },
                    }
                ],
            }
        }


class AthleteScoreSummary(BaseModel):
    """Compact summary row for the batch aggregate view."""
    athlete_id:        str
    full_name:         str
    neck_up_pro_score: float
    neck_up_ner:       float
    culture_grade:     str
    deficiency_count:  int
    locker_room_risk:  str
    injury_status:     bool
    quests_triggered:  int


class NDABatchResult(BaseModel):
    """
    Full batch response — individual scores + aggregate NDA intelligence.
    """
    batch_id:     str
    batch_label:  Optional[str]
    processed_at: str
    athlete_count: int
    engine_version: str

    # ── Individual results ────────────────────────────────────────────────
    scores: List[NDAScoreResult]

    # ── Aggregate intelligence ────────────────────────────────────────────
    summary:             List[AthleteScoreSummary]
    avg_pro_score:       float
    avg_ner:             float
    deficiency_leaders:  List[str]   # metrics flagged most across the batch
    high_risk_athletes:  List[str]   # full_names with locker_room_risk ≥ High
    top_culture_assets:  List[str]   # full_names with culture_grade A or A+
    quests_total:        int


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@nda_router.get("/health")
async def nda_health():
    """
    NDA service health check.

    Returns:
        JSON: { status, engine_version, timestamp }
    """
    return JSONResponse({
        "status":         "operational",
        "service":        "Neural Data Agency — Hughes Neural Score",
        "engine_version": ALGO_VERSION,
        "timestamp":      datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    })


@nda_router.post(
    "/neural-score",
    response_model=NDAScoreResult,
    status_code=status.HTTP_200_OK,
    summary="Single-athlete Hughes Neural Score",
    description=(
        "Compute the full behavioral intelligence profile for one athlete. "
        "Returns PRO-Score, NER, Culture Grade, deficiency flags, "
        "PRO-Quest triggers, and Hughes behavioral signal commentary."
    ),
)
async def neural_score_single(
    request: NDAScoreRequest,
    _token: str = Depends(verify_nda_key),
) -> NDAScoreResult:
    """
    POST /api/v1/nda/neural-score

    Single athlete behavioral intelligence evaluation.

    Request body: NDAScoreRequest (athlete_id, full_name, neck_up metrics)
    Response:     NDAScoreResult  (PRO-Score, NER, deficiency flags, quests)

    Args:
        request: Validated NDAScoreRequest payload.
        _token:  Verified Bearer token (injected by Depends).

    Returns:
        NDAScoreResult — complete behavioral intelligence report.

    Raises:
        422 Unprocessable Entity if any neck_up metric is out of 0–100 range.
        500 Internal Server Error on scoring engine failure.
    """
    try:
        result = nda_score(request)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Input validation error: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"NDA scoring engine error: {str(e)}",
        )


@nda_router.post(
    "/neural-score/batch",
    response_model=NDABatchResult,
    status_code=status.HTTP_200_OK,
    summary="Batch Hughes Neural Score (max 50 athletes)",
    description=(
        "Evaluate up to 50 athletes in a single call. Returns individual "
        "NDAScoreResult objects plus aggregate NDA intelligence: avg scores, "
        "deficiency leaders, high-risk profiles, and top culture assets."
    ),
)
async def neural_score_batch(
    request: NDABatchRequest,
    _token: str = Depends(verify_nda_key),
) -> NDABatchResult:
    """
    POST /api/v1/nda/neural-score/batch

    Batch evaluation for combine, showcase, or portal review sessions.
    Processes up to 50 athletes and returns aggregate NDA intelligence.

    Use cases:
        - Unsigned Diamonds Combine bulk intake
        - Transfer Portal session evaluation
        - Pre-season roster behavioral audit

    Args:
        request: NDABatchRequest with list of NDAScoreRequest payloads.
        _token:  Verified Bearer token.

    Returns:
        NDABatchResult with all scores + batch-level intelligence summary.
    """
    import uuid as _uuid
    from collections import Counter

    scores: list[NDAScoreResult] = []
    errors: list[dict] = []

    # ── Score each athlete — fail-safe per athlete, never abort batch ─────
    for athlete_req in request.athletes:
        try:
            scores.append(nda_score(athlete_req))
        except Exception as e:
            errors.append({
                "athlete_id": athlete_req.athlete_id,
                "full_name":  athlete_req.full_name,
                "error":      str(e),
            })

    if not scores:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"All {len(request.athletes)} athletes failed scoring. Errors: {errors}",
        )

    # ── Aggregate intelligence ────────────────────────────────────────────
    avg_pro  = round(sum(s.neck_up_pro_score for s in scores) / len(scores), 2)
    avg_ner  = round(sum(s.neck_up_ner       for s in scores) / len(scores), 2)

    # Deficiency leaders: which metrics are flagged most across the batch
    all_deficiency_metrics = [
        f.neck_up_metric
        for s in scores
        for f in s.deficiency_flags
    ]
    deficiency_counter = Counter(all_deficiency_metrics)
    deficiency_leaders = [
        f"{metric} ({count})"
        for metric, count in deficiency_counter.most_common(3)
    ]

    # High-risk profiles (locker room risk ≥ High)
    HIGH_RISK_LABELS = {"High", "Critical"}
    high_risk_athletes = [
        s.full_name
        for s in scores
        if s.entitlement_report.locker_room_risk in HIGH_RISK_LABELS
    ]

    # Top culture assets (A or A+ culture grade)
    TOP_GRADES = {"A+", "A"}
    top_culture_assets = [
        s.full_name
        for s in scores
        if s.culture_grade in TOP_GRADES
    ]

    # Total quests triggered across all athletes
    quests_total = sum(len(s.pro_quests_triggered) for s in scores)

    # Compact summary rows
    summary = [
        AthleteScoreSummary(
            athlete_id=s.athlete_id,
            full_name=s.full_name,
            neck_up_pro_score=s.neck_up_pro_score,
            neck_up_ner=s.neck_up_ner,
            culture_grade=s.culture_grade,
            deficiency_count=len(s.deficiency_flags),
            locker_room_risk=s.entitlement_report.locker_room_risk,
            injury_status=s.injury_status,
            quests_triggered=len(s.pro_quests_triggered),
        )
        for s in scores
    ]

    return NDABatchResult(
        batch_id=str(_uuid.uuid4()),
        batch_label=request.batch_label,
        processed_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        athlete_count=len(scores),
        engine_version=ALGO_VERSION,
        scores=scores,
        summary=summary,
        avg_pro_score=avg_pro,
        avg_ner=avg_ner,
        deficiency_leaders=deficiency_leaders,
        high_risk_athletes=high_risk_athletes,
        top_culture_assets=top_culture_assets,
        quests_total=quests_total,
    )


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — NEXT.JS PROXY ROUTE (app/api/nda/score/route.ts)
#
# Drop this file in: headsup-os/app/api/nda/score/route.ts
# This is the server-side Next.js route that proxies browser calls to Render.
# The HU_ENGINE_API_KEY is never exposed to the browser.
# ─────────────────────────────────────────────────────────────────────────────
NEXTJS_PROXY_ROUTE = '''
// headsup-os/app/api/nda/score/route.ts
// Server-side only — HU_ENGINE_API_KEY never reaches the browser.

import { NextRequest, NextResponse } from "next/server";

const ENGINE_URL = process.env.HU_ENGINE_URL!;
const ENGINE_KEY = process.env.HU_ENGINE_API_KEY!;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const engineRes = await fetch(`${ENGINE_URL}/api/v1/nda/neural-score`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${ENGINE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!engineRes.ok) {
    const err = await engineRes.text();
    return NextResponse.json(
      { error: "NDA engine error", detail: err },
      { status: engineRes.status },
    );
  }

  const data = await engineRes.json();
  return NextResponse.json(data);
}

// Batch route: app/api/nda/score/batch/route.ts follows the same pattern
// with endpoint → /api/v1/nda/neural-score/batch
'''

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — MOUNT SNIPPET (add to hu_os_engine.py)
# ─────────────────────────────────────────────────────────────────────────────
MOUNT_SNIPPET = '''
# ── In hu_os_engine.py (main FastAPI app) ────────────────────────────────────
from nda_router import nda_router

app.include_router(
    nda_router,
    prefix="/api/v1/nda",
    tags=["Neural Data Agency"],
)
# Registered routes:
#   GET  /api/v1/nda/health
#   POST /api/v1/nda/neural-score
#   POST /api/v1/nda/neural-score/batch
'''

if __name__ == "__main__":
    print("\n  NDA Router — reference output")
    print("  Mount snippet:\n")
    print(MOUNT_SNIPPET)
    print("\n  Next.js proxy route:\n")
    print(NEXTJS_PROXY_ROUTE)
