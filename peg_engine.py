"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        Performance Envelope Generator (PEG) Engine                          ║
║        HeadsUp OS v3.0.0 | Neural Data Agency                               ║
║        The Heads Up! Foundation | HeadsUP MEDIA & Scouting                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE:
    The PEG Engine generates the dual-taxonomy performance projection envelope
    for every athlete processed by the HeadsUp OS Oracle. It computes:

        Floor OVR  = (PRO-Score × 0.65) + (NER × 0.35)
                     → Conservative projection: behavioral floor under pressure
        Ceiling OVR = (NER × 0.65) + (PRO-Score × 0.35)
                     → Optimistic projection: performance ceiling at peak
        Δ_PEG       = Ceiling − Floor (× 1.15 if FLAG_ONLY CIR on file)

    Both NBA and Collegiate tier taxonomies are resolved for Floor and Ceiling.

ZERO-DELTA ASSET:
    When Δ_PEG = 0.00 or floor_tier == ceiling_tier on both taxonomies,
    the athlete is classified as a Capital Asset — a rare, high-certainty
    profile where floor and ceiling collapse to the same tier.

VALIDATION ANCHOR (BOONE CANONICAL VECTOR):
    Input:
        PRO-Score: 82.30 | NER: 82.42 | CIR: CLEAR
    Expected:
        Floor OVR: 82.34 | Ceiling OVR: 82.38 | Δ_PEG: 0.04
        NBA Tier (Floor + Ceiling): Low Starter (Tier 3)
        Collegiate Tier (Floor + Ceiling): All-Conference Starter (Tier 2)
        Zero Delta: True (Capital Asset on both taxonomies)

    Run: python peg_engine.py → must show 11/11 PASS.

PYDANTIC VERSION:
    v1.10.21 — pinned for Render compatibility. Do NOT upgrade.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — PEG CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

PEG_FLOOR_WEIGHTS = {"pro_score": 0.65, "ner": 0.35}
PEG_CEILING_WEIGHTS = {"ner": 0.65, "pro_score": 0.35}

# CIR FLAG_ONLY expands Δ_PEG by 15% (applied to ceiling only)
FLAG_ONLY_CEILING_EXPANSION: float = 0.15

# ─── NBA Tier Taxonomy ───────────────────────────────────────────────────────
# Each tier: (label, min_ovr_inclusive)
NBA_TIERS: list[tuple[str, float]] = [
    ("All-Star / Franchise Cornerstone (Tier 1)", 90.0),
    ("Starter / High-Impact Role Player (Tier 2)", 83.0),
    ("Low Starter (Tier 3)",                       78.0),
    ("Rotation Player (Tier 4)",                   72.0),
    ("Fringe Roster / End-of-Bench (Tier 5)",      65.0),
    ("G-League / Developmental (Tier 6)",           0.0),
]

# ─── Collegiate Tier Taxonomy ────────────────────────────────────────────────
COLLEGIATE_TIERS: list[tuple[str, float]] = [
    ("All-American / National Impact (Tier 1)",  90.0),
    ("All-Conference Starter (Tier 2)",           80.0),
    ("Conference Contributor / Starter (Tier 3)", 72.0),
    ("Role Player / Depth (Tier 4)",              63.0),
    ("Walk-On / Developmental (Tier 5)",           0.0),
]


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — DATA MODELS (Pydantic v1)
# ─────────────────────────────────────────────────────────────────────────────

class PEGInput(BaseModel):
    """Input payload for generate_peg_report()."""
    athlete_id:         str   = Field(..., description="UUID of the athlete.")
    full_name:          str   = Field(..., description="Athlete's full name.")
    pro_score:          float = Field(..., ge=0.0, le=100.0, description="HeadsUp PRO-Score (0–100).")
    ner:                float = Field(..., ge=0.0, le=100.0, description="Neural Efficiency Rating (0–100).")
    cir_disposition:    str   = Field("CLEAR", description="CIR disposition: CLEAR | FLAG_ONLY | HUMAN_GATE | AIS_EXCLUSION.")

    class Config:
        schema_extra = {
            "example": {
                "athlete_id":      "uuid-0004-boone",
                "full_name":       "Mike Boone",
                "pro_score":       82.30,
                "ner":             82.42,
                "cir_disposition": "CLEAR",
            }
        }


