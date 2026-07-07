"""Dashboard cache: TTL behaviour, anomaly-email dedupe, endpoint + sync wiring."""
from datetime import timedelta


def _get_user(email):
    from app.db.database import SessionLocal
    from app.db.models import User

    db = SessionLocal()
    try:
        return db.query(User).filter(User.email == email).first()
    finally:
        db.close()


def _active_payload(anomaly=None):
    return {
        "status": "active",
        "company_name": "Test Co",
        "summary": {"active_users": "42"},
        "anomaly": anomaly or {"is_anomaly": False, "message": ""},
    }


def test_store_then_get_roundtrip_and_ttl(client, registered_user):
    from app.db.database import SessionLocal
    from app.db.models import DashboardCache
    from app.services import dashboard_cache as dc
    from app.core.time import utcnow

    user = _get_user(registered_user["email"])
    db = SessionLocal()
    try:
        dc.store_and_alert(db, user, None, _active_payload())
        cached = dc.get_cached(db, user.id, None)
        assert cached is not None
        assert cached["summary"]["active_users"] == "42"
        assert "cached_at" in cached

        # Age the row past the TTL -> miss.
        row = db.get(DashboardCache, (user.id, ""))
        row.fetched_at = utcnow() - timedelta(seconds=dc.CACHE_TTL_SECONDS + 5)
        db.commit()
        assert dc.get_cached(db, user.id, None) is None
    finally:
        db.close()


def test_non_active_payloads_are_never_cached(client, registered_user):
    from app.db.database import SessionLocal
    from app.services import dashboard_cache as dc

    user = _get_user(registered_user["email"])
    db = SessionLocal()
    try:
        dc.store_and_alert(db, user, None, {"status": "pending_integration"})
        assert dc.get_cached(db, user.id, None) is None
    finally:
        db.close()


def test_anomaly_emails_once_per_key(client, registered_user, monkeypatch):
    from app.db.database import SessionLocal
    from app.services import dashboard_cache as dc

    sent = []
    monkeypatch.setattr(dc, "send_anomaly_email", lambda to, msg: sent.append((to, msg)) or True)

    user = _get_user(registered_user["email"])
    anomaly = {"is_anomaly": True, "metric": "sessions", "direction": "dip", "message": "Sessions dipped 40%."}
    db = SessionLocal()
    try:
        dc.store_and_alert(db, user, None, _active_payload(anomaly))       # first sighting -> email
        dc.store_and_alert(db, user, None, _active_payload(anomaly))       # same anomaly -> silent
        assert len(sent) == 1 and sent[0][0] == registered_user["email"]

        different = {**anomaly, "direction": "spike", "message": "Sessions spiked 90%."}
        dc.store_and_alert(db, user, None, _active_payload(different))     # new anomaly -> email again
        assert len(sent) == 2
    finally:
        db.close()


def test_endpoint_serves_cache_and_refresh_bypasses(client, registered_user, monkeypatch):
    import app.api.analytics as analytics

    calls = {"n": 0}

    def fake_build(property_id, db, current_user):
        calls["n"] += 1
        return {"data": _active_payload()}

    monkeypatch.setattr(analytics, "_build_dashboard_payload", fake_build)
    client.post("/api/v1/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]})

    r1 = client.get("/api/v1/analytics/dashboard")
    r2 = client.get("/api/v1/analytics/dashboard")           # within TTL -> cache
    r3 = client.get("/api/v1/analytics/dashboard?refresh=true")  # bypass
    assert r1.status_code == r2.status_code == r3.status_code == 200
    assert calls["n"] == 2, f"expected build on 1st + refresh only, got {calls['n']}"
    assert "cached_at" in r2.json()["data"]


def test_sync_pass_writes_cache_for_integrations(client, registered_user, monkeypatch):
    from app.db.database import SessionLocal
    from app.db.models import Integration
    from app.core.security import encrypt_credentials
    from app.services import dashboard_cache as dc
    from app.services import sync as sync_mod
    import app.api.analytics as analytics

    user = _get_user(registered_user["email"])
    db = SessionLocal()
    try:
        db.add(Integration(user_id=user.id, provider="google_analytics",
                           encrypted_credentials=encrypt_credentials({"access_token": "t"})))
        db.commit()
    finally:
        db.close()

    monkeypatch.setattr(analytics, "_build_dashboard_payload",
                        lambda property_id, db, current_user: {"data": _active_payload()})
    monkeypatch.setattr(sync_mod, "PER_USER_PAUSE_SECONDS", 0)

    synced = sync_mod.run_sync_pass()
    assert synced >= 1

    db = SessionLocal()
    try:
        assert dc.get_cached(db, user.id, None) is not None
    finally:
        db.close()
