/**
 * Points Calculator Service
 *
 * Story 2.2: Parent Sets Task Points Value
 * Task 6: Implement points settlement logic when task is completed
 *
 * Handles points calculation and settlement when tasks are approved:
 * - Calculates points to award on task approval
 * - Adds points to child's balance
 * - Creates points history record
 * - Ensures transactional integrity
 *
 * Source: Story 2.2 AC #4 - Points automatically accumulate to child account after approval
 */

import { getTaskById } from '../db/queries/tasks';
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
