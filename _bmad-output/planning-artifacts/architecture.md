---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-bmad-test2-2026-02-11.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/prd-validation-report.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/project-context.md
  - _bmad-output/brainstorming/brainstorming-session-2026-02-10.md
  - docs/TECH_SPEC.md
  - docs/TECH_SPEC_ARCHITECTURE.md
  - docs/TECH_SPEC_DATABASE.md
  - docs/TECH_SPEC_BUN.md
  - docs/TECH_SPEC_TYPES.md
  - docs/TECH_SPEC_API.md
  - docs/TECH_SPEC_PWA.md
  - docs/TECH_SPEC_BDD.md
  - docs/TECH_SPEC_LOGGING.md
  - docs/TECH_SPEC_PERFORMANCE.md
  - docs/TECH_SPEC_TESTING.md
workflowType: 'architecture'
project_name: 'bmad-test2'
user_name: 'boss'
date: '2026-02-12'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
Family Reward 包含60个功能需求（FR1-FR60），涵盖：
- **用户管理（7个FR）：** 手机号/PIN码注册、角色管理（Parent/Child/Admin）、家庭设置
- **任务管理（12个FR）：** 计划任务模板创建、日期策略引擎、任务实例生成、审批流程
- **积分系统（9个FR）：** 线性叠加不回退、审批后结算、历史记录、余额管理
- **愿望系统（9个FR）：** 创建、审核、兑换流程、进度条实时计算
- **Combo激励（6个FR）：** 连续完成追踪、线性/阶梯奖励、宽限机制
- **游戏化（5个FR）：** 签到、徽章系统、等级系统
- **管理员功能（6个FR）：** 模板管理、家庭审核、图床管理、全局统计
- **通知与设置（6个FR）：** 任务提醒、审批通知、家庭规则配置

**架构意义：**
- 需要强大的状态管理（Zustand）处理实时同步和离线队列
- 数据库设计需要支持线性叠加、原子性操作、事务处理
- API设计需要支持乐观更新、冲突检测、批量操作

**Non-Functional Requirements:**
- **性能：** 页面加载 < 2秒，API响应 < 500ms（P95）
- **实时性：** 数据同步延迟 < 3秒
- **安全：** HTTPS/TLS 1.3、RBAC、会话管理（36小时）
- **合规性：** COPPA（13岁以下）、GDPR（16岁以下）、中国儿童保护（14岁以下）
- **数据留存：** 3年合规保留，软删除7天可恢复
- **可扩展性：** 支持5000 DAU，预留水平扩展能力
- **可靠性：** 系统可用性 > 99%，离线能力（IndexedDB + Service Worker）

**架构意义：**
- 需要缓存策略（预留Redis接口）
- 需要审计日志系统（operation_logs、system_logs）
- 需要乐观并发控制（version字段）

**Scale & Complexity:**
- **Primary domain:** 全栈Web应用（Full-Stack Web App）- PWA + 小程序支持
- **Complexity level:** 中等-偏高
- **Estimated architectural components:**
  - 前端组件：40-60个
  - API路由：30-50个
  - 数据库查询：60-80个（按表分文件）
  - 状态管理：复杂（实时同步 + 离线队列）

### Technical Constraints & Dependencies

**确定的技术栈：**
- **运行时：** Bun 1.3.x+（禁止Node.js兼容层）
- **前端框架：** Next.js 16.1.6 + React 19.2.3
- **数据库：** bun:sqlite + Drizzle ORM 0.45.1+（禁止原生SQL）
- **认证：** Better-Auth 1.4.18+（phone插件 + PIN码）
- **UI系统：** Tailwind CSS 4 + Shadcn UI 3.7.0+
- **测试：** Bun Test + Playwright 1.58.0（BDD风格）
- **类型系统：** TypeScript 5（strict模式，禁止`any`）

