/**
 * Centralized dynamic backend API configuration.
 *
 * Resolves API URL in the following priority order:
 * 1. Runtime override in localStorage (`AICV_BACKEND_URL`)
 * 2. Vite environment variable (`import.meta.env.VITE_API_URL`)
 * 3. Relative path ("") when in production/Vercel (routes through Vercel rewrites)
 * 4. Local fallback ("http://localhost:8000") when running on localhost
 */

export const STORAGE_KEY_API_URL = "AICV_BACKEND_URL";
export const DEFAULT_PRODUCTION_RENDER_URL =
  "https://authenticity-verification-of-digital.onrender.com";
const EVENT_API_URL_CHANGED = "aicv_backend_url_changed";

/**
 * Normalizes an API base URL (removes trailing slashes, adds https if needed).
 */
export function normalizeApiUrl(url: string): string {
  if (!url) return "";
  let trimmed = url.trim();
  // Strip trailing slashes
  trimmed = trimmed.replace(/\/+$/, "");

  // If user entered domain like my-backend.onrender.com without protocol
  if (
    trimmed &&
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    !trimmed.startsWith("/")
  ) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Returns the currently active backend API base URL.
 */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    // Server-side execution
    return (
      (import.meta.env.VITE_API_URL as string) ||
      DEFAULT_PRODUCTION_RENDER_URL
    );
  }

  // 1. Runtime user-configured override
  const savedUrl = localStorage.getItem(STORAGE_KEY_API_URL);
  if (savedUrl !== null && savedUrl !== undefined && savedUrl.trim() !== "") {
    return normalizeApiUrl(savedUrl);
  }

  // 2. Build-time / environment variable
  const envUrl = (import.meta.env.VITE_API_URL as string)?.trim();
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (envUrl) {
    // Safety check: if on production but VITE_API_URL contains localhost, ignore it
    if (!isLocalhost && (envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))) {
      return DEFAULT_PRODUCTION_RENDER_URL;
    }
    return normalizeApiUrl(envUrl);
  }

  // 3. Fallbacks based on host
  if (isLocalhost) {
    return "http://localhost:8000";
  }

  // On production (e.g. Vercel), default directly to the deployed Render backend
  return DEFAULT_PRODUCTION_RENDER_URL;
}

/**
 * Updates the runtime backend API URL and notifies all listeners.
 */
export function setApiBaseUrl(url: string): void {
  if (typeof window === "undefined") return;
  const cleaned = normalizeApiUrl(url);
  if (!cleaned) {
    localStorage.removeItem(STORAGE_KEY_API_URL);
  } else {
    localStorage.setItem(STORAGE_KEY_API_URL, cleaned);
  }
  window.dispatchEvent(
    new CustomEvent(EVENT_API_URL_CHANGED, { detail: cleaned }),
  );
}

/**
 * Resets the runtime backend API URL to default.
 */
export function resetApiBaseUrl(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_API_URL);
  window.dispatchEvent(
    new CustomEvent(EVENT_API_URL_CHANGED, { detail: "" }),
  );
}

/**
 * Checks if the current URL is a user-configured runtime override.
 */
export function isCustomApiUrl(): boolean {
  if (typeof window === "undefined") return false;
  const val = localStorage.getItem(STORAGE_KEY_API_URL);
  return Boolean(val && val.trim());
}

export interface HealthCheckResult {
  ok: boolean;
  status: "connected" | "degraded" | "sleeping" | "disconnected";
  statusCode?: number;
  latencyMs: number;
  url: string;
  error?: string;
  details?: any;
}

/**
 * Probes the backend health endpoint.
 */
export async function checkBackendHealth(
  targetUrl?: string,
): Promise<HealthCheckResult> {
  const baseUrl = targetUrl !== undefined ? normalizeApiUrl(targetUrl) : getApiBaseUrl();
  const start = performance.now();

  // Try endpoints in sequence
  const endpoints = ["/api/health", "/health", "/api/v1/health"];
  let lastError: string | null = null;
  let lastStatusCode: number | undefined;

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      lastStatusCode = res.status;
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const latencyMs = Math.round(performance.now() - start);
        return {
          ok: true,
          status: data.status === "degraded" ? "degraded" : "connected",
          statusCode: res.status,
          latencyMs,
          url: baseUrl || window.location.origin,
          details: data,
        };
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        lastError = "Connection timed out (backend might be waking up or unreachable)";
      } else {
        lastError = err.message || "Failed to reach backend";
      }
    }
  }

  const latencyMs = Math.round(performance.now() - start);
  const isSleeping =
    (baseUrl.includes("onrender.com") ||
      (!baseUrl &&
        typeof window !== "undefined" &&
        window.location.hostname.includes("vercel.app"))) &&
    (lastError?.includes("timeout") ||
      lastError?.includes("fetch") ||
      lastError?.includes("Failed to fetch"));

  return {
    ok: false,
    status: isSleeping ? "sleeping" : "disconnected",
    statusCode: lastStatusCode,
    latencyMs,
    url: baseUrl || window.location.origin,
    error: isSleeping
      ? "Render instance may be waking up from free-tier sleep (~30-50s). Please wait a few seconds and test again."
      : (lastError ?? "Unable to connect to backend server"),
  };
}

