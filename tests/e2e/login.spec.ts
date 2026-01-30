import { test, expect } from '@playwright/test';

/**
 * E2E 测试 - 登录流程
 * 
 * 测试完整用户登录流程
 */

test.describe('登录页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('应该显示登录页面标题', async ({ page }) => {
    await expect(page).toHaveTitle(/Family Reward/);
  });

  test('应该显示家长和儿童登录选项', async ({ page }) => {
    // 检查家长登录标签
    await expect(page.getByRole('tab', { name: /家长登录/ })).toBeVisible();
    
    // 检查儿童登录标签
    await expect(page.getByRole('tab', { name: /儿童登录/ })).toBeVisible();
  });

  test('家长应该能用手机号和密码登录', async ({ page }) => {
    // 填写手机号
    await page.getByLabel(/手机号/).fill('13800000100');
    
    // 填写密码
    await page.getByLabel(/密码/).fill('1111');
    
    // 点击登录
    await page.getByRole('button', { name: /登录/ }).first().click();
    
    // 等待导航到家长面板
    await expect(page).toHaveURL(/\/parent/);
    
    // 验证页面内容
    await expect(page.getByText(/家长控制台/)).toBeVisible();
  });

  test('应该显示错误密码提示', async ({ page }) => {
    // 填写手机号
    await page.getByLabel(/手机号/).fill('13800000100');
    
    // 填写错误密码
    await page.getByLabel(/密码/).fill('wrongpassword');
    
    // 点击登录
    await page.getByRole('button', { name: /登录/ }).first().click();
    
    // 等待错误消息
    await expect(page.getByText(/密码错误/)).toBeVisible();
  });

  test('应该验证手机号格式', async ({ page }) => {
    // 填写无效手机号
    await page.getByLabel(/手机号/).fill('123');
    
    // 填写密码
    await page.getByLabel(/密码/).fill('1111');
    
    // 点击登录
    await page.getByRole('button', { name: /登录/ }).first().click();
    
    // 等待验证错误
    await expect(page.getByText(/请输入有效的手机号/)).toBeVisible();
  });
});

test.describe('儿童登录', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    
    // 切换到儿童登录
    await page.getByRole('tab', { name: /儿童登录/ }).click();
  });

  test('儿童应该能用 PIN 码登录', async ({ page }) => {
    // 选择儿童用户
    await page.getByLabel(/选择用户/).click();
    await page.getByRole('option', { name: /小明/ }).click();
    
    // 输入 PIN 码
    await page.getByLabel(/PIN码/).fill('1111');
    
    // 点击登录
    await page.getByRole('button', { name: /登录/ }).click();
    
    // 等待导航到儿童面板
    await expect(page).toHaveURL(/\/child/);
    
    // 验证儿童面板内容
    await expect(page.getByText(/我的积分/)).toBeVisible();
  });

  test('应该显示错误 PIN 提示', async ({ page }) => {
    // 选择儿童用户
    await page.getByLabel(/选择用户/).click();
    await page.getByRole('option', { name: /小明/ }).click();
    
    // 输入错误 PIN 码
    await page.getByLabel(/PIN码/).fill('9999');
    
    // 点击登录
    await page.getByRole('button', { name: /登录/ }).click();
    
    // 等待错误消息
    await expect(page.getByText(/PIN 码错误/)).toBeVisible();
  });
});
