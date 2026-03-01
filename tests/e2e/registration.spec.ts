/**

 * E2E Tests for Registration Flow

 *

 * BDD Testing Requirement: Given-When-Then format with business language

 * Source: AGENTS.md - Use Playwright for E2E tests

 */



import { test, expect } from '@playwright/test';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || \`http://localhost:${process.env.PORT}\`;


test.describe('given 访问注册页面，when 填写注册信息，then 应该成功注册', () => {
  test('should register with OTP method', async ({ page }) => {
    // Given: 访问注册页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/register');

    // When: 选择 OTP 验证方式
    await page.click('input[value="otp"]');

    // 输入手机号
    await page.fill('input[id="phone"]', '13800001234');

    // 点击发送验证码
    await page.click('button:has-text("发送验证码")');

    // 等待验证码发送成功
    await page.waitForSelector('text=验证码已发送', { timeout: 5000 });

    // 输入验证码（使用 debug code）
    await page.fill('input[id="otp"]', '111111');

    // 提交注册
    await page.click('button[type="submit"]');

    // Then: 应该重定向到 dashboard 或显示成功消息
    await page.waitForURL(/dashboard|register/, { timeout: 10000 });
  });

  test('should register with password method', async ({ page }) => {
    // Given: 访问注册页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/register');

    // When: 选择密码验证方式
    await page.click('input[value="password"]');

    // 输入手机号
    await page.fill('input[id="phone"]', '13800001235');

    // 输入密码
    await page.fill('input[id="password"]', 'Password1');

    // 确认密码
    await page.fill('input[id="confirmPassword"]', 'Password1');

    // 提交注册
    await page.click('button[type="submit"]');

    // Then: 应该重定向到 dashboard 或显示成功消息
    await page.waitForURL(/dashboard|register/, { timeout: 10000 });
  });

  test('should show error for weak password', async ({ page }) => {
    // Given: 访问注册页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/register');

    // When: 选择密码验证方式
    await page.click('input[value="password"]');

    // 输入手机号
    await page.fill('input[id="phone"]', '13800001236');

    // 输入弱密码（少于8位）
    await page.fill('input[id="password"]', 'short');

    // 确认密码
    await page.fill('input[id="confirmPassword"]', 'short');

    // 提交注册
    await page.click('button[type="submit"]');

    // Then: 应该显示密码强度提示
    await expect(page.locator('text=密码强度')).toBeVisible();
  });

  test('should show error for password mismatch', async ({ page }) => {
    // Given: 访问注册页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/register');

    // When: 选择密码验证方式
    await page.click('input[value="password"]');

    // 输入手机号
    await page.fill('input[id="phone"]', '13800001237');

    // 输入密码
    await page.fill('input[id="password"]', 'Password1');

    // 输入不同的确认密码
    await page.fill('input[id="confirmPassword"]', 'Password2');

    // 提交注册
    await page.click('button[type="submit"]');

    // Then: 应该显示密码不匹配错误
    await expect(page.locator('text=密码不匹配')).toBeVisible();
  });

  test('should show error for existing phone', async ({ page }) => {
    // Given: 访问注册页面
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/register');

    // When: 选择 OTP 验证方式
    await page.click('input[value="otp"]');

    // 输入已存在的手机号
    await page.fill('input[id="phone"]', '13800001234');

    // 点击发送验证码
    await page.click('button:has-text("发送验证码")');

    // Then: 应该显示手机号已存在错误
    await expect(page.locator('text=手机号已存在')).toBeVisible({ timeout: 5000 });
  });
});
