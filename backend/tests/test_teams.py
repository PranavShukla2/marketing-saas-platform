"""Multi-user workspaces: invite -> accept, roles, access control, isolation."""
import itertools
import time

import app.api.workspace as ws

_counter = itertools.count()


def _email():
    return f"team-{time.time_ns()}-{next(_counter)}@example.com"


def _register(client, email):
    r = client.post("/api/v1/auth/register",
                    json={"company_name": f"Co {email[:6]}", "email": email, "password": "goodpassword1"})
    assert r.status_code == 200, r.text
    return r.json()["id"]


def _login(client, email):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "goodpassword1"})
    assert r.status_code == 200, r.text


def _capture_invites(monkeypatch):
    box = {}
    monkeypatch.setattr(ws, "send_team_invite_email",
                        lambda to, company, role, token: box.update({to: token}) or True)
    return box


def test_invite_accept_and_membership(client, monkeypatch):
    box = _capture_invites(monkeypatch)
    owner_email, member_email = _email(), _email()
    owner_id = _register(client, owner_email)
    _register(client, member_email)

    # owner invites the member
    _login(client, owner_email)
    r = client.post("/api/v1/workspace/team/invite", json={"email": member_email, "role": "member"})
    assert r.status_code == 200, r.text
    assert member_email in box  # email would have been sent

    # pending invite shows in the team list
    team = client.get("/api/v1/workspace/team").json()
    assert any(i["email"] == member_email for i in team["invites"])
    assert team["can_manage"] is True

    # member accepts
    _login(client, member_email)
    r = client.post("/api/v1/workspace/team/accept", json={"token": box[member_email]})
    assert r.status_code == 200, r.text
    assert r.json()["workspace_id"] == owner_id

    # member now sees the owner's workspace in their list
    spaces = client.get("/api/v1/workspace/workspaces").json()["workspaces"]
    assert any(w["id"] == owner_id and w["role"] == "member" for w in spaces)

    # and appears on the owner's team
    _login(client, owner_email)
    team = client.get("/api/v1/workspace/team").json()
    assert any(m["email"] == member_email and m["role"] == "Member" for m in team["team"])
    assert not team["invites"]  # invite consumed


def test_member_can_read_owner_dashboard_but_stranger_cannot(client, monkeypatch):
    box = _capture_invites(monkeypatch)
    owner_email, member_email, stranger_email = _email(), _email(), _email()
    owner_id = _register(client, owner_email)
    _register(client, member_email)
    _register(client, stranger_email)

    _login(client, owner_email)
    client.post("/api/v1/workspace/team/invite", json={"email": member_email, "role": "viewer"})
    _login(client, member_email)
    client.post("/api/v1/workspace/team/accept", json={"token": box[member_email]})

    # member can load the owner's workspace (no GA connected -> pending, but 200 not 403)
    r = client.get(f"/api/v1/analytics/dashboard?workspace={owner_id}")
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "pending_integration"

    # a stranger cannot
    _login(client, stranger_email)
    r = client.get(f"/api/v1/analytics/dashboard?workspace={owner_id}")
    assert r.status_code == 403


def test_viewer_cannot_manage_team(client, monkeypatch):
    box = _capture_invites(monkeypatch)
    owner_email, member_email, third_email = _email(), _email(), _email()
    owner_id = _register(client, owner_email)
    _register(client, member_email)

    _login(client, owner_email)
    client.post("/api/v1/workspace/team/invite", json={"email": member_email, "role": "member"})
    _login(client, member_email)
    client.post("/api/v1/workspace/team/accept", json={"token": box[member_email]})

    # a plain member trying to invite into the owner's workspace -> 403
    r = client.post("/api/v1/workspace/team/invite", json={"email": third_email, "role": "member", "workspace": owner_id})
    assert r.status_code == 403


def test_admin_role_can_manage(client, monkeypatch):
    box = _capture_invites(monkeypatch)
    owner_email, admin_email, invitee_email = _email(), _email(), _email()
    owner_id = _register(client, owner_email)
    _register(client, admin_email)

    _login(client, owner_email)
    client.post("/api/v1/workspace/team/invite", json={"email": admin_email, "role": "admin"})
    _login(client, admin_email)
    client.post("/api/v1/workspace/team/accept", json={"token": box[admin_email]})

    # admin invites someone into the owner's workspace -> allowed
    r = client.post("/api/v1/workspace/team/invite", json={"email": invitee_email, "role": "viewer", "workspace": owner_id})
    assert r.status_code == 200, r.text


def test_invite_email_must_match_accepter(client, monkeypatch):
    box = _capture_invites(monkeypatch)
    owner_email, invited_email, other_email = _email(), _email(), _email()
    _register(client, owner_email)
    _register(client, other_email)

    _login(client, owner_email)
    client.post("/api/v1/workspace/team/invite", json={"email": invited_email, "role": "member"})

    # a different logged-in user can't redeem an invite addressed to someone else
    _login(client, other_email)
    r = client.post("/api/v1/workspace/team/accept", json={"token": box[invited_email]})
    assert r.status_code == 403


def test_remove_member_revokes_access(client, monkeypatch):
    box = _capture_invites(monkeypatch)
    owner_email, member_email = _email(), _email()
    owner_id = _register(client, owner_email)
    member_id = _register(client, member_email)

    _login(client, owner_email)
    client.post("/api/v1/workspace/team/invite", json={"email": member_email, "role": "member"})
    _login(client, member_email)
    client.post("/api/v1/workspace/team/accept", json={"token": box[member_email]})
    assert client.get(f"/api/v1/analytics/dashboard?workspace={owner_id}").status_code == 200

    _login(client, owner_email)
    r = client.delete(f"/api/v1/workspace/team/member/{member_id}")
    assert r.status_code == 204

    # access is gone
    _login(client, member_email)
    assert client.get(f"/api/v1/analytics/dashboard?workspace={owner_id}").status_code == 403
