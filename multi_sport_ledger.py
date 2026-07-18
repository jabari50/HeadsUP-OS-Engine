"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        HeadsUp OS — Multi-Sport Revenue Engine (Ledger Ingestion Layer)      ║
║        Basketball · Football · Baseball prospect normalization + AAS         ║
║        HeadsUp OS v3.2.0 | Render Deployment Target                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE:
    Scale the core prospect ledger beyond basketball. Ingests raw multi-sport
    records (public rankings, accolade text strings, neck-down measurables,
    sport-specific cognitive extensions), normalizes them into the canonical
    core schema, and computes an Athletic Arbitrage Score (AAS) via NumPy
    vector weighting — BEFORE the athlete enters an onboarding track.

CANONICAL CORE COLUMNS (every sport, every row):
    ['Player', 'High_School', 'Height', 'Status', 'College',
     'Verification_Needed', 'Sport_IQ_Score']

SPORT EXTENSION COLUMNS:
    Football : playbook_adaptation_index, presnap_box_count_timing,
               coverage_processing_velocity
    Baseball : pitch_recognition_velocity, pitch_quadrant_tracking,
               slump_recovery_index
    Basketball: neck_up_playmaking, neck_up_defense, neck_up_physical_output
               (native — routes onward to the 7-Gate Neural Arbitrage Engine)

ZERO HALLUCINATION POLICY:
    Missing numeric inputs stay NaN (never imputed with fake values), missing
    text fields become "Unverified", and any row with an unverifiable core
    field is flagged Verification_Needed=True. AAS is only computed over the
    components actually present — weights are re-normalized, never guessed.

INTEGRATION:
    build_pro_file_ledger()   → raw records  → clean core DataFrame + AAS
    update_prospect_ledger()  → append XP / credential badges / graduation
                                metrics back onto an existing ledger row
    route_to_arbitrage_engine() → basketball rows continue into
                                  HeadsUpArbitrageEngine.process_ledger()
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Optional

import numpy as np
import pandas as pd

ENGINE_VERSION = "3.2.0"

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — CANONICAL SCHEMA + SPORT CONFIGURATIONS
# ─────────────────────────────────────────────────────────────────────────────

# Core columns present on every athlete row regardless of sport
CORE_COLUMNS: list[str] = [
    "Player", "High_School", "Height", "Status", "College",
    "Verification_Needed", "Sport_IQ_Score",
]

# Gamification / graduation columns maintained by update_prospect_ledger()
LEDGER_TRACKING_COLUMNS: list[str] = [
    "Academy_XP", "Credential_Badges", "Modules_Graduated", "slump_index",
]

# AAS component order — this is the fixed vector the weights dot against:
#   [ranking_percentile, accolade_index, physical_index, cognitive_index]
AAS_COMPONENTS: list[str] = [
    "ranking_percentile", "accolade_index", "physical_index", "cognitive_index",
]

SPORT_CONFIGS: dict[str, dict[str, Any]] = {
    "basketball": {
        # Cognitive extensions feed Sport_IQ_Score; native neck_up_* naming
        "cognitive_cols": ["neck_up_playmaking", "neck_up_defense"],
        "extension_cols": [
            "neck_up_playmaking", "neck_up_defense", "neck_up_physical_output",
        ],
        # Height baseline for physical_index normalization (inches)
        "height_range": (68.0, 86.0),   # 5'8" floor → 7'2" ceiling
        "aas_weights": np.array([0.30, 0.20, 0.20, 0.30]),
    },
    "football": {
        "cognitive_cols": [
            "playbook_adaptation_index",      # 0–100 | scheme install speed
            "presnap_box_count_timing",       # 0–100 | pre-snap read timing
            "coverage_processing_velocity",   # 0–100 | coverage ID speed
        ],
        "extension_cols": [
            "playbook_adaptation_index", "presnap_box_count_timing",
            "coverage_processing_velocity",
        ],
        "height_range": (66.0, 82.0),   # 5'6" floor → 6'10" ceiling
        "aas_weights": np.array([0.25, 0.25, 0.25, 0.25]),
    },
    "baseball": {
        "cognitive_cols": [
            "pitch_recognition_velocity",     # 0–100 | spatial pitch ID speed
            "pitch_quadrant_tracking",        # 0–100 | zone-quadrant tracking
            "slump_recovery_index",           # 0–100 | mental-resilience recovery
        ],
        "extension_cols": [
            "pitch_recognition_velocity", "pitch_quadrant_tracking",
            "slump_recovery_index",
        ],
        "height_range": (66.0, 80.0),   # 5'6" floor → 6'8" ceiling
        "aas_weights": np.array([0.25, 0.20, 0.20, 0.35]),
    },
}

