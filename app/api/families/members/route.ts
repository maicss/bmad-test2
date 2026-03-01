import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getFamilyMembers } from '@/lib/db/queries/members';

/**
 * List Family Members API Endpoint
 *
 * Returns all family members for the authenticated user's family
 *
 * Requires authentication and primary parent role
 *
 * Source: Story 1.7 AC #1
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get user
    const user = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // Check if user is primary parent
    if (user.role !== 'parent') {
      return NextResponse.json(
        { error: '只有主要家长可以查看家庭成员' },
        { status: 403 }
      );
    }

    // Get all family members
    const members = await getFamilyMembers(user.family_id!);

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error('Get family members error:', error);
    return NextResponse.json(
      { error: '获取家庭成员失败，请稍后重试' },
      { status: 500 }
    );
  }
}
