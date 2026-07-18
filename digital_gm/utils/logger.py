"""
Centralized logging configuration for The Digital GM.

All modules import get_logger() from here — no module configures its own logger.
Logs simultaneously to both console and digital_gm.log.
"""

import logging
import sys
from pathlib import Path


_LOG_FORMAT = "%(asctime)s | %(levelname)s | %(module)s | %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
_initialized = False


def _build_handlers(log_path: str, debug: bool) -> list[logging.Handler]:
    """Create and configure file + console handlers."""
    level = logging.DEBUG if debug else logging.INFO

    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setLevel(level)
    file_handler.setFormatter(logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT))

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT))

    return [file_handler, console_handler]


def configure_logging(log_path: str = "digital_gm.log", debug: bool = False) -> None:
    """
    Initialize root logger with file and console handlers.

    Should be called once at application startup. Subsequent calls are no-ops.

    Args:
        log_path: Path to the log file.
        debug:    If True, sets log level to DEBUG; otherwise INFO.
    """
    global _initialized
    if _initialized:
        return

    root = logging.getLogger()
    root.setLevel(logging.DEBUG if debug else logging.INFO)

    for handler in _build_handlers(log_path, debug):
        root.addHandler(handler)

    _initialized = True


def get_logger(name: str) -> logging.Logger:
    """
    Return a named logger for the calling module.

    Args:
        name: Typically __name__ of the importing module.

    Returns:
        A configured logging.Logger instance.
    """
    return logging.getLogger(name)
