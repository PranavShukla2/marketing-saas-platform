"""Per-IP rate limiting for the auth endpoints.

Two backends behind one interface:

- **In-memory** (default): a process-local sliding window. Correct for a single
  uvicorn process; state resets on deploy and isn't shared across instances.
- **Redis** (when `REDIS_URL` is set): a shared fixed-window counter (atomic
  INCR+EXPIRE via a Lua script), so the limit holds across multiple instances.
  Required before horizontal scaling — otherwise each instance counts its own
  slice and the real limit is N× what you configured.

If Redis is configured but unreachable at request time, we **fail open** (allow
the request) and log — a rate limiter should never take the whole API down.
"""
import os
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from app.core.log import get_logger

log = get_logger("ratelimit")

# Endpoint name -> (max requests, per window seconds)
LIMITS = {
    "login": (10, 60),       # brute-force guard
    "register": (5, 60),     # bot signup guard
    "exchange": (10, 60),    # auth-code guessing guard
    "email": (5, 60),        # verify-resend / forgot-password (email-send abuse)
    "token": (10, 60),       # verify / reset token submission
    "export": (3, 60),       # GDPR data export (heavier query, no need for more)
    "refresh": (20, 60),     # access-token renewal (one per ~30min per tab normally)
}

# --- in-memory backend (default) ---
_hits: dict[str, deque[float]] = defaultdict(deque)


def _allow_in_memory(key: str, max_hits: int, window: int) -> bool:
    now = time.monotonic()
    q = _hits[key]
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= max_hits:
        return False
    q.append(now)
    return True


# --- redis backend (opt-in via REDIS_URL) ---
# Atomic fixed-window: INCR the key, set the TTL on first hit, return the count.
_REDIS_LUA = """
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return c
"""
_redis_client = None
_redis_url = os.getenv("REDIS_URL")
if _redis_url:
    try:
        import redis  # lazy: only needed when configured

        _redis_client = redis.from_url(_redis_url, socket_connect_timeout=2, socket_timeout=2)
        _redis_client.ping()
        log.info("Rate limiter using Redis backend")
    except Exception as e:
        log.error(f"REDIS_URL set but Redis is unreachable, falling back to in-memory: {e}")
        _redis_client = None


def _allow_redis(key: str, max_hits: int, window: int) -> bool:
    try:
        count = _redis_client.eval(_REDIS_LUA, 1, f"rl:{key}", window)
        return int(count) <= max_hits
    except Exception as e:
        # Fail open — never let a Redis blip lock everyone out.
        log.warning(f"Redis rate-limit check failed, allowing request: {e}")
        return True


def client_ip(request: Request) -> str:
    # Render/Vercel sit behind proxies; the left-most X-Forwarded-For entry is
    # the original client.
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(request: Request, bucket: str) -> None:
    """Raise 429 if this IP has exceeded the bucket's limit."""
    max_hits, window = LIMITS[bucket]
    key = f"{bucket}:{client_ip(request)}"

    allowed = _allow_redis(key, max_hits, window) if _redis_client else _allow_in_memory(key, max_hits, window)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please wait a minute and try again.",
        )
