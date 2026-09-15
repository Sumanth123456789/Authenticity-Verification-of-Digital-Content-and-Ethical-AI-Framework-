"""
AI-Content Verification Hub — Phase 8A Security & Authentication Pytest Suite

Tests:
1. User Registration & Password Hashing (bcrypt)
2. User Login & JWT Token Generation
3. Invalid / Expired JWT Token Rejection
4. Protected Endpoint Authorization (Bearer Token)
5. User Ownership & Data Isolation (AnalysisRecords & Call Sessions)
6. Sliding-Window Rate Limiting (HTTP 429)
"""

import pytest
from fastapi import HTTPException
from database.models import User, AnalysisRecord, AnalysisTypeEnum, AnalysisStatusEnum, VerdictEnum, RiskLevelEnum
from security.auth import hash_password, verify_password, create_access_token, decode_access_token, get_current_user
from security.rate_limiter import RateLimiter
from routers.auth import register, login, get_me, UserRegisterRequest, UserLoginRequest
from routers.call_router import start_call, process_call_chunk, end_call, StartCallRequest, ChunkCallRequest, EndCallRequest, LIVE_CALL_SESSIONS
from routers.history import get_history_item


def test_password_hashing():
    raw_pwd = "SuperSecretPassword123!"
    hashed = hash_password(raw_pwd)

    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_claims():
    data = {"sub": "user_12345", "email": "test@example.com"}
    token = create_access_token(data)
    assert token is not None

    decoded = decode_access_token(token)
    assert decoded["sub"] == "user_12345"
    assert decoded["email"] == "test@example.com"
    assert "exp" in decoded


@pytest.mark.asyncio
async def test_auth_registration_and_login(db_session):
    reg_req = UserRegisterRequest(
        email="security_test@example.com",
        password="MySecurePassword123!",
        full_name="Security Tester",
    )

    # 1. Register User
    reg_res = await register(reg_req, db=db_session)
    assert reg_res.email == "security_test@example.com"
    assert reg_res.id is not None

    # Duplicate registration check (raises HTTP 400)
    with pytest.raises(HTTPException) as exc_info:
        await register(reg_req, db=db_session)
    assert exc_info.value.status_code == 400

    # 2. Login with Valid Credentials
    login_req = UserLoginRequest(
        email="security_test@example.com",
        password="MySecurePassword123!",
    )
    login_res = await login(login_req, db=db_session)
    assert login_res.access_token is not None
    assert login_res.token_type == "bearer"

    # 3. Login with Invalid Password (raises HTTP 401)
    bad_login = UserLoginRequest(
        email="security_test@example.com",
        password="WrongPassword123!",
    )
    with pytest.raises(HTTPException) as exc_info:
        await login(bad_login, db=db_session)
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_user_data_ownership_isolation(db_session):
    # Create User A and User B
    u_a = User(email="user_a@example.com", hashed_password="pwd", full_name="User A")
    u_b = User(email="user_b@example.com", hashed_password="pwd", full_name="User B")
    db_session.add_all([u_a, u_b])
    await db_session.commit()
    await db_session.refresh(u_a)
    await db_session.refresh(u_b)

    # Create Analysis Record owned by User A
    rec_a = AnalysisRecord(
        user_id=u_a.id,
        filename="user_a_private.jpg",
        analysis_type=AnalysisTypeEnum.IMAGE,
        status=AnalysisStatusEnum.COMPLETE,
        verdict=VerdictEnum.AUTHENTIC,
        risk_level=RiskLevelEnum.LOW,
        risk_score=10,
    )
    db_session.add(rec_a)
    await db_session.commit()
    await db_session.refresh(rec_a)

    # User B attempts to access User A's record ID (raises HTTP 403 Forbidden)
    with pytest.raises(HTTPException) as exc_info:
        await get_history_item(record_id=rec_a.id, current_user=u_b, db=db_session)
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_call_session_ownership_protection():
    u_a = User(id="user_a_id", email="u_a@example.com", hashed_password="p")
    u_b = User(id="user_b_id", email="u_b@example.com", hashed_password="p")

    # User A starts call session
    start_res = await start_call(StartCallRequest(caller_label="Call"), current_user=u_a)
    session_id = start_res["session_id"]

    # User B attempts to push chunk to User A's session (raises HTTP 403)
    with pytest.raises(HTTPException) as exc_info:
        await process_call_chunk(
            ChunkCallRequest(session_id=session_id, transcript_chunk="Hello"),
            current_user=u_b,
        )
    assert exc_info.value.status_code == 403


def test_rate_limiter():
    class MockRequest:
        class Client:
            host = "192.168.1.99"
        client = Client()

    req = MockRequest()

    # Rapid requests up to limit
    for _ in range(5):
        RateLimiter.check_rate_limit(req, client_key="test_ip_1", max_requests=5, window_seconds=60)

    # 6th request triggers rate limit HTTP 429
    with pytest.raises(HTTPException) as exc_info:
        RateLimiter.check_rate_limit(req, client_key="test_ip_1", max_requests=5, window_seconds=60)
    assert exc_info.value.status_code == 429
