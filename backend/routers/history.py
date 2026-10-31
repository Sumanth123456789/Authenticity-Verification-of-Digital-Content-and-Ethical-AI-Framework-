"""
AI-Content Verification Hub — History Router
GET /api/v1/history        — paginated list of user's past analyses
GET /api/v1/history/{id}   — single analysis record (ownership enforced)
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_

from database.db import get_db
from database.models import AnalysisRecord, User
from schemas.analysis import HistoryResponse, HistoryItem
from security.auth import get_optional_current_user

router = APIRouter(prefix="/api/v1/history", tags=["history"])


def _to_history_item(record: AnalysisRecord) -> HistoryItem:
    extra = record.extra_data or {}
    return HistoryItem(
        id=record.id,
        filename=record.filename,
        analysis_type=record.analysis_type,
        verdict=record.verdict.value if record.verdict else None,
        risk_level=record.risk_level.value if record.risk_level else None,
        risk_score=record.risk_score,
        confidence=record.confidence,
        file_size_bytes=record.file_size_bytes,
        model_used=record.model_used,
        processing_time_ms=record.processing_time_ms,
        status=record.status.value,
        signals=record.signals,
        explanation=record.explanation,
        limitations=record.limitations,
        extra_data=extra,
        created_at=record.created_at,
        completed_at=record.completed_at,
    )


@router.get("", response_model=HistoryResponse)
async def get_history(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    analysis_type: str | None = Query(default=None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated analysis history, filtered by user ownership."""
    try:
        base_query = select(AnalysisRecord)
        count_query = select(func.count(AnalysisRecord.id))

        # User data isolation: filter by owner or unassigned legacy records
        if current_user:
            user_filter = or_(AnalysisRecord.user_id == current_user.id, AnalysisRecord.user_id == None)
            base_query = base_query.where(user_filter)
            count_query = count_query.where(user_filter)

        if analysis_type and analysis_type != "all":
            base_query = base_query.where(AnalysisRecord.analysis_type == analysis_type)
            count_query = count_query.where(AnalysisRecord.analysis_type == analysis_type)

        total_result = await db.execute(count_query)
        total = total_result.scalar_one() or 0

        offset = (page - 1) * per_page
        items_result = await db.execute(
            base_query.order_by(desc(AnalysisRecord.created_at)).offset(offset).limit(per_page)
        )
        records = items_result.scalars().all()

        return HistoryResponse(
            items=[_to_history_item(r) for r in records],
            total=total,
            page=page,
            per_page=per_page,
        )
    except Exception:
        return HistoryResponse(
            items=[],
            total=0,
            page=page,
            per_page=per_page,
        )


@router.get("/{record_id}")
async def get_history_item(
    record_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return a single analysis record by ID with user ownership check."""
    result = await db.execute(
        select(AnalysisRecord).where(AnalysisRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Analysis record '{record_id}' not found.")

    # Data ownership verification
    if record.user_id and current_user and record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to view this analysis record.",
        )

    item = _to_history_item(record)
    data = item.model_dump()
    data["extra_data"] = record.extra_data or {}
    return data
