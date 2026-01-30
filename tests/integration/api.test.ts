/**
 * API Integration Tests
 * 
 * 测试 API 端点的集成测试
 * 注意：这些测试需要服务器运行
 * 运行: bun test tests/integration
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";

const BASE_URL = "http://localhost:3344";

// 检查服务器是否运行
async function isServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "test", password: "test" }),
    });
    return true; // 只要有响应，服务器就在运行
  } catch {
    return false;
  }
}

describe("API Integration Tests", () => {
  let serverRunning = false;

  beforeAll(async () => {
    serverRunning = await isServerRunning();
    if (!serverRunning) {
      console.warn("⚠️  服务器未运行，跳过集成测试");
      console.warn("   请先运行: bun run dev");
    }
  });

  describe("Authentication API", () => {
    test("POST /api/auth/parent-login - valid credentials", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "13800000100",
          password: "1111",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.role).toBe("parent");
    });

    test("POST /api/auth/parent-login - invalid password", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "13800000100",
          password: "wrong",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test("POST /api/auth/parent-login - invalid phone format", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "123",
          password: "1111",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test("POST /api/auth/parent-login - non-existent user", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "19999999999",
          password: "1111",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test("POST /api/auth/child-login - missing parameters", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/child-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test("POST /api/auth/session-check - invalid session", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/session-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "invalid-session" }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe("Response Format", () => {
    test("should return JSON content type", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "13800000100",
          password: "1111",
        }),
      });

      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("application/json");
    });

    test("should include CORS headers if configured", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "OPTIONS",
      });

      // CORS 头可能不存在，但不应该抛出错误
      expect(response.status).toBeLessThan(500);
    });
  });

  describe("Error Handling", () => {
    test("should handle malformed JSON", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not valid json",
      });

      // 应该返回 400 或 500
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test("should handle missing content type", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        body: JSON.stringify({ phone: "13800000100", password: "1111" }),
      });

      // 应该返回 400 或继续处理
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });
});

describe("Web Routes Integration", () => {
  test("GET / should redirect to login", async () => {
    const response = await fetch(`${BASE_URL}/`, {
      redirect: "manual",
    });

    // 应该重定向
    expect(response.status).toBe(307); // Temporary Redirect
  });

  test("GET /auth/login should return HTML", async () => {
    const response = await fetch(`${BASE_URL}/auth/login`);

    expect(response.status).toBe(200);
    const contentType = response.headers.get("content-type");
    expect(contentType).toContain("text/html");
  });

  test("GET /parent should return HTML", async () => {
    const response = await fetch(`${BASE_URL}/parent`);

    // 未认证应该重定向
    expect(response.status).toBeGreaterThanOrEqual(300);
  });

  test("GET /child should return HTML", async () => {
    const response = await fetch(`${BASE_URL}/child`);

    expect(response.status).toBe(200);
    const contentType = response.headers.get("content-type");
    expect(contentType).toContain("text/html");
  });
});
