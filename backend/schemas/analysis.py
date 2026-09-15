"""
AI-Content Verification Hub — Analysis Request/Response Schemas
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from schemas.common import AnalysisResult, AnalysisType


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_analyses: int
    images_analyzed: int
    videos_analyzed: int
    audios_analyzed: int
    calls_analyzed: int
    texts_analyzed: int
    links_analyzed: int
    suspicious_detections: int
    high_risk_detections: int
    average_processing_time_ms: Optional[float] = None


# ─── History ──────────────────────────────────────────────────────────────────

class HistoryItem(BaseModel):
    """Summary record for the history list view."""
    id: str
    filename: str
    analysis_type: AnalysisType
    verdict: Optional[str] = None
    risk_level: Optional[str] = None
    risk_score: Optional[int] = None
    confidence: Optional[float] = None
    file_size_bytes: Optional[int] = None
    model_used: Optional[str] = None
    processing_time_ms: Optional[int] = None
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None


class HistoryResponse(BaseModel):
    items: list[HistoryItem]
    total: int
    page: int
    per_page: int
