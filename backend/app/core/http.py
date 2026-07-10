"""Shared HTTP session with retry + backoff for outbound calls.

External providers (Google's OAuth/token endpoints, Resend) have transient
blips — a 503 or a dropped connection shouldn't fail a user's sign-in or drop
a verification email. This session retries idempotent-enough calls a few times
with exponential backoff on connection errors and 429/5xx, so one hiccup
degrades to "slightly slower" instead of "failed".
"""
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


def retrying_session(total: int = 3, backoff: float = 0.5, timeout: int = 15) -> requests.Session:
    retry = Retry(
        total=total,
        connect=total,
        read=total,
        backoff_factor=backoff,  # sleeps ~0.5s, 1s, 2s between tries
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET", "POST"]),
        raise_on_status=False,
    )
    session = requests.Session()
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


# One reusable session (connection pooling + retries) for all outbound calls.
http = retrying_session()
