import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { authRoutes, DASHBOARD_PREFIX } from '@/lib/routes';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production',
);

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isOnAuthRoute = authRoutes.includes(pathname);
  const isOnDashboardRoute = pathname.startsWith(DASHBOARD_PREFIX);

  const session = req.cookies.get('session')?.value;

  let isLoggedIn = false;

  if (session) {
    try {
      await jwtVerify(session, secret);
      isLoggedIn = true;
    } catch {}
  }

  if (isOnAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DASHBOARD_PREFIX, req.nextUrl));
    }

    return;
  }

  if (isOnDashboardRoute && !isLoggedIn) {
    return Response.redirect(new URL('/', req.nextUrl));
  }

  return;
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
