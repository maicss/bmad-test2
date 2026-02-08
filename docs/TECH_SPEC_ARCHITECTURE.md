# TECH_SPEC_ARCHITECTURE.md

> 架构设计、目录结构、数据流

---

## 系统架构

### 分层架构

```
┌─────────────────────────────────────────┐
│              用户界面层                  │
│         (Next.js App Router)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │   Web    │ │   PWA    │ │  Mobile  │ │
│  └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              API 路由层                  │
│         (Next.js Route Handlers)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Tasks   │ │   Auth   │ │ Wishlist │ │
│  └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              业务逻辑层                  │
│        (lib/db/queries.ts)               │
│     所有数据库查询抽象层（强制）          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              数据访问层                  │
│           (Drizzle ORM)                  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              数据存储层                  │
│        (bun:sqlite)                      │
│     database/db.sql (Git 跟踪)           │
└─────────────────────────────────────────┘
```

### 关键原则

1. **强制查询抽象层**：所有数据库操作必须通过 `lib/db/queries.ts`
2. **强制 Drizzle ORM**：禁止任何原生 SQL
3. **Server Components 优先**：数据获取在服务端完成
4. **类型安全**：全链路 TypeScript，禁止 `any`

---

## 目录结构详解

### `app/` - Next.js App Router

```
app/
├── api/                        # API 路由
│   ├── auth/                   # Better-Auth 路由
│   │   └── [...all]/route.ts   # 认证回调
│   ├── tasks/                  # 任务 API
│   │   ├── route.ts            # GET /api/tasks
│   │   └── [id]/route.ts       # GET/PUT/DELETE /api/tasks/:id
│   ├── task-plans/             # 计划任务 API
│   ├── wishlists/              # 愿望单 API
│   └── points/                 # 积分 API
├── (dashboard)/                # 路由组（仪表板）
│   ├── layout.tsx              # 仪表板布局
│   ├── page.tsx                # 仪表板首页
│   ├── tasks/                  # 任务页面
│   ├── task-plans/             # 计划任务页面
│   └── wishlists/              # 愿望单页面
├── login/                      # 登录页面
├── layout.tsx                  # 根布局
├── page.tsx                    # 首页（重定向到仪表板）
└── globals.css                 # 全局样式
```

### `lib/` - 工具库

```
lib/
├── db/                         # 数据库（强制通过此目录访问）
│   ├── index.ts                # 数据库连接配置
│   ├── schema.ts               # Drizzle Schema 定义
│   └── queries.ts              # 查询抽象层（⭐ 强制使用）
├── auth/                       # 认证相关
│   ├── index.ts                # Better-Auth 配置
│   └── pin-auth.ts             # PIN 码登录逻辑
├── cache/                      # 缓存逻辑
│   └── redis.ts                # Redis 客户端
└── utils.ts                    # 通用工具函数
```

**重要**：`lib/db/queries.ts` 是唯一允许操作数据库的文件。

### `types/` - 类型定义（按模块命名）

```
types/
├── user.ts                     # 用户相关类型
├── task.ts                     # 任务相关类型
├── wishlist.ts                 # 愿望单类型
├── family.ts                   # 家庭类型
├── points.ts                   # 积分类型
├── dto/                        # DTO 类型（API 层）
│   ├── request/                # 请求体类型
│   │   ├── task.dto.ts
│   │   └── auth.dto.ts
│   └── response/               # 响应类型
│       ├── task.dto.ts
│       └── auth.dto.ts
└── db/                         # 数据库类型（从 schema 导出）
    └── index.ts
```

**命名规则**：所有类型文件按模块命名，如 `task.ts` 而非 `index.ts`。

---

## 核心模块关系

### 任务模块

```
task_plans (计划任务模板)
    ↓ 1:N
tasks (具体任务实例)
    ↓ N:1
users (执行者)
```

**业务规则**：
- 一个计划任务可以生成多个具体任务
- 每个具体任务分配给一个用户（儿童）
- 任务完成需家长审批后才结算积分

### 用户模块

```
families (家庭)
    ↓ 1:N
users (用户)
    ↓ 1:N
points_history (积分历史)
```

**角色定义**：
- `admin`：系统管理员，可创建模板
- `parent`：家长，管理本家庭
- `child`：儿童，执行任务

### 愿望单模块

```
wishlists (愿望单)
    ↓ N:1
users (创建者)
    ↓ N:1
users (审批者) - optional
```

**状态流转**：
```
draft → activated → redeemed → completed
```

---

## 数据流详细说明

### 1. 创建计划任务并生成任务

