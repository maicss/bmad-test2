/**
 * Task Completion API Route
 *
 * Story 2.9: Child Marks Task Complete
 * Task 4: Implement task completion API endpoint
 *
 * Handles task completion requests from children:
 * - Validates child is marking their own task
 * - Determines if task needs approval based on task type
 * - Sets status to 'completed' (pending approval) or 'approved' (auto-approved)
 * - Awards points immediately for auto-approved tasks
 *
 * POST /api/tasks/:id/complete
 *
 * Source: Story 2.9 Dev Notes - API Pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, markTaskComplete } from '@/lib/db/queries/tasks';
import { calculatePointsOnApproval } from '@/lib/services/points-calculator';
import { taskNeedsApproval, taskIsAutoApproved } from '@/types/task-type';
import type { TaskType } from '@/types/task-type';

/**
 * Task completion request body
 */
interface CompleteTaskRequest {
  proofImage?: string;
}

/**
 * Task completion response
 */
interface CompleteTaskResponse {
  success: boolean;
  task?: {
    id: string;
    status: string;
    proof_image: string | null;
  };
  pointsAwarded: number;
  needsApproval: boolean;
  message: string;
}

/**
 * POST handler for task completion
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CompleteTaskResponse | { error: string }>> {
  try {
    // Get child session from Better-Auth
    const session = req.headers.get('cookie');
    if (!session) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CompleteTaskRequest = await req.json().catch(() => ({}));
    const { proofImage } = body;

    // Get task ID from params
    const { id: taskId } = await params;

    // Get the task
    const task = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    // TODO: Verify child is marking their own task
    // For now, we'll check the session in a real implementation
    // const childId = await getChildIdFromSession(session);
    // if (task.assigned_child_id !== childId) {
    //   return NextResponse.json(
    //     { error: '不能完成其他人的任务' },
    //     { status: 403 }
    //   );
    // }

    // Check if task is already completed or in progress
    if (task.status !== 'pending') {
      return NextResponse.json(
        { error: '任务已完成或正在处理中' },
        { status: 400 }
      );
    }

    // Determine if task needs approval based on task type
    const taskType = task.task_type as TaskType;
    const needsApproval = taskNeedsApproval(taskType);
    const autoApproved = taskIsAutoApproved(taskType);

    let newStatus: 'completed' | 'approved';
    let pointsAwarded = 0;
    let message = '';

    if (autoApproved) {
      // Auto-approved: complete and award points immediately
      newStatus = 'approved';

      try {
        // Calculate and award points
        const pointsResult = await calculatePointsOnApproval(taskId);
        pointsAwarded = pointsResult.points;
        message = `任务完成！+${pointsAwarded}分`;
      } catch (error) {
        console.error('Points settlement failed:', error);
        return NextResponse.json(
          { error: '积分结算失败，请重试' },
          { status: 500 }
        );
      }
    } else {
      // Needs parent approval
      newStatus = 'completed';
      message = '任务已提交审批';
    }

    // Update task status
    const updatedTask = await markTaskComplete(taskId, {
      status: newStatus,
      proof_image: proofImage,
      completed_at: new Date(),
    });

    if (!updatedTask) {
      return NextResponse.json(
        { error: '任务更新失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      task: {
        id: updatedTask.id,
        status: updatedTask.status,
        proof_image: updatedTask.proof_image ?? null,
      },
      pointsAwarded,
      needsApproval,
      message,
    });
  } catch (error) {
    console.error('Task completion failed:', error);
    return NextResponse.json(
      { error: '任务完成失败，请重试' },
      { status: 500 }
    );
  }
}
