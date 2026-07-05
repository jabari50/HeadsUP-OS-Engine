"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        HeadsUp OS — Ingestion Normalization Pipeline                         ║
║        intake → validate → (score) : 5 whitelisted sources                   ║
║        Unified Portal engine | Gate 5                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

Every source normalizes to the canonical athlete dict consumed by the
process_intake RPC. Missing data stays missing (None) — nothing is fabricated.

Source kinds:
  scout_manual → "scored"        full inputs, engine scores immediately
  combine_csv  → "batch"         row-level validation; good rows score, bad rows reject
  free_agents  → "provisional"   identity only; athlete lands Locked and UNSCORED
  ner_anchor   → "neural_update" enum-coded anchors → partial neural update
  film_event   → "observations"  whitelisted tags surface for scout review only
"""

from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import ValidationError

from data_models import (
    NEURAL_ATTRIBUTES,
    FilmEventPayload,
    FullIntakePayload,
    NerAnchorPayload,
    ProvisionalIntakePayload,
)

# NER anchor calibration — v1 PLACEHOLDER values pending Jabari's locked NER
# methodology [NEEDS INPUT]. Structure and whitelisting are final; the numeric
# mapping is not canonical until confirmed. Do not present anchor-derived
# neural values as verified.
NER_ANCHOR_SCALE: Dict[str, float] = {
    "A": 92.0,   # consistently exceptional
    "B": 78.0,   # strong / repeatable
    "C": 62.0,   # situational
    "D": 45.0,   # developing
    "E": 28.0,   # concern
}

# Film-event tag whitelist → the technical skill each observation informs.
# Observations are surfaced to scouts; they are NEVER auto-converted into
# 1-10 technical scores (Zero Hallucination).
FILM_EVENT_TAGS: Dict[str, str] = {
    "made_three": "shooting",
    "pull_up_make": "shooting",
    "rim_finish": "finishing",
    "and_one": "finishing",
    "assist": "passing",
    "skip_pass": "passing",
    "steal": "defense",
    "block": "defense",
    "deflection": "defense",
    "def_reb": "rebounding",
    "off_reb": "rebounding",
    "iso_break": "ball_handling",
    "turnover": "ball_handling",
    "coast_to_coast": "athleticism",
    "putback_dunk": "athleticism",
}


def _identity_canonical(payload) -> dict:
    """Canonical identity fields shared by every source."""
    return {
        "name": payload.name,
        "external_id": payload.external_id,
        "position": payload.position,
        "school": payload.school,
        "class_year": payload.class_year,
        "classification": payload.classification,
    }


def _full_canonical(payload: FullIntakePayload) -> dict:
    """Canonical dict for a fully-scored intake (DB stores total inches)."""
    canonical = _identity_canonical(payload)
    canonical.update({
        "height_in": payload.height_inches,
        "weight_lb": payload.weight_lb,
        "wingspan_in": payload.wingspan_in,
        "physical_score": payload.physical_score,
        "technical": payload.technical.model_dump(),
        "neural": payload.neural.model_dump(),
    })
    return canonical


def normalize_scout_manual(payload: dict) -> dict:
    """Validate a scout manual entry into a scored canonical record."""
    parsed = FullIntakePayload(**payload)
    return {"kind": "scored", "canonical": _full_canonical(parsed)}


def normalize_combine_csv(payload: dict) -> dict:
    """Row-level validation for a header-mapped combine/showcase batch.

    Good rows pass; bad rows carry their own error list. One bad row never
    sinks the batch.
    """
    rows = payload.get("rows")
    if not isinstance(rows, list) or not rows:
        raise ValueError("combine_csv payload requires a non-empty 'rows' list")

    results: List[dict] = []
    for index, row in enumerate(rows):
        try:
            parsed = FullIntakePayload(**row)
            results.append({"index": index, "ok": True, "canonical": _full_canonical(parsed)})
        except ValidationError as exc:
            results.append({
                "index": index,
                "ok": False,
                "errors": [
                    {"loc": list(e["loc"]), "msg": e["msg"], "type": e["type"]}
                    for e in exc.errors()
                ],
            })
    return {"kind": "batch", "rows": results}


def normalize_free_agents(payload: dict) -> dict:
    """Athlete self-enroll: identity only. No scores exist yet, so none are
    written — the athlete stays unscored until a verified source scores them."""
    parsed = ProvisionalIntakePayload(**payload)
    canonical = _identity_canonical(parsed)
    if parsed.height_ft is not None and parsed.height_in is not None:
        canonical["height_in"] = (parsed.height_ft * 12) + parsed.height_in
    canonical["weight_lb"] = parsed.weight_lb
    return {"kind": "provisional", "canonical": canonical}


def normalize_ner_anchor(payload: dict) -> dict:
    """Coach NER anchors: enum-validated per attribute, mapped through
    NER_ANCHOR_SCALE into a PARTIAL neural update."""
    parsed = NerAnchorPayload(**payload)

    neural: Dict[str, float] = {}
    for attribute, code in parsed.responses.items():
        if attribute not in NEURAL_ATTRIBUTES:
            raise ValueError(f"unknown neural attribute '{attribute}'")
        if code not in NER_ANCHOR_SCALE:
            raise ValueError(f"invalid anchor code '{code}' for '{attribute}'")
        neural[attribute] = NER_ANCHOR_SCALE[code]
    if not neural:
        raise ValueError("ner_anchor payload contains no responses")

    canonical = _identity_canonical(parsed.athlete)
    canonical["neural"] = neural
    return {"kind": "neural_update", "canonical": canonical}


def normalize_film_event(payload: dict) -> dict:
    """Film-tagged events: whitelist tags, aggregate counts per skill, and
    surface as observations. No numeric scores are produced."""
    parsed = FilmEventPayload(**payload)

    observations: Dict[str, int] = {}
    for event in parsed.events:
        tag = event.get("tag")
        count = event.get("count", 1)
        if tag not in FILM_EVENT_TAGS:
            raise ValueError(f"unknown film event tag '{tag}'")
        if not isinstance(count, int) or count < 1:
            raise ValueError(f"invalid count for tag '{tag}'")
        skill = FILM_EVENT_TAGS[tag]
        observations[skill] = observations.get(skill, 0) + count

    return {
        "kind": "observations",
        "canonical": _identity_canonical(parsed.athlete),
        "observations": observations,
    }


_NORMALIZERS = {
    "scout_manual": normalize_scout_manual,
    "combine_csv": normalize_combine_csv,
    "free_agents": normalize_free_agents,
    "ner_anchor": normalize_ner_anchor,
    "film_event": normalize_film_event,
}


def normalize(source: str, payload: dict) -> dict:
    """Dispatch a raw intake payload to its source normalizer.

    Args:
        source: One of the 5 whitelisted intake sources.
        payload: Raw payload as received (already persisted to intake_raw).

    Returns:
        Normalized result dict with a 'kind' discriminator.

    Raises:
        ValueError: unknown source or source-specific structural failure.
        pydantic.ValidationError: field-level validation failure.
    """
    if source not in _NORMALIZERS:
        raise ValueError(f"unknown intake source '{source}'")
    return _NORMALIZERS[source](payload)
