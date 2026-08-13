import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get session info from cookies
  const role = request.cookies.get('session_role')?.value;
  const userId = request.cookies.get('session_id')?.value;

  // 2. Define public routes that don't need authentication
  const publicRoutes = ['/login', '/about', '/privacy-policy', '/terms', '/api/webhooks'];
  if (publicRoutes.some(route => pathname.startsWith(route)) || pathname === '/') {
    return NextResponse.next();
  }

  // 3. Define route protections based on prefixes
  
  // Admin Routes Protection
  if (pathname.startsWith('/admin')) {
    if (!role || (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'Admin' && role !== 'Super Admin')) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
  }

  // Doctor Routes Protection
  if (pathname.startsWith('/doctor')) {
    if (!role || (role !== 'DOCTOR' && role !== 'Doctor' && role !== 'SUPER_ADMIN')) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
  }

  // Generic Protected Routes (Patient, Bookings, Appointments)
  const protectedRoutes = ['/appointments', '/book', '/patient', '/profile', '/success'];
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!role || !userId) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, svg, etc.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp).*)',
  ],
};
