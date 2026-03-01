import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getMemberAuditLogs } from '@/lib/db/queries/members';

/**
 * Get Member Audit Logs API Endpoint
 *
 * Returns audit logs for a specific family member
 *
 * Requires authentication and primary parent role
 *
 * Source: Story 1.7 AC #5
 */
export async function GET(
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
        { error: '只有主要家长可以查看审计日志' },
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
        { error: '只能查看同一家庭成员的审计日志' },
        { status: 403 }
      );
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const validLimit = Math.min(Math.max(limit, 1), 500);

    // Get audit logs
    const auditLogs = await getMemberAuditLogs(memberId, validLimit);

    return NextResponse.json({
      success: true,
      member: {
        id: targetUser.id,
        name: targetUser.name,
      },
      audit_logs: auditLogs,
    });
  } catch (error) {
    console.error('Get member audit logs error:', error);
    return NextResponse.json(
      { error: '获取审计日志失败，请稍后重试' },
      { status: 500 }
    );
  }
}
