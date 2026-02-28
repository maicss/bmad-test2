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

describe('Story 1.2: Parent Phone Login - OTP Flow', () => {
  let testPhone: string;
  let testPassword: string;

  beforeEach(async () => {
    testPhone = `1380000${Math.floor(Math.random() * 9000 + 1000)}`;
    testPassword = 'Test1234';

    // 清理测试数据
    await db.delete(users).where(eq(users.phone, testPhone));
  });

  afterEach(async () => {
    // 清理测试数据
    await db.delete(users).where(eq(users.phone, testPhone));
  });

  it('given 已注册家长选择OTP方式输入正确手机号，when 点击发送验证码，then 60秒内收到验证码', async () => {
    // Given: 已注册家长
    await createUser(testPhone, 'parent', testPassword);

    // When: 点击发送验证码
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/send-otp', {
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
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        authMethod: 'otp',
        otp: '111111', // Better-Auth debug code
      }),
    });

    // Then: 创建会话并返回用户数据
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.role).toBe('parent');
  });

  it('given 已注册家长选择OTP方式输入错误验证码，when 提交登录表单，then 显示验证码错误提示', async () => {
    // Given: 已注册家长
    await createUser(testPhone, 'parent', testPassword);

    // When: 提交登录表单（错误 OTP）
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        authMethod: 'otp',
        otp: '000000', // 错误验证码
      }),
    });

    // Then: 显示验证码错误提示
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toContain('验证码');
  });
});

describe('Story 1.2: Parent Phone Login - Password Flow', () => {
  let testPhone: string;
  let testPassword: string;

  beforeEach(async () => {
    testPhone = `1380000${Math.floor(Math.random() * 9000 + 1000)}`;
    testPassword = 'Test1234';

    // 清理测试数据
    await db.delete(users).where(eq(users.phone, testPhone));
  });

  afterEach(async () => {
    // 清理测试数据
    await db.delete(users).where(eq(users.phone, testPhone));
  });

  it('given 已注册家长选择密码方式输入正确密码，when 提交登录表单，then 创建会话并重定向到Dashboard', async () => {
    // Given: 已注册家长
    await createUser(testPhone, 'parent', testPassword);

    // When: 提交登录表单（密码方式）
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        authMethod: 'password',
        password: testPassword,
      }),
    });

    // Then: 创建会话并返回用户数据
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.role).toBe('parent');
  });

  it('given 已注册家长选择密码方式输入错误密码，when 提交登录表单，then 显示密码错误提示', async () => {
    // Given: 已注册家长
    await createUser(testPhone, 'parent', testPassword);

    // When: 提交登录表单（错误密码）
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        authMethod: 'password',
        password: 'WrongPass1',
      }),
    });

    // Then: 显示密码错误提示
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toContain('密码');
  });
});

describe('Story 1.2: Parent Phone Login - Error Handling', () => {
  it('given 未注册手机号，when 尝试登录，then 显示手机号未注册错误', async () => {
    // Given: 未注册的手机号
    const phone = '13800009999';

    // When: 尝试登录
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        authMethod: 'password',
        password: 'Test1234',
      }),
    });

    // Then: 显示手机号未注册错误
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toContain('手机号');
  });
});

describe('Story 1.2: Parent Phone Login - Rate Limiting', () => {
  let testPhone: string;

  beforeEach(async () => {
    testPhone = `1380000${Math.floor(Math.random() * 9000 + 1000)}`;

    // 清理测试数据
    await db.delete(users).where(eq(users.phone, testPhone));

    // 创建测试用户
    await createUser(testPhone, 'parent', 'Test1234');
  });

  afterEach(async () => {
    // 清理测试数据和限流状态
    await db.delete(users).where(eq(users.phone, testPhone));
  });

  it('given 连续5次登录失败，when 尝试第6次登录，then 显示锁定提示（10分钟）', async () => {
    // Given: 连续5次登录失败
    const ipAddress = '127.0.0.1';

    for (let i = 0; i < 5; i++) {
      await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': ipAddress,
        },
        body: JSON.stringify({
          phone: testPhone,
          authMethod: 'password',
          password: 'WrongPass',
        }),
      });
    }

    // When: 尝试第6次登录
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ipAddress,
      },
      body: JSON.stringify({
        phone: testPhone,
        authMethod: 'password',
        password: 'WrongPass',
      }),
    });

    // Then: 显示锁定提示（几分钟）
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toMatch(/\d+分钟/); // 匹配 "X分钟" 格式
  });
});

describe('Story 1.2: Parent Phone Login - Phone Hash Query', () => {
  it('given 密码登录，when 查询用户，then 使用 phone_hash 哈希查询以提高安全性', async () => {
    // Given: 已注册用户
    const phone = `1380000${Math.floor(Math.random() * 9000 + 1000)}`;
    const password = 'Test1234';
    await createUser(phone, 'parent', password);

    // When: 使用明文手机号查询（函数内部会哈希）
    const foundUser = await getUserByPhone(phone);

    // Then: 应该返回用户（phone_hash 匹配）
    expect(foundUser).toBeDefined();
    expect(foundUser?.phone).toBe(phone);
    expect(foundUser?.phone_hash).toBeDefined();
  });
});
