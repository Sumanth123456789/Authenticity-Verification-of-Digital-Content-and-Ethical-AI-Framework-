"""
AI-Content Verification Hub — Phase 8C Benchmark Framework Pytest Suite

Tests:
1. ConfusionMatrix calculation & metric mathematical accuracy
2. Zero-sample state handling ("NOT EVALUATED")
3. DatasetAdapter sample parsing
4. BenchmarkRunner evaluation execution & report writing
5. GET /api/v1/analytics/benchmark API endpoint integration
"""

import os
import pytest
from benchmark.metrics import ConfusionMatrix, calculate_metrics
from benchmark.adapters import DatasetSample, ImageDatasetAdapter
from benchmark.runner import BenchmarkRunner
from routers.analytics_router import get_benchmark_report


def test_confusion_matrix_metrics():
    # TP=80, TN=90, FP=10, FN=20 (Total = 200)
    cm = ConfusionMatrix(tp=80, tn=90, fp=10, fn=20)
    assert cm.total_samples == 200

    metrics = calculate_metrics(cm)
    assert metrics["status"] == "EVALUATED"
    assert metrics["accuracy"] == 0.85  # (80 + 90) / 200 = 0.85
    assert metrics["precision"] == 0.8889  # 80 / 90 = 0.88888...
    assert metrics["recall"] == 0.8  # 80 / 100 = 0.8
    assert metrics["false_positive_rate"] == 0.1  # 10 / 100 = 0.1
    assert metrics["false_negative_rate"] == 0.2  # 20 / 100 = 0.2


def test_zero_samples_handling():
    cm = ConfusionMatrix(tp=0, tn=0, fp=0, fn=0)
    assert cm.total_samples == 0

    metrics = calculate_metrics(cm)
    assert metrics["status"] == "NOT EVALUATED"
    assert metrics["accuracy"] == "NOT EVALUATED"
    assert metrics["precision"] == "NOT EVALUATED"
    assert metrics["recall"] == "NOT EVALUATED"
    assert metrics["f1_score"] == "NOT EVALUATED"


def test_dataset_sample_structure():
    sample = DatasetSample(
        sample_id="img_123",
        file_path_or_content="/tmp/test.jpg",
        modality="image",
        ground_truth="AI_GENERATED",
        metadata={"dataset": "CIFAKE"},
    )
    assert sample.sample_id == "img_123"
    assert sample.ground_truth == "AI_GENERATED"
    assert sample.metadata["dataset"] == "CIFAKE"


@pytest.mark.asyncio
async def test_benchmark_runner_execution(tmp_path):
    runner = BenchmarkRunner(base_dir=str(tmp_path))
    report = await runner.run_full_benchmark()

    assert report["benchmark_title"] is not None
    assert report["overall_status"] == "COMPLETED"
    assert "modalities" in report
    assert "image" in report["modalities"]
    assert "text" in report["modalities"]

    # Verify report JSON file written
    json_path = os.path.join(tmp_path, "reports", "benchmark_report.json")
    assert os.path.exists(json_path)

    # Verify report MD file written
    md_path = os.path.join(tmp_path, "reports", "benchmark_report.md")
    assert os.path.exists(md_path)


@pytest.mark.asyncio
async def test_analytics_benchmark_api_endpoint():
    res = await get_benchmark_report(current_user=None)
    assert res["overall_status"] == "COMPLETED"
    assert res["functional_tests_status"] == "32/32 Pytest Passed"
    assert "modalities" in res
