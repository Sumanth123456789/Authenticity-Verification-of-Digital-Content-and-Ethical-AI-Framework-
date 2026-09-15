"""
AI-Content Verification Hub — Video Pipeline Pytest Suite

Tests video security validation, FFprobe metadata parsing, FFmpeg frame sampling,
temporal continuity metrics, video evidence aggregation, and explainability.
"""

import os
import subprocess
import pytest
from PIL import Image

from config import get_settings
from ai.video_processor import VideoProcessor
from ai.temporal import TemporalEngine
from services.video_aggregator import VideoEvidenceAggregator
from services.video_explainability import VideoExplanationEngine
from routers.verify import validate_file_security


def create_synthetic_test_video(output_path: str, duration_sec: int = 4) -> str:
    """Generates a small synthetic MP4 video file using FFmpeg for pipeline testing."""
    ffmpeg_exe = VideoProcessor.get_ffmpeg_cmd()
    cmd = [
        ffmpeg_exe,
        "-y",
        "-f",
        "lavfi",
        "-i",
        f"testsrc=duration={duration_sec}:size=640x360:rate=30",
        "-f",
        "lavfi",
        "-i",
        f"sine=frequency=440:duration={duration_sec}",
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-pix_fmt",
        "yuv420p",
        output_path,
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return output_path


def test_video_security_validation():
    settings = get_settings()

    # Valid MP4 container magic header ("ftyp")
    mp4_bytes = b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom"
    validate_file_security(mp4_bytes, "test.mp4", asset_type="video", settings=settings)

    # Oversized video file check (raises HTTP 413)
    tiny_max_bytes = 10
    with pytest.raises(Exception) as exc_info:
        validate_file_security(mp4_bytes, "test.mp4", asset_type="video", settings=type("S", (), {"max_video_upload_size_bytes": tiny_max_bytes})())
    assert exc_info.value.status_code == 413


def test_video_processor(tmp_path):
    video_path = str(tmp_path / "synthetic.mp4")
    create_synthetic_test_video(video_path, duration_sec=4)

    assert os.path.exists(video_path)

    # Test Metadata Probe
    meta = VideoProcessor.get_video_metadata(video_path)
    assert meta["duration_seconds"] >= 3.0
    assert meta["width"] == 640
    assert meta["height"] == 360
    assert meta["audio_present"] is True

    # Test Frame Sampling
    frames_dir = str(tmp_path / "frames")
    sampled = VideoProcessor.extract_sampled_frames(
        video_path=video_path,
        output_dir=frames_dir,
        interval_sec=2.0,
        max_frames=5,
    )
    assert len(sampled) >= 2
    assert os.path.exists(sampled[0]["image_path"])

    # Test Audio Track Extraction
    audio_path = str(tmp_path / "isolated.wav")
    audio_info = VideoProcessor.extract_audio_track(video_path, audio_path)
    assert audio_info["audio_present"] is True
    assert os.path.exists(audio_path)


def test_temporal_engine(tmp_path):
    frames_dir = tmp_path / "temp_frames"
    frames_dir.mkdir()

    # Create dummy frame images
    f1_path = str(frames_dir / "f1.png")
    f2_path = str(frames_dir / "f2.png")

    Image.new("RGB", (100, 100), "red").save(f1_path)
    Image.new("RGB", (100, 100), "blue").save(f2_path)

    sampled_frames = [
        {"frame_number": 1, "timestamp": 0.0, "image_path": f1_path},
        {"frame_number": 2, "timestamp": 2.0, "image_path": f2_path},
    ]

    sig = TemporalEngine.analyze_temporal_consistency(sampled_frames)
    assert sig["signal"] == "TEMPORAL_CONSISTENCY"
    assert sig["value"]["frames_evaluated"] == 2
    assert "description" in sig
    assert "limitations" in sig


def test_video_evidence_aggregator():
    video_meta = {
        "duration_seconds": 10.0,
        "resolution": "1920x1080",
        "fps": 30.0,
        "video_codec": "h264",
        "audio_present": True,
        "audio_codec": "aac",
    }
    frame_results = [
        {"timestamp": 0.0, "risk_score": 10, "verdict": "authentic", "predictions": [{"label": "scene"}]},
        {"timestamp": 2.0, "risk_score": 15, "verdict": "authentic", "predictions": [{"label": "person"}]},
    ]
    temporal_sig = {
        "signal": "TEMPORAL_CONSISTENCY",
        "severity": "info",
        "confidence": 0.8,
        "description": "Smooth temporal motion.",
    }

    res = VideoEvidenceAggregator.aggregate(video_meta, frame_results, temporal_sig)

    assert res.verdict == "authentic"
    assert res.risk_level == "LOW"
    assert len(res.timeline_markers) == 2
    assert len(res.factors) == 3
    assert res.factors[0]["signal"] == "sampled_frame_analysis"
    assert res.factors[0]["contribution_pct"] == 50  # weight_video_frames 50%
