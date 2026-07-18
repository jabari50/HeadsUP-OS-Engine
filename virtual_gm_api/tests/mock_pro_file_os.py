"""
mock_pro_file_os.py — The Virtual GM · PRO-File OS API Stub
A lightweight FastAPI server that mimics the PRO-File OS endpoints so
core/roster_sync.py can be tested without a live API.

Start the stub during tests by importing MockProFileOSServer and using it
as a context manager, or run it standalone:

    python tests/mock_pro_file_os.py          # listens on port 9100

In tests, set:
    os.environ["PRO_FILE_OS_API_URL"] = "http://localhost:9100"
    os.environ["PRO_FILE_OS_API_KEY"] = "mock-key-test"
"""
from __future__ import annotations

import threading
import time
from datetime import datetime, timezone
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ── Mock data ─────────────────────────────────────────────────────────────────

_KNOWN_SCHOOLS: dict[str, dict] = {
    "lancaster high school": {
        "verified":       True,
        "school_id":      "TX-UIL-4563",
        "canonical_name": "Lancaster High School",
        "district":       "District 11-5A",
        "classification": "Class 5A",
    },
    "liberty ridge high school": {
        "verified":       True,
        "school_id":      "TX-UIL-4891",
        "canonical_name": "Liberty Ridge High School",
        "district":       "District 11-5A",
        "classification": "Class 5A",
    },
}

_KNOWN_NCAA_IDS: dict[str, dict] = {
    "1234567890": {"verified": True, "status": "active",      "expiry": "2026-06-30"},
    "9876543210": {"verified": True, "status": "committed",   "expiry": "2025-12-31"},
    "5555555555": {"verified": True, "status": "transfer",    "expiry": "2026-06-30"},
}

# ── App ────────────────────────────────────────────────────────────────────────

stub = FastAPI(title="PRO-File OS Mock", docs_url=None, redoc_url=None)


def _check_auth(request: Request) -> None:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    token = auth.split(" ", 1)[1]
    if token != "mock-key-test":
        raise HTTPException(status_code=401, detail="Invalid API key")


# ── POST /sync/roster ─────────────────────────────────────────────────────────

class SyncRosterPayload(BaseModel):
    operator_id: str
    players:     list[dict]
    sent_at:     Optional[str] = None


@stub.post("/sync/roster")
async def mock_sync_roster(body: SyncRosterPayload, request: Request) -> dict:
    _check_auth(request)
    synced = len(body.players)
    return {
        "status":       "success",
        "synced_count": synced,
        "failed_ids":   [],
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "note":         f"Mock: {synced} players accepted",
    }


# ── POST /verify/school ───────────────────────────────────────────────────────

class VerifySchoolPayload(BaseModel):
    school_name: str
    city:        Optional[str] = None
    state:       Optional[str] = None


@stub.post("/verify/school")
async def mock_verify_school(body: VerifySchoolPayload, request: Request) -> dict:
    _check_auth(request)
    key = body.school_name.lower().strip()
    if key in _KNOWN_SCHOOLS:
        return _KNOWN_SCHOOLS[key]
    return {
        "verified":       False,
        "school_id":      None,
        "canonical_name": None,
        "district":       None,
        "classification": None,
        "reason":         "school_not_found",
    }


# ── POST /verify/ncaa ─────────────────────────────────────────────────────────

class VerifyNcaaPayload(BaseModel):
    ncaa_id: str


@stub.post("/verify/ncaa")
async def mock_verify_ncaa(body: VerifyNcaaPayload, request: Request) -> dict:
    _check_auth(request)
    ncaa_id = body.ncaa_id.strip()
    if ncaa_id in _KNOWN_NCAA_IDS:
        return {"verified": True, "ncaa_id": ncaa_id, **_KNOWN_NCAA_IDS[ncaa_id]}
    return {
        "verified": False,
        "ncaa_id":  ncaa_id,
        "status":   None,
        "expiry":   None,
        "note":     "not_found",
    }


# ── Health ────────────────────────────────────────────────────────────────────

@stub.get("/health")
async def mock_health() -> dict:
    return {"status": "ok", "service": "PRO-File OS Mock", "ts": datetime.now(timezone.utc).isoformat()}


# ── In-process server helper for tests ────────────────────────────────────────

class MockProFileOSServer:
    """
    Spin up the mock server in a background thread for the duration of a test.

    Usage:
        with MockProFileOSServer(port=9100):
            os.environ["PRO_FILE_OS_API_URL"] = "http://localhost:9100"
            os.environ["PRO_FILE_OS_API_KEY"] = "mock-key-test"
            result = sync_roster("op-123", players)
    """

    def __init__(self, port: int = 9100):
        self.port   = port
        self._cfg   = uvicorn.Config(stub, host="127.0.0.1", port=port, log_level="error")
        self._srv   = uvicorn.Server(self._cfg)
        self._thread: Optional[threading.Thread] = None

    def __enter__(self) -> "MockProFileOSServer":
        self._thread = threading.Thread(target=self._srv.run, daemon=True)
        self._thread.start()
        # Wait for the server to accept connections (up to 3 s)
        deadline = time.time() + 3
        import socket
        while time.time() < deadline:
            try:
                with socket.create_connection(("127.0.0.1", self.port), timeout=0.1):
                    break
            except OSError:
                time.sleep(0.05)
        return self

    def __exit__(self, *_) -> None:
        self._srv.should_exit = True
        if self._thread:
            self._thread.join(timeout=2)


# ── Standalone entry ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("PRO-File OS mock server listening on http://localhost:9100")
    print("Use API key: mock-key-test")
    uvicorn.run(stub, host="127.0.0.1", port=9100, log_level="info")
