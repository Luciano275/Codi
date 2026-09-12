import 'server-only';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function rejectCrossOriginMutation(request: Request): Response | null {
  if (SAFE_METHODS.has(request.method)) return null;

  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  const crossOrigin = origin ? origin !== requestOrigin : fetchSite && fetchSite !== 'same-origin';

  return crossOrigin ? Response.json({ message: 'Forbidden' }, { status: 403 }) : null;
}
