/**
 * Get Audit Logs API
 *
 * Story 2.10 Task 5: Add approval history and audit log UI
 *
 * GET /api/audit-logs
 * Headers: Cookie (session)
 * Query: { limit?: number, actionType?: string }
 * Response: { auditLogs: AuditLog[] }
 *
 * Source: Story 2.10 AC3 - 审批操作记录到审计日志（NFR14）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getAuditLogsByUserId } from '@/lib/db/queries/audit-logs';

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
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get audit logs for the user
    const auditLogs = await getAuditLogsByUserId(
      user.id,
      Math.min(limit, 200) // Cap at 200
    );

    return NextResponse.json({
      auditLogs: auditLogs.map(log => ({
        ...log,
        created_at: log.created_at ? new Date(log.created_at).toISOString() : null,
      })),
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
