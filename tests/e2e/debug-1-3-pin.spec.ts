import { test, expect } from '@playwright/test';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3344';

test.describe('Debug PIN Login Page', () => {
  test('检查页面是否加载', async ({ page }) => {
    await page.goto(`${BASE_URL}/pin`);
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    console.log('页面标题:', title);
    await page.screenshot({ path: 'tmp/pin-page-debug.png', fullPage: true });
    expect(title).toBeTruthy();
  });

  test('检查页面元素', async ({ page }) => {
    await page.goto(`${BASE_URL}/pin`);
    await page.waitForLoadState('domcontentloaded');

    const h1Text = await page.locator('h1').textContent();
    console.log('H1 文本:', h1Text);

    const inputCount = await page.locator('input[type="tel"]').count();
    console.log('输入框数量:', inputCount);

    const buttonText = await page.locator('button[type="submit"]').textContent();
    console.log('按钮文本:', buttonText);

    await page.screenshot({ path: 'tmp/pin-page-elements.png', fullPage: true });
    expect(inputCount).toBeGreaterThan(0);
  });

  test('测试错误PIN登录', async ({ page }) => {
    await page.goto(`${BASE_URL}/pin`);
    await page.waitForLoadState('domcontentloaded');

    await page.fill('input[type="tel"]', '9999');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tmp/pin-page-error.png', fullPage: true });
  });
});
