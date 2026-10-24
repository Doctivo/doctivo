import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-Memory IP Rate Limiting Store
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const ipRateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup expired IP records every 15 minutes to preserve memory
let lastCleanup = Date.now();
function cleanupExpiredRecords(now: number) {
  if (now - lastCleanup > 15 * 60 * 1000) {
    for (const [key, value] of ipRateLimitMap.entries()) {
      if (now > value.resetAt) {
        ipRateLimitMap.delete(key);
      }
    }
    lastCleanup = now;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const now = Date.now();
  cleanupExpiredRecords(now);

  // 0. Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    // A. Pre-flight OPTIONS handling
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-client-platform',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // B. Anti-Bot / Anti-Scraper Shield (Block Postman, curl, python scripts on sensitive auth routes)
    const userAgent = request.headers.get('user-agent') || '';
    const isAutomatedBot = /PostmanRuntime|curl\/|python-requests|Wget|Go-http-client|Insomnia/i.test(userAgent);
    if (isAutomatedBot && pathname.startsWith('/api/v1/auth/')) {
      return NextResponse.json(
        { error: 'Forbidden: Direct automated scripting or external bot tool access is prohibited.' },
        { status: 403 }
      );
    }

    // C. IP-Based Rate Limiting on sensitive Auth endpoints (e.g. /api/v1/auth/send-otp)
    if (pathname.includes('/auth/send-otp') && request.method === 'POST') {
      const clientIp =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        'anonymous';

      const record = ipRateLimitMap.get(clientIp) || { count: 0, resetAt: now + 10 * 60 * 1000 };
      if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + 10 * 60 * 1000;
      }

      record.count += 1;
      ipRateLimitMap.set(clientIp, record);

      // Max 5 OTP dispatches per IP per 10 minutes
      if (record.count > 5) {
        return NextResponse.json(
          {
            error: 'Security Notice: Too many OTP requests from this network. Please wait 10 minutes before retrying.',
          },
          { status: 429 }
        );
      }
    }

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-client-platform');

    // D. Enterprise Security Headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  // 1. Get session info from cookies
  const role = request.cookies.get('session_role')?.value;
  const userId = request.cookies.get('session_id')?.value;

  // 2. Define public routes that don't need authentication
  const publicRoutes = ['/login', '/about', '/privacy-policy', '/terms', '/api/webhooks'];
  if (publicRoutes.some((route) => pathname.startsWith(route)) || pathname === '/') {
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

  // Doctor Dashboard Protection (Doctor public profile /doctor/[id] remains open)
  if (pathname.startsWith('/doctor/dashboard')) {
    if (!role || (role !== 'DOCTOR' && role !== 'Doctor' && role !== 'SUPER_ADMIN')) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
  }

  // Attendant Dashboard Protection
  if (pathname.startsWith('/attendant/dashboard') || pathname === '/attendant') {
    if (!role || (role !== 'ATTENDANT' && role !== 'Attendant' && role !== 'SUPER_ADMIN')) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
  }

  // Generic Protected Routes (Patient, Bookings, Appointments)
  const protectedRoutes = ['/appointments', '/book', '/patient', '/profile', '/success'];
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp).*)',
  ],
};