**关键实施规则（20条）：**
- 强制使用 Drizzle ORM（`lib/db/queries/`按表分文件）
- BDD开发（Given-When-Then格式，先写测试后实现）
- 禁止使用Node.js工具（必须用Bun内置：`Bun.file()`, `Bun.password.hash()`, `Bun.env`）
- 类型安全（`unknown` + 类型守卫，禁止`@ts-ignore`）
- 文件长度限制（所有文件 ≤ 800行）

**技术约束：**
- 数据库：SQLite（开发/生产共用，Git跟踪）
- 状态管理：Zustand
- 实时通信：初期轮询（2-3秒），后期预留SSE/WebSocket
- 图床存储：开发环境本地，生产环境云OSS（环境变量切换）
- 第三方服务：短信（开发环境模拟，生产环境接入云服务）

### Cross-Cutting Concerns Identified

1. **实时数据一致性**
   - 影响：前端状态管理、API设计、同步策略
   - 要求：3秒同步延迟、乐观更新、冲突处理

2. **多设备同步与离线队列**
   - 影响：Service Worker、IndexedDB、后端同步API
   - 要求：离线操作队列、上线自动同步、冲突解决（时间戳优先）

3. **儿童隐私合规**
   - 影响：数据库设计、认证流程、数据留存策略
   - 要求：3年留存、软删除7天可恢复、RBAC、审计日志

4. **双端体验差异化**
   - 影响：响应式设计、组件抽象、主题切换
   - 要求：儿童端游戏化（平板768px+）、家长端效率优先（小程序450px）

5. **积分结算与Combo计算**
   - 影响：数据库事务、API原子性、前端状态管理
   - 要求：审批后结算、线性叠加不回退、Combo奖励计算

6. **图床存储与CDN**
   - 影响：文件上传API、图片引用计数、存储抽象
   - 要求：开发环境本地存储、生产环境云OSS、环境变量切换

---

## Architecture Decision Records

### 决策点 1：数据库架构

**选项分析：**

| 选项 | 描述 | 优势 | 劣势 |
|------|------|------|------|
| **SQLite (bun:sqlite)** | 嵌入式数据库，开发/生产共用 | ✅ 零配置，易于迁移<br/>✅ Bun 原生支持<br/>✅ 单文件便于版本控制<br/>✅ 适合 MVP (5000 DAU) | ⚠️ 写锁限制并发<br/>⚠️ 水平扩展困难<br/>⚠️ 生产环境迁移需额外工作 |
| **PostgreSQL** | 全功能关系型数据库 | ✅ 高并发性能<br/>✅ 水平扩展能力强<br/>✅ 丰富的数据类型 | ❌ 运维复杂度<br/>❌ 开发环境需要额外设置<br/>❌ 增加学习曲线 |

**权衡矩阵：**

| 权衡维度 | SQLite | PostgreSQL |
|-----------|---------|-----------|
| **开发效率** | 🟢 优秀 | 🟡 中等 |
| **运维复杂度** | 🟢 低 | 🔴 高 |
| **并发性能** | 🟡 中等 | 🟢 优秀 |
| **扩展性** | 🟡 有限 | 🟢 优秀 |
| **与 PRD 对齐** | ✅ 支持 5000 DAU | ✅ 支持 5000 DAU + 水平扩展 |
| **技术栈一致性** | ✅ Bun 原生 | ⚠️ 需要额外驱动 |

**决策：选择 SQLite (bun:sqlite)**

**理由：**
1. **MVP 范围匹配：** PRD 明确支持 5000 DAU，SQLite 完全满足此需求
2. **开发效率优先：** project-context.md 强调 Bun 原生工具，零配置显著加快开发速度
3. **演进路径清晰：** 技术规范预留 PostgreSQL 迁移路径（二期用户增长后升级）
4. **成本效益：** 单文件架构减少运维复杂度，适合小团队
5. **PRD 对齐：** Tech Spec 明确使用 SQLite，保持文档一致性

**架构含义：**
- 使用 WAL 模式提升并发性能
- 实施乐观并发控制（version 字段）
- 设计数据库迁移策略（drizzle-kit）
- 预留 Redis 缓存接口（不立即实现）

