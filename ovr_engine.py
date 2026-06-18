"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        HeadsUp OS — OVR Engine                                               ║
║        Composite rating: technical 45% · neural 35% · physical 20%           ║
║        HeadsUp OS v3.1.0 | Render Deployment Target                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import numpy as np

TECHNICAL_WEIGHT = 0.45
NEURAL_WEIGHT = 0.35
PHYSICAL_WEIGHT = 0.20

SCALE_MIN = 1.0
SCALE_MAX = 99.0

TIER_THRESHOLDS = [
    (85.0, "Elite"),
    (70.0, "Impact"),
    (55.0, "Contributor"),
    (40.0, "Developing"),
]
FLOOR_TIER = "Prospect"


def convert_technical_to_99(score_1_to_10: float) -> float:
    """Convert a 1-10 technical score onto the 1-99 OVR scale.

    Args:
        score_1_to_10: Raw technical skill score (1-10).

    Returns:
        Equivalent score on the 1-99 scale.
    """
    return ((score_1_to_10 - 1) / 9) * 98 + 1


def get_tier(ovr: float) -> str:
    """Map an OVR score to its progression tier.

    Args:
        ovr: Overall rating (1-99).

    Returns:
        Tier name: Elite, Impact, Contributor, Developing, or Prospect.
    """
    for threshold, tier in TIER_THRESHOLDS:
        if ovr >= threshold:
            return tier
    return FLOOR_TIER


def next_tier_target(ovr: float) -> tuple:
    """Find the next tier above the current OVR and its entry threshold.

    Args:
        ovr: Overall rating (1-99).

    Returns:
        (tier_name, threshold) for the next tier, or (None, None) if already Elite.
    """
    for threshold, tier in reversed(TIER_THRESHOLDS):
        if ovr < threshold:
            return tier, threshold
    return None, None


def calculate_ovr(technical_scores: dict, neural_scores: dict, physical_score: float) -> dict:
    """Calculate HeadsUp OS Overall Rating (OVR) for a player.

    Args:
        technical_scores: dict of 7 technical skills, each scored 1-10.
        neural_scores: dict of 6 neural attributes, each scored 1-99.
        physical_score: single 1-99 physical assessment score.

    Returns:
        dict with ovr, tier, and component breakdowns.
    """
    technical_converted = {k: convert_technical_to_99(v) for k, v in technical_scores.items()}
    technical_avg = float(np.mean(list(technical_converted.values())))
    neural_avg = float(np.mean(list(neural_scores.values())))

    ovr = (
        technical_avg * TECHNICAL_WEIGHT
        + neural_avg * NEURAL_WEIGHT
        + physical_score * PHYSICAL_WEIGHT
    )
    ovr = round(min(SCALE_MAX, max(SCALE_MIN, ovr)), 1)

    return {
        "ovr": ovr,
        "tier": get_tier(ovr),
        "technical_avg": round(technical_avg, 1),
        "neural_avg": round(neural_avg, 1),
        "physical_score": physical_score,
        "technical_converted": {k: round(v, 1) for k, v in technical_converted.items()},
        "breakdown": {
            "technical_contribution": round(technical_avg * TECHNICAL_WEIGHT, 1),
            "neural_contribution": round(neural_avg * NEURAL_WEIGHT, 1),
            "physical_contribution": round(physical_score * PHYSICAL_WEIGHT, 1),
        },
    }
