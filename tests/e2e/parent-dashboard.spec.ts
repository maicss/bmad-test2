import { test, expect } from '@playwright/test';

/**
 * E2E 测试 - 家长面板
 * 
 * 测试家长面板完整功能
 */

test.describe('家长面板', () => {
  test.beforeEach(async ({ page }) => {
    // 登录为家长
    await page.goto('/auth/login');
    await page.getByLabel(/手机号/).fill('13800000100');
    await page.getByLabel(/密码/).fill('1111');
    await page.getByRole('button', { name: /登录/ }).first().click();
    
    // 等待导航
    await page.waitForURL(/\/parent/);
  });

  test('应该显示欢迎信息', async ({ page }) => {
    await expect(page.getByText(/欢迎回来/)).toBeVisible();
    await expect(page.getByText(/测试家长/)).toBeVisible();
  });

  test('应该显示家庭成员', async ({ page }) => {
    await expect(page.getByText(/家庭成员/)).toBeVisible();
    
    // 检查家庭成员列表
    await expect(page.getByText(/爸爸/)).toBeVisible();
    await expect(page.getByText(/妈妈/)).toBeVisible();
    await expect(page.getByText(/小宝/)).toBeVisible();
  });

  test('应该显示积分信息', async ({ page }) => {
    await expect(page.getByText(/150/)).toBeVisible(); // 小宝的积分
  });

  test('应该显示快捷操作', async ({ page }) => {
    await expect(page.getByText(/添加任务/)).toBeVisible();
    await expect(page.getByText(/添加愿望/)).toBeVisible();
    await expect(page.getByText(/查看报告/)).toBeVisible();
    await expect(page.getByText(/家庭成员/)).toBeVisible();
  });

  test('应该显示任务列表', async ({ page }) => {
    await expect(page.getByText(/常用任务/)).toBeVisible();
    
    // 检查任务
    await expect(page.getByText(/完成作业/)).toBeVisible();
    await expect(page.getByText(/整理房间/)).toBeVisible();
  });

  test('应该能退出登录', async ({ page }) => {
    // 点击退出
    await page.getByRole('button', { name: /退出/ }).click();
    
    // 应该返回到登录页
    await page.waitForURL(/\/auth\/login/);
  });
});

test.describe('家长面板 - 任务管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/手机号/).fill('13800000100');
    await page.getByLabel(/密码/).fill('1111');
    await page.getByRole('button', { name: /登录/ }).first().click();
    await page.waitForURL(/\/parent/);
  });

  test('应该能添加新任务', async ({ page }) => {
    // 点击添加任务
    await page.getByText(/添加任务/).click();
    
    // 这里应该导航到任务创建页面
    // 根据实际实现填写测试
  });
});
