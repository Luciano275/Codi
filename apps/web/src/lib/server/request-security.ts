import 'server-only';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CROSS_ORIGIN_FETCH_SITES = new Set(['cross-site', 'same-site']);

function readFirstHeaderValue(value: string | null): string | null {
  return value?.split(',', 1)[0]?.trim() || null;
}

function readForwardedOrigin(request: Request): string | null {
  const requestUrl = new URL(request.url);
  const host =
    readFirstHeaderValue(request.headers.get('x-forwarded-host')) ??
    readFirstHeaderValue(request.headers.get('host'));
  if (!host) return null;

  const protocol =
    readFirstHeaderValue(request.headers.get('x-forwarded-proto')) ??
    requestUrl.protocol.slice(0, -1);

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return null;
  }
}

function readOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isCrossOriginMutation(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && CROSS_ORIGIN_FETCH_SITES.has(fetchSite)) return true;

  const origin = request.headers.get('origin');
  if (!origin) return false;

  const requestOrigins = new Set([new URL(request.url).origin, readForwardedOrigin(request)]);
  const normalizedOrigin = readOrigin(origin);
  return !normalizedOrigin || !requestOrigins.has(normalizedOrigin);
}

export function rejectCrossOriginMutation(request: Request): Response | null {
  if (SAFE_METHODS.has(request.method)) return null;
  return isCrossOriginMutation(request)
    ? Response.json({ message: 'Forbidden' }, { status: 403 })
    : null;
}
