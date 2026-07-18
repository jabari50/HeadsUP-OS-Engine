"""
HU-OS · Valuation Engine — Gate 14
Produces dollar-value NIL leverage estimates and the final Arbitrage Verdict
for every athlete who clears Gates 6, 9, and 12.

Gate 14 — Valuation:
  Applies the 5M REACH_VELOCITY baseline and $15.00 CPM to the athlete's
  Public_Gravity_Score, then adjusts for OVR performance. Athletes who have
  completed Phase 2 (Neural Audit) receive a 1.25× Stability Premium.
  Minimum Arbitrage Verdict to clear Gate 14: $25,000 (GATE14_FLOOR).

Key formula:
  impression_allocation = REACH_VELOCITY × max(0.10, gravity_score / 100)
  ovr_modifier          = 0.70 + (ovr / 100) × 0.60        [range 0.70×–1.30×]
  market_entry_est      = (impression_allocation / 1,000) × BASE_CPM × ovr_modifier
  arbitrage_verdict     = market_entry_est × 1.25  (if neural_audit_cleared)
                        = market_entry_est           (otherwise)

ZHR: all inputs validated — None scores use neutral defaults with a logged warning.

Import via: from valuation_engine import calculate_nil_leverage, ValuationResult
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

from storage.media_engine import BASE_CPM, REACH_VELOCITY, calculate_media_equity
from storage.media_node import MEDIA_NODE, public_gravity_score

_ROOT = Path(__file__).resolve().parent
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")

log = logging.getLogger(__name__)

# ── Gate 14 constants ─────────────────────────────────────────────────────────
STABILITY_PREMIUM: float = float(os.getenv("HU_STABILITY_PREMIUM", "1.25"))
GATE14_FLOOR:      float = float(os.getenv("HU_GATE14_FLOOR", "25000.00"))

# OVR modifier bounds — keeps valuation sane at score extremes
_OVR_BASE:  float = 0.70
_OVR_RANGE: float = 0.60   # 0.70 + 0.60 = 1.30 at OVR 100


# ── Result dataclass ──────────────────────────────────────────────────────────

@dataclass
class ValuationResult:
    # Inputs
    gravity_score:          float          # Public_Gravity_Score (0–100)
    ovr:                    Optional[float]
    neural_audit_cleared:   bool

    # Calculation breakdown
    impression_allocation:  int            # athlete's slice of the 5M pool
    ovr_modifier:           float          # 0.70×–1.30×
    market_entry_est:       float          # pre-premium dollar value
    stability_premium_applied: bool
    stability_multiplier:   float          # 1.25 or 1.00

    # Gate 14 output
    arbitrage_verdict:      float          # final dollar Arbitrage Verdict
    gate14_pass:            bool           # verdict >= GATE14_FLOOR
    formatted_verdict:      str            # "$46,050.00"
    formatted_entry:        str            # "$36,840.00"

    # Metadata
    reach_velocity:         int            # 5,000,000
    base_cpm:               float          # $15.00
    calculated_at:          str


# ── Core function ─────────────────────────────────────────────────────────────

def calculate_nil_leverage(
    athlete: dict,
    neural_audit_cleared: Optional[bool] = None,
) -> ValuationResult:
    """
    Calculates the NIL leverage valuation for an athlete and returns a
    structured ValuationResult with the full Arbitrage Verdict.

    Args:
        athlete:              DB row or audit snapshot dict.
        neural_audit_cleared: Override; if None, inferred from athlete data
                              (True when ovr, neck_up_pro_score, and neck_up_ner
                              are all populated — Phase 2 complete).

    Returns:
        ValuationResult with market_entry_est, arbitrage_verdict, gate14_pass.
    """
    # ── Resolve neural audit status ───────────────────────────────────────────
    if neural_audit_cleared is None:
        neural_audit_cleared = _infer_neural_audit(athlete)

    # ── Gravity score (Gate 9 driver) ─────────────────────────────────────────
    gravity = public_gravity_score(athlete)

    # ── OVR modifier ──────────────────────────────────────────────────────────
    ovr = _safe_float(athlete.get("ovr") or athlete.get("pro_score") or athlete.get("neck_up_pro_score"))
    if ovr is not None:
        ovr_modifier = round(_OVR_BASE + (ovr / 100.0) * _OVR_RANGE, 4)
    else:
        ovr_modifier = 1.00
        log.warning(
            "calculate_nil_leverage: OVR missing for athlete=%s — using neutral 1.0× modifier",
            str(athlete.get("id", ""))[:8],
        )

    # ── Impression allocation ─────────────────────────────────────────────────
    # Athlete's proportional share of the 5M pool, floored at 10%
    gravity_factor        = max(0.10, gravity / 100.0)
    impression_allocation = int(REACH_VELOCITY * gravity_factor)

    # ── Market Entry Estimate ─────────────────────────────────────────────────
    base_equity      = calculate_media_equity(impression_allocation)
    market_entry_est = round(base_equity * ovr_modifier, 2)

    # ── Stability Premium (Neural Audit Phase 2) ──────────────────────────────
    if neural_audit_cleared:
        multiplier        = STABILITY_PREMIUM
        arbitrage_verdict = round(market_entry_est * multiplier, 2)
    else:
        multiplier        = 1.00
        arbitrage_verdict = market_entry_est

    gate14_pass = arbitrage_verdict >= GATE14_FLOOR

    log.info(
        "Gate 14 — Valuation: athlete=%s gravity=%.2f ovr_mod=%.2f "
        "entry=$%.2f premium=%s verdict=$%.2f gate14=%s",
        str(athlete.get("id", ""))[:8],
        gravity, ovr_modifier,
        market_entry_est,
        f"{multiplier:.2f}×" if neural_audit_cleared else "none",
        arbitrage_verdict,
        "PASS" if gate14_pass else "FAIL",
    )

    return ValuationResult(
        gravity_score=gravity,
        ovr=ovr,
        neural_audit_cleared=neural_audit_cleared,
        impression_allocation=impression_allocation,
        ovr_modifier=ovr_modifier,
        market_entry_est=market_entry_est,
        stability_premium_applied=neural_audit_cleared,
        stability_multiplier=multiplier,
        arbitrage_verdict=arbitrage_verdict,
        gate14_pass=gate14_pass,
        formatted_verdict=f"${arbitrage_verdict:,.2f}",
        formatted_entry=f"${market_entry_est:,.2f}",
        reach_velocity=REACH_VELOCITY,
        base_cpm=BASE_CPM,
        calculated_at=datetime.now(timezone.utc).isoformat(),
    )


def format_arbitrage_verdict(result: ValuationResult) -> str:
    """
    Returns a single-line Arbitrage Verdict string for dashboard display.
    Example: '$57,562.50 ✦ STABILITY PREMIUM APPLIED | Gate 14: PASS'
    """
    premium_tag = " ✦ STABILITY PREMIUM APPLIED" if result.stability_premium_applied else ""
    gate_tag    = "PASS" if result.gate14_pass else "FAIL"
    return f"{result.formatted_verdict}{premium_tag} | Gate 14: {gate_tag}"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _infer_neural_audit(athlete: dict) -> bool:
    """Phase 2 complete when OVR, PRO-Score, and NER are all populated."""
    return all(
        _safe_float(athlete.get(f)) is not None
        for f in ("ovr", "neck_up_pro_score", "neck_up_ner")
    )


def _safe_float(val: object) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(val)  # type: ignore[arg-type]
    except (ValueError, TypeError):
        return None


# ── Import / smoke check ──────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")

    # ── Baseline sanity check ─────────────────────────────────────────────────
    assert REACH_VELOCITY == 5_000_000
    assert BASE_CPM       == 15.00
    assert STABILITY_PREMIUM == 1.25

    # ── Athlete: neural audit cleared, high gravity, strong OVR ──────────────
    elite = {
        "id": "test-elite",
        "ovr": 88.2,
        "neck_up_pro_score": 82.3,
        "neck_up_ner": 82.4,
        "instagram_reach": 62_000,
        "facebook_reach": 41_000,
    }
    r = calculate_nil_leverage(elite)
    assert r.neural_audit_cleared, "should infer Phase 2 from populated scores"
    assert r.stability_premium_applied
    assert r.gate14_pass, "elite athlete should clear Gate 14"
    assert r.arbitrage_verdict > r.market_entry_est, "verdict must exceed entry after premium"

    # ── Athlete: no neural audit, low gravity ─────────────────────────────────
    developing = {
        "id": "test-dev",
        "ovr": 71.0,
        "social_following": 8_000,
    }
    r2 = calculate_nil_leverage(developing)
    assert not r2.neural_audit_cleared   # no neck_up_pro_score / neck_up_ner
    assert not r2.stability_premium_applied
    assert r2.stability_multiplier == 1.00

    # ── Manual override: force neural_audit_cleared=True ─────────────────────
    r3 = calculate_nil_leverage(developing, neural_audit_cleared=True)
    assert r3.stability_premium_applied
    assert r3.arbitrage_verdict == round(r2.arbitrage_verdict * 1.25, 2)

    # ── Formatted output ──────────────────────────────────────────────────────
    print(f"\n── Elite Athlete ───────────────────────────────────────────")
    print(f"  Gravity Score         : {r.gravity_score:.2f} / 100")
    print(f"  OVR Modifier          : {r.ovr_modifier:.2f}×")
    print(f"  Impression Allocation : {r.impression_allocation:,} / {REACH_VELOCITY:,}")
    print(f"  Market Entry Estimate : {r.formatted_entry}")
    print(f"  Stability Premium     : {r.stability_multiplier:.2f}×")
    print(f"  Arbitrage Verdict     : {r.formatted_verdict}")
    print(f"  Gate 14               : {'PASS' if r.gate14_pass else 'FAIL'}")
    print(f"  Dashboard line        : {format_arbitrage_verdict(r)}")
    print(f"\n── Developing Athlete ──────────────────────────────────────")
    print(f"  Gravity Score         : {r2.gravity_score:.2f} / 100")
    print(f"  Market Entry Estimate : {r2.formatted_entry}")
    print(f"  Arbitrage Verdict     : {r2.formatted_verdict}")
    print(f"  Gate 14               : {'PASS' if r2.gate14_pass else 'FAIL'}")
    print(f"\nvaluation_engine  OK")
    sys.exit(0)
