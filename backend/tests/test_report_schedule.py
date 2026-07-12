"""Scheduled reports: recipient parsing, branded HTML, due windows."""
import itertools
import time
from datetime import timedelta

import pytest

import app.services.reports as reports

_c = itertools.count()


def _email():
    return f"rep-{time.time_ns()}-{next(_c)}@example.com"


def _register_login(client, email):
    r = client.post("/api/v1/auth/register",
                    json={"company_name": "R Co", "email": email, "password": "goodpassword1"})
    assert r.status_code == 200
    client.post("/api/v1/auth/login", json={"email": email, "password": "goodpassword1"})
    return r.json()["id"]


def _payload(days=31):
    return {
        "status": "active", "company_name": "R Co",
        "time_series": [{"date": f"d{i}", "users": 10, "sessions": 15, "views": 30} for i in range(days)],
        "channel_data": [{"channel": "Organic Search", "users": 100, "sessions": 120},
                         {"channel": "Direct", "users": 80, "sessions": 90}],
    }


def test_parse_recipients():
    assert reports.parse_recipients(" A@x.com, b@y.io ,a@x.com,") == ["a@x.com", "b@y.io"]
    assert reports.parse_recipients("") == []
    with pytest.raises(ValueError):
        reports.parse_recipients("not-an-email")
    with pytest.raises(ValueError):
        reports.parse_recipients(",".join(f"u{i}@x.com" for i in range(6)))  # > max


def test_branded_html():
    brand = {"logo_url": "data:image/png;base64,x", "accent_color": "#ff6b5e", "report_footer": "By Acme Agency"}
    html = reports.build_report_html(_payload(), brand, 7)
    assert html is not None
    assert "#ff6b5e" in html                 # accent applied
    assert "By Acme Agency" in html          # white-label footer
    assert "data:image/png;base64,x" in html # logo embedded
    assert "Organic Search" in html          # channels table
    # unbranded fallback footer
    html2 = reports.build_report_html(_payload(), {"accent_color": "#5b5bd6"}, 7)
    assert "Generated with ArbFlow" in html2
    # not enough history
    assert reports.build_report_html(_payload(days=5), brand, 7) is None


def test_send_respects_schedule(client, monkeypatch):
    from app.db.database import SessionLocal
    from app.db.models import ReportSchedule, User
    from app.core.time import utcnow

    email = _email()
    _register_login(client, email)

    sent = []
    monkeypatch.setattr(reports, "send_email", lambda to, sub, html: sent.append(to) or True)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        payload = _payload()

        # no schedule -> nothing
        assert reports.maybe_send_report(db, user, payload) is False

        # enabled weekly schedule with two recipients
        db.add(ReportSchedule(user_id=user.id, recipients="client@x.com,boss@x.com",
                              frequency="weekly", enabled=True))
        db.commit()
        assert reports.maybe_send_report(db, user, payload) is True
        assert sent == ["client@x.com", "boss@x.com"]

        # within the window -> silent
        assert reports.maybe_send_report(db, user, payload) is False

        # age past 7 days -> due again (weekly)
        s = db.get(ReportSchedule, user.id)
        s.last_sent_at = utcnow() - timedelta(days=8)
        db.commit()
        assert reports.maybe_send_report(db, user, payload) is True

        # monthly: 8 days old is NOT due
        s = db.get(ReportSchedule, user.id)
        s.frequency = "monthly"
        s.last_sent_at = utcnow() - timedelta(days=8)
        db.commit()
        assert reports.maybe_send_report(db, user, payload) is False

        # disabled -> never
        s = db.get(ReportSchedule, user.id)
        s.enabled = False
        s.last_sent_at = None
        db.commit()
        assert reports.maybe_send_report(db, user, payload) is False
    finally:
        db.close()


def test_schedule_endpoints_validation_and_access(client, monkeypatch):
    import app.api.workspace as ws

    email = _email()
    _register_login(client, email)

    # invalid frequency / bad recipient / enable-without-recipients
    assert client.put("/api/v1/workspace/report-schedule",
                      json={"frequency": "daily"}).status_code == 422
    assert client.put("/api/v1/workspace/report-schedule",
                      json={"recipients": "nope", "frequency": "weekly"}).status_code == 422
    assert client.put("/api/v1/workspace/report-schedule",
                      json={"recipients": "", "frequency": "weekly", "enabled": True}).status_code == 422

    # valid save + read back (recipients normalized)
    r = client.put("/api/v1/workspace/report-schedule",
                   json={"recipients": " Client@X.com , boss@y.io ", "frequency": "monthly", "enabled": True})
    assert r.status_code == 200, r.text
    got = client.get("/api/v1/workspace/report-schedule").json()
    assert got["recipients"] == "client@x.com,boss@y.io"
    assert got["frequency"] == "monthly" and got["enabled"] is True

    # a plain member can't see or edit the owner's schedule
    box = {}
    monkeypatch.setattr(ws, "send_team_invite_email", lambda to, c, r, t: box.update({to: t}) or True)
    owner_id = client.get("/api/v1/auth/me").json()["id"]
    member_email = _email()
    client.post("/api/v1/workspace/team/invite", json={"email": member_email, "role": "member"})
    _register_login(client, member_email)
    client.post("/api/v1/workspace/team/accept", json={"token": box[member_email]})
    assert client.get(f"/api/v1/workspace/report-schedule?workspace={owner_id}").status_code == 403
