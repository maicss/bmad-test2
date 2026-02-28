/**
 * E2E Tests for Login Flow
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 * Source: Story 1.2 AC #1-#5 - Parent Phone Login
 * Source: AGENTS.md - Use Playwright for E2E tests
 */

import { test, expect } from '@playwright/test';

test.describe('Story 1.2: Parent Phone Login - E2E Happy Path', () => {
  test('given 已注册家长选择OTP方式，when 输入正确手机号和验证码，then 成功登录并重定向到Dashboard', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/login');
    await page.waitForLoadState('networkidle');

    // When: 选择 OTP 认证方式
    await page.click('input[value="otp"]');

    // 输入已注册的手机号（需要先在数据库中创建测试用户）
    const testPhone = '13800004001';
    await page.fill('input[id="phone"]', testPhone);

    // 点击发送验证码
    await page.click('button:has-text("发送验证码")');

    // 等待验证码发送成功（等待按钮文字变化）
    await page.waitForTimeout(1000);
    const buttonText = await page.locator('button:has-text("秒后重发")').textContent();
    expect(buttonText).toMatch(/\d+秒后重发/);

    // 输入验证码（使用 debug code: 111111）
    await page.fill('input[id="otp"]', '111111');

    // 点击登录按钮
    await page.click('button:has-text("登录")');

    // Then: 应该重定向到 dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');

    // 注意：dashboard 页面还未实现，只验证 URL 重定向
  });

  test('given 已注册家长选择密码方式，when 输入正确手机号和密码，then 成功登录并重定向到Dashboard', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/login');
    await page.waitForLoadState('networkidle');

    // When: 选择密码认证方式
    await page.click('input[value="password"]');

    // 输入已注册的手机号
    const testPhone = '13800004002';
    const testPassword = 'Test1234';
    await page.fill('input[id="phone"]', testPhone);

    // 输入密码
    await page.fill('input[id="password"]', testPassword);

    // 点击登录按钮
    await page.click('button:has-text("登录")');

    // Then: 应该重定向到 dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');

    // 注意：dashboard 页面还未实现，只验证 URL 重定向
  });

  test('given 家长输入错误手机号，when 点击登录，then 显示格式错误提示', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/login');
    await page.waitForLoadState('networkidle');

    // When: 输入无效手机号（不足11位）
    await page.fill('input[id="phone"]', '123');

    // 点击登录按钮
    await page.click('button:has-text("登录")');

    // Then: 应该显示格式错误提示
    await expect(page.locator('text=请输入有效的11位手机号')).toBeVisible({ timeout: 3000 });
  });

  test('given 家长输入未注册手机号，when 点击登录，then 显示手机号未注册错误', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/login');
    await page.waitForLoadState('networkidle');

    // When: 选择密码认证方式
    await page.click('input[value="password"]');

    // 输入未注册的手机号
    await page.fill('input[id="phone"]', '19999999999');

    // 输入任意密码
    await page.fill('input[id="password"]', 'Test1234');

    // 点击登录按钮
    await page.click('button:has-text("登录")');

    // Then: 应该显示手机号未注册错误
    await expect(page.locator('text=手机号未注册')).toBeVisible({ timeout: 3000 });
  });

  test('given 家长输入错误验证码，when 点击登录，then 显示验证码错误提示', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/login');
    await page.waitForLoadState('networkidle');

    // When: 选择 OTP 认证方式
    await page.click('input[value="otp"]');

    // 输入已注册的手机号
    const testPhone = '13800004001';
    await page.fill('input[id="phone"]', testPhone);

    // 点击发送验证码
    await page.click('button:has-text("发送验证码")');

    // 等待验证码发送成功（等待按钮文字变化）
    await page.waitForTimeout(1000);
    const buttonText = await page.locator('button:has-text("秒后重发")').textContent();
    expect(buttonText).toMatch(/\d+秒后重发/);

    // 输入错误的验证码
    await page.fill('input[id="otp"]', '000000');

    // 点击登录按钮
    await page.click('button:has-text("登录")');

    // Then: 应该显示验证码错误提示
    await expect(page.locator('text=验证码错误')).toBeVisible({ timeout: 3000 });
  });

  test('given 家长输入错误密码，when 点击登录，then 显示密码错误提示', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/login');
    await page.waitForLoadState('networkidle');

    // When: 选择密码认证方式
    await page.click('input[value="password"]');

    // 输入已注册的手机号
    const testPhone = '13800004002';
    await page.fill('input[id="phone"]', testPhone);

    // 输入错误的密码
    await page.fill('input[id="password"]', 'WrongPass1');

    // 点击登录按钮
    await page.click('button:has-text("登录")');

    // Then: 应该显示密码错误提示
    await expect(page.locator('text=密码错误')).toBeVisible({ timeout: 3000 });
  });

  test('given 连续5次登录失败，when 尝试第6次登录，then 显示账户锁定提示', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/login');
    await page.waitForLoadState('networkidle');

    // When: 连续5次使用错误密码登录
    await page.click('input[value="password"]');

    for (let i = 0; i < 5; i++) {
      await page.fill('input[id="phone"]', '13800004002');
      await page.fill('input[id="password"]', 'WrongPass1');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(500); // 等待错误消息显示
    }

    // 尝试第6次登录
    await page.fill('input[id="phone"]', '13800004002');
    await page.fill('input[id="password"]', 'Test1234'); // 即使是正确密码
    await page.click('button:has-text("登录")');

    // Then: 应该显示账户锁定提示
    await expect(page.locator('text=/登录失败次数过多/')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/分钟后再试/')).toBeVisible({ timeout: 3000 });
  });

  test('given 访问登录页面，when 检查页面元素，then 页面应该包含所有必需的UI组件', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/login');
    await page.waitForLoadState('networkidle');

    // When: 检查页面元素

    // Then: 应该包含所有必需的UI组件
    await expect(page.locator('h1:has-text("家长登录")')).toBeVisible();
    await expect(page.locator('input[id="phone"]')).toBeVisible();
    await expect(page.locator('input[value="otp"]')).toBeVisible();
    await expect(page.locator('input[value="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("登录")')).toBeVisible();
    await expect(page.locator('text=还没有账户？')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('given 点击注册链接，when 导航到注册页面，then 应该显示注册页面', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/login');
    await page.waitForLoadState('networkidle');

    // When: 点击注册链接
    await page.click('a[href="/register"]');

    // Then: 应该导航到注册页面
    await page.waitForURL('**/register', { timeout: 5000 });
    expect(page.url()).toContain('/register');
  });
});
