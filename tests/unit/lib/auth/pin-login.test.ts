/**
 * BDD Tests for Story 1.3: Child PIN Login
 *
 * Source: Story 1.3 AC #1-#8
 * Requirement: Given-When-Then format with business language
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createUser, getChildByPIN } from '@/lib/db/queries/users';
import { rateLimitLoginAttempts, resetAllRateLimits } from '@/lib/auth/rate-limit';
import db from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Story 1.3: Child PIN Login - API Flow', () => {
  let childPin: string;
  let childName: string;
  const familyId = 'test-family-id';

  beforeEach(async () => {
    // 生成唯一的PIN和用户名
    childPin = `${Math.floor(Math.random() * 9000 + 1000)}`;
    childName = `child_${Date.now()}_${Math.random()}`;

    // 清理这个用户（如果存在）
    await db.delete(users).where(eq(users.phone, childName));

    // 创建新的测试用户
    await createUser(childName, 'child', childPin, familyId);
  });

  afterEach(async () => {
    // 清理测试数据
    await db.delete(users).where(eq(users.phone, childName));
    // 清理速率限制状态（避免测试之间干扰）
    resetAllRateLimits();
  });

  it('given 已注册儿童输入正确PIN码，when 提交PIN登录表单，then 创建会话并重定向到儿童Dashboard', async () => {
    // Given: 已注册儿童（在beforeEach中创建）
    // When: 提交PIN登录表单
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/pin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: childPin }),
    });

    // Then: 创建会话并返回用户数据
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.role).toBe('child');
    expect(data.user.family_id).toBeDefined();
  });

  it('given 儿童输入错误PIN码，when 提交PIN登录表单，then 显示PIN码错误提示', async () => {
    // Given: 已注册儿童
    // User created in beforeEach

    // When: 提交错误PIN
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/pin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '9999' }),
    });

    // Then: 显示PIN码错误提示
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toContain('PIN码错误');
  });

  it('given 使用家长账号的PIN码登录，when 尝试登录，then 显示错误提示（非儿童角色）', async () => {
    // Given: 创建家长账号
    const parentName = `parent_${Date.now()}_${Math.random()}`;
    const parentPin = `${Math.floor(Math.random() * 9000 + 1000)}`;
    await createUser(parentName, 'parent', parentPin, 'test-family-id');

    // When: 使用家长账号的PIN尝试登录
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/pin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '127.0.0.10', // Unique IP for this test
      },
      body: JSON.stringify({ pin: parentPin }),
    });

    // Then: 显示错误提示（找不到用户或不是儿童角色）
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    // API可能返回"PIN码错误"或"仅用于儿童账号"都行
    expect(['PIN码错误', '仅用于儿童账号']).toContainEqual(data.error);

    // Cleanup
    await db.delete(users).where(eq(users.phone, parentName));
  });

  it('given 无family_id的儿童账号，when 尝试登录，then 显示错误提示（无效家庭）', async () => {
    // Given: 创建无家庭的儿童账号（不使用beforeEach的用户）
    const noFamilyName = `child_nofamily_${Date.now()}_${Math.random()}`;
    const noFamilyPin = `${Math.floor(Math.random() * 9000 + 1000)}`;
    await createUser(noFamilyName, 'child', noFamilyPin); // No family_id

    // When: 尝试登录
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/pin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '127.0.0.11', // Unique IP for this test
      },
      body: JSON.stringify({ pin: noFamilyPin }),
    });

    // Then: 显示无效家庭错误
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toContain('未加入家庭');

    // Cleanup
    await db.delete(users).where(eq(users.phone, noFamilyName));
  });

  it('given 输入无效PIN格式，when 尝试登录，then 显示格式错误提示', async () => {
    // Given: 输入无效PIN格式（不是4位）
    const invalidPin = '123';

    // When: 尝试登录
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/pin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: invalidPin }),
    });

    // Then: 显示格式错误提示
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toContain('4位数字');
  });

  it('given 连续5次PIN登录失败，when 尝试第6次登录，then 显示锁定提示（10分钟）', async () => {
    // Given: 已注册儿童
    // User created in beforeEach
    const ipAddress = '127.0.0.2';

    // 连续5次失败
    for (let i = 0; i < 5; i++) {
      await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/pin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': ipAddress,
        },
        body: JSON.stringify({ pin: '0000' }),
      });
    }

    // When: 尝试第6次登录
    const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/api/auth/pin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ipAddress,
      },
      body: JSON.stringify({ pin: childPin }),
    });

    // Then: 显示锁定提示
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toMatch(/\d+分钟/);
  });
});

describe('Story 1.3: Child PIN Login - PIN Hash Query', () => {
  it('given PIN登录，when 查询儿童用户，then 使用 password_hash 验证PIN', async () => {
    // Given: 已注册儿童
    const childName = `child_${Date.now()}`;
    const childPin = '1111';
    // User created in beforeEach

    // When: 使用PIN查询儿童
    const foundUser = await getChildByPIN(childPin);

    // Then: 应该返回儿童用户
    expect(foundUser).toBeDefined();
    expect(foundUser?.role).toBe('child');
    expect(foundUser?.password_hash).toBeDefined();
  });

  it('given PIN登录，when 使用错误PIN查询，then 应该返回null', async () => {
    // Given: 已注册儿童
    const childName = `child_${Date.now()}`;
    const childPin = '1111';
    // User created in beforeEach

    // When: 使用错误PIN查询
    const foundUser = await getChildByPIN('9999');

    // Then: 应该返回null
    expect(foundUser).toBeNull();
  });
});
