"""
╔══════════════════════════════════════════════════════════════════════════════╗
║          HeadsUp OS — 7-Gate Neural Arbitrage Engine                        ║
║          Neural Data Agency | HeadsUP MEDIA & Scouting                      ║
║          Version: 3.0.0 | Author: Jabari Johnson, Founder                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE:
    Ingest a raw prospect ledger (Pandas DataFrame) and route each athlete
    through 7 sequential evaluation gates. Each gate maps to a domain expert
    persona, mirrors a real-world evaluation discipline, and writes structured
    output back to the row.

    This is NOT a recruiting app — it is the digitization of 25 years of
    grassroots Dallas basketball intelligence into a B2B SaaS evaluation engine.

ARCHITECTURE:
    Gate 1 — DePodesta Audit      : Data completeness & statistical integrity
    Gate 2 — Hughes Neural Score  : PRO-Score (Culture Equity) — behavioral ROI
    Gate 3 — Showalter Baseline   : Coachability, Defense, Habits
    Gate 4 — Rich Paul Exec Check : Executive Pivot / Career Pathway flag
    Gate 5 — Presti Projection    : Correct collegiate level projection
    Gate 6 — Cuban Arbitrage Index: Production-vs-market-interest discrepancy
    Gate 7 — Jabari Override      : Founder Ground Truth — DFW real-world context

OUTPUT COLUMNS (B2B EXPORT SCHEMA):
    Standard  : Player, High_School, Height, Status, College
    Audit     : Verification_Needed, Verification_Flags
    Scoring   : neck_up_pro_score, neck_up_ner, ovr, Culture_Grade
    Strategy  : Arbitrage_Score, market_position, Executive_Pivot
    Routing   : projected_level, career_pathways, diamond_in_the_rough
    Meta      : engine_version, gate_log, founder_override_applied

VALIDATION ANCHOR (ZERO HALLUCINATION):
    All scoring math is validated against benchmark athlete Mike Boone
    (uuid-0004-boone): PRO: 82.30 | NER: 82.42 | OVR: 82.36

LEXICON ENFORCEMENT:
    ✅  neck_up_*            ❌  behavioral_stats
    ✅  Sovereign Asset      ❌  Player Report
    ✅  Neural Market Pos.   ❌  Market Classification
    ✅  PRO-Quest            ❌  Development Module
"""

import uuid
import json
import warnings
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

# NDA callable — Gate 2 delegates all scoring logic here
from nda_hughes_neural_score import nda_score_from_series

try:
    warnings.filterwarnings("ignore", category=pd.errors.SettingWithCopyWarning)
except AttributeError:
    pass  # pandas >= 3.0 removed SettingWithCopyWarning; safe to ignore


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — ALGORITHM CONSTANTS  (v3.0.0 — NEVER edit inline)
# Validation anchor: Mike Boone → PRO: 82.30 | NER: 82.42 | OVR: 82.36
# ─────────────────────────────────────────────────────────────────────────────

