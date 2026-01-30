/**
 * Database migration fix script
 * Run this to ensure family table has all required columns
 */

import { Database } from "bun:sqlite";

const dbPath = "database/db.sqlite";

try {
  const db = new Database(dbPath);
  
  console.log("🔍 Checking family table schema...");
  
  // Check if columns exist
  const tableInfo = db.query("PRAGMA table_info(family)").all() as Array<{
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
  }>;
  
  const existingColumns = new Set(tableInfo.map(col => col.name));
  
  console.log("📋 Existing columns:", Array.from(existingColumns).join(", "));
  
  const requiredColumns = [
    { name: "max_parents", type: "integer", default: "2", notnull: true },
    { name: "max_children", type: "integer", default: "1", notnull: true },
    { name: "validity_months", type: "integer", default: "12", notnull: true },
    { name: "invite_code_expires_at", type: "integer", default: null, notnull: false },
    { name: "registration_type", type: "text", default: "'self'", notnull: true },
    { name: "status", type: "text", default: "'pending'", notnull: true },
    { name: "submitted_at", type: "integer", default: null, notnull: false },
    { name: "reviewed_at", type: "integer", default: null, notnull: false },
    { name: "reviewed_by", type: "text", default: null, notnull: false },
    { name: "rejection_reason", type: "text", default: null, notnull: false },
  ];
  
  let addedCount = 0;
  
  for (const col of requiredColumns) {
    if (!existingColumns.has(col.name)) {
      console.log(`➕ Adding column: ${col.name}`);
      
      let sql = `ALTER TABLE family ADD COLUMN ${col.name} ${col.type}`;
      
      if (col.default !== null) {
        sql += ` DEFAULT ${col.default}`;
      }
      
      if (col.notnull) {
        sql += ` NOT NULL`;
      }
      
      try {
        db.exec(sql);
        console.log(`✅ Column ${col.name} added successfully`);
        addedCount++;
      } catch (error) {
        console.error(`❌ Failed to add column ${col.name}:`, error);
      }
    } else {
      console.log(`✓ Column ${col.name} already exists`);
    }
  }
  
  if (addedCount > 0) {
    console.log(`\n✅ Added ${addedCount} column(s) successfully`);
  } else {
    console.log("\n✅ All columns already exist - no changes needed");
  }
  
  // Verify final schema
  const finalInfo = db.query("PRAGMA table_info(family)").all() as Array<{ name: string }>;
  console.log("\n📋 Final family table columns:");
  finalInfo.forEach((col, idx) => {
    console.log(`  ${idx + 1}. ${col.name}`);
  });
  
  db.close();
  console.log("\n🎉 Database check complete!");
  
} catch (error) {
  console.error("❌ Database check failed:", error);
  process.exit(1);
}
