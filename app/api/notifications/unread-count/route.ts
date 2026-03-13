/**
 * Get Unread Notification Count API
 *
 * Story 2.10 Task 4: Implement real-time notifications
 * Lightweight endpoint for notification badge polling
 *
 * GET /api/notifications/unread-count
 * Headers: Cookie (session)
 * Response: { count: number }
 *
 * Source: Story 2.10 AC4 - 实时推送通知（< 3秒）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getUnreadNotificationCount } from '@/lib/db/queries/notifications';

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

    // Get unread count
    const count = await getUnreadNotificationCount(user.id);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
