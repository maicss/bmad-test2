/**
 * Database Connection
 * 
 * 使用 Bun 内置的 SQLite 驱动
 * 与 Drizzle ORM 集成
 */

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "@/lib/db/schema";

// 确保数据库目录存在
const dbPath = "database/db.sqlite";

// 创建 SQLite 连接
const sqlite = new Database(dbPath);

// 启用 WAL 模式以获得更好的并发性能
sqlite.exec("PRAGMA journal_mode = WAL");

// 创建 Drizzle ORM 实例
export const db = drizzle(sqlite, { schema });

// 导出原始数据库实例（用于需要直接 SQL 的场景）
export const rawDb = sqlite;

// 导出 schema 用于类型
export { schema };

// 数据库连接状态检查
export function checkDbConnection(): boolean {
  try {
    sqlite.exec("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

// 关闭数据库连接（在应用退出时调用）
export function closeDb(): void {
  sqlite.close();
}
