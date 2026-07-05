"""
Engine integrity benchmarks — Definition of Done item 3.

The Portal Anchor athlete is the locked regression vector for THIS engine
(computed once from the verbatim-ported ovr_engine and frozen). Any drift in
any literal below is an engine failure, not a build pass.

Boone canonical (PRO 82.30 / NER 82.42 / OVR 82.36) is the cross-engine anchor
from the NDA Hughes pipeline at repo root; it is documented and drift-guarded
here as constants. NOTE: the v1.0 handoff cited "Boone = 81.82" — that figure
appears nowhere in the codebase and is NOT used.

Benchmark locks cleared by LLM Council 2026-07-05 (HIGH confidence, unanimous):
storage/council_benchmark_lock_2026-07-05.json. Changing any locked literal
requires an engine version bump and a new council session.
"""

import hashlib
import hmac
import json
import time

import pytest

from badge_engine import evaluate_badges
from data_models import BOONE_CANONICAL, FullIntakePayload
from ovr_engine import (
    NEURAL_WEIGHT,
    PHYSICAL_WEIGHT,
    TECHNICAL_WEIGHT,
    calculate_ovr,
    convert_technical_to_99,
    get_tier,
)
from pipeline import normalize
from quest_engine import seed_starter_quests

# ── Locked Portal Anchor vector ─────────────────────────────────────────────
ANCHOR_TECHNICAL = {
    "ball_handling": 8, "shooting": 9, "finishing": 7, "passing": 8,
    "defense": 7, "rebounding": 6, "athleticism": 8,
}
ANCHOR_NEURAL = {
    "composure": 88, "coachability": 82, "iq": 85,
    "resilience": 76, "leadership": 80, "drive": 90,
}
ANCHOR_PHYSICAL = 84.0

ANCHOR_OVR = 78.7
ANCHOR_TIER = "Impact"
ANCHOR_TECHNICAL_AVG = 72.6
ANCHOR_NEURAL_AVG = 83.5
ANCHOR_CONTRIBUTIONS = {"technical": 32.6, "neural": 29.2, "physical": 16.8}
ANCHOR_BADGES = ["floor_general", "motor", "sniper"]

TEST_SECRET = "test-secret-not-a-real-credential"


class TestGroundedConstants:
    def test_weights_locked(self):
        assert TECHNICAL_WEIGHT == 0.45
        assert NEURAL_WEIGHT == 0.35
        assert PHYSICAL_WEIGHT == 0.20

    def test_conversion_bounds(self):
        assert convert_technical_to_99(1) == 1.0
        assert convert_technical_to_99(10) == 99.0
        assert convert_technical_to_99(5.5) == 50.0

    def test_tier_boundaries(self):
        assert get_tier(85.0) == "Elite"
        assert get_tier(84.9) == "Impact"
        assert get_tier(70.0) == "Impact"
        assert get_tier(69.9) == "Contributor"
        assert get_tier(55.0) == "Contributor"
        assert get_tier(54.9) == "Developing"
        assert get_tier(40.0) == "Developing"
        assert get_tier(39.9) == "Prospect"

    def test_boone_canonical_documented(self):
        assert BOONE_CANONICAL["pro_score"] == 82.30
        assert BOONE_CANONICAL["ner"] == 82.42
        assert BOONE_CANONICAL["ovr"] == 82.36
        assert BOONE_CANONICAL["athlete_id"] == "uuid-0004-boone"


