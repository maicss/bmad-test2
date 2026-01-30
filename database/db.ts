/**
 * Database Connection
 * 
 * 使用 Bun 内置的 SQLite 驱动
 * 与 Drizzle ORM 集成
 * 
 * 注意：直接使用 bun:sqlite，不在构建时执行
 */

// @ts-ignore - bun:sqlite is Bun native module
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "@/lib/db/schema";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// 确保数据库目录存在
const dbPath = "database/db.sqlite";

// ============================================================
// Migration System
// ============================================================

const MIGRATIONS_DIR = "database/migrations";
const MIGRATION_TABLE = "__drizzle_migrations";

/**
 * Run pending migrations on database startup
 */
function runMigrations(db: Database): void {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL
      );
    `);

    const migrationFiles = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const appliedMigrations = db
      .query(`SELECT name FROM ${MIGRATION_TABLE}`)
      .all() as { name: string }[];
    const appliedNames = new Set(appliedMigrations.map(m => m.name));

    const isFirstMigration = appliedMigrations.length === 0;
    const firstMigrationFile = migrationFiles[0];

    if (isFirstMigration && firstMigrationFile) {
      try {
        db.query(`SELECT 1 FROM account LIMIT 1`).get();
        console.log("⚠️  Database already has schema, marking initial migration as applied");
        const timestamp = Date.now();
        db.query(
          `INSERT INTO ${MIGRATION_TABLE} (name, applied_at) VALUES (?, ?)`
        ).run(firstMigrationFile, timestamp);
        appliedNames.add(firstMigrationFile);
      } catch {
        // Table doesn't exist, proceed with migration
      }
    }

    // Run pending migrations
    let migrationsRun = 0;
    for (const file of migrationFiles) {
      if (!appliedNames.has(file)) {
        console.log(`🔄 Applying migration: ${file}`);
        
        // Read migration SQL
        const migrationPath = join(process.cwd(), MIGRATIONS_DIR, file);
        const sql = readFileSync(migrationPath, 'utf-8');

        // Remove Drizzle comment markers
        const cleanedSql = sql.replace(/--> statement-breakpoint/g, '');

        // Execute migration
        db.exec("BEGIN TRANSACTION");
        try {
          db.exec(cleanedSql);
          
          // Record migration as applied
          const timestamp = Date.now();
          db.query(
            `INSERT INTO ${MIGRATION_TABLE} (name, applied_at) VALUES (?, ?)`
          ).run(file, timestamp);
          
          db.exec("COMMIT");
          console.log(`✅ Migration applied: ${file}`);
          migrationsRun++;
        } catch (error) {
          db.exec("ROLLBACK");
          console.error(`❌ Migration failed: ${file}`, error);
          throw error;
        }
      }
    }

    if (migrationsRun === 0) {
      console.log("✅ All migrations up to date");
    }
  } catch (error) {
    console.error("❌ Migration system error:", error);
    // Don't throw - allow app to start even if migrations fail
    // in development this can be useful
  }
}

// ============================================================
// Database Initialization
// ============================================================

// 立即初始化数据库（服务器启动时）
let rawDbInstance: Database;
let dbInstance: ReturnType<typeof drizzle<typeof schema>>;

try {
  rawDbInstance = new Database(dbPath);
  rawDbInstance.exec("PRAGMA journal_mode = WAL");
  rawDbInstance.exec("PRAGMA foreign_keys = ON");
  
  // Run pending migrations
  runMigrations(rawDbInstance);
  
  dbInstance = drizzle(rawDbInstance, { schema });
  
  console.log("✅ Database initialized on module load");
} catch (error) {
  console.error("❌ Failed to initialize database:", error);
  // 提供空实例避免崩溃
  rawDbInstance = {} as Database;
  dbInstance = {} as ReturnType<typeof drizzle<typeof schema>>;
}

/**
 * Drizzle ORM 数据库实例
 * 同步获取（已预初始化）
 */
export function getDb() {
  return dbInstance;
}

/**
 * 原始 SQLite 数据库实例
 * 同步获取（已预初始化）
 */
export function getRawDb() {
  return rawDbInstance;
}

// 导出 schema 用于类型
export { schema };

/**
 * 数据库连接状态检查
 */
export function checkDbConnection(): boolean {
  try {
    rawDbInstance.exec("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

/**
 * 关闭数据库连接
 */
export function closeDb(): void {
  if (rawDbInstance && typeof rawDbInstance.close === 'function') {
    rawDbInstance.close();
  }
}
