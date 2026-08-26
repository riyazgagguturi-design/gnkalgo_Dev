function resolveApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL || "";
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const onLocalhost = host === "localhost" || host === "127.0.0.1";
    if (!onLocalhost && (!configured || configured.includes("localhost"))) {
      return "";
    }
  }
  return configured || "http://localhost:8000";
}

export type TokenBundle = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

const ACCESS_KEY = "gnk_access";
const REFRESH_KEY = "gnk_refresh";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function setTokens(tokens: TokenBundle) {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${resolveApiBase()}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data as { detail?: string }).detail || res.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data as T;
}
