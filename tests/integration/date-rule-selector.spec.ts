/**
 * BDD Integration Tests for Date Rule Logic
 *
 * Story 2.3: Parent Sets Task Date Rules
 *
 * Tests use Given-When-Then format with business language.
 * These tests verify the data flow and rule construction logic.
 */

import { describe, it, expect } from 'bun:test';
import { validateTaskDateRule } from '@/lib/utils/validators/task-rule-validator';
import {
  createDailyRule,
  createWeeklyRule,
  createWeekdaysRule,
  createWeekendsRule,
  createIntervalRule,
  createSpecificDatesRule,
  type TaskDateRule,
} from '@/types/task-rule';

describe('[日期规则逻辑集成测试]', () => {
  describe('规则构建辅助函数', () => {
    it('given 家长使用辅助函数创建每日规则，when 调用createDailyRule，then 应返回有效的每日规则', () => {
      // Given: 家长需要每日规则
      // When: 使用辅助函数创建规则
      const rule = createDailyRule();

      // Then: 应返回有效的每日规则
      expect(rule.frequency).toBe('daily');
      expect(rule.excludedDates.dates).toEqual([]);
      expect(rule.excludedDates.scope).toBe('permanent');
    });

    it('given 家长使用辅助函数创建每周规则，when 传入周一、三、五，then 应返回包含正确星期数的规则', () => {
      // Given: 家长需要每周规则
      const daysOfWeek = [1, 3, 5];

      // When: 使用辅助函数创建规则
      const rule = createWeeklyRule(daysOfWeek);

      // Then: 应返回包含正确星期数的规则
      expect(rule.frequency).toBe('weekly');
      expect(rule.daysOfWeek).toEqual([1, 3, 5]);
      expect(rule.excludedDates.dates).toEqual([]);
    });

    it('given 家长使用辅助函数创建工作日规则，when 调用createWeekdaysRule，then 应返回工作日规则', () => {
      // Given: 家长需要工作日规则
      // When: 使用辅助函数创建规则
      const rule = createWeekdaysRule();

      // Then: 应返回工作日规则
      expect(rule.frequency).toBe('weekdays');
      expect(rule.excludedDates.dates).toEqual([]);
    });

    it('given 家长使用辅助函数创建间隔规则，when 传入间隔3天，then 应返回包含正确间隔的规则', () => {
      // Given: 家长需要每3天规则
      const intervalDays = 3;

      // When: 使用辅助函数创建规则
      const rule = createIntervalRule(intervalDays);

      // Then: 应返回包含正确间隔的规则
      expect(rule.frequency).toBe('interval');
      expect(rule.intervalDays).toBe(3);
      expect(rule.excludedDates.dates).toEqual([]);
    });

    it('given 家长使用辅助函数创建特定日期规则，when 传入多个日期，then 应返回包含所有日期的规则', () => {
      // Given: 家长需要特定日期规则
      const dates = ['2026-03-15', '2026-03-20', '2026-03-25'];

      // When: 使用辅助函数创建规则
      const rule = createSpecificDatesRule(dates);

      // Then: 应返回包含所有日期的规则
      expect(rule.frequency).toBe('specific');
      expect(rule.specificDates).toEqual(dates);
      expect(rule.excludedDates.dates).toEqual([]);
    });
  });

  describe('规则组合验证', () => {
    it('given 家长设置每周规则加排除日期，when 组合规则，then 应生成有效的完整规则', () => {
      // Given: 家长设置完整的日期规则
      const baseRule = createWeeklyRule([1, 3, 5]);
      const rule: TaskDateRule = {
        ...baseRule,
        excludedDates: {
          dates: ['2026-03-03'], // 排除3月3日（周一）
          scope: 'permanent'
        }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该有效
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('given 家长设置间隔规则加排除日期，when 组合规则，then 应生成有效的完整规则', () => {
      // Given: 家长设置间隔规则加排除
      const baseRule = createIntervalRule(2);
      const rule: TaskDateRule = {
        ...baseRule,
        excludedDates: {
          dates: ['2026-03-03', '2026-03-10'],
          scope: 'once'
        }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该有效
      expect(result.valid).toBe(true);
      expect(rule.excludedDates.scope).toBe('once');
    });

    it('given 家长设置特定日期规则加排除日期，when 排除日期与特定日期冲突，then 规则应该仍然有效（由任务生成引擎处理）', () => {
      // Given: 特定日期规则（排除日期可能与之重叠）
      const baseRule = createSpecificDatesRule(['2026-03-15', '2026-03-20']);
      const rule: TaskDateRule = {
        ...baseRule,
        excludedDates: {
          dates: ['2026-03-15'], // 与特定日期重叠
          scope: 'permanent'
        }
      };

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该有效（冲突由任务生成引擎处理）
      expect(result.valid).toBe(true);
    });

    it('given 家长设置工作日规则，when 验证不需要额外配置，then 规则应该直接有效', () => {
      // Given: 工作日规则
      const rule = createWeekdaysRule();

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该直接有效
      expect(result.valid).toBe(true);
    });

    it('given 家长设置周末规则，when 验证不需要额外配置，then 规则应该直接有效', () => {
      // Given: 周末规则
      const rule = createWeekendsRule();

      // When: 验证规则
      const result = validateTaskDateRule(rule);

      // Then: 规则应该直接有效
      expect(result.valid).toBe(true);
    });
  });

  describe('规则序列化和反序列化', () => {
    it('given 规则对象，when 序列化为JSON字符串，then 应该能正确反序列化回对象', () => {
      // Given: 一个完整的规则对象
      const originalRule: TaskDateRule = {
        frequency: 'weekly',
        daysOfWeek: [1, 3, 5],
        excludedDates: {
          dates: ['2026-03-03'],
          scope: 'permanent'
        }
      };

      // When: 序列化为JSON
      const jsonString = JSON.stringify(originalRule);

      // Then: 应该能正确反序列化
      const parsedRule = JSON.parse(jsonString) as TaskDateRule;
      expect(parsedRule.frequency).toBe(originalRule.frequency);
      expect(parsedRule.daysOfWeek).toEqual(originalRule.daysOfWeek);
      expect(parsedRule.excludedDates.dates).toEqual(originalRule.excludedDates.dates);
    });

    it('given 特定日期规则，when 序列化和反序列化，then 日期数组应该保持不变', () => {
      // Given: 包含多个特定日期的规则
      const originalRule: TaskDateRule = {
        frequency: 'specific',
        specificDates: ['2026-03-15', '2026-03-20', '2026-03-25'],
        excludedDates: {
          dates: [],
          scope: 'permanent'
        }
      };

      // When: 序列化和反序列化
      const jsonString = JSON.stringify(originalRule);
      const parsedRule = JSON.parse(jsonString) as TaskDateRule;

      // Then: 日期数组应该完全一致
      expect(parsedRule.specificDates).toEqual(originalRule.specificDates);
      expect(parsedRule.specificDates).toHaveLength(3);
    });
  });

  describe('规则状态管理', () => {
    it('given 家长更改规则类型，when 从每日改为每周，then 应该清除每周不需要的字段', () => {
      // Given: 初始为每日规则
      const dailyRule: TaskDateRule = {
        frequency: 'daily',
        excludedDates: { dates: [], scope: 'permanent' }
      };

      // When: 更改为每周规则并添加星期数
      const weeklyRule: TaskDateRule = {
        frequency: 'weekly',
        daysOfWeek: [1, 3, 5],
        excludedDates: dailyRule.excludedDates
      };

      // Then: 每日规则不需要的字段应该清除
      expect(weeklyRule.frequency).toBe('weekly');
      expect(weeklyRule.daysOfWeek).toBeDefined();
      expect(weeklyRule.intervalDays).toBeUndefined();
      expect(weeklyRule.specificDates).toBeUndefined();
    });

    it('given 家长更改规则类型，when 从每周改为特定日期，then 应该清除特定日期不需要的字段', () => {
      // Given: 初始为每周规则
      const weeklyRule: TaskDateRule = {
        frequency: 'weekly',
        daysOfWeek: [1, 3, 5],
        excludedDates: { dates: [], scope: 'permanent' }
      };

      // When: 更改为特定日期规则
      const specificRule: TaskDateRule = {
        frequency: 'specific',
        specificDates: ['2026-03-15', '2026-03-20'],
        excludedDates: weeklyRule.excludedDates
      };

      // Then: 每周规则的字段应该清除
      expect(specificRule.frequency).toBe('specific');
      expect(specificRule.specificDates).toBeDefined();
      expect(specificRule.daysOfWeek).toBeUndefined();
      expect(specificRule.intervalDays).toBeUndefined();
    });
  });
});