class TierResult(BaseModel):
    """Resolved tier label for a single taxonomy at floor or ceiling."""
    tier_label: str
    tier_number: int
    ovr:         float


class PEGReport(BaseModel):
    """
    Full PEG output package — consumed by format_oracle_output() and
    passed to the LLM for NIL narrative generation.
    """
    athlete_id:      str
    full_name:       str

    # ── OVR projections ────────────────────────────────────────────────────
    floor_ovr:       float
    ceiling_ovr:     float
    delta_peg:       float
    cir_expansion:   bool   # True if FLAG_ONLY multiplier was applied

    # ── NBA taxonomy ───────────────────────────────────────────────────────
    nba_floor:       TierResult
    nba_ceiling:     TierResult
    nba_zero_delta:  bool   # floor_tier == ceiling_tier

    # ── Collegiate taxonomy ────────────────────────────────────────────────
    col_floor:       TierResult
    col_ceiling:     TierResult
    col_zero_delta:  bool   # floor_tier == ceiling_tier

    # ── Capital Asset flag ─────────────────────────────────────────────────
    is_capital_asset: bool  # True if BOTH taxonomies show zero_delta

    # ── Advisory ───────────────────────────────────────────────────────────
    pre_decision_intel: str


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — TIER RESOLUTION
# ─────────────────────────────────────────────────────────────────────────────

def _resolve_tier(
    ovr: float,
    taxonomy: list[tuple[str, float]],
) -> TierResult:
    """
    Resolve the tier label and number for a given OVR score against a taxonomy.

    Args:
        ovr:      Float OVR score (0–100).
        taxonomy: Ordered list of (label, min_ovr) tuples, highest first.

    Returns:
        TierResult with label, tier number (1-based), and OVR.
    """
    for i, (label, min_ovr) in enumerate(taxonomy):
        if ovr >= min_ovr:
            return TierResult(tier_label=label, tier_number=i + 1, ovr=round(ovr, 2))
    # Safety fallback — last tier
    label, _ = taxonomy[-1]
    return TierResult(tier_label=label, tier_number=len(taxonomy), ovr=round(ovr, 2))


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — CORE PEG CALCULATION
# ─────────────────────────────────────────────────────────────────────────────

