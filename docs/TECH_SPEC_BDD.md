# TECH_SPEC_BDD.md

> 行为驱动开发（BDD）规范 - Given-When-Then 实践指南

---

## 核心原则

### 什么是 BDD

BDD（Behavior-Driven Development）是一种敏捷软件开发技术，鼓励团队使用业务语言描述软件行为，使技术团队和业务团队能够用同一种语言沟通。

### 核心要素

1. **测试先行**：先写测试/规范，后写实现（红-绿-重构）
2. **Given-When-Then**：使用标准格式描述场景
3. **业务语言**：使用领域术语，避免技术术语
4. **测试即文档**：测试代码描述系统行为，是活的文档

---

## Given-When-Then 格式

### 结构说明

```gherkin
Given [前置条件]    - 上下文、初始状态
When [动作/事件]    - 用户行为或系统事件
Then [预期结果]     - 可验证的结果
```

### 示例对比

#### ❌ 传统单元测试（不推荐）

```typescript
// 技术术语，难以理解业务意图
describe('TaskController', () => {
  it('should return 200 and array of tasks', async () => {
    const res = await request(app).get('/api/tasks?familyId=123');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tasks');
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });
});
```

#### ✅ BDD 风格（推荐）

```typescript
// 业务语言，清晰描述用户场景
describe('任务列表查询', () => {
  it('given 家长已登录且该家庭有任务，when 查询任务列表，then 返回该家庭的任务列表', async () => {
    // Given: 前置条件
    const parent = await createParent({ familyId: 'family-001' });
    const task1 = await createTask({ familyId: 'family-001', title: '完成作业' });
    const task2 = await createTask({ familyId: 'family-001', title: '整理房间' });
    await createTask({ familyId: 'family-002', title: '其他家庭的任务' }); // 不应返回
    
    // When: 执行动作
    const response = await request(app)
      .get('/api/tasks?familyId=family-001')
      .set('Cookie', parent.sessionCookie);
    
    // Then: 验证结果
    expect(response.status).toBe(200);
    expect(response.body.tasks).toHaveLength(2);
    expect(response.body.tasks.map(t => t.title)).toContain('完成作业');
    expect(response.body.tasks.map(t => t.title)).toContain('整理房间');
  });
});
```

---

## 命名规范

### 测试文件命名

```
__tests__/
├── unit/                                    # 单元测试
│   └── calculate-points.test.ts            # 纯函数测试
├── integration/                             # 集成测试（BDD 主力）
│   └── task-lifecycle.test.ts              # 任务生命周期
├── e2e/                                     # E2E 测试
│   └── parent-creates-task.spec.ts         # 家长创建任务
└── bdd/                                     # BDD 场景文件（可选）
    └── task-management.feature.ts          # 按功能组织
```

### 测试描述命名

#### ❌ 避免使用

- ❌ `it('should return 200')` - 技术术语，无业务含义
- ❌ `it('test 1')` - 无描述
- ❌ `it('database query works')` - 实现细节
- ❌ `it('handle edge case')` - 模糊描述

#### ✅ 推荐使用

- ✅ `it('given 家长已登录，when 创建任务，then 任务成功创建并生成待办')`
- ✅ `it('given 儿童完成任务，when 家长审批通过，then 儿童获得积分')`
- ✅ `it('given 积分不足，when 儿童尝试兑换愿望，then 兑换失败并提示积分不足')`

---

## 实战示例

### 场景 1：任务完成与积分结算

