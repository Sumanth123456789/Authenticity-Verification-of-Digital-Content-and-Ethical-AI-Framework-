"""
AI-Content Verification Hub — Video Verification & Deepfake Pipeline Coordinator

Coordinates video verification:
1. Container & stream metadata extraction via FFprobe
2. Configurable frame sampling
3. Per-frame multi-signal analysis (reusing Phase 3 image pipeline)
4. Temporal visual continuity analysis
5. Audio stream isolation for Phase 5 readiness
6. Evidence aggregation & XAI explanation generation
"""

import asyncio
import os
import shutil
import tempfile
from typing import Any, Dict

from ai.image_detector import verify_image_async
from ai.temporal import TemporalEngine
from ai.video_processor import VideoProcessor
from config import get_settings
from services.video_aggregator import VideoEvidenceAggregator
from services.video_explainability import VideoExplanationEngine


async def verify_video_async(video_path: str) -> Dict[str, Any]:
    """
    Asynchronously executes the video verification & deepfake analysis pipeline.
    """
    settings = get_settings()

    # 1. Extract container metadata
    video_meta = VideoProcessor.get_video_metadata(video_path)

    # Temporary directory for sampled frame images
    temp_frames_dir = tempfile.mkdtemp(prefix="aicv_frames_")
    audio_wav_path = os.path.join(temp_frames_dir, "isolated_audio.wav")

    try:
        # 2. Extract sampled frames (e.g. every 2.0s, max 15 frames)
        sampled_frames = VideoProcessor.extract_sampled_frames(
            video_path=video_path,
            output_dir=temp_frames_dir,
            interval_sec=settings.video_sample_interval_sec,
            max_frames=settings.video_max_frames,
        )

        # 3. Analyze each sampled frame using existing image pipeline
        frame_results = []
        for frame in sampled_frames:
            img_path = frame["image_path"]
            analysis = await verify_image_async(img_path)
            analysis["timestamp"] = frame["timestamp"]
            analysis["frame_number"] = frame["frame_number"]
            frame_results.append(analysis)

        # 4. Analyze temporal visual continuity across sampled frames
        temporal_signal = TemporalEngine.analyze_temporal_consistency(sampled_frames)

        # 5. Isolate audio track for Phase 5 preparation
        audio_info = VideoProcessor.extract_audio_track(video_path, audio_wav_path)
        video_meta["audio_present"] = audio_info.get("audio_present", False)
        video_meta["audio_codec"] = audio_info.get("codec")

        # 6. Aggregate Video Evidence
        aggregated = VideoEvidenceAggregator.aggregate(
            video_metadata=video_meta,
            frame_results=frame_results,
            temporal_signal=temporal_signal,
        )

        # 7. Generate Explainability Note
        xai = VideoExplanationEngine.generate_explanation(aggregated, video_meta)

        # Get primary model used from first frame analysis if available
        first_frame = frame_results[0] if frame_results else {}
        provider = first_frame.get("provider", "demo")
        model_used = first_frame.get("model_used", "demo-vit-classifier")
        model_version = first_frame.get("model_version", "1.0.0")
        is_demo = first_frame.get("is_demo", True)

        return {
            "provider": provider,
            "model_used": f"video:{model_used}",
            "model_version": model_version,
            "is_demo": is_demo,
            "verdict": aggregated.verdict,
            "risk_score": aggregated.risk_score,
            "risk_level": aggregated.risk_level,
            "confidence": aggregated.confidence,
            "factors": aggregated.factors,
            "signals": aggregated.signals,
            "timeline_markers": aggregated.timeline_markers,
            "frames_analyzed": len(sampled_frames),
            "suspicious_frames_count": aggregated.suspicious_frames_count,
            "metadata": video_meta,
            "audio_info": audio_info,
            "explanation": xai["explanation"],
            "limitations": xai["limitations"],
            "heuristic_disclaimer": aggregated.heuristic_disclaimer,
        }

    finally:
        # Clean up temporary frame folder
        if os.path.exists(temp_frames_dir):
            shutil.rmtree(temp_frames_dir, ignore_errors=True)


def verify_video(video_path: str) -> Dict[str, Any]:
    """Synchronous wrapper for verify_video_async."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(lambda: asyncio.run(verify_video_async(video_path))).result()
        return loop.run_until_complete(verify_video_async(video_path))
    except RuntimeError:
        return asyncio.run(verify_video_async(video_path))
