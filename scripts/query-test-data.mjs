// 查询测试数据
import { Database } from "bun:sqlite";
import { resolve } from "path";

const dbPath = resolve(process.cwd(), "database/db.sqlite");
const db = new Database(dbPath);

console.log("🔍 查询测试数据\n");

// 查询所有用户
const users = db.query("SELECT id, name, role, phone FROM user").all();
console.log("👤 用户列表:");
for (const user of users) {
  console.log(`   ${user.name} (${user.role}) - ${user.id.substring(0, 8)}...`);
}

// 查询儿童
const child = db.query("SELECT id, name FROM user WHERE name = 'Zhang 3'").get();
if (child) {
  console.log(`\n✅ 找到儿童用户: ${child.name}`);
  console.log(`   ID: ${child.id}`);
  
  // 导出到文件供其他脚本使用
  await Bun.write("./tmp/child_id.txt", child.id);
  console.log("\n📝 儿童ID已保存到: ./tmp/child_id.txt");
}

db.close();
