"""
AI-Content Verification Hub — Live Call & Scam Monitoring Pytest Suite

Tests real-time social engineering pattern detection, OTP theft alerts,
synthetic voice weighting, live call session router, and ORM persistence.
"""

import pytest
from services.scam_detector import ScamDetectorEngine
from routers.call_router import LIVE_CALL_SESSIONS, start_call, process_call_chunk, end_call, StartCallRequest, ChunkCallRequest, EndCallRequest


def test_scam_detector_patterns():
    # Safe conversational text
    res_safe = ScamDetectorEngine.analyze_text("Hello, how are you today? I am calling to discuss our upcoming project meeting.", synthetic_voice_prob=0.10)
    assert res_safe["scam_score"] < 20
    assert res_safe["risk_level"] == "SAFE"

    # Critical scam text with OTP theft & bank impersonation
    scam_text = "This is the Bank Fraud Department. Your account is frozen. Tell me the 6-digit OTP verification code immediately."
    res_scam = ScamDetectorEngine.analyze_text(scam_text, synthetic_voice_prob=0.85)

    assert res_scam["scam_score"] >= 70
    assert res_scam["risk_level"] == "CRITICAL_SCAM"
    assert "OTP_SOLICITATION" in res_scam["flagged_categories"]
    assert "IMPERSONATION" in res_scam["flagged_categories"]


@pytest.mark.asyncio
async def test_call_router_lifecycle(db_session):
    # 1. Start call session
    start_res = await start_call(StartCallRequest(caller_label="Test Caller"))
    session_id = start_res["session_id"]
    assert session_id in LIVE_CALL_SESSIONS
    assert start_res["status"] == "ACTIVE"

    # 2. Push chunk 1
    c1_res = await process_call_chunk(ChunkCallRequest(
        session_id=session_id,
        transcript_chunk="Hello, this is tech support calling regarding your computer virus.",
        synthetic_voice_prob=0.20,
    ))
    assert c1_res["scam_score"] >= 20
    assert "IMPERSONATION" in c1_res["flagged_categories"]

    # 3. Push chunk 2 (Critical OTP solicitation)
    c2_res = await process_call_chunk(ChunkCallRequest(
        session_id=session_id,
        transcript_chunk="Please read me the OTP code sent to your phone right now to fix it.",
        synthetic_voice_prob=0.80,
    ))
    assert c2_res["scam_score"] >= 70
    assert c2_res["risk_level"] == "CRITICAL_SCAM"

    # 4. End call & save DB
    end_res = await end_call(EndCallRequest(session_id=session_id), db=db_session)
    assert end_res["session_id"] == session_id
    assert end_res["risk_level"].upper() in ("CRITICAL", "HIGH")
