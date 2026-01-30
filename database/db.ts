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

// 确保数据库目录存在
const dbPath = "database/db.sqlite";

// 立即初始化数据库（服务器启动时）
let rawDbInstance: Database;
let dbInstance: ReturnType<typeof drizzle<typeof schema>>;

try {
  rawDbInstance = new Database(dbPath);
  rawDbInstance.exec("PRAGMA journal_mode = WAL");
  rawDbInstance.exec("PRAGMA foreign_keys = ON");
  
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
