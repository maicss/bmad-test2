/**
 * E2E Tests for Story 2.1: Parent Creates Task Plan Template
 *
 * Playwright E2E tests for task plan creation flow
 *
 * Prerequisites:
 * - Dev server running on port 3344
 * - Test user exists (phone: 13800000100, password: 1111)
 * - UI components rendered and accessible
 *
 * Source: Story 2.1 AC #1-#3
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!

test.describe.configure({ mode: 'serial' });

test.describe('Story 2.1: Parent Creates Task Plan Template', () => {
  test.beforeEach(async () => {
    // Reset rate limit before each test
    try {
      const resetResponse = await fetch(`${BASE_URL}/api/test/reset-rate-limit`);
      await resetResponse.text();
    } catch (e) {
      // Ignore if endpoint doesn't exist
    }
  });

  test('Happy Path: Login, Navigate to Tasks, Navigate to Create Page, Verify Form Elements', async ({ page }) => {
    // Step 1: Login
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

    await page.fill('input[id="phone"]', '13800000100');
    await page.fill('input[id="password"]', '1111');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Step 2: Navigate to tasks page
    await page.goto(`${BASE_URL}/parent/tasks`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/parent/tasks');

    // Step 3: Navigate to create page
    await page.goto(`${BASE_URL}/parent/tasks/create`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/parent/tasks/create');

    // Step 4: Verify all form elements exist and are accessible
    // Title input
    const titleInput = page.getByPlaceholder(/例如：每日刷牙/);
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toBeEnabled();

    // Points input
    const pointsInput = page.getByRole('spinbutton', { name: /积分值/ });
    await expect(pointsInput).toBeVisible();
    await expect(pointsInput).toBeEnabled();

    // Task type selector
    const taskTypeSelect = page.getByRole('combobox', { name: /任务类型/ });
    await expect(taskTypeSelect).toBeVisible();

    // Frequency selector - use text selector
    const frequencySelect = page.getByText('规则类型');
    await expect(frequencySelect).toBeVisible();

    // Reminder time input
    const reminderTimeInput = page.getByRole('textbox', { name: /任务提醒时间/ });
    await expect(reminderTimeInput).toBeVisible();
    await expect(reminderTimeInput).toBeEnabled();

    // Excluded dates input
    const excludedDatesInput = page.getByPlaceholder(/YYYY-MM-DD/);
    await expect(excludedDatesInput).toBeVisible();
    await expect(excludedDatesInput).toBeEnabled();

    // Verify buttons exist
    await expect(page.getByRole('button', { name: '保存草稿' })).toBeVisible();
    await expect(page.getByRole('button', { name: '立即发布' })).toBeVisible();
    await expect(page.getByRole('button', { name: '取消' })).toBeVisible();
  });
});
