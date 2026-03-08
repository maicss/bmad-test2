/**
 * E2E Test Authentication Helper
 *
 * Provides helper functions for handling authentication in E2E tests.
 *
 * Key features:
 * - Direct API login (bypasses UI for reliability)
 * - Session cookie management
 * - User login helpers for different roles
 */

import { APIRequestContext, Page } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3344';

export interface TestUser {
  phone: string;
  password?: string;
  pin?: string;
  role: string;
  familyId: string;
  name: string;
}

/**
 * Test users from seed-test-users.ts
 */
export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    phone: '13800000001',
    password: '1111',
    role: 'admin',
    familyId: 'family-001',
    name: 'Admin User',
  },
  parentZhang1: {
    phone: '13800000100',
    password: '1111',
    role: 'parent',
    familyId: 'family-001',
    name: 'Zhang 1 (Primary)',
  },
  parentZhang2: {
    phone: '12800000200',
    password: '1111',
    role: 'parent',
    familyId: 'family-001',
    name: 'Zhang 2 (Secondary)',
  },
  childZhang3: {
    phone: '13800000100', // Child uses parent phone for family
    pin: '1111',
    role: 'child',
    familyId: 'family-001',
    name: 'Zhang 3 (Child)',
  },
  parentLi1: {
    phone: '13800000300',
    password: '1111',
    role: 'parent',
    familyId: 'family-002',
    name: 'Li 1 (Primary)',
  },
  parentLi2: {
    phone: '13800000400',
    password: '1111',
    role: 'parent',
    familyId: 'family-002',
    name: 'Li 2 (Secondary)',
  },
};

/**
 * Login via API and set session cookie
 *
 * This is the most reliable way to handle authentication in E2E tests.
 * It bypasses the UI and directly calls the login API, then sets the
 * session cookie on the browser context.
 *
 * @param request - Playwright APIRequestContext
 * @param page - Playwright Page
 * @param user - Test user credentials
 * @returns Promise<boolean> - true if login successful
 */
export async function loginAs(
  request: APIRequestContext,
  page: Page,
  user: keyof typeof TEST_USERS | TestUser
): Promise<boolean> {
  const userData = typeof user === 'string' ? TEST_USERS[user] : user;

  if (!userData.password) {
    console.error(`User ${userData.name} does not have a password set`);
    return false;
  }

  try {
    console.log(`Attempting login for ${userData.name} (${userData.phone})`);

    // Make login API request - use the baseURL from page or default
    const loginUrl = `/api/auth/login`;

    const response = await request.post(loginUrl, {
      data: {
        phone: userData.phone,
        authMethod: 'password',
        password: userData.password,
        rememberMe: false,
      },
    });

    const responseText = await response.text();
    console.log(`Login response status: ${response.status}`);

    if (!response.ok()) {
      console.error('Login failed:', responseText);
      return false;
    }

    const data = JSON.parse(responseText);

    if (!data.success) {
      console.error('Login unsuccessful:', data);
      return false;
    }

    // Set the session cookie directly on the browser context
    const sessionToken = data.session.token;
    const url = new URL(BASE_URL);
    const domain = url.hostname;

    await page.context().addCookies([
      {
        name: 'better-auth.session_token',
        value: sessionToken,
        domain: domain,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    console.log(`✅ Logged in as ${userData.name} (${userData.role})`);
    return true;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

/**
 * Login as parent via UI
 *
 * Use this for testing the login flow itself.
 * For most tests, use loginAs() instead.
 *
 * @param page - Playwright Page
 * @param user - Test user key or TestUser object
 */
export async function loginViaUI(
  page: Page,
  user: keyof typeof TEST_USERS | TestUser = 'parentZhang1'
): Promise<void> {
  const userData = typeof user === 'string' ? TEST_USERS[user] : user;

  if (!userData.password) {
    throw new Error(`User ${userData.name} does not have a password set`);
  }

  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');

  // Switch to password login mode
  await page.locator('input[value="password"]').first().click();

  // Fill credentials
  await page.fill('input[id="phone"]', userData.phone);
  await page.fill('input[id="password"]', userData.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation or dashboard
  await page.waitForURL(/\/(dashboard|tasks)/, { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Logout current user
 *
 * @param request - Playwright APIRequestContext
 */
export async function logout(request: APIRequestContext): Promise<void> {
  await request.post(`${BASE_URL}/api/auth/logout`);
}

/**
 * Wait for page to load and verify authentication
 *
 * @param page - Playwright Page
 * @param timeout - Maximum time to wait in ms
 */
export async function waitForAuthenticatedPage(
  page: Page,
  timeout: number = 10000
): Promise<boolean> {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout });

    // Check if we're on login page (not authenticated)
    const isLoginPage = await page.locator('text=家长登录').count() > 0;
    if (isLoginPage) {
      return false;
    }

    // Check for loading state
    const isLoading = await page.locator('text=加载中').count() > 0;
    if (isLoading) {
      // Wait for loading to complete
      await page.waitForSelector('text=加载中', { state: 'hidden', timeout });
    }

    return true;
  } catch (error) {
    console.error('Error waiting for authenticated page:', error);
    return false;
  }
}
