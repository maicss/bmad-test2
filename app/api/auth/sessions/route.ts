import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session-utils';
import {
  getActiveSessionsByUserId,
  deactivateAllUserSessions,
} from '@/lib/db/queries/sessions';

/**
 * List all active sessions for the authenticated user
 *
 * Story 1.6 Task 3 - Session Management API
 *
 * GET /api/auth/sessions
 *
 * Returns:
 * - List of all active sessions for the user
 * - Each session includes: device info, last activity, IP address
 *
 * AC #5: 家长可以在账号设置中查看所有活跃的登录会话
 */
export async function GET(request: NextRequest) {
  try {
    // Verify session from request
    const session = await verifySessionToken(request);
    if (!session) {
      return NextResponse.json(
        { error: '未登录或会话已过期' },
        { status: 401 }
      );
    }

    // Get all active sessions for the user
    const activeSessions = await getActiveSessionsByUserId(session.user_id);

    // Format response
    const formattedSessions = activeSessions.map(s => ({
      id: s.id,
      device_type: s.device_type,
      device_id: s.device_id,
      user_agent: s.user_agent,
      ip_address: s.ip_address,
      last_activity_at: s.last_activity_at,
      expires_at: s.expires_at,
      remember_me: s.remember_me,
      is_current: s.id === session.id, // Mark current session
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      total: formattedSessions.length,
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: '获取会话列表失败' },
      { status: 500 }
    );
  }
}

/**
 * Delete all active sessions (logout from all devices)
 *
 * Story 1.6 Task 3 - Session Management API
 *
 * DELETE /api/auth/sessions
 *
 * AC #5: 家长可以在账号设置中查看所有活跃的登录会话（支持"退出所有设备"）
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify session from request
    const session = await verifySessionToken(request);
    if (!session) {
      return NextResponse.json(
        { error: '未登录或会话已过期' },
        { status: 401 }
      );
    }

    // Deactivate all sessions for the user
    const result = await deactivateAllUserSessions(session.user_id);

    return NextResponse.json({
      success: true,
      message: `已退出所有设备（${result}个会话）`,
    });
  } catch (error) {
    console.error('Delete all sessions error:', error);
    return NextResponse.json(
      { error: '退出所有设备失败' },
      { status: 500 }
    );
  }
}
