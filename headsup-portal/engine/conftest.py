"""Pytest bootstrap: put the engine package on sys.path and pin a test-only
HMAC secret BEFORE the app module is imported. The literal below is a test
fixture, not a real credential."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("HU_ENGINE_SECRET", "test-secret-not-a-real-credential")
