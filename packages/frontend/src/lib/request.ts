export const API_BASE = import.meta.env?.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  data: unknown;
  rawMessage: string;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.rawMessage = message;
  }

  get isTransient() {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }

  get isAuthError() {
    return this.status === 401;
  }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers || {});
  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new ApiError(data?.error || data?.message || res.statusText, res.status, data);
  }
  return data as T;
}
