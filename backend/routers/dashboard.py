"""
AI-Content Verification Hub — Dashboard Stats Router
GET /api/v1/dashboard/stats  — real counts from the database.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database.db import get_db
from database.models import AnalysisRecord, AnalysisTypeEnum, RiskLevelEnum, VerdictEnum, AnalysisStatusEnum
from schemas.analysis import DashboardStats

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """
    Returns real analysis counts from the database.
    All numbers are computed live — no hardcoded values.
    """
    try:
        # Total completed analyses
        total_q = await db.execute(
            select(func.count(AnalysisRecord.id)).where(
                AnalysisRecord.status == AnalysisStatusEnum.COMPLETE
            )
        )
        total = total_q.scalar_one() or 0

        # Per-type counts
        async def count_type(analysis_type: AnalysisTypeEnum) -> int:
            q = await db.execute(
                select(func.count(AnalysisRecord.id)).where(
                    AnalysisRecord.analysis_type == analysis_type,
                    AnalysisRecord.status == AnalysisStatusEnum.COMPLETE,
                )
            )
            return q.scalar_one() or 0

        images = await count_type(AnalysisTypeEnum.IMAGE)
        videos = await count_type(AnalysisTypeEnum.VIDEO)
        audios = await count_type(AnalysisTypeEnum.AUDIO)
        calls = await count_type(AnalysisTypeEnum.CALL)
        texts = await count_type(AnalysisTypeEnum.TEXT)
        links = await count_type(AnalysisTypeEnum.LINK)

        # Suspicious = SUSPICIOUS or MANIPULATED verdict
        suspicious_q = await db.execute(
            select(func.count(AnalysisRecord.id)).where(
                AnalysisRecord.verdict.in_([VerdictEnum.SUSPICIOUS, VerdictEnum.MANIPULATED]),
                AnalysisRecord.status == AnalysisStatusEnum.COMPLETE,
            )
        )
        suspicious = suspicious_q.scalar_one() or 0

        # High risk = HIGH or CRITICAL risk level
        high_risk_q = await db.execute(
            select(func.count(AnalysisRecord.id)).where(
                AnalysisRecord.risk_level.in_([RiskLevelEnum.HIGH, RiskLevelEnum.CRITICAL]),
                AnalysisRecord.status == AnalysisStatusEnum.COMPLETE,
            )
        )
        high_risk = high_risk_q.scalar_one() or 0

        # Average processing time
        avg_time_q = await db.execute(
            select(func.avg(AnalysisRecord.processing_time_ms)).where(
                AnalysisRecord.processing_time_ms.isnot(None),
                AnalysisRecord.status == AnalysisStatusEnum.COMPLETE,
            )
        )
        avg_time = avg_time_q.scalar_one()

        return DashboardStats(
            total_analyses=total,
            images_analyzed=images,
            videos_analyzed=videos,
            audios_analyzed=audios,
            calls_analyzed=calls,
            texts_analyzed=texts,
            links_analyzed=links,
            suspicious_detections=suspicious,
            high_risk_detections=high_risk,
            average_processing_time_ms=round(avg_time, 1) if avg_time else None,
        )
    except Exception:
        return DashboardStats(
            total_analyses=0,
            images_analyzed=0,
            videos_analyzed=0,
            audios_analyzed=0,
            calls_analyzed=0,
            texts_analyzed=0,
            links_analyzed=0,
            suspicious_detections=0,
            high_risk_detections=0,
            average_processing_time_ms=None,
        )
