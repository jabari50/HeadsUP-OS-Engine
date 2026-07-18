#!/usr/bin/env python3
"""
HU-OS · Sports-Reference + Basketball-Reference Enrichment
Three enrichment pipelines for DFW Pipeline alumni:

  D1 college  → sports-reference.com/cbb  (per-game + advanced: PER, TS%, WS, BPM)
  NBA         → basketball-reference.com   (per-game + advanced: PER, TS%, WS, BPM, VORP)
  International → basketball-reference.com/international (overseas league stats + league/team/country)

Run:
  python enrich_sref_bref.py                     # all alumni
  python enrich_sref_bref.py --dry-run           # print-only
  python enrich_sref_bref.py --level D1          # college only
  python enrich_sref_bref.py --level NBA         # NBA only
  python enrich_sref_bref.py --level intl        # international only
  python enrich_sref_bref.py --name "Zuby Ejiofor"
"""
from __future__ import annotations
import argparse, json, re, sys, time, warnings
from difflib import SequenceMatcher
from typing import Optional
from urllib.parse import urljoin

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

BREF_BASE   = "https://www.basketball-reference.com"
SREF_CBB    = "https://www.sports-reference.com/cbb"

# Seasons to try in preference order
NBA_SEASONS = ["2024-25", "2023-24"]
CBB_SEASONS = ["2025-26", "2024-25", "2023-24"]

DELAY = 3.0  # seconds — bref/sref rate limits; 3s ≈ 20 req/min (their stated max)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}

# ── ZHR helpers ───────────────────────────────────────────────────────────────
_NULL_STRS = {"", "-", "—", "--", "N/A", "n/a", "null", "none"}

def sf(v) -> Optional[float]:
    if v is None:
        return None
    try:
        s = str(v).strip().replace(",", "")
        if s.startswith("."):
            s = "0" + s
        return None if s.lower() in _NULL_STRS else float(s)
    except (ValueError, TypeError):
        return None

def pct_field(v) -> Optional[float]:
    f = sf(v)
    if f is None:
        return None
    # bref stores pcts as .437 (already decimal) vs ESPN's 43.7
    if f > 1.0:
        return round(f / 100, 4)
    return round(f, 4)

def sim(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()

def _get(url: str, params: dict = None) -> Optional[str]:
    """Fetch URL and return HTML text, or None on failure."""
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=20,
                         allow_redirects=True)
        time.sleep(DELAY)
        if r.ok:
            return r.text
        return None
    except Exception:
        time.sleep(DELAY)
        return None

def _strip_comments(html: str) -> str:
    """sports-reference hides stat tables inside HTML comments — strip them."""
    return re.sub(r'<!--(.*?)-->', lambda m: m.group(1), html, flags=re.DOTALL)

def _tag_text(html_fragment: str) -> str:
    """Strip all HTML tags, return inner text."""
    return re.sub(r'<[^>]+>', '', html_fragment).strip()

# ── HTML table row parser ─────────────────────────────────────────────────────
def _extract_row(html: str, table_id: str, target_seasons: list[str]) -> dict:
    """
    Locate <table id="table_id">, find the row matching any of target_seasons
    in data-stat="year_id" (or data-stat="season" for international tables),
    return a {data_stat_key: value} dict.
    Prefers the totals row (team=TOT) when a player was traded mid-season.
    Falls back to row with most games played.
    """
    html2 = _strip_comments(html)
    idx = html2.find(f'id="{table_id}"')
    if idx == -1:
        return {}
    chunk = html2[idx:idx + 60000]

    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', chunk, re.DOTALL)
    season_key = "season" if table_id.startswith("player-stats") else "year_id"

    candidates = []
    for row in rows:
        yr_m = re.search(
            rf'data-stat="{season_key}"[^>]*>([^<]*(?:<a[^>]*>[^<]*</a>)?[^<]*)',
            row
        )
        if not yr_m:
            continue
        yr_text = _tag_text(yr_m.group(1))
        if yr_text in target_seasons:
            stats = re.findall(r'data-stat="([^"]+)"[^>]*>([^<]*(?:<[^>]+>[^<]*</[^>]+>)?[^<]*)', row)
            sc = {k: _tag_text(v) for k, v in stats}
            sc["_season"] = yr_text
            candidates.append(sc)

    if not candidates:
        return {}
    if len(candidates) == 1:
        return candidates[0]

    # Multiple rows (traded player) — prefer TOT, then most games
    for c in candidates:
        if c.get("team_name_abbr", "").upper() == "TOT" or \
           c.get("team", "").upper() == "TOT":
            return c
    return max(candidates, key=lambda c: sf(c.get("games") or c.get("g") or 0) or 0)


