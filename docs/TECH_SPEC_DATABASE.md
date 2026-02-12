# TECH_SPEC_DATABASE.md

> 数据库设计、Schema、Drizzle ORM 强制使用规范

---

## 强制 Drizzle ORM 规范

### 绝对禁止

```typescript
// ❌ 禁止 - 原生 SQL 查询
const result = db.execute(`SELECT * FROM tasks`);
const result = db.execute(`SELECT * FROM tasks WHERE id = ${id}`);

// ❌ 禁止 - 字符串拼接 SQL（SQL 注入风险）
const result = db.query(`SELECT * FROM tasks WHERE name = '${name}'`);

// ❌ 禁止 - 组件/路由中直接操作数据库
// app/api/tasks/route.ts
export async function GET() {
  const db = new Database('db.sql');  // 禁止
  const result = db.query('...');      // 禁止
}
```

### 必须使用

```typescript
// ✅ 正确 - 使用 Drizzle ORM 查询构建器
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, and, or, inArray, desc } from 'drizzle-orm';

// 查询
const result = await db.query.tasks.findMany({
  where: eq(tasks.familyId, familyId),
  orderBy: desc(tasks.createdAt),
});

// 条件查询
const result = await db.query.tasks.findMany({
  where: and(
    eq(tasks.familyId, familyId),
    eq(tasks.status, 'pending')
  ),
});

// 插入
await db.insert(tasks).values({
  title: '完成作业',
  points: 10,
  familyId: 'family-001',
});

// 更新
await db.update(tasks)
  .set({ status: 'completed' })
  .where(eq(tasks.id, taskId));

// 删除
await db.delete(tasks).where(eq(tasks.id, taskId));

// 事务
await db.transaction(async (tx) => {
  await tx.insert(tasks).values({...});
  await tx.update(users).set({...});
});
```

---

## 数据库配置

### 连接配置

```typescript
// lib/db/index.ts
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

// 数据库路径
const dbPath = Bun.env.DATABASE_URL || './database/db.sql';

// 创建连接
const sqlite = new Database(dbPath);

// 启用 WAL 模式（提高并发性能）
sqlite.run('PRAGMA journal_mode = WAL');
sqlite.run('PRAGMA synchronous = NORMAL');

// 导出 Drizzle 实例
export const db = drizzle(sqlite, { schema });

// 导出类型
export type DB = typeof db;
```

### 多环境配置

由于开发阶段需要换电脑开发，**SQLite 文件使用 Git 跟踪**：

```bash
# 开发环境
database/
├── db.sql              # 开发数据库（Git 跟踪）
└── migrations/         # 迁移脚本（Git 跟踪）
```

**注意**：生产环境部署前应将 `db.sql` 加入 `.gitignore`。

---

## Schema 定义

### 用户表

```typescript
// lib/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  phone: text('phone').unique(),
  pin: text('pin'),                          // 儿童 PIN（哈希）
  password: text('password'),                // 家长密码（哈希）
  role: text('role', { 
    enum: ['admin', 'parent', 'child'] 
  }).notNull(),
  familyId: text('family_id').references(() => families.id),
  name: text('name').notNull(),
  avatar: text('avatar'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  family: one(families, { 
    fields: [users.familyId], 
    references: [families.id] 
  }),
  tasks: many(tasks),
  wishlists: many(wishlists),
  pointsHistory: many(pointsHistory),
}));
```

### 家庭表

```typescript
export const families = sqliteTable('families', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  region: text('region').notNull().default('全国'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const familiesRelations = relations(families, ({ many }) => ({
  members: many(users),
  taskPlans: many(taskPlans),
  wishlists: many(wishlists),
}));
```

### 计划任务表

