"""
AI-Content Verification Hub — Text, Link & Claim Verification Router

Endpoints:
- POST /api/v1/verify/text : Text AI burstiness & phishing pattern analysis.
- POST /api/v1/verify/link : URL typosquatting radar & domain security scan.
- POST /api/v1/verify/claim: Fact-checking claim verification & authoritative citations.
"""

from datetime import datetime, timezone
import logging
import time
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("aicvhub.claim_router")

from ai.claim_verifier import ClaimVerifierEngine
from ai.link_detector import LinkDetectorEngine
from ai.text_detector import TextDetectorEngine
from database.db import get_db
from database.models import (
    AnalysisRecord,
    AnalysisStatusEnum,
    AnalysisTypeEnum,
    RiskLevelEnum,
    VerdictEnum,
    User,
)
from security.auth import get_optional_current_user

router = APIRouter(
    prefix="/api/v1/verify",
    tags=["verify-text-link-claim"],
)


class TextVerifyRequest(BaseModel):
    text: str


class LinkVerifyRequest(BaseModel):
    url: str


class ClaimVerifyRequest(BaseModel):
    claim: str


@router.post("/text")
async def verify_text(
    req: TextVerifyRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    start_time = time.perf_counter()
    result = TextDetectorEngine.analyze_text(req.text)
    processing_time_ms = int((time.perf_counter() - start_time) * 1000)

    risk_str = (result.get("risk_level") or "LOW").upper()
    risk_level = RiskLevelEnum[risk_str] if risk_str in RiskLevelEnum.__members__ else RiskLevelEnum.LOW

    verdict_str = (result.get("verdict") or "authentic").lower()
    verdict = VerdictEnum.MANIPULATED if verdict_str == "manipulated" else VerdictEnum.SUSPICIOUS if verdict_str == "suspicious" else VerdictEnum.AUTHENTIC

    analysis = AnalysisRecord(
        user_id=current_user.id if isinstance(current_user, User) else None,
        filename=f"Text_Snippet_{req.text[:20].strip().replace(' ', '_')}.txt",
        analysis_type=AnalysisTypeEnum.TEXT,
        status=AnalysisStatusEnum.COMPLETE,
        verdict=verdict,
        risk_level=risk_level,
        risk_score=result.get("risk_score", 0),
        confidence=result.get("confidence", 0.85),
        file_size_bytes=len(req.text.encode("utf-8")),
        model_used=result["model_used"],
        processing_time_ms=processing_time_ms,
        explanation=result.get("explanation", ""),
        limitations=result.get("limitations"),
        signals=result.get("signals", []),
        extra_data={
            "provider": result.get("provider"),
            "is_demo": True,
            "ai_generated_probability": result.get("ai_generated_probability"),
            "phishing_score": result.get("phishing_score"),
            "factors": result.get("factors", []),
            "heuristic_disclaimer": result.get("heuristic_disclaimer"),
        },
        completed_at=datetime.now(timezone.utc),
    )

    analysis_id = str(uuid.uuid4())
    try:
        db.add(analysis)
        await db.commit()
        await db.refresh(analysis)
        analysis_id = analysis.id
    except Exception as db_err:
        logger.warning(f"DB persist failure for text verification: {db_err}")
        await db.rollback()

    return {
        "id": analysis_id,
        "analysis_type": "text",
        "verdict": analysis.verdict.value,
        "risk_score": analysis.risk_score,
        "risk_level": analysis.risk_level.value,
        "confidence": analysis.confidence,
        "ai_generated_probability": result.get("ai_generated_probability"),
        "phishing_score": result.get("phishing_score"),
        "signals": result.get("signals", []),
        "explanation": analysis.explanation,
        "limitations": analysis.limitations,
        "message": "Text forensic & phishing analysis completed successfully.",
    }


@router.post("/link")
async def verify_link(
    req: LinkVerifyRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    start_time = time.perf_counter()
    result = LinkDetectorEngine.analyze_link(req.url)
    processing_time_ms = int((time.perf_counter() - start_time) * 1000)

    risk_str = (result.get("risk_level") or "LOW").upper()
    risk_level = RiskLevelEnum[risk_str] if risk_str in RiskLevelEnum.__members__ else RiskLevelEnum.LOW

    verdict_str = (result.get("verdict") or "authentic").lower()
    verdict = VerdictEnum.MANIPULATED if verdict_str == "manipulated" else VerdictEnum.SUSPICIOUS if verdict_str == "suspicious" else VerdictEnum.AUTHENTIC

    analysis = AnalysisRecord(
        user_id=current_user.id if isinstance(current_user, User) else None,
        filename=f"URL_{result['domain']}",
        analysis_type=AnalysisTypeEnum.LINK,
        status=AnalysisStatusEnum.COMPLETE,
        verdict=verdict,
        risk_level=risk_level,
        risk_score=result.get("risk_score", 0),
        confidence=result.get("confidence", 0.90),
        file_size_bytes=len(req.url.encode("utf-8")),
        model_used=result["model_used"],
        processing_time_ms=processing_time_ms,
        explanation=result.get("explanation", ""),
        limitations=result.get("limitations"),
        signals=result.get("signals", []),
        extra_data={
            "provider": result.get("provider"),
            "is_demo": True,
            "domain": result.get("domain"),
            "factors": result.get("factors", []),
            "heuristic_disclaimer": result.get("heuristic_disclaimer"),
        },
        completed_at=datetime.now(timezone.utc),
    )

    analysis_id = str(uuid.uuid4())
    try:
        db.add(analysis)
        await db.commit()
        await db.refresh(analysis)
        analysis_id = analysis.id
    except Exception as db_err:
        logger.warning(f"DB persist failure for link verification: {db_err}")
        await db.rollback()

    return {
        "id": analysis_id,
        "analysis_type": "link",
        "verdict": analysis.verdict.value,
        "risk_score": analysis.risk_score,
        "risk_level": analysis.risk_level.value,
        "confidence": analysis.confidence,
        "domain": result.get("domain"),
        "signals": result.get("signals", []),
        "explanation": analysis.explanation,
        "limitations": analysis.limitations,
        "message": "URL reputation & typosquatting analysis completed successfully.",
    }


from services.claim_aggregator import ClaimAggregatorEngine


@router.post("/claim")
async def verify_claim(
    req: ClaimVerifyRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    start_time = time.perf_counter()
    result = await ClaimAggregatorEngine.verify_claim(req.claim)
    processing_time_ms = int((time.perf_counter() - start_time) * 1000)

    risk_str = (result.get("risk_level") or "LOW").upper()
    risk_level = RiskLevelEnum[risk_str] if risk_str in RiskLevelEnum.__members__ else RiskLevelEnum.LOW

    verdict_str = (result.get("verdict") or "authentic").lower()
    verdict = VerdictEnum.MANIPULATED if verdict_str == "manipulated" else VerdictEnum.SUSPICIOUS if verdict_str == "suspicious" else VerdictEnum.AUTHENTIC

    analysis = AnalysisRecord(
        user_id=current_user.id if isinstance(current_user, User) else None,
        filename=f"Claim_{req.claim[:20].strip().replace(' ', '_')}",
        analysis_type=AnalysisTypeEnum.TEXT,
        status=AnalysisStatusEnum.COMPLETE,
        verdict=verdict,
        risk_level=risk_level,
        risk_score=result.get("risk_score", 0),
        confidence=result.get("confidence", 0.90),
        file_size_bytes=len(req.claim.encode("utf-8")),
        model_used=result["model_used"],
        processing_time_ms=processing_time_ms,
        explanation=result.get("explanation", ""),
        limitations=result.get("limitations"),
        signals=result.get("signals", []),
        extra_data={
            "provider": result.get("provider"),
            "is_demo": result.get("is_demo", True),
            "claim_verdict": result.get("claim_verdict"),
            "sources": result.get("sources", []),
            "verification_timestamp": result.get("verification_timestamp"),
            "heuristic_disclaimer": result.get("heuristic_disclaimer"),
        },
        completed_at=datetime.now(timezone.utc),
    )

    analysis_id = str(uuid.uuid4())
    try:
        db.add(analysis)
        await db.commit()
        await db.refresh(analysis)
        analysis_id = analysis.id
    except Exception as db_err:
        logger.warning(f"DB persist failure for claim verification: {db_err}")
        await db.rollback()

    return {
        "id": analysis_id,
        "analysis_type": "claim",
        "verdict": analysis.verdict.value,
        "claim_verdict": result.get("claim_verdict"),
        "risk_score": analysis.risk_score,
        "risk_level": analysis.risk_level.value,
        "confidence": analysis.confidence,
        "sources": result.get("sources", []),
        "provider": result.get("provider"),
        "is_demo": result.get("is_demo", True),
        "signals": result.get("signals", []),
        "explanation": analysis.explanation,
        "limitations": analysis.limitations,
        "verification_timestamp": result.get("verification_timestamp"),
        "message": "Fact-check claim verification completed successfully.",
    }
