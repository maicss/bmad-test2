/**
 * Database queries for Task Plans
 *
 * Story 2.1: Parent Creates Task Plan Template
 * Story 2.3: Parent Sets Task Date Rules
 *
 * All task plan database operations MUST use these functions.
 * NEVER write raw SQL - use Drizzle ORM query builder.
 *
 * Source: AGENTS.md - Database query layer pattern
 * Source: _bmad-output/project-context.md - RED LIST rules
 */

import db from '../index';
import { taskPlans, tasks, taskPlanChildren, users } from '../schema';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { type TaskDateRule } from '@/types/task-rule';

// Type definitions for DTOs
export interface CreateTaskPlanDTO {
  family_id: string;
  title: string;
  task_type: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  points: number;
  rule: string; // JSON string of TaskDateRule
  excluded_dates?: string | null; // JSON array string
  reminder_time?: string | null;
  status: 'draft' | 'published';
  created_by: string;
  assigned_children?: string[]; // Array of child user IDs
}

export interface UpdateTaskPlanDTO {
  title?: string;
  task_type?: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  points?: number;
  rule?: string;
  excluded_dates?: string | null;
  reminder_time?: string | null;
  status?: 'draft' | 'published';
  assigned_children?: string[];
}

/**
 * Create a new task plan
 *
 * @param data - Task plan data
 * @returns The created task plan
 */
export async function createTaskPlan(data: CreateTaskPlanDTO) {
  const id = Bun.randomUUIDv7();

  // Create the task plan
  const result = await db.insert(taskPlans).values({
    id,
    family_id: data.family_id,
    title: data.title,
    task_type: data.task_type,
    points: data.points,
    rule: data.rule,
    excluded_dates: data.excluded_dates ?? null,
    reminder_time: data.reminder_time ?? null,
    status: data.status,
    created_by: data.created_by,
  }).returning();

  const taskPlan = result[0];

  // Add assigned children if provided
  if (data.assigned_children && data.assigned_children.length > 0) {
    await addChildrenToTaskPlan(id, data.assigned_children);
  }

  return taskPlan;
}

/**
 * Get task plan by ID
 *
 * @param taskPlanId - Task plan ID
 * @returns The task plan or null
 */
export async function getTaskPlanById(taskPlanId: string) {
  const result = await db.query.taskPlans.findFirst({
    where: eq(taskPlans.id, taskPlanId),
  });

  return result ?? null;
}

/**
 * Get task plan by ID with assigned children
 *
 * @param taskPlanId - Task plan ID
 * @returns The task plan with children or null
 */
export async function getTaskPlanWithChildren(taskPlanId: string) {
  const result = await db.query.taskPlans.findFirst({
    where: eq(taskPlans.id, taskPlanId),
    with: {
      // Note: Drizzle doesn't automatically include many-to-many relations
      // We'll need to fetch children separately
    },
  });

  if (!result) {
    return null;
  }

  // Fetch assigned children
  const childRelations = await db.query.taskPlanChildren.findMany({
    where: eq(taskPlanChildren.task_plan_id, taskPlanId),
    with: {
      // Get user data for each child
    },
  });

  // Get actual user data for children
  const childIds = childRelations.map(r => r.child_id);
  const children = childIds.length > 0
    ? await db.query.users.findMany({
        where: inArray(users.id, childIds),
      })
    : [];

  return {
    ...result,
    assigned_children: children,
  };
}

/**
 * Get all task plans for a family
 *
 * @param familyId - Family ID
 * @param status - Optional status filter
 * @returns Array of task plans
 */
export async function getTaskPlansByFamily(familyId: string, status?: 'draft' | 'published') {
  const conditions = status
    ? and(eq(taskPlans.family_id, familyId), eq(taskPlans.status, status))
    : eq(taskPlans.family_id, familyId);

  const result = await db.query.taskPlans.findMany({
    where: conditions,
    orderBy: desc(taskPlans.created_at),
  });

  return result;
}

/**
 * Update task plan
 *
 * @param taskPlanId - Task plan ID
 * @param data - Updated data
 * @returns The updated task plan or null
 */
export async function updateTaskPlan(taskPlanId: string, data: UpdateTaskPlanDTO) {
  // Update task plan
  const result = await db.update(taskPlans)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.task_type !== undefined && { task_type: data.task_type }),
      ...(data.points !== undefined && { points: data.points }),
      ...(data.rule !== undefined && { rule: data.rule }),
      ...(data.excluded_dates !== undefined && { excluded_dates: data.excluded_dates }),
      ...(data.reminder_time !== undefined && { reminder_time: data.reminder_time }),
      ...(data.status !== undefined && { status: data.status }),
      updated_at: new Date(),
    })
    .where(eq(taskPlans.id, taskPlanId))
    .returning();

  // Update assigned children if provided
  if (data.assigned_children !== undefined) {
    // Remove existing children
    await removeChildrenFromTaskPlan(taskPlanId);
    // Add new children
    if (data.assigned_children.length > 0) {
      await addChildrenToTaskPlan(taskPlanId, data.assigned_children);
    }
  }

  return result[0] ?? null;
}

