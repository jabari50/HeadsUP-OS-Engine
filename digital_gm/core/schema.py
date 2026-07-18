"""
Canonical schema definitions for The Digital GM.

All column names, valid enum values, and table structure constants live here.
No module hard-codes field names — always import from this file.
"""

# ---------------------------------------------------------------------------
# Player schema — ordered 19-column definition
# ---------------------------------------------------------------------------
PLAYER_SCHEMA: list[str] = [
    "player_id",           # UUID string, generated on ingestion
    "full_name",           # string
    "grad_year",           # int (e.g., 2026)
    "position",            # string (PG, SG, SF, PF, C, G, F, G/F, F/C)
    "high_school",         # string
    "aau_program",         # string, nullable
    "height_inches",       # int, nullable — flag if missing
    "weight_lbs",          # int, nullable
    "wingspan_inches",     # int, nullable
    "eligibility_status",  # string: Active|Committed|Signed|Transfer|Pro
    "committed_college",   # string, nullable
    "ncaa_id",             # string, nullable
    "data_source",         # string: manual|csv_import|api_sync
    "ingestion_date",      # datetime string ISO format
    "last_modified",       # datetime string ISO format
    "ingested_by",         # string (operator username)
    "verification_needed", # bool
    "verification_reason", # string — WHY it was flagged, empty string if clean
    "sync_status",         # string: pending|synced|rejected_by_master
]

# ---------------------------------------------------------------------------
# Team schema
# ---------------------------------------------------------------------------
TEAM_SCHEMA: list[str] = [
    "team_id",       # UUID string
    "program_id",    # UUID string
    "team_name",     # string
    "age_group",     # string (17U, 16U, 15U, etc.)
    "head_coach",    # string
    "season_year",   # int
    "created_date",  # datetime string
]

# ---------------------------------------------------------------------------
# Program schema
# ---------------------------------------------------------------------------
PROGRAM_SCHEMA: list[str] = [
    "program_id",       # UUID string
    "program_name",     # string
    "city",             # string
    "state",            # string
    "operator_name",    # string
    "operator_email",   # string
    "os_license_tier",  # string: solo|pro|elite|enterprise
    "license_key",      # string (from PRO-File OS)
    "created_date",     # datetime string
]

# ---------------------------------------------------------------------------
# Valid enum values
# ---------------------------------------------------------------------------
VALID_POSITIONS: list[str] = ["PG", "SG", "SF", "PF", "C", "G", "F", "G/F", "F/C"]
VALID_ELIGIBILITY: list[str] = ["Active", "Committed", "Signed", "Transfer", "Pro"]
VALID_SYNC_STATUS: list[str] = ["pending", "synced", "rejected_by_master"]
VALID_DATA_SOURCES: list[str] = ["manual", "csv_import", "api_sync"]
VALID_LICENSE_TIERS: list[str] = ["solo", "pro", "elite", "enterprise"]