# ── Basketball-Reference search ───────────────────────────────────────────────
def _bref_search(name: str) -> dict:
    """
    Returns dict with keys:
      nba_url   → /players/x/xxx.html or None
      gleague_url → /gleague/players/... or None
      intl_url  → /international/players/... or None
    """
    html = _get(f"{BREF_BASE}/search/search.fcgi", {"search": name})
    if not html:
        return {}
    html2 = _strip_comments(html)
    items = re.findall(r'search-item-name.*?href="([^"]+)"', html2, re.DOTALL)
    result = {}
    for href in items:
        if href.startswith("/players/") and "nba_url" not in result:
            result["nba_url"] = href
        elif href.startswith("/gleague/players/"):
            result["gleague_url"] = href
        elif href.startswith("/international/players/"):
            result["intl_url"] = href
    return result


# ── NBA stats from basketball-reference ──────────────────────────────────────
def _bref_nba_stats(player_path: str) -> dict:
    html = _get(BREF_BASE + player_path)
    if not html:
        return {}

    pg  = _extract_row(html, "per_game_stats", NBA_SEASONS)
    adv = _extract_row(html, "advanced",       NBA_SEASONS)

    out = {}
    # Per-game
    ppg = sf(pg.get("pts_per_g"));  rpg = sf(pg.get("trb_per_g"))
    apg = sf(pg.get("ast_per_g"));  spg = sf(pg.get("stl_per_g"))
    bpg = sf(pg.get("blk_per_g"));  mpg = sf(pg.get("mp_per_g"))
    gp  = sf(pg.get("games"))
    fg  = pct_field(pg.get("fg_pct"))
    tp  = pct_field(pg.get("fg3_pct"))
    ft  = pct_field(pg.get("ft_pct"))
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

    # Advanced
    per  = sf(adv.get("per"));    ts = pct_field(adv.get("ts_pct"))
    ws   = sf(adv.get("ws"));     bpm = sf(adv.get("bpm"))
    vorp = sf(adv.get("vorp"))
    if per  is not None: out["per"]  = per
    if ts   is not None: out["ts_pct"] = ts
    if ws   is not None: out["ws"]   = ws
    if bpm  is not None: out["bpm"]  = bpm
    if vorp is not None: out["vorp"] = vorp

    return out


# ── International stats from basketball-reference ────────────────────────────
def _bref_intl_stats(intl_path: str) -> dict:
    """
    Returns per-game stats for the player's most recent international season,
    plus intl_league, intl_team, intl_country, intl_season metadata.
    """
    html = _get(BREF_BASE + intl_path)
    if not html:
        return {}
    html2 = _strip_comments(html)

    table_id = "player-stats-per_game-league-"
    idx = html2.find(f'id="{table_id}"')
    if idx == -1:
        return {}
    chunk = html2[idx:idx + 40000]

    # Find all data rows (skip header rows — they have scope="col")
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', chunk, re.DOTALL)
    data_rows = []
    for row in rows:
        if 'scope="col"' in row:
            continue
        yr_m = re.search(r'data-stat="season"[^>]*>([^<]*(?:<a[^>]*>[^<]*</a>)?[^<]*)', row)
        if not yr_m:
            continue
        yr_text = _tag_text(yr_m.group(1))
        if not yr_text or yr_text in ("Season", "Career") or "Season" in yr_text:
            continue
        stats = re.findall(r'data-stat="([^"]+)"[^>]*>([^<]*(?:<[^>]+>[^<]*</[^>]+>)?[^<]*)', row)
        sc = {k: _tag_text(v) for k, v in stats}
        sc["_season_text"] = yr_text
        data_rows.append(sc)

    if not data_rows:
        return {}

    # Most recent season (last row before career totals)
    row = data_rows[-1]

    out = {}
    ppg = sf(row.get("pts_per_g")); rpg = sf(row.get("trb_per_g"))
    apg = sf(row.get("ast_per_g")); spg = sf(row.get("stl_per_g"))
    bpg = sf(row.get("blk_per_g")); mpg = sf(row.get("mp_per_g"))
    gp  = sf(row.get("g"))
    fg  = pct_field(row.get("fg_pct"))
    tp  = pct_field(row.get("fg3_pct"))
    ft  = pct_field(row.get("ft_pct"))

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

    # International metadata
    intl_season  = row.get("_season_text")
    intl_league  = row.get("league")
    intl_team    = row.get("team")
    intl_country = row.get("country", "").upper() or None

    if intl_season: out["intl_season"]  = intl_season
    if intl_league: out["intl_league"]  = intl_league
    if intl_team:   out["intl_team"]    = intl_team
    if intl_country:out["intl_country"] = intl_country

    return out


