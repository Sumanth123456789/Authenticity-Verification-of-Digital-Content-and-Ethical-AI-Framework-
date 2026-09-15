# AI-Content Verification Hub — Benchmark Framework

This package provides a standardized evaluation framework to benchmark the multi-modal detection pipelines against labeled datasets (e.g. CIFAKE, FaceForensics++, Celeb-DF, ASVspoof, PhishTank).

---

## Dataset Directory Structure

Place CSV/JSON dataset manifests inside `backend/benchmark/datasets/`:

```
backend/benchmark/
├── datasets/
│   ├── image_manifest.json
│   ├── video_manifest.json
│   ├── audio_manifest.json
│   ├── text_manifest.json
│   ├── link_manifest.json
│   └── claim_manifest.json
├── metrics.py
├── adapters.py
├── runner.py
└── reports/
    ├── benchmark_report.json
    └── benchmark_report.md
```

---

## Standard Manifest JSON Format

```json
[
  {
    "sample_id": "img_001",
    "file_path": "/path/to/sample.jpg",
    "modality": "image",
    "ground_truth": "AI_GENERATED",
    "metadata": { "dataset_name": "CIFAKE" }
  },
  {
    "sample_id": "img_002",
    "file_path": "/path/to/sample.jpg",
    "modality": "image",
    "ground_truth": "REAL",
    "metadata": { "dataset_name": "CIFAKE" }
  }
]
```

---

## Standard Ground Truth Labels

- **Image / Video / Audio**: `REAL` | `AI_GENERATED` | `MANIPULATED`
- **Text**: `REAL` | `AI_GENERATED` | `PHISHING`
- **Link**: `LEGITIMATE` | `PHISHING` | `TYPOSQUATTING`
- **Claim**: `TRUE` | `FALSE` | `MIXED`

---

## Running the Benchmark

Execute from the `backend/` directory:

```bash
python -m benchmark.runner
```

Reports will be written to `backend/benchmark/reports/benchmark_report.json` and `backend/benchmark/reports/benchmark_report.md`.
