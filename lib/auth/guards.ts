/**
 * Authentication Guards
 *
 * Story 1.x: User Authentication & Family Management
 * Story 2.9: Child Marks Task Complete - Child auth guard
 *
 * Provides role-based authentication guards for API routes:
 * - requireParentAuth: Ensures request is from a parent user
 * - requireChildAuth: Ensures request is from a child user
 * - requireAuth: Ensures request is authenticated (any role)
 *
 * Source: CLAUDE.md - RBAC rules
 */

import { NextRequest } from 'next/server';
import { verifySessionToken } from './session-utils';
import { eq } from 'drizzle-orm';
import db from '@/lib/db';
import { users } from '@/lib/db/schema';

/**
 * Authentication error with proper status codes
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
    public readonly code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_SESSION'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Session data with user information
 */
export interface AuthSession {
  userId: string;
  role: 'parent' | 'child' | 'admin';
  familyId?: string;
  sessionId: string;
}

/**
 * Verify Better-Auth session and extract user info
 *
 * @param request - NextRequest object
 * @returns Session data with user info
 * @throws AuthError if session is invalid
 */
async function verifyAuthSession(request: NextRequest): Promise<AuthSession> {
  // First verify session token exists and is valid
  const session = await verifySessionToken(request);

  if (!session) {
    throw new AuthError(
      '请先登录',
      401,
      'UNAUTHORIZED'
    );
  }

  // Get user info from database
  const userResult = await db
    .select({
      id: users.id,
      role: users.role,
      familyId: users.family_id,
    })
    .from(users)
    .where(eq(users.id, session.user_id))
    .limit(1);

  const user = userResult[0];

  if (!user) {
    throw new AuthError(
      '用户不存在',
      401,
      'INVALID_SESSION'
    );
  }

  return {
    userId: user.id,
    role: user.role as 'parent' | 'child' | 'admin',
    familyId: user.familyId ?? undefined,
    sessionId: session.id,
  };
}

/**
 * Require authenticated request (any role)
 *
 * Use this for API endpoints that require login but accept any role
 *
 * @param request - NextRequest object
 * @returns Session data with user info
 * @throws AuthError if not authenticated
 *
 * @example
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const session = await requireAuth(req);
 *   // session.userId, session.role, etc. available
 * }
 * ```
 */
export async function requireAuth(request: NextRequest): Promise<AuthSession> {
  return verifyAuthSession(request);
}

/**
 * Require parent authentication
 *
 * Use this for API endpoints that only parents can access
 *
 * @param request - NextRequest object
 * @returns Session data with parent user info
 * @throws AuthError if not a parent
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const session = await requireParentAuth(req);
 *   // session.userId is guaranteed to be a parent
 *   // session.familyId is available
 * }
 * ```
 */
export async function requireParentAuth(request: NextRequest): Promise<AuthSession & { familyId: string }> {
  const session = await verifyAuthSession(request);

  if (session.role !== 'parent') {
    throw new AuthError(
      '只有家长可以执行此操作',
      403,
      'FORBIDDEN'
    );
  }

  if (!session.familyId) {
    throw new AuthError(
      '用户未加入家庭',
      403,
      'FORBIDDEN'
    );
  }

  return {
    ...session,
    familyId: session.familyId,
  };
}

/**
 * Require child authentication
 *
 * Use this for API endpoints that only children can access
 *
 * @param request - NextRequest object
 * @returns Session data with child user info
 * @throws AuthError if not a child
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const session = await requireChildAuth(req);
 *   // session.userId is guaranteed to be a child
 *   // session.familyId is available
 * }
 * ```
 */
export async function requireChildAuth(request: NextRequest): Promise<AuthSession & { familyId: string }> {
  const session = await verifyAuthSession(request);

  if (session.role !== 'child') {
    throw new AuthError(
      '此功能仅供儿童使用',
      403,
      'FORBIDDEN'
    );
  }

  if (!session.familyId) {
    throw new AuthError(
      '用户未加入家庭',
      403,
      'FORBIDDEN'
    );
  }

  return {
    ...session,
    familyId: session.familyId,
  };
}

/**
 * Optional authentication - returns session if available, null otherwise
 *
 * Use this for API endpoints that work with or without authentication
 *
 * @param request - NextRequest object
 * @returns Session data or null if not authenticated
 *
 * @example
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const session = await optionalAuth(req);
 *   if (session) {
 *     // Authenticated path
 *   } else {
 *     // Public path
 *   }
 * }
 * ```
 */
export async function optionalAuth(request: NextRequest): Promise<AuthSession | null> {
  try {
    return await verifyAuthSession(request);
  } catch {
    return null;
  }
}
