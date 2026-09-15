"""
AI-Content Verification Hub — Base AI Provider Abstraction

Defines the contract for all AI detection providers (Demo, HuggingFace, Local).
Ensures every model output contains auditable provenance:
provider, model, model_version, is_demo, confidence, signals, and limitations.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class AIAnalysisResult:
    provider: str
    model: str
    model_version: str
    is_demo: bool
    verdict: str  # "authentic" | "suspicious" | "manipulated"
    risk_score: int  # 0 to 100
    confidence: float  # 0.0 to 1.0
    signals: List[Dict[str, Any]] = field(default_factory=list)
    explanation: str = ""
    limitations: Optional[str] = None


class BaseAIProvider(ABC):
    """Abstract base class for all AI Content Verification providers."""

    name: str = "base"

    @abstractmethod
    async def analyze_image(self, image_path: str) -> AIAnalysisResult:
        """Analyze an image file and return structured AI analysis results."""
        raise NotImplementedError
