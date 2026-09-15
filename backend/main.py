"""
AI-Content Verification Hub — FastAPI Application Entry Point

Architecture:
  Frontend (Vite/React)  :3000
  Backend (FastAPI)      :8000
  Database               SQLite (local dev) → PostgreSQL (production)

Run with:
  python -m uvicorn main:app --reload
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.models import HTTPBearer
from fastapi.responses import JSONResponse

from config import get_settings
from database.db import init_db
from security.rate_limiter import rate_limit_dependency

# ────────────────────────────────────────────────────────────────
# Settings
# ────────────────────────────────────────────────────────────────

settings = get_settings()

# ────────────────────────────────────────────────────────────────
# Logging
# ────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s — %(message)s",
)

logger = logging.getLogger("aicvhub")

# ────────────────────────────────────────────────────────────────
# Lifespan
# ────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 AI-Content Verification Hub API starting up...")

    os.makedirs(settings.temp_upload_dir, exist_ok=True)
    logger.info(f"📁 Temp upload dir: {settings.temp_upload_dir}")

    await init_db()
    logger.info("🗄️ Database initialized (SQLite)")

    logger.info(f"✅ Backend ready — http://localhost:{settings.backend_port}")
    logger.info(f"📖 Swagger Docs — http://localhost:{settings.backend_port}/docs")

    yield

    logger.info("🛑 AI-Content Verification Hub API shutting down...")

# ────────────────────────────────────────────────────────────────
# FastAPI
# ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI-Content Verification Hub API",
    description=(
        "Forensic-grade detection of deepfakes, voice clones, "
        "AI-generated media, scam calls, phishing and manipulated content."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    dependencies=[FastAPI.depends(rate_limit_dependency) if hasattr(FastAPI, "depends") else None] if False else [],
)

# ────────────────────────────────────────────────────────────────
# Rate Limiting Middleware
# ────────────────────────────────────────────────────────────────


@app.middleware("http")
async def apply_rate_limit_middleware(request: Request, call_next):
    # Bypass health check from rate limiter
    if not request.url.path.startswith("/api/health"):
        from security.rate_limiter import RateLimiter
        RateLimiter.check_rate_limit(request)
    response = await call_next(request)
    return response

# ────────────────────────────────────────────────────────────────
# Configurable CORS
# ────────────────────────────────────────────────────────────────

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ────────────────────────────────────────────────────────────────
# Global Exception Handler (Prevents Internal Stack Trace Exposure)
# ────────────────────────────────────────────────────────────────


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )

    logger.error(
        f"Unhandled error on {request.method} {request.url}",
        exc_info=True,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_server_error",
            "detail": "An unexpected server error occurred. Internal stack trace masked for security.",
        },
    )

# ────────────────────────────────────────────────────────────────
# Routers
# ────────────────────────────────────────────────────────────────

from routers.health import router as health_router
from routers.dashboard import router as dashboard_router
from routers.history import router as history_router
from routers.cases import router as cases_router
from routers.verify import router as verify_router
from routers.call_router import router as call_router
from routers.claim_router import router as claim_router
from routers.auth import router as auth_router
from routers.analytics_router import router as analytics_router


app.include_router(health_router)
app.include_router(dashboard_router)
app.include_router(history_router)
app.include_router(cases_router)
app.include_router(verify_router)
app.include_router(call_router)
app.include_router(claim_router)
app.include_router(auth_router)
app.include_router(analytics_router)

# ────────────────────────────────────────────────────────────────
# Root
# ────────────────────────────────────────────────────────────────


@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": "AI-Content Verification Hub API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }