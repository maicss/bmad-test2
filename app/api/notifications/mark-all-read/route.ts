/**
 * Mark All Notifications as Read API
 *
 * Story 2.10 Task 4: Implement real-time notifications
 *
 * POST /api/notifications/mark-all-read
 * Headers: Cookie (session)
 * Body: {} (empty - uses session user)
 * Response: { success: true, markedCount: number }
 *
 * Source: Notification state management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { markAllNotificationsAsRead } from '@/lib/db/queries/notifications';

export async function POST(request: NextRequest) {
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

    // Mark all as read
    const markedCount = await markAllNotificationsAsRead(user.id);

    return NextResponse.json({
      success: true,
      markedCount,
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
