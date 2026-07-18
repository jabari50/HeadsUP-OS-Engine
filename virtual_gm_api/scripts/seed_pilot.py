#!/usr/bin/env python3
"""
seed_pilot.py — The Virtual GM · Pilot Operator Seed Script
One command to onboard a high school program and get a live session token.

Usage (from virtual_gm_api/ directory):
    python scripts/seed_pilot.py
    python scripts/seed_pilot.py --tier pro --program "Lancaster Tigers" \\
        --city "Lancaster" --state TX --email coach@lhs.edu

Secrets read from .env — never hardcoded.
"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Allow imports from package root
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env", override=False)

from db.database import initialize_db, insert_operator, insert_player
from models.data_models import (
    LicenseTier,
    OperatorLicense,
    PlayerProfile,
    TIER_UNLOCK_LIMITS,
)
from utils.session import issue_token

# ── Seed player data (fictional Lancaster Tigers, mirrors design spec) ─────────

SEED_PLAYERS = [
    dict(full_name="Devon Hayes",      position="SG", grad_year=2025, high_school="Lancaster High School",
         height_inches=76, weight_lbs=185, gpa=3.1, data_source="seed"),
    dict(full_name="Marcus Okonkwo",   position="PG", grad_year=2026, high_school="Lancaster High School",
         height_inches=73, weight_lbs=170, gpa=3.4, data_source="seed"),
    dict(full_name="Tyrese Calloway",  position="SF", grad_year=2025, high_school="Lancaster High School",
         height_inches=78, weight_lbs=200, gpa=3.7, data_source="seed"),
    dict(full_name="Brandon Mireles",  position="PF", grad_year=2026, high_school="Lancaster High School",
         height_inches=79, weight_lbs=215, gpa=2.9, data_source="seed"),
    dict(full_name="Isaiah Whitmore",  position="C",  grad_year=2025, high_school="Lancaster High School",
         height_inches=81, weight_lbs=235, gpa=3.3, data_source="seed"),
    dict(full_name="Caleb Ferguson",   position="PG", grad_year=2027, high_school="Lancaster High School",
         height_inches=71, weight_lbs=165, gpa=3.2, data_source="seed"),
    dict(full_name="Xavier Benton",    position="SG", grad_year=2026, high_school="Lancaster High School",
         height_inches=75, weight_lbs=180, gpa=2.1, data_source="seed"),
    dict(full_name="Jordan Castellano",position="SF", grad_year=2027, high_school="Lancaster High School",
         height_inches=76, weight_lbs=195, gpa=3.6, data_source="seed"),
]


def _print_banner(msg: str) -> None:
    bar = "─" * 56
    print(f"\n{bar}\n  {msg}\n{bar}")


def run(
    operator_name: str,
    email:         str,
    license_tier:  str,
    program_name:  str,
    program_city:  str,
    program_state: str,
    db_path:       str,
) -> None:
    _print_banner("The Virtual GM · Pilot Seed")
    print(f"  DB:       {db_path}")
    print(f"  Operator: {operator_name}")
    print(f"  Program:  {program_name}, {program_city} {program_state}")
    print(f"  Tier:     {license_tier}")
    print()

    # 1. Initialize DB
    initialize_db(db_path)
    print("✓ Database initialised")

    # 2. Create operator
    op = OperatorLicense(
        operator_name       = operator_name,
        email               = email,
        license_tier        = license_tier,
        program_name        = program_name,
        program_city        = program_city,
        program_state       = program_state,
        max_unlocks         = TIER_UNLOCK_LIMITS.get(license_tier, 5),
        approved_by_master  = True,
    )
    op_dict = op.model_dump()
    op_dict["approved_by_master"] = int(op_dict["approved_by_master"])
    operator_id = insert_operator(op_dict, db_path)
    print(f"✓ Operator created:  {operator_id}")
    print(f"  License key:        {op.license_key}")

    # 3. Issue session token
    token = issue_token(operator_id, db_path)
    print(f"✓ Session token issued (valid 7 days)")

    # 4. Seed players
    player_ids = []
    for raw in SEED_PLAYERS:
        profile    = PlayerProfile(**raw)
        pid        = insert_player(profile.model_dump(), db_path)
        player_ids.append(pid)
    print(f"✓ {len(player_ids)} seed players added")

    # 5. Summary
    _print_banner("Seed complete — save these credentials")
    print(f"  Operator ID:    {operator_id}")
    print(f"  License key:    {op.license_key}")
    print(f"  Session token:  {token}")
    print()
    print("  Use this token in all API requests:")
    print(f"    Authorization: Bearer {token}")
    print()
    print("  API base URL:   http://localhost:8001/api/v1")
    print("  Docs:           http://localhost:8001/docs")
    print()
    print(f"  Seeded {len(player_ids)} players for {program_name}.")
    print(f"  Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed the pilot operator and initial roster for The Virtual GM."
    )
    parser.add_argument("--name",     default="Coach Antoine Briggs",     help="Operator name")
    parser.add_argument("--email",    default="briggs@lancastertigers.edu", help="Operator email")
    parser.add_argument("--tier",     default=LicenseTier.PRO.value,
                        choices=[t.value for t in LicenseTier],            help="License tier")
    parser.add_argument("--program",  default="Lancaster Tigers Basketball", help="Program name")
    parser.add_argument("--city",     default="Lancaster",                  help="Program city")
    parser.add_argument("--state",    default="TX",                         help="Program state")
    parser.add_argument("--db",       default=os.getenv("VGM_DB_PATH", "virtual_gm.db"),
                        help="SQLite DB path")
    args = parser.parse_args()

    run(
        operator_name = args.name,
        email         = args.email,
        license_tier  = args.tier,
        program_name  = args.program,
        program_city  = args.city,
        program_state = args.state,
        db_path       = args.db,
    )


if __name__ == "__main__":
    main()