### 决策点 2：实时通信策略

**选项分析：**

| 选项 | 描述 | 优势 | 劣势 |
|------|------|------|------|
| **轮询** | 前端定时请求数据（2-3秒） | ✅ 实现简单<br/>✅ 无服务器额外开销<br/>✅ 兼容所有环境 | ⚠️ 服务器负载<br/>⚠️ 数据延迟<br/>⚠️ 带宽浪费 |
| **SSE (Server-Sent Events)** | 服务器主动推送事件流 | ✅ 实时性好<br/>✅ 单向高效<br/>✅ HTTP 标准协议 | ⚠️ 双向通信复杂<br/>⚠️ 代理服务器支持有限 |
| **WebSocket** | 全双工持久连接 | ✅ 双向实时<br/>✅ 低延迟<br/>✅ 高效协议 | ❌ 服务器资源消耗大<br/>❌ 连接管理复杂<br/>❌ 防火墙兼容性 |

**权衡矩阵：**

| 权衡维度 | 轮询 | SSE | WebSocket |
|-----------|-------|-----|-----------|
| **实现复杂度** | 🟢 简单 | 🟡 中等 | 🔴 复杂 |
| **实时性能** | 🟡 2-3秒延迟 | 🟢 < 1秒延迟 | 🟢 < 1秒延迟 |
| **服务器资源** | 🟡 中等负载 | 🟢 低负载 | 🔴 高负载 |
| **与 PRD 对齐** | ✅ < 3秒要求 | ✅ < 3秒要求 | ✅ < 3秒要求 |
| **演进路径** | ⚠️ 需要升级 | ⚠️ 需要升级 | 🟢 最终方案 |

**决策：选择混合方案 - 初期轮询，预留 SSE/WebSocket 接口**

**理由：**
1. **MVP 快速启动：** 轮询实现简单，2-3秒延迟满足 PRD 要求
2. **技术债务可控：** 预留升级路径，不影响用户增长后扩展
3. **开发效率：** 避免过度工程化，专注核心功能
4. **渐进式演进：** Tech Spec 明确"轮询→SSE→WebSocket"三阶段策略

**架构含义：**
- 前端使用 `setInterval` 或 `setTimeout` 定期请求数据
- API 设计支持 `lastModified` 或 `version` 字段实现增量更新
- 预留 `/api/stream` 端点用于 SSE/WebSocket 升级
- 乐观更新减少延迟感知

### 决策点 3：状态管理

**选项分析：**

| 选项 | 描述 | 优势 | 劣势 |
|------|------|------|------|
| **Zustand** | 轻量级状态管理 | ✅ 简单易用<br/>✅ 无样板代码<br/>✅ TypeScript 友好<br/>✅ Bun 性能好 | ⚠️ 生态较小<br/>⚠️ 中间件有限 |
| **Redux Toolkit** | 完整状态管理方案 | ✅ 生态丰富<br/>✅ DevTools 完善<br/>✅ 中间件强大 | ❌ 样板代码多<br/>❌ Bundle 较大<br/>❌ 学习曲线陡 |
| **Jotai** | 类型优先的状态管理 | ✅ 类型安全强大<br/>✅ 简洁 API | ⚠️ 社区较新<br/>⚠️ 文档较少 |

**权衡矩阵：**

| 权衡维度 | Zustand | Redux Toolkit | Jotai |
|-----------|---------|--------------|-------|
| **学习曲线** | 🟢 低 | 🔴 高 | 🟡 中等 |
| **Bundle 大小** | 🟢 小 | 🟡 中等 | 🟢 小 |
| **TypeScript 支持** | 🟢 优秀 | 🟡 中等 | 🟢 优秀 |
| **开发效率** | 🟢 优秀 | 🟡 中等 | 🟢 优秀 |
| **社区支持** | 🟡 中等 | 🟢 优秀 | 🟡 中等 |

**决策：选择 Zustand**

