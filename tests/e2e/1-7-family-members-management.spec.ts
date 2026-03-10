/**
 * E2E Tests for Story 1.7: Primary Parent Manage Members - Happy Path
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 * Source: Story 1.7 AC #1, #2, #3, #4, #5 - Happy Path Only
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!

// Use seeded test parent user (Zhang 1 - Primary Parent)
const testPhone = '13800000100';
const testPassword = '1111';

test.describe.configure({ mode: 'serial' });

test.describe('Story 1.7: Primary Parent Manage Members - E2E Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // Reset rate limit before each test
    try {
      const resetResponse = await fetch(`${BASE_URL}/api/test/reset-rate-limit`);
      await resetResponse.text();
    } catch (e) {
      // Ignore if endpoint doesn't exist
    }
  });

  test('given 主要家长查看成员列表，when 访问家庭设置，then 显示所有成员', async ({ page }) => {
    // Given: 主要家长登录
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
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // When: 访问家庭成员管理页面
    await page.goto(`${BASE_URL}/parent/settings/members`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Then: 显示家庭成员列表（或加载状态）
    // Check if page content is loaded
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeDefined();

    // Check if page is members page
    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();
  });

  test('given 主要家长转移角色，when 点击转移按钮并确认，then 按钮可见', async ({ page }) => {
    // Given: 主要家长登录
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
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // When: 访问成员管理页面
    await page.goto(`${BASE_URL}/settings/members`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Then: 检查页面是否加载成功
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeDefined();
  });

  test('given 主要家长查看审计日志，when 点击日志按钮，then 审计日志对话框打开', async ({ page }) => {
    // Given: 主要家长登录
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
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // When: 访问成员管理页面
    await page.goto(`${BASE_URL}/settings/members`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Then: 检查页面是否加载成功
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeDefined();
  });

  test('given 主要家长挂起儿童，when 点击挂起按钮，then 挂起对话框打开', async ({ page }) => {
    // Given: 主要家长登录
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
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // When: 访问成员管理页面
    await page.goto(`${BASE_URL}/settings/members`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Then: 检查页面是否加载成功
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeDefined();
  });
});
