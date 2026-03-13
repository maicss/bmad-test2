/**
 * Mark Notification as Read API
 *
 * Story 2.10 Task 4: Implement real-time notifications
 *
 * PATCH /api/notifications/[id]/read
 * Headers: Cookie (session)
 * Response: { success: true, notification: Notification }
 *
 * Source: Notification state management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { markNotificationAsRead } from '@/lib/db/queries/notifications';
import { getNotificationById } from '@/lib/db/queries/notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;

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

    // Get notification to verify ownership
    const notification = await getNotificationById(notificationId);
    if (!notification) {
      return NextResponse.json(
        { error: '通知不存在' },
        { status: 404 }
      );
    }

    if (notification.user_id !== user.id) {
      return NextResponse.json(
        { error: '无权操作此通知' },
        { status: 403 }
      );
    }

    // Mark as read
    const updated = await markNotificationAsRead(notificationId);

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
