import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Database } from "bun:sqlite";
import { resolve } from "path";
import { createTestAdminSession, cleanupTestAdminSession } from "./helpers";

const API_BASE = process.env.TEST_API_URL || "http://localhost:3344";
const SERVER_DB_PATH = resolve(process.cwd(), "database/db.sqlite");

let adminSession: string;

describe("Date Strategy Template API", () => {
  let db: Database;
  let adminUserId: string;
  let createdTemplateId: string;

  beforeAll(async () => {
    db = new Database(SERVER_DB_PATH);
    db.exec("PRAGMA foreign_keys = ON");
    
    const session = await createTestAdminSession();
    if (!session) {
      throw new Error("Failed to create test admin session");
    }
    
    adminUserId = session.userId;
    adminSession = session.cookie;
  });

  afterAll(async () => {
    if (db) {
      db.close();
    }
    if (adminUserId) {
      await cleanupTestAdminSession(adminUserId);
    }
  });

  describe("POST /api/admin/date-strategy-templates", () => {
    test("should create date strategy template with valid data", async () => {
      const payload = {
        name: "Spring Festival",
        description: "Spring festival special dates",
        region: "national",
        year: 2026,
        isPublic: true,
        dates: "2026-02-11,2026-02-12,2026-02-13",
      };

      const response = await fetch(`${API_BASE}/api/admin/date-strategy-templates`, {
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
      expect(data.data.name).toBe(payload.name);
      createdTemplateId = data.data.id;
    });

    test("should reject creation without required fields", async () => {
      const payload = { name: "", region: "", year: null, dates: "" };

      const response = await fetch(`${API_BASE}/api/admin/date-strategy-templates`, {
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
      const response = await fetch(`${API_BASE}/api/admin/date-strategy-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test" }),
      });

      expect(response.status).toBe(401);
    });

    test("should create template with copy_count default 0", async () => {
      const payload = {
        name: "Test Copy Count",
        region: "110000",
        year: 2026,
        isPublic: false,
        dates: "2026-03-01",
      };

      const response = await fetch(`${API_BASE}/api/admin/date-strategy-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminSession,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.copyCount || 0).toBe(0);
    });
  });

  describe("GET /api/admin/date-strategy-templates", () => {
    test("should return list of templates", async () => {
      const response = await fetch(`${API_BASE}/api/admin/date-strategy-templates`, {
        headers: { Cookie: adminSession },
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.templates)).toBe(true);
    });

    test("should filter by region", async () => {
      const response = await fetch(
        `${API_BASE}/api/admin/date-strategy-templates?region=national`,
        { headers: { Cookie: adminSession } }
      );

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test("should filter by year", async () => {
      const response = await fetch(
        `${API_BASE}/api/admin/date-strategy-templates?year=2026`,
        { headers: { Cookie: adminSession } }
      );

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe("PUT /api/admin/date-strategy-templates/:id", () => {
    test("should update template successfully when template exists", async () => {
      if (!createdTemplateId) {
        return;
      }

      const payload = {
        name: "Updated Name",
        description: "Updated description",
        region: "national",
        year: 2026,
        isPublic: true,
        dates: "2026-02-11,2026-02-12",
      };

      const response = await fetch(
        `${API_BASE}/api/admin/date-strategy-templates/${createdTemplateId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Cookie: adminSession,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("DELETE /api/admin/date-strategy-templates/:id", () => {
    test("should reject deletion of template with copy_count > 0", async () => {
      if (!createdTemplateId) {
        return;
      }

      db.run(`UPDATE date_strategy_template SET copy_count = 5 WHERE id = ?`, [createdTemplateId]);

      const response = await fetch(
        `${API_BASE}/api/admin/date-strategy-templates/${createdTemplateId}`,
        {
          method: "DELETE",
          headers: { Cookie: adminSession },
        }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBeDefined();

      db.run(`UPDATE date_strategy_template SET copy_count = 0 WHERE id = ?`, [createdTemplateId]);
    });
  });
});

describe("Public Date Strategy API", () => {
  let publicTestSession: string;

  beforeAll(async () => {
    const session = await createTestAdminSession();
    if (session) {
      publicTestSession = session.cookie;
    }
  });

  afterAll(async () => {
  });

  test("GET /api/date-strategy-templates should return public templates", async () => {
    const response = await fetch(`${API_BASE}/api/date-strategy-templates?is_public=true`, {
      headers: { Cookie: publicTestSession },
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.templates)).toBe(true);
  });
});
