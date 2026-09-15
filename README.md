# Authenticity Verification of Digital Content and Ethical AI Framework

An end-to-end platform for detecting AI-generated content (images, audio, video, text claims), analyzing deepfakes, conducting multi-modal fact-checking, and providing an ethical AI evaluation framework.

## 🚀 Features

- **Multi-Modal Verification**: Detect deepfakes and AI modifications across Image, Audio, Video, Link, and Text Claims.
- **Explainable AI & Forensics**: Detailed breakdown of spectral analysis, temporal inconsistency, artifact heatmaps, and forensic metadata.
- **Ethical AI Framework**: Built-in risk scoring, bias detection, and ethical confidence metrics.
- **Interactive Dashboard & Case Management**: Manage verification history, audit logs, and export detailed forensic reports.
- **FastAPI & React/Vite Architecture**: High-performance backend API with a modern, responsive UI.

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, TanStack Router/Query, TailwindCSS, Framer Motion, Lucide Icons
- **Backend**: FastAPI (Python), Async SQLite / PostgreSQL, Pytest, Uvicorn
- **AI/ML**: Deepfake detection models, audio forensics, claim verification engines, temporal video analysis

## 📁 Repository Structure

```
├── backend/                  # FastAPI Application & AI Verification Services
│   ├── agents/               # Multi-agent decision logic
│   ├── ai/                   # AI detectors (Image, Audio, Video, Text, Fact-Check)
│   ├── database/             # SQLAlchemy ORM models & database setup
│   ├── routers/              # API Endpoints (verify, claims, auth, history, cases)
│   ├── services/             # Risk engine, explainability, aggregation pipelines
│   └── tests/                # Automated pytest suite
├── src/                      # Frontend Application (React / Vite)
│   ├── components/           # UI components & site layouts
│   ├── routes/               # Navigation routes & pages
│   ├── lib/                  # API client, utilities, mock data
│   └── hooks/                # Custom React hooks
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ / Bun / npm

### Running the Project

1. **Start Backend Server**:
   ```bash
   cd backend
   python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```

2. **Start Frontend Dev Server**:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser. API documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## 📄 License

MIT
