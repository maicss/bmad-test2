/**
 * Integration tests for registration API
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 * Source: AGENTS.md - Use Bun Test for integration tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import db from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Registration API Integration Tests', () => {
  const baseUrl = 'http://localhost:3344';

  afterAll(async () => {
    // Clean up test users
    await db.delete(users);
  });

  describe('given 家长输入手机号，when 点击发送验证码，then 60秒内收到验证码', () => {
    it('should send OTP code successfully', async () => {
      // Given: 有效手机号
      const phone = '13800000555';

      // When: 发送验证码
      const response = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      // Then: 应该成功发送
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('验证码已发送');
      expect(data.expiresAt).toBeGreaterThan(Date.now());
      expect(data.expiresAt).toBeLessThan(Date.now() + 65 * 1000); // Within 65 seconds
    });

    it('should reject invalid phone number', async () => {
      // Given: 无效手机号
      const phone = '123';

      // When: 尝试发送验证码
      const response = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      // Then: 应该返回错误
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('有效的中国手机号');
    });
  });

  describe('given 家长选择 OTP 方式，when 输入正确验证码，then 创建用户账户和家庭记录', () => {
    it('should register successfully with OTP', async () => {
      // Given: 有效手机号和 OTP 码
      const phone = `13800000${Math.floor(Math.random() * 9000 + 1000)}`;
      const otp = '111111'; // Use debug code

      // When: 提交注册
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'otp',
          phone,
          otp,
        }),
      });

      // Then: 应该创建用户
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('注册成功');
      expect(data.user).toBeDefined();
      expect(data.user?.phone).toBe(phone);
      expect(data.user?.role).toBe('parent');
    });

    it('should create family for new parent', async () => {
      // Given: OTP 注册成功
      const phone = `13800000${Math.floor(Math.random() * 9000 + 1000)}`;
      const otp = '111111';

      // When: 注册并创建家庭
      const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'otp', phone, otp }),
      });

      expect(registerResponse.status).toBe(200);

      const data = await registerResponse.json();

      // Then: 用户应该有 family_id
      const user = await db.select().from(users).where(eq(users.phone, phone)).get();
      expect(user?.family_id).toBeDefined();
    });

    it('should reject invalid OTP code', async () => {
      // Given: 错误的 OTP
      const phone = `13800000${Math.floor(Math.random() * 9000 + 1000)}`;
      const otp = '999999';

      // When: 提交注册
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'otp', phone, otp }),
      });

      // Then: 应该返回错误
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('验证码错误');
    });
  });

  describe('given 家长选择密码方式，when 输入强密码，then 创建用户账户和家庭记录', () => {
    it('should register successfully with password', async () => {
      // Given: 有效手机号和强密码
      const phone = `13800000${Math.floor(Math.random() * 9000 + 1000)}`;
      const password = 'TestPass1';

      // When: 提交注册
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'password',
          phone,
          password,
          confirmPassword: password,
        }),
      });

      // Then: 应该创建用户
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('注册成功');
      expect(data.user).toBeDefined();
      expect(data.user?.phone).toBe(phone);
      expect(data.user?.role).toBe('parent');
    });

    it('should reject weak password', async () => {
      // Given: 弱密码
      const phone = `13800000${Math.floor(Math.random() * 9000 + 1000)}`;
      const password = 'weak'; // No uppercase or number

      // When: 提交注册
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'password',
          phone,
          password,
          confirmPassword: password,
        }),
      });

      // Then: 应该返回错误
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('密码必须包含');
    });

    it('should reject mismatched password confirmation', async () => {
      // Given: 密码不匹配
      const phone = `13800000${Math.floor(Math.random() * 9000 + 1000)}`;

      // When: 提交注册
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'password',
          phone,
          password: 'Password1',
          confirmPassword: 'Password2',
        }),
      });

      // Then: 应该返回错误
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('密码不一致');
    });
  });

  describe('given 手机号已存在时，when 尝试注册，then 显示友好错误提示', () => {
    it('should reject duplicate phone number', async () => {
      // Given: 已注册的手机号
      const phone = '13800000999';

      // 先注册一次
      await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'otp',
          phone,
          otp: '111111',
        }),
      });

      // When: 再次尝试注册相同手机号
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'otp',
          phone,
          otp: '222222',
        }),
      });

      // Then: 应该返回手机号已存在错误
      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('该手机号已注册');
    });
  });

  describe('given API 响应时间，when 执行注册操作，then 响应时间 < 500ms (NFR3)', () => {
    it('should respond within 500ms for OTP registration', async () => {
      // Given: 注册操作
      const phone = `13800000${Math.floor(Math.random() * 9000 + 1000)}`;

      // When: 测量响应时间
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'otp', phone, otp: '111111' }),
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Then: 响应时间应该 < 500ms
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500);
    });

    it('should respond within 500ms for password registration', async () => {
      // Given: 注册操作
      const phone = `13800000${Math.floor(Math.random() * 9000 + 1000)}`;

      // When: 测量响应时间
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'password', phone, password: 'Test1234', confirmPassword: 'Test1234' }),
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Then: 响应时间应该 < 500ms
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500);
    });
  });
});
