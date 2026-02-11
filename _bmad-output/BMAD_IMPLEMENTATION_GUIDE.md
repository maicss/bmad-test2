# BMAD Implementation Guide

> **BMAD 技术实施指南** - 基于 2026-02-10 头脑风暴会话成果
>
> 本文档为 BMAD 代理（bmad-bmm-create-product-brief、bmad-agent-bmm-pm、bmad-bmm-create-prd）提供 Family Reward 产品的完整实施指导

---

## 1. Executive Summary

### Family Reward 产品概述

Family Reward 是一款面向儿童的家庭行为管理游戏平台，通过量化日常行为、游戏化积分系统、愿望兑换（物品+互动体验），帮助家长从"情绪控制"走向"规则共治"，为孩子创造透明、公平、安全的成长环境。

### 核心价值定位

- **从情绪控制到规则共治**：将家庭管理从家长的情绪化决策转变为透明、公平的规则体系
- **家长完全控制 + 系统边界清晰**：家长拥有最终决策权，系统只解决技术层面问题
- **游戏化但不失教育本质**：通过徽章、Combo、道具卡等游戏化元素激励孩子，但保持教育的严肃性

### 头脑风暴会话成果（2026-02-10）

本次会话通过思维导图技巧，系统性地梳理了产品架构，生成了 **150+ 个逻辑规则和架构决策**，形成完整的逻辑闭环：

**主要成就：**
- 明确了 5 个核心产品原则（详见第 2 章）
- 完整定义了 21 个数据库表及其关系
- 详细规划了 9 个优先级的实施路径
- 识别并补充了遗漏的功能点（操作日志、通知系统、家庭设置、管理员功能）
- 将模糊的描述具体化为可执行的业务逻辑和技术方案

**可落地的成果：**
- 21 个数据库表的完整结构定义
- 9 个优先级的清晰行动计划（立即/短-中/长期）
- 每个行动步骤都有明确的资源需求和开发时间估算
- 完整的操作日志触发条件和格式定义

---

## 2. Product Vision & Core Principles

### 2.1 产品愿景

Family Reward 通过透明、公平的规则体系，帮助家庭从"情绪控制"走向"规则共治"，为孩子创造安全、透明的成长环境。产品核心差异化优势在于：

1. **家长全参数控制**：所有家庭设置可由家长自定义，确保灵活性
2. **清晰的产品边界**：技术解决技术层面，家庭内部问题不介入
3. **情感连接设计**：避免"一次坏行为就全部扣分"的挫败感，提供协商机制
4. **游戏化但保持教育本质**：徽章、Combo、道具卡激励孩子，但不过度游戏化

### 2.2 核心机制

#### 2.2.1 任务计划系统
- 家长设置计划任务（循环规则、日期规则、积分值）
- 系统自动生成任务（立即生成所有）
- 任务状态流转：待完成 → 进行中 → 已完成/失败

#### 2.2.2 积分结算系统
- 好任务完成获得积分，坏任务完成扣除积分
- 家长可设置家庭全局奖惩比例
- 积分结算必须经过家长审批后才生效

#### 2.2.3 Combo 激励系统
- **线性 combo**：连续完成 X 次触发固定奖励
- **阶梯 combo**：每 Y 次奖励递增
- 宽限机制：3 种方式（时间宽限、道具卡、家长豁免）

#### 2.2.4 愿望兑换系统
- 孩子/家长创建愿望（物品+互动体验）
- 进度条显示（当前积分/所需积分）
- 家长审核后才能激活，激活后方可兑换

#### 2.2.5 辅助游戏化
- 签到系统（独立按钮、名人名言）
- 徽章系统（5 大维度、铜银金等级、永久记录）
- 等级系统（基于积分累计最高值、指数递增算法、不会降级）
- 道具卡系统（9 种类型、全局 CD、数量限制、过期时间）
- 积分银行（活期/定期、存款利息、借贷机制）

### 2.3 关键用户画像

| 角色 | 年龄 | 特点 | 主要行为 |
|------|------|------|----------|
| **家长** | 35岁+ | 全职妈妈/单亲家庭，承担儿童教育主要责任 | 设置任务、审批、管理家庭 |
| **大孩子** | 9岁 | 可独立操作 | 查看任务、完成任务、兑换愿望 |
| **小孩子** | 5岁 | 需家长协助 | 告诉完成任务、告诉妈妈愿望 |
| **管理员** | - | 系统管理员角色 | 模板管理、家庭审核、观察监控 |

### 2.4 5 核心原则（贯穿所有功能模块）

#### 原则 1：家长完全控制原则

**定义：** 家长拥有所有家庭管理功能的最终决策权

**实施要点：**
- 家长可以驳回落儿童自主标记的任务
- 家长可以修改孩子创建的愿望
- 家长控制儿童的自主权开启/关闭
- 家庭内部的事情系统不处理（如愿望没兑现、孩子间公平性）

**代码体现：**
```typescript
// 所有涉及家庭管理的操作，必须验证家长权限
if (user.role !== 'parent' && user.role !== 'admin') {
  throw new Error('Only parents can perform this action');
}
```

#### 原则 2：管理员只观察不干预原则

**定义：** 管理员只能观察和建议，不能直接干预家庭管理

**实施要点：**
- 管理员不能修改家长的任务设置
- 管理员不能强制干预家庭管理
- 管理员只能发送建议通知
- 管理员可以查看全局数据用于监控

**代码体现：**
```typescript
// 管理员操作只允许读取和发送通知
if (user.role === 'admin' && action.type !== 'read' && action.type !== 'notify') {
  throw new Error('Admin can only observe and notify');
}
```

#### 原则 3：系统边界清晰原则

**定义：** 技术解决技术层面问题，家庭内部问题不介入

**实施要点：**
- **技术层面**：数据记录、批量审批、积分计算、通知发送
- **不介入**：家长冲突、孩子腻了、愿望没兑现、孩子间公平性
- **避免过度复杂化**

**设计决策：**
- 不支持"只记录不奖励"的任务（用低分代替）
- 不支持孩子间的公平性调节（家长自行解释）
- 不处理愿望没兑现（家庭内部事情）

#### 原则 4：线性叠加不回退原则

**定义：** 积分变动采用线性叠加方式，不回退操作

**实施要点：**
- 积分变动：先奖励+10分，再扣除15分 = 最终-5分
- 不回退：不撤销之前的积分变动
- 积分可以为负数
- 大幅简化系统复杂度

