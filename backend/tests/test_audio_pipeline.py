"""
AI-Content Verification Hub — Audio Pipeline Pytest Suite

Tests audio security validation (magic bytes, 100MB limit), audio metadata probing,
PCM WAV decoding, acoustic signal extraction (spectral flux, pitch micro-tremors, noise floor),
speech transcription, synthetic voice probability calculation, and evidence aggregation.
"""

import os
import wave
import struct
import pytest

from config import get_settings
from ai.audio_processor import AudioProcessor
from ai.audio_forensics import AudioForensicEngine
from ai.transcription import TranscriptionEngine
from services.audio_aggregator import AudioEvidenceAggregator
from routers.verify import validate_file_security


def create_synthetic_wav(path: str, duration_sec: int = 2) -> str:
    """Helper to generate a synthetic WAV audio file for testing."""
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        for i in range(16000 * duration_sec):
            val = int(32767 * 0.3 * math_sin(i))
            wf.writeframes(struct.pack("<h", val))
    return path


def math_sin(i: int) -> float:
    import math
    return math.sin(2 * math.pi * 440 * i / 16000)


def test_audio_security_validations():
    settings = get_settings()

    # Valid WAV container magic header ("RIFF")
    wav_bytes = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00"
    validate_file_security(wav_bytes, "test.wav", asset_type="audio", settings=settings)

    # Oversized audio file check (raises HTTP 413)
    tiny_max_bytes = 10
    with pytest.raises(Exception) as exc_info:
        validate_file_security(wav_bytes, "test.wav", asset_type="audio", settings=type("S", (), {"max_audio_upload_size_bytes": tiny_max_bytes})())
    assert exc_info.value.status_code == 413


def test_audio_processor(tmp_path):
    wav_path = str(tmp_path / "test.wav")
    create_synthetic_wav(wav_path, duration_sec=2)

    assert os.path.exists(wav_path)

    # Test Metadata Probe
    meta = AudioProcessor.get_audio_metadata(wav_path)
    assert meta["duration_seconds"] >= 1.5
    assert meta["sample_rate_hz"] == 16000
    assert meta["channels"] == 1

    # Test PCM Conversion
    out_wav = str(tmp_path / "converted.wav")
    AudioProcessor.convert_to_pcm_wav(wav_path, out_wav)
    assert os.path.exists(out_wav)
    assert os.path.getsize(out_wav) > 0


def test_audio_forensics(tmp_path):
    wav_path = str(tmp_path / "test.wav")
    create_synthetic_wav(wav_path, duration_sec=2)

    # Spectral Flux Analysis
    flux = AudioForensicEngine.analyze_spectral_flux(wav_path)
    assert flux["signal"] == "SPECTRAL_FLUX_ANALYSIS"
    assert "mean_spectral_flux" in flux["value"]
    assert "limitations" in flux

    # Pitch Contour Analysis
    pitch = AudioForensicEngine.analyze_pitch_contour(wav_path)
    assert pitch["signal"] == "PITCH_CONTOUR_ANALYSIS"
    assert "mean_pitch_f0_hz" in pitch["value"]

    # Background Noise Floor
    noise = AudioForensicEngine.analyze_background_noise_floor(wav_path)
    assert noise["signal"] == "BACKGROUND_NOISE_FLOOR"
    assert "silence_ratio" in noise["value"]


def test_transcription_engine(tmp_path):
    wav_path = str(tmp_path / "test.wav")
    create_synthetic_wav(wav_path, duration_sec=2)

    res = TranscriptionEngine.transcribe_audio(wav_path)
    assert "full_text" in res
    assert "language" in res
    assert "segments" in res


def test_audio_evidence_aggregator():
    audio_meta = {
        "duration_seconds": 5.0,
        "sample_rate_hz": 16000,
        "channels": 1,
        "audio_codec": "pcm_s16le",
        "bitrate": "256 kbps",
    }
    signals = [
        {"signal": "SPECTRAL_FLUX_ANALYSIS", "severity": "info", "confidence": 0.8},
        {"signal": "PITCH_CONTOUR_ANALYSIS", "severity": "info", "confidence": 0.85},
        {"signal": "BACKGROUND_NOISE_FLOOR", "severity": "info", "confidence": 0.8},
    ]
    transcription = {"full_text": "Test speech", "segments": []}

    res = AudioEvidenceAggregator.aggregate(audio_meta, signals, transcription)

    assert res.verdict == "authentic"
    assert res.risk_level == "LOW"
    assert res.synthetic_voice_probability <= 0.40
    assert len(res.factors) == 3
    assert res.factors[0]["contribution_pct"] == 35  # weight_spectral_flux 35%
