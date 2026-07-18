"""
HU-OS · Supabase client singleton
Reads credentials from environment; falls back to project defaults with a warning.
Import via: from storage.supabase_client import get_client
"""
from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")

log = logging.getLogger(__name__)

# ── Credentials ───────────────────────────────────────────────────────────────
_FALLBACK_URL = "https://pgdvzvsnehkkhsubquhi.supabase.co"

SUPABASE_URL: str = (
    os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    or os.getenv("SUPABASE_URL")
    or _FALLBACK_URL
)
SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""

# ── Singleton ─────────────────────────────────────────────────────────────────
_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_SERVICE_ROLE_KEY is not set — add it to .env.local. "
                "Refusing to create a Supabase client without credentials."
            )
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
        log.info("Supabase client initialised → %s", SUPABASE_URL)
    return _client


# ── Import check ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
    client = get_client()
    assert client is get_client(), "singleton invariant broken"
    print("storage.supabase_client  OK")
    sys.exit(0)
