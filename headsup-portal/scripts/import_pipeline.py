"""
Master pipeline importer — SportsInfluencer DB (2023-24) + GoPRO Global
Talent Network (2026) → supabase/seed_pipeline.sql

Zero Hallucination rules:
  - NO scores are written. Every athlete lands provisional (ovr NULL, Locked)
    until a verified source scores them through the engine.
  - Position is mapped only through the documented table below; unmappable
    text → NULL, never guessed.
  - Height/weight parse strictly; garbage → NULL.
  - Everything else (contacts, GPA, stats text, essays) goes to athlete_intel
    verbatim — admin-only vault, no interpretation.

Classification heuristic (documented, revisit with Jabari):
  grad year >= 2026 → HS · 2024-2025 → College · < 2024 → College
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pandas as pd

SI_PATH = "/Users/jabarijohnson/Downloads/SportsInfluencer Prospect Database_exported_on_Sat Mar 16 2024 08_21_30 GMT+0530 (IST).xlsx"
GP_PATH = "/Users/jabarijohnson/Downloads/Heads UP GoPRO Global Talent Network  (Responses).xlsx"
OUT = Path(__file__).resolve().parent.parent / "supabase" / "seed_pipeline.sql"

# First matching rule wins; evaluated against the FIRST listed position token.
POSITION_RULES = [
    (r"\bpg\b|point", "PG"),
    (r"\bsg\b|two guard|shooting|combo", "SG"),
    (r"\bsf\b|small forward|wing|guard/forward|swing", "SF"),
    (r"\bpf\b|power forward|stretch", "PF"),
    (r"^c$|\bcenter\b|\bpost\b|\bbig\b", "C"),
    (r"\bforward\b", "PF"),
    (r"\bguard\b", "SG"),
]


def map_position(raw) -> str | None:
    if not isinstance(raw, str) or not raw.strip():
        return None
    first = re.split(r"[,/]| or ", raw.strip().lower())[0].strip()
    for pattern, position in POSITION_RULES:
        if re.search(pattern, first):
            return position
    for pattern, position in POSITION_RULES:  # fall back to the full string
        if re.search(pattern, raw.lower()):
            return position
    return None


def parse_height_inches(raw) -> float | None:
    if raw is None:
        return None
    text = str(raw).strip().replace("’", "'").replace("‘", "'").replace("”", '"').replace("“", '"')
    match = re.search(r"(\d)\s*['\-ft\s]+\s*(\d{1,2})?", text)
    if not match:
        return None
    feet = int(match.group(1))
    inches = int(match.group(2) or 0)
    if feet < 4 or feet > 7 or inches > 11:
        return None
    return float(feet * 12 + inches)


def parse_weight(raw) -> float | None:
    if raw is None:
        return None
    match = re.search(r"(\d{2,3})", str(raw))
    if not match:
        return None
    value = float(match.group(1))
    return value if 80 <= value <= 400 else None


def grad_year(raw) -> str | None:
    match = re.search(r"(20\d{2})", str(raw or ""))
    return match.group(1) if match else None


def classification(year: str | None) -> str | None:
    if not year:
        return None
    return "HS" if int(year) >= 2026 else "College"


def sql_str(value) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def sql_num(value) -> str:
    return "null" if value is None else str(value)


def clean_intel(row: dict) -> dict:
    intel = {}
    for key, value in row.items():
        if pd.isna(value) if not isinstance(value, (list, dict)) else False:
            continue
        text = str(value).strip()
        if text and text.lower() not in ("nan", "n/a", "na"):
            intel[str(key).strip()] = text
    return intel


def external_id(prefix: str, email, index: int) -> str:
    email = str(email or "").strip().lower()
    if email and "@" in email:
        return f"{prefix}:{email}"
    return f"{prefix}:row{index}"


def build_statements(df: pd.DataFrame, source: str, prefix: str, mapping: dict) -> list[str]:
    # Dedupe on external_id keeping the LATEST submission (forms get resubmitted);
    # junk rows (blank names parsed as nan/NaT) are dropped.
    statements: dict[str, str] = {}
    for index, row in df.iterrows():
        record = row.to_dict()
        name = str(record.get(mapping["name"]) or "").strip()
        if not name or name.lower() in ("nan", "nat"):
            continue
        year = grad_year(record.get(mapping["class_year"]))
        ext = external_id(prefix, record.get(mapping["email"]), index)
        intel = json.dumps(clean_intel(record), ensure_ascii=False, default=str)

        statements[ext] = (f"""with a as (
  insert into athletes (external_id, name, position, school, class_year, classification, height_in, weight_lb)
  values ({sql_str(ext)}, {sql_str(name)}, {sql_str(map_position(record.get(mapping["position"])))},
          {sql_str(str(record.get(mapping["school"]) or "").strip() or None)}, {sql_str(year)},
          {sql_str(classification(year))}, {sql_num(parse_height_inches(record.get(mapping["height"])))},
          {sql_num(parse_weight(record.get(mapping.get("weight"))) if mapping.get("weight") else None)})
  on conflict (external_id) do update set
    name = excluded.name, position = coalesce(excluded.position, athletes.position),
    school = coalesce(excluded.school, athletes.school),
    class_year = coalesce(excluded.class_year, athletes.class_year),
    classification = coalesce(excluded.classification, athletes.classification),
    height_in = coalesce(excluded.height_in, athletes.height_in),
    weight_lb = coalesce(excluded.weight_lb, athletes.weight_lb)
  returning id
)
insert into athlete_intel (athlete_id, source, intel)
select id, {sql_str(source)}, {sql_str(intel)}::jsonb from a
on conflict (athlete_id, source) do update set intel = excluded.intel, imported_at = now();""")
    return list(statements.values())


def main() -> None:
    si = pd.ExcelFile(SI_PATH).parse("Form Responses 1")
    gp = pd.ExcelFile(GP_PATH).parse("Form Responses 1")

    statements = ["-- GENERATED by scripts/import_pipeline.py — do not hand-edit.",
                  "-- 100% provisional records: no scores, activation Locked, intel admin-only.",
                  "begin;"]
    statements += build_statements(si, "sportsinfluencer_db", "si", {
        "name": "J", "email": "Email", "class_year": "Graduation Year",
        "position": "Position(s)", "school": "Current School",
        "height": "Height (BE ACCURATE)", "weight": "Weight",
    })
    si_count = len(statements) - 3
    statements += build_statements(gp, "gopro_talent_network", "gp", {
        "name": "Full Name", "email": "Email Address", "class_year": "Classification ",
        "position": "Primary Position", "school": "Current High School?",
        "height": "Height",
    })
    gp_count = len(statements) - 3 - si_count
    statements.append("commit;")

    OUT.write_text("\n\n".join(statements), encoding="utf-8")
    print(f"wrote {OUT}")
    print(f"SportsInfluencer athletes: {si_count} | GoPRO athletes: {gp_count} | total: {si_count + gp_count}")


if __name__ == "__main__":
    main()
