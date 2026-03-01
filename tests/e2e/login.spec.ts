/**
 * E2E Tests for Login Flow
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 * Source: Story 1.2 AC #1-#5 - Parent Phone Login
 * Source: AGENTS.md - Use Playwright for E2E tests
 */

import { test, expect } from '@playwright/test';

test.describe('Story 1.2: Parent Phone Login - E2E Happy Path', () => {
  test('given 已注册家长选择OTP方式，when 输入正确手机号和验证码，then 成功登录并重定向到Dashboard', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // When: 选择 OTP 认证方式
    await page.click('input[value="otp"]');

    // 输入已注册的手机号
    const testPhone = '13800004001';
    await page.fill('input[id="phone"]', testPhone);

    // 点击发送验证码
    await page.click('button:has-text("发送验证码")');

    // 等待验证码发送成功
    await page.waitForTimeout(1000);

    // 输入验证码
    await page.fill('input[id="otp"]', '111111');

    // 点击登录
    await page.click('button[type="submit"]');

    // Then: 成功登录并重定向到Dashboard
    await page.waitForURL('/dashboard');
    const title = await page.title();
    expect(title).toContain('Dashboard');
  });

  test('given 已注册家长选择密码方式，when 输入正确手机号和密码，then 成功登录并重定向到Dashboard', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // When: 选择密码认证方式
    await page.click('input[value="password"]');

    // 输入已注册的手机号
    const testPhone = '13800004001';
    await page.fill('input[id="phone"]', testPhone);

    // 输入密码
    await page.fill('input[id="password"]', 'Test1234');

    // 点击登录
    await page.click('button[type="submit"]');

    // Then: 成功登录并重定向到Dashboard
    await page.waitForURL('/dashboard');
    const title = await page.title();
    expect(title).toContain('Dashboard');
  });
});
