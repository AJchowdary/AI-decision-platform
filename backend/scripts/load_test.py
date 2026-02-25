# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

"""
Simple load / stress test: hits GET /health repeatedly in parallel.
Run with: python -m scripts.load_test [--url URL] [--requests N] [--concurrent C]
Default: 200 requests, 10 concurrent, url=http://localhost:8000
"""

import argparse
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import httpx
except ImportError:
    print("Install httpx: pip install httpx")
    sys.exit(1)


def hit(url: str, i: int) -> tuple[int, int, float]:
    """Return (index, status_code, elapsed)."""
    start = time.perf_counter()
    try:
        r = httpx.get(url, timeout=10.0)
        elapsed = time.perf_counter() - start
        return (i, r.status_code, elapsed)
    except Exception as e:
        elapsed = time.perf_counter() - start
        return (i, 0, elapsed)


def main():
    p = argparse.ArgumentParser(description="Load test GET /health")
    p.add_argument("--url", default="http://localhost:8000", help="Base URL")
    p.add_argument("--requests", "-n", type=int, default=200, help="Total requests")
    p.add_argument("--concurrent", "-c", type=int, default=10, help="Concurrent workers")
    args = p.parse_args()
    base = args.url.rstrip("/")
    health_url = f"{base}/health"

    print(f"Load test: {args.requests} requests, {args.concurrent} concurrent → {health_url}")
    start = time.perf_counter()
    ok = 0
    fail = 0
    with ThreadPoolExecutor(max_workers=args.concurrent) as ex:
        futs = [ex.submit(hit, health_url, i) for i in range(args.requests)]
        for f in as_completed(futs):
            i, status, elapsed = f.result()
            if status == 200:
                ok += 1
            else:
                fail += 1
    total = time.perf_counter() - start
    print(f"Done in {total:.2f}s: {ok} OK, {fail} failed")
    if fail:
        print("FAIL: some requests failed")
        sys.exit(1)
    rps = args.requests / total
    print(f"Throughput: {rps:.1f} req/s")
    print("PASS")


if __name__ == "__main__":
    main()
