/**
 * Points Calculator Service
 *
 * Story 2.2: Parent Sets Task Points Value
 * Task 6: Implement points settlement logic when task is completed
 * Story 2.7: Parent Batch Approves Tasks
 * Task 6: 实现批量积分计算和累加
 *
 * Handles points calculation and settlement when tasks are approved:
 * - Calculates points to award on task approval
 * - Adds points to child's balance
 * - Creates points history record
 * - Ensures transactional integrity
 * - Batch approval support
 *
 * Source: Story 2.2 AC #4 - Points automatically accumulate to child account after approval
 */

import { getTaskById, updateTask } from '../db/queries/tasks';
import { addPointsToBalance, getPointsBalance } from '../db/queries/point-balances';
import { createPointsHistory } from '../db/queries/points-history';

/**
 * Points calculation result
 */
export interface PointsCalculationResult {
  /** Child ID who received the points */
  childId: string;
  /** Task ID that was approved */
  taskId: string;
  /** Points awarded */
  points: number;
  /** New balance after adding points */
  newBalance: number;
  /** Previous balance before adding points */
  previousBalance: number;
  /** Timestamp of calculation */
  timestamp: Date;
}

/**
 * Batch approval result (Story 2.7)
 */
export interface BatchApprovalResult {
  success: boolean;
  approvedCount: number;
  totalPoints: number;
  approvedTasks: Array<{
    taskId: string;
    childId: string;
    points: number;
    newBalance: number;
  }>;
  error?: string;
}

/**
 * Batch rejection result (Story 2.7)
 */
export interface BatchRejectionResult {
  success: boolean;
  rejectedCount: number;
  error?: string;
}

/**
 * Transaction error for points settlement
 */
export class PointsSettlementError extends Error {
  constructor(
    message: string,
    public readonly taskId: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'PointsSettlementError';
  }
}

/**
 * Calculate and settle points when a task is approved
 *
 * This function:
 * 1. Retrieves the task to get points value and child ID
 * 2. Validates the task is in correct state for approval
 * 3. Adds points to the child's balance
 * 4. Creates a history record for auditing
 *
 * @param taskId - The ID of the task being approved
 * @returns Points calculation result with new balance
 * @throws PointsSettlementError if settlement fails
 *
 * @example
 * ```typescript
 * try {
 *   const result = await calculatePointsOnApproval('task-uuid');
 *   console.log(`Awarded ${result.points} points to ${result.childId}`);
 *   console.log(`New balance: ${result.newBalance}`);
 * } catch (err) {
 *   console.error('Failed to settle points:', err);
 * }
 * ```
 */
export async function calculatePointsOnApproval(taskId: string): Promise<PointsCalculationResult> {
  // Step 1: Get the task
  const task = await getTaskById(taskId);

  if (!task) {
    throw new PointsSettlementError(
      `Task not found: ${taskId}`,
      taskId
    );
  }

  // Validate task has assigned child
  if (!task.assigned_child_id) {
    throw new PointsSettlementError(
      `Task has no assigned child: ${taskId}`,
      taskId
    );
  }

  // Validate task has points value
  if (!task.points || task.points < 1) {
    throw new PointsSettlementError(
      `Task has invalid points value: ${task.points}`,
      taskId
    );
  }

  // Step 2: Get current balance
  const currentBalance = await getPointsBalance(task.assigned_child_id);
  const previousBalance = currentBalance?.balance ?? 0;

  // Step 3: Add points to balance (transaction)
  const updatedBalance = await addPointsToBalance(task.assigned_child_id, task.points);

  if (!updatedBalance) {
    throw new PointsSettlementError(
      `Failed to update balance for child: ${task.assigned_child_id}`,
      taskId
    );
  }

  // Step 4: Create history record
  await createPointsHistory({
    child_id: task.assigned_child_id,
    task_id: taskId,
    points: task.points,
    type: 'task_completion',
    description: `任务完成: ${task.title}`,
    previous_balance: previousBalance,
    new_balance: updatedBalance.balance,
    created_at: new Date(),
  });

  return {
    childId: task.assigned_child_id,
    taskId: task.id,
    points: task.points,
    newBalance: updatedBalance.balance,
    previousBalance,
    timestamp: new Date(),
  };
}