/**
 * Delete task plan
 *
 * @param taskPlanId - Task plan ID
 * @returns true if deleted, false otherwise
 */
export async function deleteTaskPlan(taskPlanId: string) {
  const result = await db.delete(taskPlans)
    .where(eq(taskPlans.id, taskPlanId))
    .returning();

  return result.length > 0;
}

/**
 * Add children to a task plan
 *
 * @param taskPlanId - Task plan ID
 * @param childIds - Array of child user IDs
 */
export async function addChildrenToTaskPlan(taskPlanId: string, childIds: string[]) {
  if (childIds.length === 0) {
    return;
  }

  const values = childIds.map(childId => ({
    id: Bun.randomUUIDv7(),
    task_plan_id: taskPlanId,
    child_id: childId,
  }));

  await db.insert(taskPlanChildren).values(values);
}

/**
 * Remove all children from a task plan
 *
 * @param taskPlanId - Task plan ID
 */
export async function removeChildrenFromTaskPlan(taskPlanId: string) {
  await db.delete(taskPlanChildren)
    .where(eq(taskPlanChildren.task_plan_id, taskPlanId));
}

/**
 * Get children assigned to a task plan
 *
 * @param taskPlanId - Task plan ID
 * @returns Array of child users
 */
export async function getTaskPlanChildren(taskPlanId: string) {
  const relations = await db.query.taskPlanChildren.findMany({
    where: eq(taskPlanChildren.task_plan_id, taskPlanId),
  });

  const childIds = relations.map(r => r.child_id);

  if (childIds.length === 0) {
    return [];
  }

  const children = await db.query.users.findMany({
    where: inArray(users.id, childIds),
  });

  return children;
}

/**
 * Check if user can modify task plan (is creator or primary parent)
 *
 * @param taskPlanId - Task plan ID
 * @param userId - User ID
 * @param familyId - Family ID
 * @returns true if user can modify, false otherwise
 */
export async function canUserModifyTaskPlan(taskPlanId: string, userId: string, familyId: string): Promise<boolean> {
  const taskPlan = await getTaskPlanById(taskPlanId);

  if (!taskPlan) {
    return false;
  }

  // User must be in the same family
  if (taskPlan.family_id !== familyId) {
    return false;
  }

  // Creator can always modify
  if (taskPlan.created_by === userId) {
    return true;
  }

  // For additional permission checks (e.g., primary parent),
  // the calling function should check user role
  return false;
}

/**
 * Parse task plan rule from JSON string to typed object
 *
 * Story 2.3: Parent Sets Task Date Rules
 *
 * @param ruleString - JSON string from database
 * @returns Parsed TaskDateRule or null if invalid
 */
export function parseTaskPlanRule(ruleString: string | null): TaskDateRule | null {
  if (!ruleString) {
    return null;
  }

  try {
    const parsed = JSON.parse(ruleString);
    return parsed as TaskDateRule;
  } catch {
    return null;
  }
}

/**
 * Serialize task plan rule from typed object to JSON string
 *
 * Story 2.3: Parent Sets Task Date Rules
 *
 * @param rule - TaskDateRule object
 * @returns JSON string for database storage
 */
export function serializeTaskPlanRule(rule: TaskDateRule): string {
  return JSON.stringify(rule);
}

/**
 * Get task plan with parsed rule as typed object
 *
 * Story 2.3: Parent Sets Task Date Rules
 *
 * @param taskPlanId - Task plan ID
 * @returns Task plan with parsed rule or null
 */
export async function getTaskPlanWithParsedRule(taskPlanId: string) {
  const taskPlan = await getTaskPlanById(taskPlanId);

  if (!taskPlan) {
    return null;
  }

  return {
    ...taskPlan,
    rule: parseTaskPlanRule(taskPlan.rule),
  };
}

/**
 * Get task plans by family with parsed rules
 *
 * Story 2.3: Parent Sets Task Date Rules
 *
 * @param familyId - Family ID
 * @param status - Optional status filter
 * @returns Array of task plans with parsed rules
 */
export async function getTaskPlansByFamilyWithParsedRules(
  familyId: string,
  status?: 'draft' | 'published'
) {
  const taskPlans = await getTaskPlansByFamily(familyId, status);

  return taskPlans.map(plan => ({
    ...plan,
    rule: parseTaskPlanRule(plan.rule),
  }));
}

/**
 * Update task plan rule with typed object
 *
 * Story 2.3: Parent Sets Task Date Rules
 *
 * @param taskPlanId - Task plan ID
 * @param rule - TaskDateRule object
 * @returns The updated task plan or null
 */
export async function updateTaskPlanRule(taskPlanId: string, rule: TaskDateRule) {
  return updateTaskPlan(taskPlanId, {
    rule: serializeTaskPlanRule(rule),
  });
}