# Accolade text parsing — each matched tier contributes its weight (capped 100)
ACCOLADE_TIERS: list[tuple[str, float]] = [
    (r"all[- ]american|mcdonald'?s|under armour all[- ]america", 40.0),
    (r"gatorade (state )?player of the year|mr\.? (basketball|football|baseball)", 35.0),
    (r"all[- ]state", 25.0),
    (r"state champ", 20.0),
    (r"district mvp|county mvp|conference mvp|mvp", 15.0),
    (r"all[- ]district|all[- ]county|all[- ]conference|all[- ]area", 10.0),
    (r"honorable mention", 5.0),
]


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — PARSERS  (rankings, accolades, height → normalized 0–100)
# ─────────────────────────────────────────────────────────────────────────────

def parse_height_to_inches(height: Any) -> Optional[float]:
    """Parse a height string like 6'5", 6-5, or "77" (inches) into inches.

    Args:
        height: Raw height value from the source record.

    Returns:
        Height in inches, or None when unparseable (never guessed).
    """
    if height is None or (isinstance(height, float) and np.isnan(height)):
        return None
    if isinstance(height, (int, float)):
        return float(height) if 48 <= float(height) <= 96 else None
    match = re.match(r"^\s*(\d)\s*['\-]\s*(\d{1,2})", str(height))
    if match:
        feet, inches = int(match.group(1)), int(match.group(2))
        return float(feet * 12 + inches)
    return None


def parse_ranking_percentile(public_rank: Any, pool_size: Any) -> float:
    """Convert a public ranking (1 = best) into a 0–100 percentile.

    Args:
        public_rank: Athlete's rank in a public list (1-indexed).
        pool_size: Total athletes in that ranking pool.

    Returns:
        0–100 percentile (100 = top-ranked), or NaN when unverifiable.
    """
    try:
        rank, pool = float(public_rank), float(pool_size)
    except (TypeError, ValueError):
        return np.nan
    if rank < 1 or pool < 1 or rank > pool:
        return np.nan
    return round((1.0 - (rank - 1.0) / pool) * 100.0, 2)


def parse_accolade_index(accolades: Any) -> float:
    """Score a free-text accolade string against known accolade tiers.

    Args:
        accolades: Raw accolade text (e.g. "All-District, State Champion").

    Returns:
        0–100 accolade index; 0.0 for verified-empty, NaN for missing text.
    """
    if accolades is None or (isinstance(accolades, float) and np.isnan(accolades)):
        return np.nan
    text = str(accolades).lower().strip()
    if not text or text == "unverified":
        return np.nan
    score = sum(w for pattern, w in ACCOLADE_TIERS if re.search(pattern, text))
    return float(min(100.0, score))


def compute_physical_index(height_inches: Optional[float],
                           height_range: tuple[float, float]) -> float:
    """Normalize verified height into a 0–100 physical index for the sport.

    Args:
        height_inches: Parsed height, or None when unverified.
        height_range: (floor, ceiling) inches for this sport's config.

    Returns:
        0–100 index, or NaN when height is unverified.
    """
    if height_inches is None:
        return np.nan
    floor, ceiling = height_range
    clipped = float(np.clip(height_inches, floor, ceiling))
    return round((clipped - floor) / (ceiling - floor) * 100.0, 2)


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — ATHLETIC ARBITRAGE SCORE  (NumPy vector weighting)
# ─────────────────────────────────────────────────────────────────────────────

