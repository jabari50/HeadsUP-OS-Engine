"""
HU-OS · Blind Arbitrage Output Manager
Generates platform-optimized copy for Instagram and X when an athlete
clears all four evaluation gates with elite marks.

Gate definitions (configurable via env):
  Gate 6  — Culture Equity:    neck_up_culture_equity >= ELITE_CULTURE_THRESHOLD (default 85.0)
  Gate 9  — Public Gravity:    Public_Gravity_Score   >= GATE9_THRESHOLD (default 35.0)
                               Facebook + Instagram are the primary drivers.
                               Scored against the 143K HeadsUp MEDIA Node distribution floor.
  Gate 12 — Quant Variance:    stdev(playmaking, defense, physical_output) <= VARIANCE_CEILING (default 8.0)
                               Low variance = consistently elite across all quantitative markers.
  Gate 14 — Valuation:         Arbitrage Verdict      >= GATE14_FLOOR (default $25,000)
                               Derived from 5M REACH_VELOCITY × $15.00 CPM × OVR modifier.
                               Neural Audit (Phase 2) applies 1.25× Stability Premium.

ZHR: missing sub-scores cause gates to fail cleanly — never invented.

Import via: from output_manager import evaluate_gates, generate_blind_arb_copy
"""
from __future__ import annotations

import logging
import os
import statistics
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

from storage.media_node import (
    MEDIA_NODE,
    expected_impressions as _calc_impressions,
    gate9_pass,
    public_gravity_score,
)
from valuation_engine import (
    ValuationResult,
    calculate_nil_leverage,
    format_arbitrage_verdict,
)

_ROOT = Path(__file__).resolve().parent
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")

log = logging.getLogger(__name__)

# ── Gate thresholds (override in env) ────────────────────────────────────────
ELITE_CULTURE_THRESHOLD: float = float(os.getenv("ELITE_CULTURE_THRESHOLD", "85.0"))
VARIANCE_CEILING: float        = float(os.getenv("VARIANCE_CEILING", "8.0"))
# Gate 9 threshold lives in storage.media_node (GATE9_THRESHOLD env var)

SPONSOR_OF_THE_WEEK: str = os.getenv("SPONSOR_OF_THE_WEEK", "{SPONSOR_OF_THE_WEEK}")


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class GateResult:
    gate6_pass: bool
    gate9_pass: bool
    gate12_pass: bool
    gate14_pass: bool
    culture_score: Optional[float]       # neck_up_culture_equity
    gravity_score: float                 # Public_Gravity_Score (0–100)
    quant_variance: Optional[float]      # stdev of NER sub-scores; None if data missing
    valuation: Optional[ValuationResult] # Gate 14 full breakdown; None if prior gates fail
    cleared: bool                        # True only when all four gates pass


@dataclass
class PlatformCopy:
    x: str                       # ≤ 280 chars — ready for post_tweet()
    instagram: str               # full caption with hashtag block
    grad_year: int
    gate6_score: float
    gate9_gravity: float         # Public_Gravity_Score
    gate12_variance: float
    expected_impressions: int    # from the 143K distribution floor
    arbitrage_verdict: str       # formatted dollar value, e.g. "$57,562.50"
    stability_premium: bool      # True when 1.25× applied
    sponsor: str
    generated_at: str


# ── Gate evaluation ───────────────────────────────────────────────────────────

def evaluate_gates(athlete: dict) -> GateResult:
    """
    Evaluates Gate 6 (Culture Equity), Gate 9 (Public Gravity), and
    Gate 12 (Quant Variance) for an athlete dict.

    Accepts rows from either the athletes DB table or an audit snapshot —
    both naming conventions handled via .get() fallbacks.

    ZHR: any missing score yields gate failure rather than a coerced value.
    """
    # Gate 6 — Culture Equity
    culture = _coerce_float(
        athlete.get("neck_up_culture_equity")
        or athlete.get("culture_equity")
        or (athlete.get("neck_up_markers") or {}).get("culture_equity")
    )
    g6 = culture is not None and culture >= ELITE_CULTURE_THRESHOLD

    # Gate 9 — Public Gravity (Facebook + Instagram primary drivers)
    gravity = public_gravity_score(athlete)
    g9      = gate9_pass(athlete)

    # Gate 12 — Quant Variance (stdev of NER sub-scores)
    playmaking = _coerce_float(
        athlete.get("neck_up_playmaking")
        or (athlete.get("neck_up_markers") or {}).get("playmaking")
    )
    defense = _coerce_float(
        athlete.get("neck_up_defense")
        or (athlete.get("neck_up_markers") or {}).get("defense")
    )
    phys = _coerce_float(
        athlete.get("neck_up_physical_output")
        or (athlete.get("neck_up_markers") or {}).get("physical_output")
    )

    sub_scores = [s for s in (playmaking, defense, phys) if s is not None]

    if len(sub_scores) < 2:
        log.warning(
            "evaluate_gates: Gate 12 failed — only %d/3 NER sub-scores available",
            len(sub_scores),
        )
        variance = None
        g12 = False
    else:
        variance = statistics.stdev(sub_scores)
        g12 = variance <= VARIANCE_CEILING

    # Gate 14 — Valuation (only computed when G6+G9+G12 all pass)
    valuation: Optional[ValuationResult] = None
    g14 = False
    if g6 and g9 and g12:
        valuation = calculate_nil_leverage(athlete)
        g14 = valuation.gate14_pass

    log.info(
        "Gate eval — G6 culture=%.1f (%s) | G9 gravity=%.2f (%s) | "
        "G12 variance=%s (%s) | G14 verdict=%s (%s)",
        culture or 0.0,  "PASS" if g6  else "FAIL",
        gravity,         "PASS" if g9  else "FAIL",
        f"{variance:.2f}" if variance is not None else "N/A",
        "PASS" if g12 else "FAIL",
        valuation.formatted_verdict if valuation else "N/A",
        "PASS" if g14 else "FAIL",
    )

    return GateResult(
        gate6_pass=g6,
        gate9_pass=g9,
        gate12_pass=g12,
        gate14_pass=g14,
        culture_score=culture,
        gravity_score=gravity,
        quant_variance=variance,
        valuation=valuation,
        cleared=g6 and g9 and g12 and g14,
    )


