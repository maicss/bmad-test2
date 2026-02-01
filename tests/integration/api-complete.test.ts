/**
 * 
 * Tests all API endpoints with detailed test cases
 * Run: bun test tests/integration/api-complete.test.ts
 * 
 * Prerequisites:
 * - Server must be running at localhost:3344
 * - Database must be seeded with test data from AGENTS.md Test Data Suite
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createTestAdminSession, cleanupTestAdminSession } from "./helpers";

const BASE_URL = "http://localhost:3344";

const TEST_DATA = {
  admin: {
    phone: "13800000001",
    password: "1111",
    role: "admin",
  },
  parent1: {
    phone: "13800000100",
    password: "1111",
    role: "parent",
    familyId: "family-001",
  },
  parent2: {
    phone: "12800000200",
    password: "1111",
    role: "parent",
    familyId: "family-001",
  },
  child: {
    userId: "6321f2b1-bbfc-46c2-b1da-d00831f93523",
    pin: "1111",
    role: "child",
    familyId: "family-001",
  },
  nonExistent: {
    phone: "19999999999",
    password: "1111",
  },
};

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

async function getParentSession(phone: string, password: string): Promise<{ cookie: string; user: any }> {
  const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password, loginType: "password" }),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(`Parent login failed: ${data.error}`);
  }
  
  const setCookie = response.headers.get("set-cookie");
  return { cookie: setCookie || "", user: data.user };
}

async function getChildSession(userId: string, pin: string): Promise<{ sessionId: string; user: any }> {
  const response = await fetch(`${BASE_URL}/api/auth/child-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, pin }),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(`Child login failed: ${data.error}`);
  }
  
  return { sessionId: data.sessionId, user: { id: data.userId, memberId: data.memberId } };
}

describe("Comprehensive API Integration Tests", () => {
  let serverRunning = false;
  let parentSession: { cookie: string; user: any } | null = null;
  let childSession: { sessionId: string; user: any } | null = null;
  let testAdminSession: string;

  beforeAll(async () => {
    serverRunning = await isServerRunning();
    if (!serverRunning) {
      console.warn("Server not running at localhost:3344");
      console.warn("Please run: bun run dev");
      return;
    }

    try {
      const adminSess = await createTestAdminSession();
      if (adminSess) {
        testAdminSession = adminSess.cookie;
      }
    } catch (error) {
      console.warn("Failed to create admin session:", error);
    }

    try {
      parentSession = await getParentSession(TEST_DATA.parent1.phone, TEST_DATA.parent1.password);
      console.log("Parent session acquired");
    } catch (error) {
      console.warn("Failed to get parent session:", error);
    }

    try {
      childSession = await getChildSession(TEST_DATA.child.userId, TEST_DATA.child.pin);
      console.log("Child session acquired");
    } catch (error) {
      console.warn("Failed to get child session:", error);
    }
  });

  afterAll(async () => {
  });

  describe("Authentication API", () => {
    describe("POST /api/auth/parent-login", () => {
      test("should login successfully with valid credentials", async () => {
        const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: TEST_DATA.parent1.phone,
            password: TEST_DATA.parent1.password,
            loginType: "password",
          }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.user).toBeDefined();
        expect(data.user.phone).toBe(TEST_DATA.parent1.phone);
        expect(data.user.role).toBe("parent");
        
        const setCookie = response.headers.get("set-cookie");
        expect(setCookie).toBeDefined();
      });

      test("should reject login with invalid password", async () => {
        const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: TEST_DATA.parent1.phone,
            password: "wrong",
            loginType: "password",
          }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });

      test("should reject login for non-existent user", async () => {
        const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: TEST_DATA.nonExistent.phone,
            password: TEST_DATA.parent1.password,
            loginType: "password",
          }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });

      test("should reject login with missing credentials", async () => {
        const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });
    });

    describe("POST /api/auth/child-login", () => {
      test("should login successfully with valid PIN", async () => {
        const response = await fetch(`${BASE_URL}/api/auth/child-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: TEST_DATA.child.userId,
            pin: TEST_DATA.child.pin,
          }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.sessionId).toBeDefined();
        expect(data.userId).toBe(TEST_DATA.child.userId);
        expect(data.memberId).toBeDefined();
      });

      test("should reject login with invalid PIN", async () => {
        const response = await fetch(`${BASE_URL}/api/auth/child-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: TEST_DATA.child.userId,
            pin: "9999",
          }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });

      test("should reject login for non-existent child", async () => {
        const response = await fetch(`${BASE_URL}/api/auth/child-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "non-existent-id",
            pin: TEST_DATA.child.pin,
          }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });

      test("should reject login with missing fields", async () => {
        const response = await fetch(`${BASE_URL}/api/auth/child-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });
    });

    describe("POST /api/auth/session-check", () => {
      test("should validate active parent session", async () => {
        if (!parentSession) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/auth/session-check`, {
          method: "GET",
          headers: {
            Cookie: parentSession.cookie,
          },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.user).toBeDefined();
      });

      test("should reject invalid session", async () => {
        const response = await fetch(`${BASE_URL}/api/auth/session-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: "invalid-session" }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });

      test("should validate active child session", async () => {
        if (!childSession) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/auth/session-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: childSession.sessionId }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.user).toBeDefined();
      });
    });

    describe("POST /api/auth/logout", () => {
      test("should logout successfully", async () => {
        if (!parentSession) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      });
    });
  });

  describe("Family API", () => {
    describe("GET /api/family", () => {
      test("should get family details with valid session", async () => {
        if (!parentSession) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/family`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.family).toBeDefined();
        expect(data.data.members).toBeDefined();
        expect(Array.isArray(data.data.members)).toBe(true);
      });

      test("should reject request without authentication", async () => {
        const response = await fetch(`${BASE_URL}/api/family`);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });
    });
  });

  describe("Tasks API", () => {
    describe("GET /api/tasks", () => {
      test("should get tasks for family", async () => {
        if (!parentSession) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/tasks?familyId=${TEST_DATA.parent1.familyId}`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.tasks).toBeDefined();
        expect(Array.isArray(data.data.tasks)).toBe(true);
      });

      test("should reject unauthorized request", async () => {
        const response = await fetch(`${BASE_URL}/api/tasks?familyId=${TEST_DATA.parent1.familyId}`);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });
    });

    describe("POST /api/tasks", () => {
      test("should create new task", async () => {
        if (!parentSession) {
          return;
        }

        const newTask = {
          familyId: TEST_DATA.parent1.familyId,
          name: "Test Task",
          description: "Test task description",
          category: "custom",
          points: 10,
        };

        const response = await fetch(`${BASE_URL}/api/tasks`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(newTask),
        });

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.id).toBeDefined();
        expect(data.data.name).toBe(newTask.name);
      });

      test("should reject task creation without authentication", async () => {
        const newTask = {
          familyId: TEST_DATA.parent1.familyId,
          name: "Test Task",
          points: 10,
        };

        const response = await fetch(`${BASE_URL}/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTask),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });

      test("should reject task creation with missing fields", async () => {
        if (!parentSession) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/tasks`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify({}),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });
    });
  });

  describe("Points API", () => {
    describe("GET /api/points", () => {
      test("should get family points with valid session", async () => {
        if (!parentSession) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/points?familyId=${TEST_DATA.parent1.familyId}`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.points).toBeDefined();
      });

      test("should reject unauthorized access", async () => {
        const response = await fetch(`${BASE_URL}/api/points?familyId=${TEST_DATA.parent1.familyId}`);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });
    });

    describe("POST /api/points/award", () => {
      test("should award points to child", async () => {
        if (!parentSession || !childSession) {
          return;
        }

        const awardData = {
          memberId: childSession.user.memberId,
          points: 5,
          reason: "Test award",
        };

        const response = await fetch(`${BASE_URL}/api/points/award`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(awardData),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.newPoints).toBeDefined();
      });

      test("should reject unauthorized access", async () => {
        if (!childSession) {
          return;
        }

        const awardData = {
          memberId: childSession.user.memberId,
          points: 5,
          reason: "Test award",
        };

        const response = await fetch(`${BASE_URL}/api/points/award`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(awardData),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });
    });
  });

  describe("Wishes API", () => {
    describe("GET /api/wishes", () => {
      test("should get family wishes with valid session", async () => {
        if (!parentSession) {
          return;
        }

        const response = await fetch(`${BASE_URL}/api/wishes?familyId=${TEST_DATA.parent1.familyId}`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.wishes).toBeDefined();
        expect(Array.isArray(data.data.wishes)).toBe(true);
      });

      test("should reject unauthorized access", async () => {
        const response = await fetch(`${BASE_URL}/api/wishes?familyId=${TEST_DATA.parent1.familyId}`);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.message).toBeDefined();
      });
    });

    describe("POST /api/wishes", () => {
      test("should create new wish", async () => {
        if (!parentSession || !childSession) {
          return;
        }

        const newWish = {
          memberId: childSession.user.memberId,
          title: "Test Wish",
          description: "Test wish description",
          type: "experience",
          pointsRequired: 50,
        };

        const response = await fetch(`${BASE_URL}/api/wishes`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(newWish),
        });

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.id).toBeDefined();
        expect(data.data.title).toBe(newWish.title);
      });
    });
  });

  describe("Web Routes", () => {
    test("GET / should return landing page", async () => {
      const response = await fetch(`${BASE_URL}/`);

      expect(response.status).toBe(200);
      const contentType = response.headers.get("content-type");
      expect(contentType?.includes("text/html")).toBe(true);
    });

    test("GET /auth/login should return HTML", async () => {
      const response = await fetch(`${BASE_URL}/auth/login`);

      expect(response.status).toBe(200);
      const contentType = response.headers.get("content-type");
      expect(contentType?.includes("text/html")).toBe(true);
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
      expect(contentType?.includes("text/html")).toBe(true);
    });
  });

  describe("Error Handling", () => {
    test("should return JSON for API errors", async () => {
      const response = await fetch(`${BASE_URL}/api/non-existent-endpoint`);

      expect(response.status).toBe(404);
    });

    test("should handle CORS preflight", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "OPTIONS",
        headers: {
          "Origin": "http://localhost:3000",
          "Access-Control-Request-Method": "POST",
        },
      });

      expect(response.status).toBe(204);
    });
  });

  describe("Access Control", () => {
    test("should enforce authentication on protected routes", async () => {
      const protectedRoutes = [
        `${BASE_URL}/api/tasks?familyId=family-001`,
        `${BASE_URL}/api/points?familyId=family-001`,
        `${BASE_URL}/api/wishes?familyId=family-001`,
      ];

      for (const route of protectedRoutes) {
        const response = await fetch(route);
        expect(response.status).toBe(401);
      }
    });

    test("should enforce family membership access", async () => {
      if (!parentSession) {
        return;
      }

      const response = await fetch(`${BASE_URL}/api/tasks?familyId=family-002`, {
        headers: { Cookie: parentSession.cookie },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error || data.code).toBeDefined();
    });
  });
});
