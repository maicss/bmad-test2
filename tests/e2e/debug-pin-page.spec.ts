import { test, expect } from '@playwright/test';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || \`http://localhost:${process.env.PORT}\`;



test.describe('Debug PIN Login Page', () => {

  test('检查页面是否加载', async ({ page }) => {

    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/pin');

    await page.waitForLoadState('networkidle');



    const title = await page.title();

    console.log('页面标题:', title);



    // 截图

    await page.screenshot({ path: 'tmp/pin-page-debug.png' });

  });



  test('检查页面元素', async ({ page }) => {

    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/pin');

    await page.waitForLoadState('networkidle');



    // 检查h1

    const h1 = await page.locator('h1:has-text("儿童登录")').count();

    console.log('H1 数量:', h1);



    // 检查PIN输入框

    const pinInput = await page.locator('input[id="pin"]').count();

    console.log('PIN输入框数量:', pinInput);



    // 检查登录按钮

    const loginButton = await page.locator('button:has-text("登录")').count();

    console.log('登录按钮数量:', loginButton);



    // 获取所有输入框

    const allInputs = await page.locator('input').all();

    console.log('所有输入框:', allInputs.length);



    // 截图

    await page.screenshot({ path: 'tmp/pin-page-elements.png' });

  });

});

