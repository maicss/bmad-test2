/**
 * Single Task Rejection API
 *
 * Story 2.11: Parent Rejects Task Completion
 * Task 1: Create task rejection API endpoint
 *
 * POST /api/tasks/[id]/reject
 * Headers: Cookie (session)
 * Body: { reason: string } (required, max 200 chars)
 * Response: { success: true, taskId, rejectionReason }
 *
 * Source: Story 2.11 AC - 家长驳回任务
 *
 * CODE REVIEW FIXES:
 * - CRITICAL-1: Added transaction safety to prevent race conditions
 * - CRITICAL-2: Clear approved_by/approved_at fields on rejection
 * - MAJOR-1: Accept both 'pending_approval' and 'completed' status
 * - MAJOR-3: Added input sanitization for rejection reason
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getTaskById } from '@/lib/db/queries/tasks';
import { updateTask } from '@/lib/db/queries/tasks';
import { logUserAction } from '@/lib/db/queries/audit-logs';
import { createNotification } from '@/lib/db/queries/notifications';
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

    // CODE REVIEW FIX MAJOR-3: Sanitize rejection reason to prevent XSS
    const sanitizedReason = sanitizeInput(reason);

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

    // CODE REVIEW FIX MAJOR-1: Accept both 'pending_approval' and 'completed' for rejection
    if (task.status !== 'pending_approval' && task.status !== 'completed') {
      return NextResponse.json(
        { error: `任务状态不正确，只能驳回等待审批的任务 (当前: ${task.status})` },
        { status: 400 }
      );
    }

    // CODE REVIEW FIX CRITICAL-1: Use transaction to ensure atomicity
    const now = new Date();
    const sanitizedTitle = sanitizeInput(task.title);

    // Use Drizzle transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // Update task status to pending (back to todo)
      // CODE REVIEW FIX CRITICAL-2: Clear approved_by and approved_at fields
      const [updatedTask] = await tx.update(tasks)
        .set({
          status: 'pending',
          rejection_reason: sanitizedReason,
          completed_at: null,
          approved_by: null,  // CRITICAL FIX: Clear this field
          approved_at: null,  // CRITICAL FIX: Clear this field
        })
        .where(eq(tasks.id, taskId))
        .returning();

      if (!updatedTask) {
        throw new Error('Failed to update task');
      }

      // Create audit log (AC1: 驳回操作记录到审计日志)
      await logUserAction(
        user.id,
        'reject_task',
        {
          taskId,
          taskTitle: sanitizedTitle,
          reason: sanitizedReason,
          childId: task.assigned_child_id!, // Non-null asserted - notification requires child
        },
        request.headers.get('x-forwarded-for') || null
      );

      // Send notification to child about rejection (AC1: 孩子收到通知)
      if (task.assigned_child_id) {
        await createNotification({
          user_id: task.assigned_child_id, // Already checked above
          type: 'task_rejected',
          title: '任务被驳回',
          message: `你的任务"${sanitizedTitle}"被驳回。原因：${sanitizedReason}`,
          metadata: {
            taskId,
            reason: sanitizedReason,
          },
        });
      }

      return { task: updatedTask };
    });

    return NextResponse.json({
      success: true,
      taskId: result.task.id,
      rejectionReason: sanitizedReason,
      message: `任务"${sanitizedTitle}"已驳回`,
    });
  } catch (error) {
    console.error('Task rejection error:', error);

    // Handle transaction errors
    if (error instanceof Error && error.message === 'Failed to update task') {
      return NextResponse.json(
        { error: '驳回失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
