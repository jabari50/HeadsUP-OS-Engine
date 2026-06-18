"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        HeadsUp OS — Core Data Models                                         ║
║        Shared dataclasses + canonical attribute constants                    ║
║        HeadsUp OS v3.1.0 | Render Deployment Target                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

NEURAL_ATTRIBUTES = [
    "composure",      # Behavior under pressure
    "coachability",   # Response to coaching
    "iq",             # Cognitive processing / pattern recognition
    "resilience",     # Recovery from adversity
    "leadership",     # Influence on teammates
    "drive",          # Effort consistency
]

TECHNICAL_SKILLS = [
    "ball_handling",
    "shooting",
    "finishing",
    "passing",
    "defense",
    "rebounding",
    "athleticism",
]

POSITIONS = ["PG", "SG", "SF", "PF", "C"]

CLASSIFICATIONS = ["HS", "JUCO", "College", "Pro"]


@dataclass
class Badge:
    """A single earned achievement on an athlete profile."""

    badge_id: str
    name: str
    category: str           # performance | character | milestone | quest
    description: str
    criteria: dict          # the rule that triggered this badge
    awarded_at: datetime
    icon: str               # emoji or asset key


@dataclass
class Quest:
    """An arc-based development goal tracked against live attribute data."""

    quest_id: str
    title: str
    description: str
    target_attribute: str       # dotted path into the player data dict
    target_value: float
    current_value: float
    status: str                 # active | completed | failed
    deadline: Optional[datetime] = None
    reward_badge_id: Optional[str] = None
    progress_pct: float = 0.0


def get_nested(data: dict, dotted_path: str) -> Optional[float]:
    """Resolve a dotted path like 'neural.composure' inside a nested dict.

    Args:
        data: Nested player data dict.
        dotted_path: Dot-separated key path.

    Returns:
        The value at the path, or None if any segment is missing.
    """
    node = data
    for key in dotted_path.split("."):
        if not isinstance(node, dict) or key not in node:
            return None
        node = node[key]
    return node
