/**
 * Integration Tests for Points Suggestions Module
 *
 * Story 2.2: Parent Sets Task Points Value
 * Task 3: Implement task difficulty-points value suggestion system
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 */

import { describe, it, expect } from 'bun:test';
import {
  POINT_SUGGESTIONS,
  getPointsRange,
  getDefaultPoints,
  isValidPoints,
  validatePoints,
  getDifficultyFromPoints,
  POINTS_VALIDATION_ERRORS,
} from '@/lib/constants/points-suggestions';

describe('Points Suggestions Integration Tests', () => {
  describe('given 查询简单任务积分范围，when 调用获取函数，then 返回1-10分范围', () => {
    it('should get simple task points range', () => {
      // Given: 查询简单任务等级
      const difficulty = 'simple';

      // When: 获取积分范围
      const range = getPointsRange(difficulty);

      // Then: 返回1-10分范围
      expect(range.min).toBe(1);
      expect(range.max).toBe(10);
      expect(range.label).toBe('简单');
      expect(range.color).toBe('green');
    });
  });

  describe('given 查询中等任务积分范围，when 调用获取函数，then 返回15-30分范围', () => {
    it('should get medium task points range', () => {
      // Given: 查询中等任务等级
      const difficulty = 'medium';

      // When: 获取积分范围
      const range = getPointsRange(difficulty);

      // Then: 返回15-30分范围
      expect(range.min).toBe(15);
      expect(range.max).toBe(30);
      expect(range.label).toBe('中等');
      expect(range.color).toBe('yellow');
    });
  });

  describe('given 查询困难任务积分范围，when 调用获取函数，then 返回30-50分范围', () => {
    it('should get hard task points range', () => {
      // Given: 查询困难任务等级
      const difficulty = 'hard';

      // When: 获取积分范围
      const range = getPointsRange(difficulty);

      // Then: 返回30-50分范围
      expect(range.min).toBe(30);
      expect(range.max).toBe(50);
      expect(range.label).toBe('困难');
      expect(range.color).toBe('red');
    });
  });

  describe('given 查询特殊任务积分范围，when 调用获取函数，then 返回50-100分范围', () => {
    it('should get special task points range', () => {
      // Given: 查询特殊任务等级
      const difficulty = 'special';

      // When: 获取积分范围
      const range = getPointsRange(difficulty);

      // Then: 返回50-100分范围
      expect(range.min).toBe(50);
      expect(range.max).toBe(100);
      expect(range.label).toBe('特殊');
      expect(range.color).toBe('purple');
    });
  });

  describe('given 获取默认积分值，when 查询简单任务，then 返回5分（中位数）', () => {
    it('should get default points for simple task', () => {
      // Given: 简单任务等级
      const difficulty = 'simple';

      // When: 获取默认积分
      const defaultPoints = getDefaultPoints(difficulty);

      // Then: 返回中位数 (1+10)/2 = 5.5 -> 5
      expect(defaultPoints).toBe(5);
    });
  });

  describe('given 获取默认积分值，when 查询中等任务，then 返回22分（中位数）', () => {
    it('should get default points for medium task', () => {
      // Given: 中等任务等级
      const difficulty = 'medium';

      // When: 获取默认积分
      const defaultPoints = getDefaultPoints(difficulty);

      // Then: 返回中位数 (15+30)/2 = 22.5 -> 22
      expect(defaultPoints).toBe(22);
    });
  });

  describe('given 获取默认积分值，when 查询困难任务，then 返回40分（中位数）', () => {
    it('should get default points for hard task', () => {
      // Given: 困难任务等级
      const difficulty = 'hard';

      // When: 获取默认积分
      const defaultPoints = getDefaultPoints(difficulty);

      // Then: 返回中位数 (30+50)/2 = 40
      expect(defaultPoints).toBe(40);
    });
  });

  describe('given 获取默认积分值，when 查询特殊任务，then 返回75分（中位数）', () => {
    it('should get default points for special task', () => {
      // Given: 特殊任务等级
      const difficulty = 'special';

      // When: 获取默认积分
      const defaultPoints = getDefaultPoints(difficulty);

      // Then: 返回中位数 (50+100)/2 = 75
      expect(defaultPoints).toBe(75);
    });
  });

  describe('given 验证积分值，when 输入有效整数，then 返回true', () => {
    it('should validate valid integer points', () => {
      // Given: 有效积分值
      const validPoints = [1, 10, 50, 100];

      // When: 验证每个值
      const results = validPoints.map(p => isValidPoints(p));

      // Then: 所有值都有效
      expect(results.every(r => r === true)).toBe(true);
    });
  });

  describe('given 验证积分值，when 输入0或负数，then 返回false', () => {
    it('should invalidate zero or negative points', () => {
      // Given: 无效积分值
      const invalidPoints = [0, -1, -100];

      // When: 验证每个值
      const results = invalidPoints.map(p => isValidPoints(p));

      // Then: 所有值都无效
      expect(results.every(r => r === false)).toBe(true);
    });
  });

  describe('given 验证积分值，when 输入超过100的数，then 返回false', () => {
    it('should invalidate points over 100', () => {
      // Given: 超出范围的积分值
      const invalidPoints = [101, 150, 1000];

      // When: 验证每个值
      const results = invalidPoints.map(p => isValidPoints(p));

      // Then: 所有值都无效
      expect(results.every(r => r === false)).toBe(true);
    });
  });

  describe('given 验证积分值，when 输入小数，then 返回false', () => {
    it('should invalidate decimal points', () => {
      // Given: 小数积分值
      const invalidPoints = [1.5, 10.9, 50.1];

      // When: 验证每个值
      const results = invalidPoints.map(p => isValidPoints(p));

      // Then: 所有值都无效
      expect(results.every(r => r === false)).toBe(true);
    });
  });

  describe('given 严格验证积分值，when 输入小数，then 抛出错误', () => {
    it('should throw error for decimal points', () => {
      // Given: 小数积分值
      const decimalPoints = 10.5;

      // When: 验证积分值
      // Then: 抛出错误
      expect(() => validatePoints(decimalPoints)).toThrow('积分值必须为整数');
    });
  });

  describe('given 严格验证积分值，when 输入0，then 抛出错误', () => {
    it('should throw error for zero points', () => {
      // Given: 0分
      const zeroPoints = 0;

      // When: 验证积分值
      // Then: 抛出错误
      expect(() => validatePoints(zeroPoints)).toThrow('积分值必须在1-100之间');
    });
  });

  describe('given 严格验证积分值，when 输入101，then 抛出错误', () => {
    it('should throw error for points over 100', () => {
      // Given: 超出范围的积分值
      const overPoints = 101;

      // When: 验证积分值
      // Then: 抛出错误
      expect(() => validatePoints(overPoints)).toThrow('积分值必须在1-100之间');
    });
  });

  describe('given 根据积分值推断难度，when 输入1-10分，then 返回simple', () => {
    it('should infer simple difficulty from low points', () => {
      // Given: 1-10分
      const testCases = [1, 5, 10];

      // When: 推断难度
      const results = testCases.map(p => getDifficultyFromPoints(p));

      // Then: 都返回simple
      expect(results.every(r => r === 'simple')).toBe(true);
    });
  });

  describe('given 根据积分值推断难度，when 输入15-30分，then 返回medium', () => {
    it('should infer medium difficulty from medium points', () => {
      // Given: 15-30分
      const testCases = [15, 22, 30];

      // When: 推断难度
      const results = testCases.map(p => getDifficultyFromPoints(p));

      // Then: 都返回medium
      expect(results.every(r => r === 'medium')).toBe(true);
    });
  });

  describe('given 根据积分值推断难度，when 输入31-50分，then 返回hard', () => {
    it('should infer hard difficulty from high points', () => {
      // Given: 31-50分（注意：30分属于medium范围）
      const testCases = [31, 40, 50];

      // When: 推断难度
      const results = testCases.map(p => getDifficultyFromPoints(p));

      // Then: 都返回hard
      expect(results.every(r => r === 'hard')).toBe(true);
    });
  });

  describe('given 根据积分值推断难度，when 输入51-100分，then 返回special', () => {
    it('should infer special difficulty from very high points', () => {
      // Given: 51-100分（注意：50分属于hard范围）
      const testCases = [51, 75, 100];

      // When: 推断难度
      const results = testCases.map(p => getDifficultyFromPoints(p));

      // Then: 都返回special
      expect(results.every(r => r === 'special')).toBe(true);
    });
  });

  describe('given 根据积分值推断难度，when 输入11-14分，then 返回undefined', () => {
    it('should return undefined for points outside defined ranges', () => {
      // Given: 不在任何范围内的积分值
      const testCases = [11, 12, 13, 14];

      // When: 推断难度
      const results = testCases.map(p => getDifficultyFromPoints(p));

      // Then: 都返回undefined
      expect(results.every(r => r === undefined)).toBe(true);
    });
  });

  describe('given 积分建议常量，when 访问示例任务，then 返回对应的示例列表', () => {
    it('should provide task examples for each difficulty', () => {
      // Given: 积分建议常量

      // When: 检查各难度级别的示例
      // Then: 每个级别都有示例任务
      expect(POINT_SUGGESTIONS.simple.examples.length).toBeGreaterThan(0);
      expect(POINT_SUGGESTIONS.medium.examples.length).toBeGreaterThan(0);
      expect(POINT_SUGGESTIONS.hard.examples.length).toBeGreaterThan(0);
      expect(POINT_SUGGESTIONS.special.examples.length).toBeGreaterThan(0);

      // 验证简单任务示例
      expect(POINT_SUGGESTIONS.simple.examples).toContain('整理床铺');
      expect(POINT_SUGGESTIONS.simple.examples).toContain('刷牙');

      // 验证中等任务示例
      expect(POINT_SUGGESTIONS.medium.examples).toContain('洗碗');
      expect(POINT_SUGGESTIONS.medium.examples).toContain('扫地');

      // 验证困难任务示例
      expect(POINT_SUGGESTIONS.hard.examples).toContain('完成作业');
      expect(POINT_SUGGESTIONS.hard.examples).toContain('打扫整个房间');

      // 验证特殊任务示例
      expect(POINT_SUGGESTIONS.special.examples).toContain('照顾宠物');
      expect(POINT_SUGGESTIONS.special.examples).toContain('学习新技能');
    });
  });

  describe('given 验证错误常量，when 访问错误消息，then 返回对应的中文消息', () => {
    it('should provide validation error messages', () => {
      // Given: 验证错误常量

      // When: 访问错误消息
      // Then: 返回中文错误消息
      expect(POINTS_VALIDATION_ERRORS.NOT_INTEGER).toBe('积分值必须为整数');
      expect(POINTS_VALIDATION_ERRORS.OUT_OF_RANGE).toBe('积分值必须在1-100之间');
      expect(POINTS_VALIDATION_ERRORS.MIN_ERROR).toBe('积分最少1分');
      expect(POINTS_VALIDATION_ERRORS.MAX_ERROR).toBe('积分最多100分');
    });
  });
});
