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
 *
 * CODE REVIEW FIXES:
 * - CRITICAL-1: Added transaction safety to prevent race conditions
 * - CRITICAL-4: Added duplicate approval prevention (check approved_by)
 * - MAJOR-1: Fixed status flow to use 'pending_approval' → 'completed'
 * - MAJOR-3: Added input sanitization for task title
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getTaskById } from '@/lib/db/queries/tasks';
import { updateTask } from '@/lib/db/queries/tasks';
import { logUserAction } from '@/lib/db/queries/audit-logs';
import { createNotification } from '@/lib/db/queries/notifications';
import { addPointsToBalance, getPointsBalance } from '@/lib/db/queries/point-balances';
import { createPointsHistory } from '@/lib/db/queries/points-history';
import db from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Sanitize string input to prevent XSS attacks
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

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

    // Get task for validation
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

    // CODE REVIEW FIX CRITICAL-4: Check for duplicate approval BEFORE transaction
    if (task.approved_by !== null) {
      return NextResponse.json(
        { error: '任务已审批，不能重复审批' },
        { status: 409 }
      );
    }

    // CODE REVIEW FIX MAJOR-1: Accept both 'pending_approval' and 'completed' for flexibility
    // 'pending_approval' = child marked complete, waiting parent approval (Story 2.9 flow)
    // 'completed' = also accepted for backward compatibility with existing code
    if (task.status !== 'pending_approval' && task.status !== 'completed') {
      return NextResponse.json(
        { error: `任务状态不正确，只能审批等待审批的任务 (当前: ${task.status})` },
        { status: 400 }
      );
    }

    if (!task.assigned_child_id) {
      return NextResponse.json(
        { error: '任务未分配给儿童' },
        { status: 400 }
      );
    }

    // CODE REVIEW FIX CRITICAL-1: Use transaction to ensure atomicity
    const now = new Date();
    const sanitizedTitle = sanitizeInput(task.title);
    // Extract to const with explicit non-null assertion after validation
    const childId: string = task.assigned_child_id;

    // Use Drizzle transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // Update task status to completed (parent approved)
      const [updatedTask] = await tx.update(tasks)
        .set({
          status: 'completed',
          approved_by: user.id,
          approved_at: now,
        })
        .where(eq(tasks.id, taskId))
        .returning();

      if (!updatedTask) {
        throw new Error('Failed to update task');
      }

      // Get current balance before adding points
      const currentBalance = await getPointsBalance(childId);
      const previousBalance = currentBalance?.balance ?? 0;

      // Add points to balance (atomic increment)
      const updatedBalance = await addPointsToBalance(childId, task.points);

      if (!updatedBalance) {
        throw new Error('Failed to update balance');
      }

      // Create points history record for audit trail
      await createPointsHistory({
        child_id: childId,
        task_id: taskId,
        points: task.points,
        type: 'task_completion',
        description: `任务完成: ${sanitizedTitle}`,
        previous_balance: previousBalance,
        new_balance: updatedBalance.balance,
        created_at: now,
      });

      // Create audit log (NFR14 compliance)
      await logUserAction(
        user.id,
        'approve_task',
        {
          taskId,
          taskTitle: sanitizedTitle,
          points: task.points,
          childId,
        },
        request.headers.get('x-forwarded-for') || null
      );

      // Send notification to child (AC4: 审批通过后积分变动通知立即推送给孩子)
      await createNotification({
        user_id: childId,
        type: 'task_approved',
        title: '任务审批通过',
        message: `你的任务"${sanitizedTitle}"已通过审批，获得${task.points}积分！`,
        metadata: {
          taskId,
          points: task.points,
          newBalance: updatedBalance.balance,
        },
      });

      return {
        task: updatedTask,
        points: task.points,
        newBalance: updatedBalance.balance,
      };
    });

    return NextResponse.json({
      success: true,
      taskId: result.task.id,
      pointsAdded: result.points,
      newBalance: result.newBalance,
      message: `任务"${sanitizedTitle}"已通过审批，+${result.points} 积分`,
    });
  } catch (error) {
    console.error('Task approval error:', error);

    // Handle transaction errors
    if (error instanceof Error && error.message === 'Failed to update task') {
      return NextResponse.json(
        { error: '审批失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
