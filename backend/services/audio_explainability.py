"""
AI-Content Verification Hub — Audio Explainability (XAI) Engine

Generates concise, evidence-backed explanations and transparent limitation notes for audio verification records.
"""

from typing import Any, Dict
from services.audio_aggregator import AggregatedAudioResult


class AudioExplanationEngine:
    """Generates non-dogmatic explanations for audio verification results."""

    @staticmethod
    def generate_explanation(aggregated: AggregatedAudioResult, audio_metadata: Dict[str, Any]) -> Dict[str, Any]:
        risk_score = aggregated.risk_score
        risk_level = aggregated.risk_level
        synthetic_prob = aggregated.synthetic_voice_probability

        if risk_score >= 50:
            explanation = (
                f"The audio stream received an aggregated risk score of {risk_score}/100 ({risk_level} risk level) "
                f"with an estimated synthetic voice clone probability of {int(synthetic_prob * 100)}%. "
                "Analysis detected unnatural STFT spectral flux smoothing, pitch fundamental contour stability, or artificial noise floor gating."
            )
        else:
            explanation = (
                f"The audio stream received a low-risk score of {risk_score}/100 ({risk_level} risk level) "
                f"with low synthetic voice probability ({int(synthetic_prob * 100)}%). "
                "Acoustic evaluation across spectral centroid flux, pitch micro-tremors, and ambient room noise floor "
                "revealed normal, consistent human vocal tract characteristics."
            )

        limitations = (
            "Synthetic voice clone probability is a statistical acoustic signal estimation, not definitive proof of synthetic voice synthesis. "
            "Telephony codecs (GSM, AMR), heavy lossy MP3 compression, studio noise suppression plugins, or room echo "
            "can influence acoustic spectral flux and pitch contour metrics. Always cross-examine acoustic evidence with external context."
        )

        return {
            "explanation": explanation,
            "limitations": limitations,
        }