# ── Sports-Reference CBB search + stats ──────────────────────────────────────
def _sref_cbb_find(name: str) -> Optional[str]:
    """
    Returns the CBB player page path (e.g. /cbb/players/zuby-ejiofor-1.html)
    or None if not found.
    """
    html = _get(f"{SREF_CBB}/search/search.fcgi", {"search": name})
    if not html:
        return None
    # If search redirected to player page, the URL will be in the canonical tag
    canonical = re.search(r'<link rel="canonical" href="([^"]+)"', html)
    if canonical:
        url = canonical.group(1)
        if "/cbb/players/" in url:
            path = re.sub(r"https://www\.sports-reference\.com", "", url)
            return path

    # Multi-result page — find best name match
    html2 = _strip_comments(html)
    results = re.findall(
        r'<div class="search-item-name"[^>]*>.*?href="(/cbb/players/[^"]+)"[^>]*>([^<]+)',
        html2, re.DOTALL
    )
    if not results:
        # Try simpler pattern
        results = re.findall(r'href="(/cbb/players/[a-z0-9\-]+\.html)"[^>]*>([^<]+)', html2)

    best_path, best_score = None, 0.0
    for path, display_name in results:
        s = sim(name, display_name.strip())
        if s > best_score:
            best_score, best_path = s, path
    return best_path if best_score >= 0.70 else None


def _sref_cbb_stats(player_path: str) -> dict:
    html = _get("https://www.sports-reference.com" + player_path)
    if not html:
        return {}

    pg  = _extract_row(html, "players_per_game", CBB_SEASONS)
    adv = _extract_row(html, "players_advanced",  CBB_SEASONS)

    out = {}
    # Per-game
    ppg = sf(pg.get("pts_per_g")); rpg = sf(pg.get("trb_per_g"))
    apg = sf(pg.get("ast_per_g")); spg = sf(pg.get("stl_per_g"))
    bpg = sf(pg.get("blk_per_g")); mpg = sf(pg.get("mp_per_g"))
    gp  = sf(pg.get("games"))
    fg  = pct_field(pg.get("fg_pct"))
    tp  = pct_field(pg.get("fg3_pct"))
    ft  = pct_field(pg.get("ft_pct"))
    school = pg.get("team_name_abbr")
    conf   = pg.get("conf_abbr")
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
    if school: out["college"]   = school
    if conf:   out["conf"]      = conf
    if pg.get("_season"): out["cbb_season"] = pg["_season"]

    # Advanced
    per = sf(adv.get("per"));  ts  = pct_field(adv.get("ts_pct"))
    ws  = sf(adv.get("ws"));   bpm = sf(adv.get("bpm"))
    if per is not None: out["per"]    = per
    if ts  is not None: out["ts_pct"] = ts
    if ws  is not None: out["ws"]     = ws
    if bpm is not None: out["bpm"]    = bpm

    return out


