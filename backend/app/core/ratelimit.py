"""Tiny in-memory, per-IP sliding-window rate limiter for the auth endpoints.

We run a single uvicorn process, so process-local state is enough — no Redis
needed at this scale. If we ever scale to multiple instances, swap the store
for something shared and keep the same interface.
"""
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

_hits: dict[str, deque[float]] = defaultdict(deque)

# Endpoint name -> (max requests, per window seconds)
LIMITS = {
    "login": (10, 60),       # brute-force guard
    "register": (5, 60),     # bot signup guard
    "exchange": (10, 60),    # auth-code guessing guard
    "email": (5, 60),        # verify-resend / forgot-password (email-send abuse)
    "token": (10, 60),       # verify / reset token submission
}


def _client_ip(request: Request) -> str:
    # Render/Vercel sit behind proxies; the left-most X-Forwarded-For entry is
    # the original client.
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(request: Request, bucket: str) -> None:
    """Raise 429 if this IP has exceeded the bucket's limit."""
    max_hits, window = LIMITS[bucket]
    key = f"{bucket}:{_client_ip(request)}"
    now = time.monotonic()

    q = _hits[key]
    while q and now - q[0] > window:
        q.popleft()

    if len(q) >= max_hits:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please wait a minute and try again.",
        )
    q.append(now)
