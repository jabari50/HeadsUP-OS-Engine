"""
tabc_json_to_csv.py
===================
Mechanical converter: tabc_full.json (verified TABC 2026 export, team-nested)
-> tabc_2026_roster.csv (flat template schema for seed_tabc_2026.py).

Zero Hallucination: pure field mapping, no invention.
  team -> school | name -> full_name | grad -> graduation_year | ht -> height
Rows missing a name or a parseable grad year are SKIPPED and logged (never guessed).
"""

import csv
import json
import re
import sys

SRC = "/Users/jabarijohnson/Documents/Claude/Projects/TheVirtualGM/vgm-command-center/tabc_full.json"
DST = "/Users/jabarijohnson/Desktop/HeadsUP Hub/tabc_2026_roster.csv"

COLUMNS = ["full_name", "graduation_year", "sport", "date_of_birth", "school",
           "position", "height", "weight", "wingspan", "exclude", "exclude_reason"]


def main() -> int:
    with open(SRC, encoding="utf-8") as fh:
        teams = json.load(fh)

    # Deterministic recovery for source-format quirks (validated against the
    # official export): some rows pack height + 2-digit grad year into `name`
    # ("Cooper Hull 6'2\" 27") or append the grad year to `ht` ("6'29" = 6' + '29).
    name_packed = re.compile(r"""^(?P<name>.+?)\s+(?P<ht>\d'(?:\d{1,2})?"?)\s+(?P<yy>2[5-9]|3[0-2])$""")
    ht_packed = re.compile(r"""^(?P<ht>\d'(?:\d{1,2})?)(?P<yy>2[5-9]|3[0-2])$""")
    # "Chigozie Okorafor 28" — name + trailing 2-digit grad year, no height.
    name_year = re.compile(r"""^(?P<name>.+?[a-zA-Z.'"])\s+(?P<yy>2[5-9]|3[0-2])$""")

    rows, skipped = [], []
    for team in teams:
        school = (team.get("team") or "").strip()
        for p in team.get("players", []):
            name = (p.get("name") or "").strip()
            ht = (p.get("ht") or "").strip()
            grad = p.get("grad")
            try:
                grad = int(grad)
            except (TypeError, ValueError):
                grad = None

            if grad is None and name:
                m = name_packed.match(name)
                if m:
                    name = m.group("name").strip()
                    ht = m.group("ht").rstrip('"')
                    grad = 2000 + int(m.group("yy"))
            if grad is None and ht:
                m = ht_packed.match(ht)
                if m:
                    ht = m.group("ht")
                    grad = 2000 + int(m.group("yy"))
            if grad is None and name and not ht:
                m = name_year.match(name)
                if m:
                    name = m.group("name").strip()
                    grad = 2000 + int(m.group("yy"))

            if not name or grad is None:
                skipped.append({"school": school, "raw": p})
                continue
            rows.append({
                "full_name": name,
                "graduation_year": grad,
                "sport": "basketball",
                "date_of_birth": "",
                "school": school,
                "position": "",
                "height": ht,
                "weight": "",
                "wingspan": "",
                "exclude": "FALSE",
                "exclude_reason": "",
            })

    with open(DST, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)

    print(f"teams:   {len(teams)}")
    print(f"rows:    {len(rows)} -> {DST}")
    print(f"skipped: {len(skipped)} (missing name or grad year — never guessed)")
    for s in skipped[:20]:
        print(f"  SKIP [{s['school']}]: {s['raw']}")
    if len(skipped) > 20:
        print(f"  ... and {len(skipped) - 20} more")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
