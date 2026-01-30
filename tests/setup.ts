/**
 * Test Configuration
 * 
 * Bun 测试框架配置
 * 运行: bun test
 * 覆盖率: bun test --coverage
 */

import { Database } from "bun:sqlite";
import { resolve } from "path";

// 测试数据库路径
export const TEST_DB_PATH = resolve(process.cwd(), "database/test.db");

/**
 * 创建测试数据库实例
 */
export function createTestDatabase(): Database {
  // 删除旧测试数据库
  try {
    Bun.file(TEST_DB_PATH).delete();
  } catch {
    // 文件不存在，忽略
  }
  
  const db = new Database(TEST_DB_PATH);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");
  
  return db;
}

/**
 * 初始化测试数据库表结构
 */
export function initTestSchema(db: Database): void {
  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      email_verified INTEGER DEFAULT 0,
      image TEXT,
      role TEXT DEFAULT 'parent',
      phone TEXT UNIQUE,
      gender TEXT,
      pin_hash TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // 创建家庭表
  db.exec(`
    CREATE TABLE IF NOT EXISTS family (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE,
      invite_code_expires_at INTEGER,
      max_parents INTEGER DEFAULT 2 NOT NULL,
      max_children INTEGER DEFAULT 1 NOT NULL,
      validity_months INTEGER DEFAULT 12 NOT NULL,
      registration_type TEXT DEFAULT 'self' NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      submitted_at INTEGER,
      reviewed_at INTEGER,
      reviewed_by TEXT,
      rejection_reason TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // 创建家庭成员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS family_member (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      display_name TEXT,
      current_points REAL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  // 创建任务定义表
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_definition (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'custom',
      points REAL NOT NULL,
      icon TEXT,
      color TEXT,
      is_active INTEGER DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE
    )
  `);

  // 创建愿望表
  db.exec(`
    CREATE TABLE IF NOT EXISTS wish (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      points_required REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES family_member(id) ON DELETE CASCADE
    )
  `);
}

/**
 * 插入测试数据
 */
export function seedTestData(db: Database): {
  parentId: string;
  childId: string;
  familyId: string;
} {
  const now = Date.now();
  
  // 创建家长
  const parentId = crypto.randomUUID();
  db.run(`
    INSERT INTO user (id, name, role, phone, created_at, updated_at)
    VALUES (?, '测试家长', 'parent', '13800138000', ?, ?)
  `, [parentId, now, now]);

  // 创建儿童
  const childId = crypto.randomUUID();
  db.run(`
    INSERT INTO user (id, name, role, pin_hash, created_at, updated_at)
    VALUES (?, '测试儿童', 'child', '$2b$10$test', ?, ?)
  `, [childId, now, now]);

  // 创建家庭
  const familyId = crypto.randomUUID();
  db.run(`
    INSERT INTO family (id, name, created_at, updated_at)
    VALUES (?, '测试家庭', ?, ?)
  `, [familyId, now, now]);

  // 添加家庭成员
  db.run(`
    INSERT INTO family_member (id, family_id, user_id, role, current_points, created_at, updated_at)
    VALUES (?, ?, ?, 'primary', 0, ?, ?)
  `, [crypto.randomUUID(), familyId, parentId, now, now]);

  db.run(`
    INSERT INTO family_member (id, family_id, user_id, role, current_points, created_at, updated_at)
    VALUES (?, ?, ?, 'child', 100, ?, ?)
  `, [crypto.randomUUID(), familyId, childId, now, now]);

  // 创建任务
  db.run(`
    INSERT INTO task_definition (id, family_id, name, description, category, points, created_by, created_at, updated_at)
    VALUES (?, ?, '测试任务', '这是一个测试任务', 'custom', 10, ?, ?, ?)
  `, [crypto.randomUUID(), familyId, parentId, now, now]);

  // 创建愿望
  const memberId = db.query("SELECT id FROM family_member WHERE user_id = ?").get(childId) as { id: string };
  if (memberId) {
    db.run(`
      INSERT INTO wish (id, family_id, member_id, title, type, points_required, created_at, updated_at)
      VALUES (?, ?, ?, '测试愿望', 'item', 50, ?, ?)
    `, [crypto.randomUUID(), familyId, memberId.id, now, now]);
  }

  return { parentId, childId, familyId };
}

/**
 * 清理测试数据库
 */
export function cleanupTestDatabase(db: Database): void {
  db.close();
  try {
    Bun.file(TEST_DB_PATH).delete();
  } catch {
    // 忽略错误
  }
}
