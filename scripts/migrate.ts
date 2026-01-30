/**
 * Database Migration Script
 *
 * 使用 bun:sqlite 执行迁移
 * 不依赖 better-sqlite3 或 @libsql/client
 */

import { Database } from "bun:sqlite";
import { readFileSync } from "fs";
import { join } from "path";

const dbPath = "./database/db.sqlite";
const migrationPath = "./database/migrations/0000_absent_cloak.sql";

console.log("🚀 开始执行数据库迁移...\n");

try {
  // 创建数据库连接
  const db = new Database(dbPath);

  // 启用外键约束
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");

  // 读取迁移文件
  const migrationSQL = readFileSync(migrationPath, "utf-8");

  // 分割 SQL 语句（按 statement-breakpoint 分割）
  const statements = migrationSQL
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`📄 找到 ${statements.length} 个 SQL 语句\n`);

  // 执行每个语句
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.split("\n")[0].substring(0, 50);

    try {
      db.exec(statement);
      console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
      successCount++;
    } catch (error) {
      // 如果表已存在，则跳过错误
      if (error instanceof Error && error.message.includes("already exists")) {
        console.log(`⚠️  [${i + 1}/${statements.length}] ${preview}... (已存在，跳过)`);
        successCount++;
      } else {
        console.error(`❌ [${i + 1}/${statements.length}] ${preview}...`);
        console.error(`   错误: ${error instanceof Error ? error.message : error}`);
        errorCount++;
      }
    }
  }

  // 创建迁移记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL UNIQUE,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `);

  // 记录本次迁移
  const migrationHash = "0000_absent_cloak";
  try {
    db.run(
      `INSERT INTO __drizzle_migrations (hash) VALUES (?)`,
      [migrationHash]
    );
    console.log(`\n📝 迁移记录已保存: ${migrationHash}`);
  } catch {
    console.log(`\n📝 迁移记录已存在: ${migrationHash}`);
  }

  // 关闭数据库
  db.close();

  console.log("\n" + "=".repeat(50));
  console.log("✅ 数据库迁移完成!");
  console.log(`   成功: ${successCount} 个语句`);
  console.log(`   失败: ${errorCount} 个语句`);
  console.log(`   数据库: ${dbPath}`);
  console.log("=".repeat(50));

  process.exit(errorCount > 0 ? 1 : 0);
} catch (error) {
  console.error("❌ 迁移失败:", error);
  process.exit(1);
}
