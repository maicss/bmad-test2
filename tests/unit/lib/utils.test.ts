/**
 * Unit tests for utility functions
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 * Source: AGENTS.md - Use Bun Test for unit tests
 */

import { describe, it, expect } from 'bun:test';
import { isValidChinesePhone, isStrongPassword, maskPhone } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('given 手机号验证，when 验证中国手机号格式，then 返回验证结果', () => {
    it('should accept valid 11-digit phone starting with 1', () => {
      // Given: 有效的中国手机号
      const validPhones = [
        '13800000001',
        '13812345678',
        '15912345678',
        '18612345678',
      ];

      // When: 验证手机号
      validPhones.forEach((phone) => {
        // Then: 应该返回 true
        expect(isValidChinesePhone(phone)).toBe(true);
      });
    });

    it('should reject phone with invalid prefix', () => {
      // Given: 无效前缀的手机号
      const invalidPhones = [
        '12812345678', // 128 不是有效前缀
        '15812345678', // 158 不是有效前缀
        '17012345678', // 170 不是有效前缀
      ];

      // When: 验证手机号
      invalidPhones.forEach((phone) => {
        // Then: 应该返回 false
        expect(isValidChinesePhone(phone)).toBe(false);
      });
    });

    it('should reject phone with wrong length', () => {
      // Given: 长度不正确的手机号
      const invalidPhones = [
        '1381234567',  // 太短
        '138123456789012', // 太长
      ];

      // When: 验证手机号
      invalidPhones.forEach((phone) => {
        // Then: 应该返回 false
        expect(isValidChinesePhone(phone)).toBe(false);
      });
    });
  });

  describe('given 密码强度验证，when 验证密码规则，then 返回验证结果', () => {
    it('should accept strong password (8+ chars, 1 uppercase, 1 number)', () => {
      // Given: 强密码
      const strongPasswords = [
        'Password1',
        'Test1234',
        'StrongPass1',
      ];

      // When: 验证密码强度
      strongPasswords.forEach((password) => {
        // Then: 应该返回 true
        expect(isStrongPassword(password)).toBe(true);
      });
    });

    it('should reject weak password (< 8 chars)', () => {
      // Given: 短密码
      const weakPassword = 'Short1';

      // When: 验证密码强度
      // Then: 应该返回 false
      expect(isStrongPassword(weakPassword)).toBe(false);
    });

    it('should reject password without uppercase', () => {
      // Given: 无大写字母的密码
      const weakPassword = 'password1';

      // When: 验证密码强度
      // Then: 应该返回 false
      expect(isStrongPassword(weakPassword)).toBe(false);
    });

    it('should reject password without number', () => {
      // Given: 无数字的密码
      const weakPassword = 'Password';

      // When: 验证密码强度
      // Then: 应该返回 false
      expect(isStrongPassword(weakPassword)).toBe(false);
    });

    it('should reject password too long (> 20 chars)', () => {
      // Given: 过长的密码
      const longPassword = 'ThisPasswordIsWayTooLongForTheSystem';

      // When: 验证密码强度
      // Then: 应该返回 false
      expect(isStrongPassword(longPassword)).toBe(false);
    });
  });

  describe('given 手机号脱敏，when 需要隐藏敏感信息，then 返回部分隐藏的手机号', () => {
    it('should mask all but last 4 digits', () => {
      // Given: 完整手机号
      const phone = '13800123456';

      // When: 脱敏手机号
      const masked = maskPhone(phone);

      // Then: 应该显示部分隐藏
      expect(masked).toBe('138****3456');
    });

    it('should return original if too short', () => {
      // Given: 太短的手机号
      const phone = '1381';

      // When: 脱敏手机号
      const masked = maskPhone(phone);

      // Then: 应该返回原始值
      expect(masked).toBe('1381');
    });
  });
});
