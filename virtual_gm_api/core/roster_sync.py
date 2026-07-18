"""
roster_sync.py — The Virtual GM · PRO-File OS API Client
Handles /sync/roster, /verify/school, /verify/ncaa calls.

ALL configuration (base URL, API key) comes from environment variables only.
Falls back gracefully when PRO-File OS is unreachable (ZHR: no invented data).
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Optional

import requests

logger = logging.getLogger(__name__)

_TIMEOUT = 12  # seconds


def _base_url() -> str:
    url = os.getenv("PRO_FILE_OS_API_URL", "").rstrip("/")
    if not url:
        raise RuntimeError("PRO_FILE_OS_API_URL is not set in environment")
    return url


def _api_key() -> str:
    key = os.getenv("PRO_FILE_OS_API_KEY", "")
    if not key:
        raise RuntimeError("PRO_FILE_OS_API_KEY is not set in environment")
    return key


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type":  "application/json",
        "X-Client":      "VirtualGM/1.0",
    }


# ── Sync Roster ───────────────────────────────────────────────────────────────

def sync_roster(operator_id: str, players: list[dict]) -> dict:
    """
    POST /sync/roster
    Pushes the operator's player list to PRO-File OS for cross-platform enrichment.

    Returns:
        {
          "status": "success" | "partial" | "failed",
          "synced_count": int,
          "failed_ids": [str, ...],
          "timestamp": str,
        }
    """
    payload = {
        "operator_id": operator_id,
        "players":     players,
        "sent_at":     datetime.now(timezone.utc).isoformat(),
    }
    try:
        resp = requests.post(
            f"{_base_url()}/sync/roster",
            json=payload,
            headers=_headers(),
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        logger.info("sync_roster: %s players synced for operator %s",
                    data.get("synced_count", "?"), operator_id)
        return data
    except requests.exceptions.ConnectionError:
        logger.warning("sync_roster: PRO-File OS unreachable (connection error)")
        return _offline_result("connection_error", len(players))
    except requests.exceptions.Timeout:
        logger.warning("sync_roster: PRO-File OS request timed out")
        return _offline_result("timeout", len(players))
    except requests.exceptions.HTTPError as exc:
        logger.error("sync_roster: HTTP %s — %s", exc.response.status_code, exc)
        return _offline_result(f"http_{exc.response.status_code}", len(players))
    except Exception as exc:
        logger.error("sync_roster: unexpected error — %s", exc)
        return _offline_result("unknown_error", len(players))


def _offline_result(reason: str, attempted: int) -> dict:
    return {
        "status":       "failed",
        "synced_count": 0,
        "failed_ids":   [],
        "reason":       reason,
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "note":         "PRO-File OS unavailable — roster remains local-only",
    }


# ── Verify School ─────────────────────────────────────────────────────────────

def verify_school(school_name: str, city: Optional[str] = None,
                  state: Optional[str] = None) -> dict:
    """
    POST /verify/school
    Validates a high-school name against the PRO-File OS school registry.

    Returns:
        {
          "verified": bool,
          "school_id": str | None,
          "canonical_name": str | None,
          "district": str | None,
          "classification": str | None,
        }
    """
    payload = {"school_name": school_name, "city": city, "state": state}
    try:
        resp = requests.post(
            f"{_base_url()}/verify/school",
            json=payload,
            headers=_headers(),
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        logger.info("verify_school: '%s' → verified=%s", school_name, data.get("verified"))
        return data
    except requests.exceptions.ConnectionError:
        logger.warning("verify_school: PRO-File OS unreachable")
        return _unverified_school(school_name, "connection_error")
    except requests.exceptions.Timeout:
        logger.warning("verify_school: request timed out")
        return _unverified_school(school_name, "timeout")
    except requests.exceptions.HTTPError as exc:
        logger.error("verify_school: HTTP %s", exc.response.status_code)
        return _unverified_school(school_name, f"http_{exc.response.status_code}")
    except Exception as exc:
        logger.error("verify_school: unexpected — %s", exc)
        return _unverified_school(school_name, "unknown_error")


def _unverified_school(name: str, reason: str) -> dict:
    return {
        "verified":        False,
        "school_id":       None,
        "canonical_name":  None,
        "district":        None,
        "classification":  None,
        "reason":          reason,
    }


# ── Verify NCAA ───────────────────────────────────────────────────────────────

def verify_ncaa(ncaa_id: str) -> dict:
    """
    POST /verify/ncaa
    Confirms NCAA eligibility status for a player by NCAA ID.

    Returns:
        {
          "verified": bool,
          "ncaa_id": str,
          "status": str | None,
          "expiry": str | None,
          "note": str | None,
        }
    """
    if not ncaa_id or not ncaa_id.strip().isdigit():
        return {
            "verified": False,
            "ncaa_id":  ncaa_id,
            "status":   None,
            "note":     "Invalid NCAA ID format (must be 10-digit numeric)",
        }

    payload = {"ncaa_id": ncaa_id.strip()}
    try:
        resp = requests.post(
            f"{_base_url()}/verify/ncaa",
            json=payload,
            headers=_headers(),
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        logger.info("verify_ncaa: %s → %s", ncaa_id, data.get("status"))
        return data
    except requests.exceptions.ConnectionError:
        logger.warning("verify_ncaa: PRO-File OS unreachable")
        return _unverified_ncaa(ncaa_id, "connection_error")
    except requests.exceptions.Timeout:
        logger.warning("verify_ncaa: request timed out")
        return _unverified_ncaa(ncaa_id, "timeout")
    except requests.exceptions.HTTPError as exc:
        logger.error("verify_ncaa: HTTP %s", exc.response.status_code)
        return _unverified_ncaa(ncaa_id, f"http_{exc.response.status_code}")
    except Exception as exc:
        logger.error("verify_ncaa: unexpected — %s", exc)
        return _unverified_ncaa(ncaa_id, "unknown_error")


def _unverified_ncaa(ncaa_id: str, reason: str) -> dict:
    return {
        "verified": False,
        "ncaa_id":  ncaa_id,
        "status":   None,
        "expiry":   None,
        "note":     f"Could not verify with PRO-File OS ({reason})",
    }
