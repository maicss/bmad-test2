/**
 * Batch Approve Tasks API
 *
 * Story 2.7: Parent Batch Approves Tasks
 * Task 3.5: 更新API端点支持批量通过
 * Task 5: 实现单个任务审批功能 (reuses batch endpoint)
 *
 * POST /api/tasks/batch-approve
 * Body: { taskIds: string[] }
 * Response: { success: boolean, approvedCount: number, totalPoints: number }
 *
 * Source: Story 2.7 AC - 批量通过：一次性审批所有选中任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getTasksByIds } from '@/lib/db/queries/tasks';
import { batchApproveTasks } from '@/lib/services/points-calculator';
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
    const { taskIds } = body as { taskIds: string[] };

    // Validate task IDs
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: '请选择要审批的任务' },
        { status: 400 }
      );
    }

    if (taskIds.length > 50) {
      return NextResponse.json(
        { error: '最多只能同时审批50个任务' },
        { status: 400 }
      );
    }

    // Validate all tasks exist and belong to user's family (batch query - fixes N+1 issue)
    const tasks = await getTasksByIds(taskIds);

    // Check for missing tasks
    const missingTaskIndex = tasks.findIndex(t => t === null);
    if (missingTaskIndex !== -1) {
      return NextResponse.json(
        { error: `任务不存在: ${taskIds[missingTaskIndex]}` },
        { status: 404 }
      );
    }

    // Validate family ownership and status
    const APPROVAL_PENDING_STATUSES = ['completed', 'pending_approval'];
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]!;
      if (task.family_id !== user.family_id) {
        return NextResponse.json(
          { error: '无权审批此任务' },
          { status: 403 }
        );
      }

      // Only approve tasks that child has marked complete
      // Note: Workflow is: pending → completed (child marks done) → approved (parent approves)
      // The 'completed' status means child finished and is waiting for parent approval
      if (!APPROVAL_PENDING_STATUSES.includes(task.status)) {
        return NextResponse.json(
          { error: `任务状态不正确: ${task.title} (当前: ${task.status})` },
          { status: 400 }
        );
      }
    }

    // Batch approve tasks
    const result = await batchApproveTasks(taskIds, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '审批失败' },
        { status: 500 }
      );
    }

    // Create audit log
    await logUserAction(
      user.id,
      'batch_approve_tasks',
      {
        taskIds,
        approvedCount: result.approvedCount,
        totalPoints: result.totalPoints,
      },
      request.headers.get('x-forwarded-for') || null
    );

    return NextResponse.json({
      success: true,
      approvedCount: result.approvedCount,
      totalPoints: result.totalPoints,
      message: `已通过 ${result.approvedCount} 个任务，+${result.totalPoints} 积分`,
    });
  } catch (error) {
    console.error('Batch approve error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
