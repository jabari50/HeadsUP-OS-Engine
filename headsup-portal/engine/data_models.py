"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        HeadsUp OS — Core Data Models                                         ║
║        Shared dataclasses + canonical constants + Pydantic v2 intake models  ║
║        Unified Portal engine | constants ported verbatim from HU-OS v3.1.0   ║
╚══════════════════════════════════════════════════════════════════════════════╝

Gate 5: every score bounded, every enum whitelisted (Literal + extra="forbid"),
cross-field validators present. Missing data → None / "Unverified" — never
fabricated.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing_extensions import Literal

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

INTAKE_SOURCES = ["scout_manual", "combine_csv", "free_agents", "ner_anchor", "film_event"]

# Canonical cross-engine validation anchor (Mike Boone, uuid-0004-boone).
# Grounded in hu_os_arbitrage_engine.py / nda_hughes_neural_score.py at repo
# root. NOTE: the v1.0 handoff cited "81.82" — that figure appears nowhere in
# the codebase; these are the repo-canonical values.
BOONE_CANONICAL = {
    "athlete_id": "uuid-0004-boone",
    "pro_score": 82.30,
    "ner": 82.42,
    "ovr": 82.36,
}


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


# ═══════════════════════════════════════════════════════════════════════════
# Pydantic v2 intake models (Gate 5)
# ═══════════════════════════════════════════════════════════════════════════

class TechnicalScores(BaseModel):
    """The 7 technical skills, each 1-10. Unknown fields are rejected."""

    model_config = ConfigDict(extra="forbid")

    ball_handling: float = Field(ge=1, le=10)
    shooting: float = Field(ge=1, le=10)
    finishing: float = Field(ge=1, le=10)
    passing: float = Field(ge=1, le=10)
    defense: float = Field(ge=1, le=10)
    rebounding: float = Field(ge=1, le=10)
    athleticism: float = Field(ge=1, le=10)


class NeuralScores(BaseModel):
    """The 6 neural attributes, each 1-99. Unknown fields are rejected."""

    model_config = ConfigDict(extra="forbid")

    composure: float = Field(ge=1, le=99)
    coachability: float = Field(ge=1, le=99)
    iq: float = Field(ge=1, le=99)
    resilience: float = Field(ge=1, le=99)
    leadership: float = Field(ge=1, le=99)
    drive: float = Field(ge=1, le=99)


class AthleteIdentity(BaseModel):
    """Identity fields shared by every intake source."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    external_id: Optional[str] = Field(default=None, max_length=64)
    position: Literal["PG", "SG", "SF", "PF", "C"]
    classification: Literal["HS", "JUCO", "College", "Pro"]
    school: Optional[str] = Field(default=None, max_length=120)
    class_year: Optional[str] = Field(default=None, pattern=r"^\d{4}$")


class FullIntakePayload(AthleteIdentity):
    """Fully-scored intake (scout_manual, combine_csv rows).

    Cross-field rule: height_inches must agree with ft/in within half an inch.
    """

    height_ft: int = Field(ge=4, le=8)
    height_in: int = Field(ge=0, le=11)
    height_inches: float = Field(ge=48, le=95)
    weight_lb: Optional[float] = Field(default=None, ge=80, le=400)
    wingspan_in: Optional[float] = Field(default=None, ge=48, le=110)
    physical_score: float = Field(ge=1, le=99)
    technical: TechnicalScores
    neural: NeuralScores

    @model_validator(mode="after")
    def validate_height_derived(self):
        expected = (self.height_ft * 12) + self.height_in
        if abs(self.height_inches - expected) > 0.5:
            raise ValueError("height_inches inconsistent with ft/in")
        return self


class ProvisionalIntakePayload(AthleteIdentity):
    """Athlete self-enroll (free_agents): identity only, NO scores.

    The athlete lands Locked and unscored (ovr stays NULL) until a verified
    scoring source provides real inputs — scores are never fabricated.
    """

    height_ft: Optional[int] = Field(default=None, ge=4, le=8)
    height_in: Optional[int] = Field(default=None, ge=0, le=11)
    weight_lb: Optional[float] = Field(default=None, ge=80, le=400)


class NerAnchorPayload(BaseModel):
    """Coach-portal NER anchor responses (ner_anchor source).

    Responses are enum-coded anchors, whitelisted per attribute. The numeric
    calibration of anchors lives in pipeline.NER_ANCHOR_SCALE.
    """

    model_config = ConfigDict(extra="forbid")

    athlete: AthleteIdentity
    responses: Dict[str, str]   # attribute -> anchor code; validated in pipeline


class FilmEventPayload(BaseModel):
    """Film-tagged events (film_event source). Tags are whitelisted; counts
    surface as observations for scout review — they are never auto-converted
    into technical scores (Zero Hallucination)."""

    model_config = ConfigDict(extra="forbid")

    athlete: AthleteIdentity
    events: List[Dict] = Field(min_length=1)


class ScoreRequest(BaseModel):
    """Direct scoring request (already-validated inputs)."""

    model_config = ConfigDict(extra="forbid")

    technical: TechnicalScores
    neural: NeuralScores
    physical_score: float = Field(ge=1, le=99)


class MatchmakeRequest(BaseModel):
    """VGM fit computation. Subscores (0-100) are derived deterministically by
    the decision layer; the engine owns the locked weighted combination."""

    model_config = ConfigDict(extra="forbid")

    style_fit: float = Field(ge=0, le=100)
    need_fit: float = Field(ge=0, le=100)
    level_fit: float = Field(ge=0, le=100)
    cultural_fit: float = Field(ge=0, le=100)
