"""
data_models.py — The Virtual GM · PRO-File OS Operator Layer
All Pydantic v2 models and enums for players, operators, fit scores, RIBs,
and activation locks.  No secrets or hardcoded keys anywhere in this file.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Helpers ────────────────────────────────────────────────────────────────────

def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return str(uuid.uuid4())


def _new_license_key() -> str:
    return str(uuid.uuid4()).replace("-", "").upper()[:24]


# ── Enums ──────────────────────────────────────────────────────────────────────

class LicenseTier(str, Enum):
    SOLO  = "solo"    # 5 unlocks · no RIB
    PRO   = "pro"     # 15 unlocks · weekly RIB
    ELITE = "elite"   # 50 unlocks · daily RIB + matchmaking
    GM    = "gm"      # unlimited · all features


TIER_UNLOCK_LIMITS: dict[str, int] = {
    LicenseTier.SOLO:  5,
    LicenseTier.PRO:   15,
    LicenseTier.ELITE: 50,
    LicenseTier.GM:    9_999,
}


class ActivationStatus(str, Enum):
    LOCKED    = "locked"     # name + grad year only
    PREVIEW   = "preview"    # stats + school visible · no direct contact
    FULL      = "full"       # full profile + coach contact  ← master approval required
    EXCLUSIVE = "exclusive"  # program exclusivity lock      ← master approval required


class SessionState(str, Enum):
    ACTIVE    = "active"     # days 0–5  · full read/write
    READ_ONLY = "read_only"  # days 5–7  · read only
    LOCKED    = "locked"     # > 7 days  · token must be reissued


class EligibilityStatus(str, Enum):
    ACTIVE    = "active"
    COMMITTED = "committed"
    SIGNED    = "signed"
    TRANSFER  = "transfer"
    PRO       = "pro"


class SyncStatus(str, Enum):
    PENDING          = "pending"
    SYNCED           = "synced"
    REJECTED_MASTER  = "rejected_by_master"
    FAILED           = "failed"


class FitRecommendation(str, Enum):
    PURSUE  = "PURSUE"
    MONITOR = "MONITOR"
    PASS    = "PASS"


# ── PlayerProfile ──────────────────────────────────────────────────────────────

class PlayerProfile(BaseModel):
    player_id:          str            = Field(default_factory=_new_id)
    full_name:          str
    position:           str            # PG | SG | SF | PF | C
    grad_year:          int
    high_school:        Optional[str]  = None
    aau_program:        Optional[str]  = None
    height_inches:      Optional[int]  = None
    weight_lbs:         Optional[int]  = None
    wingspan_inches:    Optional[int]  = None
    gpa:                Optional[float]= None
    eligibility_status: str            = EligibilityStatus.ACTIVE.value
    committed_college:  Optional[str]  = None
    ncaa_id:            Optional[str]  = None
    data_source:        str            = "manual"
    activation_status:  str            = ActivationStatus.LOCKED.value
    pro_file_os_id:     Optional[str]  = None
    sync_status:        str            = SyncStatus.PENDING.value
    ingestion_date:     str            = Field(default_factory=_now_utc)
    last_modified:      str            = Field(default_factory=_now_utc)


# ── OperatorLicense ────────────────────────────────────────────────────────────

class OperatorLicense(BaseModel):
    operator_id:         str           = Field(default_factory=_new_id)
    operator_name:       str
    email:               str
    license_tier:        str           = LicenseTier.SOLO.value
    license_key:         str           = Field(default_factory=_new_license_key)
    program_name:        Optional[str] = None
    program_city:        Optional[str] = None
    program_state:       Optional[str] = None
    unlock_credits_used: int           = 0
    max_unlocks:         int           = TIER_UNLOCK_LIMITS[LicenseTier.SOLO]
    session_token:       Optional[str] = None
    token_issued_at:     Optional[str] = None
    token_expires_at:    Optional[str] = None
    session_state:       str           = SessionState.LOCKED.value
    approved_by_master:  bool          = False
    created_at:          str           = Field(default_factory=_now_utc)
    last_login:          Optional[str] = None


# ── FitScore ───────────────────────────────────────────────────────────────────

class FitScore(BaseModel):
    score_id:        str        = Field(default_factory=_new_id)
    player_id:       str
    operator_id:     str
    system_fit:      float      # style / system match       (0–100)
    need_fit:        float      # roster gap fill             (0–100)
    level_fit:       float      # competitive level alignment (0–100)
    cultural_fit:    float      # off-court / academic        (0–100)
    composite_score: float      # weighted aggregate          (0–100)
    recommendation:  str        = FitRecommendation.MONITOR.value
    signals:         list[str]  = Field(default_factory=list)
    computed_at:     str        = Field(default_factory=_now_utc)


# ── ActivationLock ─────────────────────────────────────────────────────────────

class ActivationLock(BaseModel):
    lock_id:                  str           = Field(default_factory=_new_id)
    player_id:                str
    operator_id:              str
    requested_status:         str           # full | exclusive
    current_status:           str           = ActivationStatus.LOCKED.value
    requires_master_approval: bool          = True
    approved:                 bool          = False
    approved_by:              Optional[str] = None
    approved_at:              Optional[str] = None
    requested_at:             str           = Field(default_factory=_now_utc)
    notes:                    Optional[str] = None


# ── RIB sub-models ─────────────────────────────────────────────────────────────

class RIBEligibilityAlert(BaseModel):
    player_id:   str
    player_name: str
    position:    str
    grade:       Optional[float] = None
    subject:     Optional[str]  = None
    teacher:     Optional[str]  = None
    priority:    str            = "MED"    # HIGH | MED | LOW
    status:      str                       # INELIGIBLE | WARNING | PENDING


class RIBGradeMove(BaseModel):
    player_name: str
    subject:     str
    from_grade:  Optional[float] = None
    to_grade:    Optional[float] = None
    direction:   str            = "flat"   # up | down | flat
    note:        Optional[str]  = None


class RIBAction(BaseModel):
    priority: str  # HIGH | MED | LOW
    title:    str
    detail:   str


# ── RIB (Roster Intelligence Brief) ───────────────────────────────────────────

class RIB(BaseModel):
    rib_id:              str                    = Field(default_factory=_new_id)
    operator_id:         str
    week_label:          str
    generated_at:        str                    = Field(default_factory=_now_utc)
    roster_count:        int                    = 0
    eligible_count:      int                    = 0
    ineligible_count:    int                    = 0
    watch_count:         int                    = 0
    team_gpa:            Optional[float]        = None
    eligibility_alerts:  list[RIBEligibilityAlert] = Field(default_factory=list)
    grade_moves:         list[RIBGradeMove]     = Field(default_factory=list)
    sync_events:         list[str]              = Field(default_factory=list)
    recommended_actions: list[RIBAction]        = Field(default_factory=list)
    raw_json:            Optional[str]          = None


# ── API request / response shapes ─────────────────────────────────────────────

class AddPlayerRequest(BaseModel):
    full_name:       str
    position:        str
    grad_year:       int
    high_school:     Optional[str]   = None
    aau_program:     Optional[str]   = None
    height_inches:   Optional[int]   = None
    weight_lbs:      Optional[int]   = None
    gpa:             Optional[float] = None
    data_source:     str             = "manual"


class FitScoreRequest(BaseModel):
    player_id:        str
    roster_positions: list[str] = Field(default_factory=list)  # existing roster pos list
    program_system:   Optional[str] = None   # e.g. "Dribble-Drive Motion"
    target_grad_year: Optional[int] = None


class ActivatePlayerRequest(BaseModel):
    player_id:        str
    requested_status: str    # preview | full | exclusive
    notes:            Optional[str] = None


class OnboardOperatorRequest(BaseModel):
    operator_name: str
    email:         str
    license_tier:  str = LicenseTier.SOLO.value
    program_name:  Optional[str] = None
    program_city:  Optional[str] = None
    program_state: Optional[str] = None


class IssueTokenRequest(BaseModel):
    operator_id: str


class ApproveActivationRequest(BaseModel):
    lock_id:      str
    approved:     bool
    notes:        Optional[str] = None
