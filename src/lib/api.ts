export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const TOKEN_KEY = "gk_token";
const ROLE_KEY = "gk_role";
const USER_KEY = "gk_user";

export type AppRole = "admin" | "staff" | "student";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function getRole(): AppRole | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(ROLE_KEY) as AppRole | null) ?? null;
}
export function getUser(): {
  id: string;
  email?: string;
  name?: string;
  rollNumber?: string;
  class?: string;
} | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveSession(s: {
  access_token: string;
  role: AppRole;
  user: { id: string; email?: string; name?: string; rollNumber?: string; class?: string };
}) {
  localStorage.setItem(TOKEN_KEY, s.access_token);
  localStorage.setItem(ROLE_KEY, s.role);
  localStorage.setItem(USER_KEY, JSON.stringify(s.user));
  window.dispatchEvent(new Event("gk-auth-change"));
  window.dispatchEvent(new Event("gk-clear-query-cache"));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("gk-auth-change"));
  window.dispatchEvent(new Event("gk-clear-query-cache"));
}

function apiErrorMessage(body: Record<string, unknown>, status: number) {
  const msg = body.error ?? body.message;
  if (typeof msg === "string" && msg) return msg;
  return `Request failed (${status})`;
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(apiErrorMessage(body, res.status));
  return body as T;
}

/** Unwrap `{ success, data }` from Express API responses. */
export function unwrapData<T>(body: { data?: T } & Record<string, unknown>): T {
  if (body.data !== undefined) return body.data as T;
  return body as T;
}
