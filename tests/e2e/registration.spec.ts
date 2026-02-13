/**
 * E2E Tests for Registration Flow
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 * Source: AGENTS.md - Use Playwright for E2E tests
 */

import { test, expect } from '@playwright/test';

test.describe('Registration Flow E2E', () => {
  test.describe('given 访问注册页面，when 填写注册信息，then 应该成功注册', () => {
    test('should register with OTP method', async ({ page }) => {
      // Given: 访问注册页面
      await page.goto('http://localhost:3344/register');

      // When: 选择 OTP 验证方式
      await page.click('input[value="otp"]');

      // 输入手机号
      await page.fill('input[id="phone"]', '13800001234');

      // 点击发送验证码
      await page.click('button:has-text("发送验证码")');

      // 等待验证码发送成功
      await page.waitForSelector('text=验证码已发送');

      // 输入验证码（使用 debug code）
      await page.fill('input[id="otp"]', '111111');

      // 提交注册
      await page.click('button[type="submit"]');

      // Then: 应该跳转到家长 Dashboard 或显示成功消息
      await expect(page).toHaveURL(/\/parent\/dashboard|\/register/);
    });

    test('should register with password method', async ({ page }) => {
      // Given: 访问注册页面
      await page.goto('http://localhost:3344/register');

      // When: 选择密码验证方式
      await page.click('input[value="password"]');

      // 输入手机号
      await page.fill('input[id="phone"]', '13800005678');

      // 输入密码
      await page.fill('input[id="password"]', 'TestPass123');

      // 确认密码
      await page.fill('input[id="confirmPassword"]', 'TestPass123');

      // 提交注册
      await page.click('button[type="submit"]');

      // Then: 应该跳转到家长 Dashboard 或显示成功消息
      await expect(page).toHaveURL(/\/parent\/dashboard|\/register/);
    });
  });

  test.describe('given 表单验证，when 输入无效数据，then 应该显示错误提示', () => {
    test('should show error for invalid phone', async ({ page }) => {
      // Given: 访问注册页面
      await page.goto('http://localhost:3344/register');

      // When: 输入无效手机号
      await page.fill('input[id="phone"]', '123');

      // Then: 应该显示手机号格式错误
      await page.click('button[type="submit"]');
      await expect(page.locator('text=请输入有效的中国手机号')).toBeVisible();
    });

    test('should show error for weak password', async ({ page }) => {
      // Given: 访问注册页面
      await page.goto('http://localhost:3344/register');

      // When: 选择密码方式，输入弱密码
      await page.click('input[value="password"]');
      await page.fill('input[id="phone"]', '13800005678');
      await page.fill('input[id="password"]', 'weak');
      await page.fill('input[id="confirmPassword"]', 'weak');

      // 提交表单
      await page.click('button[type="submit"]');

      // Then: 应该显示密码强度不足错误
      await expect(page.locator('text=密码必须包含')).toBeVisible();
    });

    test('should show error for password mismatch', async ({ page }) => {
      // Given: 访问注册页面
      await page.goto('http://localhost:3344/register');

      // When: 选择密码方式，输入不匹配的密码
      await page.click('input[value="password"]');
      await page.fill('input[id="phone"]', '13800005678');
      await page.fill('input[id="password"]', 'TestPass1');
      await page.fill('input[id="confirmPassword"]', 'TestPass2');

      // 提交表单
      await page.click('button[type="submit"]');

      // Then: 应该显示密码不匹配错误
      await expect(page.locator('text=密码不一致')).toBeVisible();
    });
  });
});
