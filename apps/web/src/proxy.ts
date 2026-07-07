import type { NextRequest } from 'next/server';
import { adminRoutesPrefix, authRoutes, DASHBOARD_PREFIX } from '@/lib/routes';

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isOnAuthRoute = authRoutes.includes(pathname);
  const isOnDashboardRoute = pathname.startsWith(DASHBOARD_PREFIX);
  const isOnAdminRoute = pathname.startsWith(adminRoutesPrefix);

  const session = req.cookies.get('session')?.value;
  const isLoggedIn = !!session;

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
    if (!isLoggedIn) {
      return Response.redirect(new URL(DASHBOARD_PREFIX, req.nextUrl));
    }
  }

  return;
}

export const config = {
  matcher: ['/((?!.*\\..*|_next|api).*)', '/'],
};
