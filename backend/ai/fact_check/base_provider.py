"""
AI-Content Verification Hub — Fact Check Provider Abstract Interface
"""

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseFactCheckProvider(ABC):
    """Abstract base class for all fact-checking search providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g. 'google', 'demo')."""
        pass

    @property
    @abstractmethod
    def is_demo(self) -> bool:
        """True if the provider is a fallback/simulated provider, False if production API."""
        pass

    @abstractmethod
    async def search_claim(self, claim_text: str) -> Dict[str, Any]:
        """
        Searches external fact-checking databases for evidence regarding a claim statement.

        Returns:
            Dict containing:
                - provider: str
                - is_demo: bool
                - query_claim: str
                - sources: List[Dict[str, Any]] (publisher, url, title, review_date, textual_rating)
                - status: "success" | "unverified" | "error"
                - error_message: Optional[str]
        """
        pass
