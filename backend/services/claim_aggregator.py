"""
AI-Content Verification Hub — Multi-Source Fact-Check Evidence Aggregator

Aggregates evidence items from fact-check search providers.
Maps textual ratings to a 7-tier nuanced verdict model:
- SUPPORTED
- MOSTLY_SUPPORTED
- MIXED
- MOSTLY_FALSE
- FALSE
- UNVERIFIED
- CONFLICTING

Enforces SSRF URL validation to prevent internal network access.
"""

from typing import Any, Dict, List
import re
import urllib.parse
from datetime import datetime, timezone

from ai.fact_check.factory import FactCheckProviderFactory

PRIVATE_IP_REGEX = re.compile(
    r"^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|0\.0\.0\.0)$",
    re.IGNORECASE,
)


def validate_source_url(url: str) -> bool:
    """SSRF Defense: Validates URL scheme is HTTP/HTTPS and host is not a private IP."""
    if not url:
        return False
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = parsed.hostname or ""
        if PRIVATE_IP_REGEX.match(hostname):
            return False
        return True
    except Exception:
        return False


def classify_textual_rating(rating: str) -> str:
    """Classifies raw textual rating into standard rating bucket: 'true', 'false', 'mixed', 'unverified'."""
    r_lower = (rating or "").lower().strip()

    false_keywords = ["false", "debunked", "incorrect", "pants on fire", "fake", "inaccurate", "misleading", "distorted"]
    mixed_keywords = ["mixed", "half true", "partly true", "context missing", "mostly true", "mostly false"]
    true_keywords = ["true", "correct", "accurate", "verified", "supported", "fact"]

    if any(k in r_lower for k in false_keywords):
        return "false"
    elif any(k in r_lower for k in mixed_keywords):
        return "mixed"
    elif any(k in r_lower for k in true_keywords):
        return "true"
    else:
        return "unverified"


class ClaimAggregatorEngine:
    """Aggregates multi-source fact-checking evidence into a composite verdict."""

    @staticmethod
    async def verify_claim(claim_text: str) -> Dict[str, Any]:
        text_clean = claim_text.strip()
        provider = FactCheckProviderFactory.get_provider()

        # Search external/demo provider
        search_res = await provider.search_claim(text_clean)
        raw_sources = search_res.get("sources", [])
        provider_name = search_res.get("provider", "demo")
        is_demo = search_res.get("is_demo", True)
        status = search_res.get("status", "unverified")
        error_msg = search_res.get("error_message")

        # Sanitize & SSRF-filter source URLs
        clean_sources: List[Dict[str, Any]] = []
        for src in raw_sources:
            url = src.get("url", "")
            if validate_source_url(url) or is_demo:
                clean_sources.append({
                    "publisher": src.get("publisher", "Independent Fact-Checker"),
                    "publisher_site": src.get("publisher_site", ""),
                    "url": url,
                    "title": src.get("title", text_clean),
                    "publication_date": src.get("publication_date", ""),
                    "textual_rating": src.get("textual_rating", "Unrated"),
                    "normalized_rating": classify_textual_rating(src.get("textual_rating", "")),
                })

        # Evaluate 7-Tier Nuanced Verdict
        true_count = sum(1 for s in clean_sources if s["normalized_rating"] == "true")
        false_count = sum(1 for s in clean_sources if s["normalized_rating"] == "false")
        mixed_count = sum(1 for s in clean_sources if s["normalized_rating"] == "mixed")
        total_sources = len(clean_sources)

        if total_sources == 0:
            claim_verdict = "UNVERIFIED"
            verdict = "suspicious"
            confidence = 0.50
            risk_score = 35
            risk_level = "MODERATE"
            reasoning = "No matching authoritative fact-check records were found for this claim."
        elif true_count > 0 and false_count > 0:
            claim_verdict = "CONFLICTING"
            verdict = "suspicious"
            confidence = 0.75
            risk_score = 60
            risk_level = "HIGH"
            reasoning = f"Conflicting evidence found: {false_count} source(s) state the claim is False, while {true_count} source(s) state it is True."
        elif false_count / total_sources >= 0.8:
            claim_verdict = "FALSE"
            verdict = "manipulated"
            confidence = min(0.98, 0.70 + (total_sources * 0.08))
            risk_score = 85
            risk_level = "CRITICAL"
            reasoning = f"Available authoritative fact-checking evidence strongly contradicts the claim ({false_count} source(s) rated False)."
        elif false_count > 0:
            claim_verdict = "MOSTLY_FALSE"
            verdict = "manipulated"
            confidence = 0.82
            risk_score = 70
            risk_level = "HIGH"
            reasoning = "Available fact-checking evidence contradicts central parts of the claim."
        elif mixed_count > 0:
            claim_verdict = "MIXED"
            verdict = "suspicious"
            confidence = 0.75
            risk_score = 45
            risk_level = "MODERATE"
            reasoning = "Fact-checking evidence indicates a mixture of true and misleading assertions or missing context."
        elif true_count / total_sources >= 0.8:
            claim_verdict = "SUPPORTED"
            verdict = "authentic"
            confidence = min(0.95, 0.70 + (total_sources * 0.08))
            risk_score = 10
            risk_level = "LOW"
            reasoning = f"Authoritative fact-checking evidence confirms and supports the claim ({true_count} source(s) rated True)."
        else:
            claim_verdict = "MOSTLY_SUPPORTED"
            verdict = "authentic"
            confidence = 0.80
            risk_score = 20
            risk_level = "LOW"
            reasoning = "Evidence generally supports the claim statement."

        # Operational Limitations Note
        if status == "error" or error_msg:
            limitations = f"External fact-checking service encountered an issue: {error_msg}. Results may be unverified."
        else:
            limitations = "The assessment depends on the availability, coverage, and timeliness of external fact-checking publishers."

        signals = [
            {
                "signal": "FACT_CHECK_EVIDENCE_AGGREGATION",
                "value": {
                    "claim": text_clean,
                    "claim_verdict": claim_verdict,
                    "total_sources": total_sources,
                    "true_count": true_count,
                    "false_count": false_count,
                },
                "severity": "critical" if verdict == "manipulated" else "moderate" if verdict == "suspicious" else "info",
                "confidence": confidence,
                "description": f"Assigned verdict '{claim_verdict}'. {reasoning}",
                "limitations": limitations,
            }
        ]

        timestamp_iso = datetime.now(timezone.utc).isoformat()

        return {
            "provider": provider_name,
            "model_used": f"fact-check:{provider_name}-v1",
            "model_version": "1.0.0",
            "is_demo": is_demo,
            "claim": text_clean,
            "verdict": verdict,
            "claim_verdict": claim_verdict,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence": confidence,
            "sources": clean_sources,
            "signals": signals,
            "explanation": f"Claim Assessment: {claim_verdict} (Confidence: {int(confidence * 100)}%). {reasoning}",
            "limitations": limitations,
            "verification_timestamp": timestamp_iso,
            "heuristic_disclaimer": "Initial heuristic weights — not scientifically validated.",
        }
