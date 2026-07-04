"""Time helpers.

`datetime.utcnow()` is deprecated in Python 3.12+ (and returns a naive value
with a misleading name). We deliberately stay on *naive* UTC everywhere because
the app runs SQLite locally and Postgres in prod: SQLite hands datetimes back
naive, so mixing in tz-aware values would raise "can't compare offset-naive and
offset-aware" on the first comparison. `utcnow()` below is a drop-in for the old
call — same naive-UTC value, no deprecation.
"""
from datetime import datetime, timezone


def utcnow() -> datetime:
    """Naive UTC 'now' — a non-deprecated replacement for datetime.utcnow()."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
