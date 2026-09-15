"""
AI-Content Verification Hub — Live Audio Call & Real-Time Scam Monitoring Router

Endpoints:
- POST /api/v1/call/start: Initialize live call monitoring session.
- POST /api/v1/call/chunk: Process real-time streaming audio / transcript chunk.
- POST /api/v1/call/end: Terminate session, calculate composite scam score, save DB record.
- GET /api/v1/call/status/{session_id}: Live session status polling.
"""

from datetime import datetime, timezone
import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from database.models import (
    AnalysisRecord,
    AnalysisStatusEnum,
    AnalysisTypeEnum,
    CallTranscript,
    RiskLevelEnum,
    VerdictEnum,
    User,
)
from security.auth import get_optional_current_user
from services.scam_detector import ScamDetectorEngine

router = APIRouter(
    prefix="/api/v1/call",
    tags=["call"],
)

# In-memory live session state manager
LIVE_CALL_SESSIONS: Dict[str, Dict[str, Any]] = {}


class StartCallRequest(BaseModel):
    caller_label: Optional[str] = "Incoming Voice Call"


class ChunkCallRequest(BaseModel):
    session_id: str
    transcript_chunk: str
    synthetic_voice_prob: Optional[float] = 0.10


class EndCallRequest(BaseModel):
    session_id: str


@router.post("/start")
async def start_call(
    req: StartCallRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    session_id = f"session_{uuid.uuid4().hex[:10]}"
    LIVE_CALL_SESSIONS[session_id] = {
        "session_id": session_id,
        "user_id": current_user.id if isinstance(current_user, User) else None,
        "caller_label": req.caller_label,
        "status": "ACTIVE",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "transcript_chunks": [],
        "scam_score": 0,
        "risk_level": "SAFE",
        "synthetic_voice_prob": 0.0,
        "flagged_categories": [],
        "recommended_action": "Call initialized. Monitoring acoustic and transcript stream.",
    }
    return {
        "session_id": session_id,
        "status": "ACTIVE",
        "message": "Live call monitoring session started successfully.",
    }


@router.post("/chunk")
async def process_call_chunk(
    req: ChunkCallRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    session = LIVE_CALL_SESSIONS.get(req.session_id)
    if not session or session["status"] != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active call session not found.",
        )

    # Session ownership verification
    if session.get("user_id") and isinstance(current_user, User) and session["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this active call monitoring session.",
        )

    # Append transcript chunk
    chunk_text = req.transcript_chunk.strip()
    if chunk_text:
        session["transcript_chunks"].append(chunk_text)

    full_transcript = " ".join(session["transcript_chunks"])
    syn_prob = req.synthetic_voice_prob or session.get("synthetic_voice_prob", 0.10)

    # Run Real-Time Scam Detector
    scam_res = ScamDetectorEngine.analyze_text(full_transcript, synthetic_voice_prob=syn_prob)

    session["scam_score"] = scam_res["scam_score"]
    session["risk_level"] = scam_res["risk_level"]
    session["synthetic_voice_prob"] = syn_prob
    session["flagged_categories"] = scam_res["flagged_categories"]
    session["recommended_action"] = scam_res["recommended_action"]

    return {
        "session_id": req.session_id,
        "scam_score": session["scam_score"],
        "risk_level": session["risk_level"],
        "flagged_categories": session["flagged_categories"],
        "recommended_action": session["recommended_action"],
        "full_transcript": full_transcript,
    }


@router.get("/status/{session_id}")
async def get_call_status(
    session_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    session = LIVE_CALL_SESSIONS.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    if session.get("user_id") and current_user and session["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this active call monitoring session.",
        )

    return session


@router.post("/end")
async def end_call(
    req: EndCallRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = LIVE_CALL_SESSIONS.get(req.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    if session.get("user_id") and isinstance(current_user, User) and session["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this active call monitoring session.",
        )

    session["status"] = "COMPLETED"
    full_transcript = " ".join(session["transcript_chunks"]) or "Live voice call completed with no recorded transcript."

    scam_score = session["scam_score"]
    risk_level_str = session["risk_level"]

    if scam_score >= 70:
        verdict = VerdictEnum.MANIPULATED
        risk_level = RiskLevelEnum.CRITICAL
    elif scam_score >= 40:
        verdict = VerdictEnum.SUSPICIOUS
        risk_level = RiskLevelEnum.HIGH
    elif scam_score >= 20:
        verdict = VerdictEnum.SUSPICIOUS
        risk_level = RiskLevelEnum.MODERATE
    else:
        verdict = VerdictEnum.AUTHENTIC
        risk_level = RiskLevelEnum.LOW

    analysis = AnalysisRecord(
        user_id=current_user.id if isinstance(current_user, User) else session.get("user_id"),
        filename=f"Live_Call_{session['session_id']}.wav",
        analysis_type=AnalysisTypeEnum.CALL,
        status=AnalysisStatusEnum.COMPLETE,
        verdict=verdict,
        risk_level=risk_level,
        risk_score=scam_score,
        confidence=0.90,
        file_size_bytes=len(full_transcript.encode("utf-8")),
        model_used="call:realtime-scam-detector",
        processing_time_ms=120,
        explanation=f"Live voice call monitored for social engineering fraud. Aggregated scam risk score: {scam_score}/100 ({risk_level_str}). Recommended action: {session['recommended_action']}",
        limitations="Real-time call monitoring evaluates transcript keyword patterns and estimated acoustic voice clone probabilities.",
        signals=[
            {
                "signal": "REALTIME_SCAM_DETECTOR",
                "value": {
                    "scam_score": scam_score,
                    "flagged_categories": session["flagged_categories"],
                },
                "severity": "critical" if scam_score >= 70 else "moderate" if scam_score >= 30 else "info",
                "confidence": 0.90,
                "description": session["recommended_action"],
                "limitations": "Keyword detection relies on clear speech-to-text accuracy.",
            }
        ],
        extra_data={
            "provider": "scam-detector",
            "is_demo": True,
            "synthetic_voice_probability": session["synthetic_voice_prob"],
            "flagged_categories": session["flagged_categories"],
            "heuristic_disclaimer": "Initial heuristic weights — not scientifically validated.",
        },
        completed_at=datetime.now(timezone.utc),
    )

    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)

    # Persist CallTranscript record
    call_tx = CallTranscript(
        analysis_id=analysis.id,
        user_id=analysis.user_id,
        full_text=full_transcript,
        language_detected="en",
        duration_seconds=30.0,
        synthetic_voice_probability=session["synthetic_voice_prob"],
        segments=[{"start": 0.0, "end": 30.0, "text": full_transcript}],
    )
    db.add(call_tx)
    await db.commit()

    return {
        "id": analysis.id,
        "session_id": req.session_id,
        "verdict": analysis.verdict.value,
        "risk_score": analysis.risk_score,
        "risk_level": analysis.risk_level.value,
        "explanation": analysis.explanation,
        "message": "Live call session completed and saved to history successfully.",
    }
