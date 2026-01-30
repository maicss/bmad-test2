import { test, expect } from '@playwright/test';

/**
 * E2E 测试 - 儿童面板
 * 
 * 测试儿童面板完整功能
 */

test.describe('儿童面板', () => {
  test.beforeEach(async ({ page }) => {
    // 登录为儿童
    await page.goto('/auth/login');
    await page.getByRole('tab', { name: /儿童登录/ }).click();
    
    // 选择儿童用户
    await page.getByLabel(/选择用户/).click();
    await page.getByRole('option', { name: /小明/ }).click();
    
    // 输入 PIN 码
    await page.getByLabel(/PIN码/).fill('1111');
    await page.getByRole('button', { name: /登录/ }).click();
    
    // 等待导航
    await page.waitForURL(/\/child/);
  });

  test('应该显示欢迎信息', async ({ page }) => {
    await expect(page.getByText(/我的奖励/)).toBeVisible();
  });

  test('应该显示当前积分', async ({ page }) => {
    await expect(page.getByText(/我的积分/)).toBeVisible();
    await expect(page.getByText(/0/)).toBeVisible();
  });

  test('应该显示今日任务', async ({ page }) => {
    await expect(page.getByText(/今日任务/)).toBeVisible();
    
    // 检查任务列表
    await expect(page.getByText(/完成作业/)).toBeVisible();
    await expect(page.getByText(/整理房间/)).toBeVisible();
  });

  test('应该能标记任务完成', async ({ page }) => {
    // 找到第一个未完成的任务
    const checkbox = page.locator('button[role="checkbox"]').first();
    
    // 点击复选框
    await checkbox.click();
    
    // 验证任务状态改变
    await expect(page.getByText(/已完成/)).toBeVisible();
  });

  test('应该显示愿望进度', async ({ page }) => {
    await expect(page.getByText(/我的愿望/)).toBeVisible();
    
    // 检查愿望
    await expect(page.getByText(/去游乐园/)).toBeVisible();
  });

  test('应该显示成就徽章', async ({ page }) => {
    await expect(page.getByText(/我的成就/)).toBeVisible();
    
    // 检查徽章
    await expect(page.getByText(/连续7天/)).toBeVisible();
    await expect(page.getByText(/积分达人/)).toBeVisible();
  });

  test('应该显示统计数据', async ({ page }) => {
    await expect(page.getByText(/7/)).toBeVisible(); // 连续天数
    await expect(page.getByText(/12/)).toBeVisible(); // 本周任务
    await expect(page.getByText(/3/)).toBeVisible(); // 已获得徽章
  });

  test('应该能退出登录', async ({ page }) => {
    // 点击退出
    await page.getByRole('button', { name: /退出/ }).click();
    
    // 应该返回到登录页
    await page.waitForURL(/\/auth\/login/);
  });
});
