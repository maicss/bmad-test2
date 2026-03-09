import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';

/**
 * Get Current User API Endpoint
 *
 * Returns the current authenticated user's information
 * Used by frontend to check authentication status and user role
 *
 * Source: Dashboard redirection logic
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSessionByToken(sessionToken);

    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get user data
    const user = await getUserById(session.user_id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        family_id: user.family_id,
      },
      session: {
        id: session.id,
        expires_at: session.expires_at,
      },
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
