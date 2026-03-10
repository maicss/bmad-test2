/**
 * E2E Tests for Quick Task Creation (Story 2.6)
 *
 * Story 2.6: Parent Uses Template to Quickly Create Task
 *
 * Tests the complete user flow from template selection to task creation.
 *
 * Source: Story 2.6 Task 7
 * Source: _bmad-output/project-context.md - E2E testing requirements
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;

test.describe.configure({ mode: 'serial' });

test.describe('Quick Task Creation - Story 2.6', () => {
  test.beforeEach(async () => {
    // Reset rate limit before each test
    try {
      const resetResponse = await fetch(`${BASE_URL}/api/test/reset-rate-limit`);
      await resetResponse.text();
    } catch (e) {
      // Ignore if endpoint doesn't exist
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login as parent
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
  });

  test('Given 家长有已发布任务模板，When 点击"使用模板创建任务"，Then 显示模板列表对话框', async ({ page }) => {
    // Given: 家长已登录并有任务模板
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded' });

    // When: 点击"使用模板创建任务"按钮
    await page.click('button:has-text("使用模板创建任务")');

    // Then: 显示模板选择对话框
    await expect(page.locator('dialog[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("选择任务模板")')).toBeVisible();

    // And: 显示筛选选项（全部、我的模板、管理员模板）
    await expect(page.locator('button:has-text("全部")')).toBeVisible();
    await expect(page.locator('button:has-text("我的模板")')).toBeVisible();
    await expect(page.locator('button:has-text("管理员模板")')).toBeVisible();
  });

  test('Given 模板选择器已打开，When 选择一个模板，Then 显示快速任务创建表单并预填模板信息', async ({ page }) => {
    // Given: 打开模板选择器并选择模板
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded' });
    await page.click('button:has-text("使用模板创建任务")');

    // When: 选择第一个模板
    const templateCard = page.locator('[role="dialog"]').locator('label').first();
    await templateCard.click();
    await page.click('button:has-text("选择模板")');

    // Then: 显示快速任务创建表单
    await expect(page.locator('h2:has-text("使用模板创建任务")')).toBeVisible();

    // And: 表单字段已预填充
    const titleInput = page.locator('input#title');
    const titleValue = await titleInput.inputValue();
    expect(titleValue.length).toBeGreaterThan(0);

    const pointsInput = page.locator('input#points');
    const pointsValue = await pointsInput.inputValue();
    expect(parseInt(pointsValue || '0')).toBeGreaterThan(0);
  });

  test('Given 已选择模板，When 修改任务名称和积分，Then 表单显示修改后的值', async ({ page }) => {
    // Given: 打开快速任务创建表单
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded' });
    await page.click('button:has-text("使用模板创建任务")');
    await page.locator('[role="dialog"]').locator('label').first().click();
    await page.click('button:has-text("选择模板")');

    // When: 修改任务名称和积分
    await page.fill('input#title', '临时刷牙任务');
    await page.fill('input#points', '10');

    // Then: 表单显示修改后的值
    const titleValue = await page.locator('input#title').inputValue();
    expect(titleValue).toBe('临时刷牙任务');

    const pointsValue = await page.locator('input#points').inputValue();
    expect(pointsValue).toBe('10');
  });

  test('Given 已填写表单并选择儿童，When 点击创建任务，Then 任务创建成功并显示成功提示', async ({ page }) => {
    // Given: 打开快速任务创建表单并填写信息
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded' });
    await page.click('button:has-text("使用模板创建任务")');
    await page.locator('[role="dialog"]').locator('label').first().click();
    await page.click('button:has-text("选择模板")');

    // 选择儿童
    await page.check('input[type="checkbox"]');

    // When: 点击创建任务
    await page.click('button:has-text("创建任务")');

    // Then: 显示成功提示
    await expect(page.locator('.toast:has-text("成功")')).toBeVisible();

    // And: 对话框关闭
    await expect(page.locator('dialog[role="dialog"]')).not.toBeVisible();
  });

  test('Given 已选择模板，When 点击重置为模板值，Then 表单恢复到模板默认值', async ({ page }) => {
    // Given: 打开快速任务创建表单
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded' });
    await page.click('button:has-text("使用模板创建任务")');
    await page.locator('[role="dialog"]').locator('label').first().click();
    await page.click('button:has-text("选择模板")');

    // 修改值
    await page.fill('input#title', '修改后的标题');
    await page.fill('input#points', '999');

    // When: 点击重置为模板值
    await page.click('button:has-text("重置为模板值")');

    // Then: 表单恢复到模板默认值
    const titleValue = await page.locator('input#title').inputValue();
    expect(titleValue).not.toBe('修改后的标题');

    const pointsValue = await page.locator('input#points').inputValue();
    expect(pointsValue).not.toBe('999');
  });

  test('Given 模板选择器已打开，When 搜索模板，Then 显示匹配的模板', async ({ page }) => {
    // Given: 打开模板选择器
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded' });
    await page.click('button:has-text("使用模板创建任务")');

    // When: 在搜索框输入关键词
    await page.fill('input[placeholder*="搜索"]', '刷牙');

    // Then: 只显示匹配的模板
    const templates = page.locator('[role="dialog"] label');
    const count = await templates.count();

    // 验证所有模板标题包含搜索关键词
    for (let i = 0; i < count; i++) {
      const templateText = await templates.nth(i).textContent();
      expect(templateText).toContain('刷牙');
    }
  });

  test('Given 模板选择器已打开，When 切换到"我的模板"，Then 只显示家长创建的模板', async ({ page }) => {
    // Given: 打开模板选择器
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded' });
    await page.click('button:has-text("使用模板创建任务")');

    // When: 点击"我的模板"筛选
    await page.click('button:has-text("我的模板")');

    // Then: 只显示家长创建的模板（管理员模板被隐藏）
    // 这里假设有管理员模板，验证管理员模板标签不显示
    const adminBadges = page.locator('.badge:has-text("管理员")');
    await expect(adminBadges).toHaveCount(0);
  });

  test('Given 快速任务表单已打开，When 不选择儿童，Then 显示验证错误', async ({ page }) => {
    // Given: 打开快速任务创建表单
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded' });
    await page.click('button:has-text("使用模板创建任务")');
    await page.locator('[role="dialog"]').locator('label').first().click();
    await page.click('button:has-text("选择模板")');

    // When: 不选择儿童直接点击创建
    await page.click('button:has-text("创建任务")');

    // Then: 显示验证错误提示
    const errorMessage = page.locator('p:has-text("请至少选择一个儿童")');
    await expect(errorMessage).toBeVisible();
  });

  test('Given 快速任务表单已打开，When 使用过去的日期，Then 显示验证错误', async ({ page }) => {
    // Given: 打开快速任务创建表单
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded' });
    await page.click('button:has-text("使用模板创建任务")');
    await page.locator('[role="dialog"]').locator('label').first().click();
    await page.click('button:has-text("选择模板")');

    // When: 设置过去日期
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().split('T')[0];

    await page.fill('input#scheduled_date', pastDate);
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("创建任务")');

    // Then: 显示验证错误提示
    const errorMessage = page.locator('.toast:has-text("日期")');
    await expect(errorMessage).toBeVisible();
  });
});
