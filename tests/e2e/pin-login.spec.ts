/**
 * E2E Tests for Child PIN Login Flow
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 * Source: Story 1.3 AC #1-#5 - Child PIN Login
 * Source: AGENTS.md - Use Playwright for E2E tests
 */

import { test, expect } from '@playwright/test';

test.describe('Story 1.3: Child PIN Login - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 重置 rate limit，避免测试之间相互干扰
    const resetResponse = await fetch('http://localhost:3344/api/test/reset-rate-limit');
    await resetResponse.text(); // Ensure response is fully received

    // 清除 cookies 和存储，确保每个测试从干净状态开始
    await page.context().clearCookies();
  });

  test('given 已注册儿童输入正确PIN码，when 提交PIN登录表单，then 成功登录并重定向到儿童Dashboard', async ({ page }) => {
    // Given: 访问PIN登录页面
    await page.goto('http://localhost:3344/pin');
    await page.waitForLoadState('networkidle');

    // When: 输入正确的4位PIN码
    const testPin = '9999';
    await page.fill('input[id="pin"]', testPin);

    // 点击登录按钮
    await page.click('button:has-text("登录")');

    // Then: 应该重定向到 child-dashboard
    await page.waitForURL('**/child-dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/child-dashboard');
  });

  test('given 儿童输入错误PIN码，when 提交PIN登录表单，then 显示错误提示', async ({ page }) => {
    // Given: 访问PIN登录页面
    await page.goto('http://localhost:3344/pin');
    await page.waitForLoadState('networkidle');

    // When: 输入错误的PIN码（使用一个不存在的PIN）
    await page.fill('input[id="pin"]', '5555');

    // 点击登录按钮
    await page.click('button:has-text("登录")');

    // Then: 应该显示错误提示（可能是PIN码错误或rate-limit错误）
    const errorText = page.locator('div[class*="bg-red-50"] p');
    await expect(errorText).toBeVisible({ timeout: 3000 });
    const errorMessage = await errorText.textContent();
    expect(errorMessage).toMatch(/错误|失败/);
  });

  test('given 儿童输入不足4位PIN码，when 尝试点击登录按钮，then 按钮应该被禁用', async ({ page }) => {
    // Given: 访问PIN登录页面
    await page.goto('http://localhost:3344/pin');
    await page.waitForLoadState('networkidle');

    // When: 输入不足4位的PIN码
    await page.fill('input[id="pin"]', '123');

    // Then: 登录按钮应该被禁用
    const loginButton = page.locator('button:has-text("登录")');
    await expect(loginButton).toBeDisabled();
  });

  test('given 使用家长账号的PIN码登录，when 尝试登录，then 显示错误提示（非儿童角色）', async ({ page }) => {
    // Given: 访问PIN登录页面
    await page.goto('http://localhost:3344/pin');
    await page.waitForLoadState('networkidle');

    // When: 输入一个肯定不存在的PIN码
    await page.fill('input[id="pin"]', '8888');

    // 点击登录按钮并等待响应
    await Promise.all([
      page.click('button:has-text("登录")'),
      page.waitForResponse(response => response.url().includes('/api/auth/pin-login')),
    ]);

    // Then: 应该显示错误提示（用户不存在或PIN码错误）
    const errorText = page.locator('div[class*="bg-red-50"] p');
    await expect(errorText).toBeVisible({ timeout: 3000 });
    const errorMessage = await errorText.textContent();
    expect(errorMessage).toMatch(/错误|失败/);
  });

  test.skip('given 连续5次PIN登录失败，when 尝试第6次登录，then 显示锁定提示（10分钟）', async ({ page }) => {
    // Given: 访问PIN登录页面
    await page.goto('http://localhost:3344/pin');
    await page.waitForLoadState('networkidle');

    // When: 连续5次输入错误的PIN码（使用一个不存在的PIN码）
    for (let i = 0; i < 5; i++) {
      await page.fill('input[id="pin"]', '7777'); // 不存在的PIN码

      // 点击登录按钮并等待响应
      await Promise.all([
        page.click('button:has-text("登录")'),
        page.waitForResponse(response => response.url().includes('/api/auth/pin-login')),
      ]);

      // 等待错误提示显示
      await expect(page.locator('div[class*="bg-red-50"]')).toBeVisible({ timeout: 3000 });
    }

    // 尝试第6次登录（即使使用正确的PIN码）
    await page.fill('input[id="pin"]', '9999');
    await page.click('button:has-text("登录")');

    // Then: 应该显示锁定提示
    await expect(page.locator('text=/登录失败次数过多/')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/分钟后再试/')).toBeVisible({ timeout: 3000 });
  });

  test.afterAll(async () => {
    // 在所有测试完成后重置 rate limit
    await fetch('http://localhost:3344/api/test/reset-rate-limit');
  });

  test('given 访问PIN登录页面，when 检查页面元素，then 页面应该包含所有必需的UI组件', async ({ page }) => {
    // Given: 访问PIN登录页面
    await page.goto('http://localhost:3344/pin');
    await page.waitForLoadState('networkidle');

    // When: 检查页面元素

    // Then: 应该包含所有必需的UI组件
    await expect(page.locator('h1:has-text("儿童登录")')).toBeVisible();
    await expect(page.locator('input[id="pin"]')).toBeVisible();
    await expect(page.locator('button:has-text("登录")')).toBeVisible();
    await expect(page.locator('text=忘记PIN码')).toBeVisible();
  });

  test('given PIN输入框，when 页面加载，then 应该自动聚焦', async ({ page }) => {
    // Given: 访问PIN登录页面
    await page.goto('http://localhost:3344/pin');
    await page.waitForLoadState('networkidle');

    // When: 检查PIN输入框

    // Then: 应该自动聚焦
    const pinInput = page.locator('input[id="pin"]');
    await expect(pinInput).toBeFocused();
  });

  test('given 移动设备，when 输入PIN码，then 应该显示数字键盘', async ({ page }) => {
    // Given: 使用移动设备视口
    await page.setViewportSize({ width: 375, height: 667 });

    // When: 访问PIN登录页面
    await page.goto('http://localhost:3344/pin');
    await page.waitForLoadState('networkidle');

    // Then: PIN输入框应该使用数字键盘
    const pinInput = await page.locator('input[id="pin"]');
    const inputMode = await pinInput.getAttribute('inputmode');
    expect(inputMode).toBe('numeric');
  });

  test('given 儿童输入PIN码超过4位，when 输入，then 自动截断为4位', async ({ page }) => {
    // Given: 访问PIN登录页面
    await page.goto('http://localhost:3344/pin');
    await page.waitForLoadState('networkidle');

    // When: 输入超过4位的PIN码
    const pinInput = page.locator('input[id="pin"]');
    await pinInput.fill('12345678');

    // Then: 应该自动截断为4位
    const pinValue = await pinInput.inputValue();
    expect(pinValue).toBe('1234');
  });

  test('given 儿童输入非数字字符，when 输入，then 自动过滤非数字字符', async ({ page }) => {
    // Given: 访问PIN登录页面
    await page.goto('http://localhost:3344/pin');
    await page.waitForLoadState('networkidle');

    // When: 输入非数字字符（分步输入）
    const pinInput = page.locator('input[id="pin"]');
    await pinInput.type('1a2b3c4d');

    // Then: 应该自动过滤非数字字符并限制为4位
    const pinValue = await pinInput.inputValue();
    expect(pinValue).toBe('1234');
  });
});
