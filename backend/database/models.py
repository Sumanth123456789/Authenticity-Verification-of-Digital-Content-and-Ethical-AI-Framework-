"""
AI-Content Verification Hub — SQLAlchemy ORM Models
Includes User authentication, AnalysisRecord, CallTranscript, and InvestigationCase tables.

Compatible with both SQLite (local dev) and PostgreSQL/Supabase (production).
UUID primary keys use the native PostgreSQL UUID type on Postgres and String(36) on SQLite.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime, Enum, JSON, ForeignKey, Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from database.db import Base, _is_sqlite

import enum


def _uuid_col(primary_key: bool = False, fk: str | None = None, **kwargs):
    """
    Returns a UUID Column compatible with both SQLite and PostgreSQL.
    - PostgreSQL: uses native UUID type (efficient, indexed properly)
    - SQLite:     uses String(36) storing UUID as text
    """
    if _is_sqlite:
        col_type = String(36)
    else:
        col_type = PG_UUID(as_uuid=False)  # as_uuid=False keeps values as str

    if fk:
        return Column(col_type, ForeignKey(fk, **{k: v for k, v in kwargs.items() if k in ("ondelete",)}),
                      primary_key=primary_key,
                      default=lambda: str(uuid.uuid4()),
                      **{k: v for k, v in kwargs.items() if k not in ("ondelete",)})
    return Column(col_type, primary_key=primary_key, default=lambda: str(uuid.uuid4()), **kwargs)


class RiskLevelEnum(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class AnalysisTypeEnum(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    CALL = "call"
    TEXT = "text"
    LINK = "link"


class AnalysisStatusEnum(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"


class VerdictEnum(str, enum.Enum):
    AUTHENTIC = "authentic"
    SUSPICIOUS = "suspicious"
    MANIPULATED = "manipulated"


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """User account model for JWT authentication & data ownership."""
    __tablename__ = "users"

    id = _uuid_col(primary_key=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)

    analyses = relationship("AnalysisRecord", back_populates="owner", cascade="all, delete-orphan")


class AnalysisRecord(Base):
    """Stores the result of every content analysis."""
    __tablename__ = "analysis_records"

    id = _uuid_col(primary_key=True)
    user_id = _uuid_col(fk="users.id", ondelete="SET NULL", nullable=True, index=True)
    filename = Column(String(512), nullable=False)
    analysis_type = Column(Enum(AnalysisTypeEnum), nullable=False)
    status = Column(Enum(AnalysisStatusEnum), nullable=False, default=AnalysisStatusEnum.PENDING)
    verdict = Column(Enum(VerdictEnum), nullable=True)
    risk_level = Column(Enum(RiskLevelEnum), nullable=True)
    risk_score = Column(Integer, nullable=True)          # 0–100
    confidence = Column(Float, nullable=True)             # 0.0–1.0
    file_size_bytes = Column(Integer, nullable=True)
    model_used = Column(String(256), nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    explanation = Column(Text, nullable=True)
    limitations = Column(Text, nullable=True)
    signals = Column(JSON, nullable=True)                 # List[{label, score}]
    extra_data = Column(JSON, nullable=True)              # Type-specific extra fields
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    owner = relationship("User", back_populates="analyses")

    # For call recordings: link to transcript
    call_transcript = relationship(
        "CallTranscript", back_populates="analysis", uselist=False, cascade="all, delete-orphan"
    )


class CallTranscript(Base):
    """Stores call recording transcripts and timestamped segments."""
    __tablename__ = "call_transcripts"

    id = _uuid_col(primary_key=True)
    analysis_id = _uuid_col(fk="analysis_records.id", ondelete="CASCADE", nullable=False, unique=True)
    user_id = _uuid_col(fk="users.id", ondelete="SET NULL", nullable=True, index=True)
    full_text = Column(Text, nullable=False)
    language_detected = Column(String(10), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    synthetic_voice_probability = Column(Float, nullable=True)   # 0.0–1.0
    segments = Column(JSON, nullable=True)   # List[{start, end, text, is_risky, risk_reason}]
    scam_categories = Column(JSON, nullable=True)                # List[str]
    safety_recommendations = Column(JSON, nullable=True)         # List[str]

    analysis = relationship("AnalysisRecord", back_populates="call_transcript")



class ChatMessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"

class ChatMessage(Base):
    """Stores individual chat messages for the AI assistant interactions."""
    __tablename__ = "chat_messages"

    id = _uuid_col(primary_key=True)
    user_id = _uuid_col(fk="users.id", ondelete="SET NULL", nullable=True, index=True)
    role = Column(Enum(ChatMessageRole), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)

    user = relationship("User", backref="chat_messages")

class CasePriorityEnum(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CaseStatusEnum(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING = "waiting"
    COMPLETED = "completed"
    CLOSED = "closed"


class CaseCategoryEnum(str, enum.Enum):
    SCAM = "scam"
    SPAM = "spam"
    PROMOTION = "promotion"
    PHISHING = "phishing"
    DEEPFAKE = "deepfake"
    AI_CONTENT = "ai_content"
    FRAUD = "fraud"
    OTHER = "other"


class InvestigationCase(Base):
    """Represents an investigation case containing one or more evidence items."""
    __tablename__ = "investigation_cases"

    id = _uuid_col(primary_key=True)
    case_number = Column(String(30), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(CaseCategoryEnum), nullable=False, default=CaseCategoryEnum.OTHER)
    priority = Column(Enum(CasePriorityEnum), nullable=False, default=CasePriorityEnum.MEDIUM)
    status = Column(Enum(CaseStatusEnum), nullable=False, default=CaseStatusEnum.OPEN)
    created_by = Column(String(100), nullable=True)
    risk_score = Column(Integer, nullable=True)
    final_verdict = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)