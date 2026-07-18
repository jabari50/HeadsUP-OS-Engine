"""
Central configuration constants for The Digital GM.

All modules import from here — no magic numbers or hardcoded strings elsewhere.
"""

PRO_FILE_OS_BASE_URL: str = "https://api.profilios.com/v1"  # placeholder

DB_PATH: str = "digital_gm.db"
LOG_PATH: str = "digital_gm.log"
SESSION_PATH: str = ".session"
SESSION_DURATION_DAYS: int = 7

APP_NAME: str = "The Digital GM"
APP_VERSION: str = "1.0.0"
DEBUG_MODE: bool = False  # set True for verbose logging

API_ENDPOINTS: dict[str, str] = {
    "auth_validate": "/auth/validate",
    "session_token": "/auth/token",
    "sync_roster":   "/sync/roster",
    "matchmaking":   "/analytics/matchmaking",
    "verify_school": "/verify/school",
    "verify_ncaa":   "/verify/ncaa",
}
