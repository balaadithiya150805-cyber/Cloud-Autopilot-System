from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.costs import router as costs_router
from app.api.auth import router as auth_router
from app.core.config import settings, validate_environment
from app.core.logger import logger
from app.core.middleware import (
    RequestLoggingMiddleware,
    GlobalExceptionMiddleware,
    RateLimitMiddleware,
)
from app.services.db_service import client, init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME}...")
    validate_environment()
    try:
        init_db()
    except Exception as e:
        logger.error(f"MongoDB initialization failed: {e} — running in degraded mode.")
    yield
    try:
        client.close()
    except Exception:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description=(
        "Cloud Autopilot System API — AI-powered cloud cost monitoring, "
        "anomaly detection, and optimization recommendations."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware (order matters: first added = outermost) ──
# 1. Request logging (outermost — logs everything)
app.add_middleware(RequestLoggingMiddleware)

# 2. CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://bucolic-caramel-25cf7f.netlify.app",
]
if settings.FRONTEND_URL not in ("*", ""):
    # Strip trailing slash to avoid mismatch
    origins.append(settings.FRONTEND_URL.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # Always allow any *.netlify.app and *.vercel.app origins
    allow_origin_regex=r"https://.*\.netlify\.app|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Rate limiting on /auth endpoints
app.add_middleware(
    RateLimitMiddleware,
    max_requests=settings.RATE_LIMIT_PER_MINUTE,
    window_seconds=60,
)

# 4. Global exception handler (innermost — catches anything routes don't)
app.add_middleware(GlobalExceptionMiddleware)

# ── Routers ─────────────────────────────────────────────
app.include_router(costs_router, prefix="/costs", tags=["costs"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# ── Root & Health ───────────────────────────────────────
@app.get("/", tags=["status"])
def root():
    return {"status": "Cloud Autopilot API running"}

@app.get("/health", tags=["status"])
def health_check():
    return {"status": "ok"}

