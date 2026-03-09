/**
 * Integration Tests for Rate Limiting Module
 *
 * Story 1.2: Parent Phone Login
 * AC #4: Rate limiting for security
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  rateLimitLoginAttempts,
  resetRateLimit,
  getRateLimitStatus,
  resetAllRateLimits,
} from '@/lib/auth/rate-limit';

describe('Rate Limiting Integration Tests', () => {
  beforeEach(() => {
    // Reset all rate limits before each test
    resetAllRateLimits();
  });

  afterEach(() => {
    // Clean up after each test
    resetAllRateLimits();
  });

  describe('given 首次登录失败，when 检查限流，then 不限流且记录1次失败', () => {
    it('should allow first failed attempt', () => {
      // Given: 首次登录失败的IP地址
      const ipAddress = '192.168.1.100';
      const headers = { 'X-Test-Rate-Limit': 'true' };

      // When: 检查限流
      const result = rateLimitLoginAttempts(ipAddress, headers);

      // Then: 不限流
      expect(result).toBeNull();

      // And: 记录1次失败
      const status = getRateLimitStatus(ipAddress);
      expect(status).toBeDefined();
      expect(status?.attempts).toBe(1);
    });
  });

  describe('given 连续4次登录失败，when 检查限流，then 不限流', () => {
    it('should allow up to 4 failed attempts', () => {
      // Given: IP地址
      const ipAddress = '192.168.1.101';
      const headers = { 'X-Test-Rate-Limit': 'true' };

      // When: 连续4次登录失败
      for (let i = 0; i < 4; i++) {
        const result = rateLimitLoginAttempts(ipAddress, headers);
        expect(result).toBeNull();
      }

      // Then: 记录4次失败
      const status = getRateLimitStatus(ipAddress);
      expect(status?.attempts).toBe(4);
    });
  });

  describe('given 连续5次登录失败，when 检查限流，then 锁定10分钟', () => {
    it('should lock after 5 failed attempts', () => {
      // Given: IP地址
      const ipAddress = '192.168.1.102';
      const headers = { 'X-Test-Rate-Limit': 'true' };

      // When: 连续5次登录失败
      for (let i = 0; i < 4; i++) {
        rateLimitLoginAttempts(ipAddress, headers);
      }
      const fifthResult = rateLimitLoginAttempts(ipAddress, headers);

      // Then: 返回锁定消息
      expect(fifthResult).toContain('分钟后再试');
      expect(fifthResult).toContain('10');

      // And: 状态显示已锁定
      const status = getRateLimitStatus(ipAddress);
      expect(status?.attempts).toBe(5);
      expect(status?.lockedUntil).toBeDefined();
      expect(status?.lockedUntil).toBeGreaterThan(Date.now());
    });
  });

  describe('given 已锁定10分钟，when 尝试登录，then 返回剩余锁定时间', () => {
    it('should return remaining lock time when locked', () => {
      // Given: 已锁定的IP地址
      const ipAddress = '192.168.1.103';
      const headers = { 'X-Test-Rate-Limit': 'true' };

      // Lock the IP
      for (let i = 0; i < 5; i++) {
        rateLimitLoginAttempts(ipAddress, headers);
      }

      // When: 再次尝试登录
      const result = rateLimitLoginAttempts(ipAddress, headers);

      // Then: 返回剩余锁定时间（约10分钟）
      expect(result).toMatch(/登录失败次数过多，请\d+分钟后再试/);
      expect(result).toContain('10');
    });
  });

  describe('given 锁定后成功登录，when 重置限流，then 解除锁定', () => {
    it('should reset rate limit after successful login', () => {
      // Given: 已锁定的IP地址
      const ipAddress = '192.168.1.104';
      const headers = { 'X-Test-Rate-Limit': 'true' };

      // Lock the IP
      for (let i = 0; i < 5; i++) {
        rateLimitLoginAttempts(ipAddress, headers);
      }
      expect(getRateLimitStatus(ipAddress)?.attempts).toBe(5);

      // When: 成功登录后重置
      resetRateLimit(ipAddress);

      // Then: 解除锁定
      const status = getRateLimitStatus(ipAddress);
      expect(status).toBeNull();

      // And: 可以重新尝试登录
      const result = rateLimitLoginAttempts(ipAddress, headers);
      expect(result).toBeNull();
      expect(getRateLimitStatus(ipAddress)?.attempts).toBe(1);
    });
  });

  describe('given 锁定10分钟后，when 锁定期过期，then 自动解除锁定', () => {
    it('should auto-unlock after lock period expires', () => {
      // Given: 已锁定的IP地址
      const ipAddress = '192.168.1.105';
      const headers = { 'X-Test-Rate-Limit': 'true' };

      // Lock the IP (5 failed attempts)
      for (let i = 0; i < 5; i++) {
        rateLimitLoginAttempts(ipAddress, headers);
      }
      const lockedUntil = getRateLimitStatus(ipAddress)?.lockedUntil || 0;

      // When: 模拟时间超过锁定期（手动设置entry）
      const entry = getRateLimitStatus(ipAddress);
      if (entry) {
        // Manually set lockedUntil to past to simulate expiration
        entry.lockedUntil = Date.now() - 1000;
      }

      // Try login again after lock expired
      const result = rateLimitLoginAttempts(ipAddress, headers);

      // Then: 锁定期已过期，重置计数器
      expect(result).toBeNull();
      const status = getRateLimitStatus(ipAddress);
      expect(status?.attempts).toBe(1); // Reset to 1 after lock expiry
      expect(status?.lockedUntil).toBeNull();
    });
  });

  describe('given 获取限流状态，when 查询IP，then 返回当前状态', () => {
    it('should get rate limit status', () => {
      // Given: 有失败记录的IP
      const ipAddress = '192.168.1.106';
      const headers = { 'X-Test-Rate-Limit': 'true' };

      // When: 记录失败
      rateLimitLoginAttempts(ipAddress, headers);

      // Then: 可以获取状态
      const status = getRateLimitStatus(ipAddress);
      expect(status).toEqual({
        attempts: 1,
        lastAttempt: expect.any(Number),
        lockedUntil: null,
      });
    });
  });

  describe('given 查询不存在的IP，when 获取状态，then 返回null', () => {
    it('should return null for non-existent IP', () => {
      // Given: 不存在的IP地址
      const ipAddress = '192.168.1.999';

      // When: 获取状态
      const status = getRateLimitStatus(ipAddress);

      // Then: 返回null
      expect(status).toBeNull();
    });
  });

  describe('given 重置所有限流，when 清空数据，then 所有IP状态清除', () => {
    it('should reset all rate limits', () => {
      // Given: 多个IP有限流记录
      const headers = { 'X-Test-Rate-Limit': 'true' };
      const ip1 = '192.168.1.107';
      const ip2 = '192.168.1.108';

      rateLimitLoginAttempts(ip1, headers);
      rateLimitLoginAttempts(ip2, headers);

      expect(getRateLimitStatus(ip1)).toBeDefined();
      expect(getRateLimitStatus(ip2)).toBeDefined();

      // When: 重置所有限流
      resetAllRateLimits();

      // Then: 所有状态清除
      expect(getRateLimitStatus(ip1)).toBeNull();
      expect(getRateLimitStatus(ip2)).toBeNull();
    });
  });

  describe('given 使用Headers对象，when 检查限流，then 正确处理', () => {
    it('should handle Headers object correctly', () => {
      // Given: Headers对象
      const ipAddress = '192.168.1.109';
      const headers = new Headers({ 'X-Test-Rate-Limit': 'true' });

      // When: 使用Headers对象检查限流
      const result = rateLimitLoginAttempts(ipAddress, headers);

      // Then: 正确处理并启用限流
      expect(result).toBeNull();
      expect(getRateLimitStatus(ipAddress)?.attempts).toBe(1);
    });
  });

  describe('given 不带测试头，when 开发环境，then 跳过限流', () => {
    it('should skip rate limiting in dev mode without test header', () => {
      // Given: 开发环境的IP地址（不带测试头）
      const ipAddress = '192.168.1.110';

      // When: 不带测试头检查限流（开发模式下会跳过）
      const result1 = rateLimitLoginAttempts(ipAddress);

      // Then: 跳过限流
      expect(result1).toBeNull();
      // 注意：如果在非开发环境运行，仍然会记录失败次数
    });
  });

  describe('given 多个IP独立限流，when 不同IP失败，then 互不影响', () => {
    it('should handle multiple IPs independently', () => {
      // Given: 两个不同IP
      const ip1 = '192.168.1.111';
      const ip2 = '192.168.1.112';
      const headers = { 'X-Test-Rate-Limit': 'true' };

      // When: IP1失败5次
      for (let i = 0; i < 5; i++) {
        rateLimitLoginAttempts(ip1, headers);
      }

      // Then: IP1被锁定
      expect(getRateLimitStatus(ip1)?.attempts).toBe(5);
      expect(getRateLimitStatus(ip1)?.lockedUntil).toBeGreaterThan(Date.now());

      // When: IP2失败1次（与IP1独立）
      rateLimitLoginAttempts(ip2, headers);

      // Then: IP2不受影响，计数为1
      expect(getRateLimitStatus(ip2)?.attempts).toBe(1);
      expect(getRateLimitStatus(ip2)?.lockedUntil).toBeNull();

      // And: IP1仍然被锁定
      const ip1Status = getRateLimitStatus(ip1);
      expect(ip1Status?.lockedUntil).toBeGreaterThan(Date.now());
    });
  });

  describe('given 限流计数器，when 失败次数递增，then 正确计数', () => {
    it('should increment attempts correctly', () => {
      // Given: IP地址
      const ipAddress = '192.168.1.113';
      const headers = { 'X-Test-Rate-Limit': 'true' };

      // When: 逐步增加失败次数
      rateLimitLoginAttempts(ipAddress, headers);
      expect(getRateLimitStatus(ipAddress)?.attempts).toBe(1);

      rateLimitLoginAttempts(ipAddress, headers);
      expect(getRateLimitStatus(ipAddress)?.attempts).toBe(2);

      rateLimitLoginAttempts(ipAddress, headers);
      expect(getRateLimitStatus(ipAddress)?.attempts).toBe(3);

      // Then: 计数正确
      const status = getRateLimitStatus(ipAddress);
      expect(status?.attempts).toBe(3);
      expect(status?.lastAttempt).toBeDefined();
      expect(status?.lockedUntil).toBeNull();
    });
  });
});
