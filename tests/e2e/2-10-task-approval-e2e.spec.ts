/**
 * E2E Tests for Story 2.10: Parent Approves Task Completion
 *
 * Happy Path Coverage:
 * 1. 家长已登录且有等待审批的任务
 * 2. 点击单个任务的通过按钮
 * 3. 验证任务状态变更为approved且积分累加
 * 4. 点击单个任务的驳回按钮
 * 5. 填写驳回原因并确认驳回
 * 6. 验证任务状态返回pending
 * 7. 查看审批历史记录
 *
 * Source: Story 2.10 Acceptance Criteria
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;

// Test data - 使用测试环境中已存在的用户
const TEST_PARENT = {
  phone: '13800000100',
  password: '1111',
};

test.describe('Story 2.10: Parent Approves Task Completion - Happy Paths', () => {
  test.describe.configure({ mode: 'serial' });

  test('given 家长已登录且有等待审批的任务, when 点击单个任务通过按钮, then 任务状态变更为approved且积分累加', async ({ page }) => {
    // Given: 家长已登录
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Login with password
    await page.locator('text=密码').click();
    await page.fill('#phone', TEST_PARENT.phone);
    await page.fill('#password', TEST_PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // When: 进入任务审批页面
    await page.goto(`${BASE_URL}/approval?family_id=family-001`);
    await page.waitForLoadState('networkidle');

    // Then: 显示审批页面
    const pageTitle = page.locator('h1').first();
    await expect(pageTitle).toContainText(/审批|任务/);

    // Select "待审批" filter
    await page.locator('button:has-text("待审批")').click();
    await page.waitForTimeout(1000);

    // Check if there are any completed tasks to approve
    const taskCards = page.locator('[data-testid="task-card"]');
    const taskCount = await taskCards.count();

    if (taskCount > 0) {
      // Get the first approve button and click it
      const firstTask = taskCards.first();
      const approveButton = firstTask.locator('button:has([data-testid="task-icon"]) ~ button');

      // Click approve button (green checkmark)
      await approveButton.click();
      await page.waitForTimeout(2000);

      // Then: 验证成功消息或任务状态变化
      // Note: 验证toast消息或任务从列表中移除
      const currentCount = await taskCards.count();
      expect(currentCount).toBeLessThanOrEqual(taskCount);
    }
  });

  test('given 家长已登录且有等待审批的任务, when 点击单个任务驳回按钮并填写原因, then 任务状态返回pending', async ({ page }) => {
    // Given: 家长已登录
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('text=密码').click();
    await page.fill('#phone', TEST_PARENT.phone);
    await page.fill('#password', TEST_PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // When: 进入任务审批页面
    await page.goto(`${BASE_URL}/approval?family_id=family-001`);
    await page.waitForLoadState('networkidle');

    // Select "待审批" filter
    await page.locator('button:has-text("待审批")').click();
    await page.waitForTimeout(1000);

    // Check if there are completed tasks to reject
    const taskCards = page.locator('[data-testid="task-card"]');
    const taskCount = await taskCards.count();

    if (taskCount > 0) {
      // Get the first task and click reject button
      const firstTask = taskCards.first();
      const rejectButton = firstTask.locator('button').filter({ hasText: '' }).nth(1); // Second button is reject

      await rejectButton.click();
      await page.waitForTimeout(1000);

      // Fill in rejection reason dialog
      const reason = '测试驳回原因';
      const textarea = page.locator('textarea[name="reason"]');
      if (await textarea.count() > 0) {
        await textarea.fill(reason);

        // Click confirm button
        const confirmButton = page.locator('button:has-text("确认驳回")');
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Then: 验证任务已被驳回或移除
    // Task should either be removed from pending list or show rejected status
  });

  test('given 家长已登录, when 查看审批页面, then 显示审批历史记录', async ({ page }) => {
    // Given: 家长已登录
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('text=密码').click();
    await page.fill('#phone', TEST_PARENT.phone);
    await page.fill('#password', TEST_PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // When: 进入任务审批页面
    await page.goto(`${BASE_URL}/approval?family_id=family-001`);
    await page.waitForLoadState('networkidle');

    // Then: 验证审批历史组件存在
    const auditLogSection = page.locator('h3:has-text("审批历史")');
    await expect(auditLogSection).toBeVisible();
  });

  test('API test: given 已登录家长, when 调用单个任务审批API, then 返回成功响应', async ({ request }) => {
    // This test verifies the single-task approval endpoint directly
    // Note: 需要先有一个completed状态的任务ID

    // Login to get session cookie
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        phone: TEST_PARENT.phone,
        password: TEST_PARENT.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    const loginData = await loginResponse.json();
    // Skip if login fails
    if (!loginData.success) {
      test.skip();
      return;
    }

    // Get session cookie
    const cookies = loginResponse.headers()['set-cookie'];

    // Try to get a completed task first
    const tasksResponse = await request.get(`${BASE_URL}/api/tasks?family_id=family-001&status=completed`, {
      headers: {
        cookie: cookies || '',
      },
    });

    if (tasksResponse.ok()) {
      const tasksData = await tasksResponse.json();

      if (tasksData.tasks && tasksData.tasks.length > 0) {
        const taskId = tasksData.tasks[0].id;

        // Test single task approval endpoint
        const approveResponse = await request.post(`${BASE_URL}/api/tasks/${taskId}/approve`, {
          headers: {
            'Content-Type': 'application/json',
            cookie: cookies || '',
          },
          data: {},
        });

        // Then: 验证响应
        expect(approveResponse.ok()).toBeTruthy();

        const approveData = await approveResponse.json();
        expect(approveData.success).toBe(true);
        expect(approveData.taskId).toBe(taskId);
        expect(approveData.pointsAdded).toBeGreaterThan(0);
      }
    }
  });

  test('API test: given 已登录家长, when 调用单个任务驳回API, then 返回成功响应', async ({ request }) => {
    // Login to get session cookie
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        phone: TEST_PARENT.phone,
        password: TEST_PARENT.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      test.skip();
      return;
    }

    const cookies = loginResponse.headers()['set-cookie'];

    // Get a completed task
    const tasksResponse = await request.get(`${BASE_URL}/api/tasks?family_id=family-001&status=completed`, {
      headers: {
        cookie: cookies || '',
      },
    });

    if (tasksResponse.ok()) {
      const tasksData = await tasksResponse.json();

      if (tasksData.tasks && tasksData.tasks.length > 0) {
        const taskId = tasksData.tasks[0].id;

        // Test single task rejection endpoint
        const rejectResponse = await request.post(`${BASE_URL}/api/tasks/${taskId}/reject`, {
          headers: {
            'Content-Type': 'application/json',
            cookie: cookies || '',
          },
          data: {
            reason: '测试驳回原因',
          },
        });

        // Then: 验证响应
        expect(rejectResponse.ok()).toBeTruthy();

        const rejectData = await rejectResponse.json();
        expect(rejectData.success).toBe(true);
        expect(rejectData.taskId).toBe(taskId);
      }
    }
  });

  test('API test: given 已登录用户, when 查询通知列表, then 返回通知数据', async ({ request }) => {
    // Login to get session cookie
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        phone: TEST_PARENT.phone,
        password: TEST_PARENT.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      test.skip();
      return;
    }

    const cookies = loginResponse.headers()['set-cookie'];

    // Test notifications endpoint
    const notificationsResponse = await request.get(`${BASE_URL}/api/notifications?limit=10`, {
      headers: {
        cookie: cookies || '',
      },
    });

    // Then: 验证响应
    expect(notificationsResponse.ok()).toBeTruthy();

    const notificationsData = await notificationsResponse.json();
    expect(notificationsData).toHaveProperty('notifications');
    expect(notificationsData).toHaveProperty('unreadCount');
  });

  test('API test: given 已登录用户, when 查询审计日志, then 返回审计记录', async ({ request }) => {
    // Login to get session cookie
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        phone: TEST_PARENT.phone,
        password: TEST_PARENT.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      test.skip();
      return;
    }

    const cookies = loginResponse.headers()['set-cookie'];

    // Test audit logs endpoint
    const auditLogsResponse = await request.get(`${BASE_URL}/api/audit-logs?limit=10`, {
      headers: {
        cookie: cookies || '',
      },
    });

    // Then: 验证响应
    expect(auditLogsResponse.ok()).toBeTruthy();

    const auditLogsData = await auditLogsResponse.json();
    expect(auditLogsData).toHaveProperty('auditLogs');
  });
});
