/**
 * Database queries for Notifications
 *
 * Story 2.5 Task 7.6: Send resume notifications
 *
 * All notification database operations MUST use these functions.
 * NEVER write raw SQL - use Drizzle ORM query builder.
 *
 * Source: AGENTS.md - Database query layer pattern
 * Source: _bmad-output/project-context.md - RED LIST rules
 */

import db from '../index';
import { notifications, users, taskPlans } from '../schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export type NotificationType = 'task_plan_resumed' | 'task_paused' | 'task_approved' | 'points_earned';

export interface CreateNotificationDTO {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Create a new notification
 *
 * @param data - Notification data
 * @returns The created notification
 */
export async function createNotification(data: CreateNotificationDTO) {
  const [notification] = await db.insert(notifications).values({
    id: Bun.randomUUIDv7(),
    user_id: data.user_id,
    type: data.type,
    title: data.title,
    message: data.message,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  }).returning();

  return notification;
}

/**
 * Get notifications for a user
 *
 * @param userId - User ID
 * @param unreadOnly - Only return unread notifications
 * @param limit - Maximum number of notifications to return
 * @returns Array of notifications
 */
export async function getNotificationsByUserId(
  userId: string,
  unreadOnly: boolean = false,
  limit: number = 50
) {
  const conditions = unreadOnly
    ? and(eq(notifications.user_id, userId), eq(notifications.is_read, false))
    : eq(notifications.user_id, userId);

  const result = await db.query.notifications.findMany({
    where: conditions,
    orderBy: desc(notifications.created_at),
    limit,
  });

  return result;
}

/**
 * Get notification by ID
 *
 * @param notificationId - Notification ID
 * @returns The notification or null
 */
export async function getNotificationById(notificationId: string) {
  const result = await db.query.notifications.findFirst({
    where: eq(notifications.id, notificationId),
  });

  return result ?? null;
}

/**
 * Mark notification as read
 *
 * @param notificationId - Notification ID
 * @returns The updated notification or null
 */
export async function markNotificationAsRead(notificationId: string) {
  const [updated] = await db.update(notifications)
    .set({ is_read: true })
    .where(eq(notifications.id, notificationId))
    .returning();

  return updated ?? null;
}

/**
 * Mark all notifications as read for a user
 *
 * @param userId - User ID
 * @returns Number of notifications marked as read
 */
export async function markAllNotificationsAsRead(userId: string) {
  const result = await db.update(notifications)
    .set({ is_read: true })
    .where(and(eq(notifications.user_id, userId), eq(notifications.is_read, false)))
    .returning();

  return result.length;
}

/**
 * Get unread notification count for a user
 *
 * @param userId - User ID
 * @returns Number of unread notifications
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const result = await db.query.notifications.findMany({
    where: and(eq(notifications.user_id, userId), eq(notifications.is_read, false)),
  });

  return result.length;
}

/**
 * Send task plan resumed notification to all parents in a family
 *
 * Story 2.5 Task 7.6: Send notification when task plan is auto-resumed
 *
 * @param familyId - Family ID
 * @param taskPlanId - Task plan ID
 * @param taskPlanTitle - Task plan title
 * @returns Number of notifications sent
 */
export async function sendTaskPlanResumedNotification(
  familyId: string,
  taskPlanId: string,
  taskPlanTitle: string
): Promise<number> {
  // Get all parents in the family
  const familyMembers = await db.query.users.findMany({
    where: and(eq(users.family_id, familyId), eq(users.role, 'parent')),
  });

  let notificationsSent = 0;

  for (const parent of familyMembers) {
    await createNotification({
      user_id: parent.id,
      type: 'task_plan_resumed',
      title: '任务计划已自动恢复',
      message: `任务计划"${taskPlanTitle}"已自动恢复，开始生成任务`,
      metadata: {
        taskPlanId,
        taskPlanTitle,
        resumedAt: new Date().toISOString(),
      },
    });
    notificationsSent++;
  }

  return notificationsSent;
}

/**
 * Delete old notifications
 *
 * Deletes notifications older than specified days.
 * Useful for cleanup and database maintenance.
 *
 * @param daysOld - Delete notifications older than this many days
 * @returns Number of notifications deleted
 */
export async function deleteOldNotifications(daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  // For SQLite, we need to use a different approach since created_at is stored as integer timestamp
  const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

  const result = await db.delete(notifications)
    .where(sql`${notifications.created_at} < ${cutoffTimestamp}`)
    .returning();

  return result.length;
}
