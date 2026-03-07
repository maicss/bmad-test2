/**
 * Date Rule Parser
 *
 * Story 2.3: Parent Sets Task Date Rules
 * Task 5: 实现日期规则解析引擎
 *
 * Parses task date rules to determine if a task should be generated on a specific date.
 * This is the core engine for automatic task instance generation (Story 2.4).
 *
 * The parser checks:
 * 1. If the target date is excluded
 * 2. If the target date matches the frequency rule
 */

import { format } from 'date-fns';
import type { TaskDateRule } from '@/types/task-rule';

/**
 * Date Rule Parser Class
 *
 * Determines whether a task should be generated on a specific date
 * based on the task plan's date rule configuration.
 */
export class DateRuleParser {
  /**
   * Check if a task should be generated on a specific date
   *
   * @param rule - Date rule from task plan
   * @param targetDate - Date to check
   * @param planStartDate - When the task plan was created (for interval calculation)
   * @returns true if task should be generated on targetDate
   */
  shouldGenerateTask(
    rule: TaskDateRule,
    targetDate: Date,
    planStartDate: Date
  ): boolean {
    // Check exclusion dates first
    if (this.isExcluded(rule, targetDate)) {
      return false;
    }

    // Apply frequency logic
    switch (rule.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return this.checkWeeklyRule(rule, targetDate);
      case 'weekdays':
        return this.checkWeekdaysRule(targetDate);
      case 'weekends':
        return this.checkWeekendsRule(targetDate);
      case 'interval':
        return this.checkIntervalRule(rule, targetDate, planStartDate);
      case 'specific':
        return this.checkSpecificDatesRule(rule, targetDate);
      default:
        return false;
    }
  }

  /**
   * Check if a date is excluded
   *
   * @param rule - Date rule containing exclusion configuration
   * @param targetDate - Date to check
   * @returns true if date should be excluded
   */
  private isExcluded(rule: TaskDateRule, targetDate: Date): boolean {
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    const targetMonthDay = format(targetDate, 'MM-dd');

    // Check if target date is in exclusion list
    if (!rule.excludedDates?.dates || rule.excludedDates.dates.length === 0) {
      return false;
    }

    // For 'once' scope, only exclude exact date matches within the current week
    if (rule.excludedDates.scope === 'once') {
      return this.isSameWeek(targetDate, new Date()) && rule.excludedDates.dates.includes(targetDateStr);
    }

    // For 'permanent' scope, check both exact date and month-day matches
    // This allows permanent exclusions to work across years (e.g., holidays)
    return rule.excludedDates.dates.some(excludedDate => {
      // First try exact match
      if (excludedDate === targetDateStr) {
        return true;
      }
      // Then try month-day match for permanent exclusions
      const excludedMonthDay = format(new Date(excludedDate), 'MM-dd');
      return excludedMonthDay === targetMonthDay;
    });
  }

  /**
   * Check if two dates are in the same week
   *
   * @param date1 - First date
   * @param date2 - Second date
   * @returns true if dates are in the same week
   */
  private isSameWeek(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Set to start of week (Sunday)
    d1.setDate(d1.getDate() - d1.getDay());
    d2.setDate(d2.getDate() - d2.getDay());

    // Reset time
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    return d1.getTime() === d2.getTime();
  }

  /**
   * Check weekly rule
   *
   * @param rule - Date rule with daysOfWeek
   * @param targetDate - Date to check
   * @returns true if target date's day of week matches rule
   */
  private checkWeeklyRule(rule: TaskDateRule, targetDate: Date): boolean {
    const dayOfWeek = targetDate.getDay();
    return rule.daysOfWeek?.includes(dayOfWeek) ?? false;
  }

  /**
   * Check weekdays rule (Monday-Friday)
   *
   * @param targetDate - Date to check
   * @returns true if target date is Monday-Friday
   */
  private checkWeekdaysRule(targetDate: Date): boolean {
    const dayOfWeek = targetDate.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // 1=Monday, 5=Friday
  }

  /**
   * Check weekends rule (Saturday-Sunday)
   *
   * @param targetDate - Date to check
   * @returns true if target date is Saturday or Sunday
   */
  private checkWeekendsRule(targetDate: Date): boolean {
    const dayOfWeek = targetDate.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0=Sunday, 6=Saturday
  }

  /**
   * Check interval rule
   *
   * @param rule - Date rule with intervalDays
   * @param targetDate - Date to check
   * @param planStartDate - When the task plan was created
   * @returns true if target date matches the interval
   */
  private checkIntervalRule(rule: TaskDateRule, targetDate: Date, planStartDate: Date): boolean {
    const intervalDays = rule.intervalDays || 1;

    // Calculate days since plan start
    const daysSinceStart = Math.floor(
      (targetDate.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if days since start is divisible by interval
    return daysSinceStart >= 0 && daysSinceStart % intervalDays === 0;
  }

  /**
   * Check specific dates rule
   *
   * @param rule - Date rule with specificDates
   * @param targetDate - Date to check
   * @returns true if target date is in specific dates list
   */
  private checkSpecificDatesRule(rule: TaskDateRule, targetDate: Date): boolean {
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    return rule.specificDates?.includes(targetDateStr) ?? false;
  }

  /**
   * Get all task generation dates within a date range
   *
   * Utility method for preview functionality (Story 2.3 Task 7)
   *
   * @param rule - Date rule
   * @param startDate - Range start date
   * @param endDate - Range end date
   * @param planStartDate - When the task plan was created
   * @returns Array of dates where tasks should be generated
   */
  getGenerationDatesInRange(
    rule: TaskDateRule,
    startDate: Date,
    endDate: Date,
    planStartDate: Date
  ): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (this.shouldGenerateTask(rule, currentDate, planStartDate)) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  /**
   * Get task generation statistics for a date range
   *
   * Utility method for preview functionality (Story 2.3 Task 7)
   *
   * @param rule - Date rule
   * @param startDate - Range start date
   * @param endDate - Range end date
   * @param planStartDate - When the task plan was created
   * @returns Object containing count and list of generation dates
   */
  getGenerationStats(
    rule: TaskDateRule,
    startDate: Date,
    endDate: Date,
    planStartDate: Date
  ): {
    count: number;
    dates: Date[];
    excludedCount: number;
  } {
    const dates = this.getGenerationDatesInRange(rule, startDate, endDate, planStartDate);

    // Count excluded dates in range
    const excludedCount = rule.excludedDates?.dates.filter(dateStr => {
      const date = new Date(dateStr);
      return date >= startDate && date <= endDate;
    }).length || 0;

    return {
      count: dates.length,
      dates,
      excludedCount,
    };
  }
}
