"""The integrations directory reports what is actually connected."""
import itertools
import time

_c = itertools.count()


def _register_login(client):
    email = f"int-{time.time_ns()}-{next(_c)}@example.com"
    r = client.post("/api/v1/auth/register",
                    json={"company_name": "I Co", "email": email, "password": "goodpassword1"})
    assert r.status_code == 200
    client.post("/api/v1/auth/login", json={"email": email, "password": "goodpassword1"})
    return r.json()["id"]


def test_fresh_account_reports_every_provider_disconnected(client):
    _register_login(client)
    r = client.get("/api/v1/integrations/")
    assert r.status_code == 200
    rows = r.json()["integrations"]
    # A row per known provider, not only the ones present in the table — the
    # page renders the whole directory from this one response.
    assert [x["provider"] for x in rows] == ["google_analytics", "meta_ads", "linkedin"]
    assert all(x["connected"] is False for x in rows)
    assert all(x["property_id"] is None for x in rows)


def test_connecting_one_provider_does_not_mark_the_others(client):
    from app.db.database import SessionLocal
    from app.db.models import Integration
    from app.core.security import encrypt_credentials

    uid = _register_login(client)
    db = SessionLocal()
    db.add(Integration(
        user_id=uid, provider="google_analytics", property_id="properties/123",
        encrypted_credentials=encrypt_credentials({"token": "x"}),
    ))
    db.commit()
    db.close()

    rows = {x["provider"]: x for x in client.get("/api/v1/integrations/").json()["integrations"]}
    assert rows["google_analytics"]["connected"] is True
    assert rows["google_analytics"]["property_id"] == "properties/123"
    # The bug this endpoint exists to fix: the page used to call all three
    # connected as soon as any session existed.
    assert rows["meta_ads"]["connected"] is False
    assert rows["linkedin"]["connected"] is False


def test_never_returns_credentials(client):
    from app.db.database import SessionLocal
    from app.db.models import Integration
    from app.core.security import encrypt_credentials

    uid = _register_login(client)
    db = SessionLocal()
    db.add(Integration(user_id=uid, provider="linkedin",
                       encrypted_credentials=encrypt_credentials({"token": "super-secret"})))
    db.commit()
    db.close()

    body = client.get("/api/v1/integrations/").text
    assert "super-secret" not in body
    assert "encrypted_credentials" not in body


def test_requires_a_session(client):
    assert client.get("/api/v1/integrations/").status_code == 401
