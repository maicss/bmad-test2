import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration
 *
 * 使用本地 Chrome 浏览器（AGENTS.md 要求）
 * E2E Tests (Playwright with local Chrome)
 */

export default defineConfig({
  testDir: "./tests/e2e",

  /* 运行测试文件 */
  fullyParallel: true,

  /* 失败时禁止重复测试 */
  forbidOnly: !!process.env.CI,

  /* 重试次数 */
  retries: process.env.CI ? 2 : 0,

  /* 并行工作进程 */
  workers: process.env.CI ? 1 : undefined,

  /* 报告器 */
  reporter: "html",

  /* 共享设置 */
  use: {
    /* 基础 URL */
    baseURL: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`,

    /* 收集追踪 */
    trace: "on-first-retry",

    /* 截图 */
    screenshot: "only-on-failure",

    /* 视频 */
    video: "on-first-retry",
  },

  /* 项目配置 - 使用本地 Chrome */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // 使用本地 Chrome
        channel: "chrome",
      },
    },
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 5"],
        // 使用本地 Chrome
        channel: "chrome",
      },
    },
  ],
});
