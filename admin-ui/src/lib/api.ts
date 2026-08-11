export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function csrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  const method = (options.method || "GET").toUpperCase();

  if (!(options.body instanceof FormData) && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const token = csrfToken();
    if (token) headers.set("x-csrf-token", token);
  }

  const res = await fetch(path, { ...options, headers, credentials: "same-origin" });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    throw new ApiError(res.status, body?.error || `Request failed (${res.status})`);
  }
  return body as T;
}

export const http = {
  get: <T>(p: string) => api<T>(p),
  post: <T>(p: string, data?: unknown) =>
    api<T>(p, { method: "POST", body: data instanceof FormData ? data : JSON.stringify(data ?? {}) }),
  put: <T>(p: string, data?: unknown) =>
    api<T>(p, { method: "PUT", body: data instanceof FormData ? data : JSON.stringify(data ?? {}) }),
  del: <T>(p: string) => api<T>(p, { method: "DELETE" }),
};

export function mediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("/")) {
    return url;
  }
  return `/${url}`;
}

