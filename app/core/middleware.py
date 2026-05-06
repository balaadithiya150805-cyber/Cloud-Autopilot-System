"""
Production middleware – logging, error handling, rate limiting.
"""

import time
import traceback
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.core.logger import logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every request with method, path, status code, and duration."""

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} "
            f"({duration_ms:.0f}ms)"
        )
        return response


class GlobalExceptionMiddleware(BaseHTTPMiddleware):
    """
    Catch any unhandled exception and return a structured JSON response
    instead of crashing or leaking stack traces to the client.
    """

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:
            logger.error(
                f"Unhandled exception on {request.method} {request.url.path}: "
                f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
            )
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error"},
            )


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiter for auth endpoints.
    Limits each client IP to `max_requests` per `window_seconds`.
    """

    def __init__(self, app, max_requests: int = 10, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # { ip: [timestamp, ...] }
        self._hits: dict[str, list[float]] = defaultdict(list)

    def _client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next):
        # Only rate-limit auth endpoints
        if not request.url.path.startswith("/auth"):
            return await call_next(request)

        ip = self._client_ip(request)
        now = time.time()
        cutoff = now - self.window_seconds

        # Prune old entries
        self._hits[ip] = [t for t in self._hits[ip] if t > cutoff]

        if len(self._hits[ip]) >= self.max_requests:
            retry_after = int(self._hits[ip][0] + self.window_seconds - now) + 1
            logger.warning(f"Rate limit exceeded for {ip} on {request.url.path}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers={"Retry-After": str(retry_after)},
            )

        self._hits[ip].append(now)
        return await call_next(request)