class TestPortalAnchor:
    def test_locked_ovr(self):
        result = calculate_ovr(ANCHOR_TECHNICAL, ANCHOR_NEURAL, ANCHOR_PHYSICAL)
        assert result["ovr"] == ANCHOR_OVR
        assert result["tier"] == ANCHOR_TIER
        assert result["technical_avg"] == ANCHOR_TECHNICAL_AVG
        assert result["neural_avg"] == ANCHOR_NEURAL_AVG
        assert result["breakdown"]["technical_contribution"] == ANCHOR_CONTRIBUTIONS["technical"]
        assert result["breakdown"]["neural_contribution"] == ANCHOR_CONTRIBUTIONS["neural"]
        assert result["breakdown"]["physical_contribution"] == ANCHOR_CONTRIBUTIONS["physical"]

    def test_independent_formula_agreement(self):
        """Recompute OVR from the raw formula independently of the engine."""
        converted = [((v - 1) / 9) * 98 + 1 for v in ANCHOR_TECHNICAL.values()]
        t_avg = sum(converted) / len(converted)
        n_avg = sum(ANCHOR_NEURAL.values()) / len(ANCHOR_NEURAL)
        expected = round(min(99.0, max(1.0, t_avg * 0.45 + n_avg * 0.35 + ANCHOR_PHYSICAL * 0.20)), 1)
        assert calculate_ovr(ANCHOR_TECHNICAL, ANCHOR_NEURAL, ANCHOR_PHYSICAL)["ovr"] == expected

    def _player_data(self):
        result = calculate_ovr(ANCHOR_TECHNICAL, ANCHOR_NEURAL, ANCHOR_PHYSICAL)
        return {
            "technical": {f"{k}_converted": v for k, v in result["technical_converted"].items()},
            "neural": ANCHOR_NEURAL,
            "ovr": result["ovr"],
        }

    def test_locked_badges(self):
        badges = sorted(b.badge_id for b in evaluate_badges(self._player_data()))
        assert badges == ANCHOR_BADGES

    def test_locked_quest_arc(self):
        quests = seed_starter_quests(self._player_data())
        assert [q.title for q in quests] == ["Own the Glass", "Bounce Back Stronger", "Reach Elite Tier"]
        assert quests[0].current_value == 55.4 and quests[0].target_value == 65.4
        assert quests[1].current_value == 76 and quests[1].target_value == 86.0
        assert quests[2].current_value == 78.7 and quests[2].target_value == 85.0


class TestProQuestGate:
    """PRO-Quest trigger: any Neck Up Marker below 80.0 fires a development
    quest (one-pager rule, preserved exactly). Boundary is strict."""

    def _neural_quests(self, neural):
        quests = seed_starter_quests({"neural": neural})
        return [q for q in quests if q.target_attribute.startswith("neural.")]

    def test_gate_value_locked(self):
        from quest_engine import PRO_QUEST_NEURAL_GATE
        assert PRO_QUEST_NEURAL_GATE == 80.0

    def test_marker_just_below_gate_fires(self):
        quests = self._neural_quests({"composure": 79.9, "iq": 90})
        assert [q.target_attribute for q in quests] == ["neural.composure"]

    def test_marker_at_gate_does_not_fire(self):
        assert self._neural_quests({"composure": 80.0, "iq": 90}) == []

    def test_marker_above_gate_does_not_fire(self):
        assert self._neural_quests({"composure": 80.1, "iq": 90}) == []

    def test_every_sub_gate_marker_fires_weakest_first(self):
        quests = self._neural_quests(
            {"composure": 62, "coachability": 85, "iq": 79, "resilience": 45}
        )
        assert [q.target_attribute for q in quests] == [
            "neural.resilience", "neural.composure", "neural.iq",
        ]

    def test_all_markers_at_or_above_gate_fire_nothing(self):
        neural = {k: 80 for k in
                  ["composure", "coachability", "iq", "resilience", "leadership", "drive"]}
        assert self._neural_quests(neural) == []

    def test_missing_neural_data_fires_nothing(self):
        assert self._neural_quests({}) == []
        assert seed_starter_quests({}) == []

    def test_none_marker_never_fabricated(self):
        quests = self._neural_quests({"composure": None, "iq": 70})
        assert [q.target_attribute for q in quests] == ["neural.iq"]

    def test_target_capped_at_scale_max(self):
        quests = self._neural_quests({"drive": 79.5})
        assert quests[0].target_value == 89.5
        floor_quests = self._neural_quests({"drive": 1})
        assert floor_quests[0].target_value == 11.0