**理由：**
1. **技术栈一致性：** 项目使用 Bun + React，Zustand 性能优异
2. **开发效率优先：** 简单 API 减少样板代码，加快 MVP 开发
3. **复杂度匹配：** 实时同步 + 离线队列不需要复杂状态管理
4. **团队友好：** API 简洁直观，新成员快速上手
5. **性能优异：** 零订阅开销，快速更新

**架构含义：**
- 分离数据层和 UI 层状态
- 使用 `persist` 中间件处理离线存储（IndexedDB）
- 定义清晰的 store slices（user、tasks、sync、wishlist）
- 避免过度抽象，保持扁平状态结构

### 决策点 4：图表库

**选项分析：**

| 选项 | 描述 | 优势 | 劣势 |
|------|------|------|------|
| **Recharts** | React 图表库 | ✅ 声明式 API<br/>✅ TypeScript 原生<br/>✅ 响应式设计<br/>✅ 自定义灵活 | ⚠️ Bundle 较大<br/>⚠️ 复杂图表性能一般 |
| **Chart.js** | 简单图表库 | ✅ 轻量级<br/>✅ 性能优秀<br/>✅ 文档完善 | ⚠️ TypeScript 支持较弱<br/>⚠️ 自定义复杂 |
| **Victory** | React 组件化图表 | ✅ 动画优秀<br/>✅ 声明式 API<br/>✅ TypeScript 友好 | ⚠️ Bundle 较大<br/>⚠️ 学习曲线中等 |

**权衡矩阵：**

| 权衡维度 | Recharts | Chart.js | Victory |
|-----------|----------|----------|---------|
| **Bundle 大小** | 🟡 中等 | 🟢 小 | 🟡 中等 |
| **TypeScript 支持** | 🟢 优秀 | 🟡 中等 | 🟢 优秀 |
| **动画质量** | 🟡 中等 | 🟡 中等 | 🟢 优秀 |
| **学习曲线** | 🟢 低 | 🟢 低 | 🟡 中等 |
| **与 Shadcn 兼容** | 🟢 优秀 | 🟡 中等 | 🟢 优秀 |

**决策：选择 Recharts**

**理由：**
1. **技术栈一致性：** React 原生，TypeScript 优秀支持
2. **设计系统兼容：** 与 Tailwind + Shadcn UI 无缝集成
3. **功能需求匹配：** 足够实现 UX Design 中的成长曲线和任务完成率图表
4. **可维护性：** 声明式 API 易于理解和维护
5. **性能可接受：** MVP 范围的图表数量（< 10 个）性能足够

**架构含义：**
- 创建可复用图表组件封装
- 使用 `ResponsiveContainer` 实现响应式设计
- 预留性能优化空间（虚拟化大数据集）
- 严格限制图表类型（Line, Bar, Pie）

### 决策点 5：动画系统

**选项分析：**

| 选项 | 描述 | 优势 | 劣势 |
|------|------|------|------|
| **CSS 动画** | 原生 CSS 过渡 | ✅ 零依赖<br/>✅ 性能优秀<br/>✅ 浏览器原生 | ⚠️ 复杂动画难实现<br/>⚠️ 物理模拟困难 |
| **Framer Motion** | React 动画库 | ✅ 声明式 API<br/>✅ 手势支持<br/>✅ 物理模拟<br/>✅ TypeScript 优秀 | ❌ Bundle 较大<br/>❌ 学习曲线 |
| **React Spring** | 基于物理的动画 | ✅ 自然效果<br/>✅ 性能优秀 | ⚠️ API 较底层<br/>⚠️ 文档较少 |

**权衡矩阵：**

| 权衡维度 | CSS 动画 | Framer Motion | React Spring |
|-----------|-----------|--------------|-------------|
| **Bundle 大小** | 🟢 零 | 🟡 中等 | 🟡 中等 |
| **实现复杂度** | 🟡 复杂动画难 | 🟢 声明式简单 | 🟡 物理动画简单 |
| **性能** | 🟢 优秀 | 🟡 中等 | 🟢 优秀 |
| **游戏化支持** | 🟡 有限 | 🟢 优秀（徽章动画） | 🟢 优秀 |
| **学习曲线** | 🟢 CSS 基础 | 🟡 中等 | 🟡 中等 |

