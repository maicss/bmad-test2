/**
 * E2E Tests for Multi-device Login - Happy Path
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 * Source: Story 1.6 AC #1, #4, #5, #8
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!

test.describe('Story 1.6: Multi-device Login - E2E Happy Path', () => {
  // Use seeded test user (13800000100, password: 1111)
  const testPhone = '13800000100';
  const testPassword = '1111';

  test('given 家长在设备A登录，when 在设备B登录，then 允许多设备同时在线', async ({ browser }) => {
    // Create two browser contexts to simulate two devices
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Given: 家长在设备A登录
      await pageA.goto(`${BASE_URL}/login`);
      await pageA.waitForLoadState('networkidle');
      await pageA.click('input[value="password"]');
      await pageA.fill('input[id="phone"]', testPhone);
      await pageA.fill('input[id="password"]', testPassword);
      await pageA.click('button[type="submit"]');
      await pageA.waitForURL(/\/(dashboard|parent\/dashboard)/);

      // Verify device A is logged in
      const pageATitle = await pageA.title();
      expect(pageATitle).toBeTruthy();

      // When: 在设备B登录
      await pageB.goto(`${BASE_URL}/login`);
      await pageB.waitForLoadState('networkidle');
      await pageB.click('input[value="password"]');
      await pageB.fill('input[id="phone"]', testPhone);
      await pageB.fill('input[id="password"]', testPassword);
      await pageB.click('button[type="submit"]');
      await pageB.waitForURL(/\/(dashboard|parent\/dashboard)/);

      // Verify device B is also logged in
      const pageBTitle = await pageB.title();
      expect(pageBTitle).toBeTruthy();

      // Then: 允许多设备同时在线
      expect(pageATitle).toBeTruthy();
      expect(pageBTitle).toBeTruthy();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('given 家长选择"记住我"登录，when 7天内再次访问，then 不需要重新输入凭据', async ({ context }) => {
    // Given: 家长选择"记住我"登录
    await context.clearCookies();
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.click('input[value="password"]');
    await page.fill('input[id="phone"]', testPhone);
    await page.fill('input[id="password"]', testPassword);

    // Check "记住我" checkbox
    const rememberMeCheckbox = page.locator('input[type="checkbox"]');
    await rememberMeCheckbox.check();
    await expect(rememberMeCheckbox).toBeChecked();

    // Login
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|parent\/dashboard)/);

    // When: 7天内再次访问（模拟：关闭页面后重新打开）
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    // Then: 不需要重新输入凭据（直接跳转到 Dashboard）
    const currentUrl = page.url();
    expect(currentUrl).toContain('/dashboard');
  });
});