# ── Copy generation ───────────────────────────────────────────────────────────

def generate_blind_arb_copy(
    athlete: dict,
    sponsor: Optional[str] = None,
) -> Optional[PlatformCopy]:
    """
    Generates Blind Arbitrage platform copy when the athlete clears all three
    gates. Returns None for any gate failure — never generates copy for
    non-qualifying athletes.

    Expected Impressions are calculated from the 143K HeadsUp MEDIA Node
    distribution floor, weighted by Facebook and Instagram organic reach rates.

    Args:
        athlete: DB row or audit snapshot dict.
        sponsor: Override sponsor text; falls back to SPONSOR_OF_THE_WEEK env var.
    """
    result = evaluate_gates(athlete)

    if not result.cleared:
        log.info(
            "generate_blind_arb_copy: gates not cleared "
            "(G6=%s G9=%s G12=%s) — no copy generated",
            result.gate6_pass, result.gate9_pass, result.gate12_pass,
        )
        return None

    grad_year = (
        athlete.get("graduation_year")
        or athlete.get("grad_year")
        or "202x"
    )

    impressions    = _calc_impressions(athlete)
    active_sponsor = sponsor or SPONSOR_OF_THE_WEEK
    valuation      = result.valuation  # guaranteed non-None when cleared=True

    arb_verdict_str  = valuation.formatted_verdict
    premium_applied  = valuation.stability_premium_applied
    premium_tag      = " ✦ STABILITY PREMIUM" if premium_applied else ""

    sponsor_line_x  = f" Powered by {active_sponsor}." if active_sponsor else ""
    sponsor_line_ig = f"\n\n🤝 Powered by {active_sponsor}" if active_sponsor else ""
    impr_fmt        = f"{impressions:,}"

    # ── X copy (hard ≤ 280 char budget) ──────────────────────────────────────
    x_copy = (
        f"🚨 VERIFIED ASSET: {grad_year} Prospect | "
        "Elite Neural Markers | "
        f"Arbitrage Verdict: {arb_verdict_str}{premium_tag} | "
        f"~{impr_fmt} Est. Impressions. "
        f"Full report live in the B2B Ledger.{sponsor_line_x} "
        "#PROFileOS"
    )
    if len(x_copy) > 280:
        x_copy = (
            f"🚨 VERIFIED ASSET: {grad_year} Prospect | "
            "Elite Neural Markers | "
            f"Arbitrage Verdict: {arb_verdict_str}{premium_tag}. "
            f"Full report live in the B2B Ledger.{sponsor_line_x} "
            "#PROFileOS"
        )
    if len(x_copy) > 280:
        x_copy = (
            f"🚨 VERIFIED ASSET: {grad_year} Prospect | "
            f"Arbitrage Verdict: {arb_verdict_str}{premium_tag}. "
            "B2B Ledger. #PROFileOS"
        )

    # ── Instagram copy (full caption) ─────────────────────────────────────────
    ovr        = _coerce_float(athlete.get("ovr") or athlete.get("pro_score"))
    market_pos = athlete.get("market_position") or athlete.get("neural_market_position")
    position   = athlete.get("position")

    context_lines: list[str] = []
    if ovr is not None:
        context_lines.append(f"📊 OVR: {ovr:.1f}")
    if market_pos:
        context_lines.append(f"📍 Neural Market Position: {market_pos}")
    if position:
        context_lines.append(f"🏀 Position: {position}")
    if result.culture_score is not None:
        context_lines.append(f"🧠 Culture Equity: {result.culture_score:.1f}")
    if result.quant_variance is not None:
        context_lines.append(f"📈 Quant Variance: {result.quant_variance:.2f} (elite consistency)")
    if result.gravity_score > 0:
        context_lines.append(f"📡 Public Gravity Score: {result.gravity_score:.1f}/100")
    context_lines.append(
        f"👁 Expected Impressions: ~{impr_fmt} "
        f"(via {MEDIA_NODE.total_reach:,} HeadsUp MEDIA Node)"
    )
    context_lines.append(f"💰 Market Entry Estimate: {valuation.formatted_entry}")
    context_lines.append(
        f"🏆 ARBITRAGE VERDICT: {arb_verdict_str}"
        + (" ✦ Stability Premium Applied" if premium_applied else "")
    )

    context_block = ("\n".join(context_lines) + "\n\n") if context_lines else ""

    ig_copy = (
        f"🚨 VERIFIED ASSET: {grad_year} Prospect\n\n"
        f"{context_block}"
        "Elite Neural Markers confirmed across all evaluation gates.\n"
        "High-Yield Arbitrage Verdict issued.\n\n"
        "Full report live in the HeadsUp OS B2B Ledger.\n"
        f"{sponsor_line_ig}\n\n"
        "#PROFileOS #HeadsUpOS #BlindArbitrage #NeuralAudit "
        "#SovereignAsset #NILIntelligence #EliteProspect"
    )

    now = datetime.now(timezone.utc).isoformat()
    log.info(
        "generate_blind_arb_copy: copy generated — grad=%s verdict=%s premium=%s",
        grad_year, arb_verdict_str, premium_applied,
    )

    return PlatformCopy(
        x=x_copy,
        instagram=ig_copy,
        grad_year=int(grad_year) if str(grad_year).isdigit() else 0,
        gate6_score=result.culture_score,
        gate9_gravity=result.gravity_score,
        gate12_variance=result.quant_variance,
        expected_impressions=impressions,
        arbitrage_verdict=arb_verdict_str,
        stability_premium=premium_applied,
        sponsor=active_sponsor,
        generated_at=now,
    )


