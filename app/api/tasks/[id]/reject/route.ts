/**
 * Single Task Rejection API
 *
 * Story 2.10: Parent Approves Task Completion
 * Task 2: Create task rejection API endpoint
 *
 * POST /api/tasks/[id]/reject
 * Headers: Cookie (session)
 * Body: { reason: string } (required, max 200 chars)
 * Response: { success: true, taskId }
 *
 * Source: Story 2.10 AC - 家长驳回任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getTaskById } from '@/lib/db/queries/tasks';
import { updateTask } from '@/lib/db/queries/tasks';
import { logUserAction } from '@/lib/db/queries/audit-logs';
import { createNotification } from '@/lib/db/queries/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;

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
    const { reason } = body as { reason: string };

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

    // Get task
    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    // Validate task belongs to user's family
    if (task.family_id !== user.family_id) {
      return NextResponse.json(
        { error: '无权审批此任务' },
        { status: 403 }
      );
    }

    // Only reject completed tasks
    if (task.status !== 'completed') {
      return NextResponse.json(
        { error: `任务状态不正确，只能驳回已完成的任务 (当前: ${task.status})` },
        { status: 400 }
      );
    }

    // Update task status to pending (back to todo) with rejection reason
    const rejectedTask = await updateTask(taskId, {
      status: 'pending',
      rejection_reason: reason,
      completed_at: null, // Clear completion time
      approved_by: user.id,
      approved_at: new Date(),
    });

    if (!rejectedTask) {
      return NextResponse.json(
        { error: '驳回失败，请稍后重试' },
        { status: 500 }
      );
    }

    // Create audit log (AC3: 审批操作记录到审计日志)
    await logUserAction(
      user.id,
      'reject_task',
      {
        taskId,
        taskTitle: task.title,
        reason,
        childId: task.assigned_child_id,
      },
      request.headers.get('x-forwarded-for') || null
    );

    // Send notification to child about rejection
    if (task.assigned_child_id) {
      await createNotification({
        user_id: task.assigned_child_id,
        type: 'task_approved', // Re-using existing type; could add 'task_rejected' later
        title: '任务被驳回',
        message: `你的任务"${task.title}"被驳回。原因：${reason}`,
        metadata: {
          taskId,
          reason,
        },
      });
    }

    return NextResponse.json({
      success: true,
      taskId,
      message: `任务"${task.title}"已驳回`,
    });
  } catch (error) {
    console.error('Task rejection error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
