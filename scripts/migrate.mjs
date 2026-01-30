// Migration script - ES Module version
import { Database } from "bun:sqlite";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const dbPath = resolve(process.cwd(), "database/db.sqlite");
console.log("Database path:", dbPath);

const db = new Database(dbPath);
console.log("✅ Database opened");

// 获取最新的迁移文件
const migrationsDir = resolve(process.cwd(), "database/migrations");
const files = readdirSync(migrationsDir)
  .filter(f => f.endsWith(".sql"))
  .sort();

const latestMigration = files[files.length - 1];
console.log("Using migration:", latestMigration);

const sql = readFileSync(resolve(migrationsDir, latestMigration), "utf-8");
const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(s => s);

let success = 0;
let skipped = 0;

for (const stmt of statements) {
  try {
    db.exec(stmt);
    success++;
  } catch (e) {
    if (e.message.includes("already exists")) {
      skipped++;
    } else {
      console.error("❌", e.message);
    }
  }
}

console.log(`✅ Migration complete: ${success} created, ${skipped} skipped`);
db.close();
