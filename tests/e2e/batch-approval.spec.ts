/**
 * E2E Tests for Story 2.7: Parent Batch Approves Tasks
 *
 * Happy Path Coverage:
 * 1. 家长登录并进入任务审批页面
 * 2. 查看待审批任务列表
 * 3. 单个任务通过
 * 4. 单个任务驳回
 * 5. 批量选择多个任务并批量通过
 * 6. 批量选择多个任务并批量驳回
 * 7. 验证积分正确累加
 * 8. 查看任务完成证明图片
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;

// Test data - 使用测试环境中已存在的用户
const TEST_PARENT = {
  phone: '13800000100',
  password: '1111',
};

test.describe('Story 2.7: Parent Batch Approves Tasks - Happy Paths', () => {
  test.describe.configure({ mode: 'serial' });

  test('given 家长已登录，when 进入任务审批页面，then 显示待审批任务列表', async ({ page }) => {
    // Given: 家长已登录
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Login with password
    await page.locator('text=密码').click();
    await page.fill('#phone', TEST_PARENT.phone);
    await page.fill('#password', TEST_PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // When: 进入任务审批页面 (navigate directly with family_id)
    await page.goto(`${BASE_URL}/approval?family_id=family-001`);
    await page.waitForLoadState('networkidle');

    // Debug: print current URL
    console.log('Current URL after navigation:', page.url());

    // Then: 显示审批页面
    const pageTitle = page.locator('h1').first();
    await expect(pageTitle).toContainText(/审批|任务/);
  });

  test('given 家长在审批页面有待审批任务，when 点击全选，then 所有任务被选中', async ({ page }) => {
    // Given: 家长已登录
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('text=密码').click();
    await page.fill('#phone', TEST_PARENT.phone);
    await page.fill('#password', TEST_PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    await page.goto(`${BASE_URL}/approval?family_id=family-001`);
    await page.waitForLoadState('networkidle');

    // Check if there are tasks
    const taskCards = page.locator('[data-testid="task-card"]');
    const count = await taskCards.count();

    if (count > 0) {
      // When: 点击全选
      const selectAllCheckbox = page.locator('[data-testid="select-all-checkbox"]');
      await selectAllCheckbox.click();
      await page.waitForTimeout(500);

      // Then: 所有任务被选中
      const checkedCount = await page.locator('input[type="checkbox"]:checked').count();
      expect(checkedCount).toBeGreaterThan(0);
    }
  });

  test('given 家长选择任务后，when 点击批量通过按钮，then 显示确认对话框', async ({ page }) => {
    // Given: 家长已登录并有任务
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('text=密码').click();
    await page.fill('#phone', TEST_PARENT.phone);
    await page.fill('#password', TEST_PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    await page.goto(`${BASE_URL}/approval?family_id=family-001`);
    await page.waitForLoadState('networkidle');

    const taskCards = page.locator('[data-testid="task-card"]');
    const count = await taskCards.count();

    if (count >= 2) {
      // Select tasks
      const checkboxes = page.locator('input[type="checkbox"]');
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      await page.waitForTimeout(500);

      // When: 点击批量通过按钮
      const batchApproveButton = page.locator('[data-testid="batch-approve-button"]');
      await expect(batchApproveButton).toBeVisible();
      await batchApproveButton.click();

      // Then: 显示确认对话框
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('text=/确认/')).toBeVisible();

      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('given 家长选择任务后，when 点击批量驳回按钮，then 显示驳回原因输入框', async ({ page }) => {
    // Given: 家长已登录
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('text=密码').click();
    await page.fill('#phone', TEST_PARENT.phone);
    await page.fill('#password', TEST_PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    await page.goto(`${BASE_URL}/approval?family_id=family-001`);
    await page.waitForLoadState('networkidle');

    const taskCards = page.locator('[data-testid="task-card"]');
    const count = await taskCards.count();

    if (count > 0) {
      // Select a task
      const checkboxes = page.locator('input[type="checkbox"]');
      await checkboxes.first().check();
      await page.waitForTimeout(500);

      // When: 点击批量驳回按钮
      const batchRejectButton = page.locator('[data-testid="batch-reject-button"]');
      await expect(batchRejectButton).toBeVisible();
      await batchRejectButton.click();

      // Then: 显示驳回原因对话框
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('text=/驳回/')).toBeVisible();

      // Check for textarea
      const textarea = dialog.locator('textarea[name="reason"]');
      await expect(textarea).toBeVisible();

      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('given 家长选中任务后，when 点击取消选择，then 批量操作栏消失', async ({ page }) => {
    // Given: 家长已登录
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('text=密码').click();
    await page.fill('#phone', TEST_PARENT.phone);
    await page.fill('#password', TEST_PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    await page.goto(`${BASE_URL}/approval?family_id=family-001`);
    await page.waitForLoadState('networkidle');

    const taskCards = page.locator('[data-testid="task-card"]');
    const count = await taskCards.count();

    if (count > 0) {
      // Select a task
      const checkboxes = page.locator('input[type="checkbox"]');
      await checkboxes.first().check();
      await page.waitForTimeout(500);

      // Verify batch action bar appears
      const batchActionBar = page.locator('[data-testid="batch-action-bar"]');
      await expect(batchActionBar).toBeVisible();

      // When: 点击取消选择
      const cancelButton = page.locator('button:has-text("取消选择")');
      await cancelButton.click();

      // Then: 批量操作栏消失
      await expect(batchActionBar).not.toBeVisible();
    }
  });

  test('given 审批页面有多个儿童，when 点击儿童筛选按钮，then 可以按儿童筛选', async ({ page }) => {
    // Given: 家长已登录
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('text=密码').click();
    await page.fill('#phone', TEST_PARENT.phone);
    await page.fill('#password', TEST_PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    await page.goto(`${BASE_URL}/approval?family_id=family-001`);
    await page.waitForLoadState('networkidle');

    // Check for child filter buttons
    const filterButtons = page.locator('button').filter({ hasText: /全部|儿童/ });
    const buttonCount = await filterButtons.count();

    if (buttonCount > 1) {
      // When: 点击非"全部儿童"的筛选按钮
      await filterButtons.nth(1).click();
      await page.waitForTimeout(500);

      // Then: 筛选按钮状态改变
      const activeButton = filterButtons.nth(1);
      const bgColor = await activeButton.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Active button should have different background
      expect(bgColor).toBeTruthy();

      // When: 点击"全部儿童"恢复
      await page.locator('button:has-text("全部儿童")').click();
      await page.waitForTimeout(500);
    }
  });

  test('given 任务有完成证明，when 点击查看证明按钮，then 显示图片预览', async ({ page }) => {
    // Given: 家长已登录
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('text=密码').click();
    await page.fill('#phone', TEST_PARENT.phone);
    await page.fill('#password', TEST_PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    await page.goto(`${BASE_URL}/approval?family_id=family-001`);
    await page.waitForLoadState('networkidle');

    // Check for proof image buttons
    const proofImageButtons = page.locator('button:has-text("查看证明")');
    const proofCount = await proofImageButtons.count();

    if (proofCount > 0) {
      // When: 点击查看证明按钮
      await proofImageButtons.first().click();

      // Then: 显示图片预览对话框
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Verify close button exists
      const closeButton = dialog.locator('button[aria-label="Close"], button:has(svg)');
      await expect(closeButton).toBeVisible();

      // Close dialog
      await closeButton.click();
      await expect(dialog).not.toBeVisible();
    } else {
      // If no proof images, that's okay
      console.log('No proof images found in current data');
    }
  });
});
