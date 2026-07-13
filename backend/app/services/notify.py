"""Alert delivery beyond email: Slack/Discord webhook + the weekly digest.

The webhook gets the same plain-English anomaly line as email. The digest is a
weekly summary built entirely from the *cached* dashboard payload — zero extra
Google calls — and sent by the background sync pass when a workspace is due.

SSRF note: the webhook URL is user-supplied and our server POSTs to it, so it's
restricted to known webhook hosts (Slack/Discord) rather than any URL.
"""
from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.email import send_email
from app.core.http import http
from app.core.log import get_logger
from app.core.time import utcnow
from app.db.models import NotificationSettings, User

log = get_logger("notify")

# Only hosts we're happy to POST to from the server (SSRF containment).
ALLOWED_WEBHOOK_PREFIXES = (
    "https://hooks.slack.com/",
    "https://discord.com/api/webhooks/",
    "https://discordapp.com/api/webhooks/",
)

DIGEST_INTERVAL_DAYS = 7


def webhook_url_allowed(url: str) -> bool:
    return url.startswith(ALLOWED_WEBHOOK_PREFIXES)


def send_webhook(url: str, message: str) -> bool:
    """Post one message. Slack reads `text`, Discord reads `content` — sending
    both keys in one payload satisfies either without host sniffing."""
    try:
        r = http.post(url, json={"text": message, "content": message}, timeout=10)
        if r.status_code >= 400:
            log.warning(f"Webhook delivery failed ({r.status_code})")
            return False
        return True
    except Exception as e:
        log.warning(f"Webhook delivery failed: {e}")
        return False


def get_settings(db: Session, owner_id: int) -> NotificationSettings | None:
    return db.get(NotificationSettings, owner_id)


def notify_anomaly(db: Session, owner_id: int, message: str) -> None:
    """Fan the anomaly out to the workspace's webhook, if one is configured."""
    s = get_settings(db, owner_id)
    if s and s.slack_webhook_url:
        send_webhook(s.slack_webhook_url, f"⚠️ ArbFlow alert: {message}")


# ---------------- Weekly digest ----------------

def build_digest(payload: dict) -> dict | None:
    """Summarize the last 7 complete days vs the 7 before, from the cached payload."""
    series = payload.get("time_series") or []
    if payload.get("status") != "active" or len(series) < 15:  # 14 complete + partial today
        return None

    complete = series[:-1]  # drop partial today
    this_week = complete[-7:]
    prev_week = complete[-14:-7]

    def _tot(rows, key):
        return sum(int(r.get(key, 0)) for r in rows)

    def _pct(cur, prev):
        return round(((cur - prev) / prev) * 100) if prev else None

    metrics = {}
    for key in ("users", "sessions", "views"):
        cur, prev = _tot(this_week, key), _tot(prev_week, key)
        metrics[key] = {"current": cur, "previous": prev, "pct": _pct(cur, prev)}

    top = None
    channels = payload.get("channel_data") or []
    if channels:
        top = {"channel": channels[0].get("channel", "—"), "users": channels[0].get("users", 0)}

    return {"metrics": metrics, "top_channel": top, "company": payload.get("company_name", "")}


def _fmt_pct(p) -> str:
    if p is None:
        return ""
    arrow = "▲" if p >= 0 else "▼"
    return f" ({arrow} {abs(p)}%)"


def send_digest_email(to: str, digest: dict) -> bool:
    m = digest["metrics"]
    rows = "".join(
        f"<tr><td style='padding:8px 12px;color:#5b5f7a'>{label}</td>"
        f"<td style='padding:8px 12px;text-align:right;font-weight:600'>{m[key]['current']:,}{_fmt_pct(m[key]['pct'])}</td></tr>"
        for key, label in (("users", "Users"), ("sessions", "Sessions"), ("views", "Page views"))
    )
    top = digest.get("top_channel")
    top_line = f"<p style='font-size:14px;color:#5b5f7a'>Top channel: <b>{top['channel']}</b> ({top['users']:,} users)</p>" if top else ""
    html = f"""\
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#15132e">
  <h1 style="font-size:20px;margin:0 0 4px">Your week in numbers</h1>
  <p style="font-size:14px;color:#5b5f7a;margin:0 0 20px">{digest.get('company','')} — last 7 days vs the week before.</p>
  <table style="width:100%;border-collapse:collapse;background:#f8f8fc;border-radius:12px">{rows}</table>
  {top_line}
  <p style="font-size:12px;color:#9aa0b5;margin-top:24px">Weekly digest from ArbFlow. Turn it off in Settings → Notifications.</p>
</div>"""
    return send_email(to, "Your ArbFlow weekly digest", html)


def maybe_send_digest(db: Session, owner: User, payload: dict) -> bool:
    """Send the weekly digest if this workspace is due. Returns True if sent.

    The send window is *claimed atomically* (UPDATE ... WHERE still-due) so two
    app instances running the sync pass concurrently can't both send — the
    same single-spend pattern as refresh tokens.
    """
    s = get_settings(db, owner.id)
    if s is not None and not s.digest_enabled:
        return False
    last = s.digest_last_sent_at if s else None
    if last is not None and utcnow() - last < timedelta(days=DIGEST_INTERVAL_DAYS):
        return False

    digest = build_digest(payload)
    if digest is None:
        return False  # not enough data yet; try again next pass (window unclaimed)

    # Ensure the row exists so the claim has something to lock onto. A racing
    # insert loses on the PK and just means the other instance owns the row.
    if s is None:
        try:
            db.add(NotificationSettings(user_id=owner.id))
            db.commit()
        except Exception:
            db.rollback()
        s = get_settings(db, owner.id)
        if s is None:
            return False

    cutoff = utcnow() - timedelta(days=DIGEST_INTERVAL_DAYS)
    claimed = (
        db.query(NotificationSettings)
        .filter(
            NotificationSettings.user_id == owner.id,
            NotificationSettings.digest_enabled.is_(True),
            (NotificationSettings.digest_last_sent_at.is_(None))
            | (NotificationSettings.digest_last_sent_at < cutoff),
        )
        .update({"digest_last_sent_at": utcnow()}, synchronize_session=False)
    )
    db.commit()
    if claimed == 0:
        return False  # another instance got here first

    send_digest_email(owner.email, digest)
    if s.slack_webhook_url:
        m = digest["metrics"]
        send_webhook(
            s.slack_webhook_url,
            "📊 ArbFlow weekly digest — users {u:,}{up}, sessions {s:,}{sp}, views {v:,}{vp}".format(
                u=m["users"]["current"], up=_fmt_pct(m["users"]["pct"]),
                s=m["sessions"]["current"], sp=_fmt_pct(m["sessions"]["pct"]),
                v=m["views"]["current"], vp=_fmt_pct(m["views"]["pct"]),
            ),
        )
    log.info(f"Weekly digest sent for workspace {owner.id}")
    return True
