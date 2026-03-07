/**
 * BDD Tests for Date Rule Parser
 *
 * Story 2.3: Parent Sets Task Date Rules
 * Task 5: 实现日期规则解析引擎
 *
 * Tests use Given-When-Then format with business language.
 */

import { describe, it, expect } from 'bun:test';
import { DateRuleParser } from '@/lib/services/task-engine/date-rule-parser';
import { type TaskDateRule } from '@/types/task-rule';

describe('[日期规则解析引擎]', () => {
  let parser: DateRuleParser;

  beforeEach(() => {
    parser = new DateRuleParser();
  });

  describe('每日规则解析', () => {
    it('given 家长设置每日规则，when 解析连续7天日期，then 每天都应生成任务', () => {
      // Given: 家长设置每日规则
      const rule: TaskDateRule = {
        frequency: 'daily',
        excludedDates: { dates: [], scope: 'permanent' }
      };
      const planStartDate = new Date('2026-03-01'); // Sunday

      // When: 解析7个日期
      const dates = [
        new Date('2026-03-01'), // Sunday
        new Date('2026-03-02'), // Monday
        new Date('2026-03-03'), // Tuesday
        new Date('2026-03-04'), // Wednesday
        new Date('2026-03-05'), // Thursday
        new Date('2026-03-06'), // Friday
        new Date('2026-03-07'), // Saturday
      ];

      // Then: 每天都应生成任务
      dates.forEach(date => {
        expect(parser.shouldGenerateTask(rule, date, planStartDate)).toBe(true);
      });
    });

    it('given 家长设置每日规则但排除某天，when 解析被排除日期，then 该日期不应生成任务', () => {
      // Given: 每日规则 + 排除3月3日
      const rule: TaskDateRule = {
        frequency: 'daily',
        excludedDates: {
          dates: ['2026-03-03'],
          scope: 'permanent'
        }
      };
      const planStartDate = new Date('2026-03-01');

      // When: 解析3月3日
      const targetDate = new Date('2026-03-03');

      // Then: 3月3日不应生成任务
      expect(parser.shouldGenerateTask(rule, targetDate, planStartDate)).toBe(false);

      // And: 其他日期应正常生成
      const otherDate = new Date('2026-03-04');
      expect(parser.shouldGenerateTask(rule, otherDate, planStartDate)).toBe(true);
    });
  });

  describe('每周规则解析', () => {
    it('given 家长设置每周规则（周一、三、五），when 解析一周日期，then 只有周一、三、五应生成任务', () => {
      // Given: 家长设置每周规则
      const rule: TaskDateRule = {
        frequency: 'weekly',
        daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
        excludedDates: { dates: [], scope: 'permanent' }
      };
      const planStartDate = new Date('2026-03-01'); // Sunday

      // When: 解析一周日期（3/1周日 到 3/7周六）
      const dates = [
        new Date('2026-03-01'), // Sunday (should not generate)
        new Date('2026-03-02'), // Monday (should generate)
        new Date('2026-03-03'), // Tuesday (should not generate)
        new Date('2026-03-04'), // Wednesday (should generate)
        new Date('2026-03-05'), // Thursday (should not generate)
        new Date('2026-03-06'), // Friday (should generate)
        new Date('2026-03-07'), // Saturday (should not generate)
      ];

      // Then: 只有周一、三、五应生成任务
      expect(parser.shouldGenerateTask(rule, dates[0], planStartDate)).toBe(false); // Sunday
      expect(parser.shouldGenerateTask(rule, dates[1], planStartDate)).toBe(true);  // Monday
      expect(parser.shouldGenerateTask(rule, dates[2], planStartDate)).toBe(false); // Tuesday
      expect(parser.shouldGenerateTask(rule, dates[3], planStartDate)).toBe(true);  // Wednesday
      expect(parser.shouldGenerateTask(rule, dates[4], planStartDate)).toBe(false); // Thursday
      expect(parser.shouldGenerateTask(rule, dates[5], planStartDate)).toBe(true);  // Friday
      expect(parser.shouldGenerateTask(rule, dates[6], planStartDate)).toBe(false); // Saturday
    });

    it('given 家长设置每周规则（仅周日），when 解理跨月日期，then 每个周日都应生成任务', () => {
      // Given: 家长设置每周仅周日
      const rule: TaskDateRule = {
        frequency: 'weekly',
        daysOfWeek: [0], // Sunday
        excludedDates: { dates: [], scope: 'permanent' }
      };
      const planStartDate = new Date('2026-03-01'); // Sunday

      // When: 解析跨月日期
      const dates = [
        new Date('2026-03-01'), // Sunday (should generate)
        new Date('2026-03-08'), // Sunday (should generate)
        new Date('2026-03-15'), // Sunday (should generate)
        new Date('2026-03-22'), // Sunday (should generate)
      ];

      // Then: 所有周日都应生成任务
      dates.forEach(date => {
        expect(parser.shouldGenerateTask(rule, date, planStartDate)).toBe(true);
      });
    });
  });

  describe('工作日规则解析', () => {
    it('given 家长设置工作日规则，when 解析一周日期，then 周一到周五应生成任务', () => {
      // Given: 工作日规则
      const rule: TaskDateRule = {
        frequency: 'weekdays',
        excludedDates: { dates: [], scope: 'permanent' }
      };
      const planStartDate = new Date('2026-03-01');

      // When: 解析一周日期
      const dates = [
        new Date('2026-03-01'), // Sunday (should not generate)
        new Date('2026-03-02'), // Monday (should generate)
        new Date('2026-03-03'), // Tuesday (should generate)
        new Date('2026-03-04'), // Wednesday (should generate)
        new Date('2026-03-05'), // Thursday (should generate)
        new Date('2026-03-06'), // Friday (should generate)
        new Date('2026-03-07'), // Saturday (should not generate)
      ];

      // Then: 周一到周五应生成任务
      expect(parser.shouldGenerateTask(rule, dates[0], planStartDate)).toBe(false); // Sunday
      expect(parser.shouldGenerateTask(rule, dates[1], planStartDate)).toBe(true);  // Monday
      expect(parser.shouldGenerateTask(rule, dates[2], planStartDate)).toBe(true);  // Tuesday
      expect(parser.shouldGenerateTask(rule, dates[3], planStartDate)).toBe(true);  // Wednesday
      expect(parser.shouldGenerateTask(rule, dates[4], planStartDate)).toBe(true);  // Thursday
      expect(parser.shouldGenerateTask(rule, dates[5], planStartDate)).toBe(true);  // Friday
      expect(parser.shouldGenerateTask(rule, dates[6], planStartDate)).toBe(false); // Saturday
    });
  });

  describe('周末规则解析', () => {
    it('given 家长设置周末规则，when 解析一周日期，then 周六、周日应生成任务', () => {
      // Given: 周末规则
      const rule: TaskDateRule = {
        frequency: 'weekends',
        excludedDates: { dates: [], scope: 'permanent' }
      };
      const planStartDate = new Date('2026-03-01');

      // When: 解析一周日期
      const dates = [
        new Date('2026-03-01'), // Sunday (should generate)
        new Date('2026-03-02'), // Monday (should not generate)
        new Date('2026-03-03'), // Tuesday (should not generate)
        new Date('2026-03-04'), // Wednesday (should not generate)
        new Date('2026-03-05'), // Thursday (should not generate)
        new Date('2026-03-06'), // Friday (should not generate)
        new Date('2026-03-07'), // Saturday (should generate)
      ];

      // Then: 周六、周日应生成任务
      expect(parser.shouldGenerateTask(rule, dates[0], planStartDate)).toBe(true);  // Sunday
      expect(parser.shouldGenerateTask(rule, dates[1], planStartDate)).toBe(false); // Monday
      expect(parser.shouldGenerateTask(rule, dates[2], planStartDate)).toBe(false); // Tuesday
      expect(parser.shouldGenerateTask(rule, dates[3], planStartDate)).toBe(false); // Wednesday
      expect(parser.shouldGenerateTask(rule, dates[4], planStartDate)).toBe(false); // Thursday
      expect(parser.shouldGenerateTask(rule, dates[5], planStartDate)).toBe(false); // Friday
      expect(parser.shouldGenerateTask(rule, dates[6], planStartDate)).toBe(true);  // Saturday
    });
  });

  describe('自定义间隔规则解析', () => {
    it('given 家长设置每2天规则，when 解析5个日期，then 按间隔生成任务', () => {
      // Given: 家长设置每2天规则
      const rule: TaskDateRule = {
        frequency: 'interval',
        intervalDays: 2,
        excludedDates: { dates: [], scope: 'permanent' }
      };
      const planStartDate = new Date('2026-03-01'); // Starting day

      // When: 解析5个日期
      const dates = [
        new Date('2026-03-01'), // Day 0 (should generate)
        new Date('2026-03-02'), // Day 1 (should not generate)
        new Date('2026-03-03'), // Day 2 (should generate)
        new Date('2026-03-04'), // Day 3 (should not generate)
        new Date('2026-03-05'), // Day 4 (should generate)
      ];

      // Then: 每2天生成一次任务
      expect(parser.shouldGenerateTask(rule, dates[0], planStartDate)).toBe(true);
      expect(parser.shouldGenerateTask(rule, dates[1], planStartDate)).toBe(false);
      expect(parser.shouldGenerateTask(rule, dates[2], planStartDate)).toBe(true);
      expect(parser.shouldGenerateTask(rule, dates[3], planStartDate)).toBe(false);
      expect(parser.shouldGenerateTask(rule, dates[4], planStartDate)).toBe(true);
    });

    it('given 家长设置每3天规则，when 解析多个日期，then 每3天生成一次任务', () => {
      // Given: 每3天规则
      const rule: TaskDateRule = {
        frequency: 'interval',
        intervalDays: 3,
        excludedDates: { dates: [], scope: 'permanent' }
      };
      const planStartDate = new Date('2026-03-01');

      // When: 解析日期
      const dates = [
        new Date('2026-03-01'), // Day 0 (should generate)
        new Date('2026-03-02'), // Day 1 (should not generate)
        new Date('2026-03-03'), // Day 2 (should not generate)
        new Date('2026-03-04'), // Day 3 (should generate)
        new Date('2026-03-05'), // Day 4 (should not generate)
        new Date('2026-03-06'), // Day 5 (should not generate)
        new Date('2026-03-07'), // Day 6 (should generate)
      ];

      // Then: 每3天生成一次任务
      expect(parser.shouldGenerateTask(rule, dates[0], planStartDate)).toBe(true);
      expect(parser.shouldGenerateTask(rule, dates[1], planStartDate)).toBe(false);
      expect(parser.shouldGenerateTask(rule, dates[2], planStartDate)).toBe(false);
      expect(parser.shouldGenerateTask(rule, dates[3], planStartDate)).toBe(true);
      expect(parser.shouldGenerateTask(rule, dates[4], planStartDate)).toBe(false);
      expect(parser.shouldGenerateTask(rule, dates[5], planStartDate)).toBe(false);
      expect(parser.shouldGenerateTask(rule, dates[6], planStartDate)).toBe(true);
    });
  });

  describe('特定日期规则解析', () => {
    it('given 家长设置特定日期规则，when 解析指定日期，then 只有指定日期应生成任务', () => {
      // Given: 特定日期规则
      const rule: TaskDateRule = {
        frequency: 'specific',
        specificDates: ['2026-03-15', '2026-03-20', '2026-03-25'],
        excludedDates: { dates: [], scope: 'permanent' }
      };
      const planStartDate = new Date('2026-03-01');

      // When: 解析多个日期
      const specifiedDate = new Date('2026-03-15');
      const otherDate = new Date('2026-03-16');

      // Then: 只有指定日期应生成任务
      expect(parser.shouldGenerateTask(rule, specifiedDate, planStartDate)).toBe(true);
      expect(parser.shouldGenerateTask(rule, otherDate, planStartDate)).toBe(false);
    });

    it('given 家长设置特定日期但包含排除日期，when 解析被排除日期，then 该日期不应生成任务', () => {
      // Given: 特定日期规则 + 排除其中一个
      const rule: TaskDateRule = {
        frequency: 'specific',
        specificDates: ['2026-03-15', '2026-03-20', '2026-03-25'],
        excludedDates: {
          dates: ['2026-03-20'], // 排除3月20日
          scope: 'permanent'
        }
      };
      const planStartDate = new Date('2026-03-01');

      // When: 解析被排除的日期
      const excludedDate = new Date('2026-03-20');
      const activeDate = new Date('2026-03-15');

      // Then: 被排除的日期不应生成任务
      expect(parser.shouldGenerateTask(rule, excludedDate, planStartDate)).toBe(false);
      expect(parser.shouldGenerateTask(rule, activeDate, planStartDate)).toBe(true);
    });
  });

  describe('排除日期过滤', () => {
    it('given 永久排除日期，when 解析任何年份的该日期，then 都不应生成任务', () => {
      // Given: 每日规则 + 永久排除3月3日
      const rule: TaskDateRule = {
        frequency: 'daily',
        excludedDates: {
          dates: ['2026-03-03'],
          scope: 'permanent'
        }
      };
      const planStartDate = new Date('2026-03-01');

      // When: 解析不同年份的3月3日
      const date2026 = new Date('2026-03-03');
      const date2027 = new Date('2027-03-03');

      // Then: 所有年份的3月3日都不应生成任务
      expect(parser.shouldGenerateTask(rule, date2026, planStartDate)).toBe(false);
      expect(parser.shouldGenerateTask(rule, date2027, planStartDate)).toBe(false);
    });

    it('given 仅本周排除日期，when 解析本周外日期，then 其他日期应正常生成', () => {
      // Given: 每日规则 + 仅本周排除3月3日
      const rule: TaskDateRule = {
        frequency: 'daily',
        excludedDates: {
          dates: ['2026-03-03'],
          scope: 'once'
        }
      };
      const planStartDate = new Date('2026-03-01');

      // When: 解析本周和下周的日期
      const thisWeekDate = new Date('2026-03-03');
      const nextWeekDate = new Date('2026-03-10');

      // Then: 本周的3月3日不应生成，下周的应生成
      expect(parser.shouldGenerateTask(rule, thisWeekDate, planStartDate)).toBe(false);
      expect(parser.shouldGenerateTask(rule, nextWeekDate, planStartDate)).toBe(true);
    });
  });
});

// Helper function for beforeEach
function beforeEach(callback: () => void) {
  callback();
}
