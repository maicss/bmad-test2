/**
 * Session utility functions
 *
 * Story 1.6: Multi-device Login - Session management
 */

import { getSessionByToken, updateSessionActivity } from '@/lib/db/queries/sessions';

export interface Session {
  id: string;
  user_id: string;
  token: string;
  device_id: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  user_agent: string;
  ip_address: string;
  last_activity_at: Date;
  expires_at: Date;
  is_active: boolean;
  remember_me: boolean;
  created_at: Date;
}

/**
 * Verify session token from request
 *
 * Extracts session token from cookie or Authorization header
 * Validates token and returns session data
 *
 * @param request - NextRequest object
 * @returns Session or null if invalid
 */
export async function verifySessionToken(request: Request): Promise<Session | null> {
  // Try to get token from cookie first
  const cookieHeader = request.headers.get('cookie');
  let token = null;

  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    token = cookies['better-auth.session_token'] || cookies['session_token'];
  }

  // If not in cookie, try Authorization header
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return null;
  }

  // Get session from database
  const session = await getSessionByToken(token);

  if (!session) {
    return null;
  }

  // Check if session is active
  if (!session.is_active) {
    return null;
  }

  // Check if session is expired
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = Math.floor(new Date(session.expires_at).getTime() / 1000);

  if (now >= expiresAt) {
    return null;
  }

  // Update session activity (last_activity_at)
  await updateSessionActivity(session.id);

  return session;
}

/**
 * Get session ID from request
 *
 * Extracts session ID from cookie or Authorization header
 * Does not validate session - just extracts ID
 *
 * @param request - NextRequest object
 * @returns Session ID or null
 */
export function getSessionIdFromRequest(request: Request): string | null {
  // Try to get token from cookie first
  const cookieHeader = request.headers.get('cookie');
  let token = null;

  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    token = cookies['better-auth.session_token'] || cookies['session_token'];
  }

  // If not in cookie, try Authorization header
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  return token;
}

/**
 * Format session for API response
 *
 * @param session - Session object
 * @returns Formatted session object
 */
export function formatSessionForResponse(session: Session) {
  return {
    id: session.id,
    device_type: session.device_type,
    device_id: session.device_id,
    user_agent: session.user_agent,
    ip_address: session.ip_address,
    last_activity_at: session.last_activity_at,
    expires_at: session.expires_at,
    remember_me: session.remember_me,
  };
}
