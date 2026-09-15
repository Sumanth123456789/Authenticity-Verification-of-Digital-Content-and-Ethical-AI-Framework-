"""
AI-Content Verification Hub — HuggingFace AI Provider

Uses HuggingFace pipelines / transformers for image classification and feature analysis.
Truthfully distinguishes generic ImageNet semantic classification models from dedicated AI detection models.
Never misrepresents generic object labels as synthetic AI probabilities.
"""

import asyncio
import logging
from typing import Optional
from PIL import Image

from .base import BaseAIProvider, AIAnalysisResult

logger = logging.getLogger("aicvhub.ai.huggingface")


class HuggingFaceProvider(BaseAIProvider):
    name = "huggingface"

    def __init__(self, model_name: str = "umm-maybe/AI-image-detector", api_token: Optional[str] = None):
        self.model_name = model_name
        self.api_token = api_token
        self.version = "transformers-4.47"
        self._classifier = None

    def _get_classifier(self):
        if self._classifier is None:
            from transformers import pipeline
            logger.info(f"Loading HuggingFace model: {self.model_name}")
            try:
                self._classifier = pipeline(
                    "image-classification",
                    model=self.model_name,
                )
            except Exception as e:
                logger.warning(f"Could not load primary model '{self.model_name}': {e}. Falling back to 'google/vit-base-patch16-224'.")
                self.model_name = "google/vit-base-patch16-224"
                self._classifier = pipeline(
                    "image-classification",
                    model=self.model_name,
                )
        return self._classifier

    async def analyze_image(self, image_path: str) -> AIAnalysisResult:
        try:
            loop = asyncio.get_running_loop()
            raw_predictions = await loop.run_in_executor(None, self._run_inference, image_path)

            signals = [
                {"label": pred.get("label", "unknown"), "score": round(float(pred.get("score", 0.0)), 4)}
                for pred in raw_predictions
            ]

            top_pred = signals[0] if signals else {"label": "unknown", "score": 0.5}
            confidence = float(top_pred["score"])
            top_label = top_pred["label"].lower()

            is_dedicated_detector = any(kw in self.model_name.lower() for kw in ["ai", "fake", "synthetic", "detector", "deepfake"])

            if is_dedicated_detector:
                is_ai_label = any(kw in top_label for kw in ["ai", "fake", "synthetic", "generated", "artificial"])
                if is_ai_label and confidence > 0.60:
                    verdict = "suspicious" if confidence < 0.85 else "manipulated"
                    risk_score = int(confidence * 100)
                    severity = "high" if confidence > 0.80 else "moderate"
                    desc = f"Dedicated AI image detector ({self.model_name}) identified synthetic generation features (label: '{top_pred['label']}', score: {confidence:.2f})."
                else:
                    verdict = "authentic"
                    risk_score = max(5, int((1.0 - confidence) * 20))
                    severity = "info"
                    desc = f"Dedicated AI detector ({self.model_name}) classified image as natural media (label: '{top_pred['label']}', score: {confidence:.2f})."
            else:
                # Generic ImageNet model (e.g. google/vit-base-patch16-224)
                # Truthfully report object semantic classification without claiming AI probability
                verdict = "authentic"
                risk_score = 10
                severity = "info"
                desc = f"Generic ImageNet model ({self.model_name}) extracted semantic features. Top object classification: '{top_pred['label']}' ({confidence * 100:.1f}% confidence)."

            return AIAnalysisResult(
                provider="huggingface",
                model=self.model_name,
                model_version=self.version,
                is_demo=False,
                verdict=verdict,
                risk_score=risk_score,
                confidence=round(confidence, 4),
                signals=signals,
                explanation=desc,
                limitations="Model outputs represent statistical pattern predictions. Generic object classifiers evaluate semantic content, not synthetic generative artifacts.",
            )

        except Exception as exc:
            logger.error(f"HuggingFace inference error: {exc}", exc_info=True)
            return AIAnalysisResult(
                provider="huggingface-fallback",
                model=self.model_name,
                model_version=self.version,
                is_demo=True,
                verdict="authentic",
                risk_score=15,
                confidence=0.5,
                signals=[{"label": "inference_fallback", "score": 0.5}],
                explanation=f"Inference error encountered: {str(exc)}. Fallback result returned.",
                limitations="Fallback mode triggered due to model loading issue.",
            )

    def _run_inference(self, image_path: str):
        classifier = self._get_classifier()
        image = Image.open(image_path).convert("RGB")
        return classifier(image)
