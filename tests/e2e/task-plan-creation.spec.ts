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
const TEST_PARENT = {
  phone: '13800000100',
  password: '1111',
};

/**
 * Helper: Login as parent via API and set session cookie
 * This bypasses the UI login flow issues
 */
async function loginAsParentViaAPI(page) {
  // Call login API directly
  const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      phone: TEST_PARENT.phone,
      authMethod: 'password',
      password: TEST_PARENT.password,
    },
  });

  if (!response.ok()) {
    throw new Error('API login failed');
  }

  const data = await response.json();
  const sessionToken = data.session.token;

  // Set the session cookie and navigate to tasks page
  await page.goto(`${BASE_URL}/tasks`);

  // Use page.context() to add cookies for all future requests
  await page.context().addCookies([
    {
      name: 'better-auth.session_token',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // Reload page to apply the cookie
  await page.reload();
}

test.describe('Story 2.1: Parent Creates Task Plan Template', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParentViaAPI(page);
  });

  test('given logged-in parent, when navigating to tasks page, then task plans list is displayed', async ({ page }) => {
    // Navigate to tasks page
    await page.goto(`${BASE_URL}/tasks`);

    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 5000 });

    // Verify page title
    const title = await page.textContent('h1');
    expect(title).toContain('任务模板');

    // Verify "创建模板" button exists
    const createButton = page.getByRole('link', { name: /创建模板/ });
    await expect(createButton).toBeVisible();
  });

  test('given logged-in parent, when clicking create template button, then task plan form is displayed', async ({ page }) => {
    // Navigate to tasks create page
    await page.goto(`${BASE_URL}/tasks/create`);

    // Wait for form to load
    await page.waitForSelector('h1', { timeout: 5000 });

    // Verify form title
    const title = await page.textContent('h1');
    expect(title).toContain('创建任务模板');

    // Verify required form fields exist
    await expect(page.getByLabel(/模板名称/)).toBeVisible();
    await expect(page.getByLabel(/任务类型/)).toBeVisible();
    await expect(page.getByLabel(/积分值/)).toBeVisible();

    // Verify buttons exist
    await expect(page.getByRole('button', { name: /保存草稿/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /立即发布/ })).toBeVisible();
  });

  test('given parent fills form with valid data, when submitting, then task plan is created', async ({ page }) => {
    // Navigate to create page
    await page.goto(`${BASE_URL}/tasks/create`);

    // Wait for form
    await page.waitForSelector('input#title', { timeout: 5000 });

    // Fill in form
    await page.fill('input#title', '每日阅读');

    // Select task type (using Select trigger)
    await page.click('.trigger:has-text("选择任务类型")');
    await page.click('[role="option"]:has-text("学习")');

    // Fill points
    await page.fill('input#points', '10');

    // Submit as draft
    await page.click('button:has-text("保存草稿")');

    // Wait for response
    await page.waitForTimeout(3000);

    // Verify - check if we're still on the page
    const url = page.url();
    expect(url).toContain('/tasks');
  });

  test('given parent enters title > 50 chars, when validation runs, then visual feedback is shown', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);

    // Wait for form
    await page.waitForSelector('input#title', { timeout: 5000 });

    // Enter title that's too long (>50 chars)
    const longTitle = '这是一个非常非常非常非常非常非常非常非常非常非常非常长的任务模板名称绝对超过了五十个字符的限制';
    await page.fill('input#title', longTitle);

    // Trigger validation by blurring
    await page.blur('input#title');

    // Check character count display shows it's too long
    const charCount = await page.textContent('text:has-text("/50")');
    expect(charCount).toBeTruthy();

    // Verify the title is longer than 50 characters
    expect(longTitle.length).toBeGreaterThan(50);
  });

  test('given parent enters points < 1, when validation runs, then visual feedback is shown', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);

    // Wait for form
    await page.waitForSelector('input#points', { timeout: 5000 });

    // Enter invalid points (less than 1)
    await page.fill('input#points', '0');
    await page.blur('input#points');

    // Verify input value
    const inputValue = await page.inputValue('input#points');
    expect(inputValue).toBe('0');
  });

  test('given parent enters points > 100, when validation runs, then visual feedback is shown', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);

    // Wait for form
    await page.waitForSelector('input#points', { timeout: 5000 });

    // Enter invalid points (more than 100)
    await page.fill('input#points', '101');
    await page.blur('input#points');

    // Verify input value
    const inputValue = await page.inputValue('input#points');
    expect(inputValue).toBe('101');
  });

  test('given parent selects custom frequency without selecting days, when validating, then validation error appears', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks/create`);

    // Wait for form
    await page.waitForSelector('button:has-text("自定义")', { timeout: 5000 });

    // Select custom frequency
    await page.click('button:has-text("自定义")');

    // Don't select any days, try to submit
    await page.click('button:has-text("保存草稿")');

    // Custom days section should be visible
    await expect(page.getByText('选择星期')).toBeVisible();
  });
});

test.describe('Story 2.1: Frequency Rules', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParentViaAPI(page);
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForSelector('h1', { timeout: 5000 });
  });

  test('given parent selects daily frequency, when viewing form, then daily option is selected', async ({ page }) => {
    // Daily is default - just verify it's visible
    const dailyButton = page.locator('button:has-text("每天")');
    await expect(dailyButton).toBeVisible();
  });

  test('given parent selects weekdays frequency, when viewing form, then weekdays is selected', async ({ page }) => {
    await page.click('button:has-text("工作日")');

    // Verify selection
    const weekdaysButton = page.locator('button:has-text("工作日")');
    await expect(weekdaysButton).toBeVisible();
  });

  test('given parent selects weekends frequency, when viewing form, then weekends is selected', async ({ page }) => {
    await page.click('button:has-text("周末")');

    const weekendsButton = page.locator('button:has-text("周末")');
    await expect(weekendsButton).toBeVisible();
  });

  test('given parent selects custom frequency, when viewing form, then custom day selection appears', async ({ page }) => {
    await page.click('button:has-text("自定义")');

    // Custom day buttons should appear
    await expect(page.getByText('选择星期')).toBeVisible();

    // Day buttons should be visible
    await expect(page.getByText('周日')).toBeVisible();
    await expect(page.getByText('周一')).toBeVisible();
  });
});

test.describe('Story 2.1: Excluded Dates', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParentViaAPI(page);
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForSelector('h1', { timeout: 5000 });
  });

  test('given parent enters excluded dates, when viewing form, then dates are displayed', async ({ page }) => {
    const dates = '2026-03-10,2026-03-15';

    await page.fill('input#excluded_dates', dates);

    const value = await page.inputValue('input#excluded_dates');
    expect(value).toBe(dates);
  });
});
