import { test, expect } from '@playwright/test';

/**
 * E2E 测试 - 公共页面
 * 
 * 测试无需认证的页面
 */

test.describe('公共页面', () => {
  test('首页应该重定向到登录页', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain('/auth/login');
  });

  test('登录页应该显示正确', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 检查标题
    await expect(page).toHaveTitle(/Family Reward/);
    
    // 检查页面主要内容
    await expect(page.getByText(/家庭奖励/)).toBeVisible();
    await expect(page.getByText(/选择登录方式/)).toBeVisible();
  });

  test('登录页应该显示家长登录表单', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 检查家长登录标签
    await expect(page.getByRole('tab', { name: /家长登录/ })).toBeVisible();
    
    // 检查手机号输入框
    await expect(page.getByLabel(/手机号/)).toBeVisible();
    
    // 检查密码输入框
    await expect(page.getByLabel(/密码/)).toBeVisible();
    
    // 检查登录按钮
    await expect(page.getByRole('button', { name: /登录/ }).first()).toBeVisible();
  });

  test('登录页应该显示儿童登录选项', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 点击儿童登录标签
    await page.getByRole('tab', { name: /儿童登录/ }).click();
    
    // 检查儿童用户选择
    await expect(page.getByLabel(/选择用户/)).toBeVisible();
    
    // 检查 PIN 码输入
    await expect(page.getByLabel(/PIN码/)).toBeVisible();
  });

  test('家长登录失败应该显示错误', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 填写错误的手机号
    await page.getByLabel(/手机号/).fill('123');
    await page.getByLabel(/密码/).fill('1111');
    
    // 点击登录
    await page.getByRole('button', { name: /登录/ }).first().click();
    
    // 等待错误消息
    await expect(page.getByText(/请输入有效的手机号/)).toBeVisible();
  });

  test('页面应该有正确的元数据', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 检查 meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('家庭行为管理');
    
    // 检查 viewport
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });
});

test.describe('移动端适配', () => {
  test('登录页在移动端应该正确显示', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/auth/login');
    
    // 检查主要内容在移动端可见
    await expect(page.getByText(/家庭奖励/)).toBeVisible();
    await expect(page.getByText(/选择登录方式/)).toBeVisible();
  });
});

test.describe('API 端点', () => {
  test('API 应该返回 JSON 格式', async ({ request }) => {
    const response = await request.post('/api/auth/parent-login', {
      data: {
        phone: '13800000100',
        password: '1111',
      },
    });
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user).toBeDefined();
  });

  test('API 应该处理错误请求', async ({ request }) => {
    const response = await request.post('/api/auth/parent-login', {
      data: {
        phone: 'invalid',
        password: '1111',
      },
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  test('未认证访问受保护页面应该被阻止', async ({ page }) => {
    await page.goto('/parent');
    
    // 应该被重定向或显示错误
    expect(page.url()).not.toContain('/parent');
  });
});
