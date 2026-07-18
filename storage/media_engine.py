"""
HU-OS · HeadsUp MEDIA Engine
Reach velocity and CPM-based media equity calculations.

Distinct from media_node.py (143K direct distribution):
  media_node.py   — 143K owned channel reach, drives Gate 9 Public Gravity
  media_engine.py — 5M monthly impression engine, drives Gate 14 valuation

Constants are env-overridable for Q3 Seed Round audit documentation.

Import via: from storage.media_engine import REACH_VELOCITY, BASE_CPM, calculate_media_equity
"""
from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")

log = logging.getLogger(__name__)

# ── Engine constants ──────────────────────────────────────────────────────────
# Monthly impression baseline for the full HeadsUp MEDIA distribution network.
REACH_VELOCITY: int = int(os.getenv("HU_REACH_VELOCITY", "5000000"))

# Industry-standard CPM for high-engagement sports media content.
BASE_CPM: float = float(os.getenv("HU_BASE_CPM", "15.00"))

# OVR score that maps to a neutral (1.0x) valuation modifier.
OVR_NEUTRAL: float = float(os.getenv("HU_OVR_NEUTRAL", "80.0"))


# ── Core function ─────────────────────────────────────────────────────────────

def calculate_media_equity(impressions: int, cpm: float = BASE_CPM) -> float:
    """
    Returns the dollar-value media equity for a given impression count.

    Formula: (impressions / 1_000) × cpm

    Args:
        impressions: Raw impression count (e.g. REACH_VELOCITY or athlete slice).
        cpm:         Cost Per Mille — defaults to BASE_CPM ($15.00).

    Returns:
        Float dollar value. $0.00 for zero or negative impressions.
    """
    if impressions <= 0:
        return 0.0
    equity = (impressions / 1_000) * cpm
    log.debug("calculate_media_equity: %d impressions × $%.2f CPM = $%.2f", impressions, cpm, equity)
    return round(equity, 2)


# ── Convenience: full-velocity baseline ──────────────────────────────────────

def baseline_media_equity(cpm: float = BASE_CPM) -> float:
    """Media equity for the full 5M monthly reach at the given CPM."""
    return calculate_media_equity(REACH_VELOCITY, cpm)


# ── Import check ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")

    assert REACH_VELOCITY == 5_000_000, f"REACH_VELOCITY must be 5,000,000 — got {REACH_VELOCITY}"
    assert BASE_CPM == 15.00, f"BASE_CPM must be $15.00 — got {BASE_CPM}"

    full = baseline_media_equity()
    assert full == 75_000.00, f"5M × $15 CPM should equal $75,000 — got {full}"

    half = calculate_media_equity(2_500_000)
    assert half == 37_500.00

    print(f"REACH_VELOCITY     : {REACH_VELOCITY:,}")
    print(f"BASE_CPM           : ${BASE_CPM:.2f}")
    print(f"Full baseline      : ${full:,.2f}")
    print(f"Half baseline      : ${half:,.2f}")
    print("storage.media_engine  OK")
    sys.exit(0)
