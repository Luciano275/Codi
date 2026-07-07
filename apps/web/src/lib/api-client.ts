const API_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  if (!API_URL) {
    throw new Error("No se encontró una URL de API")
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(error.message || `HTTP ${res.status}`, res.status);
  }

  return res.json();
}

export function apiPost<T>(path: string, body: unknown, token?: string) {
  return request<T>('POST', path, body, token);
}

export function apiGet<T>(path: string, token: string) {
  return request<T>('GET', path, undefined, token);
}
