"""
AI-Content Verification Hub - Call Recording AI Detection Module
Delegates call analysis to CallRecordingAnalyzerService.
"""

from services.call_analyzer_service import call_analyzer_service


def analyze_call(audio_path: str) -> dict:
    """Analyze call recording for scam patterns, voice cloning, and social engineering."""
    return call_analyzer_service.analyze_audio_file(audio_path)