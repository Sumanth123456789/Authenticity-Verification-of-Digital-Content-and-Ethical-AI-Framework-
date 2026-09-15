"""
AI-Content Verification Hub — Explainability (XAI) Engine

Generates concise, evidence-backed, non-dogmatic natural language explanations
and transparent limitation notes for image verification results.
"""

from typing import Any, Dict, List
from services.evidence_aggregator import AggregatedEvidenceResult


class ExplanationEngine:
    """Generates non-dogmatic explanations and limitation disclosures."""

    @staticmethod
    def generate_explanation(aggregated: AggregatedEvidenceResult, metadata: Dict[str, Any]) -> Dict[str, Any]:
        risk_score = aggregated.risk_score
        risk_level = aggregated.risk_level
        verdict = aggregated.verdict

        # Collect non-info signals
        elevated_signals = [
            s for s in aggregated.signals
            if s.get("severity") in ("moderate", "high", "critical")
        ]

        if elevated_signals:
            signal_names = ", ".join([s.get("signal", "unknown") for s in elevated_signals])
            explanation = (
                f"The media received an aggregated risk score of {risk_score}/100 ({risk_level} risk level) "
                f"due to elevated indicators observed in: {signal_names}. "
                "These indicators reflect multi-signal heuristic features. No single signal constitutes definitive forensic proof."
            )
        else:
            explanation = (
                f"The media received a low-risk score of {risk_score}/100 ({risk_level} risk level). "
                "Analysis of physical compression artifacts, frequency spectrum, spatial noise variance, and metadata "
                "revealed normal, consistent digital characteristics."
            )

        limitations = (
            "Aggregated risk score is a heuristic assessment derived from complementary signals, "
            "not a scientifically proven probability of AI generation or manipulation. "
            "Authentic images edited in standard software (e.g. cropped or re-saved in Photoshop) or images stripped of EXIF tags "
            "by social media platforms may display localized compression signals. "
            "Always evaluate forensic evidence alongside external provenance and context."
        )

        return {
            "explanation": explanation,
            "limitations": limitations,
        }