**代码体现：**
```typescript
// 积分变动：线性叠加
async function changePoints(userId: string, amount: number, reason: string) {
  const currentBalance = await getUserBalance(userId);
  const newBalance = currentBalance + amount; // 直接叠加，可以为负数

  await db.insert(pointsHistory).values({
    userId,
    amount,
    reason,
    balance: newBalance,
  });
}
```

#### 原则 5：产品边界务实原则

**定义：** 保持产品功能务实，避免过度设计

**实施要点：**
- 初期简单、后期升级（如并发控制、实时推送）
- 优先实现核心功能，游戏化功能逐步完善
- 技术选型务实（SQLite + 轮询同步，而非一开始就用 Redis + WebSocket）

---

## 3. System Architecture Overview

### 3.1 分层架构图

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

### 3.2 关键架构原则

1. **强制查询抽象层**：所有数据库操作必须通过 `lib/db/queries.ts`
2. **强制 Drizzle ORM**：禁止任何原生 SQL
3. **Server Components 优先**：数据获取在服务端完成
4. **类型安全**：全链路 TypeScript，禁止 `any`

### 3.3 核心模块关系

#### 3.3.1 任务模块

```
task_plans (计划任务模板)
    ↓ 1:N
tasks (具体任务实例)
    ↓ N:1
users (执行者)
```

**业务规则：**
- 一个计划任务可以生成多个具体任务
- 每个具体任务分配给一个用户（儿童）
- 任务完成需家长审批后才结算积分

#### 3.3.2 用户模块

```
families (家庭)
    ↓ 1:N
users (用户)
    ↓ 1:N
points_history (积分历史)
```

**角色定义：**
- `admin`：系统管理员，可创建模板
- `parent`：家长，管理本家庭
- `child`：儿童，执行任务

#### 3.3.3 愿望单模块

```
wishlists (愿望单)
    ↓ N:1
users (创建者)
    ↓ N:1
users (审批者) - optional
```

**状态流转：**
```
draft → activated → redeemed → completed
```

### 3.4 数据流示例

#### 3.4.1 创建计划任务并生成任务

```typescript
// 流程：
// 1. 家长创建 plan
// 2. 系统根据 dateStrategy 计算有效日期
// 3. 为每个日期生成 task

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

#### 3.4.2 任务完成与积分结算

```typescript
// 流程：
// 1. 儿童标记完成
// 2. 家长审批
// 3. 计算积分（考虑 combo）
// 4. 写入积分历史

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

---

## 4. Database Schema Reference

### 4.1 数据库表概览（21 个表）

基于头脑风暴会话梳理，Family Reward 系统包含 **21 个核心数据库表**：

#### 第一优先级：核心功能表（10 个）

| 表名 | 说明 | 状态 |
|------|------|------|
| **account** | Better-Auth 账户表 | 需新增 |
| **session** | Better-Auth 会话表 | 需新增 |
| **users** | 用户表 | 已有，需补充字段 |
| **families** | 家庭表 | 已有，需补充字段 |
| **task_categories** | 任务类型分类表 | 需新增 |
| **task_plans** | 计划任务表 | 已有 |
| **tasks** | 具体任务表 | 已有 |
| **date_strategies** | 日期策略表 | 已有 |
| **wishlists** | 愿望单表 | 已有 |
| **points_history** | 积分历史表 | 已有 |

#### 第二优先级：游戏化系统表（8 个）

| 表名 | 说明 | 状态 |
|------|------|------|
| **combo_rules** | Combo规则表 | 需新增 |
| **badges** | 徽章定义表 | 需新增 |
| **user_badges** | 用户徽章记录表 | 需新增 |
| **item_cards** | 道具卡定义表 | 需新增 |
| **user_item_cards** | 用户道具卡库存表 | 需新增 |
| **bank_accounts** | 积分银行账户表 | 需新增 |
| **bank_transactions** | 银行交易记录表 | 需新增 |
| **sign_in_records** | 签到记录表 | 需新增 |

#### 第三优先级：系统完整性表（3 个）

| 表名 | 说明 | 状态 |
|------|------|------|
| **operation_logs** | 操作日志表 | 需新增 |
| **system_logs** | 系统日志表 | 需新增 |
| **notifications** | 通知表 | 需新增 |

### 4.2 关键表详细说明

#### 4.2.1 users（用户表）

