/**
 * Task Generator Service
 *
 * Story 2.4: System Auto-Generates Task Instances
 *
 * This service handles automatic task instance generation from task plans
 * based on date rules. It runs daily at midnight to create tasks for each child.
 *
 * Features:
 * - Generates tasks based on frequency rules (daily, weekly, weekdays, weekends, interval)
 * - Supports exclusion dates (permanent and once scope)
 * - Ensures idempotency (no duplicate tasks)
 * - Generates independent task instances for each child
 *
 * Source: Story 2.4 AC #1-#7
 */

import db from '@/lib/db';
import { taskPlans, tasks, taskPlanChildren, users } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { batchCreateTasks } from '@/lib/db/queries/tasks';
import { getPublishedTaskPlansForGeneration } from '@/lib/db/queries/task-plans';

/**
 * Date rule types matching Story 2.3 TaskDateRule
 */
export interface TaskDateRule {
  frequency: 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'interval' | 'specific';
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday) for weekly
  intervalDays?: number; // For interval frequency
  specificDates?: string[]; // YYYY-MM-DD strings for specific dates
  excludedDates: {
    dates: string[];
    scope: 'permanent' | 'once';
  };
}

/**
 * Result of task generation operation
 */
export interface GenerationResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ planId: string; childId: string; error: string }>;
}

/**
 * Task Generator Class
 *
 * Generates task instances from published task plans based on date rules
 */
export class TaskGenerator {
  /**
   * Generate task instances for a specific date
   *
   * Story 2.5: Updated to use getPublishedTaskPlansForGeneration()
   * This filters out paused and deleted plans automatically.
   *
   * @param dateStr - Date in YYYY-MM-DD format
   * @returns Generation result with counts
   */
  async generateForDate(dateStr: string): Promise<GenerationResult> {
    const targetDate = new Date(dateStr + 'T00:00:00Z');
    const result: GenerationResult = {
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    try {
      // Story 2.5: Get only published plans (excludes paused and deleted)
      const allPlans = await getPublishedTaskPlansForGeneration();

      console.log(`[TaskGenerator] Found ${allPlans.length} published task plans for ${dateStr}`);

      // Group plans by family to optimize queries
      const plansByFamily = this.groupPlansByFamily(allPlans);

      // Generate tasks for each family
      for (const [familyId, plans] of Object.entries(plansByFamily)) {
        try {
          const familyResult = await this.generateForFamily(familyId, plans, targetDate, dateStr);
          result.successCount += familyResult.successCount;
          result.errorCount += familyResult.errorCount;
          result.errors.push(...familyResult.errors);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[TaskGenerator] Failed to generate tasks for family ${familyId}:`, errorMsg);
          result.errorCount += plans.length; // Count all plans in this family as errors
        }
      }

      console.log(`[TaskGenerator] Generation completed: ${result.successCount} tasks created, ${result.errorCount} errors`);
    } catch (error) {
      console.error('[TaskGenerator] Fatal error during task generation:', error);
      result.errorCount += 1;
    }

    return result;
  }

  /**
   * Generate tasks for a specific family
   */
  private async generateForFamily(
    familyId: string,
    plans: typeof taskPlans.$inferSelect[],
    targetDate: Date,
    dateStr: string
  ): Promise<GenerationResult> {
    const result: GenerationResult = {
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    // Get all children in this family
    const children = await db.query.users.findMany({
      where: and(
        eq(users.family_id, familyId),
        eq(users.role, 'child')
      ),
    });

    if (children.length === 0) {
      console.log(`[TaskGenerator] No children found in family ${familyId}`);
      return result;
    }

    // Collect all tasks to create (for batch insert)
    const tasksToCreate: Array<{
      family_id: string;
      task_plan_id: string;
      assigned_child_id: string;
      title: string;
      task_type: '刷牙' | '学习' | '运动' | '家务' | '自定义';
      points: number;
      scheduled_date: string;
    }> = [];

    // For each plan and child combination
    for (const plan of plans) {
      let rule: TaskDateRule;
      try {
        rule = this.parseRule(plan.rule);
      } catch (error) {
        console.error(`[TaskGenerator] Failed to parse rule for plan ${plan.id}:`, error);
        result.errorCount += children.length;
        continue;
      }

      // Get children assigned to this task plan
      const assignedChildRelations = await db.query.taskPlanChildren.findMany({
        where: eq(taskPlanChildren.task_plan_id, plan.id),
      });

      const assignedChildIds = new Set(assignedChildRelations.map(r => r.child_id));

      // If no children explicitly assigned, use all family children
      const targetChildren = assignedChildIds.size > 0
        ? children.filter(c => assignedChildIds.has(c.id))
        : children;

      for (const child of targetChildren) {
        try {
          // Check if task should be generated for this child on this date
          const shouldGenerate = this.shouldGenerateTask(
            rule,
            targetDate,
            new Date(plan.created_at!)
          );

          if (shouldGenerate) {
            // Check if task already exists (idempotency)
            const existingTask = await db.query.tasks.findFirst({
              where: and(
                eq(tasks.task_plan_id, plan.id),
                eq(tasks.assigned_child_id, child.id),
                eq(tasks.scheduled_date, dateStr)
              ),
            });

            if (existingTask) {
              console.log(`[TaskGenerator] Task already exists for plan ${plan.id}, child ${child.id}, date ${dateStr}`);
              continue; // Skip duplicate
            }

            // Add to batch insert list
            tasksToCreate.push({
              family_id: familyId,
              task_plan_id: plan.id,
              assigned_child_id: child.id,
              title: plan.title,
              task_type: plan.task_type,
              points: plan.points,
              scheduled_date: dateStr,
            });

            result.successCount++;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[TaskGenerator] Failed to process plan ${plan.id}, child ${child.id}:`, errorMsg);
          result.errorCount++;
          result.errors.push({
            planId: plan.id,
            childId: child.id,
            error: errorMsg,
          });
        }
      }
    }

    // Batch insert all tasks
    if (tasksToCreate.length > 0) {
      try {
        await batchCreateTasks(tasksToCreate);
        console.log(`[TaskGenerator] Batch created ${tasksToCreate.length} tasks for family ${familyId}`);
      } catch (error) {
        console.error('[TaskGenerator] Batch insert failed:', error);
        result.errorCount += tasksToCreate.length;
        result.successCount -= tasksToCreate.length;
      }
    }

    return result;
  }

