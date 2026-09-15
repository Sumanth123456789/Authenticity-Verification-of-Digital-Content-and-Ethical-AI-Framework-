"""
AI-Content Verification Hub — Text, Link & Claim Verification Pytest Suite
"""

import pytest
from ai.text_detector import TextDetectorEngine
from ai.link_detector import LinkDetectorEngine
from ai.claim_verifier import ClaimVerifierEngine
from routers.claim_router import verify_text, verify_link, verify_claim, TextVerifyRequest, LinkVerifyRequest, ClaimVerifyRequest


def test_text_detector_engine():
    # Test Phishing & Account Trap
    res_phish = TextDetectorEngine.analyze_text("URGENT: Click here to verify your account or your account will be suspended immediately.")
    assert res_phish["phishing_score"] >= 30
    assert res_phish["verdict"] == "suspicious"

    # Test Clean Text
    res_clean = TextDetectorEngine.analyze_text("The meeting is scheduled for 3 PM tomorrow. Please bring the quarterly report.")
    assert res_clean["phishing_score"] == 0
    assert res_clean["verdict"] == "authentic"


def test_link_detector_engine():
    # Test Typosquatting Domain
    res_typo = LinkDetectorEngine.analyze_link("http://paypaI.com/login/verify")
    assert res_typo["risk_score"] >= 40
    assert any("TYPOSQUATTING" in flag for flag in res_typo["signals"][0]["value"]["flags"])

    # Test IP-Literal Host
    res_ip = LinkDetectorEngine.analyze_link("http://192.168.1.1/admin")
    assert "IP_LITERAL_HOST" in res_ip["signals"][0]["value"]["flags"]


def test_claim_verifier_engine():
    # Test Debunked Medical Claim
    res_debunked = ClaimVerifierEngine.verify_claim("COVID-19 vaccines alter human DNA")
    assert res_debunked["claim_verdict"] == "DEBUNKED_FALSE"
    assert len(res_debunked["citations"]) >= 1

    # Test Unsubstantiated Claim
    res_unsub = ClaimVerifierEngine.verify_claim("Random unverified claim about Mars colonization")
    assert res_unsub["claim_verdict"] == "UNSUBSTANTIATED"


@pytest.mark.asyncio
async def test_claim_router_endpoints(db_session):
    # 1. Text verification router
    t_res = await verify_text(TextVerifyRequest(text="Verify your account now"), db=db_session)
    assert t_res["analysis_type"] == "text"
    assert t_res["id"] is not None

    # 2. Link verification router
    l_res = await verify_link(LinkVerifyRequest(url="http://bank0famerica.com/login"), db=db_session)
    assert l_res["analysis_type"] == "link"
    assert l_res["id"] is not None

    # 3. Claim verification router
    c_res = await verify_claim(ClaimVerifyRequest(claim="COVID-19 vaccines alter human DNA"), db=db_session)
    assert c_res["analysis_type"] == "claim"
    assert c_res["claim_verdict"] in ("FALSE", "DEBUNKED_FALSE")