ALGO: dict[str, Any] = {
    "VERSION": "3.0.0",

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

    # Overall Rating composite
    "OVR_WEIGHTS": {
        "neck_up_pro_score": 0.50,
        "neck_up_ner":       0.50,
    },

    # Any Neck Up metric below this triggers a PRO-Quest
    "NECK_UP_DEFICIENCY_THRESHOLD": 80.0,

    # Confidence band (data completeness ratio thresholds)
    "CONFIDENCE_THRESHOLDS": {
        "High":   0.85,
        "Medium": 0.70,
        "Low":    0.00,
    },

    # Neural Market Position — evaluated top-to-bottom, first match wins
    # Diamond In The Rough (DTR) sits between Class A and B;
    # triggered algorithmically (arbitrage_score >= 85 + pro < 85) or founder override
    "MARKET_POSITIONS": [
        {"label": "Class A — Portal Killer",          "min_ovr": 85.0, "min_pro_score": 85.0},
        {"label": "Diamond In The Rough",             "min_ovr": 78.0, "min_pro_score": 75.0, "dtr_only": True},
        {"label": "Class B — Culture Equity",         "min_ovr": 75.0, "min_pro_score": 80.0},
        {"label": "Class C — Specialist",             "min_ovr": 65.0, "min_pro_score":  0.0},
        {"label": "Unclassified",                     "min_ovr":  0.0, "min_pro_score":  0.0},
    ],

    # Collegiate level projection thresholds (uses ovr)
    "LEVEL_THRESHOLDS": {
        "D1":   82.0,
        "D2":   72.0,
        "NAIA": 62.0,
        "JUCO": 50.0,
    },

    # Arbitrage score triggers Diamond In The Rough classification review
    "DTR_ARBITRAGE_TRIGGER": 80.0,

    # XP economy (for Sovereign Asset gamification layer)
    "XP": {
        "quest_complete":     150,
        "badge_earned":       250,
        "sovereign_verified": 500,
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — COLUMN DEFINITIONS  (enforced naming: neck_up_* / neck_down_*)
# ─────────────────────────────────────────────────────────────────────────────

# Columns required to pass Gate 1 completeness check
REQUIRED_IDENTITY_COLS: list[str] = [
    "Player", "High_School", "Height", "Position", "Graduation_Year",
]

# Neck Up behavioral input columns (fed into Hughes Neural Score)
NECK_UP_INPUT_COLS: list[str] = [
    "neck_up_culture_equity",   # 0–100 | adversity response, team-first behavior
    "neck_up_resilience",       # 0–100 | recovery from setbacks
    "neck_up_coachability",     # 0–100 | receptiveness to correction
    "neck_up_playmaking",       # 0–100 | decision-making, vision
    "neck_up_defense",          # 0–100 | effort, positioning, IQ
    "neck_up_physical_output",  # 0–100 | conditioning, athleticism rating
]

# Neck Down statistical input columns (sport-specific performance data)
NECK_DOWN_INPUT_COLS: list[str] = [
    "ppg",           # Points Per Game
    "rpg",           # Rebounds Per Game
    "apg",           # Assists Per Game
    "fg_pct",        # Field Goal %
    "three_pct",     # 3-Point %
    "offers",        # Verified scholarship/program offers (integer)
    "gpa",           # Academic GPA
    "accolades",     # Text: honors, rankings, awards
    "career_interests",  # Text: self-reported post-playing interests
    "entitlement_flags", # Integer count: coachability red flags observed
]

# Final B2B export column order
EXPORT_COLUMNS: list[str] = [
    "audit_id", "Player", "High_School", "Position", "Height",
    "Graduation_Year", "Status", "College",
    "Verification_Needed", "Verification_Flags",
    "neck_up_pro_score", "neck_up_ner", "ovr",
    "Culture_Grade", "Arbitrage_Score", "market_position",
    "diamond_in_the_rough", "projected_level",
    "Executive_Pivot", "career_pathways",
    "deficiency_flags", "confidence_band",
    "founder_override_applied", "gate_log",
    "engine_version", "audit_timestamp",
]


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — UTILITY FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def _safe_float(value: Any, default: float = 0.0) -> float:
    """Safely cast any value to float; returns default on failure."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    """Safely cast any value to int; returns default on failure."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _is_missing(value: Any) -> bool:
    """Return True if a field is functionally empty."""
    if value is None:
        return True
    if isinstance(value, float) and np.isnan(value):
        return True
    if isinstance(value, str) and value.strip() in ("", "N/A", "Unknown", "Verification_Needed"):
        return True
    return False


def _culture_grade(pro_score: float) -> str:
    """
    Map a numeric PRO-Score to a letter grade for B2B display.

    Args:
        pro_score: Computed neck_up_pro_score (0–100 scale).

    Returns:
        Single-letter grade string: A+, A, B+, B, C+, C, D, F.
    """
    if pro_score >= 95:  return "A+"
    if pro_score >= 88:  return "A"
    if pro_score >= 83:  return "B+"
    if pro_score >= 75:  return "B"
    if pro_score >= 68:  return "C+"
    if pro_score >= 60:  return "C"
    if pro_score >= 50:  return "D"
    return "F"


def _assign_market_position(ovr: float, pro_score: float, is_dtr: bool = False) -> str:
    """
    Evaluate Neural Market Position top-to-bottom; first match wins.
    Diamond In The Rough (DTR) only fires if is_dtr=True (algorithmic trigger
    or Jabari Override).

    Args:
        ovr:       Overall Rating composite.
        pro_score: PRO-Score (behavioral ROI).
        is_dtr:    Whether DTR flag has been raised by Gate 6 or Gate 7.

    Returns:
        Market position label string per ALGO["MARKET_POSITIONS"].
    """
    for position in ALGO["MARKET_POSITIONS"]:
        if position.get("dtr_only") and not is_dtr:
            continue
        if ovr >= position["min_ovr"] and pro_score >= position["min_pro_score"]:
            return position["label"]
    return "Unclassified"


def _assign_confidence_band(completeness_ratio: float) -> str:
    """
    Assign confidence band based on data completeness ratio.

    Args:
        completeness_ratio: Float 0.0–1.0 (filled fields / total expected fields).

    Returns:
        'High', 'Medium', or 'Low'.
    """
    thresholds = ALGO["CONFIDENCE_THRESHOLDS"]
    if completeness_ratio >= thresholds["High"]:   return "High"
    if completeness_ratio >= thresholds["Medium"]: return "Medium"
    return "Low"


def _project_level(ovr: float) -> str:
    """
    Project the correct collegiate competition level from OVR.

    Args:
        ovr: Overall Rating composite.

    Returns:
        Level string: 'D1', 'D2', 'NAIA', 'JUCO', or 'Unplaced'.
    """
    thresholds = ALGO["LEVEL_THRESHOLDS"]
    if ovr >= thresholds["D1"]:   return "D1"
    if ovr >= thresholds["D2"]:   return "D2"
    if ovr >= thresholds["NAIA"]: return "NAIA"
    if ovr >= thresholds["JUCO"]: return "JUCO"
    return "Unplaced"


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — HeadsUpArbitrageEngine  (7 Gates)
# ─────────────────────────────────────────────────────────────────────────────

class HeadsUpArbitrageEngine:
    """
    The HeadsUp OS 7-Gate Neural Arbitrage Engine.

    Processes a raw prospect DataFrame through 7 sequential expert-persona gates,
    writing scored, flagged, and routed outputs back to each row. Returns a
    fully graded B2B export DataFrame ready for coach portal delivery.

    The algorithm is the digitization of 25 years and 40,000 hours of DFW
    grassroots basketball intelligence — every gate maps to a real evaluation
    discipline the Founder has applied manually in the field.

    Usage:
        engine = HeadsUpArbitrageEngine()
        results = engine.process_ledger(raw_df)

    Override DFW context before processing:
        engine.register_override("Zach Lee", {
            "founder_note": "SSAC Tournament MVP. Dominant at every level.",
            "force_market_position": "Class A — Portal Killer",
            "dtr_flag": True
        })
    """

    ENGINE_VERSION: str = ALGO["VERSION"]

    def __init__(self) -> None:
        """Initialize engine with empty override registry."""
        self._overrides: dict[str, dict] = {}
        self._gate_order: list[str] = [
            "depodesta_audit",
            "hughes_neural_score",
            "showalter_baseline",
            "rich_paul_executive_check",
            "presti_timeline_projection",
            "cuban_arbitrage_index",
            "jabari_override",
        ]

    # ──────────────────────────────────────────────────────────────────────────
    # OVERRIDE REGISTRY
    # ──────────────────────────────────────────────────────────────────────────

    def register_override(self, player_name: str, override_data: dict) -> None:
        """
        Register a Jabari Override for a named athlete before ledger processing.

        Supported keys in override_data:
            founder_note         (str)  : DFW ground-truth observation
            force_market_position (str) : Bypass algorithmic position assignment
            dtr_flag             (bool) : Manually trigger Diamond In The Rough
            force_projected_level (str) : Override the Presti level projection
            force_career_pathways (list): Override career pathway list
            exclude_from_export  (bool) : Internal-only flag (cautionary cases)

        Args:
            player_name:   Exact string match against 'Player' column.
            override_data: Dict of override keys.
        """
        self._overrides[player_name.strip()] = override_data

    # ──────────────────────────────────────────────────────────────────────────
    # GATE 1 — DePodesta Audit  (Data Completeness & Statistical Integrity)
    # ──────────────────────────────────────────────────────────────────────────

    def depodesta_audit(self, row: pd.Series) -> pd.Series:
        """
        Gate 1: The Quantitative Enforcer.

        Validates data completeness across identity, Neck Up, and Neck Down
        fields. Sets Verification_Needed = True and logs specific flags for
        any missing, statistically impossible, or unverifiable entry.

        Completeness ratio drives the confidence band assigned at the end
        of processing.

        Args:
            row: A single athlete row from the prospect DataFrame.

        Returns:
            Row with Verification_Needed (bool), Verification_Flags (list),
            and gate_log updated with Gate 1 audit result.
        """
        flags: list[str] = []
        all_fields = REQUIRED_IDENTITY_COLS + NECK_UP_INPUT_COLS + NECK_DOWN_INPUT_COLS
        filled = 0

        # ── Identity completeness ──────────────────────────────────────────
        for col in REQUIRED_IDENTITY_COLS:
            if col in row.index and not _is_missing(row.get(col)):
                filled += 1
            else:
                flags.append(f"MISSING_IDENTITY:{col}")

        # ── Height sanity check ────────────────────────────────────────────
        height = _safe_float(row.get("Height", 0))
        if height < 60 or height > 90:
            flags.append(f"INVALID_HEIGHT:{height}in — expected 60–90in range")

        # ── GPA sanity check ───────────────────────────────────────────────
        gpa = _safe_float(row.get("gpa", -1), default=-1)
        if gpa != -1 and (gpa < 0.0 or gpa > 4.0):
            flags.append(f"INVALID_GPA:{gpa} — expected 0.0–4.0")

        # ── Neck Up completeness ───────────────────────────────────────────
        for col in NECK_UP_INPUT_COLS:
            val = row.get(col)
            if not _is_missing(val):
                score = _safe_float(val)
                if 0 <= score <= 100:
                    filled += 1
                else:
                    flags.append(f"OUT_OF_RANGE:{col}={score} — expected 0–100")
            else:
                flags.append(f"MISSING_NECK_UP:{col}")

        # ── Neck Down / statistical completeness ──────────────────────────
        for col in NECK_DOWN_INPUT_COLS:
            if col in row.index and not _is_missing(row.get(col)):
                filled += 1
            else:
                flags.append(f"MISSING_NECK_DOWN:{col}")

        # ── PPG / APG sanity ───────────────────────────────────────────────
        ppg = _safe_float(row.get("ppg", 0))
        if ppg > 60:
            flags.append(f"SUSPICIOUS_PPG:{ppg} — exceeds plausible single-game avg")

        # ── Verification outcome ───────────────────────────────────────────
        completeness_ratio = filled / max(len(all_fields), 1)
        verification_needed = len(flags) > 0

        row = row.copy()
        row["Verification_Needed"]   = verification_needed
        row["Verification_Flags"]    = flags
        row["_completeness_ratio"]   = round(completeness_ratio, 3)
        row["confidence_band"]       = _assign_confidence_band(completeness_ratio)
        row["gate_log"] = row.get("gate_log", []) + [
            f"Gate1_DePodesta: completeness={completeness_ratio:.1%} | "
            f"flags={len(flags)} | confidence={row['confidence_band']}"
        ]
        return row

    # ──────────────────────────────────────────────────────────────────────────
    # GATE 2 — Hughes Neural Score  (NDA Callable — delegated)
    # ──────────────────────────────────────────────────────────────────────────

    def hughes_neural_score(self, row: pd.Series) -> pd.Series:
        """
        Gate 2: The Behavioral Auditor.

        DELEGATED to the Neural Data Agency standalone callable:
            nda_hughes_neural_score.nda_score_from_series()

        All scoring logic — weights, entitlement penalty, deficiency flags,
        PRO-Quest templates, behavioral signals — lives in the NDA module.
        This gate is a thin adapter: call NDA bridge, merge result into row.

        Architecture benefit:
            FastAPI endpoint (nda_router.py) and this gate share identical
            math. One change to nda_hughes_neural_score.py propagates both.

        Args:
            row: Athlete row with neck_up_* fields populated.

        Returns:
            Row with neck_up_pro_score, neck_up_ner, Culture_Grade,
            deficiency_flags, pro_quests_triggered, _nda_score_id written.
        """
        row = row.copy()

        # ── Delegate to NDA callable ──────────────────────────────────────
        nda_fields = nda_score_from_series(row)

        # ── Merge NDA output back into row ────────────────────────────────
        for field, value in nda_fields.items():
            if field == "_gate2_log":
                row["gate_log"] = row.get("gate_log", []) + [value]
            else:
                row[field] = value

        return row

    # ──────────────────────────────────────────────────────────────────────────
    # GATE 3 — Showalter Baseline  (Coachability, Defense, Habits)
    # ──────────────────────────────────────────────────────────────────────────

    def showalter_baseline(self, row: pd.Series) -> pd.Series:
        """
        Gate 3: The National Standard.

        Applies the 4:00 AM Standard — checking for markers of extreme
        coachability, defensive commitment, and disciplined daily habits.
        Penalizes entitlement indicators and assigns a Showalter_Pass flag
        used in downstream export filtering.

        Scoring logic:
            PASS   : coachability ≥ 78 AND defense ≥ 72 AND entitlement_flags ≤ 1
            WATCH  : coachability ≥ 68 OR defense ≥ 65 (borderline)
            FAIL   : anything below WATCH thresholds

        Args:
            row: Athlete row with neck_up_coachability and neck_up_defense.

        Returns:
            Row with Showalter_Pass ('PASS'|'WATCH'|'FAIL') and gate_log updated.
        """
        row = row.copy()

        coachability      = _safe_float(row.get("neck_up_coachability", 0))
        defense           = _safe_float(row.get("neck_up_defense",      0))
        entitlement_flags = _safe_int(row.get("entitlement_flags",      0))

        # ── 4:00 AM Standard evaluation ───────────────────────────────────
        if coachability >= 78 and defense >= 72 and entitlement_flags <= 1:
            baseline = "PASS"
        elif coachability >= 68 or defense >= 65:
            baseline = "WATCH"
        else:
            baseline = "FAIL"

        # ── Entitlement escalation ────────────────────────────────────────
        if entitlement_flags >= 3:
            baseline = "FAIL"
            row["gate_log"] = row.get("gate_log", []) + [
                f"Gate3_Showalter: ESCALATED to FAIL — "
                f"entitlement_flags={entitlement_flags} ≥ 3 (locker room liability threshold)"
            ]

        row["Showalter_Pass"] = baseline
        row["gate_log"] = row.get("gate_log", []) + [
            f"Gate3_Showalter: baseline={baseline} | "
            f"coachability={coachability} | defense={defense} | "
            f"entitlement_flags={entitlement_flags}"
        ]
        return row

    # ──────────────────────────────────────────────────────────────────────────
    # GATE 4 — Rich Paul Executive Check  (Post-Playing Career Pivot)
    # ──────────────────────────────────────────────────────────────────────────

    def rich_paul_executive_check(self, row: pd.Series) -> pd.Series:
        """
        Gate 4: The Post-Playing Pivot.

        Per The Heads Up! Foundation mission, every athlete profile must
        include a career pathway beyond playing. This gate checks
        career_interests and academic context, flags blanks, and routes
        the athlete to applicable career tracks.

        Career Pathways (6 tracks):
            Front Office | Sports Agency | Collegiate Coaching |
            Media/Broadcasting | Sports Analytics | General

        Trigger logic:
            - injury_status = True  → all 6 pathways appended (mandatory)
            - career_interests set  → matched against keyword map
            - blank career_interests → Executive_Pivot = True (flag for counseling)

        Args:
            row: Athlete row with career_interests (text) and injury_status (bool).

        Returns:
            Row with Executive_Pivot (bool) and career_pathways (list).
        """
        row = row.copy()

        career_interests = str(row.get("career_interests", "")).strip().lower()
        injury_status    = bool(row.get("injury_status",    False))
        gpa              = _safe_float(row.get("gpa", 0.0))

        # ── Keyword-to-pathway map ────────────────────────────────────────
        KEYWORD_MAP: dict[str, list[str]] = {
            "Front Office":          ["gm", "front office", "management", "operations",
                                      "business", "entrepreneurship", "finance", "capology"],
            "Sports Agency":         ["agent", "law", "legal", "contracts", "negotiation",
                                      "representation", "nil"],
            "Collegiate Coaching":   ["coach", "coaching", "player development", "teaching"],
            "Media/Broadcasting":    ["media", "broadcast", "journalism", "content",
                                      "social media", "podcast", "film"],
            "Sports Analytics":      ["analytics", "data", "statistics", "tech", "technology",
                                      "computer science", "engineering"],
            "General":               [],  # fallback — always available
        }

        # ── Injury status: all pathways mandatory (Foundation mission rule) ─
        if injury_status:
            pathways = list(KEYWORD_MAP.keys())
            executive_pivot = True
            row["gate_log"] = row.get("gate_log", []) + [
                "Gate4_RichPaul: injury_status=True — all career pathways activated (Foundation mission)"
            ]
        else:
            pathways = []
            for pathway, keywords in KEYWORD_MAP.items():
                if any(kw in career_interests for kw in keywords):
                    pathways.append(pathway)

            # ── GPA ≥ 3.5 unlocks Sports Agency track automatically ────────
            if gpa >= 3.5 and "Sports Agency" not in pathways:
                pathways.append("Sports Agency")
                row["gate_log"] = row.get("gate_log", []) + [
                    f"Gate4_RichPaul: GPA={gpa} ≥ 3.5 — Sports Agency pathway unlocked"
                ]

            # ── Blank career_interests = Executive Pivot flag ─────────────
            if _is_missing(row.get("career_interests")):
                executive_pivot = True
                pathways = ["General"]
                row["gate_log"] = row.get("gate_log", []) + [
                    "Gate4_RichPaul: career_interests BLANK — Executive_Pivot=True flagged for counseling"
                ]
            else:
                executive_pivot = len(pathways) == 0
                if executive_pivot:
                    pathways = ["General"]

        row["Executive_Pivot"]  = executive_pivot
        row["career_pathways"]  = pathways
        row["gate_log"] = row.get("gate_log", []) + [
            f"Gate4_RichPaul: pathways={pathways} | Executive_Pivot={executive_pivot}"
        ]
        return row

    # ──────────────────────────────────────────────────────────────────────────
    # GATE 5 — Presti Timeline Projection  (Collegiate Level Routing)
    # ──────────────────────────────────────────────────────────────────────────

    def presti_timeline_projection(self, row: pd.Series) -> pd.Series:
        """
        Gate 5: The Asset GM.

        Projects the correct collegiate competition level based on OVR,
        height, stat production, and verified accolades. Computes OVR as
        the 50/50 split of PRO-Score and NER per ALGO v3.0.0.

        Level thresholds (OVR-based):
            D1   : OVR ≥ 82.0
            D2   : OVR ≥ 72.0
            NAIA : OVR ≥ 62.0
            JUCO : OVR ≥ 50.0
            Unplaced: OVR < 50.0

        Height modifiers applied:
            +2.0 OVR if height ≥ 79in (6'7"+) — positional premium
            -1.5 OVR if height < 66in (5'5") — major market limitation

        Args:
            row: Athlete row with neck_up_pro_score, neck_up_ner, Height.

        Returns:
            Row with ovr (computed), projected_level, market_position,
            diamond_in_the_rough flag.
        """
        row = row.copy()

        pro_score = _safe_float(row.get("neck_up_pro_score", 0))
        ner       = _safe_float(row.get("neck_up_ner",       0))
        height    = _safe_float(row.get("Height",            0))

        # ── OVR composite (50/50 split — locked v3.0.0) ───────────────────
        w = ALGO["OVR_WEIGHTS"]
        ovr_raw = (pro_score * w["neck_up_pro_score"]) + (ner * w["neck_up_ner"])

        # ── Height modifier ───────────────────────────────────────────────
        height_modifier = 0.0
        if height >= 79:
            height_modifier = +2.0
        elif height < 66:
            height_modifier = -1.5

        ovr = round(min(99.0, max(0.0, ovr_raw + height_modifier)), 2)

        # ── Level projection ──────────────────────────────────────────────
        projected_level = _project_level(ovr)

        # ── Diamond In The Rough check ────────────────────────────────────
        # DTR: athlete is under-recruited relative to their OVR score
        offers  = _safe_int(row.get("offers", 0))
        is_dtr  = (ovr >= 78.0) and (offers <= 2) and (pro_score >= 75.0)

        # ── Neural Market Position ────────────────────────────────────────
        market_position = _assign_market_position(ovr, pro_score, is_dtr=is_dtr)

        row["ovr"]                  = ovr
        row["projected_level"]      = projected_level
        row["market_position"]      = market_position
        row["diamond_in_the_rough"] = is_dtr

        row["gate_log"] = row.get("gate_log", []) + [
            f"Gate5_Presti: OVR={ovr} (PRO={pro_score}, NER={ner}, "
            f"height_mod={height_modifier:+.1f}) | level={projected_level} | "
            f"position={market_position} | DTR={is_dtr}"
        ]
        return row

    # ──────────────────────────────────────────────────────────────────────────
    # GATE 6 — Cuban Arbitrage Index  (Production vs. Market Interest)
    # ──────────────────────────────────────────────────────────────────────────

    def cuban_arbitrage_index(self, row: pd.Series) -> pd.Series:
        """
        Gate 6: The Market Disruptor.

        Calculates the HU-OS Arbitrage Score — the quantified discrepancy
        between an athlete's verified production/behavioral profile and
        their current market interest (scholarship offers). High discrepancy =
        High Market Arbitrage = undervalued Sovereign Asset.

        Formula:
            production_index = weighted composite of OVR, PPG, RPG, APG,
                               GPA, FG%, 3P%, and accolade bonus
            market_index     = normalized offer count (0–10 scale cap at 15+)
            arbitrage_score  = max(0, production_index - market_index) * scaling factor

        Arbitrage threshold for DTR confirmation:
            arbitrage_score ≥ ALGO["DTR_ARBITRAGE_TRIGGER"] (80.0)
            → confirms diamond_in_the_rough = True

        Args:
            row: Athlete row with stats and offer count.

        Returns:
            Row with Arbitrage_Score and diamond_in_the_rough confirmed/escalated.
        """
        row = row.copy()

        ovr     = _safe_float(row.get("ovr",       0))
        ppg     = _safe_float(row.get("ppg",        0))
        rpg     = _safe_float(row.get("rpg",        0))
        apg     = _safe_float(row.get("apg",        0))
        fg_pct  = _safe_float(row.get("fg_pct",     0))
        t3_pct  = _safe_float(row.get("three_pct",  0))
        gpa     = _safe_float(row.get("gpa",        0))
        offers  = _safe_int(row.get("offers",        0))
        accolades = str(row.get("accolades",         "")).lower()

        # ── Accolade bonus (measurable documented honors) ─────────────────
        ACCOLADE_KEYWORDS = [
            "all-conference", "all-state", "mvp", "player of the year",
            "poy", "first team", "all-american", "district",
            "tournament mvp", "regional champion", "top 25",
        ]
        accolade_bonus = sum(5.0 for kw in ACCOLADE_KEYWORDS if kw in accolades)
        accolade_bonus = min(accolade_bonus, 25.0)  # cap at 25 pts

        # ── Production index (0–100 scale) ────────────────────────────────
        # OVR already on 0–100; stats normalized to typical elite ranges
        production_index = (
            (ovr         * 0.35) +
            (min(ppg / 30, 1.0) * 100 * 0.20) +   # 30 PPG = max
            (min(rpg / 15, 1.0) * 100 * 0.10) +   # 15 RPG = max
            (min(apg / 12, 1.0) * 100 * 0.08) +   # 12 APG = max
            (fg_pct      * 0.12) +                  # already 0–100 (pct × 100)
            (t3_pct      * 0.05) +
            (min(gpa / 4.0, 1.0) * 100 * 0.10) +
            accolade_bonus
        )
        production_index = min(production_index, 100.0)

        # ── Market index (offer saturation, 0–100 scale) ──────────────────
        # 15+ offers = fully saturated market = zero arbitrage
        market_index = min(offers / 15.0, 1.0) * 100.0

        # ── Arbitrage Score ───────────────────────────────────────────────
        raw_arbitrage = max(0.0, production_index - market_index)
        arbitrage_score = round(raw_arbitrage * 1.05, 2)  # slight upward scaling
        arbitrage_score = min(arbitrage_score, 100.0)

        # ── Confirm DTR if arbitrage clears threshold ─────────────────────
        dtr_trigger = ALGO["DTR_ARBITRAGE_TRIGGER"]
        if arbitrage_score >= dtr_trigger and not row.get("diamond_in_the_rough", False):
            row["diamond_in_the_rough"] = True
            row["market_position"] = _assign_market_position(
                ovr, _safe_float(row.get("neck_up_pro_score", 0)), is_dtr=True
            )
            row["gate_log"] = row.get("gate_log", []) + [
                f"Gate6_Cuban: Arbitrage={arbitrage_score} ≥ {dtr_trigger} — "
                f"DTR confirmed → market_position={row['market_position']}"
            ]

        row["Arbitrage_Score"]   = arbitrage_score
        row["_production_index"] = round(production_index, 2)
        row["_market_index"]     = round(market_index, 2)

        row["gate_log"] = row.get("gate_log", []) + [
            f"Gate6_Cuban: production={production_index:.1f} | "
            f"market={market_index:.1f} | arbitrage={arbitrage_score} | "
            f"accolade_bonus={accolade_bonus:.1f}"
        ]
        return row

    # ──────────────────────────────────────────────────────────────────────────
    # GATE 7 — Jabari Override  (Founder Ground Truth)
    # ──────────────────────────────────────────────────────────────────────────

    def jabari_override(self, row: pd.Series) -> pd.Series:
        """
        Gate 7: The Founder Ground Truth.

        Applies manual override data registered via register_override().
        This gate reflects 25 years of DFW basketball context — real-world
        intel that no algorithm can replicate from historical data alone.

        Override keys honored:
            founder_note          (str)  : Logged to gate_log, readable in export
            force_market_position (str)  : Overwrites algorithmic market_position
            dtr_flag              (bool) : Force Diamond In The Rough designation
            force_projected_level (str)  : Overwrites Presti level projection
            force_career_pathways (list) : Replaces career_pathways list
            exclude_from_export   (bool) : Marks row as internal-only (cautionary)

        No override is applied if the athlete name is not in the registry.

        Args:
            row: Athlete row post-Gate 6.

        Returns:
            Row with override fields applied and founder_override_applied=True,
            or unchanged with founder_override_applied=False.
        """
        row = row.copy()
        player_name = str(row.get("Player", "")).strip()

        if player_name not in self._overrides:
            row["founder_override_applied"] = False
            row["gate_log"] = row.get("gate_log", []) + [
                "Gate7_Jabari: no override registered"
            ]
            return row

        override = self._overrides[player_name]
        applied_keys: list[str] = []

        # ── Apply each registered override key ────────────────────────────
        if "founder_note" in override:
            row["founder_note"] = override["founder_note"]
            applied_keys.append("founder_note")

        if "force_market_position" in override:
            row["market_position"] = override["force_market_position"]
            applied_keys.append("force_market_position")

        if override.get("dtr_flag", False):
            row["diamond_in_the_rough"] = True
            # Re-evaluate market position with DTR=True if not already forced
            if "force_market_position" not in override:
                row["market_position"] = _assign_market_position(
                    _safe_float(row.get("ovr", 0)),
                    _safe_float(row.get("neck_up_pro_score", 0)),
                    is_dtr=True,
                )
            applied_keys.append("dtr_flag")

        if "force_projected_level" in override:
            row["projected_level"] = override["force_projected_level"]
            applied_keys.append("force_projected_level")

        if "force_career_pathways" in override:
            row["career_pathways"] = override["force_career_pathways"]
            applied_keys.append("force_career_pathways")

        if override.get("exclude_from_export", False):
            row["_internal_only"] = True
            applied_keys.append("exclude_from_export")

        row["founder_override_applied"] = True
        row["gate_log"] = row.get("gate_log", []) + [
            f"Gate7_Jabari: OVERRIDE APPLIED — keys={applied_keys} | "
            f"note='{override.get('founder_note', 'N/A')}'"
        ]
        return row

    # ──────────────────────────────────────────────────────────────────────────
    # ORCHESTRATION — process_ledger()
    # ──────────────────────────────────────────────────────────────────────────

    def process_ledger(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Orchestrate all 7 gates across an entire prospect DataFrame.

        Processing order (enforced):
            1. depodesta_audit          → completeness + data integrity
            2. hughes_neural_score      → PRO-Score + NER + deficiency flags
            3. showalter_baseline       → coachability + defense standard
            4. rich_paul_executive_check→ career pathways + Executive Pivot
            5. presti_timeline_projection → OVR + level projection + market pos
            6. cuban_arbitrage_index    → Arbitrage Score + DTR confirmation
            7. jabari_override          → Founder Ground Truth corrections

        Post-processing:
            - Assigns audit_id (UUID) to every row
            - Stamps engine_version and audit_timestamp
            - Filters internal-only (cautionary) rows from B2B export
            - Returns only EXPORT_COLUMNS (+ any dynamically added override fields)

        Args:
            df: Raw prospect DataFrame. Missing columns are safe — gates handle
                missing data gracefully via _is_missing() and _safe_float().

        Returns:
            B2B export DataFrame — fully graded, routed, and flagged.
        """
        print(f"\n{'═'*68}")
        print(f"  HeadsUp OS Neural Arbitrage Engine v{self.ENGINE_VERSION}")
        print(f"  Neural Data Agency | HeadsUP MEDIA & Scouting")
        print(f"  Processing {len(df)} athletes through 7 evaluation gates...")
        print(f"{'═'*68}\n")

        # Initialize output columns to prevent KeyError across gates
        df = df.copy()
        init_cols: dict[str, Any] = {
            "gate_log":               [[] for _ in range(len(df))],
            "Verification_Needed":    False,
            "Verification_Flags":     [[] for _ in range(len(df))],
            "deficiency_flags":       [[] for _ in range(len(df))],
            "career_pathways":        [[] for _ in range(len(df))],
            "_internal_only":         False,
            "founder_override_applied": False,
            "audit_id":               [str(uuid.uuid4()) for _ in range(len(df))],
            "engine_version":         self.ENGINE_VERSION,
            "audit_timestamp":        datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }
        for col, val in init_cols.items():
            if col not in df.columns:
                df[col] = val

        # ── Run all 7 gates row-by-row ────────────────────────────────────
        GATE_FNS = [
            ("Gate 1", "depodesta_audit",           self.depodesta_audit),
            ("Gate 2", "hughes_neural_score",        self.hughes_neural_score),
            ("Gate 3", "showalter_baseline",         self.showalter_baseline),
            ("Gate 4", "rich_paul_executive_check",  self.rich_paul_executive_check),
            ("Gate 5", "presti_timeline_projection", self.presti_timeline_projection),
            ("Gate 6", "cuban_arbitrage_index",      self.cuban_arbitrage_index),
            ("Gate 7", "jabari_override",            self.jabari_override),
        ]

        results: list[pd.Series] = []
        for idx, raw_row in df.iterrows():
            row = raw_row.copy()
            row["gate_log"] = []
            player_name = str(row.get("Player", f"Row_{idx}"))
            print(f"  ▶ Processing: {player_name}")

            for gate_label, gate_name, gate_fn in GATE_FNS:
                try:
                    row = gate_fn(row)
                except Exception as e:
                    row["gate_log"] = row.get("gate_log", []) + [
                        f"{gate_label}_{gate_name}: ERROR — {str(e)}"
                    ]
                    print(f"    ⚠ {gate_label} error for {player_name}: {e}")

            results.append(row)

        # ── Assemble output DataFrame ─────────────────────────────────────
        output_df = pd.DataFrame(results)

        # Filter internal-only (cautionary) profiles — never in B2B export
        internal_count = output_df["_internal_only"].sum()
        if internal_count > 0:
            print(f"\n  ⚠ {internal_count} internal-only profile(s) excluded from export.")
        output_df = output_df[~output_df["_internal_only"]]

        # ── Enforce export columns (include any dynamically added fields) ──
        available_export_cols = [c for c in EXPORT_COLUMNS if c in output_df.columns]
        extra_cols = [c for c in output_df.columns
                      if c not in EXPORT_COLUMNS and not c.startswith("_")]
        final_cols = available_export_cols + extra_cols
        output_df = output_df[final_cols]

        # ── Summary report ────────────────────────────────────────────────
        print(f"\n{'─'*68}")
        print(f"  PROCESSING COMPLETE — {len(output_df)} athletes graded\n")

        if "market_position" in output_df.columns:
            pos_summary = output_df["market_position"].value_counts()
            print("  NEURAL MARKET POSITION DISTRIBUTION:")
            for pos, count in pos_summary.items():
                print(f"    {pos:<38} {count:>3} athlete(s)")

        if "diamond_in_the_rough" in output_df.columns:
            dtr_count = output_df["diamond_in_the_rough"].sum()
            print(f"\n  ◆ Diamond In The Rough candidates identified: {dtr_count}")

        if "Verification_Needed" in output_df.columns:
            verify_count = output_df["Verification_Needed"].sum()
            print(f"  ⚑ Profiles flagged for verification:         {verify_count}")

        print(f"{'─'*68}\n")
        return output_df.reset_index(drop=True)


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — TEST LEDGER  (Dummy DataFrame)
# Zero Hallucination: all values are clearly labeled as synthetic test data
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":

    # ── Test Ledger: 6 synthetic prospect profiles ────────────────────────
    # Note: Zach Lee / Micah Clark / Tra'Davien Young are active placement
    # pipeline names. The data below is SYNTHETIC for engine testing only.
    # Production profiles must be seeded from verified scouting records.

    RAW_LEDGER = pd.DataFrame([

        # ── Profile 1: Elite Portal Killer candidate ──────────────────────
        {
            "Player":           "TEST_Malik_Rivers",
            "High_School":      "TEST_Dallas_Prep_Academy",
            "Position":         "PG",
            "Height":           74,          # inches (6'2")
            "Graduation_Year":  2025,
            "Status":           "Transfer Portal",
            "College":          "Mid-Major D1",
            "ppg":              21.4,
            "rpg":               4.1,
            "apg":               7.8,
            "fg_pct":           48.0,
            "three_pct":        38.5,
            "offers":            2,           # LOW — high arbitrage candidate
            "gpa":               3.8,
            "accolades":        "All-Conference First Team, Tournament MVP, District Player of the Year",
            "career_interests": "front office, analytics, entrepreneurship",
            "entitlement_flags": 0,
            "injury_status":    False,
            "neck_up_culture_equity":  91.0,
            "neck_up_resilience":      87.0,
            "neck_up_coachability":    88.0,
            "neck_up_playmaking":      90.0,
            "neck_up_defense":         82.0,
            "neck_up_physical_output": 85.0,
        },

        # ── Profile 2: Diamond In The Rough — undervalued wing ────────────
        {
            "Player":           "TEST_Darius_Forte",
            "High_School":      "TEST_Cedar_Hill_HS",
            "Position":         "SF",
            "Height":           78,          # inches (6'6")
            "Graduation_Year":  2026,
            "Status":           "High School Senior",
            "College":          None,
            "ppg":              18.9,
            "rpg":               8.2,
            "apg":               3.1,
            "fg_pct":           52.0,
            "three_pct":        34.5,
            "offers":            1,           # CRITICALLY under-recruited
            "gpa":               3.1,
            "accolades":        "All-District First Team, Regional Champion",
            "career_interests": "coaching, player development",
            "entitlement_flags": 0,
            "injury_status":    False,
            "neck_up_culture_equity":  84.0,
            "neck_up_resilience":      81.0,
            "neck_up_coachability":    85.0,
            "neck_up_playmaking":      79.5,
            "neck_up_defense":         88.0,
            "neck_up_physical_output": 86.0,
        },

        # ── Profile 3: Culture Equity — strong PRO, borderline NER ────────
        {
            "Player":           "TEST_Jerome_Knox",
            "High_School":      "TEST_Lancaster_HS",
            "Position":         "SG",
            "Height":           75,
            "Graduation_Year":  2025,
            "Status":           "Graduate Transfer",
            "College":          "Small College",
            "ppg":              14.5,
            "rpg":               3.2,
            "apg":               4.5,
            "fg_pct":           44.0,
            "three_pct":        37.8,
            "offers":            4,
            "gpa":               3.5,
            "accolades":        "All-State Honorable Mention",
            "career_interests": "media, broadcasting, journalism",
            "entitlement_flags": 1,
            "injury_status":    False,
            "neck_up_culture_equity":  88.0,
            "neck_up_resilience":      85.0,
            "neck_up_coachability":    82.0,
            "neck_up_playmaking":      75.0,
            "neck_up_defense":         78.0,
            "neck_up_physical_output": 74.0,
        },

        # ── Profile 4: High entitlement — locker room liability risk ──────
        {
            "Player":           "TEST_Brandon_Holt",
            "High_School":      "TEST_Mesquite_HS",
            "Position":         "PF",
            "Height":           80,
            "Graduation_Year":  2026,
            "Status":           "High School Senior",
            "College":          None,
            "ppg":              23.0,
            "rpg":              11.5,
            "apg":               1.2,
            "fg_pct":           56.0,
            "three_pct":        22.0,
            "offers":            8,
            "gpa":               2.1,
            "accolades":        "All-State",
            "career_interests": "",           # blank — Executive Pivot triggered
            "entitlement_flags": 4,           # HIGH — locker room liability
            "injury_status":    False,
            "neck_up_culture_equity":  62.0,
            "neck_up_resilience":      70.0,
            "neck_up_coachability":    55.0,  # tanked by entitlement penalty
            "neck_up_playmaking":      80.0,
            "neck_up_defense":         72.0,
            "neck_up_physical_output": 90.0,
        },

        # ── Profile 5: Injury-flagged — career pathway full activation ─────
        {
            "Player":           "TEST_Anthony_Wells",
            "High_School":      "TEST_Duncanville_HS",
            "Position":         "C",
            "Height":           82,
            "Graduation_Year":  2024,
            "Status":           "Medically Inactive",
            "College":          "D1 Scholarship — Medical Hardship",
            "ppg":               9.0,
            "rpg":               8.5,
            "apg":               1.1,
            "fg_pct":           59.0,
            "three_pct":         0.0,
            "offers":            0,
            "gpa":               3.9,
            "accolades":        "All-Conference Second Team",
            "career_interests": "sports analytics, data science",
            "entitlement_flags": 0,
            "injury_status":    True,         # all career pathways auto-activated
            "neck_up_culture_equity":  90.0,
            "neck_up_resilience":      88.0,
            "neck_up_coachability":    92.0,
            "neck_up_playmaking":      71.0,
            "neck_up_defense":         76.0,
            "neck_up_physical_output": 68.0,  # injury reflected
        },

        # ── Profile 6: Incomplete data — verification required ─────────────
        {
            "Player":           "TEST_Carlos_Vega",
            "High_School":      "TEST_Unknown_Prep",
            "Position":         "SG",
            "Height":           0,            # missing → Gate 1 flags
            "Graduation_Year":  2026,
            "Status":           "Unsigned",
            "College":          None,
            "ppg":              None,         # missing
            "rpg":              None,         # missing
            "apg":              None,         # missing
            "fg_pct":           None,
            "three_pct":        None,
            "offers":            0,
            "gpa":               None,
            "accolades":        "",
            "career_interests": None,
            "entitlement_flags": 0,
            "injury_status":    False,
            "neck_up_culture_equity":  None,  # missing Neck Up data
            "neck_up_resilience":      None,
            "neck_up_coachability":    None,
            "neck_up_playmaking":      None,
            "neck_up_defense":         None,
            "neck_up_physical_output": None,
        },
    ])

    # ── Initialize Engine & Register Overrides ─────────────────────────────
    engine = HeadsUpArbitrageEngine()

    # Register Jabari Override for TEST_Darius_Forte (DTR confirmation)
    engine.register_override("TEST_Darius_Forte", {
        "founder_note": (
            "Evaluated live at the DFW All-Star Showcase. Motor is elite. "
            "High motor, no ego — rare combination at 6'6\". Coaches sleeping on this kid."
        ),
        "dtr_flag": True,
        "force_projected_level": "D1",
    })

    # Register internal-only cautionary case (never in B2B export)
    # — mirrors the two Dallas Kimball HS cases in the alumni ledger
    engine.register_override("TEST_Brandon_Holt", {
        "founder_note": "INTERNAL ONLY — elite Neck Down, catastrophic Neck Up. Cautionary arc.",
        "exclude_from_export": True,
    })

    # ── Process Ledger ─────────────────────────────────────────────────────
    results = engine.process_ledger(RAW_LEDGER)

    # ── Display B2B Export Summary ─────────────────────────────────────────
    DISPLAY_COLS = [
        "Player", "Position", "projected_level", "ovr",
        "neck_up_pro_score", "neck_up_ner", "Culture_Grade",
        "Arbitrage_Score", "market_position", "diamond_in_the_rough",
        "Verification_Needed", "Executive_Pivot",
    ]
    display_cols_avail = [c for c in DISPLAY_COLS if c in results.columns]

    pd.set_option("display.max_columns",   20)
    pd.set_option("display.width",        160)
    pd.set_option("display.float_format", "{:.2f}".format)

    print("\n  ── B2B EXPORT PREVIEW (public-facing athletes only) ──\n")
    print(results[display_cols_avail].to_string(index=False))

    # ── Validation Anchor: Mike Boone cross-check ─────────────────────────
    # Run the locked benchmark payload through the engine standalone
    print("\n\n  ── VALIDATION ANCHOR: Mike Boone (uuid-0004-boone) ──")
    boone_row = pd.Series({
        "Player":           "Mike Boone",
        "High_School":      "DFW Elite Prep",
        "Position":         "SG",
        "Height":           74,
        "Graduation_Year":  2026,
        "Status":           "Active",
        "College":          None,
        "ppg":              16.0,
        "rpg":               5.0,
        "apg":               3.0,
        "fg_pct":           48.0,
        "three_pct":        36.0,
        "offers":            3,
        "gpa":               3.2,
        "accolades":        "All-Conference",
        "career_interests": "front office",
        "entitlement_flags": 0,
        "injury_status":    False,
        "neck_up_culture_equity":  88.0,
        "neck_up_resilience":      76.0,
        "neck_up_coachability":    82.0,
        "neck_up_playmaking":      85.0,
        "neck_up_defense":         78.5,
        "neck_up_physical_output": 84.0,
        "gate_log":                [],
    })

    boone_row = engine.depodesta_audit(boone_row)
    boone_row = engine.hughes_neural_score(boone_row)
    boone_row = engine.presti_timeline_projection(boone_row)

    print(f"  PRO-Score : {boone_row['neck_up_pro_score']:.2f}  (expected: 82.30)")
    print(f"  NER       : {boone_row['neck_up_ner']:.2f}  (expected: 82.42)")
    print(f"  OVR       : {boone_row['ovr']:.2f}  (expected: 82.36)")

    pro_match = abs(boone_row["neck_up_pro_score"] - 82.30) < 0.01
    ner_match  = abs(boone_row["neck_up_ner"]       - 82.42) < 0.01
    ovr_match  = abs(boone_row["ovr"]               - 82.36) < 0.05

    print(f"\n  {'✅ VALIDATION PASSED — engine is production ready.' if all([pro_match, ner_match, ovr_match]) else '❌ VALIDATION FAILED — do not deploy.'}")
    print(f"{'═'*68}\n")
