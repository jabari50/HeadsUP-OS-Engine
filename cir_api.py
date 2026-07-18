"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        CIR FastAPI Router                                                    ║
║        POST /api/v1/cir/file                                                 ║
║        POST /api/v1/cir/clearance                                            ║
║        PATCH /api/v1/cir/{cir_id}/clear                                      ║
║        GET  /api/v1/cir/health                                               ║
║        HeadsUp OS v3.0.0 | Render Deployment Target                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

MOUNT IN hu_os_engine.py:
    from cir_api import router as cir_router
    app.include_router(cir_router)

SECURITY:
    - All routes require Authorization: Bearer {HU_ENGINE_API_KEY}
    - CIR data is NEVER surfaced to athletes, parents, scouts, or public views
    - character_intelligence_reports is append-only — no DELETE policy exists
    - All Supabase writes use the service role key (server-side only)

SUPABASE INTEGRATION:
    All persistence calls go to the character_intelligence_reports table
    via the Supabase REST API. The Next.js API route proxies these calls
    from the browser — Supabase keys are never exposed client-side.

PYDANTIC VERSION:
    v1.10.21 — pinned for Render compatibility. Do NOT upgrade.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from cir_engine import (
    CIRDisposition,
    CIREntry,
    CIRClearanceResult,
    evaluate_cir,
)


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — ROUTER + AUTH
# ─────────────────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/v1/cir", tags=["Character Intelligence Report"])

_ENGINE_API_KEY: str = os.environ.get("HU_ENGINE_API_KEY", "")
_SUPABASE_URL:   str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
_SUPABASE_KEY:   str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


def verify_key(authorization: str = Header(...)) -> str:
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
# SECTION 2 — REQUEST / RESPONSE MODELS
# ─────────────────────────────────────────────────────────────────────────────

class CIRFileRequest(BaseModel):
    """Request body for POST /api/v1/cir/file — file a new CIR entry."""
    athlete_id:  str            = Field(..., description="UUID of the athlete.")
    disposition: str            = Field(..., description="CLEAR | FLAG_ONLY | HUMAN_GATE | AIS_EXCLUSION")
    category:    str            = Field(..., description="Behavioral category (conduct, academic, eligibility, etc.)")
    summary:     str            = Field(..., min_length=10, description="Plain-language summary (internal use only).")
    filed_by:    str            = Field(..., description="Staff member or system that filed this CIR.")
    notes:       Optional[str]  = Field(None, description="Internal notes — never shown to athlete.")

    class Config:
        schema_extra = {
            "example": {
                "athlete_id":  "uuid-0004-boone",
                "disposition": "FLAG_ONLY",
                "category":    "conduct",
                "summary":     "Minor locker room friction reported by coaching staff.",
                "filed_by":    "staff@headsupfoundation.org",
                "notes":       "Monitor for 30 days. No escalation at this time.",
            }
        }


class CIRClearanceRequest(BaseModel):
    """Request body for POST /api/v1/cir/clearance — evaluate clearance from entries."""
    athlete_id:      str            = Field(..., description="UUID of the athlete.")
    active_entries:  List[CIREntry] = Field(default_factory=list, description="Active CIR entries for this athlete.")


class CIRAdminClearRequest(BaseModel):
    """Request body for PATCH /api/v1/cir/{cir_id}/clear — admin clears a HUMAN_GATE entry."""
    admin_cleared_by: str = Field(..., description="Admin user who is clearing the HUMAN_GATE.")
    notes:            Optional[str] = Field(None, description="Resolution notes.")


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — SUPABASE HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _supabase_headers() -> dict:
    """Build Supabase REST API headers using the service role key."""
    if not _SUPABASE_URL or not _SUPABASE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase credentials not configured in environment.",
        )
    return {
        "apikey":        _SUPABASE_KEY,
        "Authorization": f"Bearer {_SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=representation",
    }


async def _insert_cir(entry: CIREntry) -> dict:
    """Insert a new CIR entry into Supabase character_intelligence_reports."""
    url = f"{_SUPABASE_URL}/rest/v1/character_intelligence_reports"
    payload = entry.dict()
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, json=payload, headers=_supabase_headers())
    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Supabase insert failed: {resp.text}",
        )
    data = resp.json()
    return data[0] if isinstance(data, list) else data


async def _fetch_active_cirs(athlete_id: str) -> List[dict]:
    """Fetch all active CIR entries for an athlete from Supabase."""
    url = (
        f"{_SUPABASE_URL}/rest/v1/character_intelligence_reports"
        f"?athlete_id=eq.{athlete_id}&active=eq.true&select=*"
    )
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=_supabase_headers())
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Supabase fetch failed: {resp.text}",
        )
    return resp.json()


