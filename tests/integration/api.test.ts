import { describe, test, expect, beforeAll, afterAll } from "bun:test";

const BASE_URL = "http://localhost:3344";

async function isServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "test", password: "test" }),
    });
    return true;
  } catch {
    return false;
  }
}

describe("API Integration Tests", () => {
  let serverRunning = false;

  beforeAll(async () => {
    serverRunning = await isServerRunning();
    if (!serverRunning) {
      console.warn("服务器未运行，跳过集成测试");
      console.warn("请先运行: bun run dev");
    }
  });

  afterAll(() => {
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
          loginType: "password",
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
          loginType: "password",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error || data.code).toBeDefined();
    });

    test("POST /api/auth/parent-login - invalid phone format", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "123",
          password: "1111",
          loginType: "password",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error || data.code).toBeDefined();
    });

    test("POST /api/auth/parent-login - non-existent user", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "19999999999",
          password: "1111",
          loginType: "password",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error || data.code).toBeDefined();
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
      expect(data.error || data.code).toBeDefined();
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
      expect(data.error || data.code).toBeDefined();
    });
  });

  describe("Response Format", () => {
    test("should return JSON content type", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "13800000100", password: "1111", loginType: "password" }),
      });

      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("application/json");
    });
  });

  describe("Web Routes Integration", () => {
    test("GET / returns landing page", async () => {
      const response = await fetch(`${BASE_URL}/`, {
        redirect: "manual",
      });

      expect(response.status).toBe(200);
    });

    test("GET /parent returns HTML page", async () => {
      const response = await fetch(`${BASE_URL}/parent`);

      expect(response.status).toBe(200);
      const contentType = response.headers.get("content-type");
      expect(contentType?.includes("text/html")).toBe(true);
    });

    test("GET /child returns HTML page", async () => {
      const response = await fetch(`${BASE_URL}/child`);

      expect(response.status).toBe(200);
      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("text/html");
    });
  });
});
