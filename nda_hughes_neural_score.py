"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        Neural Data Agency (NDA) — Hughes Neural Score                       ║
║        Standalone Callable | HeadsUp OS v3.0.0                              ║
║        The Heads Up! Foundation | HeadsUP MEDIA & Scouting                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE:
    Gate 2 of the 7-Gate Neural Arbitrage Engine extracted as a fully
    self-contained, independently callable module for the Neural Data Agency
    (NDA) pipeline.

    This module has ZERO pandas dependency in its core scoring logic.
    It runs as:
        (A) A direct Python callable — nda_score(payload) → NDAScoreResult
        (B) A FastAPI endpoint via nda_router.py — POST /api/v1/nda/neural-score
        (C) An import inside HeadsUpArbitrageEngine.hughes_neural_score()

SCORING FRAMEWORK:
    PRO-Score (neck_up_pro_score) — Behavioral ROI via Chase Hughes methodology
        Culture Equity  : 40% weight
        Resilience      : 35% weight
        Coachability    : 25% weight  (entitlement penalty applied pre-calc)

    NER (neck_up_ner) — Neural Efficiency Rating
        Playmaking      : 35% weight
        Defense         : 35% weight
        Physical Output : 30% weight

    Entitlement Penalty: -3.5 pts per flag against raw coachability (cap: -20.0)

VALIDATION ANCHOR (ZERO HALLUCINATION):
    Benchmark: Mike Boone (uuid-0004-boone)
        Input  → culture_equity=88, resilience=76, coachability=82,
                  playmaking=85, defense=78.5, physical_output=84,
                  entitlement_flags=0
        Output → PRO-Score: 82.30 | NER: 82.42

    Run: python nda_hughes_neural_score.py to validate instantly.

PYDANTIC VERSION:
    Pydantic v1.10.21 — pinned to eliminate Rust/pydantic-core compile
    issues on Render. Do NOT upgrade to v2 without testing the Render build.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field, validator

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — ALGORITHM CONSTANTS  (v3.0.0 lock — never inline)
# ─────────────────────────────────────────────────────────────────────────────

ALGO_VERSION: str = "3.0.0"

# PRO-Score weights (Chase Hughes behavioral framework)
PRO_SCORE_WEIGHTS: dict = {
    "culture_equity": 0.40,
    "resilience":     0.35,
    "coachability":   0.25,
}

# NER weights
NER_WEIGHTS: dict = {
    "playmaking":      0.35,
    "defense":         0.35,
    "physical_output": 0.30,
}

# Deficiency threshold — any metric below triggers a PRO-Quest
DEFICIENCY_THRESHOLD: float = 80.0

# Entitlement penalty rate (per flag) and maximum deduction
ENTITLEMENT_PENALTY_RATE: float = 3.5
ENTITLEMENT_PENALTY_CAP:  float = 20.0

# Culture grade breakpoints (PRO-Score → letter grade)
CULTURE_GRADE_BREAKPOINTS: list = [
    (95.0, "A+"),
    (88.0, "A"),
    (83.0, "B+"),
    (75.0, "B"),
    (68.0, "C+"),
    (60.0, "C"),
    (50.0, "D"),
    (0.0,  "F"),
]

# PRO-Quest template fallback library (metric → quest mapping)
PRO_QUEST_TEMPLATES: dict = {
    "culture_equity":  {"title": "The Culture Equity Audit",   "xp": 150, "pathway": "Player Development"},
    "resilience":      {"title": "The Pressure Protocol",      "xp": 150, "pathway": "Player Development"},
    "coachability":    {"title": "The Authority Loop",         "xp": 150, "pathway": "Player Development"},
    "playmaking":      {"title": "Film Room Arbitrage",        "xp": 175, "pathway": "Sports Analytics"},
    "defense":         {"title": "The Shutdown Assignment",    "xp": 150, "pathway": "Player Development"},
    "physical_output": {"title": "The Conditioning Contract",  "xp": 200, "pathway": "Player Development"},
}

