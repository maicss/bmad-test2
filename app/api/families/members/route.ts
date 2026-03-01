import { NextRequest, NextResponse } from 'next/server';
import { getFamilyMembers } from '@/lib/db/queries/members';
import { verifySessionToken } from '@/lib/auth/session-utils';
import { logUserAction } from '@/lib/db/queries/audit-logs';

/**
 * List all family members
 *
 * Story 1.7 Task 3 - Family Member Management API
 *
 * GET /api/families/members?familyId=xxx
 *
 * Returns all family members with status and role information
 *
 * AC #1: 主要家长可以查看所有家庭成员列表
 */
export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await verifySessionToken(request);
    if (!session) {
      return NextResponse.json(
        { error: '未登录或会话已过期' },
        { status: 401 }
      );
    }

    // Get familyId from query params
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json(
        { error: '缺少家庭 ID' },
        { status: 400 }
      );
    }

    // Get family members
    const members = await getFamilyMembers(familyId);

    // Log view action
    await logUserAction(session.user_id, 'view_family_members', {
      family_id: familyId,
      member_count: members.length,
    });

    return NextResponse.json({
      success: true,
      family_id: familyId,
      members,
      total: members.length,
    });
  } catch (error) {
    console.error('Get family members error:', error);
    return NextResponse.json(
      { error: '获取家庭成员列表失败' },
      { status: 500 }
    );
  }
}
