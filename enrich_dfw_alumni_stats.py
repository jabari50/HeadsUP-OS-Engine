#!/usr/bin/env python3
"""
HU-OS · DFW Alumni Stats Enrichment
Pulls current-season stats for all 141 DFW Pipeline alumni from ESPN public APIs.
  • NBA / G-League  → ESPN NBA stats (season 2025 = 2024-25)
  • NCAA D1         → ESPN NCAAB stats (season 2025 = 2024-25)

ZHR enforced: any field not confirmed from source is skipped (not written as null).

Run:
  python enrich_dfw_alumni_stats.py            # all alumni
  python enrich_dfw_alumni_stats.py --dry-run  # print-only
  python enrich_dfw_alumni_stats.py --name "Tre Johnson"
  python enrich_dfw_alumni_stats.py --level NBA
"""
from __future__ import annotations
import argparse, re, sys, time, warnings, json
from difflib import SequenceMatcher
from typing import Optional

import requests
warnings.filterwarnings("ignore")
from supabase import create_client

# ── Config ────────────────────────────────────────────────────────────────────
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env.local")
load_dotenv(Path(__file__).resolve().parent / ".env")

SUPABASE_URL = (
    os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    or "https://pgdvzvsnehkkhsubquhi.supabase.co"
)
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
if not SUPABASE_KEY:
    sys.exit(
        "SUPABASE_SERVICE_ROLE_KEY is not set — add it to .env.local. "
        "Refusing to run without credentials."
    )

ESPN_SEARCH    = "https://site.api.espn.com/apis/search/v2"
ESPN_NBA_STATS = "https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/stats"
ESPN_NCB_STATS = "https://site.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/athletes/{id}/stats"
ESPN_NBA_SRCH  = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/athletes"
ESPN_NCB_SRCH  = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/athletes"
TARGET_YEAR    = 2025   # 2024-25 season
DELAY          = 0.35   # seconds between ESPN calls

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}

# ── ZHR helpers ───────────────────────────────────────────────────────────────
_NULL_STRS = {"", "-", "—", "--", "N/A", "n/a", "null", "none"}

def sf(v) -> Optional[float]:
    """safe_float — ZHR."""
    if v is None: return None
    try:
        s = str(v).strip().rstrip("%").replace(",", "").split("-")[0]  # handle "9.2-21.0"
        return None if s.lower() in _NULL_STRS else float(s)
    except (ValueError, TypeError):
        return None

def pct_field(v) -> Optional[float]:
    """Convert percentage (43.7 → 0.437) — ZHR."""
    f = sf(v)
    if f is None: return None
    return round(f / 100, 4) if f > 1.0 else round(f, 4)

def sim(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()

def _get(url: str, params: dict = None) -> Optional[dict]:
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=12)
        time.sleep(DELAY)
        return r.json() if r.ok else None
    except Exception:
        time.sleep(DELAY)
        return None

# ── ESPN ID extraction ────────────────────────────────────────────────────────
def _espn_id_from_uid(uid: str) -> Optional[str]:
    """Extract numeric ESPN athlete ID from uid like 's:40~l:46~a:4431678'."""
    m = re.search(r"a:(\d+)", uid or "")
    return m.group(1) if m else None

def _espn_id_from_link(link: str) -> Optional[str]:
    """Extract ESPN ID from URL like '.../player/_/id/4431678/...'."""
    m = re.search(r"/id/(\d+)", link or "")
    return m.group(1) if m else None

# ── ESPN search ───────────────────────────────────────────────────────────────
def espn_find_athlete(name: str, league: str = "nba") -> Optional[str]:
    """
    Search ESPN for a player and return their numeric athlete ID.
    Tries global search first, then league-specific endpoint.
    """
    # 1. Global ESPN search
    data = _get(ESPN_SEARCH, {"limit": 10, "query": name,
                               "sport": "basketball", "league": league})
    if data:
        for section in data.get("results", []):
            if section.get("type") != "player":
                continue
            for item in section.get("contents", []):
                dname = item.get("displayName", "")
                if sim(name, dname) < 0.70:
                    continue
                # Try to extract ID from uid or link
                uid  = item.get("uid", "")
                link = (item.get("link") or {}).get("web", "")
                eid  = _espn_id_from_uid(uid) or _espn_id_from_link(link)
                if eid:
                    return eid

    # 2. League-specific athlete search
    srch_url = ESPN_NBA_SRCH if league == "nba" else ESPN_NCB_SRCH
    data2 = _get(srch_url, {"search": name, "limit": 10})
    if data2:
        for item in (data2.get("items") or data2.get("athletes") or []):
            dname = item.get("displayName") or item.get("fullName") or ""
            if sim(name, dname) >= 0.70:
                eid = item.get("id") or _espn_id_from_uid(item.get("uid", ""))
                if eid:
                    return str(eid)

    # 3. Retry with first-initial last-name
    parts = name.split()
    if len(parts) >= 2:
        short = parts[0][0] + " " + parts[-1]
        if short.lower() != name.lower():
            return espn_find_athlete(short, league) if len(short) > 3 else None

    return None


# ── ESPN stats parser ─────────────────────────────────────────────────────────
def _latest_season_stats(categories: list, target_year: int = TARGET_YEAR) -> dict:
    """
    ESPN returns a list of season rows in category.statistics.
    Find the row for target_year; fall back to the most recent available year.
    Returns a dict of label→value for the averages category.
    """
    avg_cat = next(
        (c for c in categories if c.get("name") == "averages"),
        None
    )
    if not avg_cat:
        return {}

    labels    = avg_cat.get("labels", [])
    all_stats = avg_cat.get("statistics", [])
    if not all_stats:
        return {}

    # Sort by year descending; pick target year or most recent
    seasons = sorted(all_stats, key=lambda s: s.get("season", {}).get("year", 0), reverse=True)
    row = next((s for s in seasons if s.get("season", {}).get("year") == target_year), seasons[0])

    raw_vals = row.get("stats", [])
    return {labels[i]: raw_vals[i] for i in range(min(len(labels), len(raw_vals)))}


