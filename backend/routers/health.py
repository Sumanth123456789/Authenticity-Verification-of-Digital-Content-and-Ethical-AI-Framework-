"""
AI-Content Verification Hub — Health Check Router
GET /api/health  — confirms backend is alive and DB is reachable.
"""
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database.db import get_db

router = APIRouter(tags=["health"])

START_TIME = time.time()


@router.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint.
    Returns 200 if the backend and database are operational.
    """
    # Test DB connectivity
    db_ok = False
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    uptime_seconds = round(time.time() - START_TIME)

    return {
        "status": "ok" if db_ok else "degraded",
        "service": "AI-Content Verification Hub API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": uptime_seconds,
        "database": "connected" if db_ok else "error",
        "phases_active": ["phase_1_branding", "phase_2_backend_foundation"],
    }