**决策：选择 CSS 动画优先 + Framer Motion 补充**

**理由：**
1. **性能优先：** MVP 范围使用 CSS 动画足够，零依赖
2. **开发效率：** Tailwind CSS 内置动画支持，快速实现
3. **按需引入：** Framer Motion 仅用于复杂游戏化元素（徽章庆祝）
4. **渐进式复杂度：** 简单动画用 CSS，复杂动画才用库
5. **Bundle 优化：** 动态导入 Framer Motion，减少初始加载

**架构含义：**
- 使用 Tailwind `transition` 和 `animate` 工具类
- 创建 `@keyframes` 定义徽章庆祝动画
- 为 Framer Motion 配置代码分割
- 限制动画时长（< 500ms）保持响应性

### 决策点 6：缓存策略

**选项分析：**

| 选项 | 描述 | 优势 | 劣势 |
|------|------|------|------|
| **无缓存** | 直连数据库 | ✅ 零复杂度<br/>✅ 数据一致性<br/>✅ 无过期问题 | ⚠️ 高频查询慢<br/>⚠️ 数据库负载高 |
| **Redis** | 内存键值存储 | ✅ 高性能<br/>✅ 支持复杂数据结构<br/>✅ 自动过期 | ❌ 部署复杂<br/>❌ 运维成本<br/>❌ MVP 不需要 |

**权衡矩阵：**

| 权衡维度 | 无缓存 | Redis |
|-----------|--------|-------|
| **开发效率** | 🟢 零配置 | 🟡 中等 |
| **性能** | 🟡 SQLite 够用 | 🟢 优秀 |
| **运维复杂度** | 🟢 低 | 🔴 高 |
| **MVP 需求** | ✅ 充分 | ⚠️ 过度工程化 |

**决策：选择 MVP 无缓存，预留 Redis 接口**

**理由：**
1. **MVP 范围匹配：** 5000 DAU，SQLite 性能足够，无需额外缓存层
2. **开发效率优先：** 减少运维复杂度，专注核心功能
3. **演进路径清晰：** Tech Spec 预留 Redis 接口，用户增长后升级
4. **避免过度设计：** 过早优化是万恶之源，YAGNI 原则
5. **性能验证优先：** 先验证 SQLite 性能瓶颈，再决定是否需要缓存

**架构含义：**
- 使用 SQLite WAL 模式提升并发读取
- 实施数据库索引策略优化查询
- 预留 `lib/cache/` 抽象层接口（当前直连数据库）
- 定义缓存键命名规范（`user:{id}`, `tasks:{familyId}`）

---

## 架构决策总结

| 决策点 | 选择 | 关键权衡 | 理由 |
|---------|------|----------|------|
| **数据库架构** | SQLite (bun:sqlite) | 并发性能 vs 开发效率 | MVP 范围匹配，预留升级路径 |
| **实时通信** | 混合方案（初期轮询） | 实时性 vs 实现复杂度 | PRD < 3秒要求满足，渐进演进 |
| **状态管理** | Zustand | 生态 vs 简洁 | Bun 性能好，开发效率高 |
| **图表库** | Recharts | Bundle vs 功能 | React 原生，TypeScript 友好 |
| **动画系统** | CSS + Framer Motion | 性能 vs 功能 | CSS 够用，复杂动画才用库 |
| **缓存策略** | MVP 无缓存，预留 Redis | 性能 vs 复杂度 | SQLite 够用，避免过度设计 |
Advanced Elicitation Insights (Graph of Thoughts Analysis)

### Decision Dependency Graph

SQLite    ��ѯ   Zustand  Recharts   CSS+Motion   �޻���
Advanced Elicitation Insights (Graph of Thoughts Analysis)

Decision Dependency Graph

SQLite    ��ѯ   Zustand  Recharts   CSS+Motion   �޻���
