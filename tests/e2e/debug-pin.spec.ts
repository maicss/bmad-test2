import { test, expect } from '@playwright/test';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || \`http://localhost:${process.env.PORT}\`;



test.describe('Debug PIN Login Page', () => {

  test('检查页面是否加载', async ({ page }) => {

    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/pin');

    await page.waitForLoadState('networkidle');



    // 获取页面标题

    const title = await page.title();

    console.log('页面标题:', title);



    // 截图

    await page.screenshot({ path: 'tmp/pin-page-debug.png', fullPage: true });



    expect(title).toBeTruthy();

  });



  test('检查页面元素', async ({ page }) => {

    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/pin');

    await page.waitForLoadState('networkidle');



    // 检查h1

    const h1Text = await page.locator('h1').textContent();

    console.log('H1 文本:', h1Text);



    // 检查输入框

    const inputCount = await page.locator('input[type="tel"]').count();

    console.log('输入框数量:', inputCount);



    // 检查按钮

    const buttonText = await page.locator('button[type="submit"]').textContent();

    console.log('按钮文本:', buttonText);



    // 截图

    await page.screenshot({ path: 'tmp/pin-page-elements.png', fullPage: true });



    expect(inputCount).toBeGreaterThan(0);

  });



  test('测试错误PIN登录', async ({ page }) => {

    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/pin');

    await page.waitForLoadState('networkidle');



    // 输入错误PIN

    await page.fill('input[type="tel"]', '9999');

    await page.click('button[type="submit"]');



    // 等待响应

    await page.waitForTimeout(2000);



    // 截图

    await page.screenshot({ path: 'tmp/pin-page-error.png', fullPage: true });

  });

});

