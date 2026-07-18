"""
The Digital GM — Phase 1 pipeline integration test.

No UI. Verifies the full core stack: logging, auth check, DB initialization,
and sanitizer flagging. Run this to confirm Phase 1 is wired correctly before
advancing to Phase 2.
"""

import sys
import os
from pathlib import Path

# Ensure the digital_gm package root is on the path so relative imports work
# when running: python digital_gm/main.py from the repo root.
_pkg_root = Path(__file__).parent
if str(_pkg_root) not in sys.path:
    sys.path.insert(0, str(_pkg_root))

from config import APP_NAME, APP_VERSION, DB_PATH, LOG_PATH, DEBUG_MODE
from utils.logger import configure_logging, get_logger


def _check_env_file() -> bool:
    """Return True if .env exists in the package root; log CRITICAL and return False otherwise."""
    env_path = _pkg_root / ".env"
    if not env_path.exists():
        logger.critical(
            ".env file not found at '%s'. "
            "Create it from .env.example and add your PRO_FILE_OS_API_KEY.",
            env_path,
        )
        return False
    return True


def _run_sanitizer_test() -> None:
    """
    Run a controlled sanitizer test with 2 clean fields and 2 intentionally missing fields.
    Logs the sanitized output and verification flags.
    """
    from core.sanitizer import sanitize_player_record

    sample_raw = {
        "full_name":          "Marcus Webb",
        "grad_year":          2026,
        "position":           None,           # intentionally missing
        "high_school":        None,           # intentionally missing
        "aau_program":        "Team Loaded DFW",
        "height_inches":      76,
        "weight_lbs":         185,
        "wingspan_inches":    None,
        "eligibility_status": "Active",
        "committed_college":  None,
        "ncaa_id":            None,
        "data_source":        "manual",
    }

    logger.info("--- Sanitizer test begin ---")
    result_df = sanitize_player_record(sample_raw, ingested_by="test_operator")

    logger.info("Sanitized record:")
    for col in result_df.columns:
        logger.info("  %-24s %s", col, result_df.iloc[0][col])

    verification_needed = result_df.iloc[0]["verification_needed"]
    verification_reason = result_df.iloc[0]["verification_reason"]

    logger.info("verification_needed : %s", verification_needed)
    logger.info("verification_reason : %s", verification_reason)
    logger.info("--- Sanitizer test end ---")

    print()
    print("  Sanitized player: Marcus Webb")
    print(f"  Flagged          : {verification_needed}")
    print(f"  Flag reason      : {verification_reason}")


def main() -> None:
    """Phase 1 integration test entry point."""
    # Step 1 — initialize logger
    configure_logging(log_path=str(_pkg_root / LOG_PATH), debug=DEBUG_MODE)

    global logger
    logger = get_logger(__name__)

    # Step 2 — startup banner
    logger.info("%s v%s initializing...", APP_NAME, APP_VERSION)
    print(f"\n{'='*50}")
    print(f"  {APP_NAME} v{APP_VERSION} — Phase 1 Pipeline Test")
    print(f"{'='*50}\n")

    # Step 3 — check for .env
    if not _check_env_file():
        print("\n[CRITICAL] .env file missing. See .env.example for required keys.")
        print("  Create digital_gm/.env with your PRO_FILE_OS_API_KEY to proceed.\n")
        sys.exit(1)

    # Step 4 — authentication check
    from api.auth import is_authenticated

    authenticated, tier = is_authenticated()

    if not authenticated:
        print()
        print("[ERROR] PRO-File OS license could not be verified.")
        print(
            "  The Digital GM requires a valid PRO-File OS operator license.\n"
            "  Check your PRO_FILE_OS_API_KEY in .env and ensure network access\n"
            "  to the PRO-File OS API is available.\n"
        )
        logger.error("Authentication failed. Application cannot proceed.")
        sys.exit(1)

    # Step 5 — authenticated
    logger.info("PRO-File OS license verified. Tier: %s", tier)
    print(f"  [OK] PRO-File OS license verified. Tier: {tier}\n")

    # Step 6 — initialize local DB
    from core.db import initialize_db

    db_full_path = str(_pkg_root / DB_PATH)
    initialize_db(db_full_path)
    print(f"  [OK] Local database initialized at '{db_full_path}'\n")

    # Step 7 — log DB ready
    logger.info("Local database initialized.")

    # Step 8-9 — run sanitizer test
    print("  Running sanitizer test (2 clean fields, 2 missing)...")
    _run_sanitizer_test()

    # Step 10 — done
    print()
    print("Phase 1 pipeline test complete.")
    print(f"{'='*50}\n")
    logger.info("Phase 1 pipeline test complete.")


# Module-level logger placeholder — assigned in main() after configure_logging()
logger = get_logger(__name__)

if __name__ == "__main__":
    main()
