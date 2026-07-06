"""Input validation at the edges + the consistent error envelope."""


def test_dashboard_rejects_malformed_property_id(client, auth_token):
    for bad in ("evil-string", "properties/abc", "properties/1; DROP TABLE users", "properties/" + "9" * 30):
        r = client.get(
            "/api/v1/analytics/dashboard",
            params={"property_id": bad},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert r.status_code == 422, f"{bad!r} was accepted ({r.status_code})"


def test_dashboard_accepts_wellformed_property_id(client, auth_token):
    # No GA integration on this fresh account, so the endpoint answers with a
    # status payload — the point is it must NOT be a validation error.
    r = client.get(
        "/api/v1/analytics/dashboard",
        params={"property_id": "properties/123456789"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "pending_integration"


def test_unhandled_errors_return_json_envelope(client):
    from app.main import app
    from fastapi.testclient import TestClient

    # A throwaway route that blows up, registered only in the test process.
    if not any(getattr(r, "path", "") == "/_test/boom" for r in app.routes):
        @app.get("/_test/boom")
        def _boom():
            raise RuntimeError("kaboom")

    with TestClient(app, base_url="https://testserver", raise_server_exceptions=False) as c:
        r = c.get("/_test/boom")
    assert r.status_code == 500
    assert r.json() == {"detail": "Something went wrong on our end."}