def compute_aas(components: dict[str, float], weights: np.ndarray) -> float:
    """Dot a component vector against sport weights, skipping missing inputs.

    Missing (NaN) components are excluded and the surviving weights are
    re-normalized so present data is never diluted by fabricated zeros
    (Zero Hallucination Policy). Requires at least two verified components.

    Args:
        components: Values keyed by AAS_COMPONENTS names (NaN = missing).
        weights: Weight vector aligned to AAS_COMPONENTS order.

    Returns:
        0–100 Athletic Arbitrage Score, or NaN when under-evidenced.
    """
    vector = np.array([components[name] for name in AAS_COMPONENTS], dtype=float)
    mask = ~np.isnan(vector)
    if mask.sum() < 2:
        return np.nan
    live_weights = weights[mask] / weights[mask].sum()
    return round(float(np.dot(vector[mask], live_weights)), 2)


def compute_sport_iq(row: dict[str, Any], cognitive_cols: list[str]) -> float:
    """Average the sport's verified cognitive extension columns into Sport_IQ.

    Args:
        row: Raw athlete record.
        cognitive_cols: Sport-specific cognitive column names.

    Returns:
        0–100 Sport_IQ_Score, or NaN when no cognitive data is verified.
    """
    values = []
    for col in cognitive_cols:
        try:
            v = float(row.get(col))
            if not np.isnan(v):
                values.append(np.clip(v, 0.0, 100.0))
        except (TypeError, ValueError):
            continue
    return round(float(np.mean(values)), 2) if values else np.nan


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — LEDGER BUILD PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def build_pro_file_ledger(raw_records: list[dict[str, Any]],
                          sport: str) -> pd.DataFrame:
    """Build the canonical HeadsUp OS prospect ledger for one sport.

    Normalizes raw records into the core schema, computes Sport_IQ_Score and
    the Athletic Arbitrage Score, and flags every row whose core identity or
    scoring inputs could not be verified.

    Args:
        raw_records: List of raw athlete dicts (scraper / intake output).
        sport: One of SPORT_CONFIGS keys ("basketball", "football", "baseball").

    Returns:
        DataFrame with CORE_COLUMNS + sport extension columns +
        Athletic_Arbitrage_Score + Sport + tracking columns, one row per athlete.

    Raises:
        ValueError: If the sport has no registered configuration.
    """
    if sport not in SPORT_CONFIGS:
        raise ValueError(
            f"Unknown sport '{sport}'. Registered: {sorted(SPORT_CONFIGS)}"
        )
    config = SPORT_CONFIGS[sport]

    rows: list[dict[str, Any]] = []
    for record in raw_records:
        height_in = parse_height_to_inches(record.get("Height"))
        sport_iq = compute_sport_iq(record, config["cognitive_cols"])

        components = {
            "ranking_percentile": parse_ranking_percentile(
                record.get("public_rank"), record.get("ranking_pool_size")),
            "accolade_index": parse_accolade_index(record.get("accolades")),
            "physical_index": compute_physical_index(
                height_in, config["height_range"]),
            "cognitive_index": sport_iq,
        }
        aas = compute_aas(components, config["aas_weights"])

        # Verification: any missing core identity field or unscoreable AAS
        core_missing = any(
            not str(record.get(f, "")).strip()
            for f in ("Player", "High_School")
        )
        verification_needed = bool(
            core_missing or height_in is None
            or np.isnan(sport_iq) or np.isnan(aas)
        )

        row: dict[str, Any] = {
            "Player":       str(record.get("Player", "")).strip() or "Unverified",
            "High_School":  str(record.get("High_School", "")).strip() or "Unverified",
            "Height":       record.get("Height") if height_in is not None else "Unverified",
            "Status":       str(record.get("Status", "")).strip() or "Unverified",
            "College":      str(record.get("College", "")).strip() or "Uncommitted",
            "Verification_Needed": verification_needed,
            "Sport_IQ_Score":      sport_iq,
            "Sport":               sport,
            "Athletic_Arbitrage_Score": aas,
            # Gamification tracking (populated by update_prospect_ledger)
            "Academy_XP":        0,
            "Credential_Badges": "",
            "Modules_Graduated": 0,
            "slump_index":       0,
            "ledger_version":    ENGINE_VERSION,
            "ingested_at":       datetime.now(timezone.utc)
                                 .isoformat().replace("+00:00", "Z"),
        }
        # Carry sport extension columns through verbatim (NaN when absent)
        for col in config["extension_cols"]:
            try:
                row[col] = float(record.get(col))
            except (TypeError, ValueError):
                row[col] = np.nan
        rows.append(row)

    column_order = (
        CORE_COLUMNS + ["Sport", "Athletic_Arbitrage_Score"]
        + config["extension_cols"] + LEDGER_TRACKING_COLUMNS
        + ["ledger_version", "ingested_at"]
    )
    # dict.fromkeys de-dupes while preserving order (basketball cols overlap)
    return pd.DataFrame(rows, columns=list(dict.fromkeys(column_order)))


