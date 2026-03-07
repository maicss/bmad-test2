/**
 * BDD Tests for Task Date Rule Validator
 *
 * Story 2.3: Parent Sets Task Date Rules
 *
 * Tests use Given-When-Then format with business language.
 */

import { describe, it, expect } from 'bun:test';
import {
  validateTaskDateRule,
  type TaskDateRule,
  type FrequencyType,
} from '@/lib/utils/validators/task-rule-validator';

describe('[日期规则验证]', () => {
  describe('每日规则验证', () => {
    it('given 家长设置每日规则，when 验证规则，then 规则应该有效', () => {
      // Given: 家长设置有效的每日规则
      const rule: TaskDateRule = {
        frequency: 'daily',
        excludedDates: { dates: [], scope: 'permanent' }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该有效
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('每周规则验证', () => {
    it('given 家长设置每周规则（周一、三、五），when 验证规则，then 规则应该有效', () => {
      // Given: 家长设置每周规则
      const rule: TaskDateRule = {
        frequency: 'weekly',
        daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
        excludedDates: { dates: [], scope: 'permanent' }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该有效
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('given 家长设置每周规则但星期数无效，when 验证规则，then 应该返回错误', () => {
      // Given: 家长设置包含无效星期数的规则
      const rule = {
        frequency: 'weekly' as FrequencyType,
        daysOfWeek: [1, 7, 8], // 8 is invalid (should be 0-6)
        excludedDates: { dates: [], scope: 'permanent' as const }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 应该返回验证错误
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e: string) => e.includes('星期'))).toBe(true);
    });

    it('given 家长设置每周规则但没有指定星期，when 验证规则，then 应该返回错误', () => {
      // Given: 每周规则缺少daysOfWeek
      const rule = {
        frequency: 'weekly' as FrequencyType,
        excludedDates: { dates: [], scope: 'permanent' as const }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 应该返回验证错误
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('星期'))).toBe(true);
    });
  });

  describe('工作日和周末规则验证', () => {
    it('given 家长设置工作日规则，when 验证规则，then 规则应该有效', () => {
      // Given: 工作日规则
      const rule: TaskDateRule = {
        frequency: 'weekdays',
        excludedDates: { dates: [], scope: 'permanent' }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该有效
      expect(result.valid).toBe(true);
    });

    it('given 家长设置周末规则，when 验证规则，then 规则应该有效', () => {
      // Given: 周末规则
      const rule: TaskDateRule = {
        frequency: 'weekends',
        excludedDates: { dates: [], scope: 'permanent' }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该有效
      expect(result.valid).toBe(true);
    });
  });

  describe('自定义间隔规则验证', () => {
    it('given 家长设置每2天规则，when 验证规则，then 规则应该有效', () => {
      // Given: 每2天规则
      const rule: TaskDateRule = {
        frequency: 'interval',
        intervalDays: 2,
        excludedDates: { dates: [], scope: 'permanent' }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该有效
      expect(result.valid).toBe(true);
    });

    it('given 家长设置间隔为0，when 验证规则，then 应该返回错误', () => {
      // Given: 间隔天数无效（必须>0）
      const rule = {
        frequency: 'interval' as FrequencyType,
        intervalDays: 0,
        excludedDates: { dates: [], scope: 'permanent' as const }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 应该返回验证错误
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('间隔'))).toBe(true);
    });

    it('given 家长设置间隔为负数，when 验证规则，then 应该返回错误', () => {
      // Given: 负数间隔
      const rule = {
        frequency: 'interval' as FrequencyType,
        intervalDays: -1,
        excludedDates: { dates: [], scope: 'permanent' as const }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 应该返回验证错误
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('间隔'))).toBe(true);
    });

    it('given 家长设置间隔规则但没有指定间隔，when 验证规则，then 应该返回错误', () => {
      // Given: 缺少intervalDays
      const rule = {
        frequency: 'interval' as FrequencyType,
        excludedDates: { dates: [], scope: 'permanent' as const }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 应该返回验证错误
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('间隔'))).toBe(true);
    });
  });

  describe('特定日期规则验证', () => {
    it('given 家长设置特定日期规则，when 验证规则，then 规则应该有效', () => {
      // Given: 特定日期规则
      const rule: TaskDateRule = {
        frequency: 'specific',
        specificDates: ['2026-03-15', '2026-03-20', '2026-03-25'],
        excludedDates: { dates: [], scope: 'permanent' }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该有效
      expect(result.valid).toBe(true);
    });

    it('given 家长设置特定日期但格式无效，when 验证规则，then 应该返回错误', () => {
      // Given: 无效日期格式
      const rule = {
        frequency: 'specific' as FrequencyType,
        specificDates: ['2026/03/15', '03-20-2026'], // Wrong format
        excludedDates: { dates: [], scope: 'permanent' as const }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 应该返回验证错误
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('日期格式'))).toBe(true);
    });

    it('given 家长设置特定日期但没有指定日期，when 验证规则，then 应该返回错误', () => {
      // Given: 缺少specificDates
      const rule = {
        frequency: 'specific' as FrequencyType,
        excludedDates: { dates: [], scope: 'permanent' as const }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 应该返回验证错误
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('特定日期'))).toBe(true);
    });
  });

  describe('排除日期验证', () => {
    it('given 家长设置排除日期，when 验证规则，then 排除日期应该有效', () => {
      // Given: 包含排除日期的规则
      const rule: TaskDateRule = {
        frequency: 'daily',
        excludedDates: {
          dates: ['2026-03-03', '2026-03-10'],
          scope: 'permanent'
        }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该有效
      expect(result.valid).toBe(true);
    });

    it('given 家长设置排除日期但格式无效，when 验证规则，then 应该返回错误', () => {
      // Given: 无效的排除日期格式
      const rule = {
        frequency: 'daily' as FrequencyType,
        excludedDates: {
          dates: ['2026/03/03'], // Wrong format
          scope: 'permanent' as const
        }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 应该返回验证错误
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('排除日期') || e.includes('日期格式'))).toBe(true);
    });

    it('given 家长设置仅本周排除，when 验证规则，then 排除范围应该有效', () => {
      // Given: 仅本周排除
      const rule: TaskDateRule = {
        frequency: 'daily',
        excludedDates: {
          dates: ['2026-03-03'],
          scope: 'once'
        }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该有效
      expect(result.valid).toBe(true);
    });
  });

  describe('规则类型验证', () => {
    it('given 家长使用无效频率类型，when 验证规则，then 应该返回错误', () => {
      // Given: 无效的频率类型
      const rule = {
        frequency: 'invalid_type' as FrequencyType,
        excludedDates: { dates: [], scope: 'permanent' as const }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 应该返回验证错误
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('频率') || e.includes('类型'))).toBe(true);
    });
  });
});