```typescript
export const taskPlans = sqliteTable('task_plans', {
  id: text('id').primaryKey(),
  isTemplate: integer('is_template', { mode: 'boolean' })
    .notNull()
    .default(false),
  familyId: text('family_id').references(() => families.id),
  templateId: text('template_id').references(() => taskPlans.id),
  name: text('name').notNull(),
  description: text('description'),
  taskName: text('task_name').notNull(),
  category: text('category', { 
    enum: ['学习', '家务', '行为'] 
  }),
  points: integer('points').notNull(),       // 可为负数（惩罚）
  imageType: text('image_type', { 
    enum: ['icon', 'upload'] 
  }).notNull(),
  color: text('color'),
  image: text('image'),
  borderStyle: text('border_style'),
  status: text('status', { 
    enum: ['active', 'suspend', 'noTask', 'deleted', 'noExecutor', 'published', 'unpublished'] 
  }).notNull().default('noTask'),
  comboEnabled: integer('combo_enabled', { mode: 'boolean' }).default(false),
  comboConfig: text('combo_config', { mode: 'json' }),  // JSON 配置
  dateRangeStart: integer('date_range_start', { mode: 'timestamp' }),
  dateRangeEnd: integer('date_range_end', { mode: 'timestamp' }),
  dateStrategyId: text('date_strategy_id').references(() => dateStrategies.id),
  ageMin: integer('age_min'),
  ageMax: integer('age_max'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const taskPlansRelations = relations(taskPlans, ({ one, many }) => ({
  family: one(families, { 
    fields: [taskPlans.familyId], 
    references: [families.id] 
  }),
  dateStrategy: one(dateStrategies, { 
    fields: [taskPlans.dateStrategyId], 
    references: [dateStrategies.id] 
  }),
  tasks: many(tasks),
}));
```

### 具体任务表

```typescript
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  planId: text('plan_id')
    .notNull()
    .references(() => taskPlans.id),
  assigneeId: text('assignee_id')
    .notNull()
    .references(() => users.id),
  status: text('status', { 
    enum: ['pending', 'completed', 'cancelled', 'expired'] 
  }).notNull().default('pending'),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  completedBy: text('completed_by').references(() => users.id),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  approvedBy: text('approved_by').references(() => users.id),
  actualPoints: integer('actual_points'),  // 实际获得积分
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  plan: one(taskPlans, { 
    fields: [tasks.planId], 
    references: [taskPlans.id] 
  }),
  assignee: one(users, { 
    fields: [tasks.assigneeId], 
    references: [users.id] 
  }),
}));
```

### 日期策略表

```typescript
export const dateStrategies = sqliteTable('date_strategies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  region: text('region').notNull(),
  year: integer('year').notNull(),
  isPublic: integer('is_public', { mode: 'boolean' })
    .notNull()
    .default(true),
  dates: text('dates', { mode: 'json' })
    .notNull()
    .$type<string[]>(),                      // 日期数组
  copyCount: integer('copy_count')
    .notNull()
    .default(0),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

### 愿望单表

```typescript
export const wishlists = sqliteTable('wishlists', {
  id: text('id').primaryKey(),
  familyId: text('family_id').references(() => families.id),
  templateId: text('template_id').references(() => wishlists.id),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type', { 
    enum: ['大餐', '零食', '快餐', '虚拟物品', '玩具', '书籍', '电子产品', '陪伴', '运动', '旅行'] 
  }).notNull(),
  points: integer('points'),
  imageType: text('image_type', { 
    enum: ['icon', 'upload'] 
  }).notNull(),
  color: text('color'),
  image: text('image'),
  borderStyle: text('border_style'),
  status: text('status', { 
    enum: ['published', 'unpublished', 'activated', 'ready', 'redeemed', 'completed'] 
  }).notNull(),
  approvedBy: text('approved_by').references(() => users.id),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  redeemedAt: integer('redeemed_at', { mode: 'timestamp' }),
  redeemedConfirmedBy: text('redeemed_confirmed_by').references(() => users.id),
  remark: text('remark'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

### 积分历史表

```typescript
export const pointsHistory = sqliteTable('points_history', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  taskId: text('task_id').references(() => tasks.id),
  wishlistId: text('wishlist_id').references(() => wishlists.id),
  amount: integer('amount').notNull(),      // 正数增加，负数扣除
  reason: text('reason').notNull(),
  balance: integer('balance').notNull(),    // 变动后余额
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

---

## 查询抽象层

### lib/db/queries/.ts（强制使用，所有查询必须封装到 `lib/db/queries/` 目录下，按表分文件存储（如 `lib/db/queries/tasks.ts`, `lib/db/queries/users.ts`））

```typescript
/**
 * 所有数据库查询必须封装在此文件中
 * 禁止在其他地方直接操作数据库
 */

import { db } from './index';
import { tasks, taskPlans, users, wishlists, pointsHistory } from './schema';
import { eq, and, or, inArray, desc, asc, sql } from 'drizzle-orm';

// ==================== 任务查询 ====================

export async function getTasksByFamily(familyId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.familyId, familyId),
    orderBy: desc(tasks.dueDate),
    with: {
      assignee: true,
      plan: true,
    },
  });
}

