"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        HeadsUp OS Oracle — NIL Engine                                        ║
║        CIR Gate + PEG Matrix + Neural Audit → NIL Narrative                  ║
║        HeadsUp OS v3.0.0 | Neural Data Agency                                ║
║        The Heads Up! Foundation | HeadsUP MEDIA & Scouting                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE:
    The Oracle NIL Engine is the final output layer of the HeadsUp OS pipeline.
    It executes the complete 10-step Oracle chain:

        1. Receive athlete_id
        2. Fetch latest CIR from Supabase via check_cir_oracle_clearance()
        3. AIS_EXCLUSION → suppressed output immediately, no LLM call
        4. HUMAN_GATE (not cleared) → blocked output, no LLM call
        5. CLEAR or FLAG_ONLY → proceed
        6. Run Neural Audit (nda_score)
        7. Call generate_peg_report() with audit results + CIR disposition
        8. Call format_oracle_output() to build unified package
        9. Pass unified package to LLM for NIL narrative generation
       10. Return complete Oracle output

SECURITY:
    - HU_LLM_API_KEY and SUPABASE_SERVICE_ROLE_KEY = server-side only
    - CIR data is NEVER surfaced to athletes, parents, scouts, or public views
    - All Oracle and LLM calls route through Next.js API routes only
    - AIS_EXCLUSION output is logged but never delivered to any external view

PYDANTIC VERSION:
    v1.10.21 — pinned for Render compatibility. Do NOT upgrade.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field

from nda_hughes_neural_score import NDAScoreRequest, nda_score
from cir_engine import CIRDisposition
from peg_engine import PEGInput, generate_peg_report, format_oracle_output


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

ORACLE_VERSION = "3.0.0"
LLM_MODEL      = "claude-sonnet-4-20250514"

_LLM_API_KEY:   str = os.environ.get("HU_LLM_API_KEY", "")
_SUPABASE_URL:  str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
_SUPABASE_KEY:  str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────

class OracleNILRequest(BaseModel):
    """
    Full Oracle NIL scan request.
    Sent from the Next.js API route at app/api/oracle/nil-scan/route.ts.
    """
    athlete_id:         str   = Field(..., description="UUID of the athlete.")
    full_name:          str   = Field(..., description="Athlete's full name.")
    graduation_year:    int   = Field(..., ge=2024, le=2032)
    school:             str   = Field(...)
    entitlement_flags:  int   = Field(0, ge=0)
    injury_status:      bool  = Field(False)

    # Neck Up behavioral metrics
    culture_equity:     float = Field(..., ge=0.0, le=100.0)
    resilience:         float = Field(..., ge=0.0, le=100.0)
    coachability:       float = Field(..., ge=0.0, le=100.0)
    playmaking:         float = Field(..., ge=0.0, le=100.0)
    defense:            float = Field(..., ge=0.0, le=100.0)
    physical_output:    float = Field(..., ge=0.0, le=100.0)

    class Config:
        schema_extra = {
            "example": {
                "athlete_id":      "uuid-0004-boone",
                "full_name":       "Mike Boone",
                "graduation_year": 2026,
                "school":          "DFW Elite Prep",
                "entitlement_flags": 0,
                "injury_status":   False,
                "culture_equity":  88.0,
                "resilience":      76.0,
                "coachability":    82.0,
                "playmaking":      85.0,
                "defense":         78.5,
                "physical_output": 84.0,
            }
        }


class OracleNILResponse(BaseModel):
    """Complete Oracle NIL output package."""
    oracle_version:   str
    athlete_id:       str
    full_name:        str
    processed_at:     str

    # Gate status
    cleared:          bool
    gate_disposition: str  # CLEAR | FLAG_ONLY | HUMAN_GATE | AIS_EXCLUSION
    suppressed:       bool  # True if AIS_EXCLUSION or uncleared HUMAN_GATE

    # Scores (None if suppressed)
    neural_audit:     Optional[dict]
    peg_matrix:       Optional[dict]
    pre_decision_intel: Optional[dict]

    # NIL narrative (None if suppressed or no LLM)
    nil_narrative:    Optional[str]

    # Suppression message (populated only when suppressed=True)
    suppression_notice: Optional[str]


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — CIR GATE
# ─────────────────────────────────────────────────────────────────────────────

