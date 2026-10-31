import { getApiBaseUrl } from "./config";

export { getApiBaseUrl } from "./config";

const TOKEN_KEY = "aicvhub_token";
const USER_KEY = "aicvhub_user";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: any | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
      else if (body?.detail) message = body.detail;
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(res.status, res.statusText, message);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  /** Returns the dynamic API base URL */
  getBaseUrl(): string {
    return getApiBaseUrl();
  },

  /** GET request — returns parsed JSON */
  async get<T>(path: string, init?: RequestInit): Promise<T> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...(init?.headers ?? {}),
      },
      ...init,
    });
    return handleResponse<T>(res);
  },

  /** POST with JSON body */
  async post<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...(init?.headers ?? {}),
      },
      body: JSON.stringify(body),
      ...init,
    });
    return handleResponse<T>(res);
  },

  /** POST multipart form data (file uploads) */
  async upload<T>(path: string, formData: FormData, init?: RequestInit): Promise<T> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        ...(init?.headers ?? {}),
      },
      body: formData,
      ...init,
    });
    return handleResponse<T>(res);
  },

  /** User Authentication endpoints */
  async login(email: string, password: string) {
    const res = await this.post<any>("/api/v1/auth/login", { email, password });
    if (res.access_token) {
      setStoredToken(res.access_token);
      setStoredUser(res.user);
    }
    return res;
  },

  async register(email: string, password: string, fullName?: string) {
    const res = await this.post<any>("/api/v1/auth/register", {
      email,
      password,
      full_name: fullName,
    });
    // Auto login upon registration
    if (res) {
      await this.login(email, password);
    }
    return res;
  },

  logout() {
    setStoredToken(null);
    setStoredUser(null);
  },
};
