"""
HU-OS · HeadsUp MEDIA Node
Single source of truth for the distribution network constants and the
Public_Gravity_Score engine that gates Blind Arbitrage drops (Gate 9).

Gate 9 — Public Gravity:
  Measures an athlete's public market weight against the 143K distribution
  floor. Facebook and Instagram are the primary drivers. Score of 100 means
  the athlete's combined organic reach fully saturates the node.

Constants are locked here; override via env vars in Render dashboard.

Import via: from storage.media_node import MEDIA_NODE, public_gravity_score, gate9_pass, expected_impressions
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")

log = logging.getLogger(__name__)

# ── HeadsUp MEDIA Node constants ──────────────────────────────────────────────
TOTAL_REACH: int = int(os.getenv("HU_MEDIA_TOTAL_REACH", "143000"))

# Platform weights for Public_Gravity_Score — Facebook + Instagram are primary.
# Instagram skews younger/basketball-native; Facebook reaches parents + partners.
FB_WEIGHT: float = float(os.getenv("HU_MEDIA_FB_WEIGHT", "0.45"))
IG_WEIGHT: float = float(os.getenv("HU_MEDIA_IG_WEIGHT", "0.55"))

# Organic reach rates: % of followers who see any given post (industry baseline)
IG_ORGANIC_RATE: float = float(os.getenv("HU_MEDIA_IG_ORGANIC_RATE", "0.18"))
FB_ORGANIC_RATE: float = float(os.getenv("HU_MEDIA_FB_ORGANIC_RATE", "0.07"))

# If no platform breakdown is available, split social_following by this ratio
IG_SPLIT: float = float(os.getenv("HU_MEDIA_IG_SPLIT", "0.60"))
FB_SPLIT: float = float(os.getenv("HU_MEDIA_FB_SPLIT", "0.40"))

# Gate 9 — minimum Public_Gravity_Score to clear (0–100 scale)
GATE9_THRESHOLD: float = float(os.getenv("GATE9_THRESHOLD", "35.0"))


@dataclass(frozen=True)
class MediaNode:
    total_reach: int
    fb_weight: float
    ig_weight: float
    ig_organic_rate: float
    fb_organic_rate: float
    gate9_threshold: float


MEDIA_NODE = MediaNode(
    total_reach=TOTAL_REACH,
    fb_weight=FB_WEIGHT,
    ig_weight=IG_WEIGHT,
    ig_organic_rate=IG_ORGANIC_RATE,
    fb_organic_rate=FB_ORGANIC_RATE,
    gate9_threshold=GATE9_THRESHOLD,
)


# ── Platform reach resolver ───────────────────────────────────────────────────

def _resolve_platform_reach(athlete: dict) -> tuple[float, float]:
    """
    Returns (instagram_reach, facebook_reach) from the athlete dict.
    Resolution order:
      1. Explicit platform fields (instagram_reach / facebook_reach)
      2. neck_down_metrics JSONB sub-keys
      3. 60/40 split of social_following
      4. (0, 0) — ZHR: never invented
    """
    def _f(v: object) -> Optional[float]:
        try:
            return float(v) if v is not None else None  # type: ignore[arg-type]
        except (ValueError, TypeError):
            return None

    # 1. Top-level explicit fields
    ig = _f(athlete.get("instagram_reach") or athlete.get("ig_reach"))
    fb = _f(athlete.get("facebook_reach") or athlete.get("fb_reach"))
    if ig is not None and fb is not None:
        return ig, fb

    # 2. neck_down_metrics JSONB
    ndm = athlete.get("neck_down_metrics") or {}
    ig_ndm = _f(ndm.get("instagram_reach") or ndm.get("ig_reach"))
    fb_ndm = _f(ndm.get("facebook_reach") or ndm.get("fb_reach"))
    if ig_ndm is not None and fb_ndm is not None:
        return ig_ndm, fb_ndm

    # 3. Split social_following
    following = _f(athlete.get("social_following") or ndm.get("social_following"))
    if following is not None and following > 0:
        ig_est = following * IG_SPLIT
        fb_est = following * FB_SPLIT
        log.debug(
            "media_node: no platform breakdown — splitting social_following=%.0f → ig=%.0f fb=%.0f",
            following, ig_est, fb_est,
        )
        return ig_est, fb_est

    # 4. ZHR fallback
    log.debug("media_node: no reach data available for athlete %s", str(athlete.get("id", ""))[:8])
    return 0.0, 0.0


# ── Core scoring functions ────────────────────────────────────────────────────

def public_gravity_score(athlete: dict) -> float:
    """
    Returns Public_Gravity_Score (0–100).
    Facebook and Instagram are the primary drivers, weighted against the
    143K distribution floor. Score of 100 = athlete reach saturates the node.

    ZHR: returns 0.0 when no reach data is available.
    """
    ig_reach, fb_reach = _resolve_platform_reach(athlete)

    if ig_reach == 0.0 and fb_reach == 0.0:
        return 0.0

    # Each platform contributes proportionally to TOTAL_REACH, scaled by weight
    ig_contribution = (ig_reach / TOTAL_REACH) * IG_WEIGHT * 100
    fb_contribution = (fb_reach / TOTAL_REACH) * FB_WEIGHT * 100

    score = ig_contribution + fb_contribution
    clamped = min(100.0, round(score, 2))

    log.debug(
        "public_gravity_score: ig=%.0f (→%.2f) fb=%.0f (→%.2f) total=%.2f",
        ig_reach, ig_contribution, fb_reach, fb_contribution, clamped,
    )
    return clamped


def gate9_pass(athlete: dict) -> bool:
    """Returns True when the athlete clears Gate 9 (Public Gravity)."""
    score = public_gravity_score(athlete)
    passed = score >= GATE9_THRESHOLD
    log.info(
        "Gate 9 — Public Gravity: score=%.2f threshold=%.1f pass=%s athlete=%s",
        score, GATE9_THRESHOLD, passed, str(athlete.get("id", ""))[:8],
    )
    return passed


def expected_impressions(athlete: dict) -> int:
    """
    Calculates Expected Impressions from a Blind Arbitrage drop distributed
    across the 143K node.

    Formula:
      ig_impressions = ig_reach × IG_ORGANIC_RATE  (18% organic)
      fb_impressions = fb_reach × FB_ORGANIC_RATE  (7% organic)
      expected       = min(ig_impressions + fb_impressions, TOTAL_REACH)

    Capped at TOTAL_REACH — the node cannot amplify beyond its own distribution.
    ZHR: returns 0 when no reach data is available.
    """
    ig_reach, fb_reach = _resolve_platform_reach(athlete)

    ig_imp = ig_reach * IG_ORGANIC_RATE
    fb_imp = fb_reach * FB_ORGANIC_RATE
    total  = int(min(ig_imp + fb_imp, TOTAL_REACH))

    log.debug(
        "expected_impressions: ig_imp=%.0f fb_imp=%.0f total=%d (floor=%d)",
        ig_imp, fb_imp, total, TOTAL_REACH,
    )
    return total


# ── Import check ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")

    assert MEDIA_NODE.total_reach == 143_000, "TOTAL_REACH must be 143,000"
    assert MEDIA_NODE.fb_weight + MEDIA_NODE.ig_weight == 1.0, "weights must sum to 1.0"

    # Athlete with explicit platform breakdown
    athlete_explicit = {
        "id": "test-001",
        "instagram_reach": 85_000,
        "facebook_reach": 58_000,
    }
    score = public_gravity_score(athlete_explicit)
    impr  = expected_impressions(athlete_explicit)
    assert score > 0, "score should be positive"
    assert impr > 0, "impressions should be positive"
    assert impr <= TOTAL_REACH, "impressions cannot exceed distribution floor"
    assert gate9_pass(athlete_explicit), "high-reach athlete should clear Gate 9"

    # Athlete via social_following split
    athlete_split = {"id": "test-002", "social_following": 50_000}
    score2 = public_gravity_score(athlete_split)
    impr2  = expected_impressions(athlete_split)
    assert 0 < score2 <= 100
    assert 0 < impr2 <= TOTAL_REACH

    # Zero reach — ZHR
    athlete_zero = {"id": "test-003"}
    assert public_gravity_score(athlete_zero) == 0.0
    assert expected_impressions(athlete_zero) == 0
    assert not gate9_pass(athlete_zero)

    print(f"\nHEADSUP MEDIA NODE — total_reach={MEDIA_NODE.total_reach:,}")
    print(f"  FB weight={MEDIA_NODE.fb_weight}  IG weight={MEDIA_NODE.ig_weight}")
    print(f"  Gate 9 threshold={MEDIA_NODE.gate9_threshold}")
    print(f"\nExplicit breakdown (ig=85K fb=58K):")
    print(f"  Public_Gravity_Score : {score:.2f}")
    print(f"  Expected Impressions : {impr:,}")
    print(f"  Gate 9 pass          : {gate9_pass(athlete_explicit)}")
    print(f"\nSocial following split (50K → ig=30K fb=20K):")
    print(f"  Public_Gravity_Score : {score2:.2f}")
    print(f"  Expected Impressions : {impr2:,}")
    print(f"\nstorage.media_node  OK")
    sys.exit(0)
