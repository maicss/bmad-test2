/**
 * Get Notifications API
 *
 * Story 2.10 Task 4: Implement real-time notifications
 * Subtask 4.2: Send notification to child on approval
 *
 * GET /api/notifications
 * Headers: Cookie (session)
 * Query: { unreadOnly?: boolean, limit?: number }
 * Response: { notifications: Notification[], unreadCount: number }
 *
 * Source: Story 2.10 AC4 - 审批通过后积分变动通知立即推送给孩子
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getNotificationsByUserId, getUnreadNotificationCount } from '@/lib/db/queries/notifications';

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get notifications
    const notifications = await getNotificationsByUserId(
      user.id,
      unreadOnly,
      Math.min(limit, 100) // Cap at 100
    );

    // Get unread count
    const unreadCount = await getUnreadNotificationCount(user.id);

    return NextResponse.json({
      notifications: notifications.map(n => ({
        ...n,
        created_at: n.created_at ? new Date(n.created_at).toISOString() : null,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
