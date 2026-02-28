/**
 * BDD Integration Tests for Story 1.3: Child PIN Login API
 *
 * Simplified tests to avoid rate limiting conflicts
 *
 * Source: Story 1.3 AC #1-#8
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { createUser, getChildByPIN } from '@/lib/db/queries/users';
import { resetAllRateLimits } from '@/lib/auth/rate-limit';
import db from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`;

describe('Story 1.3: Child PIN Login - Integration', () => {
  let childName: string;
  let childPin: string;
  const familyId = 'test-family-id';

  beforeAll(async () => {
    // 重置所有速率限制
    resetAllRateLimits();

    // 创建测试用户
    childPin = `${Math.floor(Math.random() * 9000 + 1000)}`;
    childName = `child_${Date.now()}`;
    await createUser(childName, 'child', childPin, familyId);
  });

  beforeEach(async () => {
    // 每个测试前重置速率限制（避免相互干扰）
    resetAllRateLimits();
  });

  afterAll(async () => {
    // 清理测试数据
    await db.delete(users).where(eq(users.phone, childName));
  });

  it('given 已注册儿童输入正确PIN码，when 提交PIN登录表单，then 创建会话并返回用户数据', async () => {
    // When: 提交PIN登录表单
    const response = await fetch(`${BASE_URL}/api/auth/pin-login`, {
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
    expect(data.user.name).toBeDefined();
  });

  it('given 儿童输入错误PIN码，when 提交PIN登录表单，then 显示PIN码错误提示', async () => {
    // When: 提交错误PIN
    const response = await fetch(`${BASE_URL}/api/auth/pin-login`, {
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

  it('given 输入无效PIN格式，when 尝试登录，then 显示格式错误提示', async () => {
    // When: 输入无效PIN格式
    const response = await fetch(`${BASE_URL}/api/auth/pin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '123' }),
    });

    // Then: 显示格式错误提示
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toContain('4位数字');
  });
});
