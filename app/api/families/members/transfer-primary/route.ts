import { NextRequest, NextResponse } from 'next/server';
import { transferPrimaryParentRole } from '@/lib/db/queries/members';
import { verifySessionToken } from '@/lib/auth/session-utils';
import { logUserAction } from '@/lib/db/queries/audit-logs';

/**
 * Transfer primary parent role
 *
 * Story 1.7 Task 3 - Family Member Management API
 *
 * POST /api/families/members/transfer-primary
 *
 * Transfers primary parent role to another parent
 *
 * AC #4: 主要家长可以转移主要家长角色给其他家长
 */
export async function POST(request: NextRequest) {
  try {
    // Verify session
    const session = await verifySessionToken(request);
    if (!session) {
      return NextResponse.json(
        { error: '未登录或会话已过期' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { newPrimaryId, familyId, password } = body;

    // Validate inputs
    if (!newPrimaryId || !familyId || !password) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // Transfer primary role
    const updatedFamily = await transferPrimaryParentRole(
      session.user_id,
      newPrimaryId,
      familyId,
      password
    );

    if (!updatedFamily) {
      return NextResponse.json(
        { error: updatedFamily || '角色转移失败' },
        { status: 400 }
      );
    }

    // Log transfer action
    await logUserAction(session.user_id, 'transfer_primary_role', {
      old_primary_id: session.user_id,
      new_primary_id: newPrimaryId,
      family_id: familyId,
    });

    return NextResponse.json({
      success: true,
      message: '主要家长角色已转移',
      family: updatedFamily,
    });
  } catch (error: any) {
    console.error('Transfer primary role error:', error);
    return NextResponse.json(
      { error: error.message || '角色转移失败' },
      { status: 400 }
    );
  }
}
