"""
AI-Content Verification Hub — Admin Analytics & Benchmark Router

Endpoints:
- GET  /api/v1/analytics/benchmark    : Retrieve current benchmark execution report
- POST /api/v1/analytics/benchmark/run: Trigger benchmark evaluation run across dataset manifests
"""

from fastapi import APIRouter, Depends
from benchmark.runner import BenchmarkRunner
from database.models import User
from security.auth import get_current_user, get_optional_current_user

router = APIRouter(
    prefix="/api/v1/analytics",
    tags=["analytics"],
)


@router.get("/benchmark")
async def get_benchmark_report(current_user: User = Depends(get_optional_current_user)):
    runner = BenchmarkRunner()
    report = await runner.run_full_benchmark()
    return report


@router.post("/benchmark/run")
async def run_benchmark_evaluation(current_user: User = Depends(get_current_user)):
    runner = BenchmarkRunner()
    report = await runner.run_full_benchmark()
    return {
        "message": "Benchmark evaluation executed successfully.",
        "report": report,
    }
