/**
 * AI-Content Verification Hub — History API calls
 */
import { apiClient } from "./client";
import type { HistoryItem, HistoryResponse } from "./types";

export async function getHistory(params?: {
  page?: number;
  per_page?: number;
  analysis_type?: string;
}): Promise<HistoryResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.per_page) qs.set("per_page", String(params.per_page));
  if (params?.analysis_type && params.analysis_type !== "all") {
    qs.set("analysis_type", params.analysis_type);
  }
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiClient.get<HistoryResponse>(`/api/v1/history${query}`);
}

export async function getHistoryItem(id: string): Promise<HistoryItem> {
  return apiClient.get<HistoryItem>(`/api/v1/history/${id}`);
}
