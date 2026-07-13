"""Quick load test: know the breaking point before customers find it.

Usage:
    python scripts/loadtest.py [base_url]     # default http://localhost:8000

Ramps concurrency over three endpoint profiles and prints RPS + p50/p95 + errors:
  - GET /health            — cheapest path (framework + DB ping overhead)
  - GET /auth/me (cookie)  — every authed request's baseline (JWT decode + user row)
  - POST /auth/login       — bcrypt-bound worst case (this is the wall)

Each virtual user sends a distinct X-Forwarded-For so the per-IP rate limiter
measures throughput, not itself. Run against a *local* server — pointing this
at prod would just rate-limit/alarm it.
"""
import asyncio
import statistics
import sys
import time

import httpx

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
STAGES = (10, 25, 50)          # concurrent virtual users
DURATION = 5.0                 # seconds per stage
PASSWORD = "goodpassword1"


async def _worker(client, make_request, ip, results, deadline):
    while time.monotonic() < deadline:
        t0 = time.monotonic()
        try:
            r = await make_request(client, ip)
            ok = r.status_code < 400
        except Exception:
            ok = False
        results.append((time.monotonic() - t0, ok))


async def run_stage(name, make_request, users):
    results: list[tuple[float, bool]] = []
    deadline = time.monotonic() + DURATION
    async with httpx.AsyncClient(base_url=BASE, timeout=30) as client:
        await asyncio.gather(*(
            _worker(client, make_request, f"10.0.{u // 250}.{u % 250 + 1}", results, deadline)
            for u in range(users)
        ))
    lat = sorted(t for t, _ in results)
    errors = sum(1 for _, ok in results if not ok)
    if not lat:
        print(f"  {name:14s} x{users:<3d} NO RESULTS")
        return
    p50 = statistics.median(lat) * 1000
    p95 = lat[int(len(lat) * 0.95) - 1] * 1000
    rps = len(lat) / DURATION
    print(f"  {name:14s} x{users:<3d} {rps:7.1f} req/s   p50 {p50:7.1f}ms   p95 {p95:8.1f}ms   errors {errors}")


async def main():
    # Prepare one account we can log in as, and grab its session cookie.
    async with httpx.AsyncClient(base_url=BASE, timeout=30) as c:
        email = f"loadtest-{int(time.time())}@example.com"
        await c.post("/api/v1/auth/register",
                     json={"company_name": "Load", "email": email, "password": PASSWORD},
                     headers={"X-Forwarded-For": "10.9.9.9"})
        login = await c.post("/api/v1/auth/login",
                             json={"email": email, "password": PASSWORD},
                             headers={"X-Forwarded-For": "10.9.9.9"})
        cookies = dict(login.cookies)

    async def health(client, ip):
        return await client.get("/health", headers={"X-Forwarded-For": ip})

    async def me(client, ip):
        return await client.get("/api/v1/auth/me", cookies=cookies, headers={"X-Forwarded-For": ip})

    async def do_login(client, ip):
        return await client.post("/api/v1/auth/login",
                                 json={"email": email, "password": PASSWORD},
                                 headers={"X-Forwarded-For": ip})

    print(f"Load test against {BASE} — {DURATION:.0f}s per stage\n")
    for name, fn in (("health", health), ("auth/me", me), ("login(bcrypt)", do_login)):
        for users in STAGES:
            await run_stage(name, fn, users)
        print()


if __name__ == "__main__":
    asyncio.run(main())
