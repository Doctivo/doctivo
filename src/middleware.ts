import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    return response;
  }

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
  if (pathname.startsWith('/doctor/')) {
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
     * Match all request paths except static assets:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, svg, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp).*)',
  ],
};
