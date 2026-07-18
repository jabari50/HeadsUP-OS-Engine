"""
matchmaking_engine.py — The Virtual GM · 4-Dimension Fit Score Engine

Dimensions (weights sum to 1.0):
  1. System Fit   (25%) — position + style compatibility with program system
  2. Need Fit     (30%) — fills an actual roster gap
  3. Level Fit    (25%) — grad year + OVR caliber vs. program tier
  4. Cultural Fit (20%) — academic standing + off-court character signals

Each dimension scores 0–100.  Composite = weighted sum rounded to one decimal.
Recommendation thresholds:  PURSUE ≥ 72 · MONITOR 52–71 · PASS < 52
"""
from __future__ import annotations

import logging
import math
from typing import Optional

from models.data_models import FitRecommendation, FitScore

logger = logging.getLogger(__name__)

# ── Weights ───────────────────────────────────────────────────────────────────

_W = {
    "system":  0.25,
    "need":    0.30,
    "level":   0.25,
    "cultural":0.20,
}

# Recommendation thresholds
_PURSUE_MIN  = 72.0
_MONITOR_MIN = 52.0

# Basketball position families
_GUARD_POS   = {"PG", "SG", "G"}
_WING_POS    = {"SF", "SG", "G/F"}
_BIG_POS     = {"PF", "C", "F/C"}

# System → preferred positions
_SYSTEM_MAP: dict[str, list[str]] = {
    "dribble-drive motion":       ["PG", "SG", "SF"],
    "motion offense":             ["PG", "SF", "PF"],
    "princeton":                  ["PG", "SF", "PF"],
    "pace & space":               ["PG", "SG", "SF"],
    "4-out 1-in":                 ["PG", "SG", "SF"],
    "5-out":                      ["PG", "SG", "SF", "PF"],
    "post-heavy":                 ["PF", "C"],
    "princeton-action":           ["PF", "SF", "PG"],
    "default":                    ["PG", "SG", "SF", "PF", "C"],
}


def _system_key(s: Optional[str]) -> str:
    return (s or "").lower().strip() or "default"


# ── Dimension 1: System Fit ───────────────────────────────────────────────────

def _calc_system_fit(position: str, program_system: Optional[str]) -> tuple[float, list[str]]:
    """
    100 pts if position is in the system's preferred list.
    55 pts if same family (guard/wing/big).
    30 pts baseline for any player.
    """
    signals: list[str] = []
    preferred = _SYSTEM_MAP.get(_system_key(program_system), _SYSTEM_MAP["default"])

    if position in preferred:
        score = 100.0
        signals.append(f"{position} is a primary fit for {program_system or 'program system'}")
    else:
        # Family partial credit
        pos_fam  = (_GUARD_POS if position in _GUARD_POS
                    else _WING_POS if position in _WING_POS
                    else _BIG_POS)
        pref_fam = set()
        for p in preferred:
            pref_fam |= (_GUARD_POS if p in _GUARD_POS
                         else _WING_POS if p in _WING_POS
                         else _BIG_POS)
        if pos_fam & pref_fam:
            score = 55.0
            signals.append(f"{position} is a positional family match")
        else:
            score = 30.0
            signals.append(f"{position} is outside system preference — low system fit")

    return score, signals


# ── Dimension 2: Need Fit ─────────────────────────────────────────────────────

def _calc_need_fit(position: str, roster_positions: list[str]) -> tuple[float, list[str]]:
    """
    Score based on positional scarcity on the current roster.
    < 2 players at position → 100
    2 players → 65
    3 players → 45
    4+ players → 20
    Empty roster → 80 (still valuable, but unknown gaps)
    """
    signals: list[str] = []
    if not roster_positions:
        return 80.0, ["Roster context unavailable — moderate assumed need"]

    count_at_pos = sum(1 for p in roster_positions if p == position)
    if count_at_pos == 0:
        score = 100.0
        signals.append(f"No {position} on current roster — critical gap")
    elif count_at_pos == 1:
        score = 85.0
        signals.append(f"Only one {position} on roster — depth need confirmed")
    elif count_at_pos == 2:
        score = 65.0
        signals.append(f"Two {position}s on roster — moderate need")
    elif count_at_pos == 3:
        score = 45.0
        signals.append(f"Three {position}s on roster — limited need")
    else:
        score = 20.0
        signals.append(f"Position {position} is stacked — low roster need")

    return score, signals


# ── Dimension 3: Level Fit ────────────────────────────────────────────────────

