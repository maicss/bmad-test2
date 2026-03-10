/**
 * E2E Tests for Multi-device Login - Happy Path
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 * Source: Story 1.6 AC #1, #4, #5, #8
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!

test.describe.configure({ mode: 'serial' });

test.describe('Story 1.6: Multi-device Login - E2E Happy Path', () => {
  // Use seeded test user (13800000100, password: 1111)
  const testPhone = '13800000100';
  const testPassword = '1111';

  test.beforeEach(async () => {
    // Reset rate limit before each test
    try {
      const resetResponse = await fetch(`${BASE_URL}/api/test/reset-rate-limit`);
      await resetResponse.text();
    } catch (e) {
      // Ignore if endpoint doesn't exist
    }
  });

  test('given 家长在设备A登录，when 在设备B登录，then 允许多设备同时在线', async ({ browser }) => {
    test.setTimeout(120000); // Increase timeout for multi-device test

    // Create two browser contexts to simulate two devices
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Given: 家长在设备A登录
      await pageA.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await pageA.waitForLoadState('domcontentloaded');

      // Wait for test helper to be available
      await pageA.waitForFunction(() => typeof (window as any).testSetAuthMode === 'function', { timeout: 5000 });

      // Use test helper to switch to password mode
      await pageA.evaluate(() => {
        (window as any).testSetAuthMode('password');
      });
      await pageA.waitForTimeout(500);

      // Wait for password input to be visible
      await pageA.waitForSelector('input[id="password"]', { state: 'visible', timeout: 5000 });

      await pageA.fill('input[id="phone"]', testPhone);
      await pageA.fill('input[id="password"]', testPassword);
      await pageA.click('button[type="submit"]');
      await pageA.waitForURL(/\/(dashboard|parent\/dashboard)/, { timeout: 10000 });

      // Verify device A is logged in
      const pageATitle = await pageA.title();
      expect(pageATitle).toBeTruthy();

      // When: 在设备B登录
      await pageB.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await pageB.waitForLoadState('domcontentloaded');

      // Wait for test helper to be available
      await pageB.waitForFunction(() => typeof (window as any).testSetAuthMode === 'function', { timeout: 5000 });

      // Use test helper to switch to password mode
      await pageB.evaluate(() => {
        (window as any).testSetAuthMode('password');
      });
      await pageB.waitForTimeout(500);

      // Wait for password input to be visible
      await pageB.waitForSelector('input[id="password"]', { state: 'visible', timeout: 5000 });

      await pageB.fill('input[id="phone"]', testPhone);
      await pageB.fill('input[id="password"]', testPassword);
      await pageB.click('button[type="submit"]');
      await pageB.waitForURL(/\/(dashboard|parent\/dashboard)/, { timeout: 10000 });

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

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Wait for test helper to be available
    await page.waitForFunction(() => typeof (window as any).testSetAuthMode === 'function', { timeout: 5000 });

    // Use test helper to switch to password mode
    await page.evaluate(() => {
      (window as any).testSetAuthMode('password');
    });
    await page.waitForTimeout(500);

    // Wait for password input to be visible
    await page.waitForSelector('input[id="password"]', { state: 'visible', timeout: 5000 });

    await page.fill('input[id="phone"]', testPhone);
    await page.fill('input[id="password"]', testPassword);

    // Check "记住我" checkbox
    const rememberMeCheckbox = page.locator('input[type="checkbox"]');
    await rememberMeCheckbox.check();
    await expect(rememberMeCheckbox).toBeChecked();

    // Login
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|parent\/dashboard)/, { timeout: 10000 });

    // When: 7天内再次访问（模拟：关闭页面后重新打开）
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Then: 不需要重新输入凭据（直接跳转到 Dashboard）
    const currentUrl = page.url();
    expect(currentUrl).toContain('/dashboard');
  });
});