VALID_FULL_INTAKE = {
    "name": "Portal Anchor",
    "position": "SG",
    "classification": "HS",
    "school": "DFW Elite Prep",
    "class_year": "2026",
    "height_ft": 6, "height_in": 2, "height_inches": 74,
    "physical_score": 84.0,
    "technical": ANCHOR_TECHNICAL,
    "neural": ANCHOR_NEURAL,
}


class TestGate5Validation:
    def test_valid_payload_passes(self):
        FullIntakePayload(**VALID_FULL_INTAKE)

    def test_bad_position_rejected(self):
        with pytest.raises(Exception):
            FullIntakePayload(**{**VALID_FULL_INTAKE, "position": "POINT"})

    def test_height_cross_field_rejected(self):
        with pytest.raises(Exception):
            FullIntakePayload(**{**VALID_FULL_INTAKE, "height_inches": 80})

    def test_out_of_bounds_technical_rejected(self):
        bad = {**VALID_FULL_INTAKE, "technical": {**ANCHOR_TECHNICAL, "shooting": 11}}
        with pytest.raises(Exception):
            FullIntakePayload(**bad)

    def test_unknown_field_rejected(self):
        with pytest.raises(Exception):
            FullIntakePayload(**{**VALID_FULL_INTAKE, "ovr": 99})

    def test_score_injection_via_extra_forbid(self):
        bad = {**VALID_FULL_INTAKE, "neural": {**ANCHOR_NEURAL, "ovr": 99}}
        with pytest.raises(Exception):
            FullIntakePayload(**bad)


class TestPipeline:
    def test_scout_manual_scored(self):
        result = normalize("scout_manual", VALID_FULL_INTAKE)
        assert result["kind"] == "scored"
        assert result["canonical"]["height_in"] == 74
        assert result["canonical"]["technical"]["shooting"] == 9

    def test_combine_csv_row_isolation(self):
        bad_row = {**VALID_FULL_INTAKE, "position": "WING"}
        result = normalize("combine_csv", {"rows": [VALID_FULL_INTAKE, bad_row]})
        assert result["rows"][0]["ok"] is True
        assert result["rows"][1]["ok"] is False
        assert result["rows"][1]["errors"]

    def test_free_agents_provisional_unscored(self):
        result = normalize("free_agents", {
            "name": "Walk-On Kid", "position": "PG", "classification": "HS",
        })
        assert result["kind"] == "provisional"
        assert "technical" not in result["canonical"]
        assert "physical_score" not in result["canonical"]

    def test_ner_anchor_enum_whitelist(self):
        athlete = {"name": "A", "position": "PG", "classification": "HS"}
        result = normalize("ner_anchor", {"athlete": athlete, "responses": {"composure": "B"}})
        assert result["canonical"]["neural"]["composure"] == 78.0
        with pytest.raises(ValueError):
            normalize("ner_anchor", {"athlete": athlete, "responses": {"composure": "Z"}})
        with pytest.raises(ValueError):
            normalize("ner_anchor", {"athlete": athlete, "responses": {"swagger": "A"}})

    def test_film_event_tags_whitelisted_no_scores(self):
        athlete = {"name": "A", "position": "SF", "classification": "HS"}
        result = normalize("film_event", {
            "athlete": athlete,
            "events": [{"tag": "made_three", "count": 4}, {"tag": "steal", "count": 2}],
        })
        assert result["observations"] == {"shooting": 4, "defense": 2}
        with pytest.raises(ValueError):
            normalize("film_event", {"athlete": athlete, "events": [{"tag": "vibes", "count": 1}]})

    def test_unknown_source_rejected(self):
        with pytest.raises(ValueError):
            normalize("dark_web", VALID_FULL_INTAKE)


