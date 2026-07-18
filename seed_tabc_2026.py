"""
seed_tabc_2026.py
=================
Ingest a VERIFIED TABC 2026 roster export into HU-OS.

Zero Hallucination contract:
  * Reads roster rows ONLY from a verified CSV. Fabricates nothing.
  * Every neck_up_* score, ovr, market_position, confidence_band = NULL at ingest.
  * neck_down_* is stored PROVISIONAL (self-reported, not film-verified).
  * Merge guard on (full_name, graduation_year): existing -> UPDATE, never duplicate.
  * exclude=TRUE rows route to exclusion_ledger, never into athletes.

Run:
    python seed_tabc_2026.py --csv tabc_2026_roster.csv [--dry-run]

Requires (server-side only):
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HU_INGEST_SECRET
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from dataclasses import dataclass, field, asdict
from datetime import date, datetime
from typing import Optional


# ---------------------------------------------------------------------------
# CONSTANTS (Race to Maturity age floors — locked doctrine)
# ---------------------------------------------------------------------------
MATURITY_BANDS = (
    (0, 12, "identity_only"),       # log identity only
    (13, 14, "gauntlet_entry"),     # monitor / CIR only
    (15, 16, "audit_window"),       # first valid PRO-Score window
    (17, 200, "full_verification"), # full Sovereign Asset verification
)

# Fields that must NEVER be written at ingest (stay NULL until a real Neural Audit).
NULL_AT_INGEST = (
    "neck_up_pro_score", "neck_up_culture_equity", "neck_up_resilience",
    "neck_up_coachability", "neck_up_ner", "neck_up_playmaking",
    "neck_up_defense", "neck_up_physical_output", "ovr",
    "market_position", "confidence_band",
)


# ---------------------------------------------------------------------------
# DATA MODEL
# ---------------------------------------------------------------------------
@dataclass
class ProspectRow:
    """One verified roster row mapped to the athletes schema (scores excluded)."""
    full_name: str
    graduation_year: int
    sport: str = "basketball"
    date_of_birth: Optional[str] = None
    school: Optional[str] = None
    position: Optional[str] = None
    # Neck Down = self-reported measurables (stored PROVISIONAL)
    neck_down_metrics: dict = field(default_factory=dict)
    # routing
    exclude: bool = False
    exclude_reason: Optional[str] = None
    # derived
    maturity_stage: Optional[str] = None
    source: str = "TABC_2026"


def _age_from_dob(dob_str: Optional[str], grad_year: int) -> Optional[int]:
    """Best-effort age. Uses DOB when present; else infers a floor from grad year.

    Zero Hallucination: when DOB is absent we do NOT invent a birthdate; we infer a
    conservative maturity band from graduation year only (grad year - ~18 = birth year
    approximation used solely for gating, never stored as a fact).
    """
    if dob_str:
        for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%m/%d/%y"):
            try:
                dob = datetime.strptime(dob_str.strip(), fmt).date()
                today = date.today()
                return today.year - dob.year - (
                    (today.month, today.day) < (dob.month, dob.day)
                )
            except ValueError:
                continue
    # Fallback: infer from grad year (typical HS senior ~18). Gating only.
    approx = 18 - (grad_year - date.today().year)
    return max(0, approx)


def _maturity_stage(age: Optional[int]) -> Optional[str]:
    """Map age to the locked Race-to-Maturity stage. None age -> None (flag for review)."""
    if age is None:
        return None
    for lo, hi, stage in MATURITY_BANDS:
        if lo <= age <= hi:
            return stage
    return None


# ---------------------------------------------------------------------------
# CSV -> ProspectRow
# ---------------------------------------------------------------------------
def parse_csv(path: str) -> list[ProspectRow]:
    """Parse and validate the verified roster CSV. Raises on placeholder data."""
    rows: list[ProspectRow] = []
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for i, raw in enumerate(reader, start=2):  # header is line 1
            name = (raw.get("full_name") or "").strip()
            if not name or name.upper().startswith("REPLACE_WITH_VERIFIED"):
                raise ValueError(
                    f"Line {i}: placeholder/empty name. Populate with the VERIFIED "
                    f"TABC export before running (Zero Hallucination)."
                )
            try:
                grad = int(str(raw.get("graduation_year", "")).strip())
            except ValueError:
                raise ValueError(f"Line {i} ({name}): graduation_year required (int).")

            neck_down = {
                k: raw[k].strip()
                for k in ("height", "weight", "wingspan")
                if raw.get(k, "").strip()
            }
            age = _age_from_dob(raw.get("date_of_birth"), grad)
            rows.append(ProspectRow(
                full_name=name,
                graduation_year=grad,
                sport=(raw.get("sport") or "basketball").strip().lower(),
                date_of_birth=(raw.get("date_of_birth") or None),
                school=(raw.get("school") or None),
                position=(raw.get("position") or None),
                neck_down_metrics=neck_down,
                exclude=str(raw.get("exclude", "")).strip().upper() == "TRUE",
                exclude_reason=(raw.get("exclude_reason") or None),
                maturity_stage=_maturity_stage(age),
            ))
    return rows


# ---------------------------------------------------------------------------
# UPSERT (merge guard) — placeholder for the Supabase client call
# ---------------------------------------------------------------------------
def upsert_prospect(client, row: ProspectRow, dry_run: bool) -> str:
    """Insert or update one prospect under the merge guard. Returns an action label.

    Scores are omitted entirely (NULL by DB default). neck_down stored PROVISIONAL.
    """
    payload = {
        "full_name": row.full_name,
        "graduation_year": row.graduation_year,
        "sport": row.sport,
        "school": row.school,
        "position": row.position,
        "neck_down_metrics": row.neck_down_metrics,   # PROVISIONAL by convention
        "neck_down_verified": False,
        "maturity_stage": row.maturity_stage,
        "sovereign_verified": False,
        "source": row.source,
    }
    # Explicitly assert the Zero-Hallucination NULLs (defensive; DB default is NULL).
    for col in NULL_AT_INGEST:
        payload.setdefault(col, None)

    if row.exclude:
        if dry_run:
            return f"WOULD EXCLUDE -> exclusion_ledger ({row.exclude_reason or 'flagged'})"
        client.table("exclusion_ledger").insert({
            "full_name": row.full_name,
            "graduation_year": row.graduation_year,
            "reason": row.exclude_reason or "flagged at ingest",
            "logged_at": datetime.utcnow().isoformat(),
        }).execute()
        return "EXCLUDED"

    if dry_run:
        return f"WOULD UPSERT (maturity={row.maturity_stage})"

    # Merge guard: match on (full_name, graduation_year); update if present else insert.
    existing = (client.table("athletes")
                .select("id")
                .eq("full_name", row.full_name)
                .eq("graduation_year", row.graduation_year)
                .execute())
    if existing.data:
        client.table("athletes").update(payload).eq("id", existing.data[0]["id"]).execute()
        return "UPDATED (merge guard)"
    client.table("athletes").insert(payload).execute()
    return "INSERTED"


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser(description="Ingest verified TABC 2026 roster into HU-OS.")
    ap.add_argument("--csv", required=True, help="Path to VERIFIED tabc_2026_roster.csv")
    ap.add_argument("--dry-run", action="store_true", help="Parse + report, write nothing.")
    args = ap.parse_args()

    if not os.path.exists(args.csv):
        print(f"ERROR: {args.csv} not found.", file=sys.stderr)
        return 1

    try:
        rows = parse_csv(args.csv)
    except ValueError as e:
        print(f"HALT (Zero Hallucination guard): {e}", file=sys.stderr)
        return 2

    client = None
    if not args.dry_run:
        # Lazy import so --dry-run needs no network / creds.
        from supabase import create_client
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        if not os.environ.get("HU_INGEST_SECRET"):
            print("ERROR: HU_INGEST_SECRET not set.", file=sys.stderr)
            return 3
        client = create_client(url, key)

    inserted = updated = excluded = 0
    for row in rows:
        action = upsert_prospect(client, row, args.dry_run)
        print(f"  {row.full_name:32s} {row.graduation_year}  ->  {action}")
        if "INSERT" in action:
            inserted += 1
        elif "UPDATE" in action:
            updated += 1
        elif "EXCLUD" in action:
            excluded += 1

    print("\n── RUN SUMMARY ──────────────────────────────")
    print(f"  parsed:   {len(rows)}")
    print(f"  inserted: {inserted}")
    print(f"  updated:  {updated} (merge guard)")
    print(f"  excluded: {excluded}")
    print(f"  scores written: 0  (Zero Hallucination — all neck_up_* NULL at ingest)")
    print(f"  mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print("  next: NDA_Analyst runs Neural Audits to initialize scores per maturity gate.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
