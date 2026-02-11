# Implementation Guide - Family Reward

> **实施指导文档** - 基于头脑风暴会话成果的实施路线图
>
> 本文档提供产品实施的指导性建议，详细技术规范请参考 TECH_SPEC_*.md 系列文档

---

## 文档来源

本文档基于 **2026-02-10 头脑风暴会话** 成果整理，会话详情请查看：
- `_bmad-output/brainstorming/brainstorming-session-2026-02-10.md`

---

## 核心产品边界原则

在实施过程中，必须始终遵循以下核心原则：

### 1. 家长完全控制原则

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

### 2. 管理员只观察不干预原则

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

### 3. 系统边界清晰原则

**定义：** 技术解决技术层面问题，家庭内部问题不介入

**实施要点：**
- 技术层面：数据记录、批量审批、积分计算、通知发送
- 不介入：家长冲突、孩子腻了、愿望没兑现、孩子间公平性
- 避免过度复杂化

**设计决策：**
- 不支持"只记录不奖励"的任务（用低分代替）
- 不支持孩子间的公平性调节（家长自行解释）
- 不处理愿望没兑现（家庭内部事情）

### 4. 线性叠加不回退原则

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

### 5. 产品边界务实原则

**定义：** 保持产品功能务实，避免过度设计

**实施要点：**
- 初期简单、后期升级（如并发控制、实时推送）
- 优先实现核心功能，游戏化功能逐步完善
- 技术选型务实（SQLite + 轮询同步，而非一开始就用 Redis + WebSocket）

---

## 数据库表实施优先级

基于头脑风暴会话梳理的21个表，按实施优先级排序：

### 第一优先级：核心功能表（立即实施）

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

**实施要点：**
- 补充 `families` 表的家庭注册相关字段（status, registrationType, maxParents, maxChildren, validityMonths 等）
- 补充 `users` 表的家庭角色字段（isPrimaryParent, isSecondaryParent）
- 新增 `task_categories` 表（用于徽章判定）

### 第二优先级：游戏化系统表（短-中期实施）

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

**实施要点：**
- Combo 规则存储在 `combo_rules` 表，与 `task_plans` 表关联
- 徽章判定基于 `task_categories` 表
- 道具卡有全局 CD、数量限制、过期时间

### 第三优先级：系统完整性表（中期实施）

| 表名 | 说明 | 状态 |
|------|------|------|
| **operation_logs** | 操作日志表 | 需新增 |
| **system_logs** | 系统日志表 | 需新增 |
| **notifications** | 通知表 | 需新增 |

**实施要点：**
- `operation_logs` 记录影响积分变动的操作（10大类）
- `system_logs` 记录系统级别的日志
- `notifications` 支持强通知（愿望兑换）和弱通知

### 第四优先级：模板系统表（长期实施）

| 表名 | 说明 | 状态 |
|------|------|------|
| **wishlist_templates** | 愿望模板表 | 需新增 |
| **medal_templates** | 徽章模板表 | 需新增 |

**实施要点：**
- 管理员创建模板，家长可以复制
- 模板有公开/私有标记

---

## 关键业务逻辑实施指导

### 1. 家庭注册流程

**两种注册方式：**

```typescript
// 方式1：管理员开通（直接 approved）
async function adminCreateFamily(data: AdminCreateFamilyDto) {
  const family = await db.insert(families).values({
    ...data,
    status: 'approved',
    registrationType: 'admin',
  });
  return family;
}

// 方式2：家长自主注册（pending，需管理员审核）
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

### 2. 任务重新激活策略

**两种策略供家长选择：**

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
    // 策略1：任务数不变，延后一天
    await db.update(tasks)
      .set({ status: 'pending', dueDate: addDays(new Date(), 1) })
      .where(eq(tasks.id, taskId));
    
    // 需要家长二次确认是否修改日期范围
    // 因为需要多生成一个任务
  } else {
    // 策略2：删除未完成的任务
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
  "itemCardExpiryDays": 100
}
```

