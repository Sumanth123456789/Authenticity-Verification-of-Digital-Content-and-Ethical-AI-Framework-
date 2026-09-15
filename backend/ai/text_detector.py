"""
AI-Content Verification Hub — Text Forensics & Phishing Detection Engine

Analyzes written text for:
1. AI-Generated Text Probability (sentence burstiness, vocabulary uniformity)
2. Phishing & Malicious Email/SMS Social Engineering Patterns
3. Credential Harvesting & Urgency Language
"""

import re
from typing import Any, Dict


class TextDetectorEngine:
    """Analyzes text for AI generation signatures and phishing patterns."""

    @staticmethod
    def analyze_text(text: str) -> Dict[str, Any]:
        text_clean = text.strip()
        words = text_clean.split()
        sentences = [s.strip() for s in re.split(r"[.!?]+", text_clean) if s.strip()]

        if not words:
            return {
                "ai_generated_probability": 0.10,
                "phishing_score": 0,
                "verdict": "authentic",
                "risk_level": "LOW",
                "confidence": 0.90,
                "signals": [],
                "explanation": "Empty text provided.",
                "limitations": "Requires written text input.",
            }

        # 1. AI-Generated Text Detection (Burstiness & Sentence Length Variance)
        sentence_lengths = [len(s.split()) for s in sentences] if sentences else [len(words)]
        avg_len = sum(sentence_lengths) / len(sentence_lengths)
        variance = sum((l - avg_len) ** 2 for l in sentence_lengths) / len(sentence_lengths)
        burstiness = variance / (avg_len + 1e-6)

        if burstiness < 2.5 and len(sentences) >= 3:
            ai_prob = 0.72
            ai_sev = "moderate"
            ai_desc = f"Uniform sentence structure and low linguistic burstiness detected (burstiness: {burstiness:.2f}). Characteristic of LLM AI text generation."
        else:
            ai_prob = 0.18
            ai_sev = "info"
            ai_desc = f"Natural human linguistic variation and sentence burstiness (burstiness: {burstiness:.2f})."

        # 2. Phishing & Credential Harvesting Detection
        phishing_patterns = [
            (r"\bverify\s+your\s+account\b", "Account Verification Trap", 30),
            (r"\baccount\s+will\b.*\b(suspend|block|close)\b", "Account Suspension Threat", 35),
            (r"\bclick\s+here\b", "Click-Bait Link Trap", 25),
            (r"\bsecurity\s+alert\b", "Security Impersonation", 20),
            (r"\bupdate\s+billing\b", "Financial Credential Theft", 30),
            (r"\burgent\b", "Urgency Manipulation", 20),
        ]

        phishing_score = 0
        phishing_matches = []

        for pattern, label, weight in phishing_patterns:
            if re.search(pattern, text_clean, re.IGNORECASE):
                phishing_score += weight
                phishing_matches.append(label)

        phishing_score = min(100, phishing_score)

        # Composite score: max of phishing score or weighted composite
        composite_score = max(phishing_score, int(round((ai_prob * 40) + (phishing_score * 0.6))))

        if composite_score >= 60:
            verdict = "suspicious"
            risk_level = "HIGH"
        elif composite_score >= 30:
            verdict = "suspicious"
            risk_level = "MODERATE"
        else:
            verdict = "authentic"
            risk_level = "LOW"

        signals = [
            {
                "signal": "AI_TEXT_CLASSIFICATION",
                "value": {"burstiness": round(burstiness, 2), "ai_probability": round(ai_prob, 2)},
                "severity": ai_sev,
                "confidence": 0.82,
                "description": ai_desc,
                "limitations": "Professional human editing or technical documentation exhibits lower burstiness.",
            },
            {
                "signal": "PHISHING_PATTERN_ANALYSIS",
                "value": {"phishing_score": phishing_score, "matches": phishing_matches},
                "severity": "high" if phishing_score >= 50 else "info",
                "confidence": 0.90,
                "description": f"Phishing analysis detected {len(phishing_matches)} risk indicators ({', '.join(phishing_matches) if phishing_matches else 'None'}).",
                "limitations": "Legitimate transactional notifications share vocabulary with phishing templates.",
            },
        ]

        return {
            "provider": "text-forensics",
            "model_used": "text:linguistic-burstiness-v1",
            "model_version": "1.0.0",
            "is_demo": True,
            "verdict": verdict,
            "risk_score": composite_score,
            "risk_level": risk_level,
            "confidence": 0.85,
            "ai_generated_probability": round(ai_prob, 2),
            "phishing_score": phishing_score,
            "factors": [
                {"signal": "ai_text_burstiness", "contribution_pct": 40, "score": int(ai_prob * 100)},
                {"signal": "phishing_pattern_rules", "contribution_pct": 60, "score": phishing_score},
            ],
            "signals": signals,
            "explanation": f"Text analysis assigned a risk score of {composite_score}/100 ({risk_level} risk level). AI generation probability: {int(ai_prob * 100)}%. Phishing risk: {phishing_score}/100.",
            "limitations": "Text risk metrics evaluate stylistic burstiness and heuristic regex patterns.",
            "heuristic_disclaimer": "Initial heuristic weights — not scientifically validated.",
        }
