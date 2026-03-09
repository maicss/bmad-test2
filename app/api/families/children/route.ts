/**
 * Family Children API Endpoint
 *
 * Story 2.6: Parent Uses Template to Quickly Create Task
 *
 * GET /api/families/children - Get children in the family
 *
 * Source: Story 2.6 Task 3
 * Source: _bmad-output/project-context.md - RED LIST rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getFamilyChildren } from '@/lib/db/queries/users';

/**
 * GET /api/families/children - Get children in the family
 *
 * Returns all children in the authenticated user's family.
 *
 * Response:
 * - 200: Children retrieved successfully
 * - 401: Unauthorized
 * - 500: Server error
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

    if (!user.family_id) {
      return NextResponse.json(
        { error: '用户未加入家庭' },
        { status: 400 }
      );
    }

    // Get children in the family
    const children = await getFamilyChildren(user.family_id);

    return NextResponse.json({
      success: true,
      children,
    });
  } catch (error) {
    console.error('Get family children error:', error);
    return NextResponse.json(
      { error: '获取儿童列表失败，请稍后重试' },
      { status: 500 }
    );
  }
}
