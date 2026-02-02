import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { createTestAdminSession, cleanupTestAdminSession, serverIsRunning, TestSession } from "./helpers";

const API_URL = "http://localhost:3000/api/admin/medal-templates";
const BASE_URL = "http://localhost:3000";

describe("Medal Templates API", () => {
  let session: TestSession | null = null;
  let createdTemplateId: string | null = null;

  beforeAll(async () => {
    // Check if server is running
    const running = await serverIsRunning(BASE_URL);
    if (!running) {
      console.warn("⚠️ Server is not running at", BASE_URL);
      console.warn("Please start the server with: bun dev");
    }

    // Create test admin session
    session = await createTestAdminSession();
    expect(session).not.toBeNull();
  });

  afterAll(async () => {
    // Cleanup test session
    if (session?.userId) {
      await cleanupTestAdminSession(session.userId);
    }

    // Cleanup created template
    if (createdTemplateId && session) {
      try {
        await fetch(`${API_URL}/${createdTemplateId}`, {
          method: "DELETE",
          headers: {
            "Cookie": session.cookie,
          },
        });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe("POST /api/admin/medal-templates", () => {
    it("should create a medal template with single level", async () => {
      if (!session) {
        console.warn("Skipping test: no session");
        return;
      }

      const body = {
        name: "英语阅读200次",
        icon: {
          type: "lucide" as const,
          value: "Medal",
          color: "#FFD700",
        },
        borderStyle: "hexagon" as const,
        levelMode: "single" as const,
        levelCount: 1,
        thresholdCounts: [10],
        isContinuous: true,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": session.cookie,
        },
        body: JSON.stringify(body),
      });

      console.log("Response status:", response.status);
      const responseBody = await response.json();
      console.log("Response body:", JSON.stringify(responseBody, null, 2));

      expect(response.status).toBe(201);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toHaveProperty("id");
      expect(responseBody.data.name).toBe(body.name);

      createdTemplateId = responseBody.data.id;
    });

    it("should create a medal template with multiple levels", async () => {
      if (!session) {
        console.warn("Skipping test: no session");
        return;
      }

      const body = {
        name: "多等级徽章",
        icon: {
          type: "lucide" as const,
          value: "Trophy",
          color: "#3B82F6",
        },
        borderStyle: "circle" as const,
        levelMode: "multiple" as const,
        levelCount: 3,
        tierColorScheme: "INGRESS" as const,
        thresholdCounts: [10, 20, 30],
        isContinuous: false,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": session.cookie,
        },
        body: JSON.stringify(body),
      });

      console.log("Response status:", response.status);
      const responseBody = await response.json();
      console.log("Response body:", JSON.stringify(responseBody, null, 2));

      expect(response.status).toBe(201);
      expect(responseBody.success).toBe(true);
    });

    it("should reject invalid name (too long)", async () => {
      if (!session) {
        console.warn("Skipping test: no session");
        return;
      }

      const body = {
        name: "这是一个超过十个字符的徽章名称",
        icon: {
          type: "lucide" as const,
          value: "Medal",
        },
        borderStyle: "circle" as const,
        levelMode: "single" as const,
        thresholdCounts: [10],
        isContinuous: false,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": session.cookie,
        },
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
    });

    it("should reject unauthenticated requests", async () => {
      const body = {
        name: "测试徽章",
        icon: {
          type: "lucide" as const,
          value: "Medal",
        },
        borderStyle: "circle" as const,
        levelMode: "single" as const,
        thresholdCounts: [10],
        isContinuous: false,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
    });
  });

  describe("GET /api/admin/medal-templates", () => {
    it("should return list of medal templates", async () => {
      if (!session) {
        console.warn("Skipping test: no session");
        return;
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Cookie": session.cookie,
        },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(Array.isArray(responseBody.data)).toBe(true);
    });

    it("should reject unauthenticated GET requests", async () => {
      const response = await fetch(API_URL);
      expect(response.status).toBe(401);
    });
  });
});
