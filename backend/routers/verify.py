"""
AI-Content Verification Hub — Verify Router

Handles secure multi-modal file uploads (magic-byte container validation, file size limits, filename sanitization),
executes image, video, or audio forensic pipelines, and persists auditable records.
"""

from datetime import datetime, timezone
import logging
import os
import tempfile
import time
from typing import Optional

logger = logging.getLogger("aicvhub.verify")

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from ai.audio_detector import verify_audio_async
from ai.image_detector import verify_image_async
from ai.video_detector import verify_video_async
from config import get_settings
from database.db import get_db
from security.auth import get_optional_current_user
from database.models import (
    AnalysisRecord,
    AnalysisStatusEnum,
    AnalysisTypeEnum,
    CallTranscript,
    RiskLevelEnum,
    VerdictEnum,
    User,
)

router = APIRouter(
    prefix="/api/v1/verify",
    tags=["verify"],
)

ALLOWED_IMAGE_MAGICS = [
    b"\xff\xd8\xff",  # JPEG
    b"\x89PNG\r\n\x1a\n",  # PNG
    b"RIFF",  # WEBP
    b"GIF87a",
    b"GIF89a",
]

ALLOWED_VIDEO_MAGICS = [
    b"ftyp",  # MP4 / MOV
    b"\x00\x00\x00",
    b"\x1a\x45\xdf\xa3",  # MKV / WEBM
    b"RIFF",  # AVI
]

ALLOWED_AUDIO_MAGICS = [
    b"RIFF",  # WAV
    b"ID3",  # MP3
    b"\xff\xfb",  # MP3 raw
    b"\xff\xf3",  # MP3 raw
    b"OggS",  # OGG
    b"fLaC",  # FLAC
    b"ftypM4A",  # M4A
]


def validate_file_security(file_bytes: bytes, filename: str, asset_type: str, settings):
    """Enforces file size, magic byte headers, and path traversal protection."""
    if asset_type == "video":
        max_bytes = settings.max_video_upload_size_bytes
        magics = ALLOWED_VIDEO_MAGICS
    elif asset_type == "audio":
        max_bytes = settings.max_audio_upload_size_bytes
        magics = ALLOWED_AUDIO_MAGICS
    else:
        max_bytes = settings.max_upload_size_bytes
        magics = ALLOWED_IMAGE_MAGICS

    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum permitted limit of {max_bytes / 1024 / 1024:.0f} MB.",
        )

    # Magic byte check
    is_valid = any(magic in file_bytes[:32] for magic in magics)

    if not is_valid and asset_type not in ("video", "audio"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file format. Uploaded asset failed binary magic-byte validation.",
        )


@router.post("")
async def verify_file(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    start_time = time.perf_counter()

    # Sanitize filename
    safe_filename = os.path.basename(file.filename or "uploaded_asset")
    suffix = os.path.splitext(safe_filename)[1].lower()

    # Detect asset type
    video_extensions = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
    audio_extensions = {".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a"}

    content_type = (file.content_type or "").lower()

    if suffix in video_extensions or content_type.startswith("video/"):
        asset_type = "video"
        analysis_enum = AnalysisTypeEnum.VIDEO
    elif suffix in audio_extensions or content_type.startswith("audio/"):
        asset_type = "audio"
        analysis_enum = AnalysisTypeEnum.AUDIO
    else:
        asset_type = "image"
        analysis_enum = AnalysisTypeEnum.IMAGE

    # Read binary header for security checks
    content = await file.read()
    validate_file_security(content, safe_filename, asset_type, settings)

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        # Execute pipeline based on asset type
        if asset_type == "video":
            result = await verify_video_async(temp_path)
        elif asset_type == "audio":
            result = await verify_audio_async(temp_path)
        else:
            result = await verify_image_async(temp_path)

        processing_time_ms = int((time.perf_counter() - start_time) * 1000)

        # Enum mappings
        risk_str = (result.get("risk_level") or "LOW").upper()
        risk_level = RiskLevelEnum[risk_str] if risk_str in RiskLevelEnum.__members__ else RiskLevelEnum.LOW

        verdict_str = (result.get("verdict") or "authentic").lower()
        if verdict_str == "manipulated":
            verdict = VerdictEnum.MANIPULATED
        elif verdict_str == "suspicious":
            verdict = VerdictEnum.SUSPICIOUS
        else:
            verdict = VerdictEnum.AUTHENTIC

        analysis = AnalysisRecord(
            user_id=current_user.id if isinstance(current_user, User) else None,
            filename=safe_filename,
            analysis_type=analysis_enum,
            status=AnalysisStatusEnum.COMPLETE,
            verdict=verdict,
            risk_level=risk_level,
            risk_score=result.get("risk_score", 0),
            confidence=result.get("confidence", 0.85),
            file_size_bytes=len(content),
            model_used=f"{result.get('provider', 'demo')}:{result.get('model_used', 'default')}",
            processing_time_ms=processing_time_ms,
            explanation=result.get("explanation", ""),
            limitations=result.get("limitations"),
            signals=result.get("signals", []),
            extra_data={
                "provider": result.get("provider"),
                "is_demo": result.get("is_demo", True),
                "model_version": result.get("model_version"),
                "synthetic_voice_probability": result.get("synthetic_voice_probability"),
                "factors": result.get("factors", []),
                "timeline_markers": result.get("timeline_markers", []),
                "transcription": result.get("transcription"),
                "metadata": result.get("metadata", {}),
                "heuristic_disclaimer": result.get("heuristic_disclaimer"),
            },
            completed_at=datetime.now(timezone.utc),
        )

        import uuid
        analysis_id = str(uuid.uuid4())
        try:
            db.add(analysis)
            await db.commit()
            await db.refresh(analysis)
            analysis_id = analysis.id

            # If audio with transcript, link CallTranscript record
            if asset_type == "audio" and result.get("transcription"):
                trans_data = result["transcription"]
                call_tx = CallTranscript(
                    analysis_id=analysis.id,
                    user_id=current_user.id if isinstance(current_user, User) else None,
                    full_text=trans_data.get("full_text", ""),
                    language_detected=trans_data.get("language", "en"),
                    duration_seconds=result.get("metadata", {}).get("duration_seconds", 0.0),
                    synthetic_voice_probability=result.get("synthetic_voice_probability", 0.1),
                    segments=trans_data.get("segments", []),
                )
                db.add(call_tx)
                await db.commit()
        except Exception as db_err:
            logger.warning(f"Database persist non-critical failure: {db_err}")
            await db.rollback()

        return {
            "id": analysis_id,
            "filename": analysis.filename,
            "analysis_type": analysis.analysis_type.value,
            "verdict": analysis.verdict.value,
            "risk_level": analysis.risk_level.value,
            "risk_score": analysis.risk_score,
            "confidence": analysis.confidence,
            "synthetic_voice_probability": result.get("synthetic_voice_probability"),
            "provider": result.get("provider"),
            "model_used": analysis.model_used,
            "is_demo": result.get("is_demo", True),
            "processing_time_ms": processing_time_ms,
            "factors": result.get("factors", []),
            "signals": result.get("signals", []),
            "timeline_markers": result.get("timeline_markers", []),
            "transcription": result.get("transcription"),
            "metadata": result.get("metadata", {}),
            "explanation": result.get("explanation"),
            "limitations": result.get("limitations"),
            "heuristic_disclaimer": result.get("heuristic_disclaimer"),
            "message": f"{analysis_enum.value.capitalize()} multi-signal analysis completed and saved successfully.",
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)