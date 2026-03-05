/**
 * Database queries for Tasks
 *
 * Story 2.1: Task instance generation from task plans
 * Story 2.4: System auto-generates task instances
 *
 * All task database operations MUST use these functions.
 * NEVER write raw SQL - use Drizzle ORM query builder.
 *
 * Source: AGENTS.md - Database query layer pattern
 * Source: _bmad-output/project-context.md - RED LIST rules
 */

import db from '../index';
import { tasks, taskPlans, users } from '../schema';
import { eq, and, desc, inArray, or, lt, gte, sql } from 'drizzle-orm';

// Type definitions for DTOs
export interface CreateTaskDTO {
  family_id: string;
  task_plan_id?: string | null;
  assigned_child_id?: string | null;
  title: string;
  task_type: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  points: number;
  scheduled_date: string; // YYYY-MM-DD format
  status?: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'skipped';
}

export interface UpdateTaskDTO {
  title?: string;
  task_type?: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  points?: number;
  scheduled_date?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'skipped';
  completed_at?: Date | null;
  approved_by?: string | null;
  approved_at?: Date | null;
  rejection_reason?: string | null;
}

export interface TaskFilter {
  family_id: string;
  assigned_child_id?: string;
  scheduled_date?: string;
  scheduled_date_from?: string;
  scheduled_date_to?: string;
  status?: Array<'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'skipped'>;
}

/**
 * Create a new task
 *
 * @param data - Task data
 * @returns The created task
 */
export async function createTask(data: CreateTaskDTO) {
  const id = Bun.randomUUIDv7();

  const result = await db.insert(tasks).values({
    id,
    family_id: data.family_id,
    task_plan_id: data.task_plan_id ?? null,
    assigned_child_id: data.assigned_child_id ?? null,
    title: data.title,
    task_type: data.task_type,
    points: data.points,
    scheduled_date: data.scheduled_date,
    status: data.status ?? 'pending',
  }).returning();

  return result[0];
}

/**
 * Batch create tasks (for task plan instance generation)
 *
 * @param tasksData - Array of task data
 * @returns Array of created tasks
 */
export async function batchCreateTasks(tasksData: CreateTaskDTO[]) {
  const values = tasksData.map(data => ({
    id: Bun.randomUUIDv7(),
    family_id: data.family_id,
    task_plan_id: data.task_plan_id ?? null,
    assigned_child_id: data.assigned_child_id ?? null,
    title: data.title,
    task_type: data.task_type,
    points: data.points,
    scheduled_date: data.scheduled_date,
    status: data.status ?? 'pending',
  }));

  const result = await db.insert(tasks).values(values).returning();

  return result;
}

/**
 * Get task by ID
 *
 * @param taskId - Task ID
 * @returns The task or null
 */
export async function getTaskById(taskId: string) {
  const result = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  return result ?? null;
}

/**
 * Get tasks by family
 *
 * @param filter - Task filter options
 * @returns Array of tasks
 */
export async function getTasksByFilter(filter: TaskFilter) {
  const conditions = [eq(tasks.family_id, filter.family_id)];

  if (filter.assigned_child_id) {
    conditions.push(eq(tasks.assigned_child_id, filter.assigned_child_id));
  }

  if (filter.scheduled_date) {
    conditions.push(eq(tasks.scheduled_date, filter.scheduled_date));
  }

  if (filter.scheduled_date_from && filter.scheduled_date_to) {
    conditions.push(
      and(
        gte(tasks.scheduled_date, filter.scheduled_date_from),
        lt(tasks.scheduled_date, filter.scheduled_date_to)
      )!
    );
  }

  if (filter.status && filter.status.length > 0) {
    conditions.push(inArray(tasks.status, filter.status));
  }

  const result = await db.query.tasks.findMany({
    where: and(...conditions),
    orderBy: [desc(tasks.scheduled_date), desc(tasks.created_at)],
  });

  return result;
}

/**
 * Get tasks by task plan
 *
 * @param taskPlanId - Task plan ID
 * @returns Array of tasks
 */
export async function getTasksByTaskPlan(taskPlanId: string) {
  const result = await db.query.tasks.findMany({
    where: eq(tasks.task_plan_id, taskPlanId),
    orderBy: desc(tasks.scheduled_date),
  });

  return result;
}

/**
 * Get tasks for a child
 *
 * @param familyId - Family ID
 * @param childId - Child user ID
 * @param scheduledDate - Optional date filter (YYYY-MM-DD)
 * @returns Array of tasks
 */
