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
import sys
import logging
from contextlib import asynccontextmanager

# Ensure backend directory is in sys.path when started from root directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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

    if "sqlite" in settings.database_url:
        # Local dev: auto-create tables for convenience (no need to run migrations locally)
        await init_db()
        logger.info("🗄️ Database initialized (SQLite — auto create_all)")
    else:
        # Production (Supabase/PostgreSQL): schema is managed by Alembic migrations.
        # Run: alembic upgrade head — before deploying to apply any pending migrations.
        from database.db import engine
        from database import models  # noqa: F401 — register models
        logger.info("🗄️ PostgreSQL (Supabase) — schema managed by Alembic migrations")
        logger.info("   Run: alembic upgrade head — to apply pending migrations")

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
    # Bypass OPTIONS preflight requests, root, docs, and health checks from rate limiter
    path = request.url.path
    if (
        request.method != "OPTIONS"
        and not path.startswith("/api/health")
        and not path.startswith("/health")
        and not path.startswith("/api/v1/health")
        and path != "/"
        and not path.startswith("/docs")
        and not path.startswith("/openapi.json")
    ):
        try:
            from security.rate_limiter import RateLimiter
            RateLimiter.check_rate_limit(request)
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Rate limiter warning: {e}")
    response = await call_next(request)
    return response

# ────────────────────────────────────────────────────────────────
# Configurable CORS
# ────────────────────────────────────────────────────────────────

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
if "http://localhost:3000" not in origins:
    origins.append("http://localhost:3000")
if "http://127.0.0.1:3000" not in origins:
    origins.append("http://127.0.0.1:3000")

cors_kwargs = {
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}

if "*" in origins or settings.cors_origins.strip() == "*":
    cors_kwargs["allow_origins"] = ["*"]
    cors_kwargs["allow_credentials"] = False
else:
    cors_kwargs["allow_origins"] = origins
    # Dynamically allow all Vercel deployments, Render domains, and local development
    cors_kwargs["allow_origin_regex"] = r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://(localhost|127\.0\.0\.1)(:\d+)?"
    cors_kwargs["allow_credentials"] = True

app.add_middleware(CORSMiddleware, **cors_kwargs)

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
            "detail": f"{type(exc).__name__}: {str(exc)}",
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
from routers.chat import router as chat_router
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
app.include_router(chat_router)
app.include_router(chat_router, prefix="/api")
# ────────────────────────────────────────────────────────────────
# Root
# ────────────────────────────────────────────────────────────────


@app.api_route("/", methods=["GET", "HEAD"], include_in_schema=False)
async def root():
    return {
        "name": "AI-Content Verification Hub API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }