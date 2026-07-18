"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        Character Intelligence Report (CIR) Engine                           ║
║        HeadsUp OS v3.0.0 | Neural Data Agency                               ║
║        The Heads Up! Foundation | HeadsUP MEDIA & Scouting                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE:
    The CIR Engine manages behavioral red-flag intelligence for the HeadsUp OS
    Oracle gate. It defines the disposition taxonomy, scoring logic, and
    clearance adjudication used by check_cir_oracle_clearance() in Supabase
    and by fetch_cir_clearance() in oracle_nil_engine.py.

CIR DISPOSITION TAXONOMY:
    CLEAR         — No active CIR. Oracle proceeds without restriction.
    FLAG_ONLY     — Non-blocking flag on file. Oracle proceeds with 15% Δ_PEG
                    expansion to widen the performance projection range.
    HUMAN_GATE    — Human review required before Oracle release.
    AIS_EXCLUSION — Full Oracle suppression. No LLM call fired. No output
                    released to any scout, GM, or program-facing view.

SECURITY:
    - CIR data is NEVER surfaced to athletes, parents, scouts, or public views.
    - The character_intelligence_reports table is append-only (no DELETE policy).
    - AIS_EXCLUSION overrides ALL other logic — it is never overridden.

VALIDATION ANCHOR:
    Run: python cir_engine.py → must show 6/6 PASS.
    Boone (uuid-0004-boone) has no CIR → disposition CLEAR → cleared=True.

PYDANTIC VERSION:
    v1.10.21 — pinned for Render compatibility. Do NOT upgrade.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, validator


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — DISPOSITION TAXONOMY
# ─────────────────────────────────────────────────────────────────────────────

class CIRDisposition(str, Enum):
    CLEAR         = "CLEAR"
    FLAG_ONLY     = "FLAG_ONLY"
    HUMAN_GATE    = "HUMAN_GATE"
    AIS_EXCLUSION = "AIS_EXCLUSION"


# Priority order for aggregation — highest severity wins
DISPOSITION_PRIORITY: dict[str, int] = {
    CIRDisposition.AIS_EXCLUSION: 4,
    CIRDisposition.HUMAN_GATE:    3,
    CIRDisposition.FLAG_ONLY:     2,
    CIRDisposition.CLEAR:         1,
}

# Δ_PEG expansion multiplier for FLAG_ONLY CIR
FLAG_ONLY_PEG_EXPANSION: float = 0.15  # 15% ceiling expansion applied in peg_engine


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — CIR DATA MODELS (Pydantic v1)
# ─────────────────────────────────────────────────────────────────────────────

class CIREntry(BaseModel):
    """
    A single Character Intelligence Report entry.
    Stored in the character_intelligence_reports Supabase table (JSONB payload).
    """
    cir_id:          str   = Field(default_factory=lambda: str(uuid.uuid4()))
    athlete_id:      str   = Field(..., description="UUID of the athlete.")
    disposition:     CIRDisposition = Field(..., description="CIR severity classification.")
    category:        str   = Field(..., description="Behavioral category (e.g., 'conduct', 'academic').")
    summary:         str   = Field(..., description="Plain-language summary of the flag.")
    filed_by:        str   = Field(..., description="Staff member or system that filed the CIR.")
    filed_at:        str   = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    )
    active:          bool  = Field(True, description="False = resolved/archived.")
    admin_cleared:   bool  = Field(False, description="True = HUMAN_GATE cleared by admin.")
    admin_cleared_by: Optional[str] = Field(None, description="Admin who cleared HUMAN_GATE.")
    notes:           Optional[str]  = Field(None, description="Internal notes (never shown to athlete).")

    @validator("disposition", pre=True)
    def validate_disposition(cls, v):
        if isinstance(v, str):
            v = v.upper()
        if v not in CIRDisposition.__members__:
            raise ValueError(f"Invalid disposition: {v}. Must be one of {list(CIRDisposition.__members__)}.")
        return v

    class Config:
        use_enum_values = True


class CIRClearanceResult(BaseModel):
    """
    Result returned by fetch_cir_clearance() and check_cir_oracle_clearance().
    Consumed by oracle_nil_engine.py to gate every Oracle output.
    """
    cleared:                bool
    aggregate_disposition:  str
    oracle_release_blocked: bool
    human_review_required:  bool
    peg_expansion_applied:  bool
    cir_id:                 Optional[str]
    active_cir_count:       int
    reason:                 str

    class Config:
        use_enum_values = True


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — CORE CLEARANCE LOGIC
# ─────────────────────────────────────────────────────────────────────────────

