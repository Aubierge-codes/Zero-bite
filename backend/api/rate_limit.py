"""
Simple in-memory sliding-window rate limiter.

Used on the endpoints that can be abused anonymously (login, OTP, SMS
subscription, contact form). Limits are per API process; run the API behind a
single process/container, or put an edge limiter (nginx, Cloudflare) in front
when scaling horizontally.
"""

import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import HTTPException, Request

_hits: Dict[str, Deque[float]] = defaultdict(deque)


def client_ip(request: Request) -> str:
    """
    Client IP. Behind the bundled nginx (TRUST_PROXY_HEADERS=true) the real
    address comes from X-Real-IP, which nginx overwrites on every request.
    Otherwise proxy headers are ignored because clients could forge them.
    """
    from api.config import get_settings

    if get_settings().TRUST_PROXY_HEADERS:
        real = request.headers.get("x-real-ip")
        if real:
            return real.strip()
    return request.client.host if request.client else "unknown"


def check(key: str, limit: int, window_seconds: int) -> None:
    """Raise 429 if `key` was seen `limit` times within the last `window_seconds`."""
    now = time.monotonic()
    q = _hits[key]
    while q and now - q[0] > window_seconds:
        q.popleft()
    if len(q) >= limit:
        retry = int(window_seconds - (now - q[0])) + 1
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Please try again in {retry} seconds.",
            headers={"Retry-After": str(retry)},
        )
    q.append(now)


def limit(request: Request, scope: str, limit: int, window_seconds: int, extra: str = "") -> None:
    """Rate-limit by client IP (and an optional extra key such as a phone number)."""
    check(f"{scope}:ip:{client_ip(request)}", limit, window_seconds)
    if extra:
        check(f"{scope}:key:{extra}", limit, window_seconds)


def reset() -> None:
    """Clear all counters (used by tests)."""
    _hits.clear()
