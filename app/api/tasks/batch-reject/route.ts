/**
 * Batch Reject Tasks API
 *
 * Story 2.7: Parent Batch Approves Tasks
 * Task 4.6: 更新API端点支持批量驳回
 * Task 5: 实现单个任务审批功能 (reuses batch endpoint)
 *
 * POST /api/tasks/batch-reject
 * Body: { taskIds: string[], reason: string }
 * Response: { success: boolean, rejectedCount: number }
 *
 * Source: Story 2.7 AC - 批量驳回：一次性驳回所有选中任务，需填写驳回原因
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getTaskById } from '@/lib/db/queries/tasks';
import { batchRejectTasks } from '@/lib/services/points-calculator';
import { logUserAction } from '@/lib/db/queries/audit-logs';

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

    // Validate user is parent
    if (user.role !== 'parent') {
      return NextResponse.json(
        { error: '只有家长可以审批任务' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { taskIds, reason } = body as { taskIds: string[], reason: string };

    // Validate task IDs
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: '请选择要驳回的任务' },
        { status: 400 }
      );
    }

    if (taskIds.length > 50) {
      return NextResponse.json(
        { error: '最多只能同时驳回50个任务' },
        { status: 400 }
      );
    }

    // Validate rejection reason
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: '请填写驳回原因' },
        { status: 400 }
      );
    }

    if (reason.length > 200) {
      return NextResponse.json(
        { error: '驳回原因不能超过200个字符' },
        { status: 400 }
      );
    }

    // Validate all tasks exist and belong to user's family
    for (const taskId of taskIds) {
      const task = await getTaskById(taskId);
      if (!task) {
        return NextResponse.json(
          { error: `任务不存在: ${taskId}` },
          { status: 404 }
        );
      }

      if (task.family_id !== user.family_id) {
        return NextResponse.json(
          { error: '无权审批此任务' },
          { status: 403 }
        );
      }

      // Only reject completed tasks
      if (task.status !== 'completed') {
        return NextResponse.json(
          { error: `任务状态不正确: ${task.title} (当前: ${task.status})` },
          { status: 400 }
        );
      }
    }

    // Batch reject tasks
    const result = await batchRejectTasks(taskIds, reason, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '驳回失败' },
        { status: 500 }
      );
    }

    // Create audit log
    await logUserAction(
      user.id,
      'batch_reject_tasks',
      {
        taskIds,
        rejectedCount: result.rejectedCount,
        reason,
      },
      request.headers.get('x-forwarded-for') || null
    );

    return NextResponse.json({
      success: true,
      rejectedCount: result.rejectedCount,
      message: `已驳回 ${result.rejectedCount} 个任务`,
    });
  } catch (error) {
    console.error('Batch reject error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
