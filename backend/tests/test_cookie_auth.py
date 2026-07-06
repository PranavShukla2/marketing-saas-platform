"""httpOnly-cookie sessions: set on login/exchange, dual auth, logout, CSRF."""


def _login(client, creds):
    return client.post(
        "/api/v1/auth/login",
        json={"email": creds["email"], "password": creds["password"]},
    )


def test_login_sets_httponly_session_cookie(client, registered_user):
    r = _login(client, registered_user)
    assert r.status_code == 200
    set_cookie = r.headers.get("set-cookie", "")
    assert "arbflow_session=" in set_cookie
    lowered = set_cookie.lower()
    assert "httponly" in lowered
    assert "samesite=lax" in lowered
    assert "secure" in lowered
    assert "path=/" in lowered


def test_cookie_alone_authenticates(client, registered_user):
    _login(client, registered_user)  # cookie now in the client jar
    r = client.get("/api/v1/auth/me")  # no Authorization header at all
    assert r.status_code == 200
    assert r.json()["email"] == registered_user["email"]


def test_bearer_still_works_without_cookie(client, registered_user):
    token = _login(client, registered_user).json()["access_token"]
    client.cookies.clear()  # simulate an API client with only the header
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


def test_logout_clears_the_session(client, registered_user):
    _login(client, registered_user)
    assert client.get("/api/v1/auth/me").status_code == 200
    r = client.post("/api/v1/auth/logout")
    assert r.status_code == 200
    assert client.get("/api/v1/auth/me").status_code == 401


def test_no_credentials_is_401(client):
    client.cookies.clear()
    assert client.get("/api/v1/auth/me").status_code == 401


def test_csrf_blocks_foreign_origin_on_cookie_requests(client, registered_user):
    _login(client, registered_user)
    r = client.post(
        "/api/v1/auth/verify/resend",
        json={"email": registered_user["email"]},
        headers={"Origin": "https://evil.example.com"},
    )
    assert r.status_code == 403


def test_csrf_allows_our_origins(client, registered_user):
    _login(client, registered_user)
    for origin in (
        "http://localhost:3000",
        "https://arbflow.pranavmshukla.in",
        "https://marketing-saas-platform-pi.vercel.app",
    ):
        r = client.post(
            "/api/v1/auth/verify/resend",
            json={"email": registered_user["email"]},
            headers={"Origin": origin},
        )
        assert r.status_code == 200, f"{origin} unexpectedly blocked: {r.status_code}"


def test_csrf_ignores_requests_without_cookie(client, registered_user):
    # A pure API client (no cookie) isn't subject to browser CSRF rules.
    client.cookies.clear()
    r = client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
        headers={"Origin": "https://evil.example.com"},
    )
    # No session cookie on the request -> middleware doesn't interfere.
    assert r.status_code == 200
