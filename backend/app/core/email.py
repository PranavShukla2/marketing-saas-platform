"""Transactional email via Resend.

Gated on RESEND_API_KEY: without it (local dev, and prod until it's configured)
we just log the message — including the link — so the verify / reset flows are
fully testable without a provider. Uses `requests` directly, no extra SDK.
"""
import os

import requests

from app.core.http import http

from app.core.log import get_logger

log = get_logger("email")

RESEND_API_URL = "https://api.resend.com/emails"


def _cfg():
    # Read at call time so tests / env changes are picked up without re-import.
    return (
        os.getenv("RESEND_API_KEY"),
        os.getenv("EMAIL_FROM", "ArbFlow <onboarding@resend.dev>"),
        os.getenv("FRONTEND_URL", "https://arbflow.pranavmshukla.in").rstrip("/"),
    )


def send_email(to: str, subject: str, html: str) -> bool:
    """Send one email. Returns True if actually sent, False if logged-only/failed."""
    api_key, email_from, _ = _cfg()
    if not api_key:
        log.info(f"[email:dev] (no RESEND_API_KEY) to={to} subject={subject!r}\n{html}")
        return False
    try:
        r = http.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={"from": email_from, "to": [to], "subject": subject, "html": html},
            timeout=15,
        )
        if r.status_code >= 400:
            log.error(f"Resend error {r.status_code}: {r.text}")
            return False
        return True
    except Exception as e:  # never let email failure break the request
        log.error(f"Email send failed: {e}")
        return False


def _template(heading: str, message: str, button_label: str, link: str) -> str:
    return f"""\
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#15132e">
  <h1 style="font-size:20px;margin:0 0 12px">{heading}</h1>
  <p style="font-size:15px;line-height:1.6;color:#5b5f7a;margin:0 0 24px">{message}</p>
  <a href="{link}" style="display:inline-block;background:#5b5bd6;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px">{button_label}</a>
  <p style="font-size:12px;color:#9499b0;margin:24px 0 0;line-height:1.6">Or paste this link into your browser:<br><a href="{link}" style="color:#5b5bd6;word-break:break-all">{link}</a></p>
  <p style="font-size:12px;color:#9499b0;margin:24px 0 0">If you didn't request this, you can safely ignore this email.</p>
</div>"""


def send_verification_email(to: str, token: str) -> bool:
    _, _, frontend = _cfg()
    link = f"{frontend}/verify?token={token}"
    html = _template(
        "Verify your email",
        "Confirm your email address to finish setting up your ArbFlow account.",
        "Verify email",
        link,
    )
    return send_email(to, "Verify your ArbFlow email", html)


def send_password_reset_email(to: str, token: str) -> bool:
    _, _, frontend = _cfg()
    link = f"{frontend}/reset-password?token={token}"
    html = _template(
        "Reset your password",
        "We received a request to reset your ArbFlow password. This link expires in 1 hour.",
        "Reset password",
        link,
    )
    return send_email(to, "Reset your ArbFlow password", html)


def send_anomaly_email(to: str, message: str) -> bool:
    _, _, frontend = _cfg()
    link = f"{frontend}/dashboard"
    html = _template(
        "Something changed in your analytics",
        message,
        "Open your dashboard",
        link,
    )
    return send_email(to, "ArbFlow alert: something changed", html)
