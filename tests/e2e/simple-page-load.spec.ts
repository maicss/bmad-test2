import { test, expect } from '@playwright/test';

test.describe('Page Load Test', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toContain('Family Reward');
    
    // Check if the form elements exist
    const phoneInput = page.locator('input[id="phone"]');
    await expect(phoneInput).toBeVisible();
    
    const passwordRadio = page.locator('input[value="password"]');
    await expect(passwordRadio).toBeVisible();
  });
});
