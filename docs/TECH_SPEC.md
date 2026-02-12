# TECH_SPEC.md

> **技术规范索引** - 面向人类开发者的完整技术手册
>
> **AI 代理**：如需快速决策参考，请查看 [AGENTS.md](../AGENTS.md)

---

## 文档导航

| 文档 | 内容 | 适用场景 |
|------|------|----------|
| [TECH_SPEC_ARCHITECTURE.md](./TECH_SPEC_ARCHITECTURE.md) | 架构设计、目录结构、数据流 | 了解项目整体架构 |
| [TECH_SPEC_DATABASE.md](./TECH_SPEC_DATABASE.md) | 数据库设计、Schema、Drizzle ORM 使用 | 数据库开发 |
| [TECH_SPEC_TYPES.md](./TECH_SPEC_TYPES.md) | 类型系统、目录结构、继承模式 | 类型定义 |
| [TECH_SPEC_API.md](./TECH_SPEC_API.md) | API 规范、错误处理、认证 | 后端开发 |
| [TECH_SPEC_PWA.md](./TECH_SPEC_PWA.md) | PWA 配置、Service Worker、缓存策略 | PWA 实现 |
| [TECH_SPEC_TESTING.md](./TECH_SPEC_TESTING.md) | 测试策略、覆盖率、示例 | 测试开发 |
| [TECH_SPEC_BDD.md](./TECH_SPEC_BDD.md) | BDD 规范、Given-When-Then 实践 | 编写业务测试 |
| [TECH_SPEC_BUN.md](./TECH_SPEC_BUN.md) | Bun 运行时使用规范、API 详解 | Bun 开发 |
| [TECH_SPEC_PERFORMANCE.md](./TECH_SPEC_PERFORMANCE.md) | 性能优化策略、前端/后端/数据库优化 | 性能优化 |
| [TECH_SPEC_LOGGING.md](./TECH_SPEC_LOGGING.md) | 日志规范、logs 表设计、API 日志 | 日志开发 |

---

## 项目概述

Family Reward 是一款面向儿童的家庭行为管理游戏平台，通过量化日常行为、游戏化积分系统、愿望兑换（物品+互动体验），帮助家长理清培养计划，同时让孩子看到努力进度。

### 核心功能模块

| 模块 | 说明 | 主要用户 |
|------|------|----------|
| 用户认证 | 手机号+密码/PIN码登录 | 家长、儿童 |
| 任务计划 | 计划任务模板，支持循环规则 | 家长 |
| 日期策略 | 定义任务执行日期规则 | 家长 |
| 任务执行 | 每日任务生成、完成、审批 | 家长、儿童 |
| 积分系统 | 积分获取、扣除、历史记录 | 系统 |
| 愿望单 | 愿望创建、进度追踪、兑换 | 家长、儿童 |
| Combo激励 | 连续完成奖励机制 | 系统 |
| 徽章成就 | 多维度成长徽章体系 | 系统 |

---

## 技术栈概览

| 技术 | 版本 | 说明 |
|------|------|------|
| Bun | Latest | 运行时 |
| Next.js | 16.x | 框架 |
| Drizzle ORM | Latest | **强制使用** |
| Better-Auth | Latest | 认证 |
| Tailwind CSS | Latest | 样式 |
| Shadcn UI | Latest | 组件库 |

---

## 关键约定

### 强制 Drizzle ORM

**所有数据库操作必须通过 Drizzle ORM 完成，禁止原生 SQL。**

```typescript
// ✅ 正确
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const result = await db.query.tasks.findMany({
  where: eq(tasks.familyId, familyId)
});

// ❌ 禁止
const result = db.execute(`SELECT * FROM tasks`);
```

### SQLite 文件管理（开发阶段）

由于项目处于开发阶段且有换电脑开发需求，**SQLite 文件使用 Git 跟踪**：

```bash
# 数据库文件提交到 Git
database/
├── db.sql              # 主数据库（Git 跟踪）
└── migrations/         # 迁移脚本（Git 跟踪）
    └── 001_init.sql
```

**注意**：生产环境部署前应将 `db.sql` 加入 `.gitignore`，仅保留迁移脚本。

### Bun 优先

```typescript
// ✅ 正确
const file = Bun.file('./data.txt');
const hash = await Bun.password.hash('password');
const env = Bun.env.DATABASE_URL;

// ❌ 禁止
import { readFile } from 'fs/promises';
import bcrypt from 'bcrypt';
const env = process.env.DATABASE_URL;
```

---

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 初始化数据库

```bash
bun run db:init
```

### 3. 启动开发服务器

```bash
bun run dev
```

### 4. 运行测试

```bash
bun test
```

---

## 目录结构

```
my-app/
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由
│   ├── (dashboard)/          # 仪表板路由组
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 首页
├── components/               # React 组件
│   └── ui/                   # Shadcn UI 组件
├── lib/                      # 工具库
│   ├── db/                   # 数据库
│   │   ├── index.ts          # 数据库连接
│   │   ├── schema.ts         # Drizzle Schema
│   │   └── queries.ts        # 查询抽象层（强制使用）
│   ├── auth/                 # 认证相关
│   └── utils.ts              # 工具函数
├── types/                    # 类型定义（按模块命名）
│   ├── task.ts               # 任务相关类型
│   ├── user.ts               # 用户相关类型
│   ├── wishlist.ts           # 愿望单类型
│   ├── dto/                  # DTO 类型
│   └── db/                   # 数据库类型
├── constants/                # 常量
│   └── error-codes.ts        # 错误码定义
├── __tests__/                # 测试
├── database/                 # 数据库
│   ├── db.sql                # SQLite 文件（Git 跟踪）
│   └── migrations/           # SQL 迁移脚本
├── specs/                    # 需求文档
├── docs/                     # 技术文档
│   ├── TECH_SPEC.md          # 本文件
│   └── TECH_SPEC_*.md        # 详细规范
├── AGENTS.md                 # AI 代理指南
└── package.json
```

---

## 数据流架构

```
用户界面 (PWA)
      ↓
API 路由 (Next.js App)
      ↓
查询抽象层 (lib/db/queries/)
      ↓
Drizzle ORM
      ↓
bun:sqlite (database/db.sql)
```

**重要**：所有数据库查询必须通过 `lib/db/queries/`，禁止在组件/路由中直接操作数据库。

---

## 核心业务流程

### 任务生命周期

```
家长创建计划任务
      ↓
设置日期范围 + 日期策略
      ↓
系统批量生成任务
      ↓
儿童查看并标记完成
      ↓
家长审批（通过/拒绝）
      ↓
积分结算（+/-）
      ↓
更新 Combo 状态
      ↓
检查徽章成就
```

### 愿望兑换流程

```
儿童/家长创建愿望
      ↓
设置所需积分
      ↓
激活愿望（可兑换状态）
      ↓
儿童发起兑换请求
      ↓
家长审批
      ↓
扣除积分 → 标记已兑换
      ↓
家长履行愿望 → 标记完成
```

---

## 参考资源

- [Bun 官方文档](https://bun.sh/docs)
- [Next.js 16 文档](https://nextjs.org/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs/overview)
- [Better-Auth 文档](https://www.better-auth.com/docs/)
- [Shadcn UI 文档](https://ui.shadcn.com/docs)

---

## 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-06 | 3.0 | 重构：拆分多个文档，强制 Drizzle ORM |
| 2026-02-06 | 2.0 | 从 AGENTS.md 分离 |
| 2026-02-05 | 1.0 | 初始版本 |
