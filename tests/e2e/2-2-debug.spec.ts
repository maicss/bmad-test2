import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;
const testPhone = '13800000100';

test('Debug: Check points buttons', async ({ page }) => {
  // Login using OTP
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[id="phone"]', testPhone);
  await page.fill('input[id="otp"]', '111111');

  await Promise.all([
    page.waitForResponse(response => response.url().includes('/api/auth/login')),
    page.click('button[type="submit"]'),
  ]);

  await page.waitForNavigation({ url: '**/child-dashboard', timeout: 10000, waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('domcontentloaded');

  // Navigate to create page
  await page.goto(`${BASE_URL}/tasks/create`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('domcontentloaded');

  // Get all buttons
  const buttons = await page.locator('button').all();
  console.log('Total buttons:', buttons.length);

  // Find buttons with "中等"
  const mediumButtons = page.locator('button').filter({ hasText: '中等' });
  const mediumCount = await mediumButtons.count();
  console.log('Buttons with "中等":', mediumCount);

  // Get text of each button
  for (let i = 0; i < mediumCount; i++) {
    const text = await mediumButtons.nth(i).textContent();
    console.log(`Button ${i} text:`, text);
  }

  // Find the button with range
  const mediumButton = page.locator('button').filter({ hasText: '中等' }).filter({ hasText: '15-30' });
  const hasRangeButton = await mediumButton.count();
  console.log('Buttons with "中等" AND "15-30":', hasRangeButton);

  if (hasRangeButton > 0) {
    const buttonText = await mediumButton.textContent();
    console.log('Found button text:', buttonText);

    // Check if button is disabled
    const isDisabled = await mediumButton.isDisabled();
    console.log('Button disabled:', isDisabled);

    // Get initial points value
    const pointsInput = page.locator('input[id="points"]');
    const initialValue = await pointsInput.inputValue();
    console.log('Initial points value:', initialValue);

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // Click the button
    await mediumButton.click();
    await page.waitForTimeout(200);

    // Get new points value
    const newValue = await pointsInput.inputValue();
    console.log('Points after clicking medium:', newValue);

    // Try to directly set the points value
    await pointsInput.fill('22');
    await page.waitForTimeout(100);
    const directSetValue = await pointsInput.inputValue();
    console.log('Points after direct fill:', directSetValue);
  }
});