async def fetch_cir_clearance(athlete_id: str) -> dict:
    """
    Fetch CIR clearance status from Supabase before Oracle execution.
    Uses the SQL gate function — does NOT pull full JSONB entries.

    Args:
        athlete_id: UUID string of the athlete.

    Returns:
        CIR clearance dict with cleared, aggregate_disposition, etc.
        Falls back to CLEAR if Supabase is unavailable (fail-open for
        system errors — never fail-open for actual CIR flags).
    """
    if not _SUPABASE_URL or not _SUPABASE_KEY:
        # Environment not configured — fail-open with a log
        return _clear_fallback("Supabase environment not configured.")

    try:
        import httpx
        url = f"{_SUPABASE_URL}/rest/v1/rpc/check_cir_oracle_clearance"
        headers = {
            "apikey":        _SUPABASE_KEY,
            "Authorization": f"Bearer {_SUPABASE_KEY}",
            "Content-Type":  "application/json",
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json={"p_athlete_id": athlete_id}, headers=headers)

        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and data:
                return data[0]
            if isinstance(data, dict):
                return data

        # Supabase returned an error — log and fail-open
        return _clear_fallback(f"Supabase gate error: HTTP {resp.status_code}")

    except Exception as e:
        return _clear_fallback(f"CIR gate exception: {str(e)}")


def _clear_fallback(reason: str) -> dict:
    """Return a CLEAR fallback when the CIR gate is unavailable due to system error."""
    return {
        "cleared":                True,
        "aggregate_disposition":  CIRDisposition.CLEAR,
        "oracle_release_blocked": False,
        "human_review_required":  False,
        "peg_expansion_applied":  False,
        "cir_id":                 None,
        "active_cir_count":       0,
        "reason":                 reason,
    }


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — LLM NIL NARRATIVE
# ─────────────────────────────────────────────────────────────────────────────

