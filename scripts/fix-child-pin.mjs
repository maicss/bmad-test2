// 修复儿童PIN码
import { Database } from "bun:sqlite";
import { resolve } from "path";

const dbPath = resolve(process.cwd(), "database/db.sqlite");
const db = new Database(dbPath);

console.log("🔧 修复儿童PIN码\n");

// 使用Bun.password为儿童创建正确的PIN哈希
const childPhone = null; // 儿童没有手机号
const childName = "Zhang 3";
const pin = "1111";

// 生成正确的PIN哈希
const pinHash = await Bun.password.hash(pin, {
  algorithm: "bcrypt",
  cost: 10,
});

console.log(`PIN: ${pin}`);
console.log(`Hash: ${pinHash}`);

// 更新数据库
try {
  db.run("UPDATE user SET pin_hash = ? WHERE name = ?", [pinHash, childName]);
  console.log(`\n✅ 已更新 ${childName} 的PIN哈希`);
} catch (e) {
  console.error(`\n❌ 更新失败: ${e.message}`);
}

// 验证
try {
  const user = db.query("SELECT pin_hash FROM user WHERE name = ?").get(childName);
  if (user && user.pin_hash) {
    const isValid = await Bun.password.verify(pin, user.pin_hash);
    console.log(`\n验证结果: ${isValid ? "✅ PIN验证成功" : "❌ PIN验证失败"}`);
  }
} catch (e) {
  console.error(`\n验证失败: ${e.message}`);
}

db.close();