def generate_peg_report(payload: PEGInput) -> PEGReport:
    """
    Generate the full dual-taxonomy Performance Envelope for an athlete.

    Calculation:
        floor_ovr   = (pro_score × 0.65) + (ner × 0.35)
        ceiling_ovr = (ner × 0.65) + (pro_score × 0.35)
        If CIR disposition == FLAG_ONLY:
            ceiling_ovr += (ceiling_ovr × 0.15)   [Δ_PEG expanded 15%]
        delta_peg   = ceiling_ovr − floor_ovr

    Args:
        payload: PEGInput with pro_score, ner, cir_disposition.

    Returns:
        PEGReport with full dual-taxonomy projection envelope.
    """
    pro  = payload.pro_score
    ner  = payload.ner
    disp = payload.cir_disposition.upper()

    # Core OVR projections
    floor_ovr   = round((pro * PEG_FLOOR_WEIGHTS["pro_score"]) + (ner * PEG_FLOOR_WEIGHTS["ner"]), 2)
    ceiling_ovr = round((ner * PEG_CEILING_WEIGHTS["ner"]) + (pro * PEG_CEILING_WEIGHTS["pro_score"]), 2)

    # FLAG_ONLY CIR expands the ceiling to reflect behavioral uncertainty
    cir_expansion = disp == "FLAG_ONLY"
    if cir_expansion:
        ceiling_ovr = round(ceiling_ovr * (1 + FLAG_ONLY_CEILING_EXPANSION), 2)

    delta_peg = round(ceiling_ovr - floor_ovr, 2)

    # Resolve NBA tiers
    nba_floor_tier   = _resolve_tier(floor_ovr,   NBA_TIERS)
    nba_ceiling_tier = _resolve_tier(ceiling_ovr, NBA_TIERS)
    nba_zero_delta   = nba_floor_tier.tier_number == nba_ceiling_tier.tier_number

    # Resolve Collegiate tiers
    col_floor_tier   = _resolve_tier(floor_ovr,   COLLEGIATE_TIERS)
    col_ceiling_tier = _resolve_tier(ceiling_ovr, COLLEGIATE_TIERS)
    col_zero_delta   = col_floor_tier.tier_number == col_ceiling_tier.tier_number

    is_capital_asset = nba_zero_delta and col_zero_delta

    # Build pre-decision intel advisory
    intel = _build_advisory(
        payload=payload,
        floor_ovr=floor_ovr,
        ceiling_ovr=ceiling_ovr,
        delta_peg=delta_peg,
        nba_floor=nba_floor_tier,
        nba_ceiling=nba_ceiling_tier,
        col_floor=col_floor_tier,
        col_ceiling=col_ceiling_tier,
        is_capital_asset=is_capital_asset,
        cir_expansion=cir_expansion,
    )

    return PEGReport(
        athlete_id=payload.athlete_id,
        full_name=payload.full_name,
        floor_ovr=floor_ovr,
        ceiling_ovr=ceiling_ovr,
        delta_peg=delta_peg,
        cir_expansion=cir_expansion,
        nba_floor=nba_floor_tier,
        nba_ceiling=nba_ceiling_tier,
        nba_zero_delta=nba_zero_delta,
        col_floor=col_floor_tier,
        col_ceiling=col_ceiling_tier,
        col_zero_delta=col_zero_delta,
        is_capital_asset=is_capital_asset,
        pre_decision_intel=intel,
    )


def _build_advisory(
    payload: PEGInput,
    floor_ovr: float,
    ceiling_ovr: float,
    delta_peg: float,
    nba_floor: TierResult,
    nba_ceiling: TierResult,
    col_floor: TierResult,
    col_ceiling: TierResult,
    is_capital_asset: bool,
    cir_expansion: bool,
) -> str:
    """Build the pre-decision intel advisory string for Oracle and GM output."""
    lines = [
        f"PEG Report — {payload.full_name}",
        f"Floor OVR: {floor_ovr} | Ceiling OVR: {ceiling_ovr} | Δ_PEG: {delta_peg}",
        f"NBA Projection  → Floor: {nba_floor.tier_label} | Ceiling: {nba_ceiling.tier_label}",
        f"Collegiate      → Floor: {col_floor.tier_label} | Ceiling: {col_ceiling.tier_label}",
    ]
    if is_capital_asset:
        lines.append(
            "Capital Asset — floor and ceiling collapse to the same tier on both taxonomies. "
            "High-certainty profile. Minimal projection risk."
        )
    if cir_expansion:
        lines.append(
            "NOTE: Δ_PEG expanded 15% (FLAG_ONLY CIR on file). "
            "Behavioral uncertainty has widened the performance projection range."
        )
    return " | ".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — ORACLE OUTPUT FORMATTER
# ─────────────────────────────────────────────────────────────────────────────

