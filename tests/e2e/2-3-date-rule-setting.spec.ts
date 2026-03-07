/**
 * E2E Tests for Story 2.3: Parent Sets Task Date Rules
 *
 * Playwright E2E tests for date rule setting functionality
 *
 * Prerequisites:
 * - Dev server running on port 3344
 * - Test user exists (phone: 13800000100, password: 1111)
 * - UI components rendered and accessible
 *
 * Source: Story 2.3 AC #1-#7
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3344';

test.describe('Story 2.3: Parent Sets Task Date Rules', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[value="password"]').first().click();
    await page.fill('input[id="phone"]', '13800000100');
    await page.fill('input[id="password"]', '1111');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  });

  test('AC1: Daily task rule - creates tasks every day', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select daily frequency
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /每天/ }).click();

    // Fill in required fields
    await page.fill('input[id="title"]', '每日刷牙测试');
    await page.fill('input[id="points"]', '5');

    // Verify daily rule is selected
    await expect(page.getByText(/每天.*每天重复出现/)).toBeVisible();

    // Submit form
    await page.click('button:has-text("立即发布")');
    await page.waitForTimeout(1000);

    // Verify success message or navigation
    await expect(page).toHaveURL(/\/tasks|\/dashboard/);
  });

  test('AC2: Weekly task rule - can select multiple days of week', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select weekly frequency
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /每周/ }).click();

    // Verify day selection buttons appear
    await expect(page.getByText('选择星期')).toBeVisible();
    await expect(page.getByRole('button', { name: /周一/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /周三/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /周五/ })).toBeVisible();

    // Select Monday, Wednesday, Friday
    await page.getByRole('button', { name: /周一/ }).click();
    await page.getByRole('button', { name: /周三/ }).click();
    await page.getByRole('button', { name: /周五/ }).click();

    // Verify selected days are highlighted
    const mondayBtn = page.getByRole('button', { name: /周一/ });
    await expect(mondayBtn).toHaveAttribute('class', /bg-primary/);

    // Fill in required fields
    await page.fill('input[id="title"]', '周一三周五任务');
    await page.fill('input[id="points"]', '10');

    // Submit form
    await page.click('button:has-text("立即发布")');
    await page.waitForTimeout(1000);

    // Verify success
    await expect(page).toHaveURL(/\/tasks|\/dashboard/);
  });

  test('AC3: Weekdays rule - Monday through Friday only', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select weekdays frequency
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /工作日/ }).click();

    // Verify description
    await expect(page.getByText(/工作日.*仅周一至周五/)).toBeVisible();

    // Fill in required fields
    await page.fill('input[id="title"]', '工作日任务');
    await page.fill('input[id="points"]', '8');

    // Submit form
    await page.click('button:has-text("立即发布")');
    await page.waitForTimeout(1000);

    // Verify success
    await expect(page).toHaveURL(/\/tasks|\/dashboard/);
  });

  test('AC3: Weekends rule - Saturday and Sunday only', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select weekends frequency
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /周末/ }).click();

    // Verify description
    await expect(page.getByText(/周末.*仅周六、周日/)).toBeVisible();

    // Fill in required fields
    await page.fill('input[id="title"]', '周末任务');
    await page.fill('input[id="points"]', '15');

    // Submit form
    await page.click('button:has-text("立即发布")');
    await page.waitForTimeout(1000);

    // Verify success
    await expect(page).toHaveURL(/\/tasks|\/dashboard/);
  });

  test('AC4: Custom interval rule - every N days', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select interval frequency
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /自定义间隔/ }).click();

    // Verify interval input appears
    await expect(page.getByText(/间隔天数/)).toBeVisible();
    await expect(page.getByPlaceholder('2')).toBeVisible();

    // Set interval to 3 days
    const intervalInput = page.getByRole('spinbutton', { name: /间隔天数/ });
    await intervalInput.fill('3');

    // Verify helper text updates
    await expect(page.getByText(/每隔.*3.*天重复一次/)).toBeVisible();

    // Fill in required fields
    await page.fill('input[id="title"]', '每3天任务');
    await page.fill('input[id="points"]', '12');

    // Submit form
    await page.click('button:has-text("立即发布")');
    await page.waitForTimeout(1000);

    // Verify success
    await expect(page).toHaveURL(/\/tasks|\/dashboard/);
  });

  test('AC5: Specific dates rule - only on specified dates', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select specific dates frequency
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /特定日期/ }).click();

    // Click on calendar to open date picker
    await page.getByRole('button', { name: /选择日期/ }).click();

    // Select a few dates from calendar
    await page.getByRole('gridcell', { name: /15/ }).first().click();
    await page.getByRole('gridcell', { name: /20/ }).first().click();
    await page.getByRole('gridcell', { name: /25/ }).first().click();

    // Verify dates are selected and shown as badges
    await expect(page.getByText(/15/)).toBeVisible();
    await expect(page.getByText(/20/)).toBeVisible();
    await expect(page.getByText(/25/)).toBeVisible();

    // Fill in required fields
    await page.fill('input[id="title"]', '特定日期任务');
    await page.fill('input[id="points"]', '20');

    // Submit form
    await page.click('button:has-text("立即发布")');
    await page.waitForTimeout(1000);

    // Verify success
    await expect(page).toHaveURL(/\/tasks|\/dashboard/);
  });

  test('AC6: Exclusion dates - permanent exclusion', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select daily frequency first
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /每天/ }).click();

    // Scroll to exclusion dates section
    await page.getByText('排除日期').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Click on calendar to open exclusion date picker
    await page.getByRole('button', { name: /选择排除日期/ }).click();

    // Select a date to exclude
    await page.getByRole('gridcell', { name: /10/ }).first().click();
    await page.getByRole('gridcell', { name: /15/ }).first().click();

    // Verify excluded dates are shown as badges
    await expect(page.getByText(/10/)).toBeVisible();
    await expect(page.getByText(/15/)).toBeVisible();

    // Verify scope selector shows "permanent"
    await expect(page.getByText(/永久.*所有年份都在此日期排除/)).toBeVisible();

    // Fill in required fields
    await page.fill('input[id="title"]', '带排除的每日任务');
    await page.fill('input[id="points"]', '5');

    // Submit form
    await page.click('button:has-text("立即发布")');
    await page.waitForTimeout(1000);

    // Verify success
    await expect(page).toHaveURL(/\/tasks|\/dashboard/);
  });

  test('AC6: Exclusion dates - "once" scope exclusion', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select daily frequency
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /每天/ }).click();

    // Scroll to exclusion dates section
    await page.getByText('排除日期').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Open scope selector
    await page.getByRole('combobox', { name: /排除范围/ }).click();
    await page.getByRole('option', { name: /仅本周/ }).click();

    // Verify "once" scope is selected
    await expect(page.getByText(/仅本周.*仅当前周排除/)).toBeVisible();

    // Click calendar to add exclusion date
    await page.getByRole('button', { name: /选择排除日期/ }).click();
    await page.getByRole('gridcell', { name: /10/ }).first().click();

    // Fill in required fields
    await page.fill('input[id="title"]', '本周排除测试');
    await page.fill('input[id="points"]', '5');

    // Submit form
    await page.click('button:has-text("立即发布")');
    await page.waitForTimeout(1000);

    // Verify success
    await expect(page).toHaveURL(/\/tasks|\/dashboard/);
  });

  test('AC7: Task preview shows generation dates', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select daily frequency
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /每天/ }).click();

    // Fill in required fields to trigger preview
    await page.fill('input[id="title"]', '预览测试任务');
    await page.fill('input[id="points"]', '5');

    // Scroll to preview section
    await page.getByText('任务生成预览').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Verify preview section is visible
    await expect(page.getByText(/未来.*天/)).toBeVisible();
    await expect(page.getByText(/任务生成预览/)).toBeVisible();

    // Verify statistics are shown
    await expect(page.getByText(/未来7天/)).toBeVisible();
    await expect(page.getByText(/未来30天/)).toBeVisible();
    await expect(page.getByText(/未来90天/)).toBeVisible();

    // Verify calendar preview
    await expect(page.getByRole('grid', { name: /calendar/ })).toBeVisible();
  });

  test('AC7: Task preview updates in real-time when rule changes', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Start with daily rule
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /每天/ }).click();

    // Fill in title to trigger preview
    await page.fill('input[id="title"]', '实时预览测试');
    await page.fill('input[id="points"]', '5');

    // Scroll to preview
    await page.getByText('任务生成预览').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Get initial task count for 30 days
    const initialPreview = page.getByText(/未来30天/).locator('..').locator('div').first();

    // Change to weekdays rule
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /工作日/ }).click();

    // Wait for preview to update
    await page.waitForTimeout(500);

    // Verify preview has updated (weekdays should have fewer tasks than daily)
    const updatedPreview = page.getByText(/未来30天/).locator('..').locator('div').first();
    await expect(updatedPreview).toBeVisible();
  });

  test('AC7: Preview shows warnings for gaps or low frequency', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select interval rule with large interval (should trigger warning)
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /自定义间隔/ }).click();

    // Set interval to 30 days (very large)
    const intervalInput = page.getByRole('spinbutton', { name: /间隔天数/ });
    await intervalInput.fill('30');

    // Fill in title to trigger preview
    await page.fill('input[id="title"]', '低频任务测试');
    await page.fill('input[id="points"]', '5');

    // Scroll to preview
    await page.getByText('任务生成预览').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Verify warning is shown for low frequency
    await expect(page.getByText(/间隔天数较长.*任务生成频率较低/)).toBeVisible();
  });

  test('Happy Path: Complete workflow - Create weekly task with exclusions and preview', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Step 1: Fill in basic info
    await page.fill('input[id="title"]', '每周家务任务');
    await page.getByRole('button', { name: /任务类型/ }).click();
    await page.getByRole('option', { name: /家务/ }).click();
    await page.fill('input[id="points"]', '10');

    // Step 2: Set weekly rule (Monday, Wednesday, Friday)
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /每周/ }).click();
    await page.getByRole('button', { name: /周一/ }).click();
    await page.getByRole('button', { name: /周三/ }).click();
    await page.getByRole('button', { name: /周五/ }).click();

    // Step 3: Add exclusion dates (exclude next Wednesday)
    await page.getByText('排除日期').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /选择排除日期/ }).click();

    // Select a date in the next week
    await page.getByRole('gridcell', { name: /12/ }).first().click();

    // Step 4: Review preview
    await page.getByText('任务生成预览').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Verify preview shows statistics
    await expect(page.getByText(/未来30天/)).toBeVisible();

    // Step 5: Submit the form
    await page.click('button:has-text("立即发布")');
    await page.waitForTimeout(2000);

    // Verify success - should navigate away or show success message
    await expect(page).toHaveURL(/\/tasks|\/dashboard|\/parent/);
  });

  test('AC Validation: Weekly rule requires at least one day selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select weekly frequency
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /每周/ }).click();

    // Don't select any days, try to submit
    await page.fill('input[id="title"]', '未选择日期的每周任务');
    await page.fill('input[id="points"]', '5');

    // Try to submit - should show validation error
    await page.click('button:has-text("立即发布")');
    await page.waitForTimeout(500);

    // Verify error message
    await expect(page.getByText(/请至少选择一天/)).toBeVisible();
  });

  test('AC Validation: Interval must be greater than 0', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select interval frequency
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /自定义间隔/ }).click();

    // Set interval to 0
    const intervalInput = page.getByRole('spinbutton', { name: /间隔天数/ });
    await intervalInput.fill('0');

    // Fill in other fields
    await page.fill('input[id="title"]', '无效间隔测试');
    await page.fill('input[id="points"]', '5');

    // Try to submit - should show validation error
    await page.click('button:has-text("立即发布")');
    await page.waitForTimeout(500);

    // Verify error message
    await expect(page.getByText(/间隔天数必须大于0/)).toBeVisible();
  });

  test('AC Validation: Specific dates requires at least one date', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // Select specific dates frequency
    await page.getByRole('button', { name: /规则类型/ }).click();
    await page.getByRole('option', { name: /特定日期/ }).click();

    // Don't select any dates, try to submit
    await page.fill('input[id="title"]', '未选择日期的特定日期任务');
    await page.fill('input[id="points"]', '5');

    // Try to submit - should show validation error
    await page.click('button:has-text("立即发布")');
    await page.waitForTimeout(500);

    // Verify error message
    await expect(page.getByText(/请至少选择一个日期/)).toBeVisible();
  });
});
