# ============================================================
# hu_os_engine.py — HeadsUp OS Neural Audit Engine v2.0.0
# The Heads Up! Foundation | Dallas, TX
# FastAPI microservice deployed on Render
#
# Validation test — Mike Boone (uuid-0004-boone):
#   PRO-Score : 82.30
#   NER       : 82.42
#   OVR       : 82.36
#   Flags     : [resilience, defense]
#   Quests    : [The Pressure Protocol, The Shutdown Assignment]
# ============================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import datetime

# ── App ───────────────────────────────────────────────────────
app = FastAPI(
    title="HeadsUp OS Neural Audit Engine",
    version="2.0.0",
    description="Neck Up evaluation engine for The Heads Up! Foundation",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── SECTION 1: ALGORITHM CONSTANTS ───────────────────────────
# Single source of truth. Never hardcoded inline.

ALGO = {
    "VERSION": "2.0.0",

    # Neck Up: PRO-Score weights (behavioral ROI — Chase Hughes framework)
    "NECK_UP_PRO_SCORE_WEIGHTS": {
        "culture_equity": 0.40,
        "resilience":     0.35,
        "coachability":   0.25,
    },

    # Neck Up: Neural Efficiency Rating weights
    "NECK_UP_NER_WEIGHTS": {
        "playmaking":      0.35,
        "defense":         0.35,
        "physical_output": 0.30,
    },

    # Overall Rating weights
    "OVR_WEIGHTS": {
        "neck_up_pro_score": 0.50,
        "neck_up_ner":       0.50,
    },

    # Deficiency threshold — any Neck Up metric below triggers a PRO-Quest
    "NECK_UP_DEFICIENCY_THRESHOLD": 80.0,

    # Confidence band thresholds (data completeness ratio)
    "CONFIDENCE_THRESHOLDS": {
        "High":   0.85,
        "Medium": 0.70,
        "Low":    0.00,
    },

    # Neural Market Position — evaluated top-to-bottom, first match wins
    "MARKET_POSITIONS": [
        {"label": "Class A — Portal Killer",  "min_ovr": 85.0, "min_pro_score": 85.0},
        {"label": "Class B — Culture Equity", "min_ovr": 75.0, "min_pro_score": 80.0},
        {"label": "Class C — Specialist",     "min_ovr": 65.0, "min_pro_score":  0.0},
        {"label": "Unclassified",             "min_ovr":  0.0, "min_pro_score":  0.0},
    ],

    # XP economy
    "XP": {
        "quest_complete":     150,
        "badge_earned":       250,
        "sovereign_verified": 500,
    },
}

# ── SECTION 8: PRO-Quest Template Fallback Library ────────────
QUEST_TEMPLATES = {
    "resilience": {
        "quest_title":    "The Pressure Protocol",
        "neck_up_metric": "resilience",
        "scenario_text":  "Your team is down 12 at halftime. The locker room is tense and your coach is putting the pressure directly on you. Walk through how you respond — to the coach, to your teammates, and to yourself. This is not about the scoreboard. This is about who you are when the margin disappears.",
        "xp_reward":      150,
        "career_pathway": "Player Development",
    },
    "coachability": {
        "quest_title":    "The Authority Loop",
        "neck_up_metric": "coachability",
        "scenario_text":  "Your coach pulls you aside after practice and delivers feedback that contradicts how you have played for three years. The instruction feels wrong. Walk through how you receive it, what questions you ask, and how you integrate it — or push back constructively — without damaging the relationship.",
        "xp_reward":      150,
        "career_pathway": "Player Development",
    },
    "culture_equity": {
        "quest_title":    "The Culture Equity Audit",
        "neck_up_metric": "culture_equity",
        "scenario_text":  "A new teammate is underperforming and the team culture is fracturing. You are not the captain. You have no formal authority. What do you do in the next 48 hours to protect the standard without creating conflict or appearing to overstep?",
        "xp_reward":      150,
        "career_pathway": "Player Development",
    },
    "playmaking": {
        "quest_title":    "Film Room Arbitrage",
        "neck_up_metric": "playmaking",
        "scenario_text":  "Review 10 minutes of your last game film. Identify two possessions where your read was incorrect and one where your decision-making was elite. Write your analysis in the format of a film session presentation to your coaching staff.",
        "xp_reward":      175,
        "career_pathway": "Sports Analytics",
    },
    "defense": {
        "quest_title":    "The Shutdown Assignment",
        "neck_up_metric": "defense",
        "scenario_text":  "You are assigned to guard the opposing team's best scorer — someone who has dropped 30 on your team the last three meetings. Walk through your preparation: film study, physical approach, communication with your help defenders, and your mental contract for the assignment.",
        "xp_reward":      150,
        "career_pathway": "Player Development",
    },
    "physical_output": {
        "quest_title":    "The Conditioning Contract",
        "neck_up_metric": "physical_output",
        "scenario_text":  "You have 28 days before the most important game of your season. Your current physical benchmarks are below your peak. Design a conditioning plan — including sleep targets, nutrition structure, and training benchmarks — that puts you at peak output on game day.",
        "xp_reward":      200,
        "career_pathway": "Player Development",
    },
}

# Career pathway quests — appended when injury_status = True
CAREER_PATHWAY_QUESTS = [
    {
        "quest_title":    "The Front Office Blueprint",
        "neck_up_metric": "leadership",
        "scenario_text":  "You are shadowing a front office executive for one week. Draft a player evaluation memo in the style of a real GM — covering behavioral profile, on-court value, and locker room fit. Present your findings as if pitching to ownership.",
        "xp_reward":      300,
        "career_pathway": "Front Office",
        "auto_generated": False,
    },
    {
        "quest_title":    "The Broadcast Segment",
        "neck_up_metric": "basketball_iq",
        "scenario_text":  "You are given 60 seconds of game film. Record a 90-second breakdown segment as if you were a studio analyst. Articulate your read of the play, the decision made, and what you would have done differently.",
        "xp_reward":      250,
        "career_pathway": "Media/Broadcasting",
        "auto_generated": False,
    },
    {
        "quest_title":    "The Analytics Dashboard",
        "neck_up_metric": "basketball_iq",
        "scenario_text":  "Using the provided game data, identify the top three efficiency gaps in your team's offensive scheme. Build a one-page visual summary with your recommendations. Present it as a data analyst would to a head coaching staff.",
        "xp_reward":      400,
        "career_pathway": "Sports Analytics",
        "auto_generated": False,
    },
]

# Secondary tag thresholds
SECONDARY_TAG_RULES = [
    {"tag": "Culture Driver",  "metric": "culture_equity",  "min": 85.0},
    {"tag": "High IQ",         "metric": "playmaking",      "min": 85.0},
    {"tag": "Lockdown",        "metric": "defense",         "min": 85.0},
    {"tag": "Elite Motor",     "metric": "physical_output", "min": 85.0},
    {"tag": "Coachable Alpha", "metric": "coachability",    "min": 85.0},
    {"tag": "Resilient",       "metric": "resilience",      "min": 85.0},
]

# ── Pydantic models ───────────────────────────────────────────

class NeckUpInput(BaseModel):
    culture_equity:  float = Field(..., ge=0, le=100)
    resilience:      float = Field(..., ge=0, le=100)
    coachability:    float = Field(..., ge=0, le=100)
    playmaking:      float = Field(..., ge=0, le=100)
    defense:         float = Field(..., ge=0, le=100)
    physical_output: float = Field(..., ge=0, le=100)

class NeckDownInput(BaseModel):
    sport:   str = "basketball"
    metrics: dict = {}

class AuditRequest(BaseModel):
    athlete_id:      str
    full_name:       str
    graduation_year: int
    school:          Optional[str] = None
    injury_status:   bool = False
    neck_up:         NeckUpInput
    neck_down:       NeckDownInput = NeckDownInput()

class XPAwardRequest(BaseModel):
    xp_awarded: int
    quest_id:   str
    new_total:  int

# ── Calculation functions ─────────────────────────────────────

def calc_pro_score(neck_up: NeckUpInput) -> float:
    """Weighted PRO-Score from ALGO dict. Chase Hughes behavioral ROI framework."""
    weights = ALGO["NECK_UP_PRO_SCORE_WEIGHTS"]
    score = (
        neck_up.culture_equity * weights["culture_equity"] +
        neck_up.resilience     * weights["resilience"]     +
        neck_up.coachability   * weights["coachability"]
    )
    return round(score, 2)

def calc_ner(neck_up: NeckUpInput) -> float:
    """Neural Efficiency Rating — on-court cognitive + physical execution."""
    weights = ALGO["NECK_UP_NER_WEIGHTS"]
    ner = (
        neck_up.playmaking      * weights["playmaking"]      +
        neck_up.defense         * weights["defense"]         +
        neck_up.physical_output * weights["physical_output"]
    )
    return round(ner, 2)

def calc_ovr(pro_score: float, ner: float) -> float:
    """Overall Rating — equal weight PRO-Score and NER."""
    weights = ALGO["OVR_WEIGHTS"]
    ovr = (
        pro_score * weights["neck_up_pro_score"] +
        ner       * weights["neck_up_ner"]
    )
    return round(ovr, 2)

def calc_confidence_band(neck_up: NeckUpInput) -> str:
    """Confidence band based on data completeness ratio."""
    metrics = [
        neck_up.culture_equity, neck_up.resilience, neck_up.coachability,
        neck_up.playmaking,     neck_up.defense,    neck_up.physical_output,
    ]
    # All 6 metrics provided = 100% completeness
    completeness = sum(1 for m in metrics if m > 0) / len(metrics)
    thresholds   = ALGO["CONFIDENCE_THRESHOLDS"]
    if completeness >= thresholds["High"]:   return "High"
    if completeness >= thresholds["Medium"]: return "Medium"
    return "Low"

def calc_market_position(ovr: float, pro_score: float) -> str:
    """Neural Market Position — first match wins (top-to-bottom evaluation)."""
    for position in ALGO["MARKET_POSITIONS"]:
        if ovr >= position["min_ovr"] and pro_score >= position["min_pro_score"]:
            return position["label"]
    return "Unclassified"

def calc_deficiency_flags(neck_up: NeckUpInput) -> list:
    """Flag any Neck Up metric below NECK_UP_DEFICIENCY_THRESHOLD."""
    threshold = ALGO["NECK_UP_DEFICIENCY_THRESHOLD"]
    flags     = []
    metrics   = {
        "culture_equity":  neck_up.culture_equity,
        "resilience":      neck_up.resilience,
        "coachability":    neck_up.coachability,
        "playmaking":      neck_up.playmaking,
        "defense":         neck_up.defense,
        "physical_output": neck_up.physical_output,
    }
    for metric, score in metrics.items():
        if score < threshold:
            gap = threshold - score
            severity = "critical" if gap >= 15 else "moderate" if gap >= 8 else "minor"
            flags.append({
                "neck_up_metric": metric,
                "score":          score,
                "threshold":      threshold,
                "severity":       severity,
            })
    return flags

def calc_secondary_tags(neck_up: NeckUpInput) -> list:
    """Generate secondary tags for elite metrics above threshold."""
    tags    = []
    metrics = {
        "culture_equity":  neck_up.culture_equity,
        "resilience":      neck_up.resilience,
        "coachability":    neck_up.coachability,
        "playmaking":      neck_up.playmaking,
        "defense":         neck_up.defense,
        "physical_output": neck_up.physical_output,
    }
    for rule in SECONDARY_TAG_RULES:
        if metrics.get(rule["metric"], 0) >= rule["min"]:
            tags.append(rule["tag"])
    return tags

def quest_assign_from_flags(athlete_id: str, flags: list) -> list:
    """Map deficiency flags to PRO-Quest templates."""
    quests = []
    for flag in flags:
        metric   = flag["neck_up_metric"]
        template = QUEST_TEMPLATES.get(metric)
        if template:
            quest = {
                **template,
                "athlete_id":     athlete_id,
                "auto_generated": False,
                "engine_version": ALGO["VERSION"],
            }
            quests.append(quest)
    return quests

# ── Routes ────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Checklist #7 — GET /health returns { status: operational }."""
    return {
        "status":    "operational",
        "service":   "hu-os-engine",
        "version":   ALGO["VERSION"],
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }

@app.post("/api/v1/audit/run")
def run_neural_audit(request: AuditRequest):
    """
    Full HeadsUp Neural Audit.
    Calculates PRO-Score, NER, OVR, flags deficiencies, assigns PRO-Quests.
    """
    # ── Neck Up calculations ──────────────────────────────────
    pro_score        = calc_pro_score(request.neck_up)
    ner              = calc_ner(request.neck_up)
    ovr              = calc_ovr(pro_score, ner)
    confidence_band  = calc_confidence_band(request.neck_up)
    market_position  = calc_market_position(ovr, pro_score)
    deficiency_flags = calc_deficiency_flags(request.neck_up)
    secondary_tags   = calc_secondary_tags(request.neck_up)

    # ── Sovereign verification ────────────────────────────────
    # Athlete is Sovereign verified when confidence band is High
    sovereign_verified = confidence_band == "High"

    # ── Quest assignment ──────────────────────────────────────
    # Checklist #8: deficiency below 80 triggers quest_assign_from_flags
    assigned_quests = quest_assign_from_flags(request.athlete_id, deficiency_flags)

    # Checklist #9: injury_status = True appends career pathway quests
    if request.injury_status:
        for cpq in CAREER_PATHWAY_QUESTS:
            assigned_quests.append({
                **cpq,
                "athlete_id":     request.athlete_id,
                "engine_version": ALGO["VERSION"],
            })

    return {
        "athlete_id":         request.athlete_id,
        "full_name":          request.full_name,
        "sovereign_verified": sovereign_verified,
        "neck_up": {
            "pro_score":       pro_score,
            "ner":             ner,
            "ovr":             ovr,
            "culture_equity":  request.neck_up.culture_equity,
            "resilience":      request.neck_up.resilience,
            "coachability":    request.neck_up.coachability,
            "playmaking":      request.neck_up.playmaking,
            "defense":         request.neck_up.defense,
            "physical_output": request.neck_up.physical_output,
            "confidence_band": confidence_band,
            "market_position": market_position,
        },
        "neck_down": {
            "sport":   request.neck_down.sport,
            "metrics": request.neck_down.metrics,
        },
        "deficiency_flags": deficiency_flags,
        "assigned_quests":  assigned_quests,
        "secondary_tags":   secondary_tags,
        "engine_version":   ALGO["VERSION"],
        "audit_timestamp":  datetime.datetime.utcnow().isoformat() + "Z",
    }

@app.post("/api/v1/athlete/{athlete_id}/xp")
def award_xp(athlete_id: str, request: XPAwardRequest):
    """
    XP award notification from Next.js after quest completion.
    Engine logs it — Supabase is the source of truth for XP totals.
    """
    return {
        "athlete_id": athlete_id,
        "xp_awarded": request.xp_awarded,
        "new_total":  request.new_total,
        "quest_id":   request.quest_id,
        "status":     "acknowledged",
        "timestamp":  datetime.datetime.utcnow().isoformat() + "Z",
    }
