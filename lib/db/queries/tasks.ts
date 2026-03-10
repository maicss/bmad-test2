/**
 * Database queries for Tasks
 *
 * Story 2.1: Task instance generation from task plans
 * Story 2.4: System auto-generates task instances
 * Story 2.6: Parent uses template to quickly create task (manual tasks)
 *
 * All task database operations MUST use these functions.
 * NEVER write raw SQL - use Drizzle ORM query builder.
 *
 * Source: AGENTS.md - Database query layer pattern
 * Source: _bmad-output/project-context.md - RED LIST rules
 */

import db from '../index';
import { tasks, taskPlans, users } from '../schema';
import { eq, and, desc, inArray, lt, gte, sql } from 'drizzle-orm';

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

// Story 2.6: DTO for creating manual tasks
export interface CreateManualTaskDTO {
  family_id: string;
  title: string;
  task_type: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  points: number;
  scheduled_date: string; // YYYY-MM-DD format
  child_ids: string[]; // Array of child IDs for batch creation
  notes?: string; // Optional notes
  is_manual: true; // Always true for manual tasks
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
  notes?: string;
}

// Story 2.6: Updated TaskFilter to support is_manual filtering
export interface TaskFilter {
  family_id: string;
  assigned_child_id?: string;
  scheduled_date?: string;
  scheduled_date_from?: string;
  scheduled_date_to?: string;
  status?: Array<'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'skipped'>;
  is_manual?: boolean; // Story 2.6: Filter by manual/scheduled tasks
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

