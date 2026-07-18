"""
Field-level validation functions for The Digital GM.

All validators return (bool, str) tuples:
    (True,  "")              → valid
    (False, "reason string") → invalid

No validator raises — callers handle the false case.
"""

import re
from core.schema import VALID_POSITIONS, VALID_ELIGIBILITY


def validate_grad_year(value: object) -> tuple[bool, str]:
    """
    Validate that grad_year is an integer between 2024 and 2035 inclusive.

    Args:
        value: Raw value from ingestion.

    Returns:
        (True, "") if valid; (False, reason) otherwise.
    """
    try:
        year = int(value)
    except (TypeError, ValueError):
        return False, f"grad_year '{value}' is not a valid integer"
    if not (2024 <= year <= 2035):
        return False, f"grad_year {year} is outside the accepted range (2024–2035)"
    return True, ""


def validate_height(value: object) -> tuple[bool, str]:
    """
    Validate that height_inches is an integer between 48 and 96 inclusive.

    Args:
        value: Raw value from ingestion (inches).

    Returns:
        (True, "") if valid; (False, reason) otherwise.
    """
    try:
        inches = int(value)
    except (TypeError, ValueError):
        return False, f"height_inches '{value}' is not a valid integer"
    if not (48 <= inches <= 96):
        return False, f"height_inches {inches} is outside the accepted range (48–96)"
    return True, ""


def validate_position(value: object) -> tuple[bool, str]:
    """
    Validate that position is one of the recognized basketball position codes.

    Args:
        value: Raw position string.

    Returns:
        (True, "") if valid; (False, reason) otherwise.
    """
    if not isinstance(value, str) or not value.strip():
        return False, "position is empty or not a string"
    if value.strip() not in VALID_POSITIONS:
        return False, f"position '{value}' is not in {VALID_POSITIONS}"
    return True, ""


def validate_eligibility(value: object) -> tuple[bool, str]:
    """
    Validate that eligibility_status is one of the recognized status strings.

    Args:
        value: Raw eligibility string.

    Returns:
        (True, "") if valid; (False, reason) otherwise.
    """
    if not isinstance(value, str) or not value.strip():
        return False, "eligibility_status is empty or not a string"
    if value.strip() not in VALID_ELIGIBILITY:
        return False, f"eligibility_status '{value}' is not in {VALID_ELIGIBILITY}"
    return True, ""


def validate_email(value: object) -> tuple[bool, str]:
    """
    Validate basic email format (user@domain.tld).

    Args:
        value: Raw email string.

    Returns:
        (True, "") if valid; (False, reason) otherwise.
    """
    if not isinstance(value, str) or not value.strip():
        return False, "email is empty or not a string"
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    if not re.match(pattern, value.strip()):
        return False, f"email '{value}' does not match expected format"
    return True, ""


def validate_ncaa_id(value: object) -> tuple[bool, str]:
    """
    Validate NCAA ID: must be a numeric string of exactly 10 digits, or None/empty.

    Args:
        value: Raw NCAA ID value (nullable — None or empty string is accepted).

    Returns:
        (True, "") if valid or absent; (False, reason) if present but malformed.
    """
    if value is None or (isinstance(value, str) and not value.strip()):
        return True, ""
    cleaned = str(value).strip()
    if not cleaned.isdigit() or len(cleaned) != 10:
        return False, f"ncaa_id '{value}' must be a 10-digit numeric string"
    return True, ""


def validate_full_name(value: object) -> tuple[bool, str]:
    """
    Validate that full_name is a non-empty string containing no numeric characters.

    Args:
        value: Raw full name string.

    Returns:
        (True, "") if valid; (False, reason) otherwise.
    """
    if not isinstance(value, str) or not value.strip():
        return False, "full_name is empty or not a string"
    if any(char.isdigit() for char in value):
        return False, f"full_name '{value}' contains numeric characters"
    return True, ""
