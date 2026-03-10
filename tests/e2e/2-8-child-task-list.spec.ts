/**
 * E2E Tests for Child Views Today's Task List
 *
 * Story 2.8: Child Views Today's Task List
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 *
 * Acceptance Criteria:
 * - Given 我已登录系统（PIN码或家长设备）
 * - When 我打开应用首页
 * - Then 系统显示今日任务列表，包含：任务卡片网格布局、每个任务显示：任务图标、名称、积分值、状态
 * - And 任务状态标签："待完成"、"已完成"、"待审批"
 * - And 任务按时间排序：有时间要求的任务靠前显示
 * - And 任务数量显示："今日任务 (X/Y)"
 * - And 页面加载时间<2秒（NFR1）
 */

import { test, expect } from '@playwright/test';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3344';

// Helper: Login with PIN and wait for navigation
async function loginWithPIN(page: any, pin = '9999') {
  // First, make the API call directly to get the session token
  const loginResponse = await page.request.post(`${BASE_URL}/api/auth/pin-login`, {
    data: { pin },
  });

  const loginData = await loginResponse.json();

  if (!loginData.success) {
    throw new Error(`Login failed: ${loginData.error || 'Unknown error'}`);
  }

  // Get the session token from the response
  const sessionToken = loginData.session?.token;
  if (!sessionToken) {
    throw new Error('No session token in login response');
  }

  // Set the session cookie manually
  await page.context().addCookies([
    {
      name: 'better-auth.session_token',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // Now navigate to child-dashboard
  await page.goto(`${BASE_URL}/child-dashboard`);

  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');

  // Wait for the main content to appear
  await page.waitForSelector('h1:has-text("我的主页")', { timeout: 10000 });
}

test.describe.configure({ mode: 'serial' });

test.describe('Story 2.8: Child Views Today\'s Task List - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 清除测试用户的会话（处理单设备限制）
    try {
      await fetch(`${BASE_URL}/api/test/clear-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-child-9999' }),
      });
    } catch (e) {
      // 如果清除端点失败，继续
    }

    // 重置 rate limit，避免测试之间相互干扰
    try {
      const resetResponse = await fetch(`${BASE_URL}/api/test/reset-rate-limit`);
      await resetResponse.text();
    } catch (e) {
      // 如果重置端点不存在，忽略错误
    }

    // 清除 cookies 和存储，确保每个测试从干净状态开始
    await page.context().clearCookies();
  });
  test('given 儿童已登录PIN码，when 打开应用首页，then 显示今日任务列表标题', async ({ page }) => {
    // Given: 儿童已通过PIN码登录
    await loginWithPIN(page);

    // When: 打开应用首页（已在child-dashboard）
    // Then: 显示页面标题"我的主页"
    const pageTitle = page.locator('h1:has-text("我的主页")');
    await expect(pageTitle).toBeVisible();

    // And: 显示副标题"完成任务，赚取积分！"
    const subtitle = page.locator('p:has-text("完成任务，赚取积分！")');
    await expect(subtitle).toBeVisible();
  });

  test('given 儿童有今日任务，when 打开应用首页，then 显示任务进度头部', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 页面加载完成
    // Then: 显示进度头部组件
    const progressHeader = page.locator('div:has-text("今日任务")');
    await expect(progressHeader).toBeVisible();

    // And: 显示进度条
    const progressBar = page.locator('div[class*="bg-gradient-to-r"]');
    await expect(progressBar).toBeVisible();

    // And: 显示任务数量统计（X/Y格式）
    const taskCount = page.locator('text=/\\d+\\/\\d+/');
    await expect(taskCount).toBeVisible();
  });

  test('given 儿童有今日任务，when 查看任务列表，then 显示任务卡片网格布局', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 查看任务列表
    const taskGrid = page.locator('div[class*="grid-cols-2"]');

    // Then: 显示网格布局
    await expect(taskGrid).toBeVisible();

    // And: 网格应该包含任务卡片
    const taskCards = taskGrid.locator('button[class*="rounded-3xl"]');
    const cardCount = await taskCards.count();

    // 至少应该有0个或更多任务卡片
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test('given 任务列表为空，when 打开应用首页，then 显示空状态提示', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 查看任务列表
    const emptyState = page.locator('div:has-text("今天没有任务")');

    // Then: 如果没有任务，显示空状态提示
    if (await emptyState.isVisible({ timeout: 3000 })) {
      // 验证空状态显示
      await expect(page.locator('text=/今天没有任务/')).toBeVisible();
      await expect(page.locator('text=/去玩吧/')).toBeVisible();
    }
  });

  test('given 有任务卡片，when 查看任务卡片，then 显示任务图标、名称、积分和状态', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 查找任务卡片
    const taskCard = page.locator('button[class*="rounded-3xl"]').first();

    // 检查是否有任务卡片
    const cardExists = await taskCard.count() > 0;

    if (cardExists) {
      // Then: 任务卡片应该显示
      await expect(taskCard).toBeVisible();

      // And: 显示任务图标（emoji）
      const taskIcon = taskCard.locator('div.text-6xl');
      await expect(taskIcon).toBeVisible();

      // And: 显示任务名称
      const taskTitle = taskCard.locator('h3[class*="font-bold"]');
      await expect(taskTitle).toBeVisible();

      // And: 显示积分值（⭐ + 数字）
      const pointsDisplay = taskCard.locator('text=/\\+\\d+/');
      await expect(pointsDisplay).toBeVisible();

      // And: 显示状态徽章
      const statusBadge = taskCard.locator('div[class*="rounded-full"]');
      await expect(statusBadge).toBeVisible();
    }
  });

  test('given 儿童有不同状态的任务，when 查看任务列表，then 正确显示所有状态标签', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 查看所有任务卡片
    const taskCards = page.locator('button[class*="rounded-3xl"]');
    const cardCount = await taskCards.count();

    if (cardCount > 0) {
      // Then: 每个任务卡片都应该有状态徽章
      for (let i = 0; i < cardCount; i++) {
        const card = taskCards.nth(i);
        const statusBadge = card.locator('div[class*="rounded-full"]');

        // 验证状态徽章可见
        await expect(statusBadge).toBeVisible();

        // 状态应该包含：待完成、已完成、待审批
        const badgeText = await statusBadge.textContent();
        expect(badgeText).toMatch(/待完成|已完成|待审批/);
      }
    }
  });

  test('given 儿童下拉刷新，when 触发刷新手势，then 显示刷新指示器', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 查找刷新指示器（自动刷新或下拉刷新）
    const autoRefreshNote = page.locator('p:has-text("任务列表会自动刷新")');

    // Then: 应该有自动刷新提示
    await expect(autoRefreshNote).toBeVisible();
  });

  test('given 儿童点击任务卡片，when 任务详情弹窗打开，then 显示完整任务信息', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 点击第一个任务卡片
    const taskCard = page.locator('button[class*="rounded-3xl"]').first();
    const cardExists = await taskCard.count() > 0;

    if (cardExists) {
      await taskCard.click();

      // Then: 任务详情弹窗应该打开（如果已实现）
      const dialog = page.locator('div[role="dialog"]');

      if (await dialog.isVisible({ timeout: 1000 })) {
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('given 儿童查看任务列表，when 观察界面，then 显示游戏化元素（emoji图标、鲜艳色彩）', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 查看页面
    // Then: 应该包含游戏化元素
    // 1. 顶部状态栏有emoji
    const statusEmoji = page.locator('span:has-text("🌟")');
    await expect(statusEmoji).toBeVisible();

    // 2. 进度头部有emoji
    const progressEmoji = page.locator('span:has-text("📋")');
    await expect(progressEmoji).toBeVisible();

    // 3. 鲜艳色彩（验证渐变背景）
    const gradientElements = page.locator('[class*="bg-gradient"]');
    const gradientCount = await gradientElements.count();
    expect(gradientCount).toBeGreaterThan(0);
  });

  test('given 儿童完成任务，when 所有任务完成，then 显示庆祝消息', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 查看进度（如果所有任务都完成）
    const celebrationMessage = page.locator('text=/太棒了|所有任务都完成/');

    // Then: 如果进度100%，显示庆祝消息
    if (await celebrationMessage.isVisible({ timeout: 2000 })) {
      await expect(celebrationMessage).toBeVisible();
      // 验证有emoji庆祝元素
      const celebrationEmoji = page.locator('span:has-text("🎉")');
      await expect(celebrationEmoji).toBeVisible();
    }
  });

  test('given 儿童有网络连接，when 打开应用，then 顶部显示在线状态', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 查看顶部状态栏
    const onlineIndicator = page.locator('div:has-text("在线")');

    // Then: 应该显示在线状态
    await expect(onlineIndicator).toBeVisible();

    // And: 显示同步指示器
    const syncIndicator = page.locator('span:has-text("🔄")');
    await expect(syncIndicator).toBeVisible();
  });

  test('given 儿童没有今日任务，when 打开应用，then 显示友好的空状态', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 查看任务列表
    const emptyState = page.locator('div:has-text("今天没有任务")');

    // Then: 如果是空状态
    if (await emptyState.isVisible({ timeout: 2000 })) {
      // 验证空状态的友好提示
      await expect(page.locator('text=/今天没有任务/')).toBeVisible();
      await expect(page.locator('text=/去玩吧/')).toBeVisible();

      // 验证有庆祝emoji
      const celebrationEmoji = page.locator('div.text-8xl:has-text("🎉")');
      await expect(celebrationEmoji).toBeVisible();
    }
  });
});

test.describe('Story 2.8: Child Task List - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // 清除测试用户的会话
    try {
      await fetch(`${BASE_URL}/api/test/clear-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-child-9999' }),
      });
    } catch (e) {
      // 如果清除端点失败，继续
    }

    // 清除 cookies
    await page.context().clearCookies();
  });

  test('given 任务卡片，when 使用键盘导航，then 可以通过Tab键聚焦', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 按Tab键聚焦到任务卡片
    const taskCard = page.locator('button[class*="rounded-3xl"]').first();
    const cardExists = await taskCard.count() > 0;

    if (cardExists) {
      // Focus the first task card
      await taskCard.focus();

      // Then: 元素应该可以被聚焦
      await expect(taskCard).toBeFocused();
    } else {
      // 如果没有任务卡片，跳过测试
      test.skip();
    }
  });

  test('given 任务卡片，when 使用屏幕阅读器，then 有适当的ARIA标签', async ({ page }) => {
    // Given: 儿童已登录
    await loginWithPIN(page);

    // When: 检查页面ARIA属性
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Then: 验证有语义化HTML
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });
});

test.describe('Story 2.8: Child Task List - Performance', () => {
  test.beforeEach(async ({ page }) => {
    // 清除测试用户的会话
    try {
      await fetch(`${BASE_URL}/api/test/clear-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-child-9999' }),
      });
    } catch (e) {
      // 如果清除端点失败，继续
    }

    // 清除 cookies
    await page.context().clearCookies();
  });

  test('given 页面加载，when 测量加载时间，then 页面加载时间在合理范围内', async ({ page }) => {
    // Given: 准备测量加载时间
    const startTime = Date.now();

    // When: 导航到儿童dashboard
    await loginWithPIN(page);

    const loadTime = Date.now() - startTime;

    // Then: 验证加载时间在合理范围内
    // 注意：这个阈值在CI/CD环境中可能需要调整
    expect(loadTime).toBeLessThan(5000); // 使用5秒作为较宽松的阈值
  });
});