def update_prospect_ledger(ledger: pd.DataFrame, player: str,
                           updates: dict[str, Any]) -> pd.DataFrame:
    """Write Academy graduation metrics back onto a prospect's ledger row.

    Additive fields (Academy_XP, Modules_Graduated, slump_index) are
    incremented; Credential_Badges appends into the badge string; any other
    key overwrites the column directly.

    Args:
        ledger: Ledger DataFrame produced by build_pro_file_ledger().
        player: Exact Player name of the row to update.
        updates: Field → value map, e.g. {"Academy_XP": 500,
                 "Credential_Badges": "Capologist", "Modules_Graduated": 1}.

    Returns:
        Updated copy of the ledger (original is never mutated in place).

    Raises:
        KeyError: If the player has no row in the ledger.
    """
    ledger = ledger.copy()
    mask = ledger["Player"] == player
    if not mask.any():
        raise KeyError(f"Player '{player}' not found in prospect ledger.")
    idx = ledger.index[mask][0]

    for field_name, value in updates.items():
        if field_name in ("Academy_XP", "Modules_Graduated", "slump_index"):
            current = ledger.at[idx, field_name] if field_name in ledger.columns else 0
            ledger.at[idx, field_name] = int(current or 0) + int(value)
        elif field_name == "Credential_Badges":
            existing = str(ledger.at[idx, "Credential_Badges"] or "")
            badges = [b for b in existing.split("|") if b]
            if value not in badges:
                badges.append(str(value))
            ledger.at[idx, "Credential_Badges"] = "|".join(badges)
        else:
            ledger.at[idx, field_name] = value
    return ledger


def route_to_arbitrage_engine(ledger: pd.DataFrame) -> pd.DataFrame:
    """Send basketball rows onward through the 7-Gate Neural Arbitrage Engine.

    Args:
        ledger: Multi-sport ledger from build_pro_file_ledger().

    Returns:
        B2B export DataFrame from HeadsUpArbitrageEngine.process_ledger()
        for the basketball subset; empty DataFrame if none qualify.
    """
    from hu_os_arbitrage_engine import HeadsUpArbitrageEngine

    basketball = ledger[ledger["Sport"] == "basketball"].copy()
    if basketball.empty:
        return pd.DataFrame()
    return HeadsUpArbitrageEngine().process_ledger(basketball)


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — SELF-TEST  (run: python multi_sport_ledger.py)
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    SAMPLE_RECORDS = [
        {
            "Player": "Test QB One", "High_School": "Duncanville",
            "Height": "6'3\"", "Status": "Active", "College": "",
            "public_rank": 12, "ranking_pool_size": 250,
            "accolades": "All-District, State Champion",
            "playbook_adaptation_index": 88, "presnap_box_count_timing": 91,
            "coverage_processing_velocity": 84,
        },
        {
            # Deliberately incomplete — must flag Verification_Needed
            "Player": "Test WR Two", "High_School": "Lancaster",
            "Height": None, "Status": "", "College": "",
            "accolades": None,
            "playbook_adaptation_index": 72,
        },
    ]
    ledger = build_pro_file_ledger(SAMPLE_RECORDS, sport="football")
    print(ledger[CORE_COLUMNS + ["Athletic_Arbitrage_Score"]].to_string(index=False))

    ledger = update_prospect_ledger(ledger, "Test QB One", {
        "Academy_XP": 500, "Credential_Badges": "Capologist",
        "Modules_Graduated": 1,
    })
    print("\nAfter graduation update:")
    print(ledger.loc[ledger["Player"] == "Test QB One",
                     ["Player", "Academy_XP", "Credential_Badges",
                      "Modules_Graduated"]].to_string(index=False))
