"""
AI-Content Verification Hub — Fact Check Provider Factory
"""

from ai.fact_check.base_provider import BaseFactCheckProvider
from ai.fact_check.demo_provider import DemoFactCheckProvider
from ai.fact_check.google_provider import GoogleFactCheckProvider
from config import get_settings


class FactCheckProviderFactory:
    """Factory resolving the active FactCheck provider."""

    @staticmethod
    def get_provider() -> BaseFactCheckProvider:
        settings = get_settings()

        if settings.has_fact_check and settings.fact_check_provider == "google":
            return GoogleFactCheckProvider(api_key=settings.google_fact_check_api_key)

        return DemoFactCheckProvider()
