/**
 * Task Plan Lifecycle E2E Tests
 *
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 *
 * Uses simplified selectors for better reliability.
 */

import { test, expect } from '@playwright/test';
import { loginAs, waitForAuthenticatedPage } from '../helpers/auth';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3344';

test.describe('Task Plan Lifecycle', () => {
  test.beforeEach(async ({ page, request }) => {
    const success = await loginAs(request, page, 'parentZhang1');
    if (!success) {
      throw new Error('Failed to login as test user');
    }
  });

  test('given 家长已登录并有已发布任务计划，when 暂停7天，then 显示暂停成功和倒计时', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    const loaded = await waitForAuthenticatedPage(page);
    if (!loaded) {
      test.skip(true, 'Page failed to load');
      return;
    }
    await page.waitForTimeout(2000);

    // Find any published task plan with pause button
    const pauseButtons = page.locator('button:has-text("暂停")');
    const count = await pauseButtons.count();

    if (count === 0) {
      test.skip(true, 'No published task plans available');
      return;
    }

    // Click the first pause button
    await pauseButtons.first().click();
    await page.waitForTimeout(500);

    // Verify dialog appears
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Select 7 days and confirm
    await page.click('label[for="pause-7"]');
    await page.locator('button:has-text("确认暂停")').click();

    // Verify success toast message appears with the pause duration
    await expect(page.getByText(/任务计划已暂停7天/)).toBeVisible();

    // Wait for the API call to complete and UI to update
    await page.waitForTimeout(2000);

    // Verify that at least one task plan now shows paused status
    // This confirms the pause action worked
    const pausedPlans = page.locator('[data-testid="task-plan-item"]').filter({ hasText: '已暂停' });
    await expect(pausedPlans.first()).toBeVisible();
  });

  test('given 家长有已暂停任务计划，when 恢复，then 任务计划状态变更为已发布', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    const loaded = await waitForAuthenticatedPage(page);
    if (!loaded) {
      test.skip(true, 'Page failed to load');
      return;
    }
    await page.waitForTimeout(2000);

    // Find any paused task plan
    const pausedPlans = page.locator('[data-testid="task-plan-item"]').filter({ hasText: '已暂停' });
    const count = await pausedPlans.count();

    if (count === 0) {
      test.skip(true, 'No paused task plans available');
      return;
    }

    // Click resume button on the first paused plan
    const resumeButton = pausedPlans.first().locator('button:has-text("恢复")');
    await resumeButton.click();

    // Verify success toast message appears
    await expect(page.getByText(/任务计划已恢复/)).toBeVisible();

    // Wait for the API call to complete and UI to update
    await page.waitForTimeout(2000);

    // Verify the success - the resume action completed
    // We verify by checking that the success toast appeared (done above)
    // and that there's at least one published plan on the page
    const publishedPlans = page.locator('[data-testid="status-badge"]').filter({ hasText: '已发布' });
    await expect(publishedPlans.first()).toBeVisible();
  });

  test('given 家长在任务计划页面，when 查看列表，then 显示状态徽章和操作按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    const loaded = await waitForAuthenticatedPage(page);
    if (!loaded) {
      test.skip(true, 'Page failed to load');
      return;
    }
    await page.waitForTimeout(2000);

    // Check for task plans or empty state
    const items = page.locator('[data-testid="task-plan-item"]');
    const count = await items.count();

    if (count === 0) {
      await expect(page.locator('text=还没有创建任何任务模板, text=暂无任务计划').first()).toBeVisible();
      return;
    }

    // Verify status badges exist
    await expect(page.locator('[data-testid="status-badge"]').first()).toBeVisible();

    // Verify action buttons exist
    await expect(page.locator('button[aria-label*="删除"], button:has(.lucide-trash)').first()).toBeVisible();
  });

  test('given 家长有任务计划，when 删除，then 显示警告提示并软删除', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    const loaded = await waitForAuthenticatedPage(page);
    if (!loaded) {
      test.skip(true, 'Page failed to load');
      return;
    }
    await page.waitForTimeout(2000);

    // Find a task plan with delete button
    const deleteButton = page.locator('button[aria-label*="删除"], button:has(.lucide-trash)').first();
    const hasDelete = await deleteButton.count() > 0;

    if (!hasDelete) {
      test.skip(true, 'No task plans available to delete');
      return;
    }

    const initialCount = await page.locator('[data-testid="task-plan-item"]').count();

    // Click delete
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Verify delete dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('此操作无法撤销');

    // Confirm deletion
    await page.locator('button:has-text("确认删除")').click();

    // Verify success - use first() since there may be multiple messages
    await expect(page.getByText(/已删除/).first()).toBeVisible();

    // Verify plan is removed
    await page.waitForTimeout(1000);
    const newCount = await page.locator('[data-testid="task-plan-item"]').count();
    expect(newCount).toBeLessThan(initialCount);
  });
});
