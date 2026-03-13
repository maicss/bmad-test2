/**
 * Single Task Approval API
 *
 * Story 2.10: Parent Approves Task Completion
 * Task 1: Create task approval API endpoint
 *
 * POST /api/tasks/[id]/approve
 * Headers: Cookie (session)
 * Body: {} (empty)
 * Response: { success: true, taskId, pointsAdded }
 *
 * Source: Story 2.10 AC - 家长审批任务通过
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getTaskById } from '@/lib/db/queries/tasks';
import { calculatePointsOnApproval } from '@/lib/services/points-calculator';
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

    // Only approve completed tasks
    if (task.status !== 'completed') {
      return NextResponse.json(
        { error: `任务状态不正确，只能审批已完成的任务 (当前: ${task.status})` },
        { status: 400 }
      );
    }

    // Calculate points and update balance
    const pointsResult = await calculatePointsOnApproval(taskId);

    // Update task status to approved
    const approvedTask = await updateTask(taskId, {
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date(),
    });

    if (!approvedTask) {
      return NextResponse.json(
        { error: '审批失败，请稍后重试' },
        { status: 500 }
      );
    }

    // Create audit log
    await logUserAction(
      user.id,
      'approve_task',
      {
        taskId,
        taskTitle: task.title,
        points: pointsResult.points,
        childId: pointsResult.childId,
      },
      request.headers.get('x-forwarded-for') || null
    );

    // Send notification to child (AC4: 审批通过后积分变动通知立即推送给孩子)
    if (task.assigned_child_id) {
      await createNotification({
        user_id: task.assigned_child_id,
        type: 'task_approved',
        title: '任务审批通过',
        message: `你的任务"${task.title}"已通过审批，获得${pointsResult.points}积分！`,
        metadata: {
          taskId,
          points: pointsResult.points,
          newBalance: pointsResult.newBalance,
        },
      });
    }

    return NextResponse.json({
      success: true,
      taskId,
      pointsAdded: pointsResult.points,
      newBalance: pointsResult.newBalance,
      message: `任务"${task.title}"已通过审批，+${pointsResult.points} 积分`,
    });
  } catch (error) {
    console.error('Task approval error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
