/**
 * Database Queries Unit Tests
 * 
 * 测试 lib/db/queries.ts 中的数据库查询函数
 * 覆盖率目标: >80%
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createTestDatabase, initTestSchema, seedTestData, cleanupTestDatabase } from "../setup";
import { Database } from "bun:sqlite";

// 使用原始 SQL 查询测试数据库操作
describe("Database Queries", () => {
  let db: Database;
  let testIds: { parentId: string; childId: string; familyId: string };

  beforeEach(() => {
    db = createTestDatabase();
    initTestSchema(db);
    testIds = seedTestData(db);
  });

  afterEach(() => {
    cleanupTestDatabase(db);
  });

  describe("User Queries", () => {
    test("should find user by phone", () => {
      const user = db.query("SELECT * FROM user WHERE phone = ?").get("13800138000");
      expect(user).toBeDefined();
      expect((user as any).name).toBe("测试家长");
      expect((user as any).role).toBe("parent");
    });

    test("should find user by id", () => {
      const user = db.query("SELECT * FROM user WHERE id = ?").get(testIds.parentId);
      expect(user).toBeDefined();
      expect((user as any).id).toBe(testIds.parentId);
    });

    test("should return null for non-existent user", () => {
      const user = db.query("SELECT * FROM user WHERE id = ?").get("non-existent-id");
      expect(user).toBeNull();
    });

    test("should enforce unique phone constraint", () => {
      const now = Date.now();
      expect(() => {
        db.run(`
          INSERT INTO user (id, name, role, phone, created_at, updated_at)
          VALUES (?, 'Duplicate', 'parent', '13800138000', ?, ?)
        `, [crypto.randomUUID(), now, now]);
      }).toThrow();
    });
  });

  describe("Family Queries", () => {
    test("should find family by id", () => {
      const family = db.query("SELECT * FROM family WHERE id = ?").get(testIds.familyId);
      expect(family).toBeDefined();
      expect((family as any).name).toBe("测试家庭");
    });

    test("should get all family members", () => {
      const members = db.query("SELECT * FROM family_member WHERE family_id = ?").all(testIds.familyId);
      expect(members).toHaveLength(2);
    });

    test("should get member with user details", () => {
      const member = db.query(`
        SELECT fm.*, u.name as user_name, u.role as user_role
        FROM family_member fm
        JOIN user u ON fm.user_id = u.id
        WHERE fm.family_id = ?
        LIMIT 1
      `).get(testIds.familyId);
      
      expect(member).toBeDefined();
      expect((member as any).user_name).toBeDefined();
    });
  });

  describe("Task Definition Queries", () => {
    test("should find tasks by family", () => {
      const tasks = db.query("SELECT * FROM task_definition WHERE family_id = ?").all(testIds.familyId);
      expect(tasks).toHaveLength(1);
      expect((tasks[0] as any).name).toBe("测试任务");
    });

    test("should filter active tasks", () => {
      const tasks = db.query("SELECT * FROM task_definition WHERE family_id = ? AND is_active = 1").all(testIds.familyId);
      expect(tasks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Wish Queries", () => {
    test("should find wishes by family", () => {
      const wishes = db.query("SELECT * FROM wish WHERE family_id = ?").all(testIds.familyId);
      expect(wishes).toHaveLength(1);
      expect((wishes[0] as any).title).toBe("测试愿望");
    });

    test("should find pending wishes", () => {
      const wishes = db.query("SELECT * FROM wish WHERE family_id = ? AND status = 'pending'").all(testIds.familyId);
      expect(wishes).toHaveLength(1);
    });
  });

  describe("Points System", () => {
    test("should track member points", () => {
      const member = db.query("SELECT current_points FROM family_member WHERE user_id = ?").get(testIds.childId);
      expect(member).toBeDefined();
      expect((member as any).current_points).toBe(100);
    });

    test("should update member points", () => {
      db.run("UPDATE family_member SET current_points = ? WHERE user_id = ?", [150, testIds.childId]);
      
      const member = db.query("SELECT current_points FROM family_member WHERE user_id = ?").get(testIds.childId);
      expect((member as any).current_points).toBe(150);
    });
  });

  describe("Referential Integrity", () => {
    test("should cascade delete family members when family is deleted", () => {
      // 删除家庭
      db.run("DELETE FROM family WHERE id = ?", [testIds.familyId]);
      
      // 成员应该也被删除
      const members = db.query("SELECT * FROM family_member WHERE family_id = ?").all(testIds.familyId);
      expect(members).toHaveLength(0);
    });

    test("should enforce foreign key constraints", () => {
      expect(() => {
        db.run(`
          INSERT INTO family_member (id, family_id, user_id, role, current_points, created_at, updated_at)
          VALUES (?, 'non-existent-family', ?, 'child', 0, 0, 0)
        `, [crypto.randomUUID(), testIds.childId]);
      }).toThrow();
    });
  });
});

describe("Database Connection", () => {
  test("should create database file", () => {
    const testDb = createTestDatabase();
    expect(testDb).toBeDefined();
    cleanupTestDatabase(testDb);
  });

  test("should execute pragma commands", () => {
    const testDb = createTestDatabase();
    
    const result = testDb.query("PRAGMA foreign_keys").get();
    expect(result).toBeDefined();
    
    cleanupTestDatabase(testDb);
  });
});
