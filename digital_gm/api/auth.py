"""
PRO-File OS authentication layer for The Digital GM.

Manages API key loading, license validation, session token caching,
and authentication state. The app cannot proceed without a valid OS license.
"""

import json
import traceback
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import requests
from dotenv import load_dotenv
import os

from config import (
    PRO_FILE_OS_BASE_URL,
    API_ENDPOINTS,
    SESSION_PATH,
    SESSION_DURATION_DAYS,
)
from utils.logger import get_logger

load_dotenv()
logger = get_logger(__name__)


def load_api_key() -> str:
    """
    Read PRO_FILE_OS_API_KEY from the .env file.

    Raises:
        RuntimeError: If the key is missing or empty — the app cannot operate.

    Returns:
        API key string.
    """
    key = os.getenv("PRO_FILE_OS_API_KEY", "").strip()
    if not key:
        logger.critical(
            "PRO_FILE_OS_API_KEY not found in .env. "
            "The Digital GM cannot operate without a valid OS license."
        )
        raise RuntimeError(
            "PRO-File OS license key not found. "
            "The Digital GM cannot operate without a valid OS license."
        )
    return key


def validate_license(api_key: str) -> dict:
    """
    Make a GET request to PRO-File OS /auth/validate to check license validity.

    Args:
        api_key: Operator license key string.

    Returns:
        Dict with keys: valid (bool), tier (str), operator (str), expiry (str).
        On network failure returns: {valid: False, reason: "connection_failed"}.
    """
    url = f"{PRO_FILE_OS_BASE_URL}{API_ENDPOINTS['auth_validate']}"
    headers = {"Authorization": f"Bearer {api_key}"}
    logger.info("Validating PRO-File OS license against %s", url)

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        logger.info(
            "License validated — tier: %s, operator: %s, expiry: %s",
            data.get("tier"),
            data.get("operator"),
            data.get("expiry"),
        )
        return {
            "valid": bool(data.get("valid", False)),
            "tier": data.get("tier", ""),
            "operator": data.get("operator", ""),
            "expiry": data.get("expiry", ""),
        }
    except requests.exceptions.ConnectionError:
        logger.error("PRO-File OS API unreachable — connection failed.")
        return {"valid": False, "reason": "connection_failed"}
    except requests.exceptions.Timeout:
        logger.error("PRO-File OS API request timed out.")
        return {"valid": False, "reason": "connection_failed"}
    except Exception:
        logger.error("License validation error:\n%s", traceback.format_exc())
        return {"valid": False, "reason": "connection_failed"}


def get_session_token(api_key: str) -> str:
    """
    Request a 7-day session token from PRO-File OS and cache it locally.

    The token is saved to SESSION_PATH (not .env) as a JSON file
    containing the token and its expiry timestamp.

    Args:
        api_key: Operator license key string.

    Returns:
        Session token string.

    Raises:
        RuntimeError: If the token request fails.
    """
    url = f"{PRO_FILE_OS_BASE_URL}{API_ENDPOINTS['session_token']}"
    headers = {"Authorization": f"Bearer {api_key}"}
    logger.info("Requesting session token from %s", url)

    try:
        response = requests.post(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        token = data.get("token", "")

        if not token:
            raise RuntimeError("PRO-File OS returned an empty session token.")

        expiry = (datetime.utcnow() + timedelta(days=SESSION_DURATION_DAYS)).isoformat()
        session_data = {"token": token, "expiry": expiry}

        with open(SESSION_PATH, "w") as f:
            json.dump(session_data, f)

        logger.info("Session token cached. Expires: %s", expiry)
        return token

    except Exception:
        logger.error("Failed to retrieve session token:\n%s", traceback.format_exc())
        raise


def check_cached_token() -> Optional[str]:
    """
    Read and validate the locally cached session token.

    Returns:
        Token string if valid and not expired; None otherwise.
    """
    session_file = Path(SESSION_PATH)
    if not session_file.exists():
        logger.debug("No cached session token found at '%s'.", SESSION_PATH)
        return None

    try:
        with open(session_file, "r") as f:
            data = json.load(f)

        token = data.get("token", "")
        expiry_str = data.get("expiry", "")

        if not token or not expiry_str:
            logger.warning("Cached session file is malformed — treating as expired.")
            return None

        expiry = datetime.fromisoformat(expiry_str)
        if datetime.utcnow() >= expiry:
            logger.info("Cached session token has expired.")
            return None

        logger.debug("Valid cached session token found. Expires: %s", expiry_str)
        return token

    except Exception:
        logger.error("Failed to read cached session:\n%s", traceback.format_exc())
        return None


def is_authenticated() -> tuple[bool, str]:
    """
    Determine whether a valid PRO-File OS session is active.

    Checks the cached token first. If absent or expired, attempts live validation
    using the API key from .env.

    Returns:
        (True, tier_string)  if authenticated.
        (False, "")          if not authenticated.
    """
    cached = check_cached_token()
    if cached:
        logger.info("Authentication confirmed via cached session token.")
        return True, "cached"

    logger.info("No valid cache — attempting live license validation.")
    try:
        api_key = load_api_key()
    except RuntimeError:
        return False, ""

    result = validate_license(api_key)
    if result.get("valid"):
        tier = result.get("tier", "unknown")
        logger.info("Live license validated. Tier: %s", tier)
        return True, tier

    logger.warning("PRO-File OS license validation failed: %s", result)
    return False, ""