  /**
   * Check if a task should be generated based on the date rule
   */
  private shouldGenerateTask(
    rule: TaskDateRule,
    targetDate: Date,
    planStartDate: Date
  ): boolean {
    // Check exclusion dates first
    if (this.isExcluded(rule, targetDate, planStartDate)) {
      return false;
    }

    const dayOfWeek = targetDate.getDay();

    // Check frequency rule
    switch (rule.frequency) {
      case 'daily':
        return true;

      case 'weekly':
        return rule.daysOfWeek?.includes(dayOfWeek) ?? false;

      case 'weekdays':
        // Monday (1) through Friday (5)
        return dayOfWeek >= 1 && dayOfWeek <= 5;

      case 'weekends':
        // Saturday (6) and Sunday (0)
        return dayOfWeek === 0 || dayOfWeek === 6;

      case 'interval':
        return this.matchesIntervalRule(rule, targetDate, planStartDate);

      case 'specific':
        return this.matchesSpecificDates(rule, targetDate);

      default:
        return false;
    }
  }

  /**
   * Check if a date is excluded
   */
  private isExcluded(
    rule: TaskDateRule,
    targetDate: Date,
    _planStartDate: Date
  ): boolean {
    if (rule.excludedDates.dates.length === 0) {
      return false;
    }

    const targetDateStr = this.formatDate(targetDate);
    const targetMonthDay = targetDateStr.substring(5); // MM-DD portion

    for (const excludedDate of rule.excludedDates.dates) {
      if (rule.excludedDates.scope === 'permanent') {
        // For permanent scope, match both exact date and month-day
        if (excludedDate === targetDateStr) {
          return true;
        }
        const excludedMonthDay = excludedDate.substring(5);
        if (excludedMonthDay === targetMonthDay) {
          return true;
        }
      } else {
        // For 'once' scope, only match exact date
        if (excludedDate === targetDateStr) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if date matches interval rule
   *
   * For interval tasks, we count days from the plan creation date.
   * A task is generated on day 0, day N, day 2N, etc.
   */
  private matchesIntervalRule(
    rule: TaskDateRule,
    targetDate: Date,
    planStartDate: Date
  ): boolean {
    const intervalDays = rule.intervalDays ?? 2;

    // Normalize both dates to midnight for accurate day calculation
    const normalizedTarget = new Date(targetDate);
    normalizedTarget.setHours(0, 0, 0, 0);

    const normalizedStart = new Date(planStartDate);
    normalizedStart.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (normalizedTarget.getTime() - normalizedStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Generate on day 0, day intervalDays, day 2*intervalDays, etc.
    return daysDiff >= 0 && daysDiff % intervalDays === 0;
  }

  /**
   * Check if date matches specific dates
   */
  private matchesSpecificDates(rule: TaskDateRule, targetDate: Date): boolean {
    const targetDateStr = this.formatDate(targetDate);
    return rule.specificDates?.includes(targetDateStr) ?? false;
  }

  /**
   * Parse rule JSON string to TaskDateRule
   */
  private parseRule(ruleJson: string): TaskDateRule {
    try {
      const rule = JSON.parse(ruleJson);
      // Validate basic structure
      if (!rule.frequency) {
        throw new Error('Rule missing frequency');
      }
      return rule as TaskDateRule;
    } catch (error) {
      console.error('[TaskGenerator] Failed to parse rule:', error);
      // Return default daily rule
      return {
        frequency: 'daily',
        excludedDates: { dates: [], scope: 'permanent' }
      };
    }
  }

  /**
   * Format date to YYYY-MM-DD string
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Group plans by family ID
   */
  private groupPlansByFamily(
    plans: typeof taskPlans.$inferSelect[]
  ): Record<string, typeof taskPlans.$inferSelect[]> {
    return plans.reduce((acc, plan) => {
      if (!acc[plan.family_id]) {
        acc[plan.family_id] = [];
      }
      acc[plan.family_id].push(plan);
      return acc;
    }, {} as Record<string, typeof taskPlans.$inferSelect[]>);
  }
}

// Export singleton instance
export const taskGenerator = new TaskGenerator();
