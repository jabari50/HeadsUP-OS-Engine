# HeadsUP Unified Portal — Command Center

One portal over three preserved layers: **Ingestion → HU-OS Intelligence → Virtual GM → Operator Portal**.
Built to the spec in [`../UNIFIED_PORTAL_HANDOFF_v1.1.md`](../UNIFIED_PORTAL_HANDOFF_v1.1.md).
Governing policy: Zero Hallucination · HU-OS 8-Gate Security Standard.

## Layout

```
headsup-portal/
├── apps/web/        Next.js 14 portal (Vercel) — auth, /api proxy routes, role-scoped UI
├── engine/          Python 3.12 FastAPI scoring engine (Render) — STATELESS, HMAC-authed
└── supabase/        Migrations 0001–0003 + seed (fresh project — see warning below)
```

## Security invariants (do not relax)

- Browser talks to `/api` only. No Render URL, engine secret, or service key in any client bundle.
- The engine holds exactly one secret (`HU_ENGINE_SECRET`) and no database client.
- Scores (`athletes.ovr/tier`, `matches.fit_score`) are written only in service-role context;
  NULL-safe triggers block everyone else on INSERT **and** UPDATE.
- `neural_audit_log` is physically append-only (REVOKE + trigger), even against the service role.
- All role checks read `app_metadata` via `app_role()` — never `user_metadata`.
- Field visibility = `shapeAthlete()` + role views. No `select *` reaches a non-admin caller.

## ⚠ Database warning

The migrations target a **fresh Supabase project**. The live "HeadsUP OS" project
(`pgdvzvsnehkkhsubquhi`) already has a different 67-column `athletes` table and 42 tables of
prior HU-OS work — applying these there will collide. Reconciliation with the live project is
an explicit, separately-approved migration pass (see the-virtual-gm/CLAUDE.md working agreement).

## Run

```bash
# engine
cd engine && pip install -r requirements.txt
HU_ENGINE_SECRET=dev-secret uvicorn hu_os_api_v4:app --port 8000
pytest                      # 29 benchmark + security tests must pass

# web
cd apps/web && npm install
cp .env.example .env.local  # fill in real values
npm run dev
```

## Benchmark policy

`engine/tests/test_benchmarks.py` locks the Portal Anchor vector (OVR **78.7**, Impact) and
documents the Boone canonical anchor (PRO **82.30** / NER **82.42** / OVR **82.36**,
`uuid-0004-boone`). The v1.0 handoff's "Boone = 81.82" appears nowhere in the codebase and is
not used. Any drift in a locked literal = engine failure, not a build pass.

## Open inputs ([NEEDS INPUT])

- Stripe price IDs per license tier (`apps/web/lib/billing.ts` placeholders; checkout 503s until set).
- NER anchor calibration values (`engine/pipeline.py: NER_ANCHOR_SCALE` — v1 placeholders).
- Fit recommendation thresholds (`engine/hu_os_api_v4.py: PURSUE_MIN/MONITOR_MIN` — v1 defaults).
- Deployed `vgm-command-center` access for the live-DB reconciliation pass.
