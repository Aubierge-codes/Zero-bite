const API_BASE = '/api/v1';

export interface ApiError extends Error {
  status: number;
  detail?: string;
}

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('zerobite_token');
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const err = new Error(
      (data && typeof data === 'object' && data.detail) ||
        `Request failed: ${res.status}`
    ) as ApiError;
    err.status = res.status;
    err.detail = data?.detail;
    if (res.status === 401) {
      try {
        localStorage.removeItem('zerobite_token');
        localStorage.removeItem('zerobite_user');
      } catch {
        /* ignore */
      }
    }
    throw err;
  }

  return data as T;
}

export const http = {
  get: <T>(path: string, params?: Record<string, any>) => {
    let url = path;
    if (params) {
      const usp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          usp.append(k, String(v));
        }
      });
      const qs = usp.toString();
      if (qs) url += `?${qs}`;
    }
    return request<T>(url, { method: 'GET' });
  },
  post: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: 'POST',
      body:
        body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};

export default http;
