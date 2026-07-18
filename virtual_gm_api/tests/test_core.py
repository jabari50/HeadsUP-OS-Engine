"""
test_core.py — The Virtual GM · Core Unit Tests
Covers:
  • calculate_fit_score()     — all 4 dimensions + composite + recommendation
  • consume_unlock_credit()   — success, exhaustion, missing operator
  • generate_rib()            — structure, player counts, actions, persistence

Run:
    cd virtual_gm_api && python -m pytest tests/test_core.py -v

No live DB or PRO-File OS connection required.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

# Allow package imports from parent directory
sys.path.insert(0, str(Path(__file__).parent.parent))

from db.database import initialize_db, insert_operator, insert_player
from core.matchmaking_engine import calculate_fit_score
from db.database import consume_unlock_credit
from models.data_models import (
    FitRecommendation,
    LicenseTier,
    OperatorLicense,
    PlayerProfile,
    TIER_UNLOCK_LIMITS,
)
from utils.rib_generator import generate_rib


# ── Helpers ───────────────────────────────────────────────────────────────────

def _tmp_db() -> str:
    """Create a fresh in-memory-style temp DB for each test."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    initialize_db(path)
    return path


def _seed_operator(db_path: str, tier: str = "pro", max_unlocks: int | None = None) -> str:
    op = OperatorLicense(
        operator_name      = "Test Coach",
        email              = "test@lhs.edu",
        license_tier       = tier,
        max_unlocks        = max_unlocks if max_unlocks is not None
                             else TIER_UNLOCK_LIMITS[tier],
        approved_by_master = True,
    )
    d = op.model_dump()
    d["approved_by_master"] = int(d["approved_by_master"])
    return insert_operator(d, db_path)


def _seed_player(db_path: str, **overrides) -> str:
    defaults = dict(
        full_name      = "Test Player",
        position       = "SG",
        grad_year      = 2026,
        high_school    = "Test High",
        height_inches  = 75,
        gpa            = 3.1,
        data_source    = "manual",
    )
    defaults.update(overrides)
    p   = PlayerProfile(**defaults)
    pid = insert_player(p.model_dump(), db_path)
    return pid


# ── calculate_fit_score ───────────────────────────────────────────────────────

class TestCalculateFitScore(unittest.TestCase):

    def test_returns_fit_score_object(self):
        from models.data_models import FitScore
        fit = calculate_fit_score(
            player_id="p1", operator_id="op1",
            position="PG", grad_year=2026,
        )
        self.assertIsInstance(fit, FitScore)

    def test_composite_within_range(self):
        fit = calculate_fit_score(
            player_id="p1", operator_id="op1",
            position="PG", grad_year=2026,
            gpa=3.5, height_inches=73,
            roster_positions=["SG", "SF", "PF", "C"],
            program_system="Dribble-Drive Motion",
            target_grad_year=2026,
        )
        self.assertGreaterEqual(fit.composite_score, 0.0)
        self.assertLessEqual(fit.composite_score, 100.0)

    def test_pursue_recommendation_high_fit(self):
        """PG with 3.8 GPA, exact year match, critical gap → should PURSUE."""
        fit = calculate_fit_score(
            player_id="p2", operator_id="op1",
            position="PG", grad_year=2026,
            gpa=3.8, height_inches=74,
            roster_positions=["SF", "PF", "C"],   # no guard → gap
            program_system="Dribble-Drive Motion",
            target_grad_year=2026,
        )
        self.assertEqual(fit.recommendation, FitRecommendation.PURSUE.value)

    def test_pass_recommendation_low_fit(self):
        """Player committed with wrong position, stacked roster → PASS."""
        fit = calculate_fit_score(
            player_id="p3", operator_id="op1",
            position="C", grad_year=2025,
            gpa=1.5,
            eligibility_status="committed",
            roster_positions=["C", "C", "C", "C", "PF"],
            program_system="Dribble-Drive Motion",
            target_grad_year=2029,
        )
        self.assertEqual(fit.recommendation, FitRecommendation.PASS.value)

    def test_signals_populated(self):
        fit = calculate_fit_score(
            player_id="p4", operator_id="op1",
            position="SF", grad_year=2027,
        )
        self.assertIsInstance(fit.signals, list)
        self.assertGreater(len(fit.signals), 0)

    def test_system_fit_position_match(self):
        """SG in a 'pace & space' system → high system fit."""
        fit = calculate_fit_score(
            player_id="p5", operator_id="op1",
            position="SG", grad_year=2026,
            program_system="Pace & Space",
        )
        self.assertGreaterEqual(fit.system_fit, 90.0)

    def test_need_fit_no_gap(self):
        """Stacked position → low need_fit."""
        fit = calculate_fit_score(
            player_id="p6", operator_id="op1",
            position="PG", grad_year=2026,
            roster_positions=["PG", "PG", "PG", "PG", "PG"],
        )
        self.assertLessEqual(fit.need_fit, 25.0)

    def test_cultural_fit_committed_player(self):
        """Committed player → low cultural_fit."""
        fit = calculate_fit_score(
            player_id="p7", operator_id="op1",
            position="SF", grad_year=2026,
            gpa=3.9, eligibility_status="committed",
        )
        self.assertLessEqual(fit.cultural_fit, 40.0)

    def test_dimensions_non_negative(self):
        fit = calculate_fit_score(
            player_id="px", operator_id="ox",
            position="C", grad_year=2025,
            gpa=1.0, height_inches=60,
            eligibility_status="pro",
        )
        for dim in (fit.system_fit, fit.need_fit, fit.level_fit, fit.cultural_fit):
            self.assertGreaterEqual(dim, 0.0)


