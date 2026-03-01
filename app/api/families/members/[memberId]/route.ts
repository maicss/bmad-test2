import { NextRequest, NextResponse } from 'next/server';
import { suspendUserAccount, resumeUserAccount } from '@/lib/db/queries/members';
import { verifySessionToken } from '@/lib/auth/session-utils';
import { logUserAction } from '@/lib/db/queries/audit-logs';

/**
 * Suspend family member
 *
 * Story 1.7 Task 3 - Family Member Management API
 *
 * POST /api/families/members/[memberId]/suspend
 *
 * Suspends a family member account (children only)
 *
 * AC #2: 主要家长可以挂起儿童账户
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    // Verify session
    const session = await verifySessionToken(request);
    if (!session) {
      return NextResponse.json(
        { error: '未登录或会话已过期' },
        { status: 401 }
      );
    }

    const { memberId } = params;

    // Get request body
    const body = await request.json();
    const { reason } = body;

    // Suspend user account
    const updatedUser = await suspendUserAccount(
      memberId,
      session.user_id,
      reason || '家长挂起'
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: '用户不存在或挂起失败' },
        { status: 404 }
      );
    }

    // Log suspension action
    await logUserAction(session.user_id, 'suspend_member', {
      target_user_id: memberId,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: '账户已挂起',
      user_id: memberId,
    });
  } catch (error: any) {
    console.error('Suspend member error:', error);
    return NextResponse.json(
      { error: error.message || '挂起失败' },
      { status: 400 }
    );
  }
}

/**
 * Resume suspended family member
 *
 * Story 1.7 Task 3 - Family Member Management API
 *
 * POST /api/families/members/[memberId]/resume
 *
 * Resumes a suspended family member account
 *
 * AC #3: 主要家长可以恢复已挂起的儿童账户
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    // Verify session
    const session = await verifySessionToken(request);
    if (!session) {
      return NextResponse.json(
        { error: '未登录或会话已过期' },
        { status: 401 }
      );
    }

    const { memberId } = params;

    // Resume user account
    const updatedUser = await resumeUserAccount(memberId, session.user_id);

    if (!updatedUser) {
      return NextResponse.json(
        { error: '用户不存在或恢复失败' },
        { status: 404 }
      );
    }

    // Log resumption action
    await logUserAction(session.user_id, 'resume_member', {
      target_user_id: memberId,
    });

    return NextResponse.json({
      success: true,
      message: '账户已恢复',
      user_id: memberId,
    });
  } catch (error: any) {
    console.error('Resume member error:', error);
    return NextResponse.json(
      { error: error.message || '恢复失败' },
      { status: 400 }
    );
  }
}
