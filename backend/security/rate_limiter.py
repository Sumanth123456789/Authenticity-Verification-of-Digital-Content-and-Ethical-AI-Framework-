"""
AI-Content Verification Hub — Sliding-Window Rate Limiting Engine

Enforces configurable API rate limits per client IP / user.
Returns HTTP 429 TOO MANY REQUESTS when request quota is exceeded.
"""

import time
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, Request, status

from config import get_settings

# In-memory sliding-window timestamp store per client identifier
REQUEST_TIMESTAMPS: Dict[str, List[float]] = defaultdict(list)


class RateLimiter:
    """Sliding-window request rate limiter."""

    @staticmethod
    def check_rate_limit(request: Request, client_key: str = None, max_requests: int = None, window_seconds: int = 60):
        settings = get_settings()
        limit = max_requests or settings.rate_limit_requests_per_minute

        key = client_key or request.client.host if request.client else "127.0.0.1"
        now = time.time()
        cutoff = now - window_seconds

        # Prune expired timestamps
        REQUEST_TIMESTAMPS[key] = [t for t in REQUEST_TIMESTAMPS[key] if t > cutoff]

        if len(REQUEST_TIMESTAMPS[key]) >= limit:
            retry_after = int(window_seconds - (now - REQUEST_TIMESTAMPS[key][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {limit} requests permitted per minute.",
                headers={"Retry-After": str(max(1, retry_after))},
            )

        REQUEST_TIMESTAMPS[key].append(now)


async def rate_limit_dependency(request: Request):
    """FastAPI Dependency for endpoint rate limiting."""
    RateLimiter.check_rate_limit(request)
