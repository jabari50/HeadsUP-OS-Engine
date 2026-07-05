"""
Scoring-core stress harness — Task 2 step 4.

Runs edge cases, 80.0-gate boundary values, missing-data handling, and
adversarial inputs through the engine and writes a pass/fail table to
stress_report.json, shaped for dashboard ingestion:

    {"generated_at", "engine": "headsup-portal/engine", "summary": {...},
     "cases": [{"suite", "case", "input", "expected", "actual", "pass"}]}

Run:  python3 tests/stress_report.py   (from engine/)
Exit code 1 on any FAIL — CI-gateable.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from data_models import BOONE_CANONICAL, FullIntakePayload  # noqa: E402
from ovr_engine import calculate_ovr, convert_technical_to_99, get_tier  # noqa: E402
from quest_engine import PRO_QUEST_NEURAL_GATE, seed_starter_quests  # noqa: E402

ANCHOR_TECHNICAL = {
    "ball_handling": 8, "shooting": 9, "finishing": 7, "passing": 8,
    "defense": 7, "rebounding": 6, "athleticism": 8,
}
ANCHOR_NEURAL = {
    "composure": 88, "coachability": 82, "iq": 85,
    "resilience": 76, "leadership": 80, "drive": 90,
}
VALID_INTAKE = {
    "name": "Portal Anchor", "position": "SG", "classification": "HS",
    "school": "DFW Elite Prep", "class_year": "2026",
    "height_ft": 6, "height_in": 2, "height_inches": 74,
    "physical_score": 84.0,
    "technical": ANCHOR_TECHNICAL, "neural": ANCHOR_NEURAL,
}

CASES = []


def case(suite: str, name: str, input_desc: str, expected, actual) -> None:
    CASES.append({
        "suite": suite,
        "case": name,
        "input": input_desc,
        "expected": expected,
        "actual": actual,
        "pass": expected == actual,
    })


def rejected(payload: dict) -> str:
    """Return 'rejected' if Pydantic refuses the payload, else 'accepted'."""
    try:
        FullIntakePayload(**payload)
        return "accepted"
    except Exception:
        return "rejected"


def neural_quest_attrs(neural: dict) -> list:
    return [q.target_attribute for q in seed_starter_quests({"neural": neural})
            if q.target_attribute.startswith("neural.")]


def run() -> dict:
    # ── Tier boundaries ──
    for ovr, tier in [(85.0, "Elite"), (84.9, "Impact"), (70.0, "Impact"),
                      (69.9, "Contributor"), (55.0, "Contributor"),
                      (54.9, "Developing"), (40.0, "Developing"),
                      (39.9, "Prospect"), (1.0, "Prospect"), (99.0, "Elite")]:
        case("tier_boundaries", f"ovr_{ovr}", f"ovr={ovr}", tier, get_tier(ovr))

    # ── Scale conversion + OVR clamping ──
    case("scale", "technical_floor", "raw=1", 1.0, convert_technical_to_99(1))
    case("scale", "technical_ceiling", "raw=10", 99.0, convert_technical_to_99(10))
    case("scale", "technical_midpoint", "raw=5.5", 50.0, convert_technical_to_99(5.5))
    max_out = calculate_ovr({k: 10 for k in ANCHOR_TECHNICAL},
                            {k: 99 for k in ANCHOR_NEURAL}, 99.0)
    case("scale", "ovr_ceiling_clamped", "all inputs at max", True, max_out["ovr"] <= 99.0)
    min_out = calculate_ovr({k: 1 for k in ANCHOR_TECHNICAL},
                            {k: 1 for k in ANCHOR_NEURAL}, 1.0)
    case("scale", "ovr_floor_clamped", "all inputs at min", True, min_out["ovr"] >= 1.0)

    # ── Benchmark anchors ──
    anchor = calculate_ovr(ANCHOR_TECHNICAL, ANCHOR_NEURAL, 84.0)
    case("benchmarks", "portal_anchor_ovr", "locked anchor vector", 78.7, anchor["ovr"])
    case("benchmarks", "portal_anchor_tier", "locked anchor vector", "Impact", anchor["tier"])
    case("benchmarks", "boone_canonical_ovr", "BOONE_CANONICAL constant", 82.36,
         BOONE_CANONICAL["ovr"])

    # ── PRO-Quest 80.0 gate boundaries ──
    case("pro_quest_gate", "gate_constant", "PRO_QUEST_NEURAL_GATE", 80.0,
         PRO_QUEST_NEURAL_GATE)
    case("pro_quest_gate", "just_below_fires", "composure=79.9",
         ["neural.composure"], neural_quest_attrs({"composure": 79.9, "iq": 90}))
    case("pro_quest_gate", "at_gate_silent", "composure=80.0",
         [], neural_quest_attrs({"composure": 80.0, "iq": 90}))
    case("pro_quest_gate", "just_above_silent", "composure=80.1",
         [], neural_quest_attrs({"composure": 80.1, "iq": 90}))
    case("pro_quest_gate", "multi_marker_weakest_first",
         "composure=62 iq=79 resilience=45",
         ["neural.resilience", "neural.composure", "neural.iq"],
         neural_quest_attrs({"composure": 62, "coachability": 85, "iq": 79,
                             "resilience": 45}))
    case("pro_quest_gate", "all_at_gate_silent", "all six markers = 80",
         [], neural_quest_attrs({k: 80 for k in ANCHOR_NEURAL}))

    # ── Missing data (Zero Hallucination) ──
    case("missing_data", "empty_player_no_quests", "player_data={}",
         [], seed_starter_quests({}))
    case("missing_data", "none_marker_skipped", "composure=None iq=70",
         ["neural.iq"], neural_quest_attrs({"composure": None, "iq": 70}))

    # ── Adversarial intake (Gate 5) ──
    case("adversarial", "valid_payload_accepted", "anchor intake", "accepted",
         rejected(VALID_INTAKE))
    case("adversarial", "score_injection_top_level", "ovr=99 injected", "rejected",
         rejected({**VALID_INTAKE, "ovr": 99}))
    case("adversarial", "score_injection_nested", "neural.ovr=99 injected", "rejected",
         rejected({**VALID_INTAKE, "neural": {**ANCHOR_NEURAL, "ovr": 99}}))
    case("adversarial", "enum_violation", "position=POINT", "rejected",
         rejected({**VALID_INTAKE, "position": "POINT"}))
    case("adversarial", "bounds_violation", "shooting=11", "rejected",
         rejected({**VALID_INTAKE,
                   "technical": {**ANCHOR_TECHNICAL, "shooting": 11}}))
    case("adversarial", "negative_score", "shooting=-5", "rejected",
         rejected({**VALID_INTAKE,
                   "technical": {**ANCHOR_TECHNICAL, "shooting": -5}}))
    case("adversarial", "cross_field_height", "height_inches=80 vs 6'2\"", "rejected",
         rejected({**VALID_INTAKE, "height_inches": 80}))
    case("adversarial", "type_confusion", "shooting='nine'", "rejected",
         rejected({**VALID_INTAKE,
                   "technical": {**ANCHOR_TECHNICAL, "shooting": "nine"}}))

    passed = sum(1 for c in CASES if c["pass"])
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "engine": "headsup-portal/engine",
        "summary": {"total": len(CASES), "passed": passed,
                    "failed": len(CASES) - passed},
        "cases": CASES,
    }


if __name__ == "__main__":
    report = run()
    out_path = Path(__file__).parent / "stress_report.json"
    out_path.write_text(json.dumps(report, indent=2, default=str))
    failed = [c for c in report["cases"] if not c["pass"]]
    print(f"{report['summary']['passed']}/{report['summary']['total']} passed "
          f"→ {out_path}")
    for c in failed:
        print(f"FAIL  {c['suite']}::{c['case']}  expected={c['expected']!r} "
              f"actual={c['actual']!r}")
    sys.exit(1 if failed else 0)
