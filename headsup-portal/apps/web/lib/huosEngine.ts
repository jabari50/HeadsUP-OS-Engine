/* Browser-side API surface. BASE is "/api" and ONLY "/api" — the browser
   never holds a Render URL, an engine secret, or a service-role key (Gate 3). */

export const BASE = "/api";

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && String((data as { error: unknown }).error)) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return data as T;
}