```typescript
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
  isPrimaryParent: integer('is_primary_parent', { mode: 'boolean' }).default(false),
  isSecondaryParent: integer('is_secondary_parent', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**关键字段：**
- `role`：admin（管理员）、parent（家长）、child（儿童）
- `pin`：儿童登录用的 PIN 码（哈希存储）
- `password`：家长登录用的密码（哈希存储）
- `isPrimaryParent` / `isSecondaryParent`：标识家长角色

#### 4.2.2 families（家庭表）

```typescript
export const families = sqliteTable('families', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  region: text('region').notNull().default('全国'),
  status: text('status', {
    enum: ['pending', 'approved', 'suspended', 'deleted']
  }).notNull().default('pending'),
  registrationType: text('registration_type', {
    enum: ['admin', 'self']
  }).notNull(),
  maxParents: integer('max_parents').notNull().default(2),
  maxChildren: integer('max_children').notNull().default(4),
  validityMonths: integer('validity_months').notNull().default(12),
  settings: text('settings', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**关键字段：**
- `status`：pending（待审核）、approved（已批准）、suspended（暂停）、deleted（已删除）
- `registrationType`：admin（管理员开通）、self（家长自主注册）
- `settings`（JSON）：家庭全局设置
  ```json
  {
    "globalRewardRatio": 0.5,
    "defaultReactivationStrategy": "keep_count",
    "itemCardLimit": 10,
    "itemCardExpiryDays": 100,
    "creditLimit": 100
  }
  ```

#### 4.2.3 task_plans（计划任务表）

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
  categoryId: text('category_id').references(() => taskCategories.id),
  points: integer('points').notNull(),       // 可为负数（惩罚）
  penaltyPoints: integer('penalty_points'),  // 未完成扣分
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
```

**关键字段：**
- `points`：任务完成获得积分（可为负数）
- `penaltyPoints`：未完成扣分
- `comboEnabled`：是否启用 Combo 激励
- `comboConfig`（JSON）：Combo 配置
  ```json
  {
    "type": "linear",  // linear 或 ladder
    "tiers": [
      { "minStreak": 3, "maxStreak": 6, "bonusPoints": 5 },
      { "minStreak": 7, "maxStreak": 10, "bonusPoints": 10 }
    ]
  }
  ```

#### 4.2.4 tasks（具体任务表）

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
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'expired']
  }).notNull().default('pending'),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  completedBy: text('completed_by').references(() => users.id),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  approvedBy: text('approved_by').references(() => users.id),
  actualPoints: integer('actualPoints'),  // 实际获得积分
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**关键字段：**
- `status`：pending（待完成）、in_progress（进行中）、completed（已完成）、cancelled（已取消）、expired（已过期）
- `actualPoints`：实际获得的积分（可能因 Combo 而变化）

#### 4.2.5 wishlists（愿望单表）

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

**关键字段：**
- `status`：published（已发布）、unpublished（未发布）、activated（已激活）、ready（可兑换）、redeemed（已兑换）、completed（已完成）

#### 4.2.6 points_history（积分历史表）

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

**关键字段：**
- `amount`：积分变动量（正数增加，负数扣除）
- `balance`：变动后的余额（线性叠加）

#### 4.2.7 badges（徽章定义表）

```typescript
export const badges = sqliteTable('badges', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category', {
    enum: ['task_completion', 'habit_formation', 'behavior_quality', 'milestone', 'social']
  }).notNull(),
  level: text('level', {
    enum: ['bronze', 'silver', 'gold', 'diamond']
  }).notNull(),
  icon: text('icon').notNull(),
  condition: text('condition', { mode: 'json' }).notNull(),  // JSON 判定条件
  isTemplate: integer('is_template', { mode: 'boolean' }).default(false),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**关键字段：**
- `category`：5 大维度（任务完成、习惯养成、行为品质、里程碑、社交）
- `level`：bronze（铜）、silver（银）、gold（金）、diamond（钻石）
- `condition`（JSON）：徽章判定条件
  ```json
  {
    "type": "consecutive_days",
    "taskCategory": "学习",
    "days": 7
  }
  ```

#### 4.2.8 operation_logs（操作日志表）

```typescript
export const operationLogs = sqliteTable('operation_logs', {
  id: text('id').primaryKey(),
  operatorId: text('operator_id')
    .notNull()
    .references(() => users.id),
  targetUserId: text('target_user_id').references(() => users.id),
  operationType: text('operation_type', {
    enum: ['task', 'points', 'wishlist', 'item_card', 'bank', 'badge', 'sign_in', 'family', 'template', 'image', 'notification']
  }).notNull(),
  action: text('action').notNull(),
  pointsChange: integer('points_change'),
  details: text('details', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**关键字段：**
- `operationType`：10 大类操作
- `pointsChange`：积分变动（如有）

---

## 5. API Design Patterns

### 5.1 统一响应格式

#### 5.1.1 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "meta": {
    "timestamp": "2026-02-06T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

#### 5.1.2 错误响应

```json
{
  "success": false,
  "error": {
    "code": "BIZ_2001",
    "message": "任务不存在",
    "details": {
      "taskId": "task-123",
      "suggestion": "请检查任务ID是否正确"
    }
  },
  "meta": {
    "timestamp": "2026-02-06T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### 5.2 错误码规范

```typescript
// constants/error-codes.ts

export const ErrorCodes = {
  // 认证错误 (1xxx)
  AUTH_INVALID_CREDENTIALS: 'AUTH_1001',
  AUTH_SESSION_EXPIRED: 'AUTH_1002',
  AUTH_PIN_LOCKED: 'AUTH_1003',
  AUTH_UNAUTHORIZED: 'AUTH_1004',
  AUTH_FORBIDDEN: 'AUTH_1005',

  // 业务错误 (2xxx)
  TASK_NOT_FOUND: 'BIZ_2001',
  TASK_ALREADY_COMPLETED: 'BIZ_2002',
  TASK_EXPIRED: 'BIZ_2003',
  INSUFFICIENT_POINTS: 'BIZ_2004',
  WISHLIST_NOT_FOUND: 'BIZ_2005',
  WISHLIST_ALREADY_REDEEMED: 'BIZ_2006',
  INVALID_DATE_RANGE: 'BIZ_2007',
  COMBO_CONFIG_INVALID: 'BIZ_2008',

  // 验证错误 (3xxx)
  VALIDATION_REQUIRED_FIELD: 'VAL_3001',
  VALIDATION_INVALID_FORMAT: 'VAL_3002',
  VALIDATION_OUT_OF_RANGE: 'VAL_3003',

  // 系统错误 (9xxx)
  DB_CONNECTION_ERROR: 'SYS_9001',
  DB_TRANSACTION_ERROR: 'SYS_9002',
  INTERNAL_ERROR: 'SYS_9999',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

### 5.3 认证机制

#### 5.3.1 Better-Auth 集成

```typescript
// lib/auth/index.ts
import { betterAuth } from 'better-auth';
import { phone } from 'better-auth/plugins/phone';

export const auth = betterAuth({
  database: {
    provider: 'sqlite',
    url: Bun.env.DATABASE_URL,
  },
  plugins: [
    phone({
      otpLength: 6,
      expiresIn: 300,      // 5分钟
      rateLimit: 5,        // 5次/15分钟
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24,  // 24小时
    updateAge: 60 * 60,       // 1小时刷新
  },
});
```

#### 5.3.2 PIN 码登录（儿童）

```typescript
// lib/auth/pin-auth.ts
export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user?.pin) return false;

  // 检查锁定状态
  if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
    throw new Error('PIN temporarily locked');
  }

  const isValid = await Bun.password.verify(pin, user.pin);

  if (!isValid) {
    await incrementPinAttempts(userId);

    // 3次失败锁定5分钟
    if (user.pinAttempts >= 3) {
      await lockPin(userId, 5 * 60 * 1000);
    }

    return false;
  }

  await resetPinAttempts(userId);
  return true;
}
```

#### 5.3.3 权限验证中间件

```typescript
// lib/auth/verify.ts
export interface SessionUser {
  id: string;
  role: 'admin' | 'parent' | 'child';
  familyId?: string;
}

export async function verifyAuth(req: Request): Promise<SessionUser | null> {
  const sessionId = cookies().get('session')?.value;
  if (!sessionId) return null;

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    cookies().delete('session');
    return null;
  }

  return {
    id: session.userId,
    role: session.user.role,
    familyId: session.user.familyId,
  };
}

// 权限检查辅助函数
export function requireAuth(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function requireFamilyAccess(user: SessionUser, familyId: string): void {
  if (user.role !== 'admin' && user.familyId !== familyId) {
    throw new Error('Forbidden');
  }
}
```

### 5.4 权限矩阵

| 操作 | Admin | Parent | Child |
|------|-------|--------|-------|
| **任务管理** ||||
| 查看所有任务 | ✅ | ❌ | ❌ |
| 查看本家庭任务 | ✅ | ✅ | ✅ (仅自己的) |
| 创建任务 | ✅ | ✅ | ❌ |
| 修改任务 | ✅ | ✅ | ❌ |
| 删除任务 | ✅ | ✅ | ❌ |
| 标记完成 | ❌ | ❌ | ✅ (自己) |
| 审批任务 | ✅ | ✅ | ❌ |
| **愿望单** ||||
| 创建愿望单 | ✅ | ✅ | ✅ |
| 修改愿望单 | ✅ | ✅ | ✅ (自己) |
| 删除愿望单 | ✅ | ✅ | ✅ (自己) |
| 激活愿望单 | ✅ | ✅ | ❌ |
| 发起兑换 | ❌ | ❌ | ✅ |
| 确认兑换 | ✅ | ✅ | ❌ |

---

## 6. Development Guidelines

### 6.1 BDD 开发规范（强制）

#### 6.1.1 Given-When-Then 格式

所有测试必须使用 BDD 风格的 Given-When-Then 格式：

```typescript
// ❌ 禁止 - 传统单元测试写法
it('should return 200', async () => {
  const res = await request(app).get('/api/tasks');
  expect(res.status).toBe(200);
});

// ✅ 正确 - BDD 风格（Given-When-Then）
it('given 家长已登录，when 查询任务列表，then 返回该家庭的任务', async () => {
  // Given: 家长已登录且有任务
  const parent = await createParent();
  const task = await createTask({ familyId: parent.familyId });

  // When: 查询任务列表
  const res = await request(app)
    .get('/api/tasks')
    .set('Cookie', parent.session);

  // Then: 返回该家庭的任务
  expect(res.status).toBe(200);
  expect(res.body.tasks).toHaveLength(1);
  expect(res.body.tasks[0].id).toBe(task.id);
});
```

#### 6.1.2 业务术语表

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

#### 6.1.3 红-绿-重构流程

1. **红（Red）**：编写失败的 BDD 测试，明确描述期望的业务行为
2. **绿（Green）**：编写最简单的代码使测试通过
3. **重构（Refactor）**：优化代码结构，保持测试通过的前提下改进设计

### 6.2 命名规范

#### 6.2.1 类型定义命名

- 按模块命名：`task.ts`、`user.ts`、`wishlist.ts`
- 禁止通用名称：`index.ts`、`types.ts`
- DTO 使用 `.dto.ts` 后缀

#### 6.2.2 函数命名

```typescript
// ✅ 正确
async function getTasksByFamily(familyId: string) { ... }
async function approveTask(taskId: string, approvedBy: string) { ... }
async function changePoints(userId: string, amount: number, reason: string) { ... }

// ❌ 避免
async function getData() { ... }
async function handleTask() { ... }
```

### 6.3 文件组织

```
app/
├── api/                        # API 路由
│   ├── auth/                   # Better-Auth 路由
│   ├── tasks/                  # 任务 API
│   ├── task-plans/             # 计划任务 API
│   ├── wishlists/              # 愿望单 API
│   └── points/                 # 积分 API
├── (dashboard)/                # 路由组（仪表板）
│   ├── layout.tsx
│   ├── page.tsx
│   ├── tasks/
│   ├── task-plans/
│   └── wishlists/

lib/
├── db/                         # 数据库（强制通过此目录访问）
│   ├── index.ts                # 数据库连接配置
│   ├── schema.ts               # Drizzle Schema 定义
│   └── queries.ts              # 查询抽象层（⭐ 强制使用）
├── auth/                       # 认证相关
│   ├── index.ts                # Better-Auth 配置
│   └── pin-auth.ts             # PIN 码登录逻辑
└── utils.ts                    # 通用工具函数

types/
├── user.ts                     # 用户相关类型
├── task.ts                     # 任务相关类型
├── wishlist.ts                 # 愿望单类型
├── family.ts                   # 家庭类型
├── points.ts                   # 积分类型
├── dto/                        # DTO 类型（API 层）
│   ├── request/                # 请求体类型
│   └── response/               # 响应类型
└── db/                         # 数据库类型（从 schema 导出）
    └── index.ts
```

---

## 7. Implementation Roadmap

### 7.1 9 个优先级（基于头脑风暴会话）

#### 优先级 1：数据库表结构定义（21 个表）

**重要性：** 所有功能实施的基础
**可行性：** 表结构已完整定义，可直接迁移
**一致性：** 完全符合技术架构决策（SQLite + Drizzle）

**实施要点：**
- 补充 `families` 表的家庭注册相关字段
- 补充 `users` 表的家庭角色字段（isPrimaryParent, isSecondaryParent）
- 新增 `account` 和 `session` 表（Better-Auth）
- 新增 `task_categories` 表
- 创建所有表的 Drizzle schema
- 执行 migration 创建表

#### 优先级 2：核心功能逻辑代码化（任务、积分、愿望）

**重要性：** 产品核心引擎，用户最常用功能
**可行性：** 所有逻辑规则已完全定义，无模糊描述
**一致性：** 符合"线性叠加不回退"和"家长完全控制"原则

**实施要点：**
- 创建 `lib/db/queries.ts` 封装所有数据库查询
- 实现任务管理 API（创建、生成、完成、驳回、暂停、删除）
- 实现积分结算逻辑（审批后结算、线性叠加）
- 实现愿望管理 API（创建、审核、兑换）
- 测试任务状态流转和积分变动

#### 优先级 3：用户角色与权限体系代码化

**重要性：** 产品基础架构，决定所有功能的安全性和可访问性
**可行性：** 家庭注册流程已完全定义，实施难度低
**一致性：** 符合"家长完全控制"和"管理员只观察"价值观

**实施要点：**
- 实现家庭注册 API（管理员开通、家长自主注册 2 种方式）
- 配置 better-auth 认证（手机号 + OTP）
- 创建鉴权中间件（role-based access control）
- 实现家庭审核 API（管理员批准/驳回）

#### 优先级 4：操作日志与系统日志实现

**重要性：** 符合数据留存 3 年的合规要求，提供操作追溯能力
**可行性：** 触发条件已完全定义，日志格式已明确
**一致性：** 符合合规要求，但日志量大时可能影响性能

**实施要点：**
- 创建 `operation_logs` 和 `system_logs` 表
- 在关键操作点插入日志记录代码（10 大类操作）
- 实现日志查询 API（分权限）
- 设计日志归档策略（按年/月分区）

#### 优先级 5：基础通知系统实现（强通知：愿望兑换）

**重要性：** 保证家长的知情权，符合"强通知家长兑换"决策
**可行性：** 只需要实现一个通知类型，强通知=弹窗，实现简单
**一致性：** 符合"家长控制"原则

**实施要点：**
- 创建 `notifications` 表
- 实现愿望兑换时发送强通知
- 实现小程序弹窗通知展示
- 实现通知已读标记

#### 优先级 6：游戏化激励体系实现（徽章、Combo、道具卡）

**重要性：** 产品差异化优势，提供完整激励闭环，提升用户粘性
**可行性：** 徽章判定逻辑较复杂，Combo 宽限机制需要道具卡系统配合，道具卡自动弹窗需要前端配合
**一致性：** 完全符合"徽章永久、combo 体现坚持"的设计理念

**实施要点：**
- 实现徽章定义和管理 API
- 实现徽章判定逻辑（任务完成时检查，5 大维度）
- 实现 Combo 规则配置和计算（线性/阶梯）
- 实现道具卡定义、获得、使用、过期逻辑
- 前端实现道具卡自动弹窗询问 UI

#### 优先级 7：积分银行实现（活期/定期、利息、借贷）

**重要性：** 给孩子学习财务管理的机会，支持信贷兑换场景，完善积分体系
**可行性：** 利息计算逻辑、到期处理、借贷额度判断，中等难度
**一致性：** 完全符合"积分可以为负数"和"家长设置信贷额度"的控制机制

**实施要点：**
- 创建 `bank_accounts` 和 `bank_transactions` 表
- 实现存入、取出 API
- 实现到期自动计算利息（定时任务）
- 实现信贷额度检查逻辑

#### 优先级 8：并发控制与实时推送

**重要性：** 支持多设备并发使用，提升用户体验，保证数据一致性
**可行性：** 乐观锁需要所有关键表的 version 字段，轮询同步需要前端定时请求实现，WebSocket/SSE 推送需要额外服务器架构
**一致性：** 完全符合"初期简单、后期升级"的技术演进策略

**实施要点：**
- 实现乐观锁并发控制（关键表添加 version 字段）
- 实现轮询同步（每 30 秒）
- 评估并实现 SSE 或 WebSocket 推送

#### 优先级 9：管理员后台完整实现

**重要性：** 支持模板管理和家庭审核，提供管理员观察和建议能力，支持图床管理
**可行性：** 图床瀑布流 UI 需要前端复杂实现，模板管理需要与家长端共享数据，全局日志查看需要分页筛选导出等复杂功能
**一致性：** 完全符合"管理员只观察不干预"的权限边界

**实施要点：**
- 实现图床上传和瀑布流展示
- 实现模板管理完整功能（5 种类型、公开/私有标记）
- 实现全局日志查看和筛选
- 实现管理员通知发送功能

### 7.2 周度开发计划

#### 第 1 周：数据库表结构定义 + 用户角色与权限体系

- [ ] 补充 `families` 表的家庭注册相关字段
- [ ] 补充 `users` 表的家庭角色字段
- [ ] 新增 `account` 和 `session` 表（Better-Auth）
- [ ] 新增 `task_categories` 表
- [ ] 创建所有表的 Drizzle schema
- [ ] 执行 migration 创建表
- [ ] 实现家庭注册 API（管理员开通、家长自主注册）
- [ ] 配置 better-auth 认证（手机号 + OTP）
- [ ] 创建鉴权中间件（role-based access control）
- [ ] 实现家庭审核 API（管理员批准/驳回）

#### 第 2-3 周：核心功能逻辑（任务 + 积分 + 愿望）

- [ ] 创建 `lib/db/queries.ts` 封装所有数据库查询
- [ ] 实现任务管理 API（创建、生成、完成、驳回、暂停、删除）
- [ ] 实现积分结算逻辑（审批后结算、线性叠加）
- [ ] 实现愿望管理 API（创建、审核、兑换）
- [ ] 测试任务状态流转和积分变动

#### 第 4 周：基础通知系统 + 操作日志

- [ ] 创建 `notifications` 表
- [ ] 实现愿望兑换强通知
- [ ] 实现小程序弹窗通知
- [ ] 实现通知已读标记
- [ ] 创建 `operation_logs` 和 `system_logs` 表
- [ ] 在关键操作点插入日志记录代码
- [ ] 实现日志查询 API（分权限）

#### 第 5-8 周：游戏化激励体系

- [ ] 实现徽章定义和管理 API
- [ ] 实现徽章判定逻辑（任务完成时检查）
- [ ] 实现 Combo 规则配置和计算
- [ ] 实现道具卡定义、获得、使用、过期逻辑
- [ ] 前端实现道具卡自动弹窗询问 UI
- [ ] 实现积分银行（活期/定期、利息、借贷）

#### 第 9-12 周：并发控制 + 管理员后台

- [ ] 实现乐观锁并发控制（关键表添加 version 字段）
- [ ] 实现轮询同步（每 30 秒）
- [ ] 评估并实现 SSE 或 WebSocket 推送
- [ ] 实现图床上传和瀑布流展示
- [ ] 实现模板管理完整功能（5 种类型、公开/私有标记）
- [ ] 实现全局日志查看和筛选
- [ ] 实现管理员通知发送功能

---

## 8. Key Business Logic Reference

### 8.1 家庭注册流程（2 种方式）

#### 8.1.1 方式 1：管理员开通（直接 approved）

```typescript
async function adminCreateFamily(data: AdminCreateFamilyDto) {
  const family = await db.insert(families).values({
    ...data,
    status: 'approved',
    registrationType: 'admin',
  });
  return family;
}
```

#### 8.1.2 方式 2：家长自主注册（pending，需管理员审核）

```typescript
async function selfRegisterFamily(data: SelfRegisterFamilyDto) {
  const family = await db.insert(families).values({
    ...data,
    status: 'pending',
    registrationType: 'self',
  });
  return family;
}
```

**家庭状态流转：**
- pending → approved（管理员批准）
- approved → suspended（管理员暂停）
- suspended → approved（管理员恢复）
- approved → deleted（管理员删除）

### 8.2 任务重新激活策略

家长可选择两种策略：

```typescript
enum ReactivationStrategy {
  KEEP_COUNT = 'keep_count',     // 任务数不变，延后日期
  DELETE_INCOMPLETE = 'delete',  // 删除未完成任务，总任务数减少
}

async function reactivateTask(
  taskId: string,
  strategy: ReactivationStrategy,
  approvedBy: string
) {
  if (strategy === ReactivationStrategy.KEEP_COUNT) {
    // 策略 1：任务数不变，延后一天
    await db.update(tasks)
      .set({ status: 'pending', dueDate: addDays(new Date(), 1) })
      .where(eq(tasks.id, taskId));

    // 需要家长二次确认是否修改日期范围
    // 因为需要多生成一个任务
  } else {
    // 策略 2：删除未完成的任务
    await db.delete(tasks).where(eq(tasks.id, taskId));
  }
}
```

**家庭设置中可选择默认策略：**
```typescript
// families 表的 settings 字段（JSON）
{
  "defaultReactivationStrategy": "keep_count",
  "globalRewardRatio": 0.5,
  "itemCardLimit": 10,
  "itemCardExpiryDays": 100,
  "creditLimit": 100
}
```

### 8.3 积分结算：线性叠加不回退

**核心原则：**
- 儿童标记完成时不结算积分
- 家长审批后才给分
- 积分变动线性叠加，不回退
- 积分可以为负数

```typescript
async function approveTask(taskId: string, approvedBy: string, approved: boolean) {
  await db.transaction(async (tx) => {
    const task = await tx.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: { plan: true },
    });

    if (approved) {
      // 审批通过：给分
      const points = task.plan.points;
      await changePoints(task.assigneeId, points, '任务完成');

      await tx.update(tasks)
        .set({ status: 'completed', approvedBy, approvedAt: new Date() })
        .where(eq(tasks.id, taskId));
    } else {
      // 审批驳回：叠加扣分
      const basePoints = task.plan.points;          // 任务完成分数（如 10 分）
      const penaltyPoints = task.plan.penaltyPoints; // 未完成扣分（如 5 分）
      const comboBonus = 0; // 如果有 combo 奖励，也要扣除

      const totalDeduction = -basePoints - penaltyPoints - comboBonus;
      await changePoints(task.assigneeId, totalDeduction, '任务驳回');

      await tx.update(tasks)
        .set({ status: 'cancelled', approvedBy, approvedAt: new Date() })
        .where(eq(tasks.id, taskId));
    }
  });
}
```

### 8.4 道具卡自动弹窗询问

**场景：** 任务未完成时，系统判断是否有免 combo 中断卡，弹窗询问使用

```typescript
// 前端实现
async function checkItemCardAvailability(userId: string, taskId: string) {
  // 检查用户是否有免 combo 中断卡
  const itemCards = await db.query.user_item_cards.findMany({
    where: and(
      eq(user_item_cards.userId, userId),
      eq(user_item_cards.itemCard.type, 'combo_immunity'),
      gt(user_item_cards.expiresAt, new Date())
    ),
  });

  if (itemCards.length > 0) {
    // 弹窗询问是否使用
    const useCard = await showConfirmDialog({
      title: '使用道具卡',
      message: '检测到你有"免combo中断卡"，是否使用？',
      confirmText: '使用',
      cancelText: '不使用',
    });

    if (useCard) {
      await useItemCard(itemCards[0].id, taskId);
    }
  }
}
```

### 8.5 信贷额度机制

**场景：** 愿望兑换时，积分不够但可以使用信贷额度

```typescript
async function checkRedemptionEligibility(userId: string, wishlistId: string) {
  const balance = await getUserBalance(userId);
  const wishlist = await db.query.wishlists.findFirst({
    where: eq(wishlists.id, wishlistId),
  });

  const creditLimit = await getUserCreditLimit(userId); // 家长设置的信贷额度
  const availableCredit = creditLimit - await getUsedCredit(userId);

  if (balance >= wishlist.points) {
    // 积分足够，正常兑换
    return { eligible: true, useCredit: false };
  } else if (balance + availableCredit >= wishlist.points) {
    // 积分不够，但可以使用信贷额度
    return { eligible: true, useCredit: true, deficit: wishlist.points - balance };
  } else {
    // 积分不够，信贷额度也不够
    return { eligible: false, useCredit: false };
  }
}
```

### 8.6 徽章判定逻辑（5 大维度）

徽章永久记录（不会因后续行为丢失），代表"曾经达成过这个成就"；Combo 体现"还在坚持"的状态。

**徽章分类：**

1. **任务完成徽章**：连续 7 天完成阅读任务、连续 7 天完成运动任务、连续 7 天完成家务任务、连续 14 天完成学习任务、7 天内完成所有类型任务
2. **习惯养成徽章**：连续 30 天每日签到、连续 21 天早晨 7 点前完成任务、连续 30 天睡前阅读习惯、连续 14 天按时完成作业
3. **行为品质徽章**：连续 7 天无说谎记录、连续 14 天无发脾气记录、连续 7 天获得正面情绪评价、连续 7 天主动帮助他人
4. **里程碑徽章**：第一次完成任务、累计获得 100 颗星、累计获得 1000 颗星、等级晋升（铜→银→金→钻石）
5. **社交徽章**：协助兄弟姐妹完成任务 5 次、参与家庭集体活动 10 次、主动分享成就 3 次、被他人点赞或认可 3 次

---

## 9. Technical Constraints & Red Lines

### 9.1 数据库（强制 Drizzle ORM）

#### 9.1.1 绝对禁止

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

#### 9.1.2 必须使用

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

### 9.2 Bun 工具函数使用规范（强制）

#### 9.2.1 绝对禁止

```typescript
// ❌ 禁止 - 重复实现
import { readFile } from 'fs/promises';     // 禁止
import { hash, compare } from 'bcrypt';      // 禁止
import { createServer } from 'http';         // 禁止
const env = process.env;                     // 禁止
```

#### 9.2.2 必须使用

```typescript
// ✅ 正确 - 使用 Bun 内置工具
import { Bun } from 'bun';

