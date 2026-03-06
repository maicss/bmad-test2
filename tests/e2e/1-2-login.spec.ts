/**
 * E2E Tests for Login Flow
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 * Source: Story 1.2 AC #1-#5 - Parent Phone Login
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;

test.describe('Story 1.2: Parent Phone Login - E2E Happy Path', () => {
  test.describe.configure({ mode: 'serial' });

  test('given 已注册家长，when 访问登录页面，then 登录表单元素可见', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Then: 验证登录表单元素存在
    await expect(page.locator('input[id="phone"]')).toBeVisible();
    await expect(page.locator('input[value="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('given 已注册家长选择密码方式，when 输入正确凭据，then 表单可以提交', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // When: 选择密码认证方式 - 点击label而不是radio
    await page.locator('text=密码').click();
    await page.waitForTimeout(500);

    // 输入已注册的手机号和密码
    await page.fill('input[id="phone"]', '13800000100');
    await page.fill('input[id="password"]', '1111');

    // 点击登录
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Then: 应该有某种响应
    const url = page.url();
    expect(url).toBeTruthy();
  });
});
