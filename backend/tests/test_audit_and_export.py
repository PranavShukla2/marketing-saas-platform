"""Audit trail + GDPR data export."""


def _events_for(email):
    from app.db.database import SessionLocal
    from app.db.models import AuditLog

    db = SessionLocal()
    try:
        rows = db.query(AuditLog).filter(AuditLog.email == email).all()
        return [(r.event, r.ip) for r in rows]
    finally:
        db.close()


def test_login_success_and_failure_are_audited(client, registered_user):
    client.post("/api/v1/auth/login", json={"email": registered_user["email"], "password": "wrongpass1"})
    client.post("/api/v1/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]})
    events = [e for e, _ in _events_for(registered_user["email"])]
    assert "auth.login.failed" in events
    assert "auth.login.success" in events
    # registration itself was audited by the fixture's register call
    assert "auth.register" in events
    # ip is recorded (testclient reports a client host)
    assert all(ip is not None for _, ip in _events_for(registered_user["email"]))


def test_export_returns_everything_but_credentials(client, registered_user):
    from app.db.database import SessionLocal
    from app.db.models import Integration, User
    from app.core.security import encrypt_credentials

    # Give the user an integration whose credentials must NOT leak.
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == registered_user["email"]).first()
        db.add(Integration(user_id=user.id, provider="google_analytics", property_id="properties/1",
                           encrypted_credentials=encrypt_credentials({"access_token": "SUPER-SECRET"})))
        db.commit()
    finally:
        db.close()

    client.post("/api/v1/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]})
    r = client.get("/api/v1/auth/me/export")
    assert r.status_code == 200
    assert "attachment" in r.headers.get("content-disposition", "")

    body = r.json()
    assert body["profile"]["email"] == registered_user["email"]
    assert body["integrations"][0]["provider"] == "google_analytics"
    assert "SUPER-SECRET" not in r.text                      # credentials never leak
    assert any(e["event"] == "auth.login.success" for e in body["audit_trail"])

    # the export itself is audited
    assert "account.exported" in [e for e, _ in _events_for(registered_user["email"])]


def test_export_requires_auth(client):
    client.cookies.clear()
    assert client.get("/api/v1/auth/me/export").status_code == 401


def test_deletion_anonymizes_audit_trail(client, registered_user):
    from app.db.database import SessionLocal
    from app.db.models import AuditLog, User

    client.post("/api/v1/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]})
    db = SessionLocal()
    user_id = db.query(User).filter(User.email == registered_user["email"]).first().id
    db.close()

    r = client.delete("/api/v1/auth/me")
    assert r.status_code == 204

    db = SessionLocal()
    try:
        rows = db.query(AuditLog).filter(AuditLog.user_id == user_id).all()
        assert rows, "trail should survive deletion"
        # every surviving row is anonymized...
        assert all(row.email is None for row in rows)
        # ...and the deletion itself is on the record
        assert "auth.account.deleted" in [row.event for row in rows]
    finally:
        db.close()
