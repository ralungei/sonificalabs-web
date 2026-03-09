/**
 * API client for frontend → backend communication.
 *
 * All requests go to the external API (NEXT_PUBLIC_API_URL).
 * Auth token is provided explicitly by callers (from useApiToken() hook).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<Response> {
  const url = `${API_URL}${path}`;
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });

  // Redirect to sign-in on auth failure (client-side only).
  // Only redirect if we actually sent a token (avoids redirect for unauthenticated pages).
  if (res.status === 401 && token && typeof window !== "undefined") {
    const now = Date.now();
    const lastRedirect = Number(sessionStorage.getItem("auth_redirect_ts") || "0");
    if (now - lastRedirect > 10000) {
      sessionStorage.setItem("auth_redirect_ts", String(now));
      window.location.href = "/signin";
    }
  }

  return res;
}

/**
 * Build full URL with auth token in query param (for EventSource/SSE).
 */
export function apiUrl(path: string, token?: string | null): string {
  const base = `${API_URL}${path}`;
  if (token) {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}token=${encodeURIComponent(token)}`;
  }
  return base;
}

export { API_URL };
