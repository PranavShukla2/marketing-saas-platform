"""Rate limiting: in-memory limit still enforced; Redis path selectable."""
import pytest
from fastapi import HTTPException

from app.core import ratelimit


class _Req:
    def __init__(self, ip="1.2.3.4"):
        self.headers = {"x-forwarded-for": ip}
        self.client = None


def test_in_memory_blocks_after_limit(monkeypatch):
    ratelimit._hits.clear()
    monkeypatch.setattr(ratelimit, "_redis_client", None)
    # login bucket is 10/min
    for _ in range(10):
        ratelimit.enforce_rate_limit(_Req(), "login")
    with pytest.raises(HTTPException) as e:
        ratelimit.enforce_rate_limit(_Req(), "login")
    assert e.value.status_code == 429


def test_limit_is_per_ip(monkeypatch):
    ratelimit._hits.clear()
    monkeypatch.setattr(ratelimit, "_redis_client", None)
    for _ in range(10):
        ratelimit.enforce_rate_limit(_Req("9.9.9.9"), "login")
    # a different IP is unaffected
    ratelimit.enforce_rate_limit(_Req("8.8.8.8"), "login")


def test_redis_backend_used_when_configured(monkeypatch):
    calls = {"n": 0}

    class FakeRedis:
        def eval(self, script, numkeys, key, window):
            calls["n"] += 1
            return calls["n"]  # 1,2,3... -> allowed until it exceeds max

    monkeypatch.setattr(ratelimit, "_redis_client", FakeRedis())
    # export bucket is 3/min -> 4th should 429
    for _ in range(3):
        ratelimit.enforce_rate_limit(_Req(), "export")
    with pytest.raises(HTTPException):
        ratelimit.enforce_rate_limit(_Req(), "export")
    assert calls["n"] == 4  # went through the redis path


def test_redis_failure_fails_open(monkeypatch):
    class BrokenRedis:
        def eval(self, *a, **k):
            raise RuntimeError("redis down")

    monkeypatch.setattr(ratelimit, "_redis_client", BrokenRedis())
    # must NOT raise — a limiter outage can't take the API down
    for _ in range(50):
        ratelimit.enforce_rate_limit(_Req(), "login")
