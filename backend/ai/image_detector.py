"""
AI-Content Verification Hub — Image AI & Multi-Signal Forensic Pipeline

Coordinates complementary analysis vectors:
1. AI Model Classifier Output (Semantic / Synthetic)
2. Error Level Analysis (ELA)
3. Spatial Noise Variance Analysis
4. 2D FFT Frequency-Domain Spectral Analysis
5. JPEG Quantization Table Analysis
6. EXIF & Metadata Provenance

Aggregates signals using configurable weights and generates non-dogmatic explainability notes.
"""

import asyncio
from typing import Any, Dict

from config import get_settings
from services.image_metadata import ImageMetadataService
from ai.forensics import ForensicEngine
from ai.providers import get_ai_provider, AIAnalysisResult
from services.evidence_aggregator import ImageEvidenceAggregator
from services.explainability import ExplanationEngine


async def verify_image_async(image_path: str) -> Dict[str, Any]:
    """
    Asynchronously run the multi-signal image verification pipeline.
    """
    settings = get_settings()

    # 1. AI Model Inference
    provider = get_ai_provider(settings.ai_provider, settings)
    ai_result: AIAnalysisResult = await provider.analyze_image(image_path)

    # Format AI model signal into standard 6-field schema
    ai_severity = "info"
    if ai_result.verdict == "manipulated":
        ai_severity = "high"
    elif ai_result.verdict == "suspicious":
        ai_severity = "moderate"

    ai_signal = {
        "signal": "AI_MODEL_CLASSIFICATION",
        "value": {
            "risk_score": ai_result.risk_score,
            "raw_predictions": ai_result.signals,
            "provider": ai_result.provider,
            "model": ai_result.model,
            "version": ai_result.model_version,
            "is_demo": ai_result.is_demo,
        },
        "severity": ai_severity,
        "confidence": ai_result.confidence,
        "description": ai_result.explanation,
        "limitations": ai_result.limitations or "Statistical classification prediction.",
    }

    # 2. Extract Physical & Mathematical Forensic Signals (ELA, Noise, FFT, JPEG Quantization)
    forensic_signals = ForensicEngine.extract_all_signals(image_path)

    # 3. Extract File & EXIF Provenance Metadata
    metadata = ImageMetadataService.get_metadata(image_path)
    metadata_signal = metadata.get("signal", {})

    # 4. Multi-Signal Evidence Aggregation using Configurable Weights
    aggregated = ImageEvidenceAggregator.aggregate(
        ai_signal=ai_signal,
        forensic_signals=forensic_signals,
        metadata_signal=metadata_signal,
    )

    # 5. Non-Dogmatic Explanation & Limitation Generation
    xai = ExplanationEngine.generate_explanation(aggregated, metadata)

    return {
        "provider": ai_result.provider,
        "model_used": ai_result.model,
        "model_version": ai_result.model_version,
        "is_demo": ai_result.is_demo,
        "verdict": aggregated.verdict,
        "risk_score": aggregated.risk_score,
        "risk_level": aggregated.risk_level,
        "confidence": aggregated.confidence,
        "factors": aggregated.factors,
        "signals": aggregated.signals,
        "metadata": metadata,
        "explanation": xai["explanation"],
        "limitations": xai["limitations"],
        "heuristic_disclaimer": aggregated.heuristic_disclaimer,
    }


def verify_image(image_path: str) -> Dict[str, Any]:
    """Synchronous wrapper for verify_image_async."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(lambda: asyncio.run(verify_image_async(image_path))).result()
        return loop.run_until_complete(verify_image_async(image_path))
    except RuntimeError:
        return asyncio.run(verify_image_async(image_path))


if __name__ == "__main__":
    import sys

    image_path = input("Enter image path: ").strip().strip('"') if len(sys.argv) < 2 else sys.argv[1]
    result = verify_image(image_path)

    print("\n========== AI & Multi-Signal Forensic Verification ==========\n")
    print(f"Provider           : {result['provider']} (Demo Mode: {result['is_demo']})")
    print(f"Model              : {result['model_used']} (v{result['model_version']})")
    print(f"Verdict            : {result['verdict']}")
    print(f"Risk Score         : {result['risk_score']} / 100 ({result['risk_level']})")
    print(f"Confidence         : {result['confidence']:.2f}")

    print("\n----- Risk Factor Contributions -----")
    for f in result["factors"]:
        print(f"{f['signal']} : {f['contribution_pct']}% contribution (Score: {f['score']})")

    print("\n----- Explanation -----")
    print(result["explanation"])

    print("\n----- Limitations -----")
    print(result["limitations"])