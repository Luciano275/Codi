import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { adminRoutesPrefix, authRoutes, DASHBOARD_PREFIX } from '@/lib/routes';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production',
);

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isOnAuthRoute = authRoutes.includes(pathname);
  const isOnDashboardRoute = pathname.startsWith(DASHBOARD_PREFIX);
  const isOnAdminRoute = pathname.startsWith(adminRoutesPrefix);

  const session = req.cookies.get('session')?.value;

  let isLoggedIn = false;

  let payload: { sub: string; role: string } | null = null;

  if (session) {
    try {
      const result = await jwtVerify(session, secret);
      payload = result.payload as unknown as { sub: string; role: string };
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

  if (isOnAdminRoute) {
    if (!isLoggedIn || payload?.role !== 'ADMIN') {
      return Response.redirect(new URL(DASHBOARD_PREFIX, req.nextUrl));
    }
  }

  return;
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
