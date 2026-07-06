"""Plain-English anomaly detection over the GA4 daily time series.

Deliberately simple and explainable: compare the most recent *complete* day
against the trailing baseline using a z-score, with floors that keep tiny-site
noise from screaming. No ML, no state — just "yesterday was wildly off your
own average, here's by how much."
"""
from statistics import mean, pstdev

# Tunables, chosen to be conservative (better to miss a mild wobble than to
# cry wolf on a dashboard people are meant to trust).
MIN_DAYS = 8            # need at least a week of baseline + the day under test
Z_THRESHOLD = 2.5       # how many std-devs from the mean counts as anomalous
MIN_PCT_CHANGE = 0.25   # ...and it must also be a ±25% move
FLAT_PCT_CHANGE = 0.50  # for perfectly flat baselines (std=0), require ±50%
MIN_VOLUME = 20         # ignore metrics where both sides are near-zero

_METRICS = (("sessions", "Sessions"), ("users", "Users"))

_NO_ANOMALY = {"is_anomaly": False, "message": ""}


def detect_anomaly(time_series: list[dict]) -> dict:
    """Return {"is_anomaly", "message", ...} for the latest complete day.

    `time_series` is the dashboard's daily list (oldest→newest, keys: date,
    users, sessions, views). The final entry is *today*, which is partial —
    it's excluded from both the baseline and the test.
    """
    if not time_series or len(time_series) < MIN_DAYS + 1:  # +1 for partial today
        return _NO_ANOMALY

    complete = time_series[:-1]      # drop partial today
    latest = complete[-1]            # the day under test (yesterday)
    baseline = complete[:-1]         # everything before it

    best = None
    for key, label in _METRICS:
        values = [float(p.get(key, 0)) for p in baseline]
        x = float(latest.get(key, 0))
        avg = mean(values)
        if max(x, avg) < MIN_VOLUME:
            continue  # too small to be meaningful either way
        if avg <= 0:
            continue

        std = pstdev(values)
        pct = (x - avg) / avg

        if std > 0:
            z = (x - avg) / std
            anomalous = abs(z) >= Z_THRESHOLD and abs(pct) >= MIN_PCT_CHANGE
        else:
            anomalous = abs(pct) >= FLAT_PCT_CHANGE

        if anomalous and (best is None or abs(pct) > abs(best["pct"])):
            best = {"key": key, "label": label, "x": x, "avg": avg, "pct": pct}

    if best is None:
        return _NO_ANOMALY

    direction = "above" if best["pct"] > 0 else "below"
    date = latest.get("date", "yesterday")
    message = (
        f"{best['label']} on {date} came in at {int(best['x']):,} — "
        f"{abs(best['pct']) * 100:.0f}% {direction} your recent daily average "
        f"of {best['avg']:,.0f}."
    )
    return {
        "is_anomaly": True,
        "message": message,
        "metric": best["key"],
        "direction": "spike" if best["pct"] > 0 else "dip",
    }
