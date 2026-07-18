"""
HU-OS · X (Twitter) posting wrapper
Reads credentials from env. dry_run=true by default — set X_DRY_RUN=false to go live.

Gate pattern (required before every automated sequence):
    if not daily_headroom():
        log.warning("X daily limit reached — skipping")
        return

Import via: from storage.x_poster import daily_headroom, post_tweet
"""
from __future__ import annotations

import logging
import os
from datetime import date, timezone, datetime
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")

log = logging.getLogger(__name__)

# ── Credentials (set in Render dashboard) ────────────────────────────────────
X_API_KEY            = os.getenv("X_API_KEY", "")
X_API_SECRET         = os.getenv("X_API_SECRET", "")
X_ACCESS_TOKEN       = os.getenv("X_ACCESS_TOKEN", "")
X_ACCESS_TOKEN_SECRET = os.getenv("X_ACCESS_TOKEN_SECRET", "")

# ── Behavioural flags ─────────────────────────────────────────────────────────
DRY_RUN: bool = os.getenv("X_DRY_RUN", "true").strip().lower() != "false"

# X Free tier: ~500 posts/month — 17/day is a safe daily ceiling.
# Override with X_DAILY_LIMIT env var if on a paid tier.
DAILY_LIMIT: int = int(os.getenv("X_DAILY_LIMIT", "17"))

# ── Daily counter (in-process; resets on each UTC calendar day) ───────────────
_counter_date: Optional[date] = None
_posts_today: int = 0


def _today_utc() -> date:
    return datetime.now(timezone.utc).date()


def _reset_if_new_day() -> None:
    global _counter_date, _posts_today
    today = _today_utc()
    if _counter_date != today:
        _counter_date = today
        _posts_today = 0


# ── Public API ────────────────────────────────────────────────────────────────

def daily_headroom() -> bool:
    """
    Returns True when there is remaining daily posting capacity.
    Always call this before firing an automated post sequence.
    Returns True in dry_run mode (no real posts, counter unchanged).
    """
    _reset_if_new_day()
    if DRY_RUN:
        log.debug("daily_headroom: dry_run=true — headroom always True")
        return True
    remaining = DAILY_LIMIT - _posts_today
    log.info("daily_headroom: %d/%d used today", _posts_today, DAILY_LIMIT)
    return remaining > 0


def post_tweet(text: str) -> dict:
    """
    Posts a single tweet. Increments the daily counter on success.
    Returns a result dict with keys: id, text, dry_run, skipped.

    Raises RuntimeError if credentials are missing (and dry_run=false).
    Raises ValueError if text exceeds 280 characters.
    """
    if len(text) > 280:
        raise ValueError(f"Tweet exceeds 280 chars ({len(text)})")

    _reset_if_new_day()

    if not daily_headroom():
        log.warning("post_tweet: daily limit reached — skipped")
        return {"id": None, "text": text, "dry_run": DRY_RUN, "skipped": True}

    if DRY_RUN:
        log.info("post_tweet [DRY RUN]: %s", text[:80])
        return {"id": "dry-run", "text": text, "dry_run": True, "skipped": False}

    _assert_credentials()

    import tweepy  # lazy import — not available in test/dry environments

    client = tweepy.Client(
        consumer_key=X_API_KEY,
        consumer_secret=X_API_SECRET,
        access_token=X_ACCESS_TOKEN,
        access_token_secret=X_ACCESS_TOKEN_SECRET,
    )

    response = client.create_tweet(text=text)
    tweet_id = response.data["id"]

    global _posts_today
    _posts_today += 1

    log.info("post_tweet: posted id=%s (%d/%d today)", tweet_id, _posts_today, DAILY_LIMIT)
    return {"id": tweet_id, "text": text, "dry_run": False, "skipped": False}


# ── Internal helpers ──────────────────────────────────────────────────────────

def _assert_credentials() -> None:
    missing = [
        name for name, val in [
            ("X_API_KEY",             X_API_KEY),
            ("X_API_SECRET",          X_API_SECRET),
            ("X_ACCESS_TOKEN",        X_ACCESS_TOKEN),
            ("X_ACCESS_TOKEN_SECRET", X_ACCESS_TOKEN_SECRET),
        ]
        if not val
    ]
    if missing:
        raise RuntimeError(
            f"X credentials not set: {', '.join(missing)}. "
            "Add them to the Render dashboard env vars."
        )


# ── Import check ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
    assert daily_headroom() is True, "daily_headroom() should return True in dry_run mode"
    result = post_tweet("HU-OS dry-run smoke test")
    assert result["dry_run"] is True
    assert result["skipped"] is False
    print(f"storage.x_poster  OK  (dry_run={DRY_RUN}, daily_limit={DAILY_LIMIT})")
    sys.exit(0)
