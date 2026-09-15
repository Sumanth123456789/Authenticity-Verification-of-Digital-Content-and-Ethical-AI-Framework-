"""
AI-Content Verification Hub — Speech-to-Text Transcription Engine

Provides speech transcription using faster-whisper / Whisper models
with automatic fallback to simulated transcription for demo / offline mode.
Extracts full text, language detected, and timestamped speech segments.
"""

import logging
from typing import Any, Dict, List
from config import get_settings

logger = logging.getLogger("aicvhub.ai.transcription")


class TranscriptionEngine:
    """Speech-to-text transcription engine for audio streams."""

    @staticmethod
    def transcribe_audio(wav_path: str) -> Dict[str, Any]:
        """
        Transcribes a 16kHz mono WAV file into text, language, and timestamped segments.
        """
        settings = get_settings()

        # Try loading faster-whisper if available
        try:
            from faster_whisper import WhisperModel

            logger.info(f"Loading faster-whisper model ({settings.whisper_model_size})...")
            model = WhisperModel(settings.whisper_model_size, device=settings.inference_device, compute_type="int8")

            segments_raw, info = model.transcribe(wav_path, beam_size=5)
            language = info.language
            language_probability = round(float(info.language_probability), 2)

            segments = []
            full_text_parts = []

            for seg in segments_raw:
                t_start = round(float(seg.start), 2)
                t_end = round(float(seg.end), 2)
                text_clean = seg.text.strip()

                full_text_parts.append(text_clean)
                segments.append({
                    "start": t_start,
                    "end": t_end,
                    "text": text_clean,
                })

            full_text = " ".join(full_text_parts)

            return {
                "engine": "faster-whisper",
                "model_size": settings.whisper_model_size,
                "is_demo": False,
                "full_text": full_text or "No speech detected in audio stream.",
                "language": language or "en",
                "language_probability": language_probability,
                "segments": segments,
            }

        except Exception as e:
            logger.info(f"faster-whisper unavailable or errored ({e}). Returning fallback transcription.")

            # Fallback simulated transcription tagged with is_demo: True
            return {
                "engine": "whisper-fallback",
                "model_size": "demo-small",
                "is_demo": True,
                "full_text": "Sample speech stream verification transcript. Forensic acoustic signals analyzed across speech spectrum.",
                "language": "en",
                "language_probability": 0.95,
                "segments": [
                    {"start": 0.0, "end": 2.5, "text": "Sample speech stream verification transcript."},
                    {"start": 2.5, "end": 5.0, "text": "Forensic acoustic signals analyzed across speech spectrum."},
                ],
            }
