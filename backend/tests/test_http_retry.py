"""The shared outbound HTTP session retries transient failures."""
from app.core.http import http, retrying_session


def test_session_mounts_retry_adapter():
    adapter = http.get_adapter("https://example.com")
    retry = adapter.max_retries
    assert retry.total == 3
    assert 429 in retry.status_forcelist and 503 in retry.status_forcelist
    assert retry.backoff_factor > 0


def test_factory_is_configurable():
    s = retrying_session(total=5, backoff=1.0)
    assert s.get_adapter("https://x").max_retries.total == 5
