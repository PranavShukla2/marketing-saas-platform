"""Background dashboard sync.

An in-process asyncio loop (started from the FastAPI lifespan) that
periodically rebuilds each connected user's dashboard cache — so dashboards
load warm, and anomaly emails go out even when nobody has the app open.

Honest limitation: this lives inside the web process. On Render's free tier
the process spins down when idle, and the loop sleeps with it — it's a best-
effort warmer, not a guaranteed scheduler. A real job runner (or Render Cron)
is the upgrade path once the tier allows it.
"""
import asyncio
import os

from app.core.log import get_logger

log = get_logger("sync")

SYNC_ENABLED = os.getenv("BACKGROUND_SYNC_ENABLED", "true").lower() == "true"
SYNC_INTERVAL_SECONDS = int(os.getenv("BACKGROUND_SYNC_INTERVAL_SECONDS", "1800"))  # 30 min
INITIAL_DELAY_SECONDS = 120  # let the app settle (and never fire inside tests)
PER_USER_PAUSE_SECONDS = 2   # be gentle with Google's APIs


def run_sync_pass() -> int:
    """Rebuild the default-property dashboard for every GA integration.

    Returns how many users were synced. Every user is isolated — one failure
    never stops the pass.
    """
    # Imported here (not at module top) to keep the import graph acyclic:
    # analytics -> dashboard_cache, sync -> analytics.
    from app.api.analytics import _build_dashboard_payload
    from app.db.database import SessionLocal
    from app.db.models import Integration, User
    from app.services.dashboard_cache import store_and_alert
    import time as _time

    synced = 0
    db = SessionLocal()
    try:
        integrations = (
            db.query(Integration).filter(Integration.provider == "google_analytics").all()
        )
        for integration in integrations:
            user = db.query(User).filter(User.id == integration.user_id).first()
            if user is None:
                continue
            try:
                result = _build_dashboard_payload(None, db, user)
                store_and_alert(db, user, None, result.get("data", {}))
                synced += 1
            except Exception as e:
                log.warning(f"Sync failed for user {integration.user_id}: {e}")
            _time.sleep(PER_USER_PAUSE_SECONDS)
    finally:
        db.close()
    return synced


async def sync_loop() -> None:
    await asyncio.sleep(INITIAL_DELAY_SECONDS)
    while True:
        try:
            synced = await asyncio.to_thread(run_sync_pass)
            log.info(f"Background sync pass complete: {synced} user(s) refreshed")
        except Exception as e:  # the loop itself must never die
            log.error(f"Background sync pass crashed: {e}")
        await asyncio.sleep(SYNC_INTERVAL_SECONDS)
