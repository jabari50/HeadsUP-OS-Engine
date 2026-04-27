"""
HeadsUp OS — FastAPI Engine (Render deployment target)
Neural Data Agency | HeadsUP MEDIA & Scouting | v3.0.0
"""

import os
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nda_router import nda_router

app = FastAPI(
    title="HeadsUp OS Engine",
    description="Neural Data Agency — Behavioral Intelligence API",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — restrict to Netlify frontend in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.environ.get("FRONTEND_URL", "https://headsup-os.netlify.app"),
        "http://localhost:3000",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Mount NDA router ──────────────────────────────────────────────────────────
app.include_router(nda_router, prefix="/api/v1/nda", tags=["Neural Data Agency"])

# ── Root health check ─────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status":         "operational",
        "service":        "HeadsUp OS Engine",
        "engine_version": "3.0.0",
        "timestamp":      datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
