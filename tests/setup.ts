import { Database } from "bun:sqlite";
import { resolve } from "path";

export const TEST_DB_PATH = resolve(process.cwd(), "database/test.db");

export function createTestDatabase(): Database {
  // Create in-memory database for testing
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys = ON");

  return db;
}

export function initTestSchema(db: Database): void {
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

export function seedTestData(db: Database): {
  parentId: string;
  childId: string;
  familyId: string;
} {
  const now = Date.now();
  
  const parentId = crypto.randomUUID();
  db.run(`
    INSERT INTO user (id, name, role, phone, created_at, updated_at)
    VALUES (?, '测试家长', 'parent', '13800138000', ?, ?)
  `, [parentId, now, now]);

  const childId = crypto.randomUUID();
  db.run(`
    INSERT INTO user (id, name, role, pin_hash, created_at, updated_at)
    VALUES (?, '测试儿童', 'child', '$2b$10$test', ?, ?)
  `, [childId, now, now]);

  const familyId = crypto.randomUUID();
  db.run(`
    INSERT INTO family (id, name, created_at, updated_at)
    VALUES (?, '测试家庭', ?, ?)
  `, [familyId, now, now]);

  db.run(`
    INSERT INTO family_member (id, family_id, user_id, role, current_points, created_at, updated_at)
    VALUES (?, ?, ?, 'primary', 0, ?, ?)
  `, [crypto.randomUUID(), familyId, parentId, now, now]);

  db.run(`
    INSERT INTO family_member (id, family_id, user_id, role, current_points, created_at, updated_at)
    VALUES (?, ?, ?, 'child', 100, ?, ?)
  `, [crypto.randomUUID(), familyId, childId, now, now]);

  db.run(`
    INSERT INTO task_definition (id, family_id, name, description, category, points, created_by, created_at, updated_at)
    VALUES (?, ?, '测试任务', '这是一个测试任务', 'custom', 10, ?, ?, ?)
  `, [crypto.randomUUID(), familyId, parentId, now, now]);

  const memberId = db.query("SELECT id FROM family_member WHERE user_id = ?").get(childId) as { id: string };
  if (memberId) {
    db.run(`
      INSERT INTO wish (id, family_id, member_id, title, type, points_required, created_at, updated_at)
      VALUES (?, ?, ?, '测试愿望', 'item', 50, ?, ?)
    `, [crypto.randomUUID(), familyId, memberId.id, now, now]);
  }

  return { parentId, childId, familyId };
}

export function cleanupTestDatabase(db: Database): void {
  db.close();
  // In-memory database doesn't need file cleanup
}
