"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        HeadsUp OS — Academy Suite Engine                                     ║
║        7-module gamified curriculum · difficulty state machine · rewards     ║
║        HeadsUp OS v3.2.0 | Render Deployment Target                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE:
    Replace static curriculum text with software-driven simulators. Each of
    the 7 Academy modules runs as an interactive game loop; this engine owns
    the difficulty state machine (Rookie → Hall of Fame), session telemetry
    (neck-up behavioral intelligence), and the reward pipeline that writes
    graduation metrics back into the prospect ledger via
    multi_sport_ledger.update_prospect_ledger().

MODULE REGISTRY (Part 2):
    M1 GM Front Office        — franchise roster/cap simulator + portal shocks
    M2 High-Stakes PR & Media — branching press-conference pod + countdown
    M3 NIL Endorsement Matrix — contract clause-scanning trap detection
    M4 Athlete Venture Studio — startup P&L / unit-economics tycoon
    M5 Executive War Room     — turn-based CBA/luxury-tax negotiation
    M6 Career Draft & Network — non-playing career RPG + interview boss battle
    M7 The IP Shield          — trademark/image-rights puzzle defense

DIFFICULTY LADDER (Part 3):
    Rookie → Pro → All-Star → Superstar → Hall of Fame (The Bar Exam).
    Hall of Fame: 3.0s timer, information blackout, >=95% accuracy gate;
    any critical error triggers an immediate state crash — session progress
    wiped, a slump_index telemetry point logged, module restart forced.

LEXICON ENFORCEMENT:
    ✅  Sovereign Asset    ❌  Player Report
    ✅  PRO-Quest          ❌  Development Module
    ✅  neck_up_*          ❌  behavioral_stats
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any, Optional

import numpy as np
import pandas as pd

from multi_sport_ledger import update_prospect_ledger

ENGINE_VERSION = "3.2.0"


