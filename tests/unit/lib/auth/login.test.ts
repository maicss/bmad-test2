/**
 * BDD Tests for Story 1.2: Parent Phone Login
 *
 * Source: Story 1.2 AC #1-#7
 * Requirement: Given-When-Then format with business language
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createUser, getUserByPhone, getUserByPhonePlain } from '@/lib/db/queries/users';
import db from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimitLoginAttempts } from '@/lib/auth/rate-limit';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3344';

describe('Story 1.2: Parent Phone Login - OTP Flow', () => {
  let testPhone: string;
  let testPassword: string;

  beforeEach(async () => {
    testPhone = '1380000' + Math.floor(Math.random() * 9000 + 1000);
    testPassword = 'Test1234';

    // Clean up any existing user
    await db.delete(users).where(eq(users.phone, testPhone));
  });

  afterEach(async () => {
    // Clean up test user
    await db.delete(users).where(eq(users.phone, testPhone));
  });

  it('given 已注册家长选择OTP方式输入正确手机号，when 点击发送验证码，then 60秒内收到验证码', async () => {
    // Given: 已注册家长
    await createUser(testPhone, 'parent', testPassword);

    // When: 点击发送验证码
    const response = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone }),
    });

    // Then: 60秒内收到验证码
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.expiresAt).toBeDefined();
  });

  it('given 已注册家长选择OTP方式输入正确验证码，when 提交登录表单，then 创建会话并重定向到Dashboard', async () => {
    // Given: 已注册家长
    await createUser(testPhone, 'parent', testPassword);

    // When: 提交登录表单（OTP 方式）
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        authMethod: 'otp',
        otp: '111111', // Better-Auth debug code
      }),
    });

    // Then: 创建会话
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user?.phone).toBe(testPhone);
    expect(data.user?.role).toBe('parent');
  });

  it('given 已注册家长选择OTP方式输入错误验证码，when 提交登录表单，then 显示验证码错误提示', async () => {
    // Given: 已注册家长
    await createUser(testPhone, 'parent', testPassword);

    // When: 提交登录表单（错误 OTP）
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        authMethod: 'otp',
        otp: '999999',
      }),
    });

    // Then: 显示验证码错误提示
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toContain('验证码错误');
  });
});
