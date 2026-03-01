import { test, expect } from '@playwright/test';

test.describe('Multi-device Login - Simple', () => {
  const testPhone = '13800004101';
  const testPassword = 'Test1234';

  test('password login works', async ({ page }) => {
    // Given: 访问登录页面
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // When: 选择密码方式并输入凭据
    await page.click('input[value="password"]');
    await page.fill('input[id="phone"]', testPhone);
    await page.fill('input[id="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Then: 登录成功并重定向到 dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    const currentUrl = page.url();
    expect(currentUrl).toContain('/dashboard');
    
    // Check if redirected to child-dashboard
    await page.waitForTimeout(2000); // Wait for redirect
    const finalUrl = page.url();
    expect(finalUrl).toContain('/child-dashboard');
  });

  test('remember me functionality', async ({ context }) => {
    // Given: 清除 cookies
    await context.clearCookies();
    const page = await context.newPage();
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('input[value="password"]');
    await page.fill('input[id="phone"]', testPhone);
    await page.fill('input[id="password"]', testPassword);
    
    // When: 选择记住我并登录
    const rememberMeCheckbox = page.locator('input[type="checkbox"]');
    await rememberMeCheckbox.check();
    await expect(rememberMeCheckbox).toBeChecked();
    
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Then: 重新访问应该保持登录状态
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if still logged in (should redirect to dashboard)
    // Wait for potential redirect
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    
    console.log('Final URL after revisit:', finalUrl);
    
    // Should be either on dashboard or child-dashboard
    const isValidRedirect = finalUrl.includes('/dashboard') || finalUrl.includes('/child-dashboard');
    expect(isValidRedirect).toBe(true);
  });
});