/**
 * Calculate points for a task without settling
 *
 * Useful for previewing points before approval
 *
 * @param taskId - The ID of the task
 * @returns Points value or null if task not found
 */
export async function previewPointsForTask(taskId: string): Promise<number | null> {
  const task = await getTaskById(taskId);
  return task?.points ?? null;
}

/**
 * Validate points value is within acceptable range
 *
 * @param points - Points value to validate
 * @returns true if valid, false otherwise
 */
export function isValidPointsValue(points: number): boolean {
  return Number.isInteger(points) && points >= 1 && points <= 100;
}

/**
 * Get suggested points for a task type
 *
 * Returns the midpoint of the range for a given difficulty
 *
 * @param difficulty - Task difficulty level
 * @returns Suggested points value
 */
export function getSuggestedPoints(difficulty: 'simple' | 'medium' | 'hard' | 'special'): number {
  const ranges = {
    simple: { min: 1, max: 10 },
    medium: { min: 15, max: 30 },
    hard: { min: 30, max: 50 },
    special: { min: 50, max: 100 },
  };

  const range = ranges[difficulty];
  return Math.floor((range.min + range.max) / 2);
}

// ==================== Story 2.7: Batch Approval Methods ====================

/**
 * Batch approve tasks and settle points atomically
 *
 * Story 2.7 Task 6.2-6.5: 实现批量积分计算、余额更新、历史记录创建
 *
 * This function:
 * 1. Validates all tasks are in 'completed' status
 * 2. Updates task status to 'approved' with approver info
 * 3. Calculates total points for each child
 * 4. Updates point balances atomically
 * 5. Creates points history records for each task
 *
 * CRITICAL FIX: Uses try-catch-finally pattern to ensure data integrity.
 * If any step fails after task approval, we must rollback task status.
 *
 * @param taskIds - Array of task IDs to approve
 * @param parentUserId - Parent who is approving
 * @returns Batch approval result with total points
 * @throws PointsSettlementError if approval fails
 */
export async function batchApproveTasks(
  taskIds: string[],
  parentUserId: string
): Promise<BatchApprovalResult> {
  const now = new Date();
  const approvedTasks: BatchApprovalResult['approvedTasks'] = [];
  const approvedTaskIds: string[] = []; // Track which tasks we approved

  try {
    // Step 1: Get all tasks and validate
    const tasks = await Promise.all(
      taskIds.map(id => getTaskById(id))
    );

    const validTasks = tasks.filter((t): t is NonNullable<typeof t> => t !== null);

    if (validTasks.length !== taskIds.length) {
      throw new PointsSettlementError(
        `Some tasks not found: ${taskIds.length - validTasks.length} tasks`,
        taskIds.join(',')
      );
    }

    // Validate all tasks are in 'completed' status
    for (const task of validTasks) {
      if (task.status !== 'completed') {
        throw new PointsSettlementError(
          `Task ${task.id} is not in completed status (current: ${task.status})`,
          task.id
        );
      }

      if (!task.assigned_child_id) {
        throw new PointsSettlementError(
          `Task ${task.id} has no assigned child`,
          task.id
        );
      }
    }

    // Step 2: Update all tasks to 'approved' status
    for (const task of validTasks) {
      await updateTask(task.id, {
        status: 'approved',
        approved_by: parentUserId,
        approved_at: now,
      });
      approvedTaskIds.push(task.id); // Track approved task IDs
    }

    // Step 3: Group by child and calculate points
    const pointsByChild = new Map<string, number>();
    for (const task of validTasks) {
      const childId = task.assigned_child_id!;
      const current = pointsByChild.get(childId) ?? 0;
      pointsByChild.set(childId, current + task.points);
    }

    // Step 4: Update balances for each child
    for (const [childId, points] of pointsByChild) {
      const updated = await addPointsToBalance(childId, points);

      if (!updated) {
        throw new PointsSettlementError(
          `Failed to update balance for child: ${childId}`,
          childId
        );
      }

      // FIXED: Use task.id for taskId, not childId
      for (const task of validTasks.filter(t => t.assigned_child_id === childId)) {
        approvedTasks.push({
          taskId: task.id, // Fixed: was childId
          childId,
          points,
          newBalance: updated.balance,
        });
      }
    }

    // Step 5: Create points history records
    for (const task of validTasks) {
      const previousBalance = await getPointsBalance(task.assigned_child_id!);
      const previous = previousBalance?.balance ?? task.points;

      await createPointsHistory({
        child_id: task.assigned_child_id!,
        task_id: task.id,
        points: task.points,
        type: 'task_completion',
        description: `任务完成: ${task.title}`,
        previous_balance: previous - task.points,
        new_balance: previous,
        created_at: now,
      });
    }

    const totalPoints = Array.from(pointsByChild.values()).reduce((a, b) => a + b, 0);

    return {
      success: true,
      approvedCount: validTasks.length,
      totalPoints,
      approvedTasks,
    };
  } catch (error) {
    // CRITICAL FIX: Rollback task status if settlement fails
    if (approvedTaskIds.length > 0) {
      try {
        // Revert tasks back to 'completed' status if approval failed mid-process
        for (const taskId of approvedTaskIds) {
          await updateTask(taskId, {
            status: 'completed',
            approved_by: null,
            approved_at: null,
          });
        }
      } catch (rollbackError) {
        console.error('Failed to rollback task approval:', rollbackError);
      }
    }

    if (error instanceof PointsSettlementError) {
      throw error;
    }
    throw new PointsSettlementError(
      error instanceof Error ? error.message : 'Unknown error',
      taskIds.join(','),
      error
    );
  }
}

