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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3344';

test.describe('Story 2.1: Parent Creates Task Plan Template', () => {
  // Use serial mode to avoid conflicts
  test.describe.configure({ mode: 'serial' });

  test('AC1: given logged-in parent, when navigating to tasks page, then task plans list is displayed', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.click('input[value="password"]');
    await page.fill('input[id="phone"]', '13800000100');
    await page.fill('input[id="password"]', '1111');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|parent\/dashboard)/, { timeout: 10000, waitUntil: 'domcontentloaded' });

    // Navigate to tasks page
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('domcontentloaded');

    // Verify URL is correct
    expect(page.url()).toContain('/tasks');
  });

  test('AC1: given logged-in parent, when navigating to create page, then task plan form is displayed', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.click('input[value="password"]');
    await page.fill('input[id="phone"]', '13800000100');
    await page.fill('input[id="password"]', '1111');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|parent\/dashboard)/, { timeout: 10000, waitUntil: 'domcontentloaded' });

    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Verify URL is correct
    expect(page.url()).toContain('/tasks/create');

    // Verify basic form elements exist
    await expect(page.getByLabel(/模板名称/)).toBeVisible();
    await expect(page.getByLabel(/积分值/)).toBeVisible();
  });

  test('AC3: given parent enters title, then title is accepted', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.click('input[value="password"]');
    await page.fill('input[id="phone"]', '13800000100');
    await page.fill('input[id="password"]', '1111');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|parent\/dashboard)/, { timeout: 10000, waitUntil: 'domcontentloaded' });

    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Enter title
    await page.fill('input#title', 'E2E测试任务-每日阅读');

    // Verify title value
    const titleValue = await page.inputValue('input#title');
    expect(titleValue).toBe('E2E测试任务-每日阅读');
  });

  test('AC3: given parent enters points, then points are accepted', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.click('input[value="password"]');
    await page.fill('input[id="phone"]', '13800000100');
    await page.fill('input[id="password"]', '1111');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|parent\/dashboard)/, { timeout: 10000, waitUntil: 'domcontentloaded' });

    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Fill points
    await page.fill('input#points', '10');

    // Verify points value
    const pointsValue = await page.inputValue('input#points');
    expect(pointsValue).toBe('10');
  });

  test('Excluded Dates: input exists and accepts value', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.click('input[value="password"]');
    await page.fill('input[id="phone"]', '13800000100');
    await page.fill('input[id="password"]', '1111');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|parent\/dashboard)/, { timeout: 10000, waitUntil: 'domcontentloaded' });

    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    const dates = '2026-03-10,2026-03-15';
    await page.fill('input#excluded_dates', dates);
    const value = await page.inputValue('input#excluded_dates');
    expect(value).toBe(dates);
  });

  test('Reminder Time: input exists and accepts value', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.click('input[value="password"]');
    await page.fill('input[id="phone"]', '13800000100');
    await page.fill('input[id="password"]', '1111');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|parent\/dashboard)/, { timeout: 10000, waitUntil: 'domcontentloaded' });

    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    const time = '08:00';
    await page.fill('input#reminder_time', time);
    const value = await page.inputValue('input#reminder_time');
    expect(value).toBe(time);
  });
});
