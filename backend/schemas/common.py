"""
AI-Content Verification Hub — Common Pydantic Schemas
Shared types used across all analysis modules.
"""
from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "low"           # Score 0–24
    MODERATE = "moderate" # Score 25–49
    HIGH = "high"         # Score 50–74
    CRITICAL = "critical" # Score 75–100


class Verdict(str, Enum):
    AUTHENTIC = "authentic"
    SUSPICIOUS = "suspicious"
    MANIPULATED = "manipulated"


class AnalysisType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    CALL = "call"
    TEXT = "text"
    LINK = "link"


class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"


class Signal(BaseModel):
    """A single detection signal with a label and 0–100 score."""
    label: str
    score: int = Field(ge=0, le=100)
    description: Optional[str] = None


class AnalysisResult(BaseModel):
    """
    Base structure returned for every analysis.
    Never claims 100% certainty — always includes limitations and model info.
    """
    id: str
    filename: str
    analysis_type: AnalysisType
    status: AnalysisStatus

    # Risk assessment — uses risk-based wording only
    verdict: Optional[Verdict] = None
    risk_level: Optional[RiskLevel] = None
    risk_score: Optional[int] = Field(default=None, ge=0, le=100)  # 0–100
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)  # 0.0–1.0

    # Evidence
    signals: list[Signal] = []
    explanation: Optional[str] = None

    # Transparency
    model_used: Optional[str] = None
    limitations: Optional[str] = None
    processing_time_ms: Optional[int] = None

    # Metadata
    file_size_bytes: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


def risk_level_from_score(score: int) -> RiskLevel:
    """Convert a 0–100 risk score to a RiskLevel label."""
    if score < 25:
        return RiskLevel.LOW
    elif score < 50:
        return RiskLevel.MODERATE
    elif score < 75:
        return RiskLevel.HIGH
    else:
        return RiskLevel.CRITICAL


def verdict_from_score(score: int, suspicious_threshold: int = 35, high_threshold: int = 55) -> Verdict:
    """
    Convert a 0–100 risk score to a Verdict.
    Never claims 100% certainty — results are probabilistic indicators.
    """
    if score >= high_threshold:
        return Verdict.MANIPULATED
    elif score >= suspicious_threshold:
        return Verdict.SUSPICIOUS
    else:
        return Verdict.AUTHENTIC