# ── Supabase helpers ──────────────────────────────────────────────────────────
def load_alumni(db) -> list:
    res = (
        db.table("athletes")
        .select("id,full_name,position,neck_down_metrics,neck_up_markers")
        .eq("neck_up_markers->>pipeline_cohort", "dfw_alumni_2025")
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
    res = db.table("athletes").select("neck_down_metrics").eq("id", athlete_id).single().execute()
    current = (res.data or {}).get("neck_down_metrics") or {}
    merged  = {**current, **patch}
    db.table("athletes").update({"neck_down_metrics": merged}).eq("id", athlete_id).execute()
    return True


# ── Per-player enrichment ─────────────────────────────────────────────────────
def enrich_nba(name: str) -> dict:
    urls = _bref_search(name)
    nba_url = urls.get("nba_url")
    if not nba_url:
        return {}
    return _bref_nba_stats(nba_url)


def enrich_gleague(name: str) -> dict:
    """
    G-League players: try bref international page first (many went overseas),
    then fall back to NBA bref page (for players with NBA history).
    """
    urls = _bref_search(name)
    intl_url = urls.get("intl_url")
    if intl_url:
        stats = _bref_intl_stats(intl_url)
        if stats:
            return stats
    nba_url = urls.get("nba_url")
    if nba_url:
        return _bref_nba_stats(nba_url)
    return {}


def enrich_d1(name: str) -> dict:
    path = _sref_cbb_find(name)
    if not path:
        return {}
    return _sref_cbb_stats(path)


def enrich_intl(name: str) -> dict:
    """Explicit international tier: bref /international/ page only."""
    urls = _bref_search(name)
    intl_url = urls.get("intl_url")
    if not intl_url:
        return {}
    return _bref_intl_stats(intl_url)


# ── Main ──────────────────────────────────────────────────────────────────────
ENRICH_FN = {
    "NBA":      enrich_nba,
    "G-League": enrich_gleague,
    "D1":       enrich_d1,
    "intl":     enrich_intl,
}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run",  action="store_true")
    parser.add_argument("--level",    choices=["NBA", "G-League", "D1", "intl", "all"],
                        default="all")
    parser.add_argument("--name",     default=None)
    args = parser.parse_args()

    db     = create_client(SUPABASE_URL, SUPABASE_KEY)
    alumni = load_alumni(db)
    if not alumni:
        print("No alumni found — run inject_dfw_alumni.py first.")
        sys.exit(1)

    print(f"\nLoaded {len(alumni)} DFW alumni.")
    if args.dry_run:
        print("DRY RUN — no writes.\n")

    updated = skipped = errors = 0

    for a in alumni:
        name  = a["full_name"]
        dm    = a.get("neck_down_metrics") or {}
        level = dm.get("career_level", "")

        if args.name and args.name.lower() not in name.lower():
            continue

        if args.level != "all":
            if args.level == "intl":
                # intl mode: only G-League players who also have an intl page
                if level != "G-League":
                    continue
            elif level != args.level:
                continue

        enrich_fn = ENRICH_FN.get(
            "intl" if (args.level == "intl") else level
        )
        if not enrich_fn:
            continue

        tier_label = f"[{level:8}]"
        print(f"{tier_label} {name}", end="  ", flush=True)

        try:
            patch = enrich_fn(name)
            if not patch:
                print("✗ no data")
                skipped += 1
                continue

            # Build summary line
            parts = []
            if "ppg"         in patch: parts.append(f"ppg={patch['ppg']}")
            if "rpg"         in patch: parts.append(f"rpg={patch['rpg']}")
            if "apg"         in patch: parts.append(f"apg={patch['apg']}")
            if "gp"          in patch: parts.append(f"gp={patch['gp']}")
            if "per"         in patch: parts.append(f"PER={patch['per']}")
            if "bpm"         in patch: parts.append(f"BPM={patch['bpm']}")
            if "ws"          in patch: parts.append(f"WS={patch['ws']}")
            if "intl_league" in patch: parts.append(f"lg={patch['intl_league']}")
            if "intl_team"   in patch: parts.append(f"tm={patch['intl_team']}")
            print(f"✓  {' | '.join(parts)}")

            ok = upsert_metrics(db, a["id"], patch, args.dry_run)
            if ok:
                updated += 1
            else:
                skipped += 1

        except Exception as e:
            print(f"  ERROR: {e}")
            errors += 1

    print(f"\n{'─'*55}")
    print(f"updated={updated}  skipped={skipped}  errors={errors}")
    if args.dry_run:
        print("(dry run — no writes)")


if __name__ == "__main__":
    main()
