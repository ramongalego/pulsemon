import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Redirect logged-in users from marketing pages to dashboard
  if (pathname === '/' && req.auth) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  if (pathname === '/docs' && req.auth) {
    return NextResponse.redirect(new URL('/dashboard/docs', req.url));
  }

  // Protect dashboard routes — redirect unauthenticated users to login
  if (pathname.startsWith('/dashboard') && !req.auth) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/', '/docs', '/dashboard/:path*'],
};
