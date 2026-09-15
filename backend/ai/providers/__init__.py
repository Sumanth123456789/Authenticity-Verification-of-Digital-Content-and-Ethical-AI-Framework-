"""
AI-Content Verification Hub — Providers Module Package
"""

from .base import BaseAIProvider, AIAnalysisResult
from .demo_provider import DemoProvider
from .huggingface_provider import HuggingFaceProvider


def get_ai_provider(provider_name: str = "demo", settings=None) -> BaseAIProvider:
    """
    Factory function to instantiate the requested AI provider.
    Defaults to DemoProvider if requested or if requirements are missing.
    """
    provider_key = (provider_name or "demo").lower().strip()

    if provider_key in ("huggingface", "hf"):
        token = getattr(settings, "huggingface_api_token", "") if settings else ""
        return HuggingFaceProvider(api_token=token)

    return DemoProvider()


__all__ = [
    "BaseAIProvider",
    "AIAnalysisResult",
    "DemoProvider",
    "HuggingFaceProvider",
    "get_ai_provider",
]
