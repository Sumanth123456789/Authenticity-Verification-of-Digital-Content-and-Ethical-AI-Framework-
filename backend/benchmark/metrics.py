"""
AI-Content Verification Hub — Benchmark Metrics & Confusion Matrix Engine

Calculates standard classification performance metrics:
- Confusion Matrix (TP, TN, FP, FN)
- Accuracy, Precision, Recall, F1-Score
- False Positive Rate (FPR), False Negative Rate (FNR)
- Handles zero-sample states with explicit "NOT EVALUATED"
"""

from dataclasses import dataclass, asdict
from typing import Any, Dict, Union


@dataclass
class ConfusionMatrix:
    tp: int = 0  # True Positives (Actual Synthetic/Fake, Predicted Synthetic/Fake)
    tn: int = 0  # True Negatives (Actual Real/Legitimate, Predicted Real/Legitimate)
    fp: int = 0  # False Positives (Actual Real, Predicted Synthetic/Fake)
    fn: int = 0  # False Negatives (Actual Synthetic, Predicted Real)

    @property
    def total_samples(self) -> int:
        return self.tp + self.tn + self.fp + self.fn

    def to_dict(self) -> Dict[str, int]:
        return asdict(self)


def calculate_metrics(cm: ConfusionMatrix) -> Dict[str, Union[float, str, Dict[str, int]]]:
    """
    Computes classification metrics from a ConfusionMatrix.
    Returns "NOT EVALUATED" if sample count is 0.
    """
    total = cm.total_samples

    if total == 0:
        return {
            "status": "NOT EVALUATED",
            "total_samples": 0,
            "confusion_matrix": cm.to_dict(),
            "accuracy": "NOT EVALUATED",
            "precision": "NOT EVALUATED",
            "recall": "NOT EVALUATED",
            "f1_score": "NOT EVALUATED",
            "false_positive_rate": "NOT EVALUATED",
            "false_negative_rate": "NOT EVALUATED",
            "note": "Requires local dataset acquisition. No labeled samples found.",
        }

    # Accuracy = (TP + TN) / Total
    accuracy = (cm.tp + cm.tn) / total

    # Precision = TP / (TP + FP)
    precision = (cm.tp / (cm.tp + cm.fp)) if (cm.tp + cm.fp) > 0 else 0.0

    # Recall (Sensitivity / True Positive Rate) = TP / (TP + FN)
    recall = (cm.tp / (cm.tp + cm.fn)) if (cm.tp + cm.fn) > 0 else 0.0

    # F1-Score = 2 * (Precision * Recall) / (Precision + Recall)
    f1_score = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

    # False Positive Rate (FPR) = FP / (FP + TN)
    fpr = (cm.fp / (cm.fp + cm.tn)) if (cm.fp + cm.tn) > 0 else 0.0

    # False Negative Rate (FNR) = FN / (FN + TP)
    fnr = (cm.fn / (cm.fn + cm.tp)) if (cm.fn + cm.tp) > 0 else 0.0

    return {
        "status": "EVALUATED",
        "total_samples": total,
        "confusion_matrix": cm.to_dict(),
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1_score, 4),
        "false_positive_rate": round(fpr, 4),
        "false_negative_rate": round(fnr, 4),
        "note": f"Evaluated across {total} labeled dataset samples.",
    }
