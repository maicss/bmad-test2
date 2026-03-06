import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3344';

test('debug OTP registration - manual API call', async ({ page }) => {
  // Listen for responses
  const apiResponses: any[] = [];
  page.on('response', async (response) => {
    if (response.url().includes('/api/auth/')) {
      console.log('API:', response.url(), 'Status:', response.status());
      try {
        const body = await response.json();
        console.log('Body:', JSON.stringify(body));
        apiResponses.push({ url: response.url(), status: response.status(), body });
      } catch {}
    }
  });

  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState('domcontentloaded');

  // Fill form
  await page.fill('input#phone', '13812345678');
  await page.click('button:has-text("发送验证码")');
  await page.waitForTimeout(2000);
  await page.fill('input#otp', '111111');

  // Directly call the API via JavaScript
  await page.evaluate(async () => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'otp',
        phone: '13812345678',
        otp: '111111'
      })
    });
    const data = await response.json();
    console.log('Direct API call result:', data);
    if (data.success) {
      window.location.href = '/parent/dashboard';
    }
  });

  await page.waitForTimeout(3000);
  console.log('Final URL:', page.url());
  console.log('API responses count:', apiResponses.length);
});
