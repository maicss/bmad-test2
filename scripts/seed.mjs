/**
 * Seed Test Data
 * 
 * 根据 AGENTS.md 中的测试数据规范创建初始数据
 */

import { Database } from "bun:sqlite";
import { resolve } from "path";

const dbPath = resolve(process.cwd(), "database/db.sqlite");
const db = new Database(dbPath);

console.log("🌱 开始创建测试数据...\n");

// 生成 UUID
function generateId() {
  return crypto.randomUUID();
}

// 当前时间
const now = Date.now();

// 测试数据定义 (根据 AGENTS.md)
const testData = {
  users: [
    {
      id: generateId(),
      name: "admin",
      email: null,
      emailVerified: 1,
      image: null,
      role: "admin",
      phone: "13800000001",
      gender: "male",
      pinHash: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: "Zhang 1",
      email: null,
      emailVerified: 1,
      image: null,
      role: "parent",
      phone: "13800000100",
      gender: "male",
      pinHash: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: "Zhang 3",
      email: null,
      emailVerified: 1,
      image: null,
      role: "child",
      phone: null,
      gender: "male",
      pinHash: "$2a$10$hashedpin1111", // 模拟哈希值
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: "Zhang 2",
      email: null,
      emailVerified: 1,
      image: null,
      role: "parent",
      phone: "12800000200",
      gender: "male",
      pinHash: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: "Li 1",
      email: null,
      emailVerified: 1,
      image: null,
      role: "parent",
      phone: "13800000300",
      gender: "male",
      pinHash: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: "Li 2",
      email: null,
      emailVerified: 1,
      image: null,
      role: "parent",
      phone: "13800000400",
      gender: "male",
      pinHash: null,
      createdAt: now,
      updatedAt: now,
    },
  ],
};

try {
  // 插入用户
  console.log("👤 创建用户...");
  const userStmt = db.prepare(`
    INSERT INTO user (id, name, email, email_verified, image, role, phone, gender, pin_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const user of testData.users) {
    try {
      userStmt.run(
        user.id,
        user.name,
        user.email,
        user.emailVerified,
        user.image,
        user.role,
        user.phone,
        user.gender,
        user.pinHash,
        user.createdAt,
        user.updatedAt
      );
      console.log(`   ✅ ${user.name} (${user.role})`);
    } catch (e) {
      console.error(`   ❌ ${user.name}: ${e.message}`);
    }
  }
  userStmt.finalize();

  // 创建家庭
  console.log("\n🏠 创建家庭...");
  const familyId1 = generateId();
  const familyId2 = generateId();

  db.run(`
    INSERT INTO family (id, name, invite_code, settings, created_at, updated_at)
    VALUES (?, '张家', 'FAMILY001', NULL, ?, ?)
  `, [familyId1, now, now]);

  db.run(`
    INSERT INTO family (id, name, invite_code, settings, created_at, updated_at)
    VALUES (?, '李家', 'FAMILY002', NULL, ?, ?)
  `, [familyId2, now, now]);

  console.log(`   ✅ 张家 (ID: ${familyId1})`);
  console.log(`   ✅ 李家 (ID: ${familyId2})`);

  // 关联家庭成员
  console.log("\n👨‍👩‍👧‍👦 关联家庭成员...");
  const memberStmt = db.prepare(`
    INSERT INTO family_member (id, family_id, user_id, role, display_name, current_points, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 获取用户ID
  const users = db.query("SELECT id, name, role FROM user").all();
  
  // 张家成员
  const zhang1 = users.find(u => u.name === "Zhang 1");
  const zhang2 = users.find(u => u.name === "Zhang 2");
  const zhang3 = users.find(u => u.name === "Zhang 3");
  
  if (zhang1) {
    memberStmt.run(generateId(), familyId1, zhang1.id, "primary", "爸爸", 0, now, now);
    console.log("   ✅ 张家 - 爸爸 (primary)");
  }
  if (zhang2) {
    memberStmt.run(generateId(), familyId1, zhang2.id, "secondary", "妈妈", 0, now, now);
    console.log("   ✅ 张家 - 妈妈 (secondary)");
  }
  if (zhang3) {
    memberStmt.run(generateId(), familyId1, zhang3.id, "child", "小宝", 150, now, now);
    console.log("   ✅ 张家 - 小宝 (child, 150积分)");
  }

  // 李家成员
  const li1 = users.find(u => u.name === "Li 1");
  const li2 = users.find(u => u.name === "Li 2");
  
  if (li1) {
    memberStmt.run(generateId(), familyId2, li1.id, "primary", "爸爸", 0, now, now);
    console.log("   ✅ 李家 - 爸爸 (primary)");
  }
  if (li2) {
    memberStmt.run(generateId(), familyId2, li2.id, "secondary", "妈妈", 0, now, now);
    console.log("   ✅ 李家 - 妈妈 (secondary)");
  }

  memberStmt.finalize();

  // 创建任务定义
  console.log("\n📋 创建任务定义...");
  const taskStmt = db.prepare(`
    INSERT INTO task_definition (id, family_id, name, description, category, points, icon, color, is_active, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `);

  const tasks = [
    { name: "完成作业", desc: "按时完成学校作业", cat: "study", points: 10, icon: "book", color: "#3b82f6" },
    { name: "整理房间", desc: "保持房间整洁", cat: "housework", points: 5, icon: "broom", color: "#10b981" },
    { name: "帮忙洗碗", desc: "饭后主动帮忙洗碗", cat: "housework", points: 8, icon: "sparkles", color: "#8b5cf6" },
    { name: "阅读30分钟", desc: "每天阅读至少30分钟", cat: "study", points: 5, icon: "book-open", color: "#f59e0b" },
    { name: "按时睡觉", desc: "晚上9点前上床睡觉", cat: "health", points: 3, icon: "moon", color: "#6366f1" },
  ];

  for (const task of tasks) {
    if (zhang1) {
      taskStmt.run(generateId(), familyId1, task.name, task.desc, task.cat, task.points, task.icon, task.color, zhang1.id, now, now);
    }
  }
  taskStmt.finalize();
  console.log(`   ✅ 创建了 ${tasks.length} 个任务`);

  // 创建愿望
  console.log("\n⭐ 创建愿望...");
  const wishStmt = db.prepare(`
    INSERT INTO wish (id, family_id, member_id, title, description, type, points_required, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 获取小宝的member_id
  const xiaobaoMember = db.query("SELECT id FROM family_member WHERE display_name = '小宝'").get();
  
  if (xiaobaoMember && zhang3) {
    wishStmt.run(generateId(), familyId1, xiaobaoMember.id, "去游乐园", "周末去游乐园玩一天", "activity", 100, "pending", now, now);
    wishStmt.run(generateId(), familyId1, xiaobaoMember.id, "买新玩具", "想要一个新的乐高积木", "item", 50, "approved", now, now);
    console.log("   ✅ 小宝的愿望 x2");
  }
  wishStmt.finalize();

  console.log("\n✅ 测试数据创建完成！");
  console.log("\n测试账号:");
  console.log("  管理员: 13800000001 / 密码: 1111");
  console.log("  家长:   13800000100 / 密码: 1111 (张家)");
  console.log("  儿童:   小宝 / PIN: 1111");

} catch (error) {
  console.error("\n❌ 创建测试数据失败:", error);
} finally {
  db.close();
}
