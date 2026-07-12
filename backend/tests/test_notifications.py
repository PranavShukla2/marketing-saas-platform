"""Alert delivery: webhook validation/fan-out, digest builder + weekly window."""
import itertools
import time
from datetime import timedelta

import app.services.notify as notify

_c = itertools.count()


def _email():
    return f"notif-{time.time_ns()}-{next(_c)}@example.com"


def _register_login(client, email):
    r = client.post("/api/v1/auth/register",
                    json={"company_name": "N Co", "email": email, "password": "goodpassword1"})
    assert r.status_code == 200
    client.post("/api/v1/auth/login", json={"email": email, "password": "goodpassword1"})
    return r.json()["id"]


def _active_payload(days=16, anomaly=None):
    series = [
        {"date": f"07/{i+1:02d}", "users": 100 + i, "sessions": 150 + 2 * i, "views": 300 + 3 * i}
        for i in range(days)
    ]
    return {
        "status": "active", "company_name": "N Co", "time_series": series,
        "channel_data": [{"channel": "Organic Search", "users": 420, "sessions": 500}],
        "anomaly": anomaly or {"is_anomaly": False, "message": ""},
    }


def test_webhook_url_validation(client):
    _register_login(client, _email())
    # non-allow-listed hosts are rejected (SSRF containment)
    for bad in ("https://evil.example.com/hook", "http://hooks.slack.com/x", "https://internal:9000/admin"):
        r = client.put("/api/v1/workspace/notifications", json={"slack_webhook_url": bad})
        assert r.status_code == 422, bad
    # slack + discord pass
    ok = client.put("/api/v1/workspace/notifications",
                    json={"slack_webhook_url": "https://hooks.slack.com/services/T0/B0/xyz", "digest_enabled": False})
    assert ok.status_code == 200
    got = client.get("/api/v1/workspace/notifications").json()
    assert got["slack_webhook_url"].startswith("https://hooks.slack.com/")
    assert got["digest_enabled"] is False


def test_anomaly_fans_out_to_webhook_once(client, monkeypatch):
    from app.db.database import SessionLocal
    from app.db.models import User
    from app.services import dashboard_cache as dc

    email = _email()
    _register_login(client, email)
    client.put("/api/v1/workspace/notifications",
               json={"slack_webhook_url": "https://hooks.slack.com/services/T0/B0/xyz"})

    sent = []
    monkeypatch.setattr(notify, "send_webhook", lambda url, msg: sent.append(msg) or True)
    monkeypatch.setattr(dc, "send_anomaly_email", lambda to, msg: True)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        anomaly = {"is_anomaly": True, "metric": "sessions", "direction": "spike", "message": "Sessions doubled."}
        dc.store_and_alert(db, user, None, _active_payload(anomaly=anomaly))
        dc.store_and_alert(db, user, None, _active_payload(anomaly=anomaly))  # same anomaly -> silent
    finally:
        db.close()

    assert len(sent) == 1 and "Sessions doubled." in sent[0]


def test_digest_builder_math():
    d = notify.build_digest(_active_payload(days=16))
    assert d is not None
    m = d["metrics"]
    # series is increasing, so this week > last week
    assert m["users"]["current"] > m["users"]["previous"]
    assert m["users"]["pct"] is not None and m["users"]["pct"] > 0
    assert d["top_channel"]["channel"] == "Organic Search"
    # not enough history -> no digest
    assert notify.build_digest(_active_payload(days=10)) is None
    assert notify.build_digest({"status": "pending_integration"}) is None


def test_digest_respects_weekly_window_and_toggle(client, monkeypatch):
    from app.db.database import SessionLocal
    from app.db.models import NotificationSettings, User
    from app.core.time import utcnow

    email = _email()
    _register_login(client, email)

    sent = []
    monkeypatch.setattr(notify, "send_digest_email", lambda to, digest: sent.append(to) or True)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        payload = _active_payload(days=16)

        assert notify.maybe_send_digest(db, user, payload) is True   # first send
        assert notify.maybe_send_digest(db, user, payload) is False  # within 7 days -> no
        assert len(sent) == 1

        # age the send 8 days -> due again
        s = db.get(NotificationSettings, user.id)
        s.digest_last_sent_at = utcnow() - timedelta(days=8)
        db.commit()
        assert notify.maybe_send_digest(db, user, payload) is True
        assert len(sent) == 2

        # disabled -> never
        s = db.get(NotificationSettings, user.id)
        s.digest_enabled = False
        s.digest_last_sent_at = utcnow() - timedelta(days=30)
        db.commit()
        assert notify.maybe_send_digest(db, user, payload) is False
        assert len(sent) == 2
    finally:
        db.close()


def test_member_cannot_touch_notifications(client, monkeypatch):
    import app.api.workspace as ws
    box = {}
    monkeypatch.setattr(ws, "send_team_invite_email", lambda to, c, r, t: box.update({to: t}) or True)

    owner_email, member_email = _email(), _email()
    owner_id = _register_login(client, owner_email)
    _register_login(client, member_email)

    client.post("/api/v1/auth/login", json={"email": owner_email, "password": "goodpassword1"})
    client.post("/api/v1/workspace/team/invite", json={"email": member_email, "role": "member"})
    client.post("/api/v1/auth/login", json={"email": member_email, "password": "goodpassword1"})
    client.post("/api/v1/workspace/team/accept", json={"token": box[member_email]})

    assert client.get(f"/api/v1/workspace/notifications?workspace={owner_id}").status_code == 403
    r = client.put("/api/v1/workspace/notifications", json={"digest_enabled": False, "workspace": owner_id})
    assert r.status_code == 403
