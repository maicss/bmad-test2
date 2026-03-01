import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { suspendUserAccount, invalidateUserSessions } from '@/lib/db/queries/members';

/**
 * Suspend User Account API Endpoint
 *
 * Suspends a child account, preventing login and invalidating all active sessions
 *
 * Requires authentication and primary parent role
 *
 * Source: Story 1.7 AC #2, #7
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const { memberId } = params;

    // Get session token from cookie
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSessionByToken(sessionToken);
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: '会话已过期，请重新登录' },
        { status: 401 }
      );
    }

    // Get primary parent user
    const primaryParent = await getUserById(session.user_id);
    if (!primaryParent) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // Check if user is primary parent
    if (primaryParent.role !== 'parent') {
      return NextResponse.json(
        { error: '只有主要家长可以挂起账户' },
        { status: 403 }
      );
    }

    // Get target user
    const targetUser = await getUserById(memberId);
    if (!targetUser) {
      return NextResponse.json(
        { error: '目标用户不存在' },
        { status: 404 }
      );
    }

    // Check if users are in the same family
    if (targetUser.family_id !== primaryParent.family_id) {
      return NextResponse.json(
        { error: '只能挂起同一家庭的成员' },
        { status: 403 }
      );
    }

    // Get suspension reason from request body
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: '请提供挂起原因' },
        { status: 400 }
      );
    }

    // Suspend user account
    const suspendedUser = await suspendUserAccount(
      memberId,
      session.user_id,
      reason.trim()
    );

    // Invalidate all active sessions for the suspended user
    await invalidateUserSessions(memberId);

    return NextResponse.json({
      success: true,
      message: '账户已挂起',
      user: {
        id: suspendedUser.id,
        name: suspendedUser.name,
        is_suspended: suspendedUser.is_suspended,
        suspended_at: suspendedUser.suspended_at,
        suspended_reason: suspendedUser.suspended_reason,
      },
    });
  } catch (error) {
    console.error('Suspend user account error:', error);
    return NextResponse.json(
      { error: '挂起账户失败，请稍后重试' },
      { status: 500 }
    );
  }
}
