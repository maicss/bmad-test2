import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionByToken } from './lib/db/queries/sessions';
import { getUserById } from './lib/db/queries/users';

/**
 * Authentication Middleware
 *
 * Verifies session token from HttpOnly cookie
 * Redirects authenticated users to dashboard
 * Redirects unauthenticated users from protected routes
 *
 * Runtime: Node.js (Bun-compatible)
 *
 * Source: Story 1.6 AC #8 - "Remember Me" functionality
 */

export const runtime = 'nodejs';

const PROTECTED_ROUTES = ['/dashboard', '/parent', '/settings', '/child-dashboard'];
const AUTH_ROUTES = ['/login', '/register', '/pin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session token from cookie
  const sessionToken = request.cookies.get('better-auth.session_token')?.value;
  
  console.log('[Middleware] Pathname:', pathname);
  console.log('[Middleware] Session token:', sessionToken ? 'present' : 'missing');
  
  // Verify session
  let isAuthenticated = false;
  let userRole: string | null = null;
  
  if (sessionToken) {
    try {
      const session = await getSessionByToken(sessionToken);
      console.log('[Middleware] Session found:', session ? 'yes' : 'no');
      
      if (session && new Date(session.expires_at) > new Date()) {
        // Session is valid
        isAuthenticated = true;
        console.log('[Middleware] Session valid, user_id:', session.user_id);
        
        // Get user role for redirection
        const user = await getUserById(session.user_id);
        if (user) {
          userRole = user.role;
          console.log('[Middleware] User role:', userRole);
        }
      } else {
        console.log('[Middleware] Session expired or invalid');
      }
    } catch (error) {
      // Session is invalid or expired
      console.error('[Middleware] Session verification error:', error);
    }
  }
  
  console.log('[Middleware] Authenticated:', isAuthenticated);
  
  // Handle homepage: redirect authenticated users to dashboard
  if (pathname === '/' && isAuthenticated) {
    console.log('[Middleware] Redirecting authenticated user from homepage');
    if (userRole === 'child') {
      // Children go to child dashboard
      return NextResponse.redirect(new URL('/child-dashboard', request.url));
    } else {
      // Parents go to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Handle protected routes (require authentication)
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      console.log('[Middleware] Redirecting to login (protected route)');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Handle auth routes (redirect authenticated users away)
  if (AUTH_ROUTES.some(route => pathname.startsWith(route)) && isAuthenticated) {
    console.log('[Middleware] Redirecting authenticated user from auth route');
    if (userRole === 'child') {
      // Children go to child dashboard
      return NextResponse.redirect(new URL('/child-dashboard', request.url));
    } else {
      // Parents go to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  console.log('[Middleware] Allowing request to proceed');
  // Default: continue to requested route
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
