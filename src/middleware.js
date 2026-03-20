import { NextResponse } from 'next/server';

export function middleware(request) {
  // Redirect root to teacher login
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/teacher/login', request.url));
  }
}

export const config = {
  matcher: ['/'],
};
