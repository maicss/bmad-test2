import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Database } from "bun:sqlite";
import { resolve } from "path";
import { createTestAdminSession, cleanupTestAdminSession } from "./helpers";

const API_BASE = process.env.TEST_API_URL || "http://localhost:3344";
const SERVER_DB_PATH = resolve(process.cwd(), "database/db.sqlite");

describe("Task Template API", () => {
  let db: Database;
  let adminSession: string;
  let adminUserId: string;
  let createdTemplateId: string;
  let dateStrategyId: string;

  beforeAll(async () => {
    db = new Database(SERVER_DB_PATH);
    db.exec("PRAGMA foreign_keys = ON");
    
    const session = await createTestAdminSession();
    if (!session) {
      throw new Error("Failed to create test admin session");
    }
    
    adminUserId = session.userId;
    adminSession = session.cookie;

    dateStrategyId = `dst_${Date.now()}`;
    db.run(`
      INSERT INTO date_strategy_template (id, name, region, year, dates, created_by)
      VALUES (?, 'Test Strategy', 'national', 2026, '2026-01-01,2026-01-02', ?)
    `, [dateStrategyId, adminUserId]);
  });

  afterAll(async () => {
    if (db) {
      db.close();
    }
    if (adminUserId) {
      await cleanupTestAdminSession(adminUserId);
    }
  });

  describe("POST /api/admin/task-templates", () => {
    test("should create task template with valid data", async () => {
      const payload = {
        templateName: "Daily Math Challenge",
        taskName: "Complete math problems",
        basePoints: 10,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        dateStrategyId: dateStrategyId,
        comboStrategyType: "linear",
        comboStrategyConfig: null,
        badgeId: null,
        ageRangeMin: 6,
        ageRangeMax: 12,
        taskType: "daily",
        category: "education",
      };

      const response = await fetch(`${API_BASE}/api/admin/task-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminSession,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.templateName).toBe(payload.templateName);
      expect(data.data.taskName).toBe(payload.taskName);
      createdTemplateId = data.data.id;
    });

    test("should reject creation without required fields", async () => {
      const payload = {
        templateName: "",
        taskName: "",
        basePoints: null,
        startDate: "",
        endDate: "",
        dateStrategyId: "",
      };

      const response = await fetch(`${API_BASE}/api/admin/task-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminSession,
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBeDefined();
    });

    test("should reject non-admin access", async () => {
      const response = await fetch(`${API_BASE}/api/admin/task-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateName: "test" }),
      });

      expect(response.status).toBe(401);
    });

    test("should create template with stair combo strategy", async () => {
      const payload = {
        templateName: "Stair Challenge",
        taskName: "Stair climbing task",
        basePoints: 5,
        startDate: "2026-02-01",
        endDate: "2026-02-28",
        dateStrategyId: dateStrategyId,
        comboStrategyType: "stair",
        comboStrategyConfig: JSON.stringify({ steps: [1, 2, 3, 5, 8] }),
        badgeId: null,
        ageRangeMin: null,
        ageRangeMax: null,
        taskType: "weekly",
        category: "fitness",
      };

      const response = await fetch(`${API_BASE}/api/admin/task-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminSession,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  describe("GET /api/admin/task-templates", () => {
    test("should return list of templates", async () => {
      const response = await fetch(`${API_BASE}/api/admin/task-templates`, {
        headers: { Cookie: adminSession },
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.templates)).toBe(true);
    });

    test("should reject non-admin access", async () => {
      const response = await fetch(`${API_BASE}/api/admin/task-templates`);
      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/admin/task-templates/:id", () => {
    test("should return single template by id", async () => {
      if (!createdTemplateId) {
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/admin/task-templates/${createdTemplateId}`,
        { headers: { Cookie: adminSession } }
      );

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.template.id).toBe(createdTemplateId);
    });

    test("should return 404 for non-existent template", async () => {
      const response = await fetch(
        `${API_BASE}/api/admin/task-templates/non_existent_id`,
        { headers: { Cookie: adminSession } }
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.code).toBeDefined();
    });

    test("should reject non-admin access", async () => {
      if (!createdTemplateId) {
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/admin/task-templates/${createdTemplateId}`
      );

      expect(response.status).toBe(401);
    });
  });
});
