"""
AI-Content Verification Hub — Audio Verification & Voice Clone Pipeline Coordinator

Coordinates audio stream analysis:
1. Audio container & codec metadata extraction
2. PCM 16kHz mono WAV stream decoding
3. STFT spectral flux, pitch micro-tremor, and noise floor acoustic signal extraction
4. Speech-to-Text transcription & segment generation (Whisper / Fallback)
5. Synthetic voice probability calculation & multi-signal evidence aggregation
6. Explainability generation & clean temp resource release
"""

import asyncio
import os
import tempfile
from typing import Any, Dict

from ai.audio_forensics import AudioForensicEngine
from ai.audio_processor import AudioProcessor
from ai.transcription import TranscriptionEngine
from services.audio_aggregator import AudioEvidenceAggregator
from services.audio_explainability import AudioExplanationEngine


async def verify_audio_async(audio_path: str) -> Dict[str, Any]:
    """
    Asynchronously executes the audio verification & synthetic voice analysis pipeline.
    """
    # 1. Extract audio container metadata
    audio_meta = AudioProcessor.get_audio_metadata(audio_path)

    # Temporary PCM 16kHz WAV buffer
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_wav:
        temp_wav_path = temp_wav.name

    try:
        # 2. Decode audio stream to 16kHz PCM WAV
        AudioProcessor.convert_to_pcm_wav(audio_path, temp_wav_path)

        # 3. Acoustic Forensic Signal Extraction
        acoustic_signals = AudioForensicEngine.extract_all_audio_signals(temp_wav_path)

        # 4. Speech-to-Text Transcription (Whisper / Fallback)
        transcription = TranscriptionEngine.transcribe_audio(temp_wav_path)

        # 5. Multi-Signal Evidence Aggregation
        aggregated = AudioEvidenceAggregator.aggregate(
            audio_metadata=audio_meta,
            acoustic_signals=acoustic_signals,
            transcription=transcription,
        )

        # 6. Explanation Generation
        xai = AudioExplanationEngine.generate_explanation(aggregated, audio_meta)

        return {
            "provider": transcription.get("engine", "whisper"),
            "model_used": f"audio:{transcription.get('engine', 'whisper')}",
            "model_version": transcription.get("model_size", "small"),
            "is_demo": transcription.get("is_demo", False),
            "verdict": aggregated.verdict,
            "risk_score": aggregated.risk_score,
            "risk_level": aggregated.risk_level,
            "confidence": aggregated.confidence,
            "synthetic_voice_probability": aggregated.synthetic_voice_probability,
            "factors": aggregated.factors,
            "signals": aggregated.signals,
            "transcription": aggregated.transcription,
            "metadata": audio_meta,
            "explanation": xai["explanation"],
            "limitations": xai["limitations"],
            "heuristic_disclaimer": aggregated.heuristic_disclaimer,
        }

    finally:
        if os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)


def verify_audio(audio_path: str) -> Dict[str, Any]:
    """Synchronous wrapper for verify_audio_async."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(lambda: asyncio.run(verify_audio_async(audio_path))).result()
        return loop.run_until_complete(verify_audio_async(audio_path))
    except RuntimeError:
        return asyncio.run(verify_audio_async(audio_path))
