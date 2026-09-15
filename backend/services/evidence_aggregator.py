"""
AI-Content Verification Hub — Image Evidence Aggregator

Aggregates 6 complementary analysis signals:
1. AI Model Prediction (Semantic / Synthetic Classifier)
2. Error Level Analysis (ELA)
3. Spatial Noise Variance
4. 2D FFT Frequency Spectral Artifacts
5. JPEG Quantization Matrix Analysis
6. EXIF & Header Provenance Metadata

Uses configurable weights from Settings (with clear note: "Initial heuristic weights — not scientifically validated.").
Computes aggregated risk score, risk level, confidence, and signal factor contribution breakdown.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List
from config import get_settings


@dataclass
class AggregatedEvidenceResult:
    verdict: str  # "authentic" | "suspicious" | "manipulated"
    risk_score: int  # 0 to 100
    risk_level: str  # "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
    confidence: float  # 0.0 to 1.0
    factors: List[Dict[str, Any]] = field(default_factory=list)
    signals: List[Dict[str, Any]] = field(default_factory=list)
    heuristic_disclaimer: str = "Initial heuristic weights — not scientifically validated."


class ImageEvidenceAggregator:
    """Aggregates complementary forensic & AI signals using configurable weights."""

    @staticmethod
    def aggregate(
        ai_signal: Dict[str, Any],
        forensic_signals: List[Dict[str, Any]],
        metadata_signal: Dict[str, Any],
    ) -> AggregatedEvidenceResult:
        settings = get_settings()

        # Configurable weights from settings
        w_ai = settings.weight_ai_model       # 0.40
        w_ela = settings.weight_ela           # 0.20
        w_noise = settings.weight_noise       # 0.15
        w_fft = settings.weight_fft           # 0.15
        w_exif = settings.weight_exif         # 0.10

        all_signals = [ai_signal] + forensic_signals + [metadata_signal]

        # Extract risk score components (0 to 100)
        ai_risk = ai_signal.get("value", {}).get("risk_score", 10)
        
        # Forensic signal severity scores
        def severity_to_score(sev: str) -> int:
            s = (sev or "info").lower()
            if s == "critical":
                return 90
            if s == "high":
                return 75
            if s == "moderate":
                return 50
            if s == "low":
                return 25
            return 10

        ela_sig = next((s for s in forensic_signals if s.get("signal") == "ERROR_LEVEL_ANALYSIS"), {})
        noise_sig = next((s for s in forensic_signals if s.get("signal") == "NOISE_VARIANCE"), {})
        fft_sig = next((s for s in forensic_signals if s.get("signal") == "FFT_SPECTRAL_ANALYSIS"), {})
        jpeg_sig = next((s for s in forensic_signals if s.get("signal") == "JPEG_QUANTIZATION"), {})

        ela_risk = severity_to_score(ela_sig.get("severity", "info"))
        noise_risk = severity_to_score(noise_sig.get("severity", "info"))
        fft_risk = severity_to_score(fft_sig.get("severity", "info"))
        exif_risk = severity_to_score(metadata_signal.get("severity", "info"))

        # Calculate weighted composite risk score
        weighted_score = (
            (ai_risk * w_ai) +
            (ela_risk * w_ela) +
            (noise_risk * w_noise) +
            (fft_risk * w_fft) +
            (exif_risk * w_exif)
        )
        final_risk_score = max(0, min(100, int(round(weighted_score))))

        # Determine risk level
        if final_risk_score >= 75:
            risk_level = "CRITICAL"
            verdict = "manipulated"
        elif final_risk_score >= 50:
            risk_level = "HIGH"
            verdict = "suspicious"
        elif final_risk_score >= 25:
            risk_level = "MODERATE"
            verdict = "suspicious" if ai_risk > 50 else "authentic"
        else:
            risk_level = "LOW"
            verdict = "authentic"

        # Calculate factor contributions
        total_w = w_ai + w_ela + w_noise + w_fft + w_exif
        factors = [
            {"signal": "ai_model_classifier", "contribution_pct": int(round((w_ai / total_w) * 100)), "score": ai_risk},
            {"signal": "error_level_analysis", "contribution_pct": int(round((w_ela / total_w) * 100)), "score": ela_risk},
            {"signal": "noise_variance", "contribution_pct": int(round((w_noise / total_w) * 100)), "score": noise_risk},
            {"signal": "fft_spectral_analysis", "contribution_pct": int(round((w_fft / total_w) * 100)), "score": fft_risk},
            {"signal": "exif_metadata", "contribution_pct": int(round((w_exif / total_w) * 100)), "score": exif_risk},
        ]

        # Calculate average confidence
        confidences = [s.get("confidence", 0.8) for s in all_signals if s.get("confidence") is not None]
        avg_confidence = round(float(sum(confidences) / len(confidences)), 4) if confidences else 0.85

        return AggregatedEvidenceResult(
            verdict=verdict,
            risk_score=final_risk_score,
            risk_level=risk_level,
            confidence=avg_confidence,
            factors=factors,
            signals=all_signals,
        )