async def _admin_clear_cir(cir_id: str, cleared_by: str, notes: Optional[str]) -> dict:
    """Mark a HUMAN_GATE CIR as admin-cleared in Supabase."""
    url = f"{_SUPABASE_URL}/rest/v1/character_intelligence_reports?cir_id=eq.{cir_id}"
    patch_payload = {
        "admin_cleared":    True,
        "admin_cleared_by": cleared_by,
    }
    if notes:
        patch_payload["notes"] = notes
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.patch(url, json=patch_payload, headers=_supabase_headers())
    if resp.status_code not in (200, 204):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Supabase update failed: {resp.text}",
        )
    return {"cir_id": cir_id, "admin_cleared": True, "admin_cleared_by": cleared_by}


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/health")
async def cir_health():
    """CIR service health check."""
    return JSONResponse({
        "status":    "operational",
        "service":   "Character Intelligence Report — CIR Engine",
        "version":   "3.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    })


@router.post(
    "/file",
    status_code=status.HTTP_201_CREATED,
    summary="File a new Character Intelligence Report",
    description=(
        "Submit a new CIR entry for an athlete. "
        "CIR data is internal only — never surfaced to athletes, parents, or scouts. "
        "The character_intelligence_reports table is append-only."
    ),
)
async def file_cir(
    request: CIRFileRequest,
    _token: str = Depends(verify_key),
) -> dict:
    """
    POST /api/v1/cir/file

    File a new CIR entry and persist it to Supabase.
    Returns the created CIR record with its generated cir_id.

    Security: Bearer token required. Service role key used for Supabase write.
    """
    entry = CIREntry(
        athlete_id=request.athlete_id,
        disposition=request.disposition,
        category=request.category,
        summary=request.summary,
        filed_by=request.filed_by,
        notes=request.notes,
    )
    saved = await _insert_cir(entry)
    return {
        "status":     "filed",
        "cir_id":     saved.get("cir_id", entry.cir_id),
        "athlete_id": request.athlete_id,
        "disposition": request.disposition,
        "filed_at":   entry.filed_at,
    }


@router.post(
    "/clearance",
    response_model=CIRClearanceResult,
    status_code=status.HTTP_200_OK,
    summary="Evaluate Oracle clearance from active CIR entries",
    description=(
        "Given a list of active CIR entries, adjudicate Oracle clearance. "
        "Used internally by the Oracle gate before any NIL output is generated. "
        "AIS_EXCLUSION always blocks. HUMAN_GATE blocks until admin-cleared."
    ),
)
async def check_clearance(
    request: CIRClearanceRequest,
    _token: str = Depends(verify_key),
) -> CIRClearanceResult:
    """
    POST /api/v1/cir/clearance

    Evaluate whether the Oracle may proceed for a given athlete.
    Uses adjudicate_clearance() from cir_engine.py.
    """
    return evaluate_cir(request.athlete_id, request.active_entries)


@router.post(
    "/clearance/fetch",
    response_model=CIRClearanceResult,
    status_code=status.HTTP_200_OK,
    summary="Fetch active CIRs from Supabase and evaluate clearance",
    description=(
        "Full clearance check: fetches all active CIR entries for athlete_id "
        "from Supabase, then adjudicates Oracle clearance. "
        "This is the endpoint called by the Oracle gate in production."
    ),
)
async def fetch_and_clear(
    athlete_id: str,
    _token: str = Depends(verify_key),
) -> CIRClearanceResult:
    """
    POST /api/v1/cir/clearance/fetch?athlete_id={uuid}

    Fetch active CIRs from Supabase and return Oracle clearance result.
    Combines the Supabase query + adjudication in one call.
    """
    raw_entries = await _fetch_active_cirs(athlete_id)
    entries: List[CIREntry] = []
    for row in raw_entries:
        try:
            entries.append(CIREntry(**row))
        except Exception:
            pass  # Skip malformed rows — never block the Oracle on data error
    return evaluate_cir(athlete_id, entries)


@router.patch(
    "/{cir_id}/clear",
    status_code=status.HTTP_200_OK,
    summary="Admin-clear a HUMAN_GATE CIR entry",
    description=(
        "Mark a HUMAN_GATE CIR entry as admin-cleared. "
        "After clearing, the entry retains FLAG_ONLY treatment (Δ_PEG expanded). "
        "Only admins with a valid engine API key may call this endpoint."
    ),
)
async def admin_clear_cir(
    cir_id: str,
    request: CIRAdminClearRequest,
    _token: str = Depends(verify_key),
) -> dict:
    """
    PATCH /api/v1/cir/{cir_id}/clear

    Admin-clear a HUMAN_GATE entry. After clearing, the Oracle proceeds
    with FLAG_ONLY treatment (Δ_PEG expansion, no suppression).
    """
    result = await _admin_clear_cir(cir_id, request.admin_cleared_by, request.notes)
    return {
        **result,
        "treatment":  "FLAG_ONLY — Oracle proceeds with Δ_PEG expansion.",
        "cleared_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
