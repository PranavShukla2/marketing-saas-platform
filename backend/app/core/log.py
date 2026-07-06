"""Central logging setup.

One place to configure format/level; modules do `from app.core.log import
get_logger` and log with context instead of bare print() (which has no level,
no timestamp, and can't be filtered or shipped anywhere).
"""
import logging
import os
import sys

_configured = False


def _configure() -> None:
    global _configured
    if _configured:
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s %(levelname)s %(name)s: %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S%z",
        )
    )
    root = logging.getLogger("arbflow")
    root.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
    root.addHandler(handler)
    root.propagate = False
    _configured = True


def get_logger(name: str) -> logging.Logger:
    _configure()
    return logging.getLogger(f"arbflow.{name}")
