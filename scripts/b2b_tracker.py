#!/usr/bin/env python3
"""
HU-OS · B2B Tracker — FinTech Exclusivity Seat / Bidding War CLI
SQLite-backed lead manager for Executive Leads and Corporate Integration pipeline.

Usage:
  os-pitch --name "Jane Doe"                          # show record
  os-pitch --name "Jane Doe" --status Sent            # upsert status
  os-pitch --name "Jane Doe" --status FollowUp --note "Called, left VM"
  os-pitch --name "Jane Doe" --status Closed
  os-pitch --list                                     # all leads, sorted by stage
  os-pitch --list --status FollowUp                   # filter by status
  os-pitch --import-csv exec   path/to/file.csv       # import Executive Leads CSV
  os-pitch --import-csv corp   path/to/file.csv       # import Corporate Integration CSV
  os-pitch --init                                     # (re)create DB schema only

DB: scripts/b2b_tracker.db  (gitignored — never commit lead data)
"""
from __future__ import annotations

import argparse
import csv
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPTS_DIR = Path(__file__).resolve().parent
DB_PATH     = SCRIPTS_DIR / "b2b_tracker.db"

VALID_STATUSES = {"Sent", "FollowUp", "Closed"}

# ── Column aliases: what each CSV might call things → our canonical name ──────
_EXEC_COL_MAP = {
    "name":         "name",
    "full name":    "name",
    "contact":      "name",
    "company":      "company",
    "organization": "company",
    "org":          "company",
    "title":        "title",
    "role":         "title",
    "email":        "email",
    "phone":        "phone",
    "linkedin":     "linkedin",
    "notes":        "notes",
    "note":         "notes",
}

_CORP_COL_MAP = {
    **_EXEC_COL_MAP,
    "integration type": "integration_type",
    "integration":      "integration_type",
    "tier":             "tier",
    "seat":             "seat",
    "segment":          "segment",
    "vertical":         "segment",
}


