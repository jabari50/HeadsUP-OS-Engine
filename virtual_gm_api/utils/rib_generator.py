"""
rib_generator.py — The Virtual GM · Weekly Roster Intelligence Brief (RIB)
Aggregates roster state, eligibility signals, sync history, and fit score changes
into a structured RIB object.  All data from the local SQLite DB — no hallucination.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from db.database import (
    get_all_players,
    get_fit_scores_for_operator,
    get_latest_rib,
    get_sync_events,
    insert_rib,
)
from models.data_models import (
    RIB,
    RIBAction,
    RIBEligibilityAlert,
    RIBGradeMove,
)

logger = logging.getLogger(__name__)

_GPA_WARN     = 2.0    # below this → INELIGIBLE flag
_GPA_WATCH    = 2.5    # below this → WARNING flag
_PASS_GRADE   = 70.0   # UIL No-Pass-No-Play threshold

# ── Week label helper ─────────────────────────────────────────────────────────

def _week_label() -> str:
    now = datetime.now(timezone.utc)
    # ISO week number label
    return now.strftime("Week of %b %d, %Y")


# ── Eligibility helpers ───────────────────────────────────────────────────────

def _classify_player(p: dict) -> str:
    """Return ELIGIBLE | WARNING | INELIGIBLE | PENDING based on GPA field."""
    gpa = p.get("gpa")
    if gpa is None:
        return "PENDING"
    if gpa < _GPA_WARN:
        return "INELIGIBLE"
    if gpa < _GPA_WATCH:
        return "WARNING"
    return "ELIGIBLE"


# ── Recommended-action builder ────────────────────────────────────────────────

def _build_actions(ineligible: list[dict], watch: list[dict],
                   pending: list[dict], fit_scores: list[dict]) -> list[RIBAction]:
    actions: list[RIBAction] = []

    for p in ineligible[:2]:  # top 2 ineligible → HIGH priority
        actions.append(RIBAction(
            priority="HIGH",
            title    =f"Resolve eligibility hold: #{p.get('player_id','?')} {p['full_name']}",
            detail   =(f"GPA {p['gpa']:.2f} is below 2.0 — confirm academic recovery "
                       f"plan before next UIL check."),
        ))

    for p in watch[:2]:       # top 2 on watch → MED
        actions.append(RIBAction(
            priority="MED",
            title    =f"Monitor academic standing: {p['full_name']}",
            detail   =(f"GPA {p['gpa']:.2f} is borderline (2.0–2.5). "
                       f"Schedule study hall or tutoring before next grading check."),
        ))

    if pending:
        actions.append(RIBAction(
            priority="MED",
            title    =f"{len(pending)} player(s) awaiting grade report",
            detail   ="Cannot certify eligibility until all teacher reports are submitted.",
        ))

    # Highest fit-score players not yet pursued
    pursue_targets = [
        fs for fs in fit_scores
        if fs.get("recommendation") == "PURSUE"
    ][:3]
    for fs in pursue_targets:
        actions.append(RIBAction(
            priority="LOW",
            title    =f"High-fit prospect ready to unlock (composite={fs['composite_score']})",
            detail   =(f"Player {fs['player_id']} scored PURSUE on fit analysis. "
                       f"Consume an unlock credit to access full profile."),
        ))

    return actions


# ── Main generator ────────────────────────────────────────────────────────────

def generate_rib(operator_id: str, db_path: str) -> RIB:
    """
    Build and persist a fresh RIB for the given operator.
    Every call writes a new RIB row to the DB and logs the event.
    """
    players    = get_all_players(db_path)
    fit_scores = get_fit_scores_for_operator(operator_id, db_path)
    sync_evts  = get_sync_events(operator_id, db_path, limit=30)

    # ── Roster counts ────────────────────────────────────────────────────────
    eligible_list   = [p for p in players if _classify_player(p) == "ELIGIBLE"]
    ineligible_list = [p for p in players if _classify_player(p) == "INELIGIBLE"]
    watch_list      = [p for p in players if _classify_player(p) == "WARNING"]
    pending_list    = [p for p in players if _classify_player(p) == "PENDING"]

    gpas = [p["gpa"] for p in players if p.get("gpa") is not None]
    team_gpa = round(sum(gpas) / len(gpas), 2) if gpas else None

    # ── Eligibility alerts ───────────────────────────────────────────────────
    alerts: list[RIBEligibilityAlert] = []
    for p in ineligible_list:
        alerts.append(RIBEligibilityAlert(
            player_id   = p["player_id"],
            player_name = p["full_name"],
            position    = p["position"],
            grade       = p.get("gpa"),
            priority    = "HIGH",
            status      = "INELIGIBLE",
        ))
    for p in watch_list:
        alerts.append(RIBEligibilityAlert(
            player_id   = p["player_id"],
            player_name = p["full_name"],
            position    = p["position"],
            grade       = p.get("gpa"),
            priority    = "MED",
            status      = "WARNING",
        ))
    for p in pending_list:
        alerts.append(RIBEligibilityAlert(
            player_id   = p["player_id"],
            player_name = p["full_name"],
            position    = p["position"],
            priority    = "MED",
            status      = "PENDING",
        ))

    # ── Grade moves (compare to last RIB) ───────────────────────────────────
    grade_moves: list[RIBGradeMove] = []
    last_rib = get_latest_rib(operator_id, db_path)
    if last_rib and last_rib.get("raw_json"):
        try:
            prev = json.loads(last_rib["raw_json"])
            prev_gpas: dict[str, float] = {
                a["player_id"]: a.get("grade", 0.0)
                for a in prev.get("eligibility_alerts", [])
            }
            for p in players:
                pid = p["player_id"]
                cur = p.get("gpa")
                old = prev_gpas.get(pid)
                if cur is not None and old is not None and cur != old:
                    direction = "up" if cur > old else "down"
                    grade_moves.append(RIBGradeMove(
                        player_name = p["full_name"],
                        subject     = "GPA",
                        from_grade  = old,
                        to_grade    = cur,
                        direction   = direction,
                        note        = f"GPA moved {old:.2f} → {cur:.2f}",
                    ))
        except (json.JSONDecodeError, KeyError) as exc:
            logger.warning("Could not parse previous RIB for grade moves: %s", exc)

    # ── Sync events (last 30) ────────────────────────────────────────────────
    sync_summaries = [
        f"{e['created_at'][:10]} | {e['event_type']} | {e['status']}"
        + (f" | {e['message']}" if e.get("message") else "")
        for e in sync_evts
    ]

    # ── Recommended actions ──────────────────────────────────────────────────
    actions = _build_actions(ineligible_list, watch_list, pending_list, fit_scores)

    # ── Assemble RIB ─────────────────────────────────────────────────────────
    rib = RIB(
        operator_id         = operator_id,
        week_label          = _week_label(),
        roster_count        = len(players),
        eligible_count      = len(eligible_list),
        ineligible_count    = len(ineligible_list),
        watch_count         = len(watch_list),
        team_gpa            = team_gpa,
        eligibility_alerts  = alerts,
        grade_moves         = grade_moves,
        sync_events         = sync_summaries,
        recommended_actions = actions,
    )
    rib.raw_json = rib.model_dump_json()

    # Persist — only the columns present in the ribs table DDL.
    # Sub-model lists (alerts, grade_moves, actions, sync_events) are stored
    # in raw_json; they are NOT separate columns in the DB schema.
    _DB_KEYS = {
        "rib_id", "operator_id", "week_label", "generated_at",
        "roster_count", "eligible_count", "ineligible_count",
        "watch_count", "team_gpa", "raw_json",
    }
    rib_dict = {k: v for k, v in rib.model_dump().items() if k in _DB_KEYS}
    insert_rib(rib_dict, db_path)
    logger.info(
        "RIB generated: operator=%s roster=%d eligible=%d ineligible=%d",
        operator_id, rib.roster_count, rib.eligible_count, rib.ineligible_count,
    )
    return rib