export async function getTasksForChild(familyId: string, childId: string, scheduledDate?: string) {
  const conditions = [
    eq(tasks.family_id, familyId),
    eq(tasks.assigned_child_id, childId),
  ];

  if (scheduledDate) {
    conditions.push(eq(tasks.scheduled_date, scheduledDate));
  }

  const result = await db.query.tasks.findMany({
    where: and(...conditions),
    orderBy: [desc(tasks.scheduled_date), desc(tasks.created_at)],
  });

  return result;
}

/**
 * Get today's tasks for a family
 *
 * @param familyId - Family ID
 * @returns Array of tasks scheduled for today
 */
export async function getTodayTasksForFamily(familyId: string) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const result = await db.query.tasks.findMany({
    where: and(
      eq(tasks.family_id, familyId),
      eq(tasks.scheduled_date, today)
    ),
    orderBy: desc(tasks.created_at),
  });

  return result;
}

/**
 * Update task
 *
 * @param taskId - Task ID
 * @param data - Updated data
 * @returns The updated task or null
 */
export async function updateTask(taskId: string, data: UpdateTaskDTO) {
  const result = await db.update(tasks)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.task_type !== undefined && { task_type: data.task_type }),
      ...(data.points !== undefined && { points: data.points }),
      ...(data.scheduled_date !== undefined && { scheduled_date: data.scheduled_date }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.completed_at !== undefined && { completed_at: data.completed_at }),
      ...(data.approved_by !== undefined && { approved_by: data.approved_by }),
      ...(data.approved_at !== undefined && { approved_at: data.approved_at }),
      ...(data.rejection_reason !== undefined && { rejection_reason: data.rejection_reason }),
      updated_at: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  return result[0] ?? null;
}

/**
 * Mark task as completed (by child)
 *
 * @param taskId - Task ID
 * @returns The updated task or null
 */
export async function markTaskCompleted(taskId: string) {
  const result = await db.update(tasks)
    .set({
      status: 'completed',
      completed_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  return result[0] ?? null;
}

/**
 * Approve task completion (by parent)
 *
 * @param taskId - Task ID
 * @param approvedBy - Parent user ID
 * @returns The updated task or null
 */
export async function approveTask(taskId: string, approvedBy: string) {
  const result = await db.update(tasks)
    .set({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  return result[0] ?? null;
}

/**
 * Reject task completion (by parent)
 *
 * @param taskId - Task ID
 * @param rejectionReason - Reason for rejection
 * @returns The updated task or null
 */
export async function rejectTask(taskId: string, rejectionReason: string) {
  const result = await db.update(tasks)
    .set({
      status: 'rejected',
      rejection_reason: rejectionReason,
      updated_at: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  return result[0] ?? null;
}

/**
 * Delete task
 *
 * @param taskId - Task ID
 * @returns true if deleted, false otherwise
 */
export async function deleteTask(taskId: string) {
  const result = await db.delete(tasks)
    .where(eq(tasks.id, taskId))
    .returning();

  return result.length > 0;
}

/**
 * Delete all tasks for a task plan
 *
 * @param taskPlanId - Task plan ID
 * @returns Number of deleted tasks
 */
export async function deleteTasksByTaskPlan(taskPlanId: string) {
  const result = await db.delete(tasks)
    .where(eq(tasks.task_plan_id, taskPlanId))
    .returning();

  return result.length;
}

/**
 * Count pending tasks for a child
 *
 * @param familyId - Family ID
 * @param childId - Child user ID
 * @returns Number of pending tasks
 */
export async function countPendingTasksForChild(familyId: string, childId: string) {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(
      and(
        eq(tasks.family_id, familyId),
        eq(tasks.assigned_child_id, childId),
        eq(tasks.status, 'pending')
      )
    );

  return result[0]?.count ?? 0;
}

/**
 * Get tasks summary for a family
 *
 * @param familyId - Family ID
 * @returns Summary statistics
 */
export async function getTasksSummaryForFamily(familyId: string) {
  const result = await db.select({
    status: tasks.status,
    count: sql<number>`count(*)`,
  })
    .from(tasks)
    .where(eq(tasks.family_id, familyId))
    .groupBy(tasks.status);

  const summary: Record<string, number> = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    approved: 0,
    rejected: 0,
    skipped: 0,
  };

  for (const row of result) {
    if (row.status) {
      summary[row.status] = row.count;
    }
  }

  return summary;
}
