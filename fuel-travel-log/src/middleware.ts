import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';
import type { UserRole } from '@/types/next-auth';

const { auth } = NextAuth(authConfig);

// Which roles may visit which prefix — enforced server-side (middleware).
const ROUTES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/approve', roles: ['manager'] },
  { prefix: '/dashboard', roles: ['accounts', 'hr'] },
  { prefix: '/vehicles', roles: ['manager', 'accounts'] },
  { prefix: '/new', roles: ['employee', 'manager'] },
  { prefix: '/admin', roles: ['super_admin'] },
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Logged-in users don't need the login screen
  if (pathname === '/login') {
    if (user) return NextResponse.redirect(new URL('/', req.url));
    return;
  }

  const rule = ROUTES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  const needsAuth = !!rule || pathname === '/';

  // Not signed in → login page
  if (!user && needsAuth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed in but wrong role → home
  if (rule && user && !rule.roles.includes(user.role)) {
    return NextResponse.redirect(new URL('/', req.url));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp)$).*)'],
};
