/**
 * Task Engine Service
 *
 * Story 2.1: Task instance auto-generation from task plans
 * Story 2.4: System auto-generates task instances based on schedule rules
 *
 * This service handles:
 * - Date strategy calculation for task generation
 * - Exclusion date filtering
 * - Task instance generation from task plans
 *
 * Source: Story 2.1 AC #3 - Generate 7 days of task instances on publish
 * Source: _bmad-output/implementation-artifacts/2-1-parent-creates-task-plan-template.md
 */

import { Bun } from 'bun';

// Type definitions for task plan rule
export interface TaskPlanRule {
  frequency: 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';
  custom_days?: number[]; // 0-6 (Sunday-Saturday) for custom frequency
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format (optional, for limited duration)
}

export interface TaskGenerationOptions {
  task_plan_id: string;
  family_id: string;
  title: string;
  task_type: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  points: number;
  rule: TaskPlanRule;
  excluded_dates?: string[]; // Array of YYYY-MM-DD date strings
  assigned_children?: string[]; // Array of child user IDs
  days_to_generate?: number; // Number of days to generate (default: 7)
  start_from_date?: string; // Start date (default: today)
}

export interface GeneratedTask {
  family_id: string;
  task_plan_id: string;
  assigned_child_id: string;
  title: string;
  task_type: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  points: number;
  scheduled_date: string; // YYYY-MM-DD format
}

/**
 * Parse JSON string to TaskPlanRule
 *
 * @param ruleJson - JSON string representation of the rule
 * @returns Parsed TaskPlanRule object
 */
export function parseTaskPlanRule(ruleJson: string): TaskPlanRule {
  try {
    const rule = JSON.parse(ruleJson) as TaskPlanRule;
    return rule;
  } catch (error) {
    // Default to daily if parsing fails
    return { frequency: 'daily' };
  }
}

/**
 * Calculate dates that should have tasks based on the rule
 *
 * @param rule - Task plan rule
 * @param daysToGenerate - Number of days to generate
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param excludedDates - Dates to exclude
 * @returns Array of scheduled date strings (YYYY-MM-DD format)
 */
export function calculateScheduledDates(
  rule: TaskPlanRule,
  daysToGenerate: number = 7,
  startDate?: string,
  excludedDates: string[] = []
): string[] {
  const dates: string[] = [];
  const start = startDate ? new Date(startDate) : new Date();
  const excludedSet = new Set(excludedDates);

  // Generate dates for the specified number of days
  for (let i = 0; i < daysToGenerate * 2 && dates.length < daysToGenerate; i++) {
    // Skip today if startDate is not provided (start from tomorrow)
    if (i === 0 && !startDate) {
      continue;
    }

    const date = new Date(start);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay();

    // Check if date is excluded
    if (excludedSet.has(dateStr)) {
      continue;
    }

    // Check if date matches the frequency rule
    if (shouldGenerateDate(date, rule)) {
      dates.push(dateStr);
    }
  }

  return dates;
}

/**
 * Check if a date should have a task based on the rule
 *
 * @param date - Date to check
 * @param rule - Task plan rule
 * @returns true if task should be generated, false otherwise
 */
function shouldGenerateDate(date: Date, rule: TaskPlanRule): boolean {
  const dayOfWeek = date.getDay();

  switch (rule.frequency) {
    case 'daily':
      return true;

    case 'weekly':
      // Generate once a week (on the first matching day)
      // For simplicity, we generate on the same day of week as the start date
      return dayOfWeek === (rule.custom_days?.[0] ?? 0);

    case 'weekdays':
      // Monday (1) through Friday (5)
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case 'weekends':
      // Saturday (6) and Sunday (0)
      return dayOfWeek === 0 || dayOfWeek === 6;

    case 'custom':
      // Check if the current day is in the custom days list
      return rule.custom_days?.includes(dayOfWeek) ?? false;

    default:
      return false;
  }
}

/**
 * Format date to YYYY-MM-DD string
 *
 * @param date - Date object
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse date string to Date object
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object
 */
function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Generate task instances from a task plan
 *
 * This function creates task data objects (not database records)
 * for all scheduled dates based on the task plan rule.
 *
 * @param options - Task generation options
 * @returns Array of generated task data objects
 */
export function generateTaskInstances(options: TaskGenerationOptions): GeneratedTask[] {
  const {
    task_plan_id,
    family_id,
    title,
    task_type,
    points,
    rule,
    excluded_dates = [],
    assigned_children = [],
    days_to_generate = 7,
    start_from_date,
  } = options;

  // Calculate scheduled dates
  const scheduledDates = calculateScheduledDates(
    rule,
    days_to_generate,
    start_from_date,
    excluded_dates
  );

  // If no assigned children, use empty array (tasks will be unassigned)
  const children = assigned_children.length > 0 ? assigned_children : [''];

  // Generate task instances for each date and each child
  const tasks: GeneratedTask[] = [];

  for (const date of scheduledDates) {
    for (const childId of children) {
      tasks.push({
        family_id,
        task_plan_id,
        assigned_child_id: childId,
        title,
        task_type,
        points,
        scheduled_date: date,
      });
    }
  }

  return tasks;
}

/**
 * Generate task instances for immediate publish (Story 2.1 AC #3)
 *
 * When a parent clicks "立即发布", generate tasks for the next 7 days.
 * This function is called by the API endpoint when status changes to 'published'.
 *
 * @param options - Task generation options
 * @returns Array of generated task data objects ready for database insertion
 */
export function generateTasksForImmediatePublish(options: TaskGenerationOptions): GeneratedTask[] {
  // Start from tomorrow (not today) for immediate publish
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startDate = formatDate(tomorrow);

  return generateTaskInstances({
    ...options,
    start_from_date: startDate,
    days_to_generate: 7,
  });
}

/**
 * Validate task plan rule
 *
 * @param rule - Task plan rule to validate
 * @returns true if valid, false otherwise
 */
export function isValidTaskPlanRule(rule: unknown): rule is TaskPlanRule {
  if (typeof rule !== 'object' || rule === null) {
    return false;
  }

  const r = rule as Record<string, unknown>;

  // Check frequency
  const validFrequencies = ['daily', 'weekly', 'weekdays', 'weekends', 'custom'];
  if (typeof r.frequency !== 'string' || !validFrequencies.includes(r.frequency)) {
    return false;
  }

  // For custom frequency, validate custom_days
  if (r.frequency === 'custom') {
    if (!Array.isArray(r.custom_days)) {
      return false;
    }
    // Check all days are valid (0-6)
    for (const day of r.custom_days) {
      if (typeof day !== 'number' || day < 0 || day > 6) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Get human-readable description of the rule
 *
 * @param rule - Task plan rule
 * @returns Human-readable description
 */
export function describeTaskPlanRule(rule: TaskPlanRule): string {
  switch (rule.frequency) {
    case 'daily':
      return '每天';
    case 'weekly':
      return '每周';
    case 'weekdays':
      return '工作日';
    case 'weekends':
      return '周末';
    case 'custom':
      if (rule.custom_days && rule.custom_days.length > 0) {
        const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
        const days = rule.custom_days.map(d => `周${dayNames[d]}`).join('、');
        return `自定义（${days}）`;
      }
      return '自定义';
    default:
      return '未知';
  }
}