def _signed_headers(body: bytes, secret: str = TEST_SECRET, timestamp: str = None) -> dict:
    ts = timestamp if timestamp is not None else str(int(time.time()))
    signature = hmac.new(secret.encode(), f"{ts}.".encode() + body, hashlib.sha256).hexdigest()
    return {"X-HU-Timestamp": ts, "X-HU-Signature": signature, "Content-Type": "application/json"}


class TestApiSecurity:
    @pytest.fixture()
    def client(self):
        from fastapi.testclient import TestClient
        from hu_os_api_v4 import app
        return TestClient(app)

    def test_health_open(self, client):
        assert client.get("/health").status_code == 200

    def test_unsigned_request_rejected(self, client):
        response = client.post("/v4/score", json={})
        assert response.status_code == 401

    def test_stale_timestamp_rejected(self, client):
        body = json.dumps({"technical": ANCHOR_TECHNICAL, "neural": ANCHOR_NEURAL,
                           "physical_score": 84.0}).encode()
        stale = str(int(time.time()) - 3600)
        response = client.post("/v4/score", content=body,
                               headers=_signed_headers(body, timestamp=stale))
        assert response.status_code == 401

    def test_tampered_body_rejected(self, client):
        body = json.dumps({"technical": ANCHOR_TECHNICAL, "neural": ANCHOR_NEURAL,
                           "physical_score": 84.0}).encode()
        headers = _signed_headers(body)
        tampered = body.replace(b"84.0", b"99.0")
        response = client.post("/v4/score", content=tampered, headers=headers)
        assert response.status_code == 401

    def test_signed_score_matches_anchor(self, client):
        body = json.dumps({"technical": ANCHOR_TECHNICAL, "neural": ANCHOR_NEURAL,
                           "physical_score": 84.0}).encode()
        response = client.post("/v4/score", content=body, headers=_signed_headers(body))
        assert response.status_code == 200
        data = response.json()
        assert data["computed"]["ovr"] == ANCHOR_OVR
        assert data["computed"]["tier"] == ANCHOR_TIER
        assert sorted(b["badge_id"] for b in data["badges"]) == ANCHOR_BADGES

    def test_matchmake_weights_locked(self, client):
        body = json.dumps({"style_fit": 80, "need_fit": 70, "level_fit": 60,
                           "cultural_fit": 50}).encode()
        response = client.post("/v4/matchmake", content=body, headers=_signed_headers(body))
        assert response.status_code == 200
        data = response.json()
        # 80*.30 + 70*.30 + 60*.25 + 50*.15 = 24 + 21 + 15 + 7.5 = 67.5
        assert data["fit_score"] == 67.5
        assert data["recommendation"] == "Monitor"

    def test_matchmake_recommendation_bands(self, client):
        for subscores, expected in [
            ({"style_fit": 100, "need_fit": 100, "level_fit": 100, "cultural_fit": 100}, "Pursue"),
            ({"style_fit": 40, "need_fit": 40, "level_fit": 40, "cultural_fit": 40}, "Pass"),
        ]:
            body = json.dumps(subscores).encode()
            response = client.post("/v4/matchmake", content=body, headers=_signed_headers(body))
            assert response.json()["recommendation"] == expected

    def test_intake_process_free_agent_unscored(self, client):
        body = json.dumps({"source": "free_agents", "payload": {
            "name": "Walk-On Kid", "position": "PG", "classification": "HS"}}).encode()
        response = client.post("/v4/intake/process", content=body, headers=_signed_headers(body))
        assert response.status_code == 200
        data = response.json()
        assert data["kind"] == "provisional"
        assert data["computed"] is None      # never fabricated

    def test_intake_process_rejection_shape(self, client):
        body = json.dumps({"source": "scout_manual", "payload": {"name": "X"}}).encode()
        response = client.post("/v4/intake/process", content=body, headers=_signed_headers(body))
        assert response.status_code == 422
        assert response.json()["status"] == "rejected"
