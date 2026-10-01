import type { NextRequest } from 'next/server';
import { fetchBackendWithSession } from '@/lib/server/backend-api';
import { rejectCrossOriginMutation } from '@/lib/server/request-security';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

const BLOCKED_PATHS = new Set(['/api/auth/login']);
const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'content-type',
  'if-modified-since',
  'if-none-match',
  'range',
];
const FORWARDED_RESPONSE_HEADERS = [
  'accept-ranges',
  'cache-control',
  'content-disposition',
  'content-range',
  'content-type',
  'etag',
  'last-modified',
];

function getTargetPath(path: string[]): string {
  const segments = path[0] === 'api' ? path.slice(1) : path;
  return `/api/${segments.map(encodeURIComponent).join('/')}`;
}

function forwardedHeaders(source: Headers, names: string[]): Headers {
  const headers = new Headers();
  for (const name of names) {
    const value = source.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

async function proxy(request: NextRequest, context: RouteContext): Promise<Response> {
  const forbidden = rejectCrossOriginMutation(request);
  if (forbidden) return forbidden;

  const { path } = await context.params;
  const targetPath = getTargetPath(path);
  if (BLOCKED_PATHS.has(targetPath)) {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }

  const searchParams = new URLSearchParams(request.nextUrl.searchParams);
  searchParams.delete('_sse');
  const query = searchParams.toString();
  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers: forwardedHeaders(request.headers, FORWARDED_REQUEST_HEADERS),
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }

  const backendResponse = await fetchBackendWithSession(
    `${targetPath}${query ? `?${query}` : ''}`,
    init,
  );
  const responseHeaders = forwardedHeaders(backendResponse.headers, FORWARDED_RESPONSE_HEADERS);
  if (
    backendResponse.headers.get('content-type')?.includes('application/pdf') &&
    !backendResponse.headers.has('content-encoding')
  ) {
    const length = backendResponse.headers.get('content-length');
    if (length) responseHeaders.set('content-length', length);
  }
  responseHeaders.set('cache-control', 'no-store');

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
