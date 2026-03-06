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
  test('Happy Path: Login, Navigate to Tasks, Navigate to Create Page, Verify Form Elements', async ({ page }) => {
    // Step 1: Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[value="password"]').first().click();
    await page.fill('input[id="phone"]', '13800000100');
    await page.fill('input[id="password"]', '1111');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Step 2: Navigate to tasks page
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/tasks');

    // Step 3: Navigate to create page
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/tasks/create');

    // Step 4: Verify all form elements exist and are accessible
    // Title input
    const titleInput = page.getByLabel(/模板名称/);
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toBeEnabled();

    // Points input
    const pointsInput = page.getByLabel(/积分值/);
    await expect(pointsInput).toBeVisible();
    await expect(pointsInput).toBeEnabled();

    // Task type selector
    const taskTypeSelect = page.getByLabel(/任务类型/);
    await expect(taskTypeSelect).toBeVisible();

    // Frequency selector
    const frequencySelect = page.getByLabel(/循环规则/);
    await expect(frequencySelect).toBeVisible();

    // Reminder time input
    const reminderTimeInput = page.getByLabel(/任务提醒时间/);
    await expect(reminderTimeInput).toBeVisible();
    await expect(reminderTimeInput).toBeEnabled();

    // Excluded dates input
    const excludedDatesInput = page.getByPlaceholder(/2026-03-10/);
    await expect(excludedDatesInput).toBeVisible();
    await expect(excludedDatesInput).toBeEnabled();

    // Verify buttons exist
    await expect(page.getByRole('button', { name: '保存草稿' })).toBeVisible();
    await expect(page.getByRole('button', { name: '立即发布' })).toBeVisible();
    await expect(page.getByRole('button', { name: '取消' })).toBeVisible();
  });
});