def _utc_now() -> str:
    """Return a Z-suffixed UTC ISO timestamp (house format)."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — DIFFICULTY LEVEL CONFIGURATIONS  (Part 3)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class DifficultyConfig:
    """Immutable rule set for one game-level of the Academy ladder."""

    level_id: str
    label: str
    timer_duration: float        # seconds per decision; np.inf = untimed
    pass_threshold: float        # minimum accuracy (0–1) to graduate
    guided_walkthrough: bool     # high-visual UI cues + hints
    data_visibility: str         # full | static | asymmetric | compound | blackout
    speed_multiplier: float      # scales moving-element velocity in the UI
    injects_unverified_info: bool  # Superstar+: decoy data appears in-scenario
    crash_on_critical_error: bool  # Hall of Fame: wipe session on any critical
    xp_multiplier: float         # scales base module XP on graduation


DIFFICULTY_LEVELS: dict[str, DifficultyConfig] = {
    "rookie": DifficultyConfig(
        level_id="rookie", label="Rookie",
        timer_duration=np.inf, pass_threshold=0.60,
        guided_walkthrough=True, data_visibility="full",
        speed_multiplier=1.0, injects_unverified_info=False,
        crash_on_critical_error=False, xp_multiplier=1.0,
    ),
    "pro": DifficultyConfig(
        level_id="pro", label="Pro",
        timer_duration=30.0, pass_threshold=0.70,
        guided_walkthrough=False, data_visibility="static",
        speed_multiplier=1.0, injects_unverified_info=False,
        crash_on_critical_error=False, xp_multiplier=1.5,
    ),
    "all_star": DifficultyConfig(
        level_id="all_star", label="All-Star",
        timer_duration=15.0, pass_threshold=0.80,
        guided_walkthrough=False, data_visibility="asymmetric",
        speed_multiplier=1.5, injects_unverified_info=False,
        crash_on_critical_error=False, xp_multiplier=2.0,
    ),
    "superstar": DifficultyConfig(
        level_id="superstar", label="Superstar",
        timer_duration=7.0, pass_threshold=0.90,
        guided_walkthrough=False, data_visibility="compound",
        speed_multiplier=2.0, injects_unverified_info=True,
        crash_on_critical_error=False, xp_multiplier=3.0,
    ),
    "hall_of_fame": DifficultyConfig(
        level_id="hall_of_fame", label="Hall of Fame (The Bar Exam)",
        timer_duration=3.0, pass_threshold=0.95,
        guided_walkthrough=False, data_visibility="blackout",
        speed_multiplier=2.5, injects_unverified_info=True,
        crash_on_critical_error=True, xp_multiplier=5.0,
    ),
}


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — THE 7-MODULE REGISTRY  (Part 2)
# ─────────────────────────────────────────────────────────────────────────────
# Each entry declares its game-loop engine type, the live dashboard metrics
# the UI renders, the Skill Hexagon axis it levels, its credential badge, and
# base XP. Scenario content ships separately; this registry is the contract
# the front end and telemetry pipeline both build against.

ACADEMY_MODULES: dict[str, dict[str, Any]] = {
    "gm_front_office": {
        "module_no": 1,
        "title": "GM Front Office",
        "engine_type": "franchise_sim",           # roster draft + salary cap
        "event_injections": ["transfer_portal_shock"],
        "dashboard_metrics": ["cap_space", "roster_value", "arbitrage_delta"],
        "hexagon_axis": "Cap_Management",
        "credential_badge": "Capologist",
        "base_xp": 400,
    },
    "pr_media_pod": {
        "module_no": 2,
        "title": "High-Stakes PR & Media",
        "engine_type": "branching_dialog",        # press pod + countdown clock
        "event_injections": ["crisis_transcript"],
        "dashboard_metrics": [
            "brand_liability", "locker_room_cohesion", "draft_stock_volatility",
        ],
        "hexagon_axis": "Media_Composure",
        "credential_badge": "Media_Proof",
        "base_xp": 400,
    },
    "nil_endorsement_matrix": {
        "module_no": 3,
        "title": "NIL Endorsement Matrix",
        "engine_type": "clause_scanner",          # trap detection in contracts
        "event_injections": [
            "hidden_perpetuity_rights", "exclusive_circuit_limits",
            "termination_traps",
        ],
        "dashboard_metrics": ["traps_caught", "deal_value_protected"],
        "hexagon_axis": "Deal_Literacy",
        "credential_badge": "Deal_Hawk",
        "base_xp": 450,
    },
    "athlete_venture_studio": {
        "module_no": 4,
        "title": "Athlete Venture Studio",
        "engine_type": "tycoon_pnl",              # startup P&L simulator
        "event_injections": ["cash_crunch", "demand_spike"],
        "dashboard_metrics": ["runway_months", "unit_margin", "burn_rate"],
        "hexagon_axis": "Venture_Acumen",
        "credential_badge": "Founder_Mode",
        "base_xp": 450,
    },
    "executive_war_room": {
        "module_no": 5,
        "title": "Executive War Room",
        "engine_type": "negotiation_state_machine",  # CBA / broadcast rights
        "event_injections": ["lockout_threat", "streaming_rights_bid"],
        "dashboard_metrics": ["leverage_index", "tax_exposure", "media_rights_value"],
        "hexagon_axis": "League_Strategy",
        "credential_badge": "War_Room_Cleared",
        "base_xp": 500,
    },
    "career_draft_rpg": {
        "module_no": 6,
        "title": "The Sports Career Draft & Network RPG",
        "engine_type": "career_rpg",              # energy allocation + boss battle
        "event_injections": ["interview_boss_battle"],
        "dashboard_metrics": ["network_reach", "energy_remaining", "pathway_fit"],
        "hexagon_axis": "Career_Vision",
        "credential_badge": "Drafted_Off_Court",
        "base_xp": 400,
    },
    "ip_shield": {
        "module_no": 7,
        "title": "The IP Shield",
        "engine_type": "puzzle_defense",          # counter-strategy deployment
        "event_injections": ["counterfeit_merch_wave", "image_rights_grab"],
        "dashboard_metrics": ["brand_equity_score", "threats_neutralized"],
        "hexagon_axis": "Deal_Literacy",          # shares axis with Module 3
        "credential_badge": "IP_Shielded",
        "base_xp": 450,
    },
}

# The six Skill Hexagon Radar Chart axes (Modules 3 + 7 share Deal_Literacy)
HEXAGON_AXES: list[str] = [
    "Cap_Management", "Media_Composure", "Deal_Literacy",
    "Venture_Acumen", "League_Strategy", "Career_Vision",
]

# Hexagon axis gain per graduation = base_gain * difficulty xp_multiplier
HEXAGON_BASE_GAIN: float = 4.0
HEXAGON_AXIS_CAP: float = 99.0


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — SESSION STATE + TELEMETRY MODELS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class AcademySession:
    """Live state for one athlete attempt at one module/difficulty pairing."""

    session_id: str
    player: str
    module_id: str
    level_id: str
    status: str = "active"        # active | graduated | failed | crashed
    started_at: str = field(default_factory=_utc_now)
    ended_at: Optional[str] = None
    decisions_total: int = 0
    decisions_correct: int = 0
    critical_errors: int = 0
    timeouts: int = 0
    slump_events: int = 0         # state crashes logged this session chain
    telemetry: list[dict[str, Any]] = field(default_factory=list)

    @property
    def accuracy(self) -> float:
        """Running accuracy across scored decisions (0.0 when unscored)."""
        if self.decisions_total == 0:
            return 0.0
        return self.decisions_correct / self.decisions_total

    def to_dict(self) -> dict[str, Any]:
        """Serialize the session (dashboard/JSON-ready)."""
        payload = asdict(self)
        payload["accuracy"] = round(self.accuracy, 4)
        return payload


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — DIFFICULTY STATE ENGINE  (Parts 3 + 4)
# ─────────────────────────────────────────────────────────────────────────────

class AcademyDifficultyEngine:
    """State machine driving module sessions across the 5-level ladder.

    Usage:
        engine = AcademyDifficultyEngine()
        session = engine.start_session("Test QB One", "gm_front_office", "pro")
        engine.record_decision(session, correct=True, response_time=12.4)
        result = engine.close_session(session)
        ledger = engine.graduate(session, ledger)   # writes back to ledger
    """

    ENGINE_VERSION = ENGINE_VERSION

    def __init__(self) -> None:
        self.sessions: dict[str, AcademySession] = {}
        self.slump_log: list[dict[str, Any]] = []   # global slump telemetry

    # ── Session lifecycle ─────────────────────────────────────────────────

    def start_session(self, player: str, module_id: str,
                      level_id: str) -> AcademySession:
        """Open a fresh session for one athlete/module/difficulty pairing.

        Args:
            player: Ledger Player name (exact match, used for write-back).
            module_id: Key into ACADEMY_MODULES.
            level_id: Key into DIFFICULTY_LEVELS.

        Returns:
            A tracked, active AcademySession.

        Raises:
            KeyError: On unknown module_id or level_id (fail loud, no guessing).
        """
        if module_id not in ACADEMY_MODULES:
            raise KeyError(f"Unknown module '{module_id}'. "
                           f"Registered: {sorted(ACADEMY_MODULES)}")
        if level_id not in DIFFICULTY_LEVELS:
            raise KeyError(f"Unknown difficulty '{level_id}'. "
                           f"Registered: {sorted(DIFFICULTY_LEVELS)}")
        session = AcademySession(
            session_id=str(uuid.uuid4()), player=player,
            module_id=module_id, level_id=level_id,
        )
        self.sessions[session.session_id] = session
        return session

    def record_decision(self, session: AcademySession, correct: bool,
                        response_time: float,
                        critical: bool = False) -> AcademySession:
        """Score one in-game decision and enforce level rules.

        A response slower than the level's timer_duration counts as a timeout
        (scored incorrect). At Hall of Fame, any critical error triggers the
        state crash path immediately.

        Args:
            session: Active session to score against.
            correct: Whether the athlete's choice was correct.
            response_time: Seconds taken to decide.
            critical: Whether an incorrect choice was a critical error
                (e.g. signing a perpetuity clause, cap circumvention).

        Returns:
            The updated session (may transition to 'crashed').
        """
        if session.status != "active":
            return session
        config = DIFFICULTY_LEVELS[session.level_id]

        timed_out = response_time > config.timer_duration
        scored_correct = correct and not timed_out

        session.decisions_total += 1
        if scored_correct:
            session.decisions_correct += 1
        if timed_out:
            session.timeouts += 1
        if critical and not scored_correct:
            session.critical_errors += 1

        session.telemetry.append({
            "at": _utc_now(),
            "correct": scored_correct,
            "response_time": round(float(response_time), 2),
            "timed_out": timed_out,
            "critical": critical and not scored_correct,
        })

        # Hall of Fame punishment tier: immediate state crash
        if (critical and not scored_correct
                and config.crash_on_critical_error):
            self._state_crash(session)
        return session

    def _state_crash(self, session: AcademySession) -> None:
        """Wipe active progress, log a slump_index point, force restart."""
        session.status = "crashed"
        session.ended_at = _utc_now()
        slump_point = {
            "at": session.ended_at,
            "player": session.player,
            "module_id": session.module_id,
            "level_id": session.level_id,
            "decisions_before_crash": session.decisions_total,
            "accuracy_at_crash": round(session.accuracy, 4),
        }
        self.slump_log.append(slump_point)
        session.slump_events += 1
        # Progress wipe — telemetry survives (it already shipped), score resets
        session.decisions_total = 0
        session.decisions_correct = 0
        session.timeouts = 0

    def close_session(self, session: AcademySession) -> dict[str, Any]:
        """Finalize an active session against the level's pass threshold.

        Args:
            session: Session to close (crashed sessions stay crashed).

        Returns:
            Result dict: status, accuracy, threshold, and graduation flag.
        """
        config = DIFFICULTY_LEVELS[session.level_id]
        if session.status == "active":
            passed = (session.decisions_total > 0
                      and session.accuracy >= config.pass_threshold)
            session.status = "graduated" if passed else "failed"
            session.ended_at = _utc_now()
        return {
            "session_id": session.session_id,
            "player": session.player,
            "module_id": session.module_id,
            "level": config.label,
            "status": session.status,
            "accuracy": round(session.accuracy, 4),
            "pass_threshold": config.pass_threshold,
            "graduated": session.status == "graduated",
        }

    # ── Reward + ledger write-back  (Part 3 rewards → Part 4 hook) ────────

    def graduate(self, session: AcademySession,
                 ledger: pd.DataFrame) -> pd.DataFrame:
        """Map a graduated session to XP/badges and write back to the ledger.

        Rewards:
            - XP = module base_xp × difficulty xp_multiplier
            - Credential badge appended to the ledger badge string
            - Modules_Graduated incremented
            - Session slump events roll into the athlete's slump_index

        Args:
            session: A session whose status is 'graduated'.
            ledger: Prospect ledger from multi_sport_ledger.build_pro_file_ledger().

        Returns:
            Updated ledger DataFrame.

        Raises:
            ValueError: If the session has not actually graduated — rewards
                are never granted on unverified completion (Zero Hallucination).
        """
        if session.status != "graduated":
            raise ValueError(
                f"Session {session.session_id} is '{session.status}' — "
                "only graduated sessions earn rewards."
            )
        module = ACADEMY_MODULES[session.module_id]
        config = DIFFICULTY_LEVELS[session.level_id]
        xp_earned = int(module["base_xp"] * config.xp_multiplier)

        return update_prospect_ledger(ledger, session.player, {
            "Academy_XP": xp_earned,
            "Credential_Badges": module["credential_badge"],
            "Modules_Graduated": 1,
            "slump_index": session.slump_events,
        })

    def skill_hexagon(self, player: str,
                      baseline: Optional[dict[str, float]] = None
                      ) -> dict[str, float]:
        """Build the athlete's Skill Hexagon Radar Chart data.

        Every graduated session adds HEXAGON_BASE_GAIN × xp_multiplier to its
        module's axis, capped at HEXAGON_AXIS_CAP.

        Args:
            player: Ledger Player name.
            baseline: Optional starting axis values (defaults to all 0.0).

        Returns:
            Axis → value dict ordered by HEXAGON_AXES (radar-chart ready).
        """
        hexagon = {axis: 0.0 for axis in HEXAGON_AXES}
        if baseline:
            hexagon.update({k: float(v) for k, v in baseline.items()
                            if k in hexagon})
        for session in self.sessions.values():
            if session.player != player or session.status != "graduated":
                continue
            axis = ACADEMY_MODULES[session.module_id]["hexagon_axis"]
            gain = HEXAGON_BASE_GAIN * DIFFICULTY_LEVELS[session.level_id].xp_multiplier
            hexagon[axis] = min(HEXAGON_AXIS_CAP, hexagon[axis] + gain)
        return {axis: round(hexagon[axis], 1) for axis in HEXAGON_AXES}


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — SELF-TEST  (run: python academy_engine.py)
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from multi_sport_ledger import build_pro_file_ledger, CORE_COLUMNS

    ledger = build_pro_file_ledger([{
        "Player": "Test QB One", "High_School": "Duncanville",
        "Height": "6'3\"", "Status": "Active", "College": "",
        "public_rank": 12, "ranking_pool_size": 250,
        "accolades": "All-District, State Champion",
        "playbook_adaptation_index": 88, "presnap_box_count_timing": 91,
        "coverage_processing_velocity": 84,
    }], sport="football")

    engine = AcademyDifficultyEngine()

    # ── Pro-level GM Front Office run: 9/10 correct → graduates at 0.70 ──
    s1 = engine.start_session("Test QB One", "gm_front_office", "pro")
    for i in range(10):
        engine.record_decision(s1, correct=(i != 3), response_time=12.0)
    print(engine.close_session(s1))
    ledger = engine.graduate(s1, ledger)

    # ── Hall of Fame IP Shield run: critical error → state crash ─────────
    s2 = engine.start_session("Test QB One", "ip_shield", "hall_of_fame")
    engine.record_decision(s2, correct=True, response_time=2.1)
    engine.record_decision(s2, correct=False, response_time=2.8, critical=True)
    print(engine.close_session(s2))
    print(f"Slump log points: {len(engine.slump_log)}")

    print("\nSkill Hexagon:", engine.skill_hexagon("Test QB One"))
    print("\nLedger after graduation:")
    print(ledger[CORE_COLUMNS[:2] + ["Academy_XP", "Credential_Badges",
                                     "Modules_Graduated", "slump_index"]]
          .to_string(index=False))