# ── Internal helpers ──────────────────────────────────────────────────────────

def _coerce_float(val: object) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


# ── Import / smoke check ──────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")

    # Fails Gate 6 and Gate 9 (no reach data, low culture)
    failing = {
        "graduation_year": 2027, "neck_up_culture_equity": 72.0,
        "neck_up_playmaking": 88.0, "neck_up_defense": 71.0, "neck_up_physical_output": 90.0,
    }
    r = evaluate_gates(failing)
    assert not r.cleared, "failing athlete should not clear gates"
    assert generate_blind_arb_copy(failing) is None, "failing athlete must return None"

    # Passes all three gates
    passing = {
        "graduation_year": 2026,
        "neck_up_culture_equity": 91.5,
        "neck_up_playmaking": 87.0, "neck_up_defense": 90.0, "neck_up_physical_output": 85.5,
        "ovr": 88.2, "market_position": "High-Value Target", "position": "PG",
        "instagram_reach": 62_000, "facebook_reach": 41_000,
    }
    r2 = evaluate_gates(passing)
    assert r2.gate6_pass,  "Gate 6 should pass"
    assert r2.gate9_pass,  "Gate 9 should pass"
    assert r2.gate12_pass, "Gate 12 should pass"
    assert r2.cleared,     "all gates should clear"

    copy = generate_blind_arb_copy(passing, sponsor="Acme Sports")
    assert copy is not None
    assert len(copy.x) <= 280, f"X copy too long: {len(copy.x)} chars"
    assert "2026" in copy.x
    assert "#PROFileOS" in copy.x
    assert "Acme Sports" in copy.x
    assert "Acme Sports" in copy.instagram
    assert copy.expected_impressions > 0
    assert copy.expected_impressions <= MEDIA_NODE.total_reach
    assert "143,000" in copy.instagram, "IG copy must reference the 143K node"
    assert copy.arbitrage_verdict.startswith("$"), "verdict must be a dollar string"
    assert "ARBITRAGE VERDICT" in copy.instagram

    print(f"\n── X copy ({len(copy.x)} chars) ──────────────────────────")
    print(copy.x)
    print(f"\n── Instagram copy ─────────────────────────────────────────")
    print(copy.instagram)
    print(f"\n── Gate summary ───────────────────────────────────────────")
    print(f"  Gate 6  Culture Equity  : {copy.gate6_score:.1f}")
    print(f"  Gate 9  Public Gravity  : {copy.gate9_gravity:.2f} / 100")
    print(f"  Gate 12 Quant Variance  : {copy.gate12_variance:.2f}")
    print(f"  Gate 14 Arb Verdict     : {copy.arbitrage_verdict}")
    print(f"  Stability Premium       : {copy.stability_premium}")
    print(f"  Expected Impressions    : {copy.expected_impressions:,}")
    print(f"  Distribution Floor      : {MEDIA_NODE.total_reach:,}")
    print(f"\noutput_manager  OK")
    sys.exit(0)
