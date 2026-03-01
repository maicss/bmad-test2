import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { resumeUserAccount } from '@/lib/db/queries/members';

/**
 * Resume Suspended User Account API Endpoint
 *
 * Resumes a suspended child account, allowing login again
 *
 * Requires authentication and primary parent role
 *
 * Source: Story 1.7 AC #3
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
        { error: '只有主要家长可以恢复账户' },
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
        { error: '只能恢复同一家庭的成员' },
        { status: 403 }
      );
    }

    // Resume user account
    const resumedUser = await resumeUserAccount(
      memberId,
      session.user_id
    );

    return NextResponse.json({
      success: true,
      message: '账户已恢复',
      user: {
        id: resumedUser.id,
        name: resumedUser.name,
        is_suspended: resumedUser.is_suspended,
      },
    });
  } catch (error) {
    console.error('Resume user account error:', error);
    return NextResponse.json(
      { error: '恢复账户失败，请稍后重试' },
      { status: 500 }
    );
  }
}
