/**
 * Task Date Rule Validator
 *
 * Story 2.3: Parent Sets Task Date Rules
 *
 * Validates task date rule structures to ensure data integrity.
 * Uses business language for error messages.
 */

import {
  type TaskDateRule,
  type FrequencyType,
  type ValidationResult,
  type ExclusionDates,
} from '@/types/task-rule';

/**
 * Valid frequency types for validation
 */
const VALID_FREQUENCY_TYPES: FrequencyType[] = [
  'daily',
  'weekly',
  'weekdays',
  'weekends',
  'interval',
  'specific'
];

/**
 * Validates a date string in YYYY-MM-DD format
 */
function isValidDateFormat(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  // Check format: YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  // Check if it's a valid date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validates exclusion dates configuration
 */
function validateExclusionDates(excludedDates: ExclusionDates): string[] {
  const errors: string[] = [];

  // Check if excludedDates exists
  if (!excludedDates) {
    errors.push('排除日期配置不能为空');
    return errors;
  }

  // Check dates array
  if (!Array.isArray(excludedDates.dates)) {
    errors.push('排除日期必须是数组');
    return errors;
  }

  // Validate each date format
  for (const date of excludedDates.dates) {
    if (typeof date !== 'string') {
      errors.push(`排除日期必须是字符串: ${date}`);
    } else if (!isValidDateFormat(date)) {
      errors.push(`排除日期格式无效，应为YYYY-MM-DD: ${date}`);
    }
  }

  // Validate scope
  if (excludedDates.scope !== 'once' && excludedDates.scope !== 'permanent') {
    errors.push('排除范围必须是"仅本周"或"永久"');
  }

  return errors;
}

/**
 * Validates weekly rule configuration
 */
function validateWeeklyRule(rule: TaskDateRule): string[] {
  const errors: string[] = [];

  if (!rule.daysOfWeek || !Array.isArray(rule.daysOfWeek) || rule.daysOfWeek.length === 0) {
    errors.push('每周规则必须指定至少一个星期');
    return errors;
  }

  // Validate each day of week is 0-6
  for (const day of rule.daysOfWeek) {
    if (typeof day !== 'number' || day < 0 || day > 6) {
      errors.push(`星期数必须在0-6之间（0=周日，6=周六）: ${day}`);
    }
  }

  // Check for duplicates
  const uniqueDays = new Set(rule.daysOfWeek);
  if (uniqueDays.size !== rule.daysOfWeek.length) {
    errors.push('每周规则中的星期数不能重复');
  }

  return errors;
}

/**
 * Validates interval rule configuration
 */
function validateIntervalRule(rule: TaskDateRule): string[] {
  const errors: string[] = [];

  if (rule.intervalDays === undefined || rule.intervalDays === null) {
    errors.push('自定义间隔规则必须指定间隔天数');
    return errors;
  }

  if (typeof rule.intervalDays !== 'number') {
    errors.push('间隔天数必须是数字');
    return errors;
  }

  if (rule.intervalDays <= 0) {
    errors.push('间隔天数必须大于0');
  }

  if (rule.intervalDays > 365) {
    errors.push('间隔天数不能超过365天');
  }

  return errors;
}

/**
 * Validates specific dates rule configuration
 */
function validateSpecificDatesRule(rule: TaskDateRule): string[] {
  const errors: string[] = [];

  if (!rule.specificDates || !Array.isArray(rule.specificDates) || rule.specificDates.length === 0) {
    errors.push('特定日期规则必须指定至少一个日期');
    return errors;
  }

  // Validate each date format
  for (const date of rule.specificDates) {
    if (typeof date !== 'string') {
      errors.push(`特定日期必须是字符串: ${date}`);
    } else if (!isValidDateFormat(date)) {
      errors.push(`特定日期格式无效，应为YYYY-MM-DD: ${date}`);
    }
  }

  // Check for duplicates
  const uniqueDates = new Set(rule.specificDates);
  if (uniqueDates.size !== rule.specificDates.length) {
    errors.push('特定日期不能重复');
  }

  return errors;
}

/**
 * Validates a task date rule
 *
 * @param rule - The task date rule to validate
 * @returns Validation result with valid flag and error messages
 */
export function validateTaskDateRule(rule: unknown): ValidationResult {
  const errors: string[] = [];

  // Check if rule exists and is an object
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
    return {
      valid: false,
      errors: ['日期规则必须是对象']
    };
  }

  const typedRule = rule as Partial<TaskDateRule>;

  // Validate frequency
  if (!typedRule.frequency || typeof typedRule.frequency !== 'string') {
    errors.push('必须指定频率类型');
  } else if (!VALID_FREQUENCY_TYPES.includes(typedRule.frequency as FrequencyType)) {
    errors.push(
      `无效的频率类型: ${typedRule.frequency}。` +
      `有效类型为: 每日、每周、工作日、周末、自定义间隔、特定日期`
    );
  }

  // If frequency is invalid, don't continue with other validations
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const frequency = typedRule.frequency as FrequencyType;

  // Frequency-specific validations
  switch (frequency) {
    case 'weekly':
      errors.push(...validateWeeklyRule(typedRule as TaskDateRule));
      break;

    case 'interval':
      errors.push(...validateIntervalRule(typedRule as TaskDateRule));
      break;

    case 'specific':
      errors.push(...validateSpecificDatesRule(typedRule as TaskDateRule));
      break;

    case 'daily':
    case 'weekdays':
    case 'weekends':
      // These types don't require additional fields
      break;
  }

  // Validate excluded dates (required for all rule types)
  if (!typedRule.excludedDates) {
    errors.push('必须配置排除日期（即使为空）');
  } else {
    errors.push(...validateExclusionDates(typedRule.excludedDates));
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Type guard to check if a value is a valid TaskDateRule
 *
 * @param value - Value to check
 * @returns true if value is a valid TaskDateRule
 */
export function isTaskDateRule(value: unknown): value is TaskDateRule {
  const result = validateTaskDateRule(value);
  return result.valid;
}

// Re-export types for convenience
export type { TaskDateRule, FrequencyType, ValidationResult };
