"""Central logging setup.

One place to configure format/level; modules do `from app.core.log import
get_logger` and log with context instead of bare print() (which has no level,
no timestamp, and can't be filtered or shipped anywhere).

Every log line carries a request id (see `request_id_var`), set per request by
the middleware in main.py, so lines from one request can be correlated even
under concurrency. Lines logged outside a request show "-".
"""
import logging
import os
import sys
from contextvars import ContextVar

# Set per request by the middleware; read by the filter below.
request_id_var: ContextVar[str] = ContextVar("request_id", default="-")

_configured = False


class _RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        return True


def _configure() -> None:
    global _configured
    if _configured:
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s %(levelname)s %(name)s [%(request_id)s]: %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S%z",
        )
    )
    handler.addFilter(_RequestIdFilter())
    root = logging.getLogger("arbflow")
    root.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
    root.addHandler(handler)
    root.propagate = False
    _configured = True


def get_logger(name: str) -> logging.Logger:
    _configure()
    return logging.getLogger(f"arbflow.{name}")
