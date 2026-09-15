"""
AI-Content Verification Hub — Real-Time Scam & Social Engineering Detection Engine

Analyzes live call transcript streams against financial fraud, impersonation, and OTP theft indicators:
1. Urgent Financial Transfer Pressure (Wire transfers, Gift cards, Crypto, Fines)
2. Impersonation of Authority/Bank/Government (IRS, Police, Bank Fraud Dept, Tech Support)
3. Secret Code / OTP Solicitation (OTP codes, PIN numbers, Password requests)
4. Emergency / Ransom Demands (Bail money, Hospital accident claims)

Combines transcript keyword intensity with acoustic synthetic voice clone probability.
"""

import re
from typing import Any, Dict, List


SCAM_PATTERNS = {
    "URGENT_FINANCIAL": [
        r"\b(?:wire|transfer)\s+money\b",
        r"\b(?:bank|checking|savings)\s+transfer\b",
        r"\bgift\s+card(?:s)?\b",
        r"\bcrypto(?:currency)?\b",
        r"\bbitcoin\b",
        r"\baccount\s+(?:frozen|suspended|blocked)\b",
        r"\bpay\s+(?:immediately|now|today)\b",
        r"\bpenalty|fine\b",
    ],
    "IMPERSONATION": [
        r"\birs\b",
        r"\bpolice\b",
        r"\bfederal\s+agent\b",
        r"\bbank\s+fraud\s+department\b",
        r"\btech\s+support\b",
        r"\bmicrosoft\s+support\b",
        r"\bcustoms\b",
        r"\bsecurity\s+team\b",
    ],
    "OTP_SOLICITATION": [
        r"\botp\b",
        r"\bverification\s+code\b",
        r"\bpin\s+number\b",
        r"\bpassword\b",
        r"\b2fa\s+code\b",
        r"\b6-digit\s+code\b",
        r"\bread\s+(?:me\s+)?the\s+code\b",
    ],
    "EMERGENCY_RANSOM": [
        r"\bbail\b",
        r"\baccident\b",
        r"\bhospital\s+bill\b",
        r"\bkidnapped\b",
        r"\bransom\b",
        r"\burgent\s+help\b",
    ],
}


class ScamDetectorEngine:
    """Analyzes real-time transcript text for social engineering & fraud indicators."""

    @staticmethod
    def analyze_text(text: str, synthetic_voice_prob: float = 0.0) -> Dict[str, Any]:
        text_lower = text.lower()
        flagged_categories = []
        matches_detail = []

        total_weight = 0

        for category, patterns in SCAM_PATTERNS.items():
            matched_in_cat = []
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    matched_in_cat.append(pattern)

            if matched_in_cat:
                flagged_categories.append(category)

                if category == "OTP_SOLICITATION":
                    weight = 40
                elif category == "IMPERSONATION":
                    weight = 30
                elif category == "URGENT_FINANCIAL":
                    weight = 25
                else:
                    weight = 20

                total_weight += weight
                matches_detail.append({
                    "category": category,
                    "matched_count": len(matched_in_cat),
                    "weight": weight,
                })

        # Blend with synthetic voice probability (if cloned voice is used, risk amplifies)
        voice_risk_addon = int(synthetic_voice_prob * 30)
        scam_score = min(100, total_weight + voice_risk_addon)

        if scam_score >= 70:
            risk_level = "CRITICAL_SCAM"
            action = "HANG UP IMMEDIATELY. High-probability financial scam / OTP theft detected."
        elif scam_score >= 40:
            risk_level = "HIGH_RISK"
            action = "CAUTION: Suspicious financial or security questions detected. Do not share codes."
        elif scam_score >= 20:
            risk_level = "CAUTION"
            action = "MONITORING: Potential unsolicited authority call. Verify caller identity."
        else:
            risk_level = "SAFE"
            action = "No active scam keywords or synthetic voice anomalies detected."

        return {
            "scam_score": scam_score,
            "risk_level": risk_level,
            "synthetic_voice_prob": round(synthetic_voice_prob, 2),
            "flagged_categories": flagged_categories,
            "matches_detail": matches_detail,
            "recommended_action": action,
        }
