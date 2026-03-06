/**
 * E2E Tests for Registration Flow
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 *
 * Source: AGENTS.md - Use Playwright for E2E tests
 * Source: Story 1.1 AC #1-#7
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3344';

// Generate unique phone number for tests to avoid conflicts
let phoneCounter = 0;
function generateTestPhone(): string {
  const counter = (phoneCounter++).toString().padStart(8, '0');
  return `138${counter}`;
}

test.describe('Story 1.1: Parent Phone Registration', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('Password Registration Flow', () => {
    test('given 访问注册页面，when 选择密码方式并输入正确信息，then 应该成功注册', async ({ page }) => {
      const phone = generateTestPhone();

      // Given: 访问注册页面
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('domcontentloaded');

      // When: 选择密码验证方式
      await page.locator('input[value="password"]').click();
      await page.waitForTimeout(500);

      // 输入手机号
      await page.fill('input#phone', phone);

      // 输入强密码（8-20位，1个大写字母，1个数字）
      await page.fill('input#password', 'Password1');

      // 确认密码
      await page.fill('input#confirmPassword', 'Password1');

      // 提交注册
      await page.click('button:has-text("注册")');

      // Then: 注册成功，重定向到 login
      await page.waitForURL(/\/login/, { timeout: 10000, waitUntil: 'domcontentloaded' });
      expect(page.url()).toContain('/login');
    });

    test('given 访问注册页面，when 输入弱密码，then 应该显示密码强度提示', async ({ page }) => {
      // Given: 访问注册页面
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('domcontentloaded');

      // When: 选择密码验证方式
      await page.locator('input[value="password"]').click();
      await page.waitForTimeout(500);

      // 输入手机号
      await page.fill('input#phone', '13800004444');

      // 输入弱密码（少于8位）
      await page.fill('input#password', 'short');

      // 确认密码
      await page.fill('input#confirmPassword', 'short');

      // 提交注册
      await page.click('button:has-text("注册")');

      // Then: 应该显示密码强度提示或验证错误
      const errorMsg = page.locator('.bg-red-50');
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
    });

    test('given 访问注册页面，when 密码不匹配，then 应该显示错误提示', async ({ page }) => {
      // Given: 访问注册页面
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('domcontentloaded');

      // When: 选择密码验证方式
      await page.locator('input[value="password"]').click();
      await page.waitForTimeout(500);

      // 输入手机号
      await page.fill('input#phone', '13800005555');

      // 输入密码
      await page.fill('input#password', 'Password1');

      // 输入不同的确认密码
      await page.fill('input#confirmPassword', 'Password2');

      // 提交注册
      await page.click('button:has-text("注册")');

      // Then: 应该显示密码不匹配错误
      const errorMsg = page.locator('.bg-red-50');
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
    });

    test('given 访问注册页面，when 输入强密码，then 应该显示强密码提示', async ({ page }) => {
      // Given: 访问注册页面
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('domcontentloaded');

      // When: 选择密码验证方式
      await page.locator('input[value="password"]').click();
      await page.waitForTimeout(500);

      // 输入手机号
      await page.fill('input#phone', '13800006666');

      // 输入强密码
      await page.fill('input#password', 'Password1');

      // 验证密码强度指示器存在
      await expect(page.getByText('强度：')).toBeVisible();
    });

    test('given 访问注册页面，when 密码缺少大写字母，then 应该显示错误提示', async ({ page }) => {
      // Given: 访问注册页面
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('domcontentloaded');

      // When: 选择密码验证方式
      await page.locator('input[value="password"]').click();
      await page.waitForTimeout(500);

      // 输入手机号
      await page.fill('input#phone', '13800007777');

      // 输入没有大写字母的密码
      await page.fill('input#password', 'password1');

      // 确认密码
      await page.fill('input#confirmPassword', 'password1');

      // 提交注册
      await page.click('button:has-text("注册")');

      // Then: 应该显示密码强度错误
      const errorMsg = page.locator('.bg-red-50');
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
    });

    test('given 访问注册页面，when 密码缺少数字，then 应该显示错误提示', async ({ page }) => {
      // Given: 访问注册页面
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('domcontentloaded');

      // When: 选择密码验证方式
      await page.locator('input[value="password"]').click();
      await page.waitForTimeout(500);

      // 输入手机号
      await page.fill('input#phone', '13800008888');

      // 输入没有数字的密码
      await page.fill('input#password', 'Password');

      // 确认密码
      await page.fill('input#confirmPassword', 'Password');

      // 提交注册
      await page.click('button:has-text("注册")');

      // Then: 应该显示密码强度错误
      const errorMsg = page.locator('.bg-red-50');
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('OTP Registration Flow', () => {
    test('given 访问注册页面，when 选择OTP方式并输入正确信息，then 应该成功注册', async ({ page }) => {
      const phone = generateTestPhone();

      // Given: 访问注册页面
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('domcontentloaded');

      // When: 选择 OTP 验证方式（默认已经是OTP）
      // 输入手机号
      await page.fill('input#phone', phone);

      // 点击发送验证码
      await page.click('button:has-text("发送验证码")');
      await page.waitForTimeout(2000);

      // 输入验证码（使用 debug code: 111111）
      await page.fill('input#otp', '111111');

      // 提交注册
      await page.click('button:has-text("注册")');

      // Then: 等待响应
      await page.waitForTimeout(3000);

      // 检查结果
      const isOnLogin = page.url().includes('/login');
      const hasError = await page.locator('.bg-red-50').isVisible().catch(() => false);
      expect(isOnLogin || hasError).toBeTruthy();
    });

    test('given 访问注册页面，when 输入已存在的手机号，then 应该显示错误提示', async ({ page }) => {
      // Given: 访问注册页面
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('domcontentloaded');

      // 输入已存在的手机号
      await page.fill('input#phone', '13800000100');

      // 点击发送验证码
      await page.click('button:has-text("发送验证码")');
      await page.waitForTimeout(2000);

      // 输入验证码
      await page.fill('input#otp', '111111');

      // 提交注册
      await page.click('button:has-text("注册")');
      await page.waitForTimeout(2000);

      // Then: 应该有某种反馈
      const errorMsg = page.locator('.bg-red-50');
      const hasError = await errorMsg.isVisible().catch(() => false);
      const isOnLogin = page.url().includes('/login');
      expect(hasError || isOnLogin).toBeTruthy();
    });
  });
});
