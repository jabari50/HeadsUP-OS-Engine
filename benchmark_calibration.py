"""
benchmark_calibration.py
HeadsUp OS (HU-OS) — Expert Retrospective Benchmark calibration harness.

Purpose
-------
Store and validate FOUNDER-ASSIGNED benchmark anchors (Wade Taylor IV, Marcus
Garrett, Tyrese Maxey, the 2019 DFW class, etc.) that calibrate the HU-OS
algorithm ceiling. Anchors are NOT engine audit outputs and NOT Sovereign Assets.

Two honest calibration paths (see validate_anchor)
--------------------------------------------------
Path A  Founder assigns the six Neck-Up inputs from documented behavioral
        evidence -> engine computes PRO / NER / OVR -> store both. Preferred.
Path B  Founder assigns a target OVR band -> harness confirms the engine can
        reach it with plausible elite inputs.

Bands (founder-ratified, scholastic)
------------------------------------
A+ 95-99 | A 90-94 | B+ 86-89 | B 80-85 | C+ 75-79 | C 70-74 (F below 70).
"Generational" = A+ on the PRO axis only, and only with a firsthand founder eval.

Zero Hallucination Protocol
---------------------------
No score is invented here. Anchors ship with scores = None until the founder
assigns them from evidence. The harness never fills a blank with a guess.

Algo version: 4.1.0
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional
import json

# ---------------------------------------------------------------------------
# LOCKED ALGORITHM CONSTANTS (HU-OS v4.1.0) — single source of truth.
# ---------------------------------------------------------------------------
ALGO_VERSION = "4.1.0"

PRO_SCORE_WEIGHTS = {"culture_equity": 0.40, "resilience": 0.35, "coachability": 0.25}
NER_WEIGHTS = {"playmaking": 0.35, "defense": 0.35, "physical_output": 0.30}
OVR_WEIGHTS = {"pro_score": 0.50, "ner": 0.50}

SCORE_MIN, SCORE_MAX = 0.0, 100.0
SCORE_TYPE_LOCK = "expert_retrospective_benchmark"
OVR_CONSISTENCY_TOLERANCE = 1.0

# Scholastic bands — half-open float intervals matching the founder's integer bins.
GRADE_BANDS = [
    ("A+", 95.0, 100.01),
    ("A", 90.0, 95.0),
    ("B+", 86.0, 90.0),
    ("B", 80.0, 86.0),
    ("C+", 75.0, 80.0),
    ("C", 70.0, 75.0),
]
VALID_GRADES = {g for g, _, _ in GRADE_BANDS}
DEFICIENCY_THRESHOLD = 80.0        # < 80 => below B (deficiency-adjacent / deficiency)
GENERATIONAL_GRADE = "A+"          # generational = top of A+, PRO axis only

# Archetype separation = one letter-grade step (recommended default; NOT final-ratified).
ARCHETYPE_GAP = 5.0


# ---------------------------------------------------------------------------
# Grade + archetype helpers.
# ---------------------------------------------------------------------------
def axis_grade(score: float) -> str:
    """Map a 0-100 axis score to its scholastic letter grade. Returns 'F' below 70."""
    for grade, lo, hi in GRADE_BANDS:
        if lo <= score < hi:
            return grade
    return "F"


def archetype(pro_score: float, ner: float, gap: float = ARCHETYPE_GAP) -> str:
    """Classify anchor archetype from the PRO-NER separation."""
    if pro_score - ner >= gap:
        return "Culture Anchor"
    if ner - pro_score >= gap:
        return "Talent-Forward"
    return "Two-Way Balanced"


# ---------------------------------------------------------------------------
# Core scoring — mirrors the production engine exactly.
# ---------------------------------------------------------------------------
def compute_pro_score(neck_up: dict) -> float:
    """Weighted PRO-Score from the three behavioral inputs. Returns 0-100, 2dp."""
    return round(sum(neck_up[k] * w for k, w in PRO_SCORE_WEIGHTS.items()), 2)


def compute_ner(neck_up: dict) -> float:
    """Weighted Neural Efficiency Rating from the three on-court inputs. 0-100, 2dp."""
    return round(sum(neck_up[k] * w for k, w in NER_WEIGHTS.items()), 2)


def compute_ovr(pro_score: float, ner: float) -> float:
    """Overall Rating = PRO x0.50 + NER x0.50. Returns 0-100, 2dp."""
    return round(pro_score * OVR_WEIGHTS["pro_score"] + ner * OVR_WEIGHTS["ner"], 2)


# ---------------------------------------------------------------------------
# Data model — mirrors the benchmark_anchors table.
# ---------------------------------------------------------------------------
@dataclass
class BenchmarkAnchor:
    """One founder-assigned benchmark anchor. Scores are None until assigned."""

    athlete_name: str
    evidence_basis: str                      # required — no evidence, no anchor
    dfw_school: Optional[str] = None
    destination: Optional[str] = None
    involvement_tier: Optional[str] = None   # 'T1' | 'T2' | 'T3'

    # Founder-assigned Neck-Up inputs (0-100). None until assigned from evidence.
    culture_equity: Optional[float] = None
    resilience: Optional[float] = None
    coachability: Optional[float] = None
    playmaking: Optional[float] = None
    defense: Optional[float] = None
    physical_output: Optional[float] = None

    # Founder-assigned scholastic band targets (letter grades).
    pro_band_target: Optional[str] = None
    ner_band_target: Optional[str] = None

    # Founder-assigned target OVR band midpoint (Path B). None if using Path A.
    target_ovr: Optional[float] = None

    # Firsthand founder Neck-Up eval on record (Gate 15 ground-truth).
    firsthand_founder_eval: bool = False
    # Generational designation — PRO axis only; requires firsthand eval + A+ target.
    generational: bool = False

    # Locked provenance
    score_type: str = SCORE_TYPE_LOCK
    assigned_by: str = "Jabari Johnson (Founder / Evaluator of Record)"
    is_live_asset: bool = False
    algo_version: str = ALGO_VERSION

    def neck_up_inputs(self) -> Optional[dict]:
        """Return the six inputs as a dict, or None if any are unassigned."""
        vals = {
            "culture_equity": self.culture_equity,
            "resilience": self.resilience,
            "coachability": self.coachability,
            "playmaking": self.playmaking,
            "defense": self.defense,
            "physical_output": self.physical_output,
        }
        return vals if all(v is not None for v in vals.values()) else None


# ---------------------------------------------------------------------------
# Validation & calibration.
# ---------------------------------------------------------------------------
def validate_anchor(anchor: BenchmarkAnchor) -> dict:
    """
    Validate one benchmark anchor and compute its consistency report.

    Enforces provenance locks, evidence_basis, score ranges, band-target validity,
    the generational integrity rule (firsthand + A+ PRO), Path-A recomputation with
    grade + archetype, band-membership agreement, and the circularity guard.

    Args:
        anchor: the BenchmarkAnchor to validate.

    Returns:
        dict report. Never raises on missing scores — missing = 'pending'.
    """
    errors: list[str] = []
    warnings: list[str] = []

    # provenance locks
    if anchor.score_type != SCORE_TYPE_LOCK:
        errors.append(f"score_type must be '{SCORE_TYPE_LOCK}', got '{anchor.score_type}'")
    if anchor.is_live_asset is not False:
        errors.append("is_live_asset must be False — a benchmark can never be a live asset")
    if not anchor.evidence_basis or not anchor.evidence_basis.strip():
        errors.append("evidence_basis is required — no evidence, no anchor")
    if anchor.involvement_tier not in (None, "T1", "T2", "T3"):
        errors.append(f"involvement_tier must be T1/T2/T3 or None, got '{anchor.involvement_tier}'")

    # band-target validity
    for label, band in (("pro_band_target", anchor.pro_band_target),
                        ("ner_band_target", anchor.ner_band_target)):
        if band is not None and band not in VALID_GRADES:
            errors.append(f"{label} '{band}' not a valid scholastic grade {sorted(VALID_GRADES)}")

    # generational integrity — mirrors the DB CHECK constraint
    if anchor.generational:
        if not anchor.firsthand_founder_eval:
            errors.append("generational requires firsthand_founder_eval=True")
        if anchor.pro_band_target != GENERATIONAL_GRADE:
            errors.append(f"generational requires pro_band_target='{GENERATIONAL_GRADE}'")

    # range check on every assigned score
    assigned = {
        "culture_equity": anchor.culture_equity, "resilience": anchor.resilience,
        "coachability": anchor.coachability, "playmaking": anchor.playmaking,
        "defense": anchor.defense, "physical_output": anchor.physical_output,
        "target_ovr": anchor.target_ovr,
    }
    for key, val in assigned.items():
        if val is not None and not (SCORE_MIN <= val <= SCORE_MAX):
            errors.append(f"{key}={val} out of range [{SCORE_MIN}, {SCORE_MAX}]")

    inputs = anchor.neck_up_inputs()
    computed = None
    status = "pending_assignment"

    if inputs and not errors:
        pro = compute_pro_score(inputs)
        ner = compute_ner(inputs)
        ovr = compute_ovr(pro, ner)
        pro_grade = axis_grade(pro)
        ner_grade = axis_grade(ner)
        arch = archetype(pro, ner)
        computed = {
            "pro_score": pro, "ner": ner, "ovr": ovr,
            "pro_grade": pro_grade, "ner_grade": ner_grade, "archetype": arch,
        }
        status = "calibrated_path_A"

        # band-membership agreement
        if anchor.pro_band_target and pro_grade != anchor.pro_band_target:
            warnings.append(f"computed PRO grade {pro_grade} != target {anchor.pro_band_target}")
        if anchor.ner_band_target and ner_grade != anchor.ner_band_target:
            warnings.append(f"computed NER grade {ner_grade} != target {anchor.ner_band_target}")
        # generational must actually land A+ on PRO
        if anchor.generational and pro_grade != GENERATIONAL_GRADE:
            warnings.append(f"generational anchor computed PRO grade {pro_grade}, not {GENERATIONAL_GRADE}")
        # circularity / consistency guard vs target OVR
        if anchor.target_ovr is not None:
            delta = round(abs(ovr - anchor.target_ovr), 2)
            if delta > OVR_CONSISTENCY_TOLERANCE:
                warnings.append(
                    f"computed OVR {ovr} diverges from founder target {anchor.target_ovr} "
                    f"by {delta} (> {OVR_CONSISTENCY_TOLERANCE}); revisit inputs or target"
                )
    elif anchor.target_ovr is not None and not errors:
        status = "calibrated_path_B"

    return {
        "athlete_name": anchor.athlete_name,
        "involvement_tier": anchor.involvement_tier,
        "pro_band_target": anchor.pro_band_target,
        "ner_band_target": anchor.ner_band_target,
        "generational": anchor.generational,
        "status": "invalid" if errors else status,
        "computed": computed,
        "target_ovr": anchor.target_ovr,
        "errors": errors,
        "warnings": warnings,
    }


def run_calibration(anchors: list[BenchmarkAnchor], run_by: str = "System_Admin") -> dict:
    """
    Validate the full anchor set and produce an audit-trail-ready report.

    Args:
        anchors: the anchor set to calibrate.
        run_by:  RBAC identity performing the run (audit trail).

    Returns:
        dict serializable to benchmark_calibration_runs.consistency_report.
    """
    reports = [validate_anchor(a) for a in anchors]
    return {
        "run_timestamp": datetime.now(timezone.utc).isoformat(),
        "algo_version": ALGO_VERSION,
        "anchors_evaluated": len(anchors),
        "run_by": run_by,
        "summary": {
            "invalid": sum(1 for r in reports if r["status"] == "invalid"),
            "pending": sum(1 for r in reports if r["status"] == "pending_assignment"),
            "calibrated": sum(1 for r in reports if r["status"].startswith("calibrated")),
            "warnings": sum(len(r["warnings"]) for r in reports),
        },
        "consistency_report": reports,
    }


# ---------------------------------------------------------------------------
# Seed set — corrected ledger. IDENTITY + CONTEXT ONLY. Scores None until the
# founder assigns them (Zero Hallucination Protocol). Larry Johnson excluded;
# Chris Bosh withheld pending lineage confirmation. Maxey + Taylor carry the
# firsthand founder eval (Gate 15) and are flagged generational on PRO (A+).
# ---------------------------------------------------------------------------
BENCHMARK_SEED: list[BenchmarkAnchor] = [
    BenchmarkAnchor(
        athlete_name="Wade Taylor IV", dfw_school="Lancaster HS",
        destination="Texas A&M / G League", involvement_tier="T1",
        firsthand_founder_eval=True, generational=True, pro_band_target="A+",
        evidence_basis="Firsthand founder Neck-Up eval. 4-star; 3x All-SEC; SEC Tournament scoring records.",
    ),
    BenchmarkAnchor(
        athlete_name="Tyrese Maxey", dfw_school="South Garland HS",
        destination="Kentucky / NBA (76ers)", involvement_tier="T1",
        firsthand_founder_eval=True, generational=True, pro_band_target="A+",
        evidence_basis="Firsthand founder Neck-Up eval. McDonald's All-American; NBA All-Star (76ers).",
    ),
    BenchmarkAnchor(
        athlete_name="Marcus Garrett", dfw_school="Skyline HS (verify)",
        destination="Kansas", involvement_tier="T1",
        evidence_basis="Naismith Defensive Player of the Year (2021); high-major defensive anchor. Founder attests long-term involvement.",
    ),
    BenchmarkAnchor(
        athlete_name="Jalen Wilson", dfw_school="Denton Guyer HS",
        destination="Kansas / NBA (Nets)", involvement_tier="T3",
        evidence_basis="NCAA champion (2022); Big 12 Player of the Year (2023); NBA. DFW density evidence.",
    ),
    BenchmarkAnchor(
        athlete_name="Drew Timme", dfw_school="Richardson Pearce HS",
        destination="Gonzaga / pro", involvement_tier="T3",
        evidence_basis="Consensus All-American; multiple Final Fours at Gonzaga. DFW density evidence.",
    ),
    BenchmarkAnchor(
        athlete_name="Marcus Sasser", dfw_school="Red Oak HS",
        destination="Houston / NBA (Pistons)", involvement_tier="T3",
        evidence_basis="AP All-American; NBA first-round pick (2023). DFW density evidence.",
    ),
    BenchmarkAnchor(
        athlete_name="Jahmi'us Ramsey", dfw_school="Duncanville HS",
        destination="Texas Tech / pro", involvement_tier="T3",
        evidence_basis="Big 12 Freshman of the Year; NBA draft pick. DFW density evidence.",
    ),
    BenchmarkAnchor(
        athlete_name="Max Abmas", dfw_school="Rockwall HS",
        destination="Oral Roberts / Texas", involvement_tier="T3",
        evidence_basis="NCAA Division I scoring leader (2021); Oral Roberts Sweet 16 run. DFW density evidence.",
    ),
    BenchmarkAnchor(
        athlete_name="Ron Holland", dfw_school="Duncanville HS",
        destination="G League Ignite / NBA (Pistons)", involvement_tier="T3",
        evidence_basis="Consensus 5-star; NBA lottery pick (2024). DFW density evidence.",
    ),
    BenchmarkAnchor(
        athlete_name="Harrison Ingram", dfw_school="St. Mark's (Dallas)",
        destination="Stanford / UNC / pro", involvement_tier="T3",
        evidence_basis="5-star; McDonald's All-American (2021). DFW density evidence.",
    ),
    BenchmarkAnchor(
        athlete_name="Isaac Likekele", dfw_school="Arlington, TX (verify HS)",
        destination="Oklahoma State / Ohio State", involvement_tier="T3",
        evidence_basis="Multi-year high-major starter; defensive guard. DFW density evidence.",
    ),
]


def _selftest() -> None:
    """Prove grade + archetype math with generic vectors (not real athlete data)."""
    assert axis_grade(96) == "A+"
    assert axis_grade(92) == "A"
    assert axis_grade(88) == "B+"
    assert axis_grade(83) == "B"
    assert axis_grade(77) == "C+"
    assert axis_grade(72) == "C"
    assert axis_grade(60) == "F"
    demo = {"culture_equity": 90, "resilience": 88, "coachability": 86,
            "playmaking": 84, "defense": 80, "physical_output": 82}
    pro, ner = compute_pro_score(demo), compute_ner(demo)
    assert axis_grade(pro) in VALID_GRADES
    assert archetype(pro, ner) in {"Culture Anchor", "Two-Way Balanced", "Talent-Forward"}


if __name__ == "__main__":
    _selftest()
    print(json.dumps(run_calibration(BENCHMARK_SEED), indent=2))
