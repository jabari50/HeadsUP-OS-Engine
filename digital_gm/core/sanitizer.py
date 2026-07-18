"""
Zero-hallucination data cleaning engine for The Digital GM.

Never guesses. Never uses AI to fill missing fields.
Every missing or ambiguous field is flagged for human verification.
Flagged records are NOT failed records — they enter the DB and queue for review.
"""

import uuid
import traceback
from datetime import datetime
from typing import Any

import numpy as np
import pandas as pd

from core.schema import (
    PLAYER_SCHEMA,
    VALID_POSITIONS,
    VALID_ELIGIBILITY,
    VALID_DATA_SOURCES,
)
from utils.validators import validate_grad_year, validate_position, validate_eligibility
from utils.logger import get_logger

logger = get_logger(__name__)


def _is_blank(value: Any) -> bool:
    """Return True if value is None, NaN, or an empty / whitespace-only string."""
    if value is None:
        return True
    if isinstance(value, float) and np.isnan(value):
        return True
    if isinstance(value, str) and not value.strip():
        return True
    return False


def sanitize_player_record(raw_dict: dict, ingested_by: str) -> pd.DataFrame:
    """
    Clean and validate a single raw player dict, returning a one-row DataFrame.

    Generates system fields (player_id, ingestion_date, last_modified, etc.),
    applies numpy-based conditional flagging for missing / invalid data, and
    joins all flag reasons into a human-readable verification_reason string.

    No field is ever guessed or filled from inference.

    Args:
        raw_dict:    Raw key/value player data from any source.
        ingested_by: Operator username string to stamp on the record.

    Returns:
        Single-row DataFrame with all PLAYER_SCHEMA columns present.
    """
    logger.info("Sanitizing player record for: %s", raw_dict.get("full_name", "<unnamed>"))

    record: dict[str, Any] = {}

    # --- System-generated fields ---
    record["player_id"] = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()
    record["ingestion_date"] = now_iso
    record["last_modified"] = now_iso
    record["sync_status"] = "pending"
    record["ingested_by"] = ingested_by

    raw_source = raw_dict.get("data_source", "manual")
    record["data_source"] = raw_source if raw_source in VALID_DATA_SOURCES else "manual"

    # --- Pass-through fields (nullable) ---
    for field in [
        "full_name", "high_school", "aau_program", "committed_college", "ncaa_id",
    ]:
        record[field] = raw_dict.get(field) or None

    # --- Numeric fields (store as-is; None if missing) ---
    for field in ["height_inches", "weight_lbs", "wingspan_inches"]:
        raw_val = raw_dict.get(field)
        if _is_blank(raw_val):
            record[field] = None
        else:
            try:
                record[field] = int(raw_val)
            except (TypeError, ValueError):
                record[field] = None

    # --- Grad year ---
    raw_year = raw_dict.get("grad_year")
    if not _is_blank(raw_year):
        try:
            record["grad_year"] = int(raw_year)
        except (TypeError, ValueError):
            record["grad_year"] = None
    else:
        record["grad_year"] = None

    # --- Position ---
    raw_pos = raw_dict.get("position")
    record["position"] = raw_pos if (raw_pos and raw_pos in VALID_POSITIONS) else None

    # --- Eligibility ---
    raw_elig = raw_dict.get("eligibility_status")
    record["eligibility_status"] = (
        raw_elig if (raw_elig and raw_elig in VALID_ELIGIBILITY) else None
    )

    # ---------------------------------------------------------------------------
    # Numpy-based conditional flagging
    # ---------------------------------------------------------------------------
    flags: list[str] = []

    full_name_blank = np.bool_(_is_blank(record.get("full_name")))
    high_school_blank = np.bool_(_is_blank(record.get("high_school")))
    height_missing = np.bool_(record.get("height_inches") is None)
    grad_year_invalid = np.bool_(
        record.get("grad_year") is None
        or not validate_grad_year(record.get("grad_year"))[0]
    )
    position_invalid = np.bool_(record.get("position") is None)
    eligibility_invalid = np.bool_(record.get("eligibility_status") is None)

    if full_name_blank:
        flags.append("Missing full name")
    if high_school_blank:
        flags.append("Missing high school affiliation")
    if height_missing:
        flags.append("Missing height — physical metrics incomplete")
    if grad_year_invalid:
        flags.append("Invalid or missing grad year")
    if position_invalid:
        flags.append("Invalid or missing position")
    if eligibility_invalid:
        flags.append("Invalid eligibility status")

    record["verification_needed"] = bool(len(flags) > 0)
    record["verification_reason"] = " | ".join(flags)

    # Ensure column order matches PLAYER_SCHEMA exactly
    df = pd.DataFrame([{col: record.get(col) for col in PLAYER_SCHEMA}])

    flag_count = len(flags)
    if flag_count:
        logger.warning(
            "Player '%s' flagged with %d issue(s): %s",
            record.get("full_name", "<unnamed>"),
            flag_count,
            record["verification_reason"],
        )
    else:
        logger.info("Player '%s' passed all validation checks.", record.get("full_name"))

    return df


def sanitize_csv_batch(filepath: str, ingested_by: str) -> pd.DataFrame:
    """
    Read a CSV file and sanitize every row using sanitize_player_record.

    Returns the full DataFrame including flagged records.
    Flagged records are NOT excluded — they enter the pipeline for human review.

    Args:
        filepath:    Path to the CSV file to ingest.
        ingested_by: Operator username to stamp on all records.

    Returns:
        DataFrame with all records, clean and flagged alike.
    """
    logger.info("Starting CSV batch sanitization: '%s'", filepath)

    try:
        raw_df = pd.read_csv(filepath, dtype=str)
    except Exception:
        logger.error("Failed to read CSV '%s':\n%s", filepath, traceback.format_exc())
        raise

    total = len(raw_df)
    logger.info("CSV loaded: %d total records.", total)

    sanitized_rows: list[pd.DataFrame] = []

    for _, row in raw_df.iterrows():
        try:
            clean_row = sanitize_player_record(row.to_dict(), ingested_by)
            sanitized_rows.append(clean_row)
        except Exception:
            logger.error(
                "Sanitization failed for row — skipping:\n%s", traceback.format_exc()
            )

    if not sanitized_rows:
        logger.warning("No records were successfully sanitized from '%s'.", filepath)
        return pd.DataFrame(columns=PLAYER_SCHEMA)

    result_df = pd.concat(sanitized_rows, ignore_index=True)

    clean_count = int((result_df["verification_needed"] == False).sum())
    flagged_count = int((result_df["verification_needed"] == True).sum())

    logger.info(
        "CSV batch complete — total: %d | clean: %d | flagged: %d",
        total,
        clean_count,
        flagged_count,
    )

    return result_df
