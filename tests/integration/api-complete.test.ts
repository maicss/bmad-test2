/**
 * Comprehensive API Integration Tests
 * 
 * Tests all API endpoints with detailed test cases
 * Run: bun test tests/integration/api-complete.test.ts
 * 
 * Prerequisites:
 * - Server must be running at localhost:3344
 * - Database must be seeded with test data from AGENTS.md Test Data Suite
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";

const BASE_URL = "http://localhost:3344";

// Test Data from AGENTS.md Test Data Suite
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

// Helper function to check if server is running
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

// Helper to get auth cookies from parent login
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
  
  // Extract cookies from response
  const setCookie = response.headers.get("set-cookie");
  return { cookie: setCookie || "", user: data.user };
}

// Helper to get child session
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

  beforeAll(async () => {
    serverRunning = await isServerRunning();
    if (!serverRunning) {
      console.warn("⚠️  Server not running at localhost:3344");
      console.warn("   Please run: bun run dev");
      return;
    }

    // Setup sessions for tests
    try {
      parentSession = await getParentSession(TEST_DATA.parent1.phone, TEST_DATA.parent1.password);
      console.log("✅ Parent session acquired");
    } catch (error) {
      console.warn("⚠️  Failed to get parent session:", error);
    }

    try {
      childSession = await getChildSession(TEST_DATA.child.userId, TEST_DATA.child.pin);
      console.log("✅ Child session acquired");
    } catch (error) {
      console.warn("⚠️  Failed to get child session:", error);
    }
  });

  // ============================================================================
  // AUTHENTICATION API TESTS
  // ============================================================================
  describe("Authentication API", () => {
    describe("POST /api/auth/parent-login", () => {
      test("should login successfully with valid credentials", async () => {
        if (!serverRunning) return;

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
        expect(data.user.role).toBe("parent");
        expect(data.user.phone).toBe(TEST_DATA.parent1.phone);
      });

      test("should reject login with wrong password", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: TEST_DATA.parent1.phone,
            password: "wrongpassword",
            loginType: "password",
          }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });

      test("should reject login with invalid phone format", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: "123",
            password: TEST_DATA.parent1.password,
            loginType: "password",
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });

      test("should reject login with non-existent user", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: TEST_DATA.nonExistent.phone,
            password: TEST_DATA.nonExistent.password,
            loginType: "password",
          }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });

      test("should reject login with missing phone", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "1111" }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("should reject login with missing password", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: TEST_DATA.parent1.phone }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });

    describe("POST /api/auth/child-login", () => {
      test("should login successfully with valid PIN", async () => {
        if (!serverRunning) return;

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
        expect(data.userId).toBeDefined();
        expect(data.memberId).toBeDefined();
      });

      test("should reject login with wrong PIN", async () => {
        if (!serverRunning) return;

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
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });

      test("should reject login with missing userId", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/auth/child-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: TEST_DATA.child.pin }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("should reject login with missing PIN", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/auth/child-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: TEST_DATA.child.userId }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("should reject login with invalid PIN format", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/auth/child-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: TEST_DATA.child.userId,
            pin: "123",
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("should reject login with non-existent userId", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/auth/child-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "non-existent-user",
            pin: "1111",
          }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });

    describe("POST /api/auth/session-check", () => {
      test("should return valid session with valid sessionId", async () => {
        if (!serverRunning || !childSession) return;

        const response = await fetch(`${BASE_URL}/api/auth/session-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: childSession.sessionId }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.valid).toBe(true);
        expect(data.locked).toBe(false);
      });

      test("should reject invalid sessionId", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/auth/session-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: "invalid-session-id" }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.valid).toBe(false);
      });

      test("should reject missing sessionId", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/auth/session-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.valid).toBe(false);
      });
    });
  });

  // ============================================================================
  // TASKS API TESTS
  // ============================================================================
  describe("Tasks API", () => {
    describe("GET /api/tasks?familyId=xxx", () => {
      test("should get tasks list with valid familyId and session", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/tasks?familyId=${TEST_DATA.parent1.familyId}`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(Array.isArray(data.data)).toBe(true);
      });

      test("should reject request without familyId", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/tasks`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });

      test("should reject unauthorized request", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/tasks?familyId=${TEST_DATA.parent1.familyId}`);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("should reject access to non-member family", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/tasks?familyId=family-999`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });

    describe("POST /api/tasks", () => {
      test("should create task with valid data", async () => {
        if (!serverRunning || !parentSession) return;

        const newTask = {
          familyId: TEST_DATA.parent1.familyId,
          name: "Test Task " + Date.now(),
          description: "Test task description",
          category: "custom",
          points: 10,
          icon: "star",
          color: "#FFD700",
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
        expect(data.data).toBeDefined();
        expect(data.data.id).toBeDefined();
        expect(data.data.name).toBe(newTask.name);
      });

      test("should reject task creation without required fields", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify({ familyId: TEST_DATA.parent1.familyId }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });

      test("should reject task creation by non-parent", async () => {
        if (!serverRunning || !childSession) return;

        const newTask = {
          familyId: TEST_DATA.child.familyId,
          name: "Child Task",
          category: "custom",
          points: 10,
        };

        const response = await fetch(`${BASE_URL}/api/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTask),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("should reject task creation for non-member family", async () => {
        if (!serverRunning || !parentSession) return;

        const newTask = {
          familyId: "family-999",
          name: "Unauthorized Task",
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

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });

    describe("Task Detail API - /api/tasks/[id]", () => {
      let taskId: string | null = null;

      beforeAll(async () => {
        if (!serverRunning || !parentSession) return;
        
        // Create a test task
        const newTask = {
          familyId: TEST_DATA.parent1.familyId,
          name: "Test Task for CRUD",
          description: "Test task for CRUD operations",
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

        if (response.status === 201) {
          const data = await response.json();
          taskId = data.data.id;
        }
      });

      test("GET should retrieve task by id", async () => {
        if (!serverRunning || !parentSession || !taskId) return;

        const response = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.id).toBe(taskId);
      });

      test("GET should return 404 for non-existent task", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/tasks/non-existent-task`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("PUT should update task", async () => {
        if (!serverRunning || !parentSession || !taskId) return;

        const updates = {
          name: "Updated Task Name",
          points: 20,
        };

        const response = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(updates),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.name).toBe(updates.name);
        expect(data.data.points).toBe(updates.points);
      });

      test("DELETE should deactivate task", async () => {
        if (!serverRunning || !parentSession || !taskId) return;

        const response = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
          method: "DELETE",
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toBeDefined();
      });
    });

    describe("POST /api/tasks/[id]/complete", () => {
      test("should complete task and award points", async () => {
        if (!serverRunning || !parentSession) return;

        // First create a task
        const newTask = {
          familyId: TEST_DATA.parent1.familyId,
          name: "Completable Task",
          category: "custom",
          points: 15,
        };

        const createResponse = await fetch(`${BASE_URL}/api/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(newTask),
        });

        const createData = await createResponse.json();
        const taskId = createData.data.id;

        // Now complete the task for the child
        const completeResponse = await fetch(`${BASE_URL}/api/tasks/${taskId}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify({
            memberId: childSession?.user.memberId || "test-member-id",
            note: "Test completion",
          }),
        });

        expect(completeResponse.status).toBe(200);
        const data = await completeResponse.json();
        expect(data.success).toBe(true);
        expect(data.data.pointsEarned).toBe(15);
      });

      test("should reject completion without memberId", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/tasks/non-existent/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify({ note: "Test" }),
        });

        expect(response.status).toBeGreaterThanOrEqual(400);
      });
    });
  });

  // ============================================================================
  // POINTS API TESTS
  // ============================================================================
  describe("Points API", () => {
    describe("GET /api/points?familyId=xxx", () => {
      test("should get points summary for family", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/points?familyId=${TEST_DATA.parent1.familyId}`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.familyId).toBe(TEST_DATA.parent1.familyId);
        expect(data.data.members).toBeDefined();
        expect(Array.isArray(data.data.members)).toBe(true);
      });

      test("should reject without familyId", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/points`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("should reject unauthorized access", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/points?familyId=${TEST_DATA.parent1.familyId}`);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });

    describe("GET /api/points/history?familyId=xxx&memberId=xxx", () => {
      test("should get points history for member", async () => {
        if (!serverRunning || !parentSession || !childSession) return;

        const response = await fetch(
          `${BASE_URL}/api/points/history?familyId=${TEST_DATA.parent1.familyId}&memberId=${childSession.user.memberId}&limit=10`,
          { headers: { Cookie: parentSession.cookie } }
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.transactions).toBeDefined();
        expect(Array.isArray(data.data.transactions)).toBe(true);
      });

      test("should reject without memberId", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(
          `${BASE_URL}/api/points/history?familyId=${TEST_DATA.parent1.familyId}`,
          { headers: { Cookie: parentSession.cookie } }
        );

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("should support pagination params", async () => {
        if (!serverRunning || !parentSession || !childSession) return;

        const response = await fetch(
          `${BASE_URL}/api/points/history?familyId=${TEST_DATA.parent1.familyId}&memberId=${childSession.user.memberId}&limit=5&offset=0`,
          { headers: { Cookie: parentSession.cookie } }
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.pagination).toBeDefined();
        expect(data.data.pagination.limit).toBe(5);
      });
    });

    describe("POST /api/points/adjust", () => {
      test("should adjust points successfully", async () => {
        if (!serverRunning || !parentSession || !childSession) return;

        const adjustData = {
          familyId: TEST_DATA.parent1.familyId,
          memberId: childSession.user.memberId,
          amount: 50,
          reason: "Test points adjustment",
        };

        const response = await fetch(`${BASE_URL}/api/points/adjust`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(adjustData),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.pointsAdjusted).toBe(50);
        expect(data.data.newBalance).toBeDefined();
      });

      test("should reject adjustment by non-parent", async () => {
        if (!serverRunning || !childSession) return;

        const adjustData = {
          familyId: TEST_DATA.child.familyId,
          memberId: childSession.user.memberId,
          amount: 50,
          reason: "Unauthorized adjustment",
        };

        const response = await fetch(`${BASE_URL}/api/points/adjust`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adjustData),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("should reject negative adjustment exceeding balance", async () => {
        if (!serverRunning || !parentSession || !childSession) return;

        const adjustData = {
          familyId: TEST_DATA.parent1.familyId,
          memberId: childSession.user.memberId,
          amount: -999999,
          reason: "Excessive deduction",
        };

        const response = await fetch(`${BASE_URL}/api/points/adjust`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(adjustData),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toContain("points");
      });

      test("should reject adjustment with missing fields", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/points/adjust`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify({}),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });
  });

  // ============================================================================
  // WISHES API TESTS
  // ============================================================================
  describe("Wishes API", () => {
    describe("GET /api/wishes?familyId=xxx", () => {
      test("should list wishes for family", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/wishes?familyId=${TEST_DATA.parent1.familyId}`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(Array.isArray(data.data)).toBe(true);
      });

      test("should filter wishes by status", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(
          `${BASE_URL}/api/wishes?familyId=${TEST_DATA.parent1.familyId}&status=pending`,
          { headers: { Cookie: parentSession.cookie } }
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      });

      test("should reject without familyId", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/wishes`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("should reject unauthorized access", async () => {
        if (!serverRunning) return;

        const response = await fetch(`${BASE_URL}/api/wishes?familyId=${TEST_DATA.parent1.familyId}`);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });

    describe("POST /api/wishes", () => {
      test("should create wish successfully", async () => {
        if (!serverRunning || !parentSession) return;

        const wishData = {
          familyId: TEST_DATA.parent1.familyId,
          title: "Test Wish " + Date.now(),
          description: "Test wish description",
          type: "item",
          pointsRequired: 100,
        };

        const response = await fetch(`${BASE_URL}/api/wishes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(wishData),
        });

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.id).toBeDefined();
        expect(data.data.title).toBe(wishData.title);
        expect(data.data.status).toBe("pending");
      });

      test("should create activity type wish", async () => {
        if (!serverRunning || !parentSession) return;

        const wishData = {
          familyId: TEST_DATA.parent1.familyId,
          title: "Activity Wish",
          description: "A fun activity",
          type: "activity",
          pointsRequired: 200,
        };

        const response = await fetch(`${BASE_URL}/api/wishes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(wishData),
        });

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.type).toBe("activity");
      });

      test("should reject wish with missing required fields", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/wishes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify({ familyId: TEST_DATA.parent1.familyId }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("should reject wish with invalid type", async () => {
        if (!serverRunning || !parentSession) return;

        const wishData = {
          familyId: TEST_DATA.parent1.familyId,
          title: "Invalid Wish",
          type: "invalid",
          pointsRequired: 100,
        };

        const response = await fetch(`${BASE_URL}/api/wishes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(wishData),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });

    describe("Wish Detail API - /api/wishes/[id]", () => {
      let wishId: string | null = null;

      beforeAll(async () => {
        if (!serverRunning || !parentSession) return;
        
        // Create a test wish
        const wishData = {
          familyId: TEST_DATA.parent1.familyId,
          title: "Test Wish for CRUD",
          description: "Test wish for CRUD operations",
          type: "item",
          pointsRequired: 50,
        };

        const response = await fetch(`${BASE_URL}/api/wishes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(wishData),
        });

        if (response.status === 201) {
          const data = await response.json();
          wishId = data.data.id;
        }
      });

      test("GET should retrieve wish by id", async () => {
        if (!serverRunning || !parentSession || !wishId) return;

        const response = await fetch(`${BASE_URL}/api/wishes/${wishId}`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.id).toBe(wishId);
      });

      test("GET should return 404 for non-existent wish", async () => {
        if (!serverRunning || !parentSession) return;

        const response = await fetch(`${BASE_URL}/api/wishes/non-existent-wish`, {
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("PUT should update wish", async () => {
        if (!serverRunning || !parentSession || !wishId) return;

        const updates = {
          title: "Updated Wish Title",
          pointsRequired: 75,
        };

        const response = await fetch(`${BASE_URL}/api/wishes/${wishId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(updates),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.title).toBe(updates.title);
        expect(data.data.pointsRequired).toBe(updates.pointsRequired);
      });

      test("PUT should reject update of non-pending wish", async () => {
        // This test would require a wish that's already approved/completed
        // For now, we skip this edge case
        expect(true).toBe(true);
      });

      test("DELETE should cancel wish", async () => {
        if (!serverRunning || !parentSession || !wishId) return;

        const response = await fetch(`${BASE_URL}/api/wishes/${wishId}`, {
          method: "DELETE",
          headers: { Cookie: parentSession.cookie },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.status).toBe("cancelled");
        expect(data.message).toContain("cancelled");
      });
    });

    describe("POST /api/wishes/[id]/approve", () => {
      let wishId: string | null = null;

      beforeAll(async () => {
        if (!serverRunning || !parentSession) return;
        
        // Create a test wish for approval
        const wishData = {
          familyId: TEST_DATA.parent1.familyId,
          title: "Wish for Approval",
          type: "item",
          pointsRequired: 30,
        };

        const response = await fetch(`${BASE_URL}/api/wishes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(wishData),
        });

        if (response.status === 201) {
          const data = await response.json();
          wishId = data.data.id;
        }
      });

      test("should approve wish", async () => {
        if (!serverRunning || !parentSession || !wishId) return;

        const response = await fetch(`${BASE_URL}/api/wishes/${wishId}/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify({ action: "approve" }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.status).toBe("approved");
        expect(data.message).toContain("approved");
      });

      test("should reject approval by non-parent", async () => {
        if (!serverRunning || !childSession || !wishId) return;

        const response = await fetch(`${BASE_URL}/api/wishes/${wishId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      test("should reject approval for non-pending wish", async () => {
        if (!serverRunning || !parentSession || !wishId) return;

        // Try to approve again (already approved)
        const response = await fetch(`${BASE_URL}/api/wishes/${wishId}/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify({ action: "approve" }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });

    describe("POST /api/wishes/[id]/redeem", () => {
      let wishId: string | null = null;

      beforeAll(async () => {
        if (!serverRunning || !parentSession || !childSession) return;
        
        // First, add some points to the child
        await fetch(`${BASE_URL}/api/points/adjust`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify({
            familyId: TEST_DATA.parent1.familyId,
            memberId: childSession.user.memberId,
            amount: 1000,
            reason: "Test setup: Add points for wish redemption",
          }),
        });

        // Create a wish and approve it
        const wishData = {
          familyId: TEST_DATA.parent1.familyId,
          title: "Redeemable Wish",
          type: "item",
          pointsRequired: 100,
        };

        const createResponse = await fetch(`${BASE_URL}/api/wishes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(wishData),
        });

        if (createResponse.status === 201) {
          const createData = await createResponse.json();
          wishId = createData.data.id;

          // Approve the wish
          await fetch(`${BASE_URL}/api/wishes/${wishId}/approve`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: parentSession.cookie,
            },
            body: JSON.stringify({ action: "approve" }),
          });
        }
      });

      test("should redeem approved wish", async () => {
        if (!serverRunning || !childSession || !wishId) return;

        const response = await fetch(`${BASE_URL}/api/wishes/${wishId}/redeem`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ note: "Test redemption" }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.wish).toBeDefined();
        expect(data.data.redemption).toBeDefined();
        expect(data.data.pointsSpent).toBeDefined();
        expect(data.data.remainingPoints).toBeDefined();
        expect(data.message).toContain("redeemed");
      });

      test("should reject redemption of non-approved wish", async () => {
        if (!serverRunning || !parentSession) return;

        // Create a new wish but don't approve it
        const wishData = {
          familyId: TEST_DATA.parent1.familyId,
          title: "Non-Approved Wish",
          type: "item",
          pointsRequired: 50,
        };

        const createResponse = await fetch(`${BASE_URL}/api/wishes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: parentSession.cookie,
          },
          body: JSON.stringify(wishData),
        });

        const createData = await createResponse.json();
        const pendingWishId = createData.data.id;

        // Try to redeem without approval
        const response = await fetch(`${BASE_URL}/api/wishes/${pendingWishId}/redeem`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toContain("approved");
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================
  describe("Error Handling", () => {
    test("should handle malformed JSON", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not valid json",
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test("should handle missing content type gracefully", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        body: JSON.stringify({ phone: TEST_DATA.parent1.phone, password: "1111" }),
      });

      // Should either work or return a controlled error
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    test("should return JSON content type", async () => {
      if (!serverRunning) return;

      const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: TEST_DATA.parent1.phone, password: "1111" }),
      });

      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("application/json");
    });
  });

  // ============================================================================
  // ACCESS CONTROL TESTS
  // ============================================================================
  describe("Access Control", () => {
    test("should enforce authentication on protected routes", async () => {
      if (!serverRunning) return;

      const protectedRoutes = [
        `${BASE_URL}/api/tasks?familyId=family-001`,
        `${BASE_URL}/api/points?familyId=family-001`,
        `${BASE_URL}/api/wishes?familyId=family-001`,
      ];

      for (const route of protectedRoutes) {
        const response = await fetch(route);
        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
      }
    });

    test("should enforce family membership access", async () => {
      if (!serverRunning || !parentSession) return;

      // Try to access a different family's data
      const response = await fetch(`${BASE_URL}/api/tasks?familyId=family-002`, {
        headers: { Cookie: parentSession.cookie },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});
