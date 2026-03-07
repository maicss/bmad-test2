/**
 * Task Date Rule Type Definitions
 *
 * Story 2.3: Parent Sets Task Date Rules
 *
 * Defines the structure for date rules used in task plans.
 * Rules are stored as JSON in the task_plans.rule field.
 */

/**
 * Date frequency types for task generation
 * - daily: Every day
 * - weekly: Specific days of week (requires daysOfWeek)
 * - weekdays: Monday through Friday
 * - weekends: Saturday and Sunday
 * - interval: Every N days (requires intervalDays)
 * - specific: Only on specific dates (requires specificDates)
 */
export type FrequencyType = 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'interval' | 'specific';

/**
 * Exclusion date configuration
 * - dates: Array of date strings in YYYY-MM-DD format
 * - scope: 'permanent' = always exclude these dates, 'once' = exclude only for current week
 */
export interface ExclusionDates {
  dates: string[];
  scope: 'once' | 'permanent';
}

/**
 * Main task date rule structure
 * Defines when tasks should be generated based on date patterns
 */
export interface TaskDateRule {
  /** Frequency type determining the generation pattern */
  frequency: FrequencyType;

  /** For 'weekly': which days of week (0=Sunday, 1=Monday, ..., 6=Saturday) */
  daysOfWeek?: number[];

  /** For 'interval': repeat every N days (must be > 0) */
  intervalDays?: number;

  /** For 'specific': array of date strings (YYYY-MM-DD format) */
  specificDates?: string[];

  /** Dates to exclude from task generation */
  excludedDates: ExclusionDates;
}

/**
 * Result of date rule validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Date format for serialization/deserialization
 */
export const DATE_FORMAT = 'YYYY-MM-DD' as const;

/**
 * Helper to create a default exclusion dates config
 */
export function createDefaultExclusionDates(): ExclusionDates {
  return { dates: [], scope: 'permanent' };
}

/**
 * Helper to create a daily rule
 */
export function createDailyRule(excludedDates: string[] = []): TaskDateRule {
  return {
    frequency: 'daily',
    excludedDates: { dates: excludedDates, scope: 'permanent' }
  };
}

/**
 * Helper to create a weekly rule
 */
export function createWeeklyRule(daysOfWeek: number[], excludedDates: string[] = []): TaskDateRule {
  return {
    frequency: 'weekly',
    daysOfWeek,
    excludedDates: { dates: excludedDates, scope: 'permanent' }
  };
}

/**
 * Helper to create a weekdays rule
 */
export function createWeekdaysRule(excludedDates: string[] = []): TaskDateRule {
  return {
    frequency: 'weekdays',
    excludedDates: { dates: excludedDates, scope: 'permanent' }
  };
}

/**
 * Helper to create a weekends rule
 */
export function createWeekendsRule(excludedDates: string[] = []): TaskDateRule {
  return {
    frequency: 'weekends',
    excludedDates: { dates: excludedDates, scope: 'permanent' }
  };
}

/**
 * Helper to create an interval rule
 */
export function createIntervalRule(intervalDays: number, excludedDates: string[] = []): TaskDateRule {
  return {
    frequency: 'interval',
    intervalDays,
    excludedDates: { dates: excludedDates, scope: 'permanent' }
  };
}

/**
 * Helper to create a specific dates rule
 */
export function createSpecificDatesRule(specificDates: string[], excludedDates: string[] = []): TaskDateRule {
  return {
    frequency: 'specific',
    specificDates,
    excludedDates: { dates: excludedDates, scope: 'permanent' }
  };
}