def adjudicate_clearance(active_entries: List[CIREntry]) -> CIRClearanceResult:
    """
    Determine Oracle clearance from a list of active CIR entries.

    Priority: AIS_EXCLUSION > HUMAN_GATE > FLAG_ONLY > CLEAR (no entries).
    A HUMAN_GATE entry that has been admin_cleared does not block the Oracle
    but retains FLAG_ONLY treatment (PEG expansion applied).

    Args:
        active_entries: All active CIR entries for the athlete.

    Returns:
        CIRClearanceResult with clearance status and Oracle gate signals.
    """
    if not active_entries:
        return CIRClearanceResult(
            cleared=True,
            aggregate_disposition=CIRDisposition.CLEAR,
            oracle_release_blocked=False,
            human_review_required=False,
            peg_expansion_applied=False,
            cir_id=None,
            active_cir_count=0,
            reason="No active CIR on file. Oracle proceeds without restriction.",
        )

    # Find the highest-priority active entry
    dominant = max(
        active_entries,
        key=lambda e: DISPOSITION_PRIORITY.get(e.disposition, 0),
    )

    disposition = dominant.disposition

    # AIS_EXCLUSION — full Oracle suppression, no override path
    if disposition == CIRDisposition.AIS_EXCLUSION:
        return CIRClearanceResult(
            cleared=False,
            aggregate_disposition=CIRDisposition.AIS_EXCLUSION,
            oracle_release_blocked=True,
            human_review_required=False,
            peg_expansion_applied=False,
            cir_id=dominant.cir_id,
            active_cir_count=len(active_entries),
            reason="AIS_EXCLUSION flag active. Oracle output suppressed. No LLM call fired.",
        )

    # HUMAN_GATE — blocked unless admin_cleared
    if disposition == CIRDisposition.HUMAN_GATE:
        if dominant.admin_cleared:
            # Cleared → treat as FLAG_ONLY (PEG expansion, Oracle proceeds)
            return CIRClearanceResult(
                cleared=True,
                aggregate_disposition=CIRDisposition.FLAG_ONLY,
                oracle_release_blocked=False,
                human_review_required=False,
                peg_expansion_applied=True,
                cir_id=dominant.cir_id,
                active_cir_count=len(active_entries),
                reason=(
                    f"HUMAN_GATE cleared by {dominant.admin_cleared_by or 'admin'}. "
                    "Oracle proceeds with FLAG_ONLY treatment and Δ_PEG expansion."
                ),
            )
        return CIRClearanceResult(
            cleared=False,
            aggregate_disposition=CIRDisposition.HUMAN_GATE,
            oracle_release_blocked=True,
            human_review_required=True,
            peg_expansion_applied=False,
            cir_id=dominant.cir_id,
            active_cir_count=len(active_entries),
            reason="HUMAN_GATE active. Admin review required before Oracle release.",
        )

    # FLAG_ONLY — non-blocking, PEG expansion applied
    if disposition == CIRDisposition.FLAG_ONLY:
        return CIRClearanceResult(
            cleared=True,
            aggregate_disposition=CIRDisposition.FLAG_ONLY,
            oracle_release_blocked=False,
            human_review_required=False,
            peg_expansion_applied=True,
            cir_id=dominant.cir_id,
            active_cir_count=len(active_entries),
            reason=(
                f"FLAG_ONLY CIR on file (category: {dominant.category}). "
                "Oracle proceeds. Δ_PEG expanded 15% to reflect behavioral uncertainty."
            ),
        )

    # CLEAR (should never reach here with active_entries — safety fallback)
    return CIRClearanceResult(
        cleared=True,
        aggregate_disposition=CIRDisposition.CLEAR,
        oracle_release_blocked=False,
        human_review_required=False,
        peg_expansion_applied=False,
        cir_id=None,
        active_cir_count=len(active_entries),
        reason="CIR resolved or inactive. Oracle proceeds without restriction.",
    )


def evaluate_cir(
    athlete_id: str,
    active_entries: List[CIREntry],
) -> CIRClearanceResult:
    """
    Public entry point for CIR clearance evaluation.

    Args:
        athlete_id:     UUID string of the athlete.
        active_entries: Active CIR entries fetched from Supabase.

    Returns:
        CIRClearanceResult.
    """
    if not athlete_id:
        raise ValueError("athlete_id is required.")
    return adjudicate_clearance(active_entries)


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — SELF-VALIDATION (python cir_engine.py → 6/6 PASS)
# ─────────────────────────────────────────────────────────────────────────────

