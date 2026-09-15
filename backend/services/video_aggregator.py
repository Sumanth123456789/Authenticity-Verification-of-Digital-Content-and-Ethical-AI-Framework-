"""
AI-Content Verification Hub — Video Evidence Aggregator

Aggregates complementary multi-signal evidence across sampled video frames:
1. Sampled Frame AI Classifications & Physical Forensics
2. Frame-to-Frame Temporal Continuity Signals
3. Container Metadata & Audio Stream Attributes

Uses configurable risk weights from Settings:
- weight_video_frames (0.50)
- weight_temporal (0.30)
- weight_video_metadata (0.20)

Generates timeline markers and factor contribution breakdowns.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List
from config import get_settings


@dataclass
class AggregatedVideoResult:
    verdict: str  # "authentic" | "suspicious" | "manipulated"
    risk_score: int  # 0 to 100
    risk_level: str  # "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
    confidence: float  # 0.0 to 1.0
    factors: List[Dict[str, Any]] = field(default_factory=list)
    signals: List[Dict[str, Any]] = field(default_factory=list)
    timeline_markers: List[Dict[str, Any]] = field(default_factory=list)
    suspicious_frames_count: int = 0
    heuristic_disclaimer: str = "Initial heuristic weights — not scientifically validated."


class VideoEvidenceAggregator:
    """Aggregates frame signals, temporal metrics, and container attributes."""

    @staticmethod
    def aggregate(
        video_metadata: Dict[str, Any],
        frame_results: List[Dict[str, Any]],
        temporal_signal: Dict[str, Any],
    ) -> AggregatedVideoResult:
        settings = get_settings()

        w_frames = settings.weight_video_frames      # 0.50
        w_temporal = settings.weight_temporal        # 0.30
        w_meta = settings.weight_video_metadata      # 0.20

        # Build timeline markers & evaluate frame scores
        timeline_markers = []
        frame_scores = []
        suspicious_count = 0

        for idx, item in enumerate(frame_results, start=1):
            ts = item.get("timestamp", (idx - 1) * settings.video_sample_interval_sec)
            frame_score = item.get("risk_score", 10)
            frame_verdict = item.get("verdict", "authentic")

            if frame_score >= 50 or frame_verdict != "authentic":
                suspicious_count += 1

            frame_scores.append(frame_score)

            timeline_markers.append({
                "frame_number": idx,
                "timestamp": ts,
                "risk_score": frame_score,
                "verdict": frame_verdict,
                "top_label": item.get("predictions", [{}])[0].get("label", "frame_feature") if item.get("predictions") else "frame_feature",
                "explanation": item.get("explanation", ""),
            })

        avg_frame_risk = float(sum(frame_scores) / len(frame_scores)) if frame_scores else 10.0
        max_frame_risk = float(max(frame_scores)) if frame_scores else 10.0

        # Blend peak frame risk with mean frame risk (to capture localized deepfake frame splices)
        effective_frame_risk = (avg_frame_risk * 0.6) + (max_frame_risk * 0.4)

        # Temporal signal risk
        temp_sev = (temporal_signal.get("severity") or "info").lower()
        if temp_sev == "critical":
            temp_risk = 85
        elif temp_sev == "high":
            temp_risk = 70
        elif temp_sev == "moderate":
            temp_risk = 50
        elif temp_sev == "low":
            temp_risk = 25
        else:
            temp_risk = 10

        # Video metadata risk
        meta_risk = 10
        if not video_metadata.get("audio_present", True):
            meta_risk = 15  # Missing audio is common contextual info

        # Weighted composite risk score
        weighted_score = (
            (effective_frame_risk * w_frames) +
            (temp_risk * w_temporal) +
            (meta_risk * w_meta)
        )
        final_risk_score = max(0, min(100, int(round(weighted_score))))

        # Determine verdict & risk level
        if final_risk_score >= 75:
            risk_level = "CRITICAL"
            verdict = "manipulated"
        elif final_risk_score >= 50:
            risk_level = "HIGH"
            verdict = "suspicious"
        elif final_risk_score >= 25:
            risk_level = "MODERATE"
            verdict = "suspicious" if suspicious_count > 0 else "authentic"
        else:
            risk_level = "LOW"
            verdict = "authentic"

        # Factors breakdown
        total_w = w_frames + w_temporal + w_meta
        factors = [
            {"signal": "sampled_frame_analysis", "contribution_pct": int(round((w_frames / total_w) * 100)), "score": int(round(effective_frame_risk))},
            {"signal": "temporal_continuity", "contribution_pct": int(round((w_temporal / total_w) * 100)), "score": temp_risk},
            {"signal": "container_metadata", "contribution_pct": int(round((w_meta / total_w) * 100)), "score": meta_risk},
        ]

        # Consolidate signals list
        meta_signal = {
            "signal": "VIDEO_CONTAINER_METADATA",
            "value": {
                "duration_seconds": video_metadata.get("duration_seconds"),
                "resolution": video_metadata.get("resolution"),
                "fps": video_metadata.get("fps"),
                "video_codec": video_metadata.get("video_codec"),
                "audio_present": video_metadata.get("audio_present"),
                "audio_codec": video_metadata.get("audio_codec"),
            },
            "severity": "info",
            "confidence": 0.90,
            "description": f"Video stream analyzed ({video_metadata.get('resolution')}, {video_metadata.get('fps')} FPS, codec {video_metadata.get('video_codec')}). Audio present: {video_metadata.get('audio_present')}.",
            "limitations": "Container headers report nominal stream parameters.",
        }

        all_signals = [meta_signal, temporal_signal]

        return AggregatedVideoResult(
            verdict=verdict,
            risk_score=final_risk_score,
            risk_level=risk_level,
            confidence=0.85,
            factors=factors,
            signals=all_signals,
            timeline_markers=timeline_markers,
            suspicious_frames_count=suspicious_count,
        )
