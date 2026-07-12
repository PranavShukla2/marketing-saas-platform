"""Onboarding checklist: steps derive from real state and check themselves off."""
import itertools
import time

_c = itertools.count()


def _email():
    return f"onb-{time.time_ns()}-{next(_c)}@example.com"


def _register_login(client, email):
    r = client.post("/api/v1/auth/register",
                    json={"company_name": "O Co", "email": email, "password": "goodpassword1"})
    assert r.status_code == 200
    client.post("/api/v1/auth/login", json={"email": email, "password": "goodpassword1"})
    return r.json()["id"]


def test_fresh_account_has_all_steps_open(client):
    _register_login(client, _email())
    r = client.get("/api/v1/workspace/onboarding")
    assert r.status_code == 200
    body = r.json()
    assert body["complete"] is False
    assert body["steps"] == {
        "connect_ga": False, "invite_team": False,
        "set_branding": False, "schedule_report": False,
    }


def test_steps_check_off_as_things_happen(client, monkeypatch):
    import app.api.workspace as ws
    from app.db.database import SessionLocal
    from app.db.models import Integration, User
    from app.core.security import encrypt_credentials

    monkeypatch.setattr(ws, "send_team_invite_email", lambda to, c, r, t: True)

    email = _email()
    _register_login(client, email)

    # branding
    client.put("/api/v1/workspace/branding", json={"accent_color": "#123456"})
    # invite (pending is enough — the point is they've engaged the team feature)
    client.post("/api/v1/workspace/team/invite", json={"email": _email(), "role": "member"})
    # schedule
    client.put("/api/v1/workspace/report-schedule",
               json={"recipients": "client@x.com", "frequency": "weekly", "enabled": True})
    # GA connect (simulate the integration row the OAuth callback creates)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        db.add(Integration(user_id=user.id, provider="google_analytics",
                           encrypted_credentials=encrypt_credentials({"access_token": "t"})))
        db.commit()
    finally:
        db.close()

    body = client.get("/api/v1/workspace/onboarding").json()
    assert body["steps"] == {
        "connect_ga": True, "invite_team": True,
        "set_branding": True, "schedule_report": True,
    }
    assert body["complete"] is True