def _run_validation() -> None:
    """
    Self-test suite. All 6 checks must pass before any deploy.
    """
    import sys

    PASS = "\033[92mPASS\033[0m"
    FAIL = "\033[91mFAIL\033[0m"
    results: list[bool] = []

    def check(label: str, condition: bool) -> None:
        status = PASS if condition else FAIL
        print(f"  [{status}] {label}")
        results.append(condition)

    print("\n─── CIR Engine Validation ───────────────────────────────────────────────────")

    # CHECK 1 — No active CIR → CLEAR, cleared=True
    result_1 = evaluate_cir("uuid-0004-boone", [])
    check(
        "No active CIR → disposition=CLEAR, cleared=True",
        result_1.aggregate_disposition == CIRDisposition.CLEAR and result_1.cleared is True,
    )

    # CHECK 2 — FLAG_ONLY → cleared=True, peg_expansion=True, not blocked
    flag_entry = CIREntry(
        athlete_id="uuid-test-001",
        disposition=CIRDisposition.FLAG_ONLY,
        category="conduct",
        summary="Minor locker room friction reported by coaching staff.",
        filed_by="staff@headsupfoundation.org",
    )
    result_2 = evaluate_cir("uuid-test-001", [flag_entry])
    check(
        "FLAG_ONLY → cleared=True, peg_expansion=True, oracle_release_blocked=False",
        (
            result_2.cleared is True
            and result_2.peg_expansion_applied is True
            and result_2.oracle_release_blocked is False
        ),
    )

    # CHECK 3 — HUMAN_GATE (not cleared) → blocked, human_review_required=True
    gate_entry = CIREntry(
        athlete_id="uuid-test-002",
        disposition=CIRDisposition.HUMAN_GATE,
        category="academic",
        summary="Eligibility investigation in progress.",
        filed_by="compliance@headsupfoundation.org",
        admin_cleared=False,
    )
    result_3 = evaluate_cir("uuid-test-002", [gate_entry])
    check(
        "HUMAN_GATE (not cleared) → oracle_release_blocked=True, human_review_required=True",
        (
            result_3.oracle_release_blocked is True
            and result_3.human_review_required is True
        ),
    )

    # CHECK 4 — HUMAN_GATE (admin cleared) → treats as FLAG_ONLY
    gate_cleared_entry = CIREntry(
        athlete_id="uuid-test-003",
        disposition=CIRDisposition.HUMAN_GATE,
        category="academic",
        summary="Eligibility cleared after investigation.",
        filed_by="compliance@headsupfoundation.org",
        admin_cleared=True,
        admin_cleared_by="jabari@headsupfoundation.org",
    )
    result_4 = evaluate_cir("uuid-test-003", [gate_cleared_entry])
    check(
        "HUMAN_GATE (admin cleared) → FLAG_ONLY treatment, peg_expansion=True",
        (
            result_4.cleared is True
            and result_4.peg_expansion_applied is True
            and result_4.aggregate_disposition == CIRDisposition.FLAG_ONLY
        ),
    )

    # CHECK 5 — AIS_EXCLUSION → full suppression, no override
    ais_entry = CIREntry(
        athlete_id="uuid-test-004",
        disposition=CIRDisposition.AIS_EXCLUSION,
        category="conduct",
        summary="Conduct warranting full Oracle suppression.",
        filed_by="ops@headsupfoundation.org",
    )
    result_5 = evaluate_cir("uuid-test-004", [ais_entry])
    check(
        "AIS_EXCLUSION → cleared=False, oracle_release_blocked=True, peg_expansion=False",
        (
            result_5.cleared is False
            and result_5.oracle_release_blocked is True
            and result_5.peg_expansion_applied is False
        ),
    )

    # CHECK 6 — Mixed entries: AIS_EXCLUSION + FLAG_ONLY → AIS_EXCLUSION wins
    result_6 = evaluate_cir("uuid-test-005", [flag_entry, ais_entry])
    check(
        "Mixed entries (FLAG_ONLY + AIS_EXCLUSION) → AIS_EXCLUSION dominates",
        result_6.aggregate_disposition == CIRDisposition.AIS_EXCLUSION,
    )

    passed = sum(results)
    total  = len(results)
    print(f"\n─── Result: {passed}/{total} PASS ───────────────────────────────────────────────\n")

    if passed < total:
        print("  ⚠  CIR Engine validation FAILED. Do not deploy.")
        sys.exit(1)
    else:
        print("  ✓  CIR Engine validated. Safe to integrate.\n")


if __name__ == "__main__":
    _run_validation()