# ── consume_unlock_credit ─────────────────────────────────────────────────────

class TestConsumeUnlockCredit(unittest.TestCase):

    def test_success_decrements_credit(self):
        db = _tmp_db()
        op_id = _seed_operator(db, tier="solo", max_unlocks=2)
        result = consume_unlock_credit(op_id, db)
        self.assertTrue(result)

    def test_second_consume_still_succeeds_within_limit(self):
        db = _tmp_db()
        op_id = _seed_operator(db, tier="solo", max_unlocks=2)
        consume_unlock_credit(op_id, db)
        result = consume_unlock_credit(op_id, db)
        self.assertTrue(result)

    def test_credits_exhausted_returns_false(self):
        db = _tmp_db()
        op_id = _seed_operator(db, tier="solo", max_unlocks=1)
        consume_unlock_credit(op_id, db)    # uses the 1 credit
        result = consume_unlock_credit(op_id, db)   # now at 0
        self.assertFalse(result)

    def test_unknown_operator_returns_false(self):
        db = _tmp_db()
        result = consume_unlock_credit("nonexistent-id", db)
        self.assertFalse(result)

    def test_gm_tier_high_credits(self):
        """GM tier has 9999 max unlocks — should succeed many times."""
        db = _tmp_db()
        op_id = _seed_operator(db, tier="gm")
        for _ in range(20):
            result = consume_unlock_credit(op_id, db)
            self.assertTrue(result)


# ── generate_rib ──────────────────────────────────────────────────────────────

class TestGenerateRib(unittest.TestCase):

    def setUp(self):
        self.db     = _tmp_db()
        self.op_id  = _seed_operator(self.db)

    def test_rib_structure(self):
        from models.data_models import RIB
        rib = generate_rib(self.op_id, self.db)
        self.assertIsInstance(rib, RIB)
        self.assertEqual(rib.operator_id, self.op_id)
        self.assertIsNotNone(rib.week_label)
        self.assertIsNotNone(rib.generated_at)

    def test_empty_roster_counts_zero(self):
        rib = generate_rib(self.op_id, self.db)
        self.assertEqual(rib.roster_count, 0)
        self.assertEqual(rib.eligible_count, 0)
        self.assertIsNone(rib.team_gpa)

    def test_roster_counts_match_players(self):
        _seed_player(self.db, full_name="Player A", gpa=3.5)
        _seed_player(self.db, full_name="Player B", gpa=1.8)   # ineligible
        _seed_player(self.db, full_name="Player C", gpa=2.2)   # on watch
        _seed_player(self.db, full_name="Player D", gpa=None)  # pending

        rib = generate_rib(self.op_id, self.db)
        self.assertEqual(rib.roster_count, 4)
        self.assertEqual(rib.eligible_count,   1)
        self.assertEqual(rib.ineligible_count, 1)
        self.assertEqual(rib.watch_count,      1)

    def test_team_gpa_computed(self):
        _seed_player(self.db, full_name="A", gpa=3.0)
        _seed_player(self.db, full_name="B", gpa=2.0)
        rib = generate_rib(self.op_id, self.db)
        self.assertAlmostEqual(rib.team_gpa, 2.5, places=1)

    def test_ineligible_alert_generated(self):
        _seed_player(self.db, full_name="At Risk", gpa=1.5)
        rib = generate_rib(self.op_id, self.db)
        inelig = [a for a in rib.eligibility_alerts if a.status == "INELIGIBLE"]
        self.assertEqual(len(inelig), 1)
        self.assertEqual(inelig[0].player_name, "At Risk")

    def test_actions_list_is_non_empty_with_issues(self):
        _seed_player(self.db, full_name="Z", gpa=1.2)
        rib = generate_rib(self.op_id, self.db)
        self.assertGreater(len(rib.recommended_actions), 0)

    def test_rib_persisted_to_db(self):
        from db.database import get_latest_rib
        generate_rib(self.op_id, self.db)
        saved = get_latest_rib(self.op_id, self.db)
        self.assertIsNotNone(saved)
        self.assertEqual(saved["operator_id"], self.op_id)

    def test_raw_json_is_valid_json(self):
        rib = generate_rib(self.op_id, self.db)
        self.assertIsNotNone(rib.raw_json)
        parsed = json.loads(rib.raw_json)
        self.assertIn("operator_id", parsed)


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    unittest.main(verbosity=2)
