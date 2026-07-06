"""The anomaly detector: flags real spikes/dips, stays quiet otherwise."""
from app.services.anomaly import detect_anomaly


def _series(daily_sessions, users_ratio=0.7):
    """Build a time series shaped like the dashboard's (last entry = partial today)."""
    return [
        {"date": f"07/{i+1:02d}", "sessions": s, "users": int(s * users_ratio), "views": s * 3}
        for i, s in enumerate(daily_sessions)
    ]


STABLE = [1000, 1040, 980, 1010, 990, 1030, 1005, 995, 1020, 1000]


def test_stable_traffic_is_not_anomalous():
    out = detect_anomaly(_series(STABLE + [1010, 400]))  # 400 = partial today, ignored
    assert out["is_anomaly"] is False


def test_spike_is_flagged_with_plain_english():
    out = detect_anomaly(_series(STABLE + [2500, 100]))  # yesterday 2.5x, today partial
    assert out["is_anomaly"] is True
    assert out["direction"] == "spike"
    assert out["metric"] in ("sessions", "users")
    assert "above your recent daily average" in out["message"]


def test_dip_is_flagged():
    out = detect_anomaly(_series(STABLE + [150, 100]))
    assert out["is_anomaly"] is True
    assert out["direction"] == "dip"
    assert "below your recent daily average" in out["message"]


def test_partial_today_never_triggers():
    # Today (last point) collapsing to near-zero is normal mid-day data.
    out = detect_anomaly(_series(STABLE + [1000, 5]))
    assert out["is_anomaly"] is False


def test_tiny_sites_do_not_scream():
    # mean ~4 sessions; a "3x spike" to 12 is statistical noise, not news.
    out = detect_anomaly(_series([4, 5, 3, 4, 5, 4, 3, 4, 12, 2]))
    assert out["is_anomaly"] is False


def test_insufficient_history_is_quiet():
    out = detect_anomaly(_series([1000, 2500, 100]))
    assert out["is_anomaly"] is False
    assert detect_anomaly([]) == {"is_anomaly": False, "message": ""}