```typescript
// 流程：
// 1. 家长创建 plan
// 2. 系统根据 dateStrategy 计算有效日期
// 3. 为每个日期生成 task

// lib/db/queries.ts
export async function createTaskPlan(data: CreateTaskPlanDto) {
  // 插入 plan
  const plan = await db.insert(taskPlans).values({...}).returning();
  
  // 生成任务
  const dates = calculateDates(plan.dateStrategyId, plan.dateRange);
  const tasks = dates.map(date => ({
    planId: plan.id,
    dueDate: date,
    // ...
  }));
  
  await db.insert(tasks).values(tasks);
  
  return plan;
}
```

### 2. 任务完成与积分结算

```typescript
// 流程：
// 1. 儿童标记完成
// 2. 家长审批
// 3. 计算积分（考虑 combo）
// 4. 写入积分历史

// lib/db/queries.ts
export async function approveTask(taskId: string, approvedBy: string) {
  return await db.transaction(async (tx) => {
    // 更新任务状态
    await tx.update(tasks)
      .set({ status: 'completed', approvedBy, approvedAt: new Date() })
      .where(eq(tasks.id, taskId));
    
    // 计算积分
    const points = await calculatePointsWithCombo(taskId);
    
    // 写入积分历史
    await tx.insert(pointsHistory).values({
      taskId,
      amount: points,
      // ...
    });
    
    return { taskId, points };
  });
}
```

### 3. 愿望兑换

```typescript
// 流程：
// 1. 儿童发起兑换
// 2. 检查积分余额
// 3. 扣除积分
// 4. 更新愿望状态

// lib/db/queries.ts
export async function redeemWishlist(wishlistId: string, userId: string) {
  return await db.transaction(async (tx) => {
    // 检查余额
    const balance = await getUserBalance(userId);
    const wishlist = await tx.query.wishlists.findFirst({
      where: eq(wishlists.id, wishlistId)
    });
    
    if (balance < wishlist.points) {
      throw new Error('积分不足');
    }
    
    // 扣除积分
    await tx.insert(pointsHistory).values({
      wishlistId,
      amount: -wishlist.points,
      // ...
    });
    
    // 更新愿望状态
    await tx.update(wishlists)
      .set({ status: 'redeemed', redeemedAt: new Date() })
      .where(eq(wishlists.id, wishlistId));
    
    return { wishlistId, deductedPoints: wishlist.points };
  });
}
```

---

## 缓存策略

### Redis 使用场景

| 数据类型 | 缓存策略 | TTL |
|----------|----------|-----|
| 任务列表 | Cache Aside | 5分钟 |
| 用户积分 | Write Through | 1分钟 |
| 会话数据 | 持久化 | 24小时 |
| 日期策略 | Cache Aside | 1小时 |

### 缓存实现示例

```typescript
// lib/cache/redis.ts
import { Redis } from 'ioredis';

const redis = new Redis(Bun.env.REDIS_URL);

export async function getCachedTasks(familyId: string) {
  const key = `tasks:${familyId}`;
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const tasks = await getTasksByFamily(familyId);
  await redis.setex(key, 300, JSON.stringify(tasks)); // 5分钟
  
  return tasks;
}
```

---

## 性能优化

### 数据库优化

1. **索引策略**
   ```typescript
   // 常用查询字段添加索引
   CREATE INDEX idx_tasks_family ON tasks(family_id);
   CREATE INDEX idx_tasks_status ON tasks(status);
   CREATE INDEX idx_tasks_due_date ON tasks(due_date);
   ```

2. **批量操作**
   ```typescript
   // 批量插入
   await db.insert(tasks).values(tasksArray);
   
   // 批量查询
   await db.query.tasks.findMany({
     where: inArray(tasks.id, taskIds)
   });
   ```

3. **连接池**
   ```typescript
   // bun:sqlite 单连接，使用队列处理并发
   const sqlite = new Database(Bun.env.DATABASE_URL);
   sqlite.run('PRAGMA journal_mode = WAL'); // 启用 WAL 模式
   ```

### 前端优化

1. **Server Components 优先**
2. **图片优化**：使用 Next.js Image 组件
3. **代码分割**：路由级别自动分割
4. **PWA 缓存**：Service Worker 缓存静态资源

---

## 扩展阅读

- [TECH_SPEC_DATABASE.md](./TECH_SPEC_DATABASE.md) - 数据库详细设计
- [TECH_SPEC_API.md](./TECH_SPEC_API.md) - API 规范
- [AGENTS.md](../AGENTS.md) - AI 代理快速参考
