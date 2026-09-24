const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function authToken(): string | null {
  try {
    return localStorage.getItem('zb_token');
  } catch {
    return null;
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === 'string') return body.detail;
    if (Array.isArray(body?.detail)) return body.detail.map((d: { msg?: string }) => d.msg).join(', ');
  } catch {
    // response wasn't JSON — fall through to status text
  }
  return res.statusText || `Request failed with status ${res.status}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authToken();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const query = params
    ? Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    : [];
  const qs = query.length ? `?${new URLSearchParams(query.map(([k, v]) => [k, String(v)])).toString()}` : '';
  return request<T>(`${path}${qs}`);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });
}

export function apiPostForm<T>(path: string, form: URLSearchParams): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: form,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}
