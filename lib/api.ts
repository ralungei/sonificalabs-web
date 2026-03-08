/**
 * API client for frontend → backend communication.
 *
 * All requests go to the external API (NEXT_PUBLIC_API_URL).
 * Auth token is sent via Bearer header.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<Response> {
  const url = `${API_URL}${path}`;
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Build full URL (for EventSource etc.)
 */
export function apiUrl(path: string, token?: string): string {
  const base = `${API_URL}${path}`;
  if (token) {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}token=${token}`;
  }
  return base;
}

export { API_URL };
