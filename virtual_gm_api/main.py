"""
main.py — The Virtual GM · FastAPI Entry Point
Port 8001.  All secrets via .env.  Rotating log → virtual_gm.log.

Run:
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload
"""
from __future__ import annotations

import logging
import logging.handlers
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Load .env before importing anything that reads os.getenv ──────────────────
load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=False)

# ── Rotating log configuration ────────────────────────────────────────────────

def _configure_logging() -> None:
    log_path = os.getenv("VGM_LOG_PATH", "virtual_gm.log")
    fmt      = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    # Rotating file handler: 5 × 5 MB
    fh = logging.handlers.RotatingFileHandler(
        log_path, maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8",
    )
    fh.setFormatter(fmt)
    fh.setLevel(logging.DEBUG)

    # Console handler
    ch = logging.StreamHandler(sys.stdout)
    ch.setFormatter(fmt)
    ch.setLevel(logging.INFO)

    root = logging.getLogger()
    root.setLevel(logging.DEBUG)
    if not root.handlers:          # idempotent
        root.addHandler(fh)
        root.addHandler(ch)


_configure_logging()
logger = logging.getLogger(__name__)

# ── Imports (after dotenv + logging) ─────────────────────────────────────────
from api.admin  import admin_router
from api.routes import api_router
from db.database import initialize_db

# ── DB path ───────────────────────────────────────────────────────────────────

_DB_PATH = os.getenv("VGM_DB_PATH", "virtual_gm.db")

# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB and attach db_path to app.state on startup."""
    initialize_db(_DB_PATH)
    app.state.db_path = _DB_PATH
    logger.info(
        "The Virtual GM API started | db=%s | port=8001 | %s",
        _DB_PATH,
        datetime.now(timezone.utc).isoformat(),
    )
    yield
    logger.info("The Virtual GM API shutting down")


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title          = "The Virtual GM — PRO-File OS Operator API",
    description    = (
        "UIL-grade program command center: roster management, fit scoring, "
        "eligibility intelligence, activation locking, and weekly RIB generation."
    ),
    version        = "1.0.0",
    lifespan       = lifespan,
    docs_url       = "/docs",
    redoc_url      = "/redoc",
)

# CORS — tighten in production via VGM_ALLOWED_ORIGINS env var
_origins = os.getenv("VGM_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins     = _origins,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(api_router)
app.include_router(admin_router)


# ── Root ──────────────────────────────────────────────────────────────────────

@app.get("/", tags=["meta"])
def root() -> dict:
    return {
        "service":  "The Virtual GM API",
        "version":  "1.0.0",
        "docs":     "/docs",
        "health":   "/api/v1/health",
        "ts":       datetime.now(timezone.utc).isoformat(),
    }
