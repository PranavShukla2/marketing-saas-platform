"""White-label branding: defaults, validation, per-workspace read/write access."""
import itertools
import time

import app.api.workspace as ws

_c = itertools.count()


def _email():
    return f"brand-{time.time_ns()}-{next(_c)}@example.com"


def _register(client, email):
    r = client.post("/api/v1/auth/register",
                    json={"company_name": f"Co {email[:6]}", "email": email, "password": "goodpassword1"})
    assert r.status_code == 200, r.text
    return r.json()["id"]


def _login(client, email):
    assert client.post("/api/v1/auth/login", json={"email": email, "password": "goodpassword1"}).status_code == 200


def test_default_branding(client):
    email = _email()
    _register(client, email)
    _login(client, email)
    b = client.get("/api/v1/workspace/branding").json()
    assert b["accent_color"] == "#5b5bd6"   # sensible default
    assert b["logo_url"] is None
    assert b["company_name"]


def test_update_and_read_back(client):
    email = _email()
    _register(client, email)
    _login(client, email)
    r = client.put("/api/v1/workspace/branding", json={
        "logo_url": "data:image/png;base64,iVBORw0KGgo=",
        "accent_color": "#ff6b5e",
        "report_footer": "Prepared by Acme Agency",
    })
    assert r.status_code == 200, r.text
    b = client.get("/api/v1/workspace/branding").json()
    assert b["accent_color"] == "#ff6b5e"
    assert b["report_footer"] == "Prepared by Acme Agency"
    assert b["logo_url"].startswith("data:image/")


def test_validation(client):
    email = _email()
    _register(client, email)
    _login(client, email)
    # bad hex
    assert client.put("/api/v1/workspace/branding", json={"accent_color": "red"}).status_code == 422
    # bad logo scheme
    assert client.put("/api/v1/workspace/branding", json={"logo_url": "http://evil/x.png"}).status_code == 422
    # oversized logo
    huge = "data:image/png;base64," + "A" * 800_000
    assert client.put("/api/v1/workspace/branding", json={"logo_url": huge}).status_code == 422


def test_member_reads_owner_branding_but_cannot_edit(client, monkeypatch):
    box = {}
    monkeypatch.setattr(ws, "send_team_invite_email", lambda to, c, r, t: box.update({to: t}) or True)
    owner_email, member_email = _email(), _email()
    owner_id = _register(client, owner_email)
    _register(client, member_email)

    _login(client, owner_email)
    client.put("/api/v1/workspace/branding", json={"accent_color": "#123456", "report_footer": "By Owner Co"})
    client.post("/api/v1/workspace/team/invite", json={"email": member_email, "role": "viewer"})

    _login(client, member_email)
    client.post("/api/v1/workspace/team/accept", json={"token": box[member_email]})

    # member can READ the owner's branding
    b = client.get(f"/api/v1/workspace/branding?workspace={owner_id}").json()
    assert b["accent_color"] == "#123456"
    assert b["report_footer"] == "By Owner Co"

    # but cannot edit it (not owner/admin)
    r = client.put("/api/v1/workspace/branding", json={"accent_color": "#000000", "workspace": owner_id})
    assert r.status_code == 403
