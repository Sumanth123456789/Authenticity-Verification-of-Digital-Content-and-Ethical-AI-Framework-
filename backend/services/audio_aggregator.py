"""
AI-Content Verification Hub — Audio & Synthetic Voice Evidence Aggregator

Aggregates 3 complementary acoustic forensic signals:
1. STFT Spectral Flux & Centroid Variance
2. Pitch Micro-tremor & F0 Contour Jitter/Shimmer
3. Background Noise Floor & Inter-Word Gating

Computes synthetic_voice_probability (0.0 to 1.0), composite risk score (0 to 100),
risk level (LOW, MODERATE, HIGH, CRITICAL), and factor contribution breakdown.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List
from config import get_settings


@dataclass
class AggregatedAudioResult:
    verdict: str  # "authentic" | "suspicious" | "manipulated"
    risk_score: int  # 0 to 100
    risk_level: str  # "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
    confidence: float  # 0.0 to 1.0
    synthetic_voice_probability: float  # 0.0 to 1.0
    factors: List[Dict[str, Any]] = field(default_factory=list)
    signals: List[Dict[str, Any]] = field(default_factory=list)
    transcription: Dict[str, Any] = field(default_factory=dict)
    heuristic_disclaimer: str = "Initial heuristic weights — not scientifically validated."


class AudioEvidenceAggregator:
    """Aggregates acoustic signals, synthetic voice probabilities, and transcriptions."""

    @staticmethod
    def aggregate(
        audio_metadata: Dict[str, Any],
        acoustic_signals: List[Dict[str, Any]],
        transcription: Dict[str, Any],
    ) -> AggregatedAudioResult:
        settings = get_settings()

        w_flux = settings.weight_spectral_flux        # 0.35
        w_pitch = settings.weight_pitch_contour        # 0.35
        w_noise = settings.weight_noise_floor          # 0.30

        def severity_to_score(sev: str) -> int:
            s = (sev or "info").lower()
            if s == "critical":
                return 85
            if s == "high":
                return 70
            if s == "moderate":
                return 50
            if s == "low":
                return 25
            return 10

        flux_sig = next((s for s in acoustic_signals if s.get("signal") == "SPECTRAL_FLUX_ANALYSIS"), {})
        pitch_sig = next((s for s in acoustic_signals if s.get("signal") == "PITCH_CONTOUR_ANALYSIS"), {})
        noise_sig = next((s for s in acoustic_signals if s.get("signal") == "BACKGROUND_NOISE_FLOOR"), {})

        flux_risk = severity_to_score(flux_sig.get("severity", "info"))
        pitch_risk = severity_to_score(pitch_sig.get("severity", "info"))
        noise_risk = severity_to_score(noise_sig.get("severity", "info"))

        # Composite risk score
        weighted_score = (
            (flux_risk * w_flux) +
            (pitch_risk * w_pitch) +
            (noise_risk * w_noise)
        )
        final_risk_score = max(0, min(100, int(round(weighted_score))))

        # Synthetic voice probability estimation (0.0 to 1.0)
        synthetic_voice_prob = round(float(final_risk_score / 100.0), 2)

        # Verdict & Risk Level
        if final_risk_score >= 75:
            risk_level = "CRITICAL"
            verdict = "manipulated"
        elif final_risk_score >= 50:
            risk_level = "HIGH"
            verdict = "suspicious"
        elif final_risk_score >= 25:
            risk_level = "MODERATE"
            verdict = "suspicious"
        else:
            risk_level = "LOW"
            verdict = "authentic"

        total_w = w_flux + w_pitch + w_noise
        factors = [
            {"signal": "spectral_flux_analysis", "contribution_pct": int(round((w_flux / total_w) * 100)), "score": flux_risk},
            {"signal": "pitch_contour_micro_tremors", "contribution_pct": int(round((w_pitch / total_w) * 100)), "score": pitch_risk},
            {"signal": "background_noise_floor", "contribution_pct": int(round((w_noise / total_w) * 100)), "score": noise_risk},
        ]

        meta_signal = {
            "signal": "AUDIO_STREAM_METADATA",
            "value": {
                "duration_seconds": audio_metadata.get("duration_seconds"),
                "sample_rate_hz": audio_metadata.get("sample_rate_hz"),
                "channels": audio_metadata.get("channels"),
                "codec": audio_metadata.get("audio_codec"),
                "bitrate": audio_metadata.get("bitrate"),
            },
            "severity": "info",
            "confidence": 0.95,
            "description": f"Audio stream analyzed ({audio_metadata.get('sample_rate_hz')} Hz, {audio_metadata.get('channels')} ch, codec {audio_metadata.get('audio_codec')}).",
            "limitations": "Audio container headers report nominal stream parameters.",
        }

        all_signals = [meta_signal] + acoustic_signals

        return AggregatedAudioResult(
            verdict=verdict,
            risk_score=final_risk_score,
            risk_level=risk_level,
            confidence=0.85,
            synthetic_voice_probability=synthetic_voice_prob,
            factors=factors,
            signals=all_signals,
            transcription=transcription,
        )
