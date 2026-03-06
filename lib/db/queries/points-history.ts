/**
 * Points History Queries
 *
 * Story 2.2: Parent Sets Task Points Value
 * Task 6: Create points history record when task is approved
 *
 * Manages points history records for auditing and COPPA/GDPR compliance
 *
 * Source: Story 2.2 Security & Compliance - Points changes are audited
 */

import db from '../index';
import { pointsHistory } from '../schema';
import { eq, and, desc, gt } from 'drizzle-orm';

// Type definitions for DTOs
export interface CreatePointsHistoryDTO {
  child_id: string;
  task_id?: string;
  points: number;
  type: 'task_completion' | 'task_rejection' | 'adjustment' | 'reward' | 'penalty';
  description?: string;
  previous_balance?: number;
  new_balance?: number;
  created_at?: Date;
}

/**
 * Create a points history record
 *
 * @param data - Points history data
 * @returns The created history record
 */
export async function createPointsHistory(data: CreatePointsHistoryDTO) {
  const id = Bun.randomUUIDv7();

  const result = await db.insert(pointsHistory).values({
    id,
    child_id: data.child_id,
    task_id: data.task_id ?? null,
    points: data.points,
    type: data.type,
    description: data.description ?? null,
    previous_balance: data.previous_balance ?? 0,
    new_balance: data.new_balance ?? 0,
    created_at: data.created_at ?? new Date(),
  }).returning();

  return result[0];
}

/**
 * Get points history for a child
 *
 * @param childId - Child user ID
 * @param limit - Maximum number of records to return (default: 50)
 * @returns Array of points history records
 */
export async function getPointsHistoryForChild(childId: string, limit = 50) {
  const result = await db.query.pointsHistory.findMany({
    where: eq(pointsHistory.child_id, childId),
    orderBy: [desc(pointsHistory.created_at)],
    limit,
  });

  return result;
}

/**
 * Get points history for a task
 *
 * @param taskId - Task ID
 * @returns Points history records for the task
 */
export async function getPointsHistoryForTask(taskId: string) {
  const result = await db.query.pointsHistory.findMany({
    where: eq(pointsHistory.task_id, taskId),
    orderBy: [desc(pointsHistory.created_at)],
  });

  return result;
}

/**
 * Get recent points history (for notifications)
 *
 * @param childId - Child user ID
 * @param since - Only return records after this timestamp
 * @returns Array of recent points history records
 */
export async function getRecentPointsHistory(childId: string, since: Date) {
  const result = await db.query.pointsHistory.findMany({
    where: and(
      eq(pointsHistory.child_id, childId),
      gt(pointsHistory.created_at, since)
    ),
    orderBy: [desc(pointsHistory.created_at)],
  });

  return result;
}

/**
 * Calculate total points earned in a date range
 *
 * @param childId - Child user ID
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Total points earned
 */
export async function getTotalPointsEarnedInRange(
  childId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // This would require a more complex query with date filtering
  // For now, return 0 as placeholder
  // TODO: Implement with proper date filtering
  return 0;
}