  // Story 2.6: Support is_manual filtering
  if (filter.is_manual !== undefined) {
    conditions.push(eq(tasks.is_manual, filter.is_manual));
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
 * @param isManual - Optional manual task filter (Story 2.6)
 * @returns Array of tasks
 */
export async function getTasksForChild(
  familyId: string,
  childId: string,
  scheduledDate?: string,
  isManual?: boolean
) {
  const conditions = [
    eq(tasks.family_id, familyId),
    eq(tasks.assigned_child_id, childId),
  ];

  if (scheduledDate) {
    conditions.push(eq(tasks.scheduled_date, scheduledDate));
  }

  // Story 2.6: Support is_manual filtering
  if (isManual !== undefined) {
    conditions.push(eq(tasks.is_manual, isManual));
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
      ...(data.notes !== undefined && { notes: data.notes }),
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

// Story 2.6: Manual task creation functions

/**
 * Create manual tasks for multiple children
 * Manual tasks are NOT linked to task plans (task_plan_id is null)
 *
 * @param data - Manual task data
 * @returns Array of created tasks
 */
export async function createManualTask(data: CreateManualTaskDTO) {
  const taskIds: string[] = [];
  const now = new Date();

  // Create a task instance for each child
  for (const childId of data.child_ids) {
    const taskId = Bun.randomUUIDv7();
    taskIds.push(taskId);

    await db.insert(tasks).values({
      id: taskId,
      family_id: data.family_id,
      task_plan_id: null, // Manual tasks have no template
      assigned_child_id: childId,
      title: data.title,
      task_type: data.task_type,
      points: data.points,
      status: 'pending',
      scheduled_date: data.scheduled_date,
      is_manual: true, // Mark as manual task
      notes: data.notes ?? null,
      created_at: now,
      updated_at: now,
    });
  }

  // Return all created tasks
  return await db.query.tasks.findMany({
    where: inArray(tasks.id, taskIds),
  });
}

/**
 * Get tasks for a child with is_manual filter support
 *
 * @param familyId - Family ID
 * @param childId - Child user ID
 * @param scheduledDate - Optional date filter (YYYY-MM-DD)
 * @param isManual - Optional manual task filter
 * @returns Array of tasks
 */
export async function getTasksByChild(
  familyId: string,
  childId: string,
  scheduledDate?: string,
  isManual?: boolean
) {
  const conditions = [
    eq(tasks.family_id, familyId),
    eq(tasks.assigned_child_id, childId),
  ];

  if (scheduledDate) {
    conditions.push(eq(tasks.scheduled_date, scheduledDate));
  }

  if (isManual !== undefined) {
    conditions.push(eq(tasks.is_manual, isManual));
  }

  const result = await db.query.tasks.findMany({
    where: and(...conditions),
    orderBy: [desc(tasks.scheduled_date), desc(tasks.created_at)],
  });

  return result;
}

/**
 * Get task templates for quick task creation
 * Returns parent's published templates and admin templates
 *
 * @param familyId - Family ID
 * @returns Object with parentTemplates and adminTemplates arrays
 */
export async function getTaskTemplatesForQuickCreate(familyId: string) {
  // Get parent's own templates (published)
  const parentTemplates = await db.query.taskPlans.findMany({
    where: and(
      eq(taskPlans.family_id, familyId),
      eq(taskPlans.status, 'published')
    ),
    orderBy: [desc(taskPlans.created_at)],
  });

  // Get admin templates (published with no family_id)
  // For now, this is a placeholder for Story 6.1 (admin template management)
  const adminTemplates: typeof parentTemplates = [];

  return {
    parentTemplates,
    adminTemplates,
  };
}

// ==================== Story 2.7: Task Approval Queries ====================

/**
 * Get tasks pending approval (completed but not yet approved)
 *
 * Story 2.7: 家长查看待审批任务列表
 *
 * @param familyId - Family ID
 * @param childId - Optional child ID to filter by
 * @returns Array of completed tasks pending approval
 */
export async function getPendingApprovalTasks(
  familyId: string,
  childId?: string
) {
  const conditions = [
    eq(tasks.family_id, familyId),
    eq(tasks.status, 'completed'), // Tasks marked completed by child, waiting parent approval
  ];

  if (childId) {
    conditions.push(eq(tasks.assigned_child_id, childId));
  }

  const taskList = await db.query.tasks.findMany({
    where: and(...conditions),
    orderBy: [desc(tasks.completed_at), desc(tasks.created_at)],
  });

  return taskList;
}

/**
 * Get task with child information (joins users table)
 *
 * Story 2.7: 审批列表需要显示孩子姓名
 *
 * @param taskId - Task ID
 * @returns Task with child information or null
 */
export async function getTaskWithChildInfo(taskId: string) {
  const result = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  return result ?? null;
}

/**
 * Batch update tasks with approval/rejection
 *
 * Story 2.7: 批量更新任务状态
 *
 * @param taskIds - Array of task IDs
 * @param data - Update data
 * @returns Number of updated tasks
 */
export async function batchUpdateTasks(
  taskIds: string[],
  data: UpdateTaskDTO
) {
  const results = await Promise.all(
    taskIds.map(id => updateTask(id, data))
  );

  return results.filter(r => r !== null).length;
}

/**
 * Count pending approval tasks for a family
 *
 * @param familyId - Family ID
 * @returns Number of pending approval tasks
 */
export async function countPendingApprovalTasks(familyId: string): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(
      and(
        eq(tasks.family_id, familyId),
        eq(tasks.status, 'completed')
      )
    );

  return result[0]?.count ?? 0;
}

// Story 2.8: Child Views Today's Task List

/**
 * Sort options for task list
 */
export type TaskSortOption = 'time' | 'created' | 'points';

/**
 * Get today's tasks for a child
 *
 * Story 2.8 Task 2.4: 实现任务数据加载
 * Story 2.8 Task 4: 实现任务排序逻辑
 *
 * @param childId - Child user ID
 * @param sortOption - How to sort tasks (default: created)
 * @returns Array of today's tasks for the child
 */
export async function getTodayTasksByChild(childId: string, sortOption: TaskSortOption = 'created') {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  let orderBy;
  switch (sortOption) {
    case 'points':
      // Sort by points (highest first)
      orderBy = [desc(tasks.points), desc(tasks.created_at)];
      break;
    case 'time':
      // Sort by time (tasks with time requirements first, then by creation time)
      // For now, sort by creation time as we don't have a specific time field
      orderBy = [desc(tasks.created_at)];
      break;
    case 'created':
    default:
      // Sort by creation time (newest first)
      orderBy = [desc(tasks.created_at)];
      break;
  }

  const result = await db.query.tasks.findMany({
    where: and(
      eq(tasks.assigned_child_id, childId),
      eq(tasks.scheduled_date, today)
    ),
    orderBy,
  });

  // Apply additional sorting logic for 'time' option
  if (sortOption === 'time') {
    // Tasks with specific time requirements would be sorted first
    // For now, we'll use the creation order as a proxy
    // In a full implementation, this would check for a task_time field
    result.sort((a, b) => {
      // Priority: pending > completed > other statuses
      const statusOrder = { pending: 0, in_progress: 1, completed: 2, approved: 3, rejected: 4, skipped: 5 };
      const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 99;
      const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 99;

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // Then by creation time
      return b.created_at.getTime() - a.created_at.getTime();
    });
  }

  return result;
}

/**
 * Get task progress for a child
 *
 * Story 2.8 Task 5.1: 实现任务统计计算（已完成数/总数）
 *
 * @param childId - Child user ID
 * @returns Progress object with completed, total, and percentage
 */
export async function getTaskProgressByChild(childId: string) {
  const today = new Date().toISOString().split('T')[0];

  const allTasks = await db.query.tasks.findMany({
    where: and(
      eq(tasks.assigned_child_id, childId),
      eq(tasks.scheduled_date, today)
    ),
  });

  const total = allTasks.length;
  const completed = allTasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    progress,
  };
}

/**
 * Get task status for display
 *
 * Story 2.8 Task 3: 任务状态显示
 * Maps internal status to display status for child UI
 *
 * @param status - Internal task status
 * @returns Display status: 'pending' | 'completed' | 'pending_approval'
 */
export function getTaskStatusDisplay(status: string): 'pending' | 'completed' | 'pending_approval' {
  // Map internal statuses to child-friendly display statuses
  // pending → pending (待完成)
  // in_progress → pending (待完成)
  // completed → pending_approval (待审批 - child marked complete, waiting parent approval)
  // approved → completed (已完成)
  // rejected → pending (待完成 - rejected, need to redo)
  // skipped → pending (待完成)

  if (status === 'approved') {
    return 'completed';
  }

  if (status === 'completed') {
    return 'pending_approval';
  }

  return 'pending';
}
