"""
AI-Content Verification Hub — Health Check Router
GET /api/health  — confirms backend is alive and DB is reachable.
"""
import time
from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import text

router = APIRouter(tags=["health"])

START_TIME = time.time()


@router.api_route("/api/health", methods=["GET", "HEAD"])
@router.api_route("/health", methods=["GET", "HEAD"])
@router.api_route("/api/v1/health", methods=["GET", "HEAD"])
async def health_check():
    """
    Health check endpoint.
    Returns 200 confirming backend server is operational.
    """
    db_ok = False
    db_err = None
    try:
        from database.db import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            db_ok = True
    except Exception as e:
        db_ok = False
        db_err = str(e)

    uptime_seconds = round(time.time() - START_TIME)

    return {
        "status": "ok" if db_ok else "degraded",
        "service": "AI-Content Verification Hub API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": uptime_seconds,
        "database": "connected" if db_ok else "degraded",
        "database_info": db_err if not db_ok else "operational",
        "phases_active": ["phase_1_branding", "phase_2_backend_foundation"],
    }
