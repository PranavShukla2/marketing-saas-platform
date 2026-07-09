"""Refresh-token rotation: rotate, reuse-detection, revocation, short TTL."""
import jwt as pyjwt


def _login(client, creds):
    return client.post("/api/v1/auth/login", json={"email": creds["email"], "password": creds["password"]})


def _refresh_from(resp):
    """Read the refresh token from a response's Set-Cookie (the httpx jar can
    accumulate duplicate names across logins and then refuses to pick one)."""
    for c in resp.headers.get_list("set-cookie"):
        if c.startswith("arbflow_refresh="):
            return c.split(";", 1)[0].split("=", 1)[1]
    return None


def _use_refresh(client, raw):
    client.cookies.delete("arbflow_refresh")
    client.cookies.set("arbflow_refresh", raw)


def test_login_sets_both_cookies(client, registered_user):
    r = _login(client, registered_user)
    assert r.status_code == 200
    cookies = r.headers.get_list("set-cookie")
    names = [c.split("=", 1)[0] for c in cookies]
    assert "arbflow_session" in names and "arbflow_refresh" in names
    refresh = next(c for c in cookies if c.startswith("arbflow_refresh="))
    assert "httponly" in refresh.lower()


def test_access_token_is_short_lived(client, registered_user):
    from app.core.config import ACCESS_TOKEN_TTL_MINUTES

    token = _login(client, registered_user).json()["access_token"]
    claims = pyjwt.decode(token, options={"verify_signature": False})
    import time
    ttl = claims["exp"] - time.time()
    assert ttl <= ACCESS_TOKEN_TTL_MINUTES * 60 + 60  # small clock slack
    assert ttl > 0


def test_refresh_rotates_and_old_token_dies(client, registered_user):
    old = _refresh_from(_login(client, registered_user))

    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 200
    assert r.json()["access_token"]
    new = _refresh_from(r)
    assert new and new != old

    # replaying the OLD token = reuse -> whole family revoked
    _use_refresh(client, old)
    reuse = client.post("/api/v1/auth/refresh")
    assert reuse.status_code == 401

    # even the NEW token is dead now (same family, revoked)
    _use_refresh(client, new)
    after = client.post("/api/v1/auth/refresh")
    assert after.status_code == 401


def test_reuse_is_audited(client, registered_user):
    from app.db.database import SessionLocal
    from app.db.models import AuditLog

    old = _refresh_from(_login(client, registered_user))
    client.post("/api/v1/auth/refresh")
    _use_refresh(client, old)
    client.post("/api/v1/auth/refresh")  # reuse

    db = SessionLocal()
    try:
        events = [r.event for r in db.query(AuditLog).all()]
        assert "auth.refresh.reuse_detected" in events
    finally:
        db.close()


def test_families_are_isolated(client, registered_user):
    # Device A logs in, then device B logs in (fresh family).
    token_a = _refresh_from(_login(client, registered_user))
    token_b = _refresh_from(_login(client, registered_user))
    assert token_a != token_b

    # A rotates then replays -> A's family dies.
    _use_refresh(client, token_a)
    r1 = client.post("/api/v1/auth/refresh")
    _use_refresh(client, token_a)
    r2 = client.post("/api/v1/auth/refresh")
    assert r1.status_code == 200 and r2.status_code == 401

    # B is untouched.
    _use_refresh(client, token_b)
    assert client.post("/api/v1/auth/refresh").status_code == 200


def test_logout_revokes_this_family(client, registered_user):
    raw = _refresh_from(_login(client, registered_user))
    client.post("/api/v1/auth/logout")
    _use_refresh(client, raw)
    assert client.post("/api/v1/auth/refresh").status_code == 401


def test_logout_all_revokes_everything(client, registered_user):
    token_a = _refresh_from(_login(client, registered_user))
    resp_b = _login(client, registered_user)  # second device/family
    token_b = _refresh_from(resp_b)

    # jar may hold duplicates after two logins; pin the live one
    _use_refresh(client, token_b)
    r = client.post("/api/v1/auth/logout-all")
    assert r.status_code == 200

    for raw in (token_a, token_b):
        _use_refresh(client, raw)
        assert client.post("/api/v1/auth/refresh").status_code == 401


def test_refresh_without_cookie_is_401(client):
    client.cookies.clear()
    assert client.post("/api/v1/auth/refresh").status_code == 401


def test_expired_refresh_token_rejected(client, registered_user, monkeypatch):
    from datetime import timedelta
    from app.db.database import SessionLocal
    from app.db.models import RefreshToken
    from app.core.time import utcnow

    raw = _refresh_from(_login(client, registered_user))

    # Age every token past the TTL.
    db = SessionLocal()
    try:
        for row in db.query(RefreshToken).all():
            row.created_at = utcnow() - timedelta(days=31)
        db.commit()
    finally:
        db.close()

    _use_refresh(client, raw)
    assert client.post("/api/v1/auth/refresh").status_code == 401
