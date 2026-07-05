"""Email verification + password reset flows."""


def _fresh_token(email, purpose):
    """Issue a real token for the user (the raw value never leaves the DB via
    the API, so tests mint one directly to drive the endpoints)."""
    from app.db.database import SessionLocal
    from app.db.models import User
    from app.core.verification import create_token

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        return user.id, create_token(db, user.id, purpose)
    finally:
        db.close()


def _get_user(email):
    from app.db.database import SessionLocal
    from app.db.models import User

    db = SessionLocal()
    try:
        return db.query(User).filter(User.email == email).first()
    finally:
        db.close()


def test_new_signups_start_unverified(client, registered_user):
    assert _get_user(registered_user["email"]).is_verified is False


def test_email_verification_flow(client, registered_user):
    from app.core.verification import VERIFY_EMAIL

    _, raw = _fresh_token(registered_user["email"], VERIFY_EMAIL)
    r = client.post("/api/v1/auth/verify", json={"token": raw})
    assert r.status_code == 200, r.text
    assert _get_user(registered_user["email"]).is_verified is True

    # single-use: replaying the same token fails
    again = client.post("/api/v1/auth/verify", json={"token": raw})
    assert again.status_code == 400


def test_invalid_verify_token_rejected(client):
    r = client.post("/api/v1/auth/verify", json={"token": "not-a-real-token"})
    assert r.status_code == 400


def test_verify_token_cannot_reset_password(client, registered_user):
    # purpose is enforced: a verify token must not work on the reset endpoint
    from app.core.verification import VERIFY_EMAIL

    _, raw = _fresh_token(registered_user["email"], VERIFY_EMAIL)
    r = client.post("/api/v1/auth/password/reset", json={"token": raw, "password": "brandnewpass9"})
    assert r.status_code == 400


def test_password_reset_flow(client, registered_user):
    from app.core.verification import RESET_PASSWORD

    _, raw = _fresh_token(registered_user["email"], RESET_PASSWORD)
    new_pw = "brandnewpass9"
    r = client.post("/api/v1/auth/password/reset", json={"token": raw, "password": new_pw})
    assert r.status_code == 200, r.text

    # old password no longer works; new one does
    old = client.post("/api/v1/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]})
    assert old.status_code == 401
    new = client.post("/api/v1/auth/login", json={"email": registered_user["email"], "password": new_pw})
    assert new.status_code == 200

    # a successful reset also proves email ownership
    assert _get_user(registered_user["email"]).is_verified is True


def test_reset_rejects_short_password(client, registered_user):
    from app.core.verification import RESET_PASSWORD

    _, raw = _fresh_token(registered_user["email"], RESET_PASSWORD)
    r = client.post("/api/v1/auth/password/reset", json={"token": raw, "password": "short"})
    assert r.status_code == 422


def test_forgot_password_is_enumeration_safe(client, registered_user):
    known = client.post("/api/v1/auth/password/forgot", json={"email": registered_user["email"]})
    unknown = client.post("/api/v1/auth/password/forgot", json={"email": "ghost@example.com"})
    assert known.status_code == 200 and unknown.status_code == 200
    assert known.json()["detail"] == unknown.json()["detail"]


def test_resend_verification_is_enumeration_safe(client, registered_user):
    known = client.post("/api/v1/auth/verify/resend", json={"email": registered_user["email"]})
    unknown = client.post("/api/v1/auth/verify/resend", json={"email": "ghost@example.com"})
    assert known.status_code == 200 and unknown.status_code == 200
    assert known.json()["detail"] == unknown.json()["detail"]


def test_login_gate_blocks_unverified_when_enabled(client, registered_user, monkeypatch):
    import app.api.auth as authmod

    # Flip the opt-in gate on for this test only.
    monkeypatch.setattr(authmod, "REQUIRE_EMAIL_VERIFICATION", True)

    blocked = client.post("/api/v1/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]})
    assert blocked.status_code == 403

    # after verifying, login goes through even with the gate on
    from app.core.verification import VERIFY_EMAIL

    _, raw = _fresh_token(registered_user["email"], VERIFY_EMAIL)
    assert client.post("/api/v1/auth/verify", json={"token": raw}).status_code == 200
    ok = client.post("/api/v1/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]})
    assert ok.status_code == 200