def fetch_nba_stats(espn_id: str) -> dict:
    data = _get(ESPN_NBA_STATS.format(id=espn_id))
    if not data:
        return {}
    cats = data.get("categories", [])
    return _latest_season_stats(cats)


def fetch_ncb_stats(espn_id: str) -> dict:
    data = _get(ESPN_NCB_STATS.format(id=espn_id))
    if not data:
        return {}
    cats = data.get("categories", [])
    return _latest_season_stats(cats)


def stats_to_neck_down(raw: dict) -> dict:
    """
    Map ESPN label names → neck_down_metrics field names.
    ZHR: only non-None values are included.
    """
    def g(*keys):
        for k in keys:
            v = raw.get(k)
            if v is not None and str(v).strip() not in _NULL_STRS:
                return v
        return None

    out = {}
    ppg = sf(g("PTS"))
    rpg = sf(g("REB"))
    apg = sf(g("AST"))
    spg = sf(g("STL"))
    bpg = sf(g("BLK"))
    mpg = sf(g("MIN"))
    gp  = sf(g("GP"))
    fg  = pct_field(g("FG%"))
    tp  = pct_field(g("3P%"))
    ft  = pct_field(g("FT%"))

    if ppg is not None: out["ppg"] = ppg
    if rpg is not None: out["rpg"] = rpg
    if apg is not None: out["apg"] = apg
    if spg is not None: out["spg"] = spg
    if bpg is not None: out["bpg"] = bpg
    if mpg is not None: out["mpg"] = mpg
    if gp  is not None: out["gp"]  = int(gp)
    if fg  is not None: out["fg_pct"]       = fg
    if tp  is not None: out["three_pt_pct"] = tp
    if ft  is not None: out["ft_pct"]       = ft
    return out


# ── Supabase ──────────────────────────────────────────────────────────────────
def load_alumni(db) -> list:
    res = (
        db.table("athletes")
        .select("id,full_name,position,neck_down_metrics")
        .eq("neck_up_markers->>pipeline_cohort", "dfw_alumni_2025")
        .order("neck_down_metrics->>career_level")
        .execute()
    )
    return res.data or []


def upsert_metrics(db, athlete_id: str, patch: dict, dry_run: bool) -> bool:
    patch = {k: v for k, v in patch.items() if v is not None}
    if not patch:
        return False
    if dry_run:
        print(f"      → [DRY] {json.dumps(patch)}")
        return True
    # Merge into existing neck_down_metrics
    res = db.table("athletes").select("neck_down_metrics").eq("id", athlete_id).single().execute()
    current = (res.data or {}).get("neck_down_metrics") or {}
    merged  = {**current, **patch}
    db.table("athletes").update({"neck_down_metrics": merged}).eq("id", athlete_id).execute()
    return True


# ── Per-player enrichment ─────────────────────────────────────────────────────
def enrich_one(athlete: dict, db, dry_run: bool) -> bool:
    name  = athlete["full_name"]
    dm    = athlete.get("neck_down_metrics") or {}
    level = dm.get("career_level", "")

    league    = "nba"          if level in ("NBA", "G-League") else "mens-college-basketball"
    fetch_fn  = fetch_nba_stats if league == "nba" else fetch_ncb_stats

    espn_id = espn_find_athlete(name, league)
    if not espn_id:
        print(f"  ✗ no ESPN match")
        return False

    raw   = fetch_fn(espn_id)
    patch = stats_to_neck_down(raw)

    if not patch:
        print(f"  ✗ stats empty (id={espn_id})")
        return False

    summary = f"ppg={patch.get('ppg')} rpg={patch.get('rpg')} apg={patch.get('apg')} gp={patch.get('gp')}"
    print(f"  ✓ id={espn_id} | {summary}")
    return upsert_metrics(db, athlete["id"], patch, dry_run)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run",  action="store_true")
    parser.add_argument("--level",    choices=["NBA", "G-League", "D1", "all"], default="all")
    parser.add_argument("--name",     default=None, help="Filter to one player by name substring.")
    args = parser.parse_args()

    db     = create_client(SUPABASE_URL, SUPABASE_KEY)
    alumni = load_alumni(db)
    if not alumni:
        print("No alumni found — run inject_dfw_alumni.py first."); sys.exit(1)

    print(f"\nLoaded {len(alumni)} DFW alumni.")
    if args.dry_run:
        print("DRY RUN — no writes.\n")

    updated = skipped = errors = 0

    for a in alumni:
        name  = a["full_name"]
        level = (a.get("neck_down_metrics") or {}).get("career_level", "")

        if args.name and args.name.lower() not in name.lower():
            continue
        if args.level != "all":
            if args.level in ("NBA", "G-League") and level not in ("NBA", "G-League"):
                continue
            if args.level == "D1" and level != "D1":
                continue

        tier_label = f"[{level:8}]"
        print(f"{tier_label} {name}", end="  ", flush=True)

        try:
            ok = enrich_one(a, db, args.dry_run)
            if ok:
                updated += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"  ERROR: {e}")
            errors += 1

    print(f"\n{'─'*50}")
    print(f"updated={updated}  skipped={skipped}  errors={errors}")
    if args.dry_run:
        print("(dry run — no writes)")


if __name__ == "__main__":
    main()