```typescript
// __tests__/integration/task-completion.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { db } from '@/lib/db';
import { createFamily, createParent, createChild, createTask } from '@/__tests__/fixtures';

describe('任务完成与积分结算', () => {
  beforeEach(async () => {
    await db.transaction(async (tx) => {
      await tx.delete(tasks);
      await tx.delete(pointsHistory);
    });
  });

  it('given 儿童完成了任务且家长审批通过，when 审批完成后，then 儿童获得对应的积分', async () => {
    // Given
    const family = await createFamily();
    const parent = await createParent({ familyId: family.id });
    const child = await createChild({ familyId: family.id });
    const task = await createTask({
      familyId: family.id,
      assigneeId: child.id,
      points: 10,
      status: 'completed', // 儿童已标记完成
    });
    const initialBalance = await getUserBalance(child.id);

    // When
    const response = await request(app)
      .post(`/api/tasks/${task.id}/approve`)
      .set('Cookie', parent.sessionCookie)
      .send({ approved: true });

    // Then
    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('completed');
    
    const newBalance = await getUserBalance(child.id);
    expect(newBalance).toBe(initialBalance + 10);
    
    const history = await getPointsHistory(child.id);
    expect(history[0].reason).toBe('任务完成：完成作业');
    expect(history[0].amount).toBe(10);
  });

  it('given 儿童完成了任务但家长审批拒绝，when 审批完成后，then 儿童不获得积分且任务状态变为已取消', async () => {
    // Given
    const family = await createFamily();
    const parent = await createParent({ familyId: family.id });
    const child = await createChild({ familyId: family.id });
    const task = await createTask({
      familyId: family.id,
      assigneeId: child.id,
      points: 10,
      status: 'completed',
    });
    const initialBalance = await getUserBalance(child.id);

    // When
    const response = await request(app)
      .post(`/api/tasks/${task.id}/approve`)
      .set('Cookie', parent.sessionCookie)
      .send({ approved: false, reason: '完成质量不佳' });

    // Then
    expect(response.status).toBe(200);
    expect(response.body.task.status).toBe('cancelled');
    
    const newBalance = await getUserBalance(child.id);
    expect(newBalance).toBe(initialBalance); // 积分未变化
  });
});
```

### 场景 2：愿望兑换

```typescript
// __tests__/integration/wishlist-redemption.test.ts
describe('愿望兑换', () => {
  it('given 儿童有足够的积分且愿望已激活，when 儿童发起兑换请求，then 扣除积分并标记愿望为待履行', async () => {
    // Given
    const family = await createFamily();
    const parent = await createParent({ familyId: family.id });
    const child = await createChild({ familyId: family.id });
    
    // 给儿童 100 积分
    await addPoints(child.id, 100, '初始积分');
    
    // 创建已激活的愿望
    const wishlist = await createWishlist({
      familyId: family.id,
      createdBy: parent.id,
      title: '去游乐园',
      points: 50,
      status: 'activated',
    });

    // When
    const response = await request(app)
      .post(`/api/wishlists/${wishlist.id}/redeem`)
      .set('Cookie', child.sessionCookie);

    // Then
    expect(response.status).toBe(200);
    expect(response.body.wishlist.status).toBe('redeemed');
    
    const balance = await getUserBalance(child.id);
    expect(balance).toBe(50); // 100 - 50
  });

  it('given 儿童积分不足，when 儿童尝试兑换愿望，then 兑换失败并提示积分不足', async () => {
    // Given
    const family = await createFamily();
    const child = await createChild({ familyId: family.id });
    await addPoints(child.id, 30, '初始积分'); // 只有 30 分
    
    const wishlist = await createWishlist({
      familyId: family.id,
      title: '去游乐园',
      points: 50, // 需要 50 分
      status: 'activated',
    });

    // When
    const response = await request(app)
      .post(`/api/wishlists/${wishlist.id}/redeem`)
      .set('Cookie', child.sessionCookie);

    // Then
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INSUFFICIENT_POINTS');
    expect(response.body.error.message).toContain('积分不足');
    
    const balance = await getUserBalance(child.id);
    expect(balance).toBe(30); // 积分未扣除
  });
});
```

### 场景 3：多儿童场景（数据隔离）

```typescript
// __tests__/integration/multi-child-isolation.test.ts
describe('多儿童数据隔离', () => {
  it('given 同一家庭有两个儿童，when 儿童A查看任务列表时，then 只能看到自己的任务，看不到儿童B的任务', async () => {
    // Given
    const family = await createFamily();
    const parent = await createParent({ familyId: family.id });
    const childA = await createChild({ familyId: family.id, name: 'Zhang 3' });
    const childB = await createChild({ familyId: family.id, name: 'Zhang 4' });
    
    const taskForA = await createTask({
      familyId: family.id,
      assigneeId: childA.id,
      title: '儿童A的任务',
    });
    
    const taskForB = await createTask({
      familyId: family.id,
      assigneeId: childB.id,
      title: '儿童B的任务',
    });

    // When
    const response = await request(app)
      .get(`/api/tasks?assigneeId=${childA.id}`)
      .set('Cookie', childA.sessionCookie);

    // Then
    expect(response.status).toBe(200);
    expect(response.body.tasks).toHaveLength(1);
    expect(response.body.tasks[0].title).toBe('儿童A的任务');
    expect(response.body.tasks[0].title).not.toBe('儿童B的任务');
  });
});
```

