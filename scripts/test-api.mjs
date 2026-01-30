/**
 * API 测试脚本
 * 验证所有 API 端点
 */

const BASE_URL = "http://localhost:3344";

// 测试数据
const testData = {
  parent: {
    phone: "13800000100",
    password: "1111",
  },
  admin: {
    phone: "13800000001",
    password: "1111",
  },
};

const results = [];

async function testAPI(name, method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json().catch(() => null);

    const result = {
      name,
      endpoint,
      method,
      status: response.status,
      success: response.ok,
      data: data,
    };
    results.push(result);

    const statusEmoji = response.ok ? "✅" : "❌";
    console.log(`${statusEmoji} ${name}`);
    console.log(`   ${method} ${endpoint} - HTTP ${response.status}`);
    if (data && (data.error || data.message)) {
      console.log(`   ${data.error || data.message}`);
    }
    console.log();

    return result;
  } catch (error) {
    const result = {
      name,
      endpoint,
      method,
      status: 0,
      success: false,
      error: error.message,
    };
    results.push(result);
    console.log(`❌ ${name}`);
    console.log(`   ${method} ${endpoint} - Error: ${error.message}`);
    console.log();
    return result;
  }
}

console.log("🧪 Family Reward API 测试\n");
console.log("=" .repeat(50));
console.log();

// 1. 认证 API
console.log("📌 认证 API\n");

await testAPI("家长登录", "POST", "/api/auth/parent-login", testData.parent);
await testAPI("管理员登录", "POST", "/api/auth/parent-login", testData.admin);
await testAPI("错误密码登录", "POST", "/api/auth/parent-login", {
  phone: "13800000100",
  password: "wrong",
});
await testAPI("无效手机号", "POST", "/api/auth/parent-login", {
  phone: "123",
  password: "1111",
});

// 2. 儿童登录 API (需要儿童ID)
console.log("📌 儿童登录 API\n");

// 先用数据库查询获取儿童ID
const { Database } = await import("bun:sqlite");
const { resolve } = await import("path");
const db = new Database(resolve(process.cwd(), "database/db.sqlite"));
const child = db.query("SELECT id FROM user WHERE name = 'Zhang 3'").get();

if (child) {
  await testAPI("儿童PIN登录", "POST", "/api/auth/child-login", {
    userId: child.id,
    pin: "1111",
  });
  await testAPI("儿童错误PIN", "POST", "/api/auth/child-login", {
    userId: child.id,
    pin: "9999",
  });
} else {
  console.log("❌ 未找到儿童用户\n");
}
db.close();

// 3. 业务 API (需要认证，会返回401)
console.log("📌 业务 API (需要认证)\n");

await testAPI("获取任务列表", "GET", "/api/tasks?familyId=test");
await testAPI("获取积分汇总", "GET", "/api/points?familyId=test");
await testAPI("获取积分历史", "GET", "/api/points/history?familyId=test");
await testAPI("获取愿望列表", "GET", "/api/wishes?familyId=test");

// 4. 会话检查 API
console.log("📌 会话检查 API\n");

await testAPI("检查会话状态", "POST", "/api/auth/session-check", {
  sessionId: "test-session-id",
});

// 汇总
console.log("=" .repeat(50));
console.log("\n📊 测试汇总\n");

const passed = results.filter((r) => r.success).length;
const failed = results.filter((r) => !r.success).length;

console.log(`✅ 通过: ${passed}`);
console.log(`❌ 失败: ${failed}`);
console.log(`📈 总计: ${results.length}`);
console.log();

if (failed > 0) {
  console.log("失败的测试:");
  results
    .filter((r) => !r.success)
    .forEach((r) => {
      console.log(`  ❌ ${r.name} - HTTP ${r.status}`);
    });
}
