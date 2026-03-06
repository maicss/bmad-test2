import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3344';

test.describe('Page Load Test', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Check if the form elements exist
    const phoneInput = page.locator('input[id="phone"]');
    await expect(phoneInput).toBeVisible();

    const passwordRadio = page.locator('input[value="password"]');
    await expect(passwordRadio).toBeVisible();
  });
});
