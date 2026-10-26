/**
 * AI-Content Verification Hub — Auth API calls
 */
import { apiClient } from "./client";
import type { ApiError } from "./client";

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

const TOKEN_KEY = "aicvhub_token";

/** Store JWT token in localStorage. */
export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Retrieve stored JWT token. */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Remove stored JWT token (logout). */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Register a new user account. */
export async function registerUser(
  data: RegisterRequest
): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>(
    "/api/v1/auth/register",
    data
  );
  storeToken(response.access_token);
  return response;
}

/** Login with email and password. */
export async function loginUser(
  data: LoginRequest
): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>(
    "/api/v1/auth/login",
    data
  );
  storeToken(response.access_token);
  return response;
}

/** Get the currently authenticated user's profile. */
export async function getCurrentUser(): Promise<UserResponse> {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated");
  return apiClient.get<UserResponse>("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Check if a user is currently authenticated (has a stored token). */
export function isAuthenticated(): boolean {
  return !!getStoredToken();
}