def _calc_level_fit(grad_year: int, target_grad_year: Optional[int],
                    height_inches: Optional[int],
                    position: str) -> tuple[float, list[str]]:
    """
    Combines grad year alignment and physical profile vs. positional norms.
    """
    signals: list[str] = []
    score = 70.0   # baseline

    # Grad year proximity
    if target_grad_year is not None:
        diff = abs(grad_year - target_grad_year)
        if diff == 0:
            score += 20.0
            signals.append(f"Grad year {grad_year} exactly matches target")
        elif diff == 1:
            score += 10.0
            signals.append(f"Grad year within 1 year of target")
        elif diff == 2:
            score += 0.0
            signals.append(f"Grad year 2 years from target")
        else:
            score -= 15.0
            signals.append(f"Grad year gap of {diff} years — level mismatch risk")
    else:
        signals.append("No target grad year — year alignment unscored")

    # Height vs. positional norm
    norms: dict[str, tuple[int, int]] = {
        "PG": (71, 76), "SG": (74, 79), "SF": (77, 82),
        "PF": (80, 84), "C": (83, 90),
    }
    if height_inches and position in norms:
        lo, hi = norms[position]
        if lo <= height_inches <= hi:
            score += 10.0
            signals.append(f"Height {height_inches}\" is within {position} norm ({lo}\"–{hi}\")")
        elif height_inches < lo:
            delta = lo - height_inches
            score -= min(10.0, delta * 2.5)
            signals.append(f"Height {height_inches}\" is {delta}\" below {position} norm")
        else:
            delta = height_inches - hi
            score += min(5.0, delta * 1.5)
            signals.append(f"Height {height_inches}\" exceeds {position} norm — upside")

    score = max(0.0, min(100.0, score))
    return score, signals


# ── Dimension 4: Cultural Fit ─────────────────────────────────────────────────

def _calc_cultural_fit(gpa: Optional[float],
                       eligibility_status: str) -> tuple[float, list[str]]:
    """
    Academic standing and eligibility as a cultural-fit proxy.
    GPA ≥ 3.0 → strong floor; active eligibility → green flag.
    """
    signals: list[str] = []
    score = 50.0  # neutral baseline

    if gpa is not None:
        if gpa >= 3.5:
            score += 40.0
            signals.append(f"GPA {gpa:.2f} — academic strength, low eligibility risk")
        elif gpa >= 3.0:
            score += 28.0
            signals.append(f"GPA {gpa:.2f} — solid academic standing")
        elif gpa >= 2.5:
            score += 12.0
            signals.append(f"GPA {gpa:.2f} — borderline; monitor UIL eligibility")
        elif gpa >= 2.0:
            score -= 5.0
            signals.append(f"GPA {gpa:.2f} — below 2.5; eligibility watch flag")
        else:
            score -= 20.0
            signals.append(f"GPA {gpa:.2f} — below 2.0; high eligibility risk")
    else:
        signals.append("GPA not on file — cultural fit partially unscored")

    elig = eligibility_status.lower()
    if elig == "active":
        score += 10.0
        signals.append("Eligibility status: Active")
    elif elig == "transfer":
        score -= 5.0
        signals.append("Transfer eligibility — window and clearance required")
    elif elig in ("committed", "signed"):
        # Hard cap: a committed/signed player is unavailable — crush the score
        score = min(score, 35.0) - 5.0
        signals.append(f"Player is {elig} — not available for recruitment")
    elif elig == "pro":
        score = min(score, 10.0)
        signals.append("Player has turned professional — ineligible for HS/NCAA")

    score = max(0.0, min(100.0, score))
    return score, signals


# ── Composite ─────────────────────────────────────────────────────────────────

def calculate_fit_score(
    player_id:        str,
    operator_id:      str,
    position:         str,
    grad_year:        int,
    height_inches:    Optional[int]   = None,
    gpa:              Optional[float] = None,
    eligibility_status: str           = "active",
    roster_positions: list[str]       = (),
    program_system:   Optional[str]   = None,
    target_grad_year: Optional[int]   = None,
) -> FitScore:
    """
    Compute a 4-dimension FitScore for player vs. operator program context.
    All inputs are plain scalars — no DB access inside this function.
    """
    s_sys,  sig_sys  = _calc_system_fit(position, program_system)
    s_need, sig_need = _calc_need_fit(position, list(roster_positions))
    s_lvl,  sig_lvl  = _calc_level_fit(grad_year, target_grad_year, height_inches, position)
    s_cult, sig_cult = _calc_cultural_fit(gpa, eligibility_status)

    composite = (
        s_sys  * _W["system"] +
        s_need * _W["need"]   +
        s_lvl  * _W["level"]  +
        s_cult * _W["cultural"]
    )
    composite = round(composite, 1)

    if composite >= _PURSUE_MIN:
        rec = FitRecommendation.PURSUE.value
    elif composite >= _MONITOR_MIN:
        rec = FitRecommendation.MONITOR.value
    else:
        rec = FitRecommendation.PASS.value

    all_signals = sig_sys + sig_need + sig_lvl + sig_cult

    fit = FitScore(
        player_id       = player_id,
        operator_id     = operator_id,
        system_fit      = round(s_sys,  1),
        need_fit        = round(s_need, 1),
        level_fit       = round(s_lvl,  1),
        cultural_fit    = round(s_cult, 1),
        composite_score = composite,
        recommendation  = rec,
        signals         = all_signals,
    )
    logger.info(
        "FitScore computed: player=%s op=%s composite=%.1f rec=%s",
        player_id, operator_id, composite, rec,
    )
    return fit
