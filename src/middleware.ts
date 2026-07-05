import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Exclude public assets, images, API routes, and favicon
  if (
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // 2. Allow access to /download-app
  if (pathname.startsWith('/download-app')) {
    return NextResponse.next();
  }

  const sessionRole = request.cookies.get('session_role')?.value;
  const sessionId = request.cookies.get('session_id')?.value;

  // Redirect authenticated users away from landing page and login page directly to their dashboards
  if (pathname === '/' || pathname === '/login') {
    if (sessionRole === 'Patient' && sessionId) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    if (sessionRole === 'Admin' && sessionId) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if ((sessionRole === 'Doctor' || sessionRole === 'Attendant') && sessionId) {
      return NextResponse.redirect(new URL(`/doctor/${sessionId}`, request.url));
    }
    return NextResponse.next();
  }

  const userAgent = request.headers.get('user-agent') || '';
  const isMobileApp = userAgent.includes('DoctivoApp');

  // 4. Admin Routing Rule
  if (pathname.startsWith('/admin')) {
    // If not authenticated as Admin, redirect to /login
    if (sessionRole !== 'Admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Rolling session timeout: Extend Admin session for 30 minutes on every request
    const response = NextResponse.next();
    response.cookies.set('session_role', 'Admin', { path: '/', maxAge: 30 * 60 });
    const sessionId = request.cookies.get('session_id')?.value || 'admin';
    response.cookies.set('session_id', sessionId, { path: '/', maxAge: 30 * 60 });
    return response;
  }

  // 5. Doctor & Attendant Routing Rule
  if (pathname.startsWith('/doctor/') || pathname === '/doctor') {
    // If not authenticated as Attendant or Doctor, redirect to /login
    if (sessionRole !== 'Attendant' && sessionRole !== 'Doctor') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 6. Patient Routing Rule (for all other screens like /home, /onboarding, /profile, /appointments, /book, /tutorial, /choose-category)
  // If not authenticated as Patient, redirect to /login
  if (sessionRole !== 'Patient') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (e.g. assets, images)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets|images|.*\\..*).*)',
  ],
};
