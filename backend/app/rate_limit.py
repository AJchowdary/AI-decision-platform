# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

"""In-memory per-account rate limit. MVP: 10 requests per 10 minutes per account_id per endpoint key.

Production note: This is in-memory only. On Render (or any multi-instance/restart environment),
rate limiting is inconsistent across instances. For production, use Redis (e.g. Upstash Redis
free tier) or Supabase table-based throttling and replace this module."""

import time
from collections import defaultdict


# (account_id, key) -> list of request timestamps
_buckets: dict[tuple[str, str], list[float]] = defaultdict(list)
_WINDOW_SEC = 10 * 60  # 10 minutes
_MAX_REQUESTS = 10


def _trim(bucket: list[float], now: float) -> None:
    cutoff = now - _WINDOW_SEC
    while bucket and bucket[0] < cutoff:
        bucket.pop(0)


def check_rate_limit(account_id: str, key: str) -> bool:
    """Returns True if request is allowed, False if rate limited."""
    now = time.time()
    k = (account_id, key)
    _trim(_buckets[k], now)
    if len(_buckets[k]) >= _MAX_REQUESTS:
        return False
    _buckets[k].append(now)
    return True
