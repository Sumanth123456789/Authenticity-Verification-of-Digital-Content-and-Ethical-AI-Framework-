"""
AI-Content Verification Hub — Demo AI Provider

Provides explicit, simulated analysis results tagged with is_demo: True.
Used when local models or API tokens are unavailable or during initial testing.
"""

import os
from .base import BaseAIProvider, AIAnalysisResult


class DemoProvider(BaseAIProvider):
    name = "demo"

    def __init__(self, model_name: str = "demo-vit-classifier", version: str = "1.0.0-demo"):
        self.model_name = model_name
        self.version = version

    async def analyze_image(self, image_path: str) -> AIAnalysisResult:
        file_name = os.path.basename(image_path)
        demo_score = (len(file_name) * 7) % 25  # Low baseline score for clean images

        return AIAnalysisResult(
            provider="demo",
            model=self.model_name,
            model_version=self.version,
            is_demo=True,
            verdict="authentic",
            risk_score=demo_score,
            confidence=0.88,
            signals=[
                {"label": "simulated_natural_features", "score": 0.88},
                {"label": "demo_synthetic_artifact", "score": 0.12},
            ],
            explanation=(
                "[DEMO MODE] Image analyzed using baseline DemoProvider. "
                "For production inference, configure a valid HuggingFace API key or local model weights."
            ),
            limitations="Simulated detection pipeline. Results must not be treated as real AI forensic proof.",
        )
