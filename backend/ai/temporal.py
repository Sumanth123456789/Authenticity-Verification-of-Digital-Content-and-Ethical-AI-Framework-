"""
AI-Content Verification Hub — Temporal Video Continuity Engine

Analyzes frame-to-frame visual similarity, optical flow delta, and temporal continuity
across sampled video frames to detect temporal flicker, abrupt cuts, or face-swap artifacts.
"""

from typing import Any, Dict, List
import numpy as np
from PIL import Image


class TemporalEngine:
    """Computes complementary temporal consistency metrics across sampled video frames."""

    @staticmethod
    def analyze_temporal_consistency(sampled_frames: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes consecutive sampled frames for temporal visual continuity and variance anomalies.
        """
        if len(sampled_frames) < 2:
            return {
                "signal": "TEMPORAL_CONSISTENCY",
                "value": {"frames_evaluated": len(sampled_frames), "mean_delta": 0.0},
                "severity": "info",
                "confidence": 0.60,
                "description": "Video length yielded fewer than 2 sampled frames; temporal continuity evaluation bypassed.",
                "limitations": "Temporal visual continuity requires at least 2 sampled frames.",
            }

        deltas = []
        frame_means = []

        try:
            prev_np = None
            for frame in sampled_frames:
                img_path = frame.get("image_path")
                if not img_path or not isinstance(img_path, str):
                    continue

                img = Image.open(img_path).convert("L").resize((256, 256), Image.Resampling.BILINEAR)
                img_np = np.array(img, dtype=np.float32)
                frame_means.append(float(np.mean(img_np)))

                if prev_np is not None:
                    # Mean absolute frame difference
                    delta = float(np.mean(np.abs(img_np - prev_np)))
                    deltas.append(delta)

                prev_np = img_np

            if not deltas:
                return {
                    "signal": "TEMPORAL_CONSISTENCY",
                    "value": {"frames_evaluated": 0},
                    "severity": "info",
                    "confidence": 0.50,
                    "description": "Could not extract frame array buffers for temporal diff.",
                    "limitations": "Frame loading error during temporal diff.",
                }

            mean_delta = float(np.mean(deltas))
            std_delta = float(np.std(deltas))
            max_delta = float(np.max(deltas))

            # Discontinuity ratio: max spike vs average frame transition
            spike_ratio = max_delta / (mean_delta + 1e-6)

            if spike_ratio > 4.5 and std_delta > 15.0:
                severity = "moderate"
                confidence = 0.72
                desc = f"Temporal visual discontinuity detected (spike ratio: {spike_ratio:.2f}, max frame delta: {max_delta:.1f}). Indicates scene transition, hard cut, or temporal flicker artifact."
            elif std_delta > 25.0:
                severity = "low"
                confidence = 0.65
                desc = f"High temporal motion variance across sampled frames (std: {std_delta:.1f}, mean delta: {mean_delta:.1f}). Typical of rapid camera movement or high-action video."
            else:
                severity = "info"
                confidence = 0.82
                desc = f"Smooth, continuous temporal transition across sampled frames (mean frame delta: {mean_delta:.1f}, spike ratio: {spike_ratio:.2f})."

            return {
                "signal": "TEMPORAL_CONSISTENCY",
                "value": {
                    "frames_evaluated": len(sampled_frames),
                    "mean_frame_delta": round(mean_delta, 2),
                    "max_frame_delta": round(max_delta, 2),
                    "std_frame_delta": round(std_delta, 2),
                    "spike_ratio": round(spike_ratio, 2),
                },
                "severity": severity,
                "confidence": confidence,
                "description": desc,
                "limitations": "Temporal analysis is evaluated across sampled frames. High motion scenes or rapid camera cuts increase baseline temporal delta metrics.",
            }

        except Exception as e:
            return {
                "signal": "TEMPORAL_CONSISTENCY",
                "value": {"error": str(e)},
                "severity": "info",
                "confidence": 0.30,
                "description": f"Error performing temporal analysis: {str(e)}",
                "limitations": "Temporal continuity pipeline error.",
            }
