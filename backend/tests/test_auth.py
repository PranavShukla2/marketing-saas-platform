"""Auth endpoint behaviour + the security properties from the audit."""


def test_register_returns_public_profile_only(client):
    r = client.post("/api/v1/auth/register", json={"company_name": "Acme", "email": "a1@example.com", "password": "goodpassword1"})
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "a1@example.com"
    assert "password" not in body and "hashed_password" not in body


def test_duplicate_email_rejected(client, registered_user):
    r = client.post("/api/v1/auth/register", json={"company_name": "X", "email": registered_user["email"], "password": "goodpassword1"})
    assert r.status_code == 400


def test_short_password_rejected(client):
    r = client.post("/api/v1/auth/register", json={"company_name": "X", "email": "short@example.com", "password": "short"})
    assert r.status_code == 422


def test_invalid_email_rejected(client):
    r = client.post("/api/v1/auth/register", json={"company_name": "X", "email": "not-an-email", "password": "goodpassword1"})
    assert r.status_code == 422


def test_login_is_case_insensitive_on_email(client, registered_user):
    # normalization: registering lowercase, logging in UPPERCASE must work
    r = client.post("/api/v1/auth/login", json={"email": registered_user["email"].upper(), "password": registered_user["password"]})
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_wrong_password_and_unknown_email_both_401_same_message(client, registered_user):
    wrong = client.post("/api/v1/auth/login", json={"email": registered_user["email"], "password": "nope12345"})
    unknown = client.post("/api/v1/auth/login", json={"email": "ghost@example.com", "password": "nope12345"})
    assert wrong.status_code == 401 and unknown.status_code == 401
    # identical generic message => no account enumeration via error text
    assert wrong.json()["detail"] == unknown.json()["detail"]


def test_login_rate_limited_after_10(client, registered_user):
    codes = [
        client.post("/api/v1/auth/login", json={"email": registered_user["email"], "password": "wrongpass1"}).status_code
        for _ in range(12)
    ]
    assert codes[:10] == [401] * 10
    assert 429 in codes[10:]


def test_me_requires_auth(client):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_me_returns_profile(client, auth_token, registered_user):
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {auth_token}"})
    assert r.status_code == 200
    assert r.json()["email"] == registered_user["email"]


def test_delete_account_is_irreversible(client, auth_token, registered_user):
    d = client.delete("/api/v1/auth/me", headers={"Authorization": f"Bearer {auth_token}"})
    assert d.status_code == 204
    # account is gone: cannot log in, token no longer resolves to a user
    assert client.post("/api/v1/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]}).status_code == 401
    assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {auth_token}"}).status_code == 401
