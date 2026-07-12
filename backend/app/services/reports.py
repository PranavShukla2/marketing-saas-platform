"""Scheduled client-facing report emails.

The agency configures recipients + frequency once; the background sync pass
then emails a **branded** performance report (logo, accent colour, footer from
BrandSettings) built from the cached dashboard payload — the recurring version
of the dashboard's PDF export, and the reason an agency can put a client on
autopilot.
"""
from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.email import send_email
from app.core.log import get_logger
from app.core.time import utcnow
from app.db.models import BrandSettings, ReportSchedule, User
from app.schemas import EMAIL_RE

log = get_logger("reports")

FREQUENCIES = {"weekly": 7, "monthly": 30}
MAX_RECIPIENTS = 5


def parse_recipients(raw: str) -> list[str]:
    """Comma-separated -> validated, deduped, lowercased list (raises ValueError)."""
    out: list[str] = []
    for part in (raw or "").split(","):
        email = part.strip().lower()
        if not email:
            continue
        if not EMAIL_RE.match(email):
            raise ValueError(f"'{part.strip()}' isn't a valid email address.")
        if email not in out:
            out.append(email)
    if len(out) > MAX_RECIPIENTS:
        raise ValueError(f"At most {MAX_RECIPIENTS} recipients.")
    return out


def build_report_html(payload: dict, brand: dict, period_days: int) -> str | None:
    """A branded HTML report from the cached payload; None if not enough data."""
    series = payload.get("time_series") or []
    if payload.get("status") != "active" or len(series) < period_days + 1:
        return None

    window = series[:-1][-period_days:]  # complete days only

    def _tot(key):
        return sum(int(r.get(key, 0)) for r in window)

    accent = brand.get("accent_color") or "#5b5bd6"
    company = payload.get("company_name", "")
    logo_html = (
        f'<img src="{brand["logo_url"]}" alt="" style="max-height:48px;max-width:160px;margin-bottom:16px" />'
        if brand.get("logo_url") else ""
    )

    kpis = "".join(
        f"<td style='padding:14px;text-align:center;background:#f8f8fc;border-radius:12px'>"
        f"<div style='font-size:22px;font-weight:700;color:{accent}'>{_tot(key):,}</div>"
        f"<div style='font-size:12px;color:#5b5f7a'>{label}</div></td><td style='width:8px'></td>"
        for key, label in (("users", "Users"), ("sessions", "Sessions"), ("views", "Page views"))
    )

    channel_rows = "".join(
        f"<tr><td style='padding:8px 12px;border-bottom:1px solid #eee;color:#15132e'>{c.get('channel', '—')}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#5b5f7a'>{c.get('users', 0):,}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#5b5f7a'>{c.get('sessions', 0):,}</td></tr>"
        for c in (payload.get("channel_data") or [])[:5]
    )
    channels_html = (
        f"<h2 style='font-size:15px;margin:28px 0 8px'>Top channels</h2>"
        f"<table style='width:100%;border-collapse:collapse;font-size:13px'>"
        f"<tr><th style='text-align:left;padding:8px 12px;color:#9aa0b5;font-weight:600'>Channel</th>"
        f"<th style='text-align:right;padding:8px 12px;color:#9aa0b5;font-weight:600'>Users</th>"
        f"<th style='text-align:right;padding:8px 12px;color:#9aa0b5;font-weight:600'>Sessions</th></tr>"
        f"{channel_rows}</table>"
    ) if channel_rows else ""

    footer = brand.get("report_footer") or "Generated with ArbFlow"
    period_label = "last 7 days" if period_days == 7 else f"last {period_days} days"

    return f"""\
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#15132e">
  {logo_html}
  <h1 style="font-size:20px;margin:0 0 4px">{company} — performance report</h1>
  <p style="font-size:13px;color:#5b5f7a;margin:0 0 20px">Covering the {period_label}.</p>
  <table style="width:100%;border-collapse:separate;border-spacing:0"><tr>{kpis}</tr></table>
  {channels_html}
  <p style="font-size:11px;color:#9aa0b5;margin-top:32px;border-top:1px solid #eee;padding-top:12px">{footer}</p>
</div>"""


def maybe_send_report(db: Session, owner: User, payload: dict) -> bool:
    """Send the scheduled report if this workspace is due. Returns True if sent."""
    sched = db.get(ReportSchedule, owner.id)
    if sched is None or not sched.enabled:
        return False
    recipients = [r for r in (sched.recipients or "").split(",") if r.strip()]
    if not recipients:
        return False

    period_days = FREQUENCIES.get(sched.frequency, 7)
    if sched.last_sent_at is not None and utcnow() - sched.last_sent_at < timedelta(days=period_days):
        return False

    brand_row = db.get(BrandSettings, owner.id)
    brand = {
        "logo_url": brand_row.logo_url if brand_row else None,
        "accent_color": (brand_row.accent_color if brand_row and brand_row.accent_color else "#5b5bd6"),
        "report_footer": (brand_row.report_footer if brand_row else None),
    }

    html = build_report_html(payload, brand, period_days)
    if html is None:
        return False  # not enough data yet; try next pass

    subject = f"{payload.get('company_name', 'Your')} performance report"
    for r in recipients:
        send_email(r.strip(), subject, html)

    sched.last_sent_at = utcnow()
    db.commit()
    log.info(f"Scheduled report sent for workspace {owner.id} to {len(recipients)} recipient(s)")
    return True
