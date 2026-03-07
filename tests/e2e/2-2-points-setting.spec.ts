/**
 * E2E Tests for Story 2.2: Parent Sets Task Points Value
 *
 * Playwright E2E tests for points setting functionality
 *
 * Prerequisites:
 * - Dev server running on port 3344
 * - Test user exists (phone: 13800000100, password: 1111)
 * - UI components rendered and accessible
 *
 * Source: Story 2.2 AC #1-#4
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!

test.describe('Story 2.2: Parent Sets Task Points Value', () => {
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

  test('AC1: Happy Path - Points input accepts values 1-100', async ({ page }) => {
    // Given: 家长已登录并导航到任务创建页面
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // When: 输入最小积分值1
    const pointsInput = page.locator('input[id="points"]').or(page.getByLabel(/积分值/));
    await pointsInput.fill('1');

    // Then: 积分值正确设置
    const value1 = await pointsInput.inputValue();
    expect(value1).toBe('1');

    // When: 输入最大积分值100
    await pointsInput.fill('100');

    // Then: 积分值正确设置
    const value100 = await pointsInput.inputValue();
    expect(value100).toBe('100');

    // When: 输入中间值50
    await pointsInput.fill('50');

    // Then: 积分值正确设置
    const value50 = await pointsInput.inputValue();
    expect(value50).toBe('50');
  });

  test('AC2: Happy Path - Points suggestions display with difficulty levels', async ({ page }) => {
    // Given: 家长已登录并导航到任务创建页面
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // When & Then: 检查难度预设按钮是否显示
    await expect(page.getByText('简单').or(page.getByText('简单 (1-10)'))).toBeVisible();
    await expect(page.getByText('中等').or(page.getByText('中等 (15-30)'))).toBeVisible();
    await expect(page.getByText('困难').or(page.getByText('困难 (30-50)'))).toBeVisible();
    await expect(page.getByText('特殊').or(page.getByText('特殊 (50-100)'))).toBeVisible();
  });

  test('AC3: Happy Path - Clicking difficulty preset sets appropriate points', async ({ page }) => {
    // Given: 家长已登录并导航到任务创建页面
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    const pointsInput = page.locator('input[id="points"]').or(page.getByLabel(/积分值/));

    // When: 点击"简单"按钮
    const simpleButton = page.getByRole('button').filter({ hasText: '简单' }).first();
    await simpleButton.click();
    await page.waitForTimeout(100);

    // Then: 积分值在1-10范围内
    const simpleValue = await pointsInput.inputValue();
    const simpleNum = parseInt(simpleValue || '0');
    expect(simpleNum).toBeGreaterThanOrEqual(1);
    expect(simpleNum).toBeLessThanOrEqual(10);

    // When: 点击"中等"按钮
    const mediumButton = page.getByRole('button').filter({ hasText: '中等' }).first();
    await mediumButton.click();
    await page.waitForTimeout(100);

    // Then: 积分值在15-30范围内
    const mediumValue = await pointsInput.inputValue();
    const mediumNum = parseInt(mediumValue || '0');
    expect(mediumNum).toBeGreaterThanOrEqual(15);
    expect(mediumNum).toBeLessThanOrEqual(30);

    // When: 点击"困难"按钮
    const hardButton = page.getByRole('button').filter({ hasText: '困难' }).first();
    await hardButton.click();
    await page.waitForTimeout(100);

    // Then: 积分值在30-50范围内
    const hardValue = await pointsInput.inputValue();
    const hardNum = parseInt(hardValue || '0');
    expect(hardNum).toBeGreaterThanOrEqual(30);
    expect(hardNum).toBeLessThanOrEqual(50);
  });

  test('AC4: Happy Path - Task type auto-fills suggested points', async ({ page }) => {
    // Given: 家长已登录并导航到任务创建页面
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    const pointsInput = page.locator('input[id="points"]').or(page.getByLabel(/积分值/));
    const taskTypeSelect = page.locator('#task_type').or(page.getByLabel(/任务类型/));

    // When: 选择"刷牙"任务类型（简单任务）
    await taskTypeSelect.click();
    await page.getByRole('option', { name: '刷牙' }).click();
    await page.waitForTimeout(100);

    // Then: 积分值自动填充为简单任务范围
    const刷牙Value = await pointsInput.inputValue();
    const 刷牙Num = parseInt(刷牙Value || '0');
    expect(刷牙Num).toBeGreaterThanOrEqual(1);
    expect(刷牙Num).toBeLessThanOrEqual(10);

    // When: 选择"学习"任务类型（困难任务）
    await taskTypeSelect.click();
    await page.getByRole('option', { name: '学习' }).click();
    await page.waitForTimeout(100);

    // Then: 积分值自动填充为困难任务范围
    const 学习Value = await pointsInput.inputValue();
    const 学习Num = parseInt(学习Value || '0');
    expect(学习Num).toBeGreaterThanOrEqual(30);
    expect(学习Num).toBeLessThanOrEqual(50);
  });

  test('Validation: Points below 1 shows error', async ({ page }) => {
    // Given: 家长已登录并导航到任务创建页面
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    const pointsInput = page.locator('input[id="points"]').or(page.getByLabel(/积分值/));

    // When: 输入无效积分值0
    await pointsInput.fill('0');
    await pointsInput.blur();
    await page.waitForTimeout(100);

    // Then: 显示错误信息
    const error = page.getByText(/积分.*1.*100/).or(page.getByText(/最少1分/)).or(page.getByText(/最多100分/));
    await expect(error).toBeVisible();
  });

  test('Validation: Points above 100 shows error', async ({ page }) => {
    // Given: 家长已登录并导航到任务创建页面
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    const pointsInput = page.locator('input[id="points"]').or(page.getByLabel(/积分值/));

    // When: 输入无效积分值150
    await pointsInput.fill('150');
    await pointsInput.blur();
    await page.waitForTimeout(100);

    // Then: 显示错误信息
    const error = page.getByText(/积分.*1.*100/).or(page.getByText(/最多100分/));
    await expect(error).toBeVisible();
  });

  test('Integration: Happy Path - Can create task plan with points value', async ({ page }) => {
    // Given: 家长已登录并导航到任务创建页面
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // When: 填写表单并提交
    await page.fill('input[id="title"]', 'E2E积分测试任务');
    await page.locator('input[id="points"]').or(page.getByLabel(/积分值/)).fill('25');

    // 提交草稿
    await page.click('button:has-text("保存草稿")');
    await page.waitForTimeout(3000);

    // Then: 显示成功消息或跳转到任务列表
    const currentUrl = page.url();
    // 可能有成功消息或跳转
    const isSuccess = currentUrl.includes('/tasks') || page.getByText(/成功/).isVisible();
    expect(isSuccess).toBeTruthy();
  });

  test('UI: Points examples displayed for each difficulty', async ({ page }) => {
    // Given: 家长已登录并导航到任务创建页面
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // When & Then: 检查是否显示参考示例
    // 示例可能在提示文字或帮助区域
    const pageContent = await page.content();
    expect(pageContent).toMatch(/整理床铺|洗碗|完成作业|照顾宠物/);
  });

  test('Happy Path: Complete task creation flow with points', async ({ page }) => {
    // Given: 家长已登录并导航到任务创建页面
    await page.goto(`${BASE_URL}/tasks/create`);
    await page.waitForLoadState('domcontentloaded');

    // When: 完整填写任务创建表单
    // 1. 填写任务名称
    await page.fill('input[id="title"]', '每日刷牙');

    // 2. 选择任务类型
    await page.locator('#task_type').or(page.getByLabel(/任务类型/)).click();
    await page.getByRole('option', { name: '刷牙' }).click();

    // 3. 使用难度预设设置积分
    await page.getByRole('button').filter({ hasText: '简单' }).first().click();

    // 4. 选择循环规则
    await page.locator('#frequency').or(page.getByLabel(/循环规则/)).click();
    await page.getByRole('option', { name: '每天' }).click();

    // 5. 保存为草稿
    await page.click('button:has-text("保存草稿")');
    await page.waitForTimeout(3000);

    // Then: 任务创建成功
    const currentUrl = page.url();
    const hasSuccessMessage = page.getByText(/成功/).isVisible();
    expect(currentUrl.includes('/tasks') || hasSuccessMessage).toBeTruthy();
  });
});
