/**
 * Task Type Definitions
 *
 * Story 2.9: Child Marks Task Complete
 * Defines task types and approval rules for task completion flow
 */

/**
 * Task type enum for categorizing tasks
 */
export type TaskType =
  | '刷牙'      // Brushing teeth
  | '学习'     // Studying
  | '运动'    // Sports/Exercise
  | '家务'    // Housework
  | '签到'    // Check-in (auto-approved)
  | '自定义';  // Custom tasks

/**
 * Task types that require parent approval before completion
 */
export const TASK_TYPES_NEEDING_APPROVAL = [
  '刷牙',
  '学习',
  '运动',
  '家务',
  '自定义',
] as const;

/**
 * Task types that are auto-approved (no parent approval needed)
 * Child can mark these as complete and receive points immediately
 */
export const TASK_TYPES_AUTO_APPROVED = [
  '签到',
] as const;

/**
 * Check if a task type requires parent approval
 *
 * @param taskType - The task type to check
 * @returns true if the task needs parent approval, false otherwise
 */
export function taskNeedsApproval(taskType: TaskType): boolean {
  return (TASK_TYPES_NEEDING_APPROVAL as readonly TaskType[]).includes(taskType);
}

/**
 * Check if a task type is auto-approved
 *
 * @param taskType - The task type to check
 * @returns true if the task is auto-approved, false otherwise
 */
export function taskIsAutoApproved(taskType: TaskType): boolean {
  return (TASK_TYPES_AUTO_APPROVED as readonly TaskType[]).includes(taskType);
}

/**
 * Get the display status for a task based on its internal status
 *
 * Story 2.9: Maps internal statuses to child-friendly display statuses
 * Status flow: pending → pending_approval (child marked) → completed (parent approved)
 *
 * @param status - Internal task status
 * @returns Display status: 'pending' | 'completed' | 'pending_approval'
 */
export function getTaskStatusDisplay(status: string): 'pending' | 'completed' | 'pending_approval' {
  // Story 2.9: Status values
  // pending → pending (待完成)
  // pending_approval → pending_approval (待审批 - child marked complete, waiting parent approval)
  // completed → completed (已完成 - parent approved or auto-approved like checkin)
  // rejected → pending (待完成 - rejected, need to redo)

  if (status === 'pending_approval') {
    return 'pending_approval';
  }

  if (status === 'completed') {
    return 'completed';
  }

  if (status === 'rejected') {
    return 'pending';
  }

  return 'pending';
}
