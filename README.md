# HeadsUp OS — Engine
**Neural Data Agency | HeadsUP MEDIA & Scouting**
Version: 3.0.0 | The Heads Up! Foundation | Dallas, TX

---

## Overview

Python FastAPI engine powering the HeadsUp OS behavioral intelligence platform. Evaluates athletes **from the Neck Up** — quantifying Culture Equity, Resilience, and Coachability into a verified PRO-Score and Neural Efficiency Rating (NER).

Deployed on **Render**. Called server-side from the Next.js frontend on Netlify. Never accessed directly from the browser.

---

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Engine health check |
| `GET` | `/api/v1/nda/health` | NDA service health |
| `POST` | `/api/v1/nda/neural-score` | Single athlete behavioral score |
| `POST` | `/api/v1/nda/neural-score/batch` | Batch evaluation (max 50) |

Interactive docs: `{RENDER_URL}/docs`

---

## Validation Anchor

All deploys must pass the Mike Boone benchmark:

```
PRO-Score : 82.30
NER       : 82.42
OVR       : 82.36
Flags     : [resilience, defense]
Quests    : [The Pressure Protocol, The Shutdown Assignment]
```

Run locally: `python nda_hughes_neural_score.py`

---

## Local Setup

```bash
pip install -r requirements.txt
export HU_ENGINE_API_KEY=your-secret-key
uvicorn hu_os_engine:app --reload --port 8001
```

---

## Environment Variables (Render Dashboard)

| Variable | Description |
|---|---|
| `HU_ENGINE_API_KEY` | Bearer token validated on all NDA endpoints |
| `FRONTEND_URL` | Netlify frontend URL for CORS allowlist |

---

## File Structure

```
HeadsUP-OS-Engine/
├── hu_os_engine.py              ← FastAPI app entry point (Render)
├── nda_hughes_neural_score.py   ← NDA Gate 2 callable (single source of truth)
├── nda_router.py                ← FastAPI router — NDA endpoints
├── hu_os_arbitrage_engine.py    ← 7-Gate Neural Arbitrage Engine (bulk ledger)
└── requirements.txt             ← Pinned deps (Pydantic v1.10.21)
```

---

## Algorithm Version

`v3.0.0` — constants locked. Never edit inline. All weights live in `ALGO` dict inside `nda_hughes_neural_score.py`.