// 文件操作
const file = Bun.file('./data.txt');
const content = await file.text();
await Bun.write('./output.txt', 'content');

// 密码哈希
const hash = await Bun.password.hash('password', 'bcrypt');
const isValid = await Bun.password.verify('password', hash);

// 环境变量
const dbUrl = Bun.env.DATABASE_URL;
```

### 9.3 运行时与类型

#### 9.3.1 绝对禁止

- ❌ 使用 `any` 类型 - 必须用 `unknown` + 类型守卫
- ❌ 使用 `@ts-ignore` / `@ts-expect-error` - 必须修复类型错误
- ❌ 使用 Node.js 兼容层 - 如 `node-fetch`, `node-crypto`, `fs/promises`
- ❌ 使用 `process.env` - 改用 `Bun.env`
- ❌ 使用 `alert()` 显示错误 - 必须用 Shadcn Dialog/Toast
- ❌ 引入新依赖 - 未经明确确认禁止安装

### 9.4 Git

- ❌ 提交 `.env` 文件 - 敏感配置禁止入库

### 9.5 验证流程

#### 9.5.1 提交前检查

- [ ] `bun tsc --noEmit` 通过
- [ ] `bun test` 通过
- [ ] 新功能有测试
- [ ] 数据库迁移已创建（如有变更）
- [ ] 不使用 `any` 类型
- [ ] UI 错误使用 Shadcn 组件
- [ ] **文件长度检查：所有文件不超过 800 行**
  - 如文件过大，必须先拆分为小组件再提交
- [ ] **BDD 规范检查**
  - 测试使用 Given-When-Then 格式
  - 使用业务语言（非技术术语）
  - 先写测试/规范，后写实现

---

## 10. Agent-Specific Guidance

### 10.1 bmad-bmm-create-product-brief

**任务：** 创建产品简介文档

**应包含的核心内容：**
1. **产品定位**：工具型 + 娱乐型混合定位，从"情绪控制"走向"规则共治"
2. **核心价值**：家长全参数控制 + 清晰的产品边界 + 情感连接设计 + 游戏化但保持教育本质
3. **目标用户**：
   - 家长：35 岁+ 全职妈妈/单亲家庭
   - 大孩子：9 岁，可独立操作
   - 小孩子：5 岁，需家长协助
   - 管理员：系统管理员角色
4. **核心功能**：
   - 任务计划系统（循环规则、日期规则、积分值）
   - 积分结算系统（好任务获得、坏任务扣除、奖惩比例）
   - Combo 激励系统（线性、阶梯、宽限机制）
   - 愿望兑换系统（物品+互动体验、进度条）
   - 辅助游戏化（签到、徽章、等级、道具卡、积分银行）
5. **技术架构**：
   - 前端：PWA Web App（主端）+ Mini-program（辅助端）
   - 后端：Next.js 16 + better-auth + 手机号认证 + rate limit
   - 数据库：SQLite（bun:sqlite）+ Drizzle + Redis 缓存
   - 状态管理：Zustand
6. **核心差异化优势**：
   - 家长全参数控制
   - 清晰的产品边界（技术解决技术层面，家庭内部问题不介入）
   - 情感连接设计（避免"一次坏行为就全部扣分"的挫败感）
   - 游戏化但保持教育本质（徽章永久记录、Combo 体现坚持）
7. **5 个核心原则**：
   - 家长完全控制原则
   - 管理员只观察不干预原则
   - 系统边界清晰原则
   - 线性叠加不回退原则
   - 产品边界务实原则

### 10.2 bmad-agent-bmm-pm

**任务：** 项目管理和进度跟踪

**关键考虑事项：**
1. **优先级管理**：
   - 9 个优先级严格排序（详见第 7 章）
   - 立即行动（第 1 周）：数据库表结构定义、用户角色与权限体系、核心功能逻辑
   - 短期行动（第 2-3 周）：积分和愿望逻辑、基础通知系统、操作日志
   - 中期行动（第 4-6 周）：游戏化激励体系、积分银行
   - 长期规划（第 7-12 周）：并发控制与实时推送、管理员后台
2. **资源估算**：
   - 数据库表结构定义：4-8 小时
   - 用户角色与权限体系：8-12 小时
   - 核心功能逻辑（任务）：16-24 小时
   - 核心功能逻辑（积分和愿望）：12-16 小时
   - 基础通知系统：6-8 小时
   - 操作日志：4-6 小时
   - 游戏化激励体系：24-32 小时
   - 积分银行：12-16 小时
   - 并发控制：16-24 小时
   - 管理员后台：24-32 小时
3. **风险管理**：
   - 技术风险：SQLite 并发性能、轮询同步的实时性
   - 业务风险：5 个核心原则的一致性维护
   - 合规风险：COPPA/GDPR/中国儿童个人信息网络保护规定
4. **里程碑设置**：
   - M1（第 1 周）：数据库表结构定义完成 + 用户角色与权限体系完成
   - M2（第 3 周）：核心功能逻辑（任务 + 积分 + 愿望）完成
   - M3（第 4 周）：基础通知系统 + 操作日志完成
   - M4（第 8 周）：游戏化激励体系 + 积分银行完成
   - M5（第 12 周）：并发控制 + 管理员后台完成
5. **团队协作**：
   - 后端开发：API 开发、数据库查询、业务逻辑
   - 前端开发：UI 组件、状态管理、轮询同步
   - 测试开发：BDD 测试编写、测试覆盖率

### 10.3 bmad-bmm-create-prd

**任务：** 创建产品需求文档（PRD）

**详细功能需求结构：**

#### FR-1: 用户账户与认证系统

**需求描述：**
- 支持家长账户（手机号 + 密码）、儿童账户（PIN 码）、管理员角色
- 支持多设备并发登录
- 家庭注册双流程（管理员开通/家长自主注册）

**验收标准：**
- AC-1: 家长可以通过手机号和密码登录
- AC-2: 儿童可以通过 PIN 码登录（3 次失败锁定 5 分钟）
- AC-3: 管理员可以开通家庭账户（直接 approved）
- AC-4: 家长可以自主注册家庭账户（需管理员审核）

#### FR-2: 任务管理系统

**需求描述：**
- 家长设置计划任务（循环规则、日期规则、积分值）
- 系统立即生成所有任务
- 任务状态流转：待完成 → 进行中 → 已完成/失败

**验收标准：**
- AC-1: 家长可以通过任务模板快速设置 5-10 个日常任务
- AC-2: 系统根据日期策略立即生成所有任务
- AC-3: 儿童可以标记任务完成
- AC-4: 家长可以审批任务（通过/驳回）

#### FR-3: 积分奖励系统

**需求描述：**
- 好任务完成获得积分，坏任务完成扣除积分
- 家长可设置家庭全局奖惩比例
- 积分结算必须经过家长审批后才生效
- 积分变动采用线性叠加方式，不回退，可以为负数

**验收标准：**
- AC-1: 孩子完成任务后立即看到星星增加，有即时反馈
- AC-2: 家长可以查看孩子的行为历史和积分变化记录
- AC-3: 积分变动线性叠加，不回退
- AC-4: 积分可以为负数

#### FR-4: Combo 激励系统

**需求描述：**
- 线性 combo（连续完成 X 次触发固定奖励）
- 阶梯 combo（每 Y 次奖励递增）
- 宽限机制：3 种方式（时间宽限、道具卡、家长豁免）

**验收标准：**
- AC-1: 支持连续打卡 combo 机制，有视觉和音效反馈
- AC-2: 支持线性 combo 和阶梯 combo 两种模式
- AC-3: 支持 3 种宽限机制

#### FR-5: 愿望兑换系统

**需求描述：**
- 孩子/家长创建愿望（物品+互动体验）
- 进度条显示（当前积分/所需积分）
- 家长审核后才能激活，激活后方可兑换
- 支持信贷额度机制（积分不够时可借贷）

**验收标准：**
- AC-1: 孩子可以创建愿望清单，包括物品和互动体验
- AC-2: 愿望单显示进度条（当前积分/所需积分）
- AC-3: 家长必须审核愿望单才能激活
- AC-4: 激活后的愿望可以兑换
- AC-5: 支持信贷额度机制

#### FR-6: 辅助游戏化

**需求描述：**
- 签到系统（独立按钮、名人名言）
- 徽章系统（5 大维度、铜银金等级、永久记录）
- 等级系统（基于积分累计最高值、指数递增算法、不会降级）
- 道具卡系统（9 种类型、全局 CD、数量限制、过期时间）
- 积分银行（活期/定期、存款利息、借贷机制）

**验收标准：**
- AC-1: 支持签到系统，显示名人名言
- AC-2: 支持 5 大维度徽章（任务完成、习惯养成、行为品质、里程碑、社交）
- AC-3: 徽章永久记录，不会因后续行为丢失
- AC-4: 等级系统基于积分累计最高值，不会降级
- AC-5: 支持 9 种道具卡，自动弹窗询问使用
- AC-6: 支持积分银行（活期/定期、存款利息、借贷）

#### FR-7: 多孩管理

**需求描述：**
- 支持多个孩子独立数据空间
- 一键切换账户
- 共享奖励规则

**验收标准：**
- AC-1: 系统支持多孩管理，数据完全隔离
- AC-2: 支持一键切换账户
- AC-3: 支持共享奖励规则

#### FR-8: 家庭日历与协作

**需求描述：**
- 多视图日历（周/月）
- 智能循环提醒
- 家庭记忆库

**验收标准：**
- AC-1: 支持周/月视图日历
- AC-2: 支持智能循环提醒
- AC-3: 支持家庭记忆库

#### FR-9: 管理员功能

**需求描述：**
- 模板管理（5 种类型：日期策略、计划任务、徽章、愿望、道具卡）
- 图床管理（上传图片、瀑布流展示、引用次数、删除引用数为 0 的图片）
- 家庭管理（审核注册、暂停/恢复、删除、查看详细信息）
- 日志查看（全局 operation_logs、system_logs）
- 通知与沟通（发送通知给家长、家长联系管理员、回复）
- 权限边界（只观察、建议功能、不插手家庭管理）

**验收标准：**
- AC-1: 管理员可以创建和管理模板
- AC-2: 管理员可以上传和管理图片
- AC-3: 管理员可以审核家庭注册
- AC-4: 管理员可以查看全局日志
- AC-5: 管理员可以发送通知给家长
- AC-6: 管理员只能观察，不能干预家庭管理

#### FR-10: 操作日志与系统完整性

**需求描述：**
- 操作日志触发（10 大类操作：任务、积分、愿望、道具卡、积分银行、徽章、签到、家庭管理、模板、图床、通知）
- 日志格式（操作者、被操作者、操作类型、积分变动、详情 JSON、时间戳）
- 可见性（家长查看自己家庭、儿童查看自己、管理员查看全局）
- 归档策略（数据留存 3 年、可按年/月分区）

**验收标准：**
- AC-1: 系统记录 10 大类操作日志
- AC-2: 日志包含操作者、被操作者、操作类型、积分变动、详情 JSON、时间戳
- AC-3: 家长查看自己家庭的日志、儿童查看自己的日志、管理员查看全局日志
- AC-4: 日志数据留存 3 年，可按年/月分区

---

## 附录：参考资源

### 头脑风暴会话文档
- `_bmad-output/brainstorming/brainstorming-session-2026-02-10.md` - 完整的头脑风暴会话记录（150+ 个逻辑规则和架构决策）

### 技术规范文档
- `docs/TECH_SPEC.md` - 技术规范索引
- `docs/TECH_SPEC_ARCHITECTURE.md` - 架构设计
- `docs/TECH_SPEC_DATABASE.md` - 数据库设计
- `docs/TECH_SPEC_API.md` - API 规范
- `docs/TECH_SPEC_BDD.md` - BDD 开发规范
- `docs/TECH_SPEC_TYPES.md` - 类型系统
- `docs/TECH_SPEC_BUN.md` - Bun 运行时使用规范
- `docs/TECH_SPEC_LOGGING.md` - 日志规范
- `docs/TECH_SPEC_PERFORMANCE.md` - 性能优化规范
- `docs/TECH_SPEC_PWA.md` - PWA 规范

### 实施指导文档
- `docs/IMPLEMENTATION_GUIDE.md` - 实施路线图（包含核心产品边界原则、数据库表实施优先级、关键业务逻辑实施指导）

### 产品需求文档
- `specs/prd.md` - 产品需求文档
- `specs/product-brief.md` - 产品简介

### AI 代理决策手册
- `AGENTS.md` - AI 代理快速参考（包含 RED LIST、决策检查清单、验证流程）

---

## 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-11 | 1.0 | 基于 2026-02-10 头脑风暴会话成果创建，整合所有 TECH_SPEC 文档和 IMPLEMENTATION_GUIDE |

---

**文档状态：** ✅ 完整版 - 可用于 BMAD 代理（bmad-bmm-create-product-brief、bmad-agent-bmm-pm、bmad-bmm-create-prd）的实施指导