---

## 测试组织策略

### 按用户故事组织

```typescript
// __tests__/integration/user-stories/
describe('用户故事：家长日常管理流程', () => {
  it('场景1：家长早晨设置今日任务', async () => { ... });
  it('场景2：家长晚间审批儿童完成的任务', async () => { ... });
  it('场景3：家长查看儿童今日表现', async () => { ... });
});

describe('用户故事：儿童日常行为流程', () => {
  it('场景1：儿童起床查看今日任务', async () => { ... });
  it('场景2：儿童完成任务获得积分', async () => { ... });
  it('场景3：儿童使用积分兑换愿望', async () => { ... });
});
```

### 按业务领域组织

```
__tests__/integration/
├── auth/                           # 认证相关
│   ├── parent-login.test.ts
│   └── child-pin-login.test.ts
├── task-management/                # 任务管理
│   ├── create-task.test.ts
│   ├── complete-task.test.ts
│   └── approve-task.test.ts
├── points/                         # 积分系统
│   ├── earn-points.test.ts
│   └── points-history.test.ts
└── wishlist/                       # 愿望单
    ├── create-wishlist.test.ts
    └── redeem-wishlist.test.ts
```

---

## 开发工作流程

### 红-绿-重构循环

```
1. 红（Red）
   └── 编写失败的 BDD 测试
       └── 明确描述期望的业务行为

2. 绿（Green）
   └── 编写最简单的代码使测试通过
       └── 不追求完美，先让测试变绿

3. 重构（Refactor）
   └── 优化代码结构
       └── 保持测试通过的前提下改进设计
```

### 实际开发步骤示例

**需求**：家长可以为儿童创建任务

```typescript
// 步骤 1：编写失败的测试（Red）
// __tests__/integration/create-task.test.ts

describe('创建任务', () => {
  it('given 家长已登录，when 创建任务时，then 任务成功创建', async () => {
    // Given
    const parent = await createParent();
    
    // When
    const response = await request(app)
      .post('/api/tasks')
      .set('Cookie', parent.sessionCookie)
      .send({
        title: '完成作业',
        points: 10,
        assigneeId: 'child-123',
      });
    
    // Then
    expect(response.status).toBe(201);
    expect(response.body.task.title).toBe('完成作业');
  });
});

// 运行测试 → 失败（Red）
```

```typescript
// 步骤 2：编写实现使测试通过（Green）
// app/api/tasks/route.ts

export async function POST(request: Request) {
  const user = await verifyAuth(request);
  if (!user || user.role !== 'parent') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  
  const [task] = await db.insert(tasks).values({
    title: body.title,
    points: body.points,
    assigneeId: body.assigneeId,
    status: 'pending',
  }).returning();
  
  return Response.json({ task }, { status: 201 });
}

// 运行测试 → 通过（Green）
```

```typescript
// 步骤 3：重构代码（Refactor）
// - 提取验证逻辑到中间件
// - 提取业务逻辑到 service 层
// - 优化错误处理

// lib/services/task-service.ts
export async function createTask(data: CreateTaskDto, parentId: string) {
  // 验证家长权限
  await verifyParentAccess(parentId, data.assigneeId);
  
  // 创建任务
  const [task] = await db.insert(tasks).values({
    ...data,
    status: 'pending',
    createdBy: parentId,
  }).returning();
  
  return task;
}

// 运行测试 → 仍然通过（保持 Green）
```

---

## 业务术语表

使用一致的领域术语，避免技术术语：

| 业务术语 | 说明 | 避免使用的技术术语 |
|----------|------|-------------------|
| 家长 | 家庭管理员 | user, admin, account |
| 儿童 | 任务执行者 | child-user, assignee |
| 任务 | 需要完成的事项 | task-record, entity |
| 积分 | 奖励点数 | points-value, score |
| 愿望 | 想要兑换的奖励 | wishlist-item, reward |
| 审批 | 家长确认任务完成 | approve-action, verify |
| 家庭 | 用户组 | group, tenant |

---

## 扩展阅读

- [BDD 官方文档](https://cucumber.io/docs/bdd/)
- [Given-When-Then 指南](https://www.martinfowler.com/bliki/GivenWhenThen.html)
- [TECH_SPEC_TESTING.md](./TECH_SPEC_TESTING.md) - 测试策略
- [AGENTS.md](../AGENTS.md) - AI 代理快速参考