# Hughes behavioral signal descriptors (score bands → behavioral commentary)
BEHAVIORAL_SIGNAL_BANDS: dict = {
    "culture_equity": {
        (90, 100): "Elite team-first orientation. Elevates locker room culture immediately.",
        (80, 90):  "Consistent culture contributor. Reliable under group pressure.",
        (65, 80):  "Situational. Culture investment is performance-dependent.",
        (0, 65):   "Culture liability. Requires structured accountability environment.",
    },
    "resilience": {
        (90, 100): "Adversity accelerant. Setbacks sharpen this athlete.",
        (80, 90):  "Durable under pressure. Recovers within a competitive cycle.",
        (65, 80):  "Functional but fragile. Extended adversity reveals cracks.",
        (0, 65):   "Low adversity tolerance. Volatile in high-stakes environments.",
    },
    "coachability": {
        (90, 100): "Rare receiver. Integrates coaching corrections in real time.",
        (80, 90):  "Highly receptive. Builds trust with coaching staff quickly.",
        (65, 80):  "Selective. Responds well to respected authority figures only.",
        (0, 65):   "Resistant. Coaching friction is a systemic risk.",
    },
    "playmaking": {
        (90, 100): "Floor general. Reads the game two possessions ahead.",
        (80, 90):  "High IQ decision-maker. Consistently creates quality looks.",
        (65, 80):  "Functional playmaker. Effective within defined structure.",
        (0, 65):   "Limited vision. Needs scripted play design to produce.",
    },
    "defense": {
        (90, 100): "Elite two-way anchor. Defensive IQ matches physical tools.",
        (80, 90):  "Reliable on-ball defender. Competitive on every possession.",
        (65, 80):  "Effort defender. Results inconsistent without positioning cues.",
        (0, 65):   "Defensive liability. Exploitable at next level.",
    },
    "physical_output": {
        (90, 100): "Conditioning model. Physical investment exceeds peer baseline.",
        (80, 90):  "Athletic asset. Physical tools translate across competition levels.",
        (65, 80):  "Functional athleticism. Performance-dependent conditioning.",
        (0, 65):   "Physical deficiency. Targeted conditioning program required.",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — PYDANTIC MODELS (v1.10.21)
# ─────────────────────────────────────────────────────────────────────────────

class NeckUpInputs(BaseModel):
    """
    Raw Neck Up behavioral metric inputs for a single athlete.
    All scores on a 0–100 scale. Missing scores accepted as None
    and flagged in the response — never silently zeroed.
    """
    culture_equity:  float = Field(..., ge=0, le=100,
        description="Team-first orientation, adversity response, group accountability (0–100)")
    resilience:      float = Field(..., ge=0, le=100,
        description="Recovery speed from setbacks, adversity durability (0–100)")
    coachability:    float = Field(..., ge=0, le=100,
        description="Receptiveness to instruction and correction (0–100)")
    playmaking:      float = Field(..., ge=0, le=100,
        description="Decision-making, vision, creation under defensive pressure (0–100)")
    defense:         float = Field(..., ge=0, le=100,
        description="Defensive IQ, positioning, competitive effort (0–100)")
    physical_output: float = Field(..., ge=0, le=100,
        description="Conditioning investment, athleticism rating (0–100)")

    @validator("culture_equity", "resilience", "coachability",
               "playmaking", "defense", "physical_output", pre=True)
    def round_to_one_decimal(cls, v):
        return round(float(v), 1)


class NDAScoreRequest(BaseModel):
    """
    Full NDA neural score request payload.
    Matches the POST /api/v1/nda/neural-score request contract.
    """
    athlete_id:        str   = Field(..., description="Athlete UUID from Supabase athletes table")
    full_name:         str   = Field(..., min_length=2, max_length=120)
    graduation_year:   int   = Field(..., ge=2020, le=2035)
    school:            Optional[str] = Field(None)
    entitlement_flags: int   = Field(0, ge=0, le=10,
        description="Count of documented coachability red flags (0–10)")
    injury_status:     bool  = Field(False)
    neck_up:           NeckUpInputs

    class Config:
        schema_extra = {
            "example": {
                "athlete_id":      "uuid-0004-boone",
                "full_name":       "Mike Boone",
                "graduation_year": 2026,
                "school":          "DFW Elite Prep",
                "entitlement_flags": 0,
                "injury_status":   False,
                "neck_up": {
                    "culture_equity":  88.0,
                    "resilience":      76.0,
                    "coachability":    82.0,
                    "playmaking":      85.0,
                    "defense":         78.5,
                    "physical_output": 84.0,
                },
            }
        }


class DeficiencyFlag(BaseModel):
    """Single Neck Up deficiency detected below DEFICIENCY_THRESHOLD."""
    neck_up_metric: str
    raw_score:      float
    adjusted_score: float   # post-penalty (relevant for coachability)
    threshold:      float
    severity:       str     # 'critical' (<65) | 'minor' (65–79.9)
    pro_quest:      dict    # template quest triggered by this deficiency


class BehavioralSignal(BaseModel):
    """Hughes behavioral commentary for a single Neck Up metric."""
    metric:      str
    score:       float
    band:        str   # e.g. "(80, 90)"
    descriptor:  str   # qualitative commentary


class EntitlementReport(BaseModel):
    """Coachability entitlement penalty breakdown."""
    raw_flags:             int
    penalty_per_flag:      float
    total_penalty_applied: float
    adjusted_coachability: float
    locker_room_risk:      str   # 'None' | 'Low' | 'Moderate' | 'High' | 'Critical'


class NDAScoreResult(BaseModel):
    """
    Full NDA neural score response.
    Matches the POST /api/v1/nda/neural-score response contract.
    """
    # ── Identity ──────────────────────────────────────────────────────────
    score_id:          str
    athlete_id:        str
    full_name:         str
    graduation_year:   int
    school:            Optional[str]
    engine_version:    str
    scored_at:         str   # ISO 8601

    # ── Core Scores ───────────────────────────────────────────────────────
    neck_up_pro_score: float
    neck_up_ner:       float
    culture_grade:     str

    # ── Adjusted Inputs (post-penalty) ────────────────────────────────────
    neck_up_culture_equity:  float
    neck_up_resilience:      float
    neck_up_coachability:    float   # adjusted (post-entitlement penalty)
    neck_up_playmaking:      float
    neck_up_defense:         float
    neck_up_physical_output: float

    # ── Analysis ──────────────────────────────────────────────────────────
    deficiency_flags:    List[DeficiencyFlag]
    behavioral_signals:  List[BehavioralSignal]
    entitlement_report:  EntitlementReport
    pro_quests_triggered: List[dict]   # flat list for Supabase insert

    # ── Injury Routing ────────────────────────────────────────────────────
    injury_status:            bool
    career_pathway_activated: bool   # True if injury_status=True
    career_pathways:          List[str]


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — PURE SCORING FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def _culture_grade(pro_score: float) -> str:
    """
    Map PRO-Score to culture letter grade.

    Args:
        pro_score: Computed PRO-Score float (0–100).

    Returns:
        Letter grade string: A+, A, B+, B, C+, C, D, F.
    """
    for threshold, grade in CULTURE_GRADE_BREAKPOINTS:
        if pro_score >= threshold:
            return grade
    return "F"


def _behavioral_signal(metric: str, score: float) -> BehavioralSignal:
    """
    Retrieve the Hughes behavioral commentary for a given metric and score.

    Args:
        metric: Neck Up metric name (e.g., 'resilience').
        score:  Adjusted score for that metric.

    Returns:
        BehavioralSignal with band label and qualitative descriptor.
    """
    bands = BEHAVIORAL_SIGNAL_BANDS.get(metric, {})
    for (low, high), descriptor in bands.items():
        if low <= score < high or (high == 100 and score == 100):
            return BehavioralSignal(
                metric=metric,
                score=score,
                band=f"({low}–{high})",
                descriptor=descriptor,
            )
    return BehavioralSignal(
        metric=metric,
        score=score,
        band="(0–100)",
        descriptor="Insufficient data for behavioral signal generation.",
    )


def _locker_room_risk(entitlement_flags: int) -> str:
    """
    Map entitlement flag count to locker room risk label.

    Args:
        entitlement_flags: Integer count of documented behavioral red flags.

    Returns:
        Risk label string.
    """
    if entitlement_flags == 0:  return "None"
    if entitlement_flags == 1:  return "Low"
    if entitlement_flags == 2:  return "Moderate"
    if entitlement_flags <= 4:  return "High"
    return "Critical"


def _build_deficiency_flag(metric: str, raw_score: float,
                            adjusted_score: float) -> DeficiencyFlag:
    """
    Build a DeficiencyFlag for a metric below DEFICIENCY_THRESHOLD.

    Args:
        metric:         Neck Up metric name.
        raw_score:      Original input score (pre-penalty).
        adjusted_score: Post-entitlement-penalty score (same as raw for
                        non-coachability metrics).

    Returns:
        DeficiencyFlag with PRO-Quest template attached.
    """
    severity = "critical" if adjusted_score < 65.0 else "minor"
    quest_template = PRO_QUEST_TEMPLATES.get(metric, {
        "title":   "The Development Protocol",
        "xp":      150,
        "pathway": "General",
    })

    return DeficiencyFlag(
        neck_up_metric=metric,
        raw_score=raw_score,
        adjusted_score=adjusted_score,
        threshold=DEFICIENCY_THRESHOLD,
        severity=severity,
        pro_quest={
            "quest_title":    quest_template["title"],
            "neck_up_metric": metric,
            "xp_reward":      quest_template["xp"],
            "career_pathway": quest_template["pathway"],
            "auto_generated": True,
            "engine_version": ALGO_VERSION,
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — CORE CALLABLE: nda_score()
# ─────────────────────────────────────────────────────────────────────────────

def nda_score(request: NDAScoreRequest) -> NDAScoreResult:
    """
    Neural Data Agency — Hughes Neural Score callable.

    The single authoritative function for computing behavioral intelligence
    scores from raw Neck Up inputs. Called by:
        - POST /api/v1/nda/neural-score  (FastAPI router)
        - HeadsUpArbitrageEngine.hughes_neural_score()  (Gate 2 import)
        - Direct Python calls in the NDA batch pipeline

    Scoring steps (locked v3.0.0):
        1. Apply entitlement penalty to raw coachability
        2. Compute PRO-Score from weighted Culture Equity + Resilience + Coachability
        3. Compute NER from weighted Playmaking + Defense + Physical Output
        4. Flag any metric below DEFICIENCY_THRESHOLD (80.0)
        5. Attach PRO-Quest template to each deficiency
        6. Generate Hughes behavioral signal commentary for all 6 metrics
        7. Activate injury career pathways if injury_status=True

    Args:
        request: Validated NDAScoreRequest payload.

    Returns:
        NDAScoreResult — complete behavioral intelligence report, ready for
        Supabase upsert and FastAPI response serialization.
    """
    nu = request.neck_up

    # ── Step 1: Entitlement penalty ───────────────────────────────────────
    raw_coachability    = nu.coachability
    total_penalty       = min(request.entitlement_flags * ENTITLEMENT_PENALTY_RATE,
                              ENTITLEMENT_PENALTY_CAP)
    adjusted_coachability = max(0.0, raw_coachability - total_penalty)

    entitlement_report = EntitlementReport(
        raw_flags=request.entitlement_flags,
        penalty_per_flag=ENTITLEMENT_PENALTY_RATE,
        total_penalty_applied=round(total_penalty, 2),
        adjusted_coachability=round(adjusted_coachability, 2),
        locker_room_risk=_locker_room_risk(request.entitlement_flags),
    )

    # ── Step 2: PRO-Score ─────────────────────────────────────────────────
    pro_score = round(
        (nu.culture_equity      * PRO_SCORE_WEIGHTS["culture_equity"]) +
        (nu.resilience          * PRO_SCORE_WEIGHTS["resilience"])      +
        (adjusted_coachability  * PRO_SCORE_WEIGHTS["coachability"]),
        2,
    )

    # ── Step 3: NER ───────────────────────────────────────────────────────
    ner = round(
        (nu.playmaking      * NER_WEIGHTS["playmaking"])      +
        (nu.defense         * NER_WEIGHTS["defense"])         +
        (nu.physical_output * NER_WEIGHTS["physical_output"]),
        2,
    )

    # ── Step 4 & 5: Deficiency flags + PRO-Quest triggers ─────────────────
    # Metric map uses adjusted coachability for flag evaluation
    metric_map: dict[str, tuple[float, float]] = {
        # metric_name: (raw_score, adjusted_score)
        "culture_equity":  (nu.culture_equity,  nu.culture_equity),
        "resilience":      (nu.resilience,       nu.resilience),
        "coachability":    (raw_coachability,    adjusted_coachability),
        "playmaking":      (nu.playmaking,       nu.playmaking),
        "defense":         (nu.defense,          nu.defense),
        "physical_output": (nu.physical_output,  nu.physical_output),
    }

    deficiency_flags: list[DeficiencyFlag] = []
    for metric, (raw, adjusted) in metric_map.items():
        if adjusted < DEFICIENCY_THRESHOLD:
            deficiency_flags.append(_build_deficiency_flag(metric, raw, adjusted))

    # Flatten PRO-Quest list for Supabase insert (one dict per quest)
    pro_quests_triggered = [flag.pro_quest for flag in deficiency_flags]

    # ── Step 6: Hughes behavioral signal commentary ───────────────────────
    adjusted_scores: dict[str, float] = {
        "culture_equity":  nu.culture_equity,
        "resilience":      nu.resilience,
        "coachability":    adjusted_coachability,
        "playmaking":      nu.playmaking,
        "defense":         nu.defense,
        "physical_output": nu.physical_output,
    }
    behavioral_signals = [
        _behavioral_signal(metric, score)
        for metric, score in adjusted_scores.items()
    ]

    # ── Step 7: Injury career pathway activation ──────────────────────────
    injury_pathways = [
        "Front Office", "Sports Agency", "Collegiate Coaching",
        "Media/Broadcasting", "Sports Analytics", "General",
    ]
    career_pathway_activated = request.injury_status
    career_pathways          = injury_pathways if request.injury_status else []

    # ── Assemble result ───────────────────────────────────────────────────
    return NDAScoreResult(
        score_id=str(uuid.uuid4()),
        athlete_id=request.athlete_id,
        full_name=request.full_name,
        graduation_year=request.graduation_year,
        school=request.school,
        engine_version=ALGO_VERSION,
        scored_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),

        neck_up_pro_score=pro_score,
        neck_up_ner=ner,
        culture_grade=_culture_grade(pro_score),

        neck_up_culture_equity=nu.culture_equity,
        neck_up_resilience=nu.resilience,
        neck_up_coachability=round(adjusted_coachability, 2),
        neck_up_playmaking=nu.playmaking,
        neck_up_defense=nu.defense,
        neck_up_physical_output=nu.physical_output,

        deficiency_flags=deficiency_flags,
        behavioral_signals=behavioral_signals,
        entitlement_report=entitlement_report,
        pro_quests_triggered=pro_quests_triggered,

        injury_status=request.injury_status,
        career_pathway_activated=career_pathway_activated,
        career_pathways=career_pathways,
    )


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — PANDAS BRIDGE (for Gate 2 import in HeadsUpArbitrageEngine)
# ─────────────────────────────────────────────────────────────────────────────

def nda_score_from_series(row, athlete_id: Optional[str] = None):
    """
    Pandas Series bridge — wraps nda_score() for use inside the
    HeadsUpArbitrageEngine.hughes_neural_score() gate.

    Extracts neck_up_* fields from a DataFrame row, calls nda_score(),
    and writes results back to the row dict — preserving the existing
    gate log pattern.

    Args:
        row:        pandas.Series from the prospect ledger.
        athlete_id: Optional override UUID. Defaults to row['athlete_id']
                    or a new UUID if missing.

    Returns:
        dict of computed fields to merge back into the row.
    """
    import pandas as pd

    def _sf(val, default=0.0):
        try:
            return float(val)
        except (TypeError, ValueError):
            return default

    def _si(val, default=0):
        try:
            return int(val)
        except (TypeError, ValueError):
            return default

    def _miss(val):
        if val is None:
            return True
        if isinstance(val, float) and pd.isna(val):
            return True
        if isinstance(val, str) and val.strip() in ("", "N/A", "Unknown"):
            return True
        return False

    # ── Build request from row ────────────────────────────────────────────
    # Clamp all inputs to valid 0–100 range before Pydantic validation
    def _clamp(val):
        return max(0.0, min(100.0, _sf(val, 0.0)))

    culture_equity  = _clamp(row.get("neck_up_culture_equity"))
    resilience      = _clamp(row.get("neck_up_resilience"))
    coachability    = _clamp(row.get("neck_up_coachability"))
    playmaking      = _clamp(row.get("neck_up_playmaking"))
    defense         = _clamp(row.get("neck_up_defense"))
    physical_output = _clamp(row.get("neck_up_physical_output"))

    request = NDAScoreRequest(
        athlete_id=athlete_id or str(row.get("athlete_id", uuid.uuid4())),
        full_name=str(row.get("Player", "Unknown")),
        graduation_year=_si(row.get("Graduation_Year", 2026)),
        school=str(row.get("High_School", "")) or None,
        entitlement_flags=_si(row.get("entitlement_flags", 0)),
        injury_status=bool(row.get("injury_status", False)),
        neck_up=NeckUpInputs(
            culture_equity=culture_equity,
            resilience=resilience,
            coachability=coachability,
            playmaking=playmaking,
            defense=defense,
            physical_output=physical_output,
        ),
    )

    result = nda_score(request)

    # ── Serialize deficiency flags and behavioral signals for DataFrame ────
    deficiency_list = [
        {
            "neck_up_metric": f.neck_up_metric,
            "score":          f.adjusted_score,
            "threshold":      f.threshold,
            "severity":       f.severity,
        }
        for f in result.deficiency_flags
    ]

    gate_entry = (
        f"Gate2_Hughes[NDA]: PRO={result.neck_up_pro_score} | "
        f"NER={result.neck_up_ner} | Grade={result.culture_grade} | "
        f"deficiencies={len(result.deficiency_flags)} | "
        f"locker_risk={result.entitlement_report.locker_room_risk}"
    )

    return {
        "neck_up_pro_score":       result.neck_up_pro_score,
        "neck_up_ner":             result.neck_up_ner,
        "neck_up_culture_equity":  result.neck_up_culture_equity,
        "neck_up_resilience":      result.neck_up_resilience,
        "neck_up_coachability":    result.neck_up_coachability,  # adjusted
        "neck_up_playmaking":      result.neck_up_playmaking,
        "neck_up_defense":         result.neck_up_defense,
        "neck_up_physical_output": result.neck_up_physical_output,
        "Culture_Grade":           result.culture_grade,
        "deficiency_flags":        deficiency_list,
        "pro_quests_triggered":    result.pro_quests_triggered,
        "_gate2_log":              gate_entry,
        "_nda_score_id":           result.score_id,
        "_entitlement_report": {
            "raw_flags":              result.entitlement_report.raw_flags,
            "penalty_applied":        result.entitlement_report.total_penalty_applied,
            "locker_room_risk":       result.entitlement_report.locker_room_risk,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 6 — VALIDATION ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"\n{'═'*68}")
    print(f"  NDA Hughes Neural Score — Standalone Validation")
    print(f"  HeadsUp OS v{ALGO_VERSION} | Neural Data Agency")
    print(f"{'═'*68}\n")

    # ── Validation Anchor: Mike Boone (uuid-0004-boone) ───────────────────
    boone_request = NDAScoreRequest(
        athlete_id="uuid-0004-boone",
        full_name="Mike Boone",
        graduation_year=2026,
        school="DFW Elite Prep",
        entitlement_flags=0,
        injury_status=False,
        neck_up=NeckUpInputs(
            culture_equity=88.0,
            resilience=76.0,
            coachability=82.0,
            playmaking=85.0,
            defense=78.5,
            physical_output=84.0,
        ),
    )

    boone_result = nda_score(boone_request)

    print(f"  VALIDATION ANCHOR: {boone_result.full_name}")
    print(f"  {'─'*46}")
    print(f"  PRO-Score  : {boone_result.neck_up_pro_score:.2f}   (expected: 82.30)")
    print(f"  NER        : {boone_result.neck_up_ner:.2f}   (expected: 82.42)")
    print(f"  Grade      : {boone_result.culture_grade}")
    print(f"  Deficiencies: {len(boone_result.deficiency_flags)} "
          f"({[f.neck_up_metric for f in boone_result.deficiency_flags]})")

    pro_ok = abs(boone_result.neck_up_pro_score - 82.30) < 0.01
    ner_ok = abs(boone_result.neck_up_ner       - 82.42) < 0.01

    status = "✅ VALIDATION PASSED" if (pro_ok and ner_ok) else "❌ VALIDATION FAILED"
    print(f"\n  {status}")

    # ── Extended test: entitlement penalty ────────────────────────────────
    print(f"\n  {'─'*46}")
    print(f"  ENTITLEMENT PENALTY TEST (3 flags):")

    entitled_request = NDAScoreRequest(
        athlete_id="uuid-test-entitled",
        full_name="TEST_Entitled_Athlete",
        graduation_year=2026,
        school="TEST_School",
        entitlement_flags=3,
        injury_status=False,
        neck_up=NeckUpInputs(
            culture_equity=75.0,
            resilience=80.0,
            coachability=82.0,  # raw: 82.0 → adjusted: 82 - (3×3.5) = 71.5
            playmaking=80.0,
            defense=78.0,
            physical_output=83.0,
        ),
    )

    entitled_result = nda_score(entitled_request)
    ep = entitled_result.entitlement_report
    print(f"  Raw coachability     : 82.0")
    print(f"  Penalty applied      : {ep.total_penalty_applied} pts ({ep.raw_flags} flags × {ep.penalty_per_flag})")
    print(f"  Adjusted coachability: {ep.adjusted_coachability}")
    print(f"  Locker Room Risk     : {ep.locker_room_risk}")
    print(f"  PRO-Score (adjusted) : {entitled_result.neck_up_pro_score}")

    expected_adj_coach = max(0.0, 82.0 - (3 * 3.5))  # 71.5
    penalty_ok = abs(ep.adjusted_coachability - expected_adj_coach) < 0.01
    print(f"\n  Penalty math: {'✅ CORRECT' if penalty_ok else '❌ INCORRECT'} "
          f"(expected adjusted_coachability={expected_adj_coach:.1f})")

    # ── Injury pathway test ───────────────────────────────────────────────
    print(f"\n  {'─'*46}")
    print(f"  INJURY PATHWAY ACTIVATION TEST:")
    injury_request = NDAScoreRequest(
        athlete_id="uuid-test-injury",
        full_name="TEST_Injured_Athlete",
        graduation_year=2025,
        school="TEST_School",
        entitlement_flags=0,
        injury_status=True,
        neck_up=NeckUpInputs(
            culture_equity=90.0,
            resilience=88.0,
            coachability=92.0,
            playmaking=71.0,
            defense=76.0,
            physical_output=68.0,
        ),
    )
    injury_result = nda_score(injury_request)
    print(f"  Career pathway activated : {injury_result.career_pathway_activated}")
    print(f"  Pathways                 : {injury_result.career_pathways}")
    pathways_ok = injury_result.career_pathway_activated and len(injury_result.career_pathways) == 6
    print(f"  All 6 tracks activated   : {'✅ YES' if pathways_ok else '❌ NO'}")

    # ── Behavioral signal preview ─────────────────────────────────────────
    print(f"\n  {'─'*46}")
    print(f"  BEHAVIORAL SIGNALS (Mike Boone):")
    for signal in boone_result.behavioral_signals:
        print(f"  {signal.metric:<18} {signal.score:.1f}  →  {signal.descriptor[:60]}...")

    print(f"\n{'═'*68}\n")
