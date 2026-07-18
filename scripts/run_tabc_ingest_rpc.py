"""
run_tabc_ingest_rpc.py
======================
Streams tabc_2026_roster.csv to the temporary hu_ingest_tabc_batch RPC in
batches. The RPC (SECURITY DEFINER, secret-gated) enforces the same
Zero-Hallucination merge-guard semantics as seed_tabc_2026.py.

Requires env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_ANON_KEY,
HU_INGEST_SECRET.
"""

import csv
import json
import os
import sys
import urllib.request

BATCH = 400


def main() -> int:
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    anon = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    secret = os.environ.get("HU_INGEST_SECRET")
    if not (url and anon and secret):
        print("ERROR: SUPABASE_URL / SUPABASE_ANON_KEY / HU_INGEST_SECRET required.", file=sys.stderr)
        return 1

    endpoint = url.rstrip("/") + "/rest/v1/rpc/hu_ingest_tabc_batch"

    rows = []
    with open(sys.argv[1], newline="", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            rows.append({
                "full_name": r["full_name"],
                "graduation_year": int(r["graduation_year"]),
                "school": r["school"],
                "height": r["height"],
            })

    inserted = updated = 0
    for i in range(0, len(rows), BATCH):
        body = json.dumps({"secret": secret, "rows": rows[i:i + BATCH]}).encode()
        req = urllib.request.Request(endpoint, data=body, method="POST", headers={
            "apikey": anon,
            "Authorization": f"Bearer {anon}",
            "Content-Type": "application/json",
        })
        with urllib.request.urlopen(req, timeout=120) as resp:
            out = json.loads(resp.read())
        inserted += out.get("inserted", 0)
        updated += out.get("updated", 0)
        print(f"batch {i // BATCH + 1}: +{out.get('inserted', 0)} ins, "
              f"{out.get('updated', 0)} upd (running: {inserted}/{updated})", flush=True)

    print("\n── RUN SUMMARY ──────────────────────────────")
    print(f"  sent:     {len(rows)}")
    print(f"  inserted: {inserted}")
    print(f"  updated:  {updated} (merge guard)")
    print("  scores written: 0  (Zero Hallucination — all neck_up_* NULL at ingest)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