# ── DB bootstrap ──────────────────────────────────────────────────────────────

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS leads (
            id                      INTEGER PRIMARY KEY AUTOINCREMENT,
            name                    TEXT NOT NULL,
            company                 TEXT,
            title                   TEXT,
            email                   TEXT,
            phone                   TEXT,
            linkedin                TEXT,
            segment                 TEXT,    -- FinTech, HealthTech, etc.
            tier                    TEXT,    -- Corporate Integration tier
            seat                    TEXT,    -- exclusivity seat label
            integration_type        TEXT,    -- Corporate Integration category
            source                  TEXT,    -- 'executive_leads' | 'corporate_integration' | 'manual'
            status                  TEXT NOT NULL DEFAULT 'Sent'
                                    CHECK(status IN ('Sent','FollowUp','Closed')),
            notes                   TEXT,
            market_entry_est        TEXT,    -- pre-premium dollar value, e.g. "$46,050.00"
            arb_verdict             TEXT,    -- final Arbitrage Verdict, e.g. "$57,562.50"
            stability_premium       INTEGER DEFAULT 0,  -- 1 if 1.25× applied
            created_at              TEXT NOT NULL,
            updated_at              TEXT NOT NULL,
            UNIQUE(name, company)
        );

        CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
        CREATE INDEX IF NOT EXISTS idx_leads_name   ON leads(name COLLATE NOCASE);
    """)

    # Forward-compatible column additions — safe to run on an existing DB
    for ddl in (
        "ALTER TABLE leads ADD COLUMN market_entry_est  TEXT",
        "ALTER TABLE leads ADD COLUMN arb_verdict       TEXT",
        "ALTER TABLE leads ADD COLUMN stability_premium INTEGER DEFAULT 0",
    ):
        try:
            conn.execute(ddl)
        except Exception:
            pass  # column already exists

    conn.commit()


# ── CSV import ────────────────────────────────────────────────────────────────

def _normalise_header(h: str) -> str:
    return h.strip().lower()


def import_csv(conn: sqlite3.Connection, csv_path: Path, source: str) -> tuple[int, int]:
    """
    Imports a CSV into leads. Returns (inserted, updated) counts.
    Unknown columns are silently ignored — ZHR: no invented values.
    """
    col_map = _CORP_COL_MAP if source == "corporate_integration" else _EXEC_COL_MAP

    inserted = updated = 0
    now = _now()

    with open(csv_path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for raw_row in reader:
            row: dict[str, str | None] = {}
            for raw_col, val in raw_row.items():
                canonical = col_map.get(_normalise_header(raw_col))
                if canonical:
                    row[canonical] = val.strip() if val and val.strip() else None

            name = row.get("name")
            if not name:
                continue

            existing = conn.execute(
                "SELECT id FROM leads WHERE name = ? COLLATE NOCASE AND company IS ?",
                (name, row.get("company")),
            ).fetchone()

            if existing:
                conn.execute(
                    """UPDATE leads SET
                        title=COALESCE(?,title), email=COALESCE(?,email),
                        phone=COALESCE(?,phone), linkedin=COALESCE(?,linkedin),
                        segment=COALESCE(?,segment), tier=COALESCE(?,tier),
                        seat=COALESCE(?,seat), integration_type=COALESCE(?,integration_type),
                        source=?, updated_at=?
                       WHERE id=?""",
                    (
                        row.get("title"), row.get("email"), row.get("phone"),
                        row.get("linkedin"), row.get("segment"), row.get("tier"),
                        row.get("seat"), row.get("integration_type"),
                        source, now, existing["id"],
                    ),
                )
                updated += 1
            else:
                conn.execute(
                    """INSERT INTO leads
                        (name, company, title, email, phone, linkedin,
                         segment, tier, seat, integration_type, source,
                         status, notes, created_at, updated_at)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?,'Sent',?,?,?)""",
                    (
                        name, row.get("company"), row.get("title"),
                        row.get("email"), row.get("phone"), row.get("linkedin"),
                        row.get("segment"), row.get("tier"), row.get("seat"),
                        row.get("integration_type"), source,
                        row.get("notes"), now, now,
                    ),
                )
                inserted += 1

    conn.commit()
    return inserted, updated


# ── CRUD ──────────────────────────────────────────────────────────────────────

def upsert_lead(
    conn: sqlite3.Connection,
    name: str,
    status: str | None,
    note: str | None,
    arb_verdict: str | None = None,
    market_entry_est: str | None = None,
    stability_premium: bool | None = None,
) -> sqlite3.Row:
    now = _now()
    existing = conn.execute(
        "SELECT * FROM leads WHERE name = ? COLLATE NOCASE", (name,)
    ).fetchone()

    if existing:
        updates: list[str] = ["updated_at=?"]
        params: list = [now]
        if status:
            updates.append("status=?");           params.append(status)
        if note:
            updates.append("notes=?");            params.append(note)
        if arb_verdict:
            updates.append("arb_verdict=?");      params.append(arb_verdict)
        if market_entry_est:
            updates.append("market_entry_est=?"); params.append(market_entry_est)
        if stability_premium is not None:
            updates.append("stability_premium=?"); params.append(int(stability_premium))
        params.append(existing["id"])
        conn.execute(f"UPDATE leads SET {', '.join(updates)} WHERE id=?", params)
        conn.commit()
    else:
        conn.execute(
            """INSERT INTO leads
               (name, status, notes, source, arb_verdict, market_entry_est,
                stability_premium, created_at, updated_at)
               VALUES (?, ?, ?, 'manual', ?, ?, ?, ?, ?)""",
            (name, status or "Sent", note,
             arb_verdict, market_entry_est,
             int(stability_premium) if stability_premium is not None else 0,
             now, now),
        )
        conn.commit()

    return conn.execute(
        "SELECT * FROM leads WHERE name = ? COLLATE NOCASE", (name,)
    ).fetchone()


def get_lead(conn: sqlite3.Connection, name: str) -> sqlite3.Row | None:
    return conn.execute(
        "SELECT * FROM leads WHERE name = ? COLLATE NOCASE", (name,)
    ).fetchone()


def list_leads(conn: sqlite3.Connection, status_filter: str | None = None) -> list[sqlite3.Row]:
    if status_filter:
        return conn.execute(
            "SELECT * FROM leads WHERE status=? ORDER BY updated_at DESC", (status_filter,)
        ).fetchall()
    return conn.execute(
        "SELECT * FROM leads ORDER BY CASE status "
        "WHEN 'FollowUp' THEN 0 WHEN 'Sent' THEN 1 WHEN 'Closed' THEN 2 END, "
        "updated_at DESC"
    ).fetchall()


# ── Display ───────────────────────────────────────────────────────────────────

_STATUS_COLOR = {"Sent": "\033[33m", "FollowUp": "\033[36m", "Closed": "\033[32m"}
_RESET = "\033[0m"
_BOLD  = "\033[1m"


def _status_label(status: str) -> str:
    color = _STATUS_COLOR.get(status, "")
    return f"{color}{status}{_RESET}"


_VERDICT_COLOR = "\033[32m"   # green — money


def print_lead(row: sqlite3.Row) -> None:
    fields = dict(row)
    print(f"\n{_BOLD}{fields['name']}{_RESET}  [{_status_label(fields['status'])}]")
    for key in ("company", "title", "email", "phone", "linkedin",
                "segment", "tier", "seat", "integration_type", "source"):
        val = fields.get(key)
        if val:
            print(f"  {key:<22} {val}")

    # ── Arbitrage Verdict block ────────────────────────────────────────────────
    verdict = fields.get("arb_verdict")
    entry   = fields.get("market_entry_est")
    premium = fields.get("stability_premium")
    if verdict:
        premium_tag = "  ✦ Stability Premium Applied" if premium else ""
        print(
            f"\n  {_BOLD}{'ARBITRAGE VERDICT':<22}"
            f"{_VERDICT_COLOR}{verdict}{premium_tag}{_RESET}"
        )
    if entry:
        print(f"  {'Market Entry Est.':<22}{entry}")

    if fields.get("notes"):
        print(f"\n  {'notes':<22} {fields['notes']}")
    print(f"  {'updated':<22} {fields['updated_at']}")


def print_table(rows: list[sqlite3.Row]) -> None:
    if not rows:
        print("No leads found.")
        return
    print(f"\n{'#':<4} {'Name':<26} {'Company':<22} {'Status':<10} {'Updated':<20}")
    print("─" * 85)
    for i, row in enumerate(rows, 1):
        r = dict(row)
        print(
            f"{i:<4} {str(r['name']):<26} {str(r.get('company') or ''):<22} "
            f"{_status_label(r['status']):<10} {r['updated_at'][:16]}"
        )
    print()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _die(msg: str) -> None:
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


# ── CLI ───────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="os-pitch",
        description="HU-OS B2B Tracker — manage the FinTech exclusivity Bidding War",
    )
    p.add_argument("--name",       metavar="NAME",   help="Lead name (lookup or upsert)")
    p.add_argument("--status",     metavar="STATUS", choices=sorted(VALID_STATUSES),
                   help="Set status: Sent | FollowUp | Closed")
    p.add_argument("--note",       metavar="TEXT",   help="Add/update notes for this lead")
    p.add_argument("--verdict",    metavar="AMT",    help="Set Arbitrage Verdict, e.g. '$57,562.50'")
    p.add_argument("--entry",      metavar="AMT",    help="Set Market Entry Estimate")
    p.add_argument("--premium",    action="store_true", default=None,
                   help="Flag that 1.25× Stability Premium was applied")
    p.add_argument("--list",       action="store_true", help="List all leads")
    p.add_argument("--import-csv", nargs=2, metavar=("TYPE", "FILE"),
                   help="Import CSV: type is 'exec' or 'corp', FILE is path to CSV")
    p.add_argument("--init",       action="store_true", help="Initialise DB schema and exit")
    return p


def main(argv: list[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)

    conn = get_conn()
    init_db(conn)

    # ── --init ────────────────────────────────────────────────────────────────
    if args.init:
        print(f"DB initialised → {DB_PATH}")
        return

    # ── --import-csv ──────────────────────────────────────────────────────────
    if args.import_csv:
        csv_type, csv_file = args.import_csv
        if csv_type not in ("exec", "corp"):
            _die("--import-csv type must be 'exec' or 'corp'")
        source = "executive_leads" if csv_type == "exec" else "corporate_integration"
        path = Path(csv_file).expanduser().resolve()
        if not path.exists():
            _die(f"CSV not found: {path}")
        inserted, updated = import_csv(conn, path, source)
        print(f"Imported {source}: {inserted} new, {updated} updated → {DB_PATH}")
        return

    # ── --list ────────────────────────────────────────────────────────────────
    if args.list:
        rows = list_leads(conn, status_filter=args.status)
        print_table(rows)
        return

    # ── --name (lookup / upsert) ──────────────────────────────────────────────
    if args.name:
        has_update = any([
            args.status, args.note, args.verdict, args.entry,
            args.premium,
        ])
        if has_update:
            row = upsert_lead(
                conn, args.name, args.status, args.note,
                arb_verdict=args.verdict,
                market_entry_est=args.entry,
                stability_premium=args.premium if args.premium else None,
            )
            print_lead(row)
        else:
            row = get_lead(conn, args.name)
            if row:
                print_lead(row)
            else:
                print(f"No lead found for '{args.name}'. Use --status to create one.")
        return

    parser.print_help()


if __name__ == "__main__":
    main()
