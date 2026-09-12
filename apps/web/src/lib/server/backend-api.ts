import 'server-only';

import { getSessionToken } from './session-cookies';

const API_URL = process.env.API_URL || 'http://localhost:4000';

function backendUrl(path: string): string {
  if (!path.startsWith('/')) throw new Error('Backend path must start with /');
  return `${API_URL.replace(/\/$/, '')}${path}`;
}

export function fetchBackend(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(backendUrl(path), { ...init, cache: 'no-store' });
}

export async function fetchBackendWithSession(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getSessionToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('authorization', `Bearer ${token}`);
  return fetchBackend(path, { ...init, headers });
}
