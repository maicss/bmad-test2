import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3344';

test.describe('Multi-device Login - Simple', () => {
  // Use seeded test user (13800000100, password: 1111)
  const testPhone = '13800000100';
  const testPassword = '1111';

  test('password login works', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // When: 选择密码方式并输入凭据
    await page.click('input[value="password"]');
    await page.fill('input[id="phone"]', testPhone);
    await page.fill('input[id="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Then: 登录成功并重定向到 dashboard
    await page.waitForURL(/\/(dashboard|parent\/dashboard)/, { timeout: 10000 });
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|parent\/dashboard)/);
  });

  test('remember me functionality', async ({ context }) => {
    // Given: 清除 cookies
    await context.clearCookies();
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.click('input[value="password"]');
    await page.fill('input[id="phone"]', testPhone);
    await page.fill('input[id="password"]', testPassword);

    // When: 选择记住我并登录
    const rememberMeCheckbox = page.locator('input[type="checkbox"]');
    await rememberMeCheckbox.check();
    await expect(rememberMeCheckbox).toBeChecked();

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|parent\/dashboard)/, { timeout: 10000 });

    // Then: 重新访问应该保持登录状态
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    // Check if still logged in (should redirect to dashboard)
    // Wait for potential redirect
    await page.waitForTimeout(2000);
    const finalUrl = page.url();

    console.log('Final URL after revisit:', finalUrl);

    // Should be on dashboard or parent/dashboard
    const isValidRedirect = finalUrl.includes('/dashboard');
    expect(isValidRedirect).toBe(true);
  });
});
