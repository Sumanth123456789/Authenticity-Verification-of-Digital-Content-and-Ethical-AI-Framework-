/**
 * AI-Content Verification Hub — Shared TypeScript Types
 * Mirror of the backend Pydantic schemas.
 */

export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type Verdict = "authentic" | "suspicious" | "manipulated";
export type AnalysisType = "image" | "video" | "audio" | "call" | "text" | "link";
export type AnalysisStatus = "pending" | "processing" | "complete" | "failed";

export interface Signal {
  label: string;
  score: number; // 0–100
  description?: string;
}

export interface AnalysisResult {
  id: string;
  filename: string;
  analysis_type: AnalysisType;
  status: AnalysisStatus;

  // Risk assessment
  verdict?: Verdict;
  risk_level?: RiskLevel;
  risk_score?: number;   // 0–100
  confidence?: number;   // 0.0–1.0

  // Evidence
  signals: Signal[];
  explanation?: string;

  // Transparency
  model_used?: string;
  limitations?: string;
  processing_time_ms?: number;

  // Metadata
  file_size_bytes?: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface DashboardStats {
  total_analyses: number;
  images_analyzed: number;
  videos_analyzed: number;
  audios_analyzed: number;
  calls_analyzed: number;
  texts_analyzed: number;
  links_analyzed: number;
  suspicious_detections: number;
  high_risk_detections: number;
  average_processing_time_ms?: number;
}

export interface HistoryItem {
  id: string;
  filename: string;
  analysis_type: AnalysisType;
  verdict?: Verdict;
  risk_level?: RiskLevel;
  risk_score?: number;
  confidence?: number;
  file_size_bytes?: number;
  model_used?: string;
  processing_time_ms?: number;
  status: AnalysisStatus;
  created_at: string;
  completed_at?: string;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  service: string;
  version: string;
  timestamp: string;
  uptime_seconds: number;
  database: "connected" | "error";
  phases_active: string[];
}

/** Maps a 0–100 risk score to a RiskLevel label (mirrors backend logic). */
export function riskLevelFromScore(score: number): RiskLevel {
  if (score < 25) return "low";
  if (score < 50) return "moderate";
  if (score < 75) return "high";
  return "critical";
}

/** Human-readable risk label with colour hint. */
export const RISK_LABELS: Record<RiskLevel, { label: string; className: string }> = {
  low:      { label: "Low Risk",      className: "text-cyan-edge" },
  moderate: { label: "Moderate Risk", className: "text-yellow-400" },
  high:     { label: "High Risk",     className: "text-primary-glow" },
  critical: { label: "Critical Risk", className: "text-destructive" },
};