async def _generate_nil_narrative(oracle_package: dict) -> str:
    """
    Pass the unified Oracle package to Claude for NIL narrative generation.

    Args:
        oracle_package: Unified dict from format_oracle_output().

    Returns:
        NIL narrative string from the LLM.
    """
    if not _LLM_API_KEY:
        return "[NIL narrative unavailable: HU_LLM_API_KEY not configured.]"

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=_LLM_API_KEY)

        athlete    = oracle_package.get("full_name", "the athlete")
        audit      = oracle_package.get("neural_audit", {})
        peg        = oracle_package.get("peg_matrix", {})
        intel      = oracle_package.get("pre_decision_intel", {})
        pro_score  = audit.get("neck_up_pro_score", "N/A")
        ner        = audit.get("neck_up_ner", "N/A")
        ovr        = audit.get("ovr", "N/A")
        culture    = audit.get("culture_grade", "N/A")
        floor_ovr  = peg.get("floor_ovr", "N/A")
        ceiling_ovr = peg.get("ceiling_ovr", "N/A")
        delta_peg  = peg.get("delta_peg", "N/A")
        capital    = peg.get("is_capital_asset", False)
        nba_floor  = peg.get("nba", {}).get("floor", {}).get("tier", "N/A")
        col_floor  = peg.get("collegiate", {}).get("floor", {}).get("tier", "N/A")
        quests     = [q.get("title") for q in audit.get("pro_quests", []) if q.get("title")]
        cir_note   = intel.get("peg_advisory", "")

        system_prompt = (
            "You are the HeadsUp OS Oracle — the behavioral intelligence voice of "
            "The Heads Up! Foundation. You generate NIL (Name, Image, Likeness) "
            "market intelligence reports for college basketball recruiting scouts, "
            "front-office GMs, and program directors. Your language is precise, "
            "professional, and grounded in behavioral data. You do NOT speculate. "
            "You NEVER mention CIR details or internal disposition flags. "
            "You reference only the public-facing intelligence: PRO-Score, NER, "
            "OVR, Culture Grade, PEG Floor/Ceiling, tier taxonomy, and PRO-Quests."
        )

        user_prompt = f"""Generate a NIL Market Intelligence Report for {athlete}.

BEHAVIORAL DATA:
- PRO-Score: {pro_score}
- Neural Efficiency Rating (NER): {ner}
- Overall (OVR): {ovr}
- Culture Grade: {culture}

PERFORMANCE ENVELOPE (PEG):
- Floor OVR: {floor_ovr}
- Ceiling OVR: {ceiling_ovr}
- Δ_PEG: {delta_peg}
- Capital Asset: {"Yes" if capital else "No"}

TAXONOMY PROJECTIONS:
- NBA Pathway Floor: {nba_floor}
- Collegiate Floor: {col_floor}

PRO-QUESTS TRIGGERED:
{chr(10).join(f"  • {q}" for q in quests) if quests else "  None — no behavioral deficiencies flagged."}

{f"ADVISORY NOTE: {cir_note}" if cir_note and intel.get("peg_expansion_applied") else ""}

Write a professional NIL market intelligence report (3–4 paragraphs) covering:
1. Behavioral investment thesis (PRO-Score interpretation)
2. Performance ceiling and floor analysis (PEG matrix)
3. Development trajectory (PRO-Quests and what they signal)
4. NIL market positioning recommendation

Use the HeadsUp OS lexicon: "Sovereign Asset", "Neck Up Multipliers", "Neural Market Position", "PRO-Quest", "HeadsUp Neural Audit". Do NOT use: "soft skills", "player report", "evaluation engine", "market classification"."""

        message = client.messages.create(
            model=LLM_MODEL,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return message.content[0].text

    except Exception as e:
        return f"[NIL narrative generation error: {str(e)}]"


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — ORACLE EXECUTION CHAIN
# ─────────────────────────────────────────────────────────────────────────────

async def run_oracle_nil_scan(request: OracleNILRequest) -> OracleNILResponse:
    """
    Execute the full 10-step Oracle NIL chain.

    Steps:
        1. Receive athlete_id
        2. Fetch CIR clearance from Supabase
        3. AIS_EXCLUSION → return suppressed output, no LLM call
        4. HUMAN_GATE (not cleared) → return blocked output, no LLM call
        5. CLEAR or FLAG_ONLY → proceed
        6. Run Neural Audit
        7. Generate PEG report
        8. Build unified Oracle package
        9. LLM NIL narrative generation
       10. Return complete Oracle output

    Args:
        request: OracleNILRequest with athlete_id, metrics, and personal data.

    Returns:
        OracleNILResponse — complete Oracle output package.
    """
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    # ── STEP 2: CIR Gate ───────────────────────────────────────────────────
    cir = await fetch_cir_clearance(request.athlete_id)
    disposition = cir.get("aggregate_disposition", CIRDisposition.CLEAR)

    # ── STEP 3: AIS_EXCLUSION — full suppression ───────────────────────────
    if disposition == CIRDisposition.AIS_EXCLUSION or cir.get("oracle_release_blocked") and not cir.get("human_review_required"):
        return OracleNILResponse(
            oracle_version=ORACLE_VERSION,
            athlete_id=request.athlete_id,
            full_name=request.full_name,
            processed_at=now,
            cleared=False,
            gate_disposition=CIRDisposition.AIS_EXCLUSION,
            suppressed=True,
            neural_audit=None,
            peg_matrix=None,
            pre_decision_intel=None,
            nil_narrative=None,
            suppression_notice=(
                "Oracle output suppressed. This athlete profile is not available "
                "for distribution at this time. Contact HeadsUp OS administration."
            ),
        )

    # ── STEP 4: HUMAN_GATE (uncleared) — blocked ──────────────────────────
    if cir.get("human_review_required"):
        return OracleNILResponse(
            oracle_version=ORACLE_VERSION,
            athlete_id=request.athlete_id,
            full_name=request.full_name,
            processed_at=now,
            cleared=False,
            gate_disposition=CIRDisposition.HUMAN_GATE,
            suppressed=True,
            neural_audit=None,
            peg_matrix=None,
            pre_decision_intel=None,
            nil_narrative=None,
            suppression_notice=(
                "Oracle output pending human review. "
                "This profile requires admin clearance before release."
            ),
        )

    # ── STEP 5: Cleared (CLEAR or FLAG_ONLY) — proceed ────────────────────
    cir_disp_for_peg = disposition if disposition in (
        CIRDisposition.CLEAR, CIRDisposition.FLAG_ONLY
    ) else CIRDisposition.CLEAR

    # ── STEP 6: Neural Audit ───────────────────────────────────────────────
    nda_request = NDAScoreRequest(
        athlete_id=request.athlete_id,
        full_name=request.full_name,
        graduation_year=request.graduation_year,
        school=request.school,
        entitlement_flags=request.entitlement_flags,
        injury_status=request.injury_status,
        neck_up={
            "culture_equity":  request.culture_equity,
            "resilience":      request.resilience,
            "coachability":    request.coachability,
            "playmaking":      request.playmaking,
            "defense":         request.defense,
            "physical_output": request.physical_output,
        },
    )
    audit_result = nda_score(nda_request)
    audit_dict   = audit_result.dict()

    # ── STEP 7: PEG Report ────────────────────────────────────────────────
    peg_input = PEGInput(
        athlete_id=request.athlete_id,
        full_name=request.full_name,
        pro_score=audit_result.neck_up_pro_score,
        ner=audit_result.neck_up_ner,
        cir_disposition=cir_disp_for_peg,
    )
    peg_report = generate_peg_report(peg_input)

    # ── STEP 8: Unified Oracle package ────────────────────────────────────
    oracle_package = format_oracle_output(audit_dict, peg_report, cir)

    # ── STEP 9: LLM NIL narrative ─────────────────────────────────────────
    nil_narrative = await _generate_nil_narrative(oracle_package)

    # ── STEP 10: Return complete output ───────────────────────────────────
    return OracleNILResponse(
        oracle_version=ORACLE_VERSION,
        athlete_id=request.athlete_id,
        full_name=request.full_name,
        processed_at=now,
        cleared=True,
        gate_disposition=str(disposition),
        suppressed=False,
        neural_audit=oracle_package.get("neural_audit"),
        peg_matrix=oracle_package.get("peg_matrix"),
        pre_decision_intel=oracle_package.get("pre_decision_intel"),
        nil_narrative=nil_narrative,
        suppression_notice=None,
    )