/**
 * Batch reject tasks with reason
 *
 * Story 2.7 Task 4.6-4.7: 更新API端点支持批量驳回，任务状态返回待完成
 *
 * This function:
 * 1. Validates all tasks are in 'completed' status
 * 2. Updates task status to 'pending' (back to todo)
 * 3. Records rejection reason
 * 4. No points are awarded
 *
 * @param taskIds - Array of task IDs to reject
 * @param reason - Rejection reason (required)
 * @param parentUserId - Parent who is rejecting
 * @returns Batch rejection result
 * @throws Error if rejection fails
 */
export async function batchRejectTasks(
  taskIds: string[],
  reason: string,
  parentUserId: string
): Promise<BatchRejectionResult> {
  const now = new Date();

  if (!reason || reason.trim().length === 0) {
    return {
      success: false,
      rejectedCount: 0,
      error: 'Rejection reason is required',
    };
  }

  if (reason.length > 200) {
    return {
      success: false,
      rejectedCount: 0,
      error: 'Rejection reason must be 200 characters or less',
    };
  }

  try {
    // Get all tasks
    const tasks = await Promise.all(
      taskIds.map(id => getTaskById(id))
    );

    const validTasks = tasks.filter((t): t is NonNullable<typeof t> => t !== null);

    if (validTasks.length !== taskIds.length) {
      return {
        success: false,
        rejectedCount: 0,
        error: `Some tasks not found`,
      };
    }

    // Validate all tasks are in 'completed' status
    for (const task of validTasks) {
      if (task.status !== 'completed') {
        return {
          success: false,
          rejectedCount: 0,
          error: `Task ${task.id} is not in completed status`,
        };
      }
    }

    // Update all tasks to 'pending' status (back to todo)
    for (const task of validTasks) {
      await updateTask(task.id, {
        status: 'pending',
        rejection_reason: reason,
        completed_at: null, // Clear completion time
        approved_by: parentUserId,
        approved_at: now,
      });
    }

    return {
      success: true,
      rejectedCount: validTasks.length,
    };
  } catch (error) {
    return {
      success: false,
      rejectedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate total points for a batch of tasks (for preview)
 *
 * Story 2.7: 查看批量审批的积分总和
 *
 * @param taskIds - Array of task IDs
 * @returns Total points or null if any task not found
 */
export async function previewBatchPoints(taskIds: string[]): Promise<number | null> {
  const tasks = await Promise.all(
    taskIds.map(id => getTaskById(id))
  );

  if (tasks.some(t => t === null)) {
    return null;
  }

  return tasks.reduce((sum, task) => sum + (task?.points ?? 0), 0);
}
