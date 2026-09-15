"""
AI-Content Verification Hub — Video Explainability (XAI) Engine

Generates concise, evidence-backed explanations and transparent limitation notes for video analysis records.
"""

from typing import Any, Dict
from services.video_aggregator import AggregatedVideoResult


class VideoExplanationEngine:
    """Generates non-dogmatic explanations for video verification results."""

    @staticmethod
    def generate_explanation(aggregated: AggregatedVideoResult, video_metadata: Dict[str, Any]) -> Dict[str, Any]:
        risk_score = aggregated.risk_score
        risk_level = aggregated.risk_level
        suspicious_count = aggregated.suspicious_frames_count
        total_sampled = len(aggregated.timeline_markers)

        if suspicious_count > 0 or risk_score >= 50:
            explanation = (
                f"The video received an aggregated risk score of {risk_score}/100 ({risk_level} risk level). "
                f"Sampling analysis identified {suspicious_count} out of {total_sampled} frames with elevated forensic or AI classifier indicators. "
                "These signals represent multi-vector heuristic evidence across frame spatial features and temporal continuity."
            )
        else:
            explanation = (
                f"The video received a low-risk score of {risk_score}/100 ({risk_level} risk level). "
                f"Evaluation across {total_sampled} sampled frames (at {video_metadata.get('resolution', '1080p')}, {video_metadata.get('fps', 30)} FPS) "
                "revealed smooth, continuous temporal motion and consistent physical frame characteristics."
            )

        limitations = (
            "Video risk scores are aggregated heuristic assessments, not scientifically proven proof of deepfake manipulation or AI generation. "
            "Keyframe sampling analyzes representative time intervals rather than every individual video frame. "
            "Re-encoding, compression artifacting on social media platforms, or rapid camera cuts can influence temporal continuity metrics. "
            "Always cross-examine visual forensics with external context and source provenance."
        )

        return {
            "explanation": explanation,
            "limitations": limitations,
        }
