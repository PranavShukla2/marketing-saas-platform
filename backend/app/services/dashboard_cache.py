"""DB-backed cache for dashboard payloads + anomaly alert delivery.

Why a table and not Redis: one Render instance, Neon already provisioned, and
the payload is small JSON. Serving within a TTL avoids hammering Google's APIs
on every page view; the background sync (app/services/sync.py) writes through
the same functions, and the cache row doubles as the anomaly-email dedupe
state so one anomaly never emails twice.
"""
import json
import os
from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.email import send_anomaly_email
from app.core.log import get_logger
from app.core.time import utcnow
from app.db.models import DashboardCache, User

log = get_logger("dashboard_cache")

CACHE_TTL_SECONDS = int(os.getenv("DASHBOARD_CACHE_TTL_SECONDS", "600"))  # 10 min

# Only cache successful payloads. Statuses like pending_integration must stay
# live so a user who just connected isn't stuck looking at a stale state.
CACHEABLE_STATUS = "active"


def _key(property_id: str | None) -> str:
    return property_id or ""


def get_cached(db: Session, user_id: int, property_id: str | None) -> dict | None:
    """Return the cached payload if it's still fresh, else None."""
    row = db.get(DashboardCache, (user_id, _key(property_id)))
    if row is None:
        return None
    if utcnow() - row.fetched_at > timedelta(seconds=CACHE_TTL_SECONDS):
        return None
    try:
        payload = json.loads(row.payload)
    except ValueError:
        return None  # corrupt row; treat as a miss and let a rebuild overwrite it
    payload["cached_at"] = row.fetched_at.isoformat() + "Z"
    return payload


def _anomaly_key(anomaly: dict) -> str | None:
    if not anomaly or not anomaly.get("is_anomaly"):
        return None
    return f"{anomaly.get('metric')}:{anomaly.get('direction')}:{anomaly.get('message', '')[:40]}"


def store_and_alert(db: Session, user: User, property_id: str | None, payload: dict) -> None:
    """Persist a freshly built payload; email the user on a *new* anomaly.

    Non-active payloads are not cached (and can't alert). The dedupe key means
    repeated rebuilds of the same day's anomaly stay silent; a different
    anomaly (new metric/direction/message) alerts again.
    """
    if payload.get("status") != CACHEABLE_STATUS:
        return

    key = _key(property_id)
    row = db.get(DashboardCache, (user.id, key))
    if row is None:
        row = DashboardCache(user_id=user.id, property_key=key)
        db.add(row)

    new_anomaly_key = _anomaly_key(payload.get("anomaly") or {})
    if new_anomaly_key and new_anomaly_key != row.last_anomaly_key:
        message = payload["anomaly"].get("message", "")
        if send_anomaly_email(user.email, message):
            log.info(f"Anomaly alert emailed to user {user.id}: {new_anomaly_key}")
        # Same message to the workspace's Slack/Discord webhook, if configured.
        # (Imported here to keep the module import graph flat.)
        from app.services.notify import notify_anomaly
        notify_anomaly(db, user.id, message)
        # Record the key even if the send was logged-only/failed — the banner is
        # visible in-app either way, and retry-spamming a broken mailer is worse.
        row.last_anomaly_key = new_anomaly_key

    row.payload = json.dumps(payload)
    row.fetched_at = utcnow()
    db.commit()