export async function getTasksByAssignee(assigneeId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.assigneeId, assigneeId),
    orderBy: desc(tasks.dueDate),
  });
}

export async function getPendingTasks(familyId: string) {
  return db.query.tasks.findMany({
    where: and(
      eq(tasks.familyId, familyId),
      eq(tasks.status, 'pending')
    ),
    orderBy: asc(tasks.dueDate),
  });
}

// ==================== 计划任务查询 ====================

export async function getTaskPlansByFamily(familyId: string) {
  return db.query.taskPlans.findMany({
    where: eq(taskPlans.familyId, familyId),
    orderBy: desc(taskPlans.createdAt),
  });
}

export async function getPublicTemplates() {
  return db.query.taskPlans.findMany({
    where: and(
      eq(taskPlans.isTemplate, true),
      eq(taskPlans.isPublic, true)
    ),
  });
}

// ==================== 愿望单查询 ====================

export async function getWishlistsByFamily(familyId: string) {
  return db.query.wishlists.findMany({
    where: eq(wishlists.familyId, familyId),
    orderBy: desc(wishlists.points),
  });
}

// ==================== 积分查询 ====================

export async function getPointsHistory(userId: string, limit = 50) {
  return db.query.pointsHistory.findMany({
    where: eq(pointsHistory.userId, userId),
    orderBy: desc(pointsHistory.createdAt),
    limit,
  });
}

export async function getUserBalance(userId: string) {
  const result = await db.query.pointsHistory.findMany({
    where: eq(pointsHistory.userId, userId),
    orderBy: desc(pointsHistory.createdAt),
    limit: 1,
  });
  
  return result[0]?.balance || 0;
}

// ==================== 事务操作 ====================

export async function completeTask(taskId: string, points: number) {
  return db.transaction(async (tx) => {
    // 更新任务
    const [task] = await tx.update(tasks)
      .set({ 
        status: 'completed',
        actualPoints: points,
      })
      .where(eq(tasks.id, taskId))
      .returning();
    
    // 查询当前余额
    const currentBalance = await getUserBalance(task.assigneeId);
    
    // 写入积分历史
    await tx.insert(pointsHistory).values({
      userId: task.assigneeId,
      taskId,
      amount: points,
      reason: '任务完成',
      balance: currentBalance + points,
    });
    
    return task;
  });
}
```

---

## 数据库迁移

### 迁移文件命名

```
database/migrations/
├── 001_create_users_table.sql
├── 002_create_families_table.sql
├── 003_create_task_plans_table.sql
├── 004_create_tasks_table.sql
└── 005_create_wishlists_table.sql
```

### 迁移脚本格式

```sql
-- database/migrations/001_create_users_table.sql

-- Up (升级)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE,
  pin TEXT,
  password TEXT,
  role TEXT NOT NULL,
  family_id TEXT,
  name TEXT NOT NULL,
  avatar TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_users_family ON users(family_id);
CREATE INDEX idx_users_phone ON users(phone);

-- Down (回滚)
-- DROP INDEX IF EXISTS idx_users_phone;
-- DROP INDEX IF EXISTS idx_users_family;
-- DROP TABLE IF EXISTS users;
```

---

## 扩展阅读

- [TECH_SPEC_ARCHITECTURE.md](./TECH_SPEC_ARCHITECTURE.md) - 架构设计
- [TECH_SPEC_TYPES.md](./TECH_SPEC_TYPES.md) - 类型系统
- [AGENTS.md](../AGENTS.md) - AI 代理快速参考
