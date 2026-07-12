import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * DOCTIVO - UNIVERSAL COMPATIBILITY MIDDLEWARE
 * Focuses on ensuring designs (CSS/JS) are NEVER blocked.
 */
export function middleware(request: NextRequest) {
  // Standard pass-through to ensure Next.js handles asset routing correctly
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - manifest.json (PWA)
     * - favicon.ico (favicon file)
     * - All files with extensions (e.g. .css, .js, .png, .jpg)
     */
    '/((?!api|_next/static|_next/image|manifest.json|favicon.ico|.*\\..*).*)',
  ],
};