def format_oracle_output(
    neural_audit: dict,
    peg: PEGReport,
    cir: dict,
) -> dict:
    """
    Assemble the unified Oracle output package passed to the LLM.

    Combines the Neural Audit result, PEG matrix, and CIR status into a
    single dict that the Oracle LLM uses to generate NIL narratives.

    Args:
        neural_audit: Dict from nda_score() (PRO-Score, NER, quests, etc.)
        peg:          PEGReport from generate_peg_report()
        cir:          CIRClearanceResult dict from fetch_cir_clearance()

    Returns:
        Unified Oracle output dict (JSON-serializable).
    """
    return {
        "oracle_version": "3.0.0",
        "athlete_id":     peg.athlete_id,
        "full_name":      peg.full_name,

        # ── Neural Audit core metrics ─────────────────────────────────────
        "neural_audit": {
            "neck_up_pro_score": neural_audit.get("neck_up_pro_score"),
            "neck_up_ner":       neural_audit.get("neck_up_ner"),
            "ovr":               neural_audit.get("ovr"),
            "culture_grade":     neural_audit.get("culture_grade"),
            "deficiency_flags":  neural_audit.get("deficiency_flags", []),
            "pro_quests":        neural_audit.get("pro_quests_triggered", []),
        },

        # ── PEG matrix ────────────────────────────────────────────────────
        "peg_matrix": {
            "floor_ovr":       peg.floor_ovr,
            "ceiling_ovr":     peg.ceiling_ovr,
            "delta_peg":       peg.delta_peg,
            "cir_expansion":   peg.cir_expansion,
            "is_capital_asset": peg.is_capital_asset,
            "nba": {
                "floor":      {"tier": peg.nba_floor.tier_label,   "ovr": peg.nba_floor.ovr},
                "ceiling":    {"tier": peg.nba_ceiling.tier_label, "ovr": peg.nba_ceiling.ovr},
                "zero_delta": peg.nba_zero_delta,
            },
            "collegiate": {
                "floor":      {"tier": peg.col_floor.tier_label,   "ovr": peg.col_floor.ovr},
                "ceiling":    {"tier": peg.col_ceiling.tier_label, "ovr": peg.col_ceiling.ovr},
                "zero_delta": peg.col_zero_delta,
            },
        },

        # ── CIR gate status (never surfaced to athletes/scouts) ───────────
        "pre_decision_intel": {
            "cir_disposition":      cir.get("aggregate_disposition", "CLEAR"),
            "oracle_release_blocked": cir.get("oracle_release_blocked", False),
            "human_review_required": cir.get("human_review_required", False),
            "peg_expansion_applied": cir.get("peg_expansion_applied", False),
            "peg_advisory":          peg.pre_decision_intel,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 6 — SELF-VALIDATION (python peg_engine.py → 11/11 PASS)
# ─────────────────────────────────────────────────────────────────────────────

def _run_validation() -> None:
    """
    Self-test suite. All 11 checks must pass before any deploy.
    Boone canonical vector is the primary anchor — if it fails, stop.
    """
    import sys

    PASS = "\033[92mPASS\033[0m"
    FAIL = "\033[91mFAIL\033[0m"
    results: list[bool] = []

    def check(label: str, condition: bool) -> None:
        status = PASS if condition else FAIL
        print(f"  [{status}] {label}")
        results.append(condition)

    print("\n─── PEG Engine Validation ───────────────────────────────────────────────────")

    # ── BOONE CANONICAL VECTOR ────────────────────────────────────────────
    boone = generate_peg_report(PEGInput(
        athlete_id="uuid-0004-boone",
        full_name="Mike Boone",
        pro_score=82.30,
        ner=82.42,
        cir_disposition="CLEAR",
    ))

    # CHECK 1 — Floor OVR: 82.34
    check("Boone floor_ovr == 82.34", boone.floor_ovr == 82.34)

    # CHECK 2 — Ceiling OVR: 82.38
    check("Boone ceiling_ovr == 82.38", boone.ceiling_ovr == 82.38)

    # CHECK 3 — Δ_PEG: 0.04
    check("Boone delta_peg == 0.04", boone.delta_peg == 0.04)

    # CHECK 4 — NBA Floor: Low Starter (Tier 3)
    check(
        "Boone NBA floor → Low Starter (Tier 3)",
        "Low Starter (Tier 3)" in boone.nba_floor.tier_label,
    )

    # CHECK 5 — NBA Ceiling: Low Starter (Tier 3)
    check(
        "Boone NBA ceiling → Low Starter (Tier 3)",
        "Low Starter (Tier 3)" in boone.nba_ceiling.tier_label,
    )

    # CHECK 6 — Collegiate Floor: All-Conference Starter (Tier 2)
    check(
        "Boone Collegiate floor → All-Conference Starter (Tier 2)",
        "All-Conference Starter (Tier 2)" in boone.col_floor.tier_label,
    )

    # CHECK 7 — Collegiate Ceiling: All-Conference Starter (Tier 2)
    check(
        "Boone Collegiate ceiling → All-Conference Starter (Tier 2)",
        "All-Conference Starter (Tier 2)" in boone.col_ceiling.tier_label,
    )

    # CHECK 8 — Zero Delta: True (Capital Asset on both taxonomies)
    check("Boone is_capital_asset == True", boone.is_capital_asset is True)

    # CHECK 9 — No CIR expansion on CLEAR
    check("Boone cir_expansion == False (CLEAR disposition)", boone.cir_expansion is False)

    # ── FLAG_ONLY EXPANSION ───────────────────────────────────────────────
    flagged = generate_peg_report(PEGInput(
        athlete_id="uuid-test-flag",
        full_name="Test Athlete",
        pro_score=82.30,
        ner=82.42,
        cir_disposition="FLAG_ONLY",
    ))
    # CHECK 10 — FLAG_ONLY expands ceiling
    check(
        "FLAG_ONLY raises ceiling_ovr above CLEAR ceiling",
        flagged.ceiling_ovr > 82.38,
    )

    # CHECK 11 — format_oracle_output returns correct structure
    oracle_pkg = format_oracle_output(
        neural_audit={
            "neck_up_pro_score": 82.30,
            "neck_up_ner":       82.42,
            "ovr":               82.36,
            "culture_grade":     "B+",
            "deficiency_flags":  [],
            "pro_quests_triggered": [],
        },
        peg=boone,
        cir={"aggregate_disposition": "CLEAR", "oracle_release_blocked": False,
             "human_review_required": False, "peg_expansion_applied": False},
    )
    check(
        "format_oracle_output returns peg_matrix with floor_ovr and is_capital_asset",
        oracle_pkg.get("peg_matrix", {}).get("floor_ovr") == 82.34
        and oracle_pkg["peg_matrix"]["is_capital_asset"] is True,
    )

    passed = sum(results)
    total  = len(results)
    print(f"\n─── Result: {passed}/{total} PASS ───────────────────────────────────────────────\n")

    if passed < total:
        print("  ⚠  PEG Engine validation FAILED. Boone canonical vector broken. Do not deploy.")
        sys.exit(1)
    else:
        print("  ✓  PEG Engine validated. Boone canonical vector confirmed.\n")

    # Print Boone summary for reference
    print("  Boone Canonical Vector:")
    print(f"    PRO-Score: 82.30 | NER: 82.42 | OVR: 82.36")
    print(f"    PEG Floor OVR: {boone.floor_ovr} | PEG Ceiling OVR: {boone.ceiling_ovr} | Δ_PEG: {boone.delta_peg}")
    print(f"    NBA Tier (Floor + Ceiling): {boone.nba_floor.tier_label}")
    print(f"    Collegiate Tier (Floor + Ceiling): {boone.col_floor.tier_label}")
    print(f"    Zero Delta: {boone.is_capital_asset} (Capital Asset on both taxonomies)")
    print(f"    CIR Status: CLEAR (no CIR filed for Boone)\n")


if __name__ == "__main__":
    _run_validation()
