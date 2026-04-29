from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.costs import router as costs_router
from app.api.auth import router as auth_router
from app.core.config import settings, validate_environment
from app.core.logger import logger
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
    description="Backend for Cloud Autopilot System",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"] if settings.FRONTEND_URL == "*" else [settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(costs_router, prefix="/costs", tags=["costs"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