### 3. 积分结算：线性叠加不回退

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
      const basePoints = task.plan.points;          // 任务完成分数（如10分）
      const penaltyPoints = task.plan.penaltyPoints; // 未完成扣分（如5分）
      const comboBonus = 0; // 如果有combo奖励，也要扣除
      
      const totalDeduction = -basePoints - penaltyPoints - comboBonus;
      await changePoints(task.assigneeId, totalDeduction, '任务驳回');
      
      await tx.update(tasks)
        .set({ status: 'cancelled', approvedBy, approvedAt: new Date() })
        .where(eq(tasks.id, taskId));
    }
  });
}
```

### 4. 道具卡自动弹窗询问

**场景：** 任务未完成时，系统判断是否有免combo中断卡，弹窗询问使用

```typescript
// 前端实现
async function checkItemCardAvailability(userId: string, taskId: string) {
  // 检查用户是否有免combo中断卡
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

### 5. 信贷额度机制

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

---

## 技术架构演进路径

### MVP 阶段（现在）

**并发控制：**
- 乐观锁：关键表（tasks, wishlists, bank_accounts）添加 version 字段
- 轮询同步：PWA和小程序每30秒轮询关键数据变更

**缓存策略：**
- 前期不做缓存
- SQLite 单连接，使用 WAL 模式提高并发

**实时推送：**
- 不实现实时推送
- 依靠轮询同步

### 中期阶段（3-6个月后）

**并发控制：**
- 评估乐观锁的性能
- 考虑引入 Redis 缓存

**实时推送：**
- 引入 SSE 或 WebSocket 推送关键事件
- 保留轮询作为备选

### 后期阶段（1年后）

**并发控制：**
- 全面使用 Redis 缓存
- 考虑迁移到 PostgreSQL

**实时推送：**
- 全面实时推送
- WebSocket + Redis Pub/Sub

---

## 实施检查清单

### 第一周：数据库表结构定义

- [ ] 补充 `families` 表的家庭注册相关字段
- [ ] 补充 `users` 表的家庭角色字段
- [ ] 新增 `account` 和 `session` 表（Better-Auth）
- [ ] 新增 `task_categories` 表
- [ ] 创建所有表的 Drizzle schema
- [ ] 执行 migration 创建表

### 第二周：用户角色与权限体系

- [ ] 实现家庭注册 API（管理员开通、家长自主注册）
- [ ] 配置 better-auth 认证（手机号+OTP）
- [ ] 创建鉴权中间件（role-based access control）
- [ ] 实现家庭审核 API（管理员批准/驳回）

### 第三周：核心功能逻辑（任务管理）

- [ ] 实现任务计划创建、生成、暂停、删除 API
- [ ] 实现任务完成、审批、驳回 API
- [ ] 实现任务重新激活逻辑（两种策略）
- [ ] 测试任务状态流转

### 第四周：核心功能逻辑（积分和愿望）

- [ ] 实现积分结算逻辑（审批后结算、线性叠加）
- [ ] 实现愿望管理 API（创建、审核、兑换）
- [ ] 实现信贷额度检查逻辑
- [ ] 测试积分变动和愿望兑换流程

### 第五-六周：基础通知系统

- [ ] 创建 `notifications` 表
- [ ] 实现愿望兑换强通知
- [ ] 实现小程序弹窗通知
- [ ] 实现通知已读标记

### 第七-八周：操作日志与系统日志

- [ ] 创建 `operation_logs` 和 `system_logs` 表
- [ ] 在关键操作点插入日志记录代码
- [ ] 实现日志查询 API（分权限）

### 第九-十二周：游戏化激励体系

- [ ] 实现徽章定义和判定逻辑
- [ ] 实现 Combo 规则和计算
- [ ] 实现道具卡获得、使用、过期逻辑
- [ ] 前端实现道具卡自动弹窗询问 UI
- [ ] 实现积分银行（活期/定期、利息、借贷）

---

## 参考资源

### 头脑风暴会话文档
- `_bmad-output/brainstorming/brainstorming-session-2026-02-10.md` - 完整的头脑风暴会话记录

### 技术规范文档
- `docs/TECH_SPEC.md` - 技术规范索引
- `docs/TECH_SPEC_DATABASE.md` - 数据库设计
- `docs/TECH_SPEC_ARCHITECTURE.md` - 架构设计
- `docs/TECH_SPEC_API.md` - API 规范
- `docs/TECH_SPEC_LOGGING.md` - 日志规范

### 产品需求文档
- `specs/prd.md` - 产品需求文档
- `specs/product-brief.md` - 产品简介

---

## 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-10 | 1.0 | 基于头脑风暴会话成果创建 |
