/**
 * AI-Content Verification Hub — Dashboard API calls
 */
import { apiClient } from "./client";
import type { DashboardStats, HealthResponse } from "./types";

/** Fetch real dashboard statistics from the backend. */
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiClient.get<DashboardStats>("/api/v1/dashboard/stats");
}

/** Check backend health. */
export async function checkHealth(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>("/api/health");
}
