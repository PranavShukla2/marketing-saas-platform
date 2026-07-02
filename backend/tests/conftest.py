"""Test harness.

Forces a hermetic environment BEFORE any app module is imported: throwaway
secrets, a fresh Fernet key, and an isolated temp SQLite DB — so tests never
touch the dev database and run cleanly in CI with no .env present.
"""
import os
import tempfile

from cryptography.fernet import Fernet

# Must run before `app.*` is imported (app.core.config validates these at import
# time, and app.db.database builds the engine from DATABASE_URL at import time).
_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.environ["JWT_SECRET_KEY"] = "test-secret-not-for-production-0123456789abcdef"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["ENCRYPTION_KEY"] = Fernet.generate_key().decode()
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ.pop("SENTRY_DSN", None)  # keep error tracking off during tests

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture()
def client():
    # Imported lazily so the env above is already in place.
    from app.main import app
    from app.core import ratelimit

    # Reset the in-memory rate limiter so one test's requests don't trip
    # another's limit.
    ratelimit._hits.clear()

    with TestClient(app) as c:
        yield c


@pytest.fixture()
def registered_user(client):
    """A freshly registered account; returns its credentials."""
    import time

    email = f"user{time.time_ns()}@example.com"
    password = "goodpassword1"
    resp = client.post(
        "/api/v1/auth/register",
        json={"company_name": "Test Co", "email": email, "password": password},
    )
    assert resp.status_code == 200, resp.text
    return {"email": email, "password": password}


def _token(client, creds):
    resp = client.post("/api/v1/auth/login", json={"email": creds["email"], "password": creds["password"]})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def auth_token(client, registered_user):
    return _token(client, registered_user)
