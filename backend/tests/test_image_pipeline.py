"""
AI-Content Verification Hub — Image Pipeline Pytest Suite

Tests multi-signal image verification, security validations (magic-bytes, file size limit),
conservative EXIF interpretation, forensic analyzers, evidence aggregation, and explainability.
"""

import os
import io
import pytest
from PIL import Image
from fastapi import HTTPException

from config import get_settings
from ai.forensics import ForensicEngine
from services.image_metadata import ImageMetadataService
from services.evidence_aggregator import ImageEvidenceAggregator, AggregatedEvidenceResult
from services.explainability import ExplanationEngine
from routers.verify import validate_file_security


def create_dummy_jpeg() -> bytes:
    """Helper to generate valid JPEG byte stream."""
    img = Image.new("RGB", (100, 100), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def test_security_validations():
    settings = get_settings()
    jpeg_bytes = create_dummy_jpeg()

    # Valid image security check
    validate_file_security(jpeg_bytes, "test.jpg", asset_type="image", settings=settings)

    # Invalid magic bytes check (raises HTTP 415)
    invalid_bytes = b"NOT_AN_IMAGE_HEADER_123456789"
    with pytest.raises(HTTPException) as exc_info:
        validate_file_security(invalid_bytes, "test.jpg", asset_type="image", settings=settings)
    assert exc_info.value.status_code == 415

    # Oversized file check (raises HTTP 413)
    tiny_max_bytes = 10
    with pytest.raises(HTTPException) as exc_info:
        validate_file_security(jpeg_bytes, "test.jpg", asset_type="image", settings=type("S", (), {"max_upload_size_bytes": tiny_max_bytes})())
    assert exc_info.value.status_code == 413


def test_forensic_analyzers(tmp_path):
    test_img_path = str(tmp_path / "sample.jpg")
    with open(test_img_path, "wb") as f:
        f.write(create_dummy_jpeg())

    # ELA Analysis
    ela = ForensicEngine.analyze_ela(test_img_path)
    assert ela["signal"] == "ERROR_LEVEL_ANALYSIS"
    assert "mean_error" in ela["value"]
    assert ela["severity"] in ("info", "low", "moderate", "high")
    assert "limitations" in ela

    # Noise Analysis
    noise = ForensicEngine.analyze_noise(test_img_path)
    assert noise["signal"] == "NOISE_VARIANCE"
    assert "global_noise_std" in noise["value"]
    assert noise["severity"] in ("info", "low", "moderate", "high")

    # 2D FFT Analysis
    fft = ForensicEngine.analyze_fft(test_img_path)
    assert fft["signal"] == "FFT_SPECTRAL_ANALYSIS"
    assert "high_freq_ratio" in fft["value"]

    # JPEG Quantization Analysis
    jpeg_q = ForensicEngine.analyze_jpeg_quantization(test_img_path)
    assert jpeg_q["signal"] == "JPEG_QUANTIZATION"
    assert jpeg_q["value"]["format"] == "JPEG"


def test_conservative_exif_interpretation():
    # Missing EXIF case
    meta_no_exif = {"exif": {}}
    sig_no_exif = ImageMetadataService.extract_exif_signal(meta_no_exif)
    assert sig_no_exif["severity"] == "info"
    assert "No camera EXIF" in sig_no_exif["description"]

    # Photoshop software tag case (must return conservative severity 'info')
    meta_photoshop = {"exif": {"Software": "Adobe Photoshop 2024"}}
    sig_photoshop = ImageMetadataService.extract_exif_signal(meta_photoshop)
    assert sig_photoshop["severity"] == "info"
    assert "Standard post-processing tools" in sig_photoshop["description"]


def test_evidence_aggregator():
    ai_sig = {
        "signal": "AI_MODEL_CLASSIFICATION",
        "value": {"risk_score": 15},
        "severity": "info",
        "confidence": 0.88,
    }
    forensics = [
        {"signal": "ERROR_LEVEL_ANALYSIS", "severity": "info", "confidence": 0.8},
        {"signal": "NOISE_VARIANCE", "severity": "info", "confidence": 0.85},
        {"signal": "FFT_SPECTRAL_ANALYSIS", "severity": "info", "confidence": 0.8},
    ]
    meta = {"signal": "EXIF_METADATA", "severity": "info", "confidence": 0.7}

    res = ImageEvidenceAggregator.aggregate(ai_sig, forensics, meta)

    assert res.verdict == "authentic"
    assert res.risk_level == "LOW"
    assert res.heuristic_disclaimer == "Initial heuristic weights — not scientifically validated."
    assert len(res.factors) == 5
    assert res.factors[0]["contribution_pct"] == 40  # AI Model weight 40%


def test_explainability_engine():
    res = AggregatedEvidenceResult(
        verdict="authentic",
        risk_score=14,
        risk_level="LOW",
        confidence=0.85,
        signals=[],
    )
    xai = ExplanationEngine.generate_explanation(res, {})
    assert "low-risk score of 14/100" in xai["explanation"]
    assert "Aggregated risk score is a heuristic assessment" in xai["limitations"]
