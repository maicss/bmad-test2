# 提示词优化建议报告

## 文档评价与优化方向总览

### 一、当前文档结构问题诊断

#### 1.1 结构层级混乱
**问题描述**：
- 文档之间缺乏清晰的依赖关系和引用规范
- `specs/` 目录下的文档按功能模块组织，但没有索引文件说明模块间关系
- `AGENTS.md` 包含了技术规范、工作流程、测试要求等多类信息，职责不单一

**优化方向**：
1. **建立文档层级体系**：明确 PRD → Architecture → Epic/Story → Task 的层级关系
2. **增加导航索引**：在 `specs/` 根目录创建 `README.md` 说明各模块关系
3. **职责分离**：将 `AGENTS.md` 拆分为 `TECH_SPEC.md`（技术规范）和 `AGENT_GUIDE.md`（AI代理指南）

#### 1.2 内容完整性不足
**问题描述**：
- PRD 缺少关键验收标准（如 AC-2, AC-8 缺失编号）
- 功能需求与验收标准未建立清晰的追踪矩阵
- 非功能性需求（NFR）缺乏量化指标

**优化方向**：
1. **补全需求编号体系**：所有需求、验收标准必须有唯一编号
2. **建立需求追踪矩阵**：在 PRD 中增加 "需求-验收标准-测试用例" 映射表
3. **量化 NFR 指标**：将 "3秒内响应" 等模糊表述改为 "95th percentile < 3s"

#### 1.3 技术规范冲突
**问题描述**：
- `AGENTS.md` 要求 "No legacy patterns (v15 or below)"，但未明确如何识别 legacy pattern
- PWA 要求与 Next.js 16 的某些特性可能存在冲突（如 Service Worker 配置）
- Redis 缓存要求与 SQLite 主存储的并发处理逻辑未明确

**优化方向**：
1. **增加 Legacy Pattern 识别指南**：列出具体的不推荐做法和替代方案
2. **明确技术约束边界**：哪些场景允许例外，哪些必须严格遵守
3. **补充架构决策记录（ADR）**：记录 Redis + SQLite 方案的技术权衡

---

## 二、AGENTS.md 具体优化建议

### 2.1 章节结构调整

**当前结构问题**：
- Section I 混合了环境约束和技术选型
- Section III 的 "Verification Flow" 与 "Testing & Coverage" 有重叠
- 缺少 "故障处理" 和 "回滚策略" 章节

**建议新结构**：
```
I. 技术栈规范 (Tech Stack)
   - 运行时与核心API
   - 前端框架
   - 后端与认证
   - 数据库与缓存

II. 代码质量标准 (Code Quality)
   - TypeScript 规范
   - 架构模式
   - 安全规范

III. 开发与验证流程 (Workflow)
   - 开发前检查清单
   - 代码审查要求
   - 测试策略

IV. 部署与运维 (Operations)
   - 部署检查清单
   - 监控与告警
   - 故障处理与回滚

V. AI 代理行为规范 (Agent Guidelines)
   - 决策边界
   - 禁止事项
   - 升级路径
```

### 2.2 具体条款优化

#### 条款 I.1 - Runtime & Core APIs

**当前内容**：
```markdown
- **Runtime:** Use **Bun** exclusively. Do not implement Node.js compatibility layers.
- **Database:** Use built-in `bun:sqlite` only with Drizzle ORM.
```

**问题**：
1. "Do not implement Node.js compatibility layers" 表述模糊，实际开发中如何界定？
2. 未说明 Drizzle ORM 的具体版本要求
3. 缺少 `bun:sqlite` 性能基准和限制说明

**优化建议**：
```markdown
- **Runtime:** Use **Bun** exclusively (v1.3.x+)
  - **禁止事项**：
    - 使用 `process.env` 时，优先使用 `Bun.env`
    - 禁止使用 `fs/promises`，改用 `Bun.file()` 和 `Bun.write()`
    - 禁止引入 `node:` 前缀的 polyfill 包（如 `node-fetch`, `node-crypto`）
  - **例外场景**：仅当 Bun API 明确不支持某功能时，允许使用 Node.js API，需在代码注释中说明原因

- **Database:** Use built-in `bun:sqlite` only with Drizzle ORM (v0.45+)
  - **路径规则**：`database/db.sql`（生产）/ `database/db.test.sql`（测试）
  - **查询抽象**：所有复杂 SQL 必须封装到 `lib/db/queries.ts`，禁止在组件/路由中直接写 SQL
  - **连接池**：单连接模式，`bun:sqlite` 默认单线程，需通过外部队列处理并发写入
  - **性能基准**：
    - 查询：单表 < 50ms，联表 < 100ms
    - 写入：批量插入 < 500 records/s
```

---

#### 条款 I.2 - Authentication & UI Framework

**当前内容**：
```markdown
- **Authentication:** **Better-Auth** integration.
  - **Plugin:** `phone + password` (Must support both Password and OTP flows).
```

**问题**：
1. 未明确 phone 验证的提供商（如 Twilio、阿里云短信）
2. "Skills" 概念不明确，且 `onmax/next-skills` 包名可能是笔误
3. 缺少 OTP 验证码的过期时间和重试次数限制

**优化建议**：
```markdown
- **Authentication:** **Better-Auth** (v1.x) with custom phone adapter
  - **核心插件**：
    - 手机号登录：`better-auth/plugins/phone`
    - 会话管理：`better-auth/plugins/session`
    - 速率限制：自定义实现，登录失败 5 次/15分钟锁定
  - **OTP 配置**：
    - 验证码长度：6 位数字
    - 有效期：5 分钟
    - 重试间隔：60 秒
    - 提供商：[待配置，建议阿里云短信/腾讯云短信]
  - **PIN 码登录（儿童共享设备）**：
    - PIN 长度：6 位数字
    - 输入错误 3 次后锁定 5 分钟
    - 会话有效期：2 分钟无操作自动锁定
    - 实现位置：`lib/auth/pin-auth.ts`
  - **会话存储**：HttpOnly Cookie + 数据库存储
    - 家长会话：24 小时滚动过期
    - 儿童 PIN 会话：2 分钟无操作过期

- **UI Framework:** Next.js 16 (Latest Stable)
  - **Server Components 优先规则**：
    - 所有数据获取逻辑必须在 Server Component 中完成
    - 仅以下场景允许 `'use client'`：
      - 表单交互（使用 React Hook Form）
      - 动画效果（使用 Framer Motion）
      - 实时更新（WebSocket 连接）
  - **Legacy Pattern 黑名单**（禁止使用的 Next.js 14/15 模式）：
    | 旧模式 | 新模式 | 说明 |
    |--------|--------|------|
    | `getServerSideProps` | Server Component + async/await | 数据获取 |
    | `getStaticProps` | `export const dynamic = 'force-static'` | 静态生成 |
    | `next/head` | `next/head` (v16 新 API) | 元数据 |
    | `pages/_app.tsx` | `app/layout.tsx` | 根布局 |
    | `useRouter` (Pages Router) | `useRouter` (App Router) | 路由 |
```

---

#### 条款 I.3 - PWA 要求

**当前内容**：
```markdown
- **Build Target:** PWA (Progressive Web App)
  - **Validation:** Must pass **Lighthouse PWA audit** with a score > 90.
```

**问题**：
1. 未明确 PWA 的具体实现方式（next-pwa vs 手动配置）
2. Service Worker 缓存策略未定义
3. 离线功能的具体范围未明确

**优化建议**：
```markdown
- **PWA 架构**：
  - **基础包**：`next-pwa` (v5+) 或手动配置 `workbox`
  - **必需文件**：
    - `public/manifest.json`（Web App Manifest v1）
    - `public/sw.js`（Service Worker，或 `next-pwa` 自动生成）
    - `public/icons/`（192x192, 512x512 PNG + Apple Touch Icon）
  
- **缓存策略**：
  | 资源类型 | 缓存策略 | 说明 |
  |----------|----------|------|
  | HTML 页面 | Network First | 优先在线，离线用缓存 |
  | JS/CSS 静态资源 | Cache First | 长期缓存，版本更新时失效 |
  | API 响应 (GET) | Stale While Revalidate | 先返回缓存，后台更新 |
  | 用户数据 | IndexedDB | 使用 `idb` 库存储 |

- **离线功能范围**：
  - **必须离线可用**：任务列表查看、积分查询、愿望单查看
  - **需网络连接**：任务完成提交、积分结算、愿望兑换（支持离线队列，联网后同步）
  
- **验证清单**：
  - [ ] Lighthouse PWA 评分 > 90
  - [ ] Installable 检测通过
  - [ ] Offline 检测通过（断开网络后页面可正常访问）
  - [ ] Service Worker 注册成功（Chrome DevTools > Application > Service Workers）
```

---

#### 条款 II - TypeScript & Architecture Standards

**当前内容**：
```markdown
- **Inheritance Pattern:** 1. Define **Base Data Types** (Atomic entities). 2. Extend Base Types for specific contexts (Database, API DTOs, Frontend Props).
```

**问题**：
1. 示例不足，开发者难以理解如何实践
2. 未明确 `types/` 目录的具体文件组织方式
3. 缺少 DTO 转换层的规范

**优化建议**：
```markdown
- **类型系统架构**：
  
  ```
  types/
  ├── base/                 # 原子类型定义
  │   ├── user.ts          # User, UserRole, UserStatus
  │   ├── task.ts          # Task, TaskStatus, TaskType
  │   └── wishlist.ts      # Wishlist, WishlistType
  ├── dto/                 # 数据传输对象（API 层）
  │   ├── request/         # API 请求体类型
  │   │   ├── task.dto.ts
  │   │   └── auth.dto.ts
  │   └── response/        # API 响应类型
  │       ├── task.dto.ts
  │       └── auth.dto.ts
  ├── db/                  # 数据库 Schema 类型
  │   └── schema.ts        # Drizzle ORM 类型导出
  └── components/          # UI Props 类型
      └── task-card.props.ts
  ```

- **继承模式示例**：
  
  ```typescript
  // types/base/task.ts
  export interface TaskBase {
    id: string;
    title: string;
    points: number;
    status: 'pending' | 'completed' | 'cancelled';
  }
  
  // types/db/schema.ts
  import { TaskBase } from '@/types/base/task';
  
  export interface TaskRecord extends TaskBase {
    createdAt: Date;
    updatedAt: Date;
    familyId: string;
  }
  
  // types/dto/request/task.dto.ts
  import { TaskBase } from '@/types/base/task';
  
  export interface CreateTaskDto extends Omit<TaskBase, 'id' | 'status'> {
    familyId: string;
  }
  
  // types/dto/response/task.dto.ts
  import { TaskBase } from '@/types/base/task';
  
  export interface TaskResponseDto extends TaskBase {
    createdAt: string; // ISO 8601 format for JSON
    progress: number;
  }
  ```

- **禁止事项**：
  - `any` 类型（使用 `unknown` + 类型守卫替代）
  - 类型断言（`as Type`）（必须通过类型守卫或验证库如 Zod）
  - 在组件中重复定义 Props 类型（必须从 `types/components/` 导入）
```

---

#### 条款 III.1 - Pre-execution Thought Process

**当前内容**：
```markdown
Before any write operation, the Agent must document the following in `THOUGHTS.md` or as a response prefix:
1. **Impacted Files:** List all files to be created or modified.
2. **Schema Changes:** Detail any database migrations or structural changes.
3. **PWA Impact:** Does this change affect service workers, caching, or manifest?
4. **Breaking Risks:** Assess potential impact on existing features.
```

**问题**：
1. `THOUGHTS.md` 的位置和格式未明确
2. "response prefix" 方式在实际对话中难以追踪
3. 缺少风险评估的量化标准

**优化建议**：
```markdown
- **开发前检查清单（Pre-execution Checklist）**：
  
  在创建/修改文件前，必须输出以下结构化分析：
  
  ```markdown
  ## 变更分析：[功能名称]
  
  ### 1. 影响文件清单
  | 文件路径 | 操作类型 | 说明 |
  |----------|----------|------|
  | `app/api/tasks/route.ts` | 新增 | 任务列表 API |
  | `lib/db/queries.ts` | 修改 | 添加 `getTasksByFamilyId` 查询 |
  | `types/dto/task.dto.ts` | 新增 | 任务相关 DTO 类型 |
  
  ### 2. 数据库变更
  - **迁移脚本**: `database/migrations/001_add_task_table.sql`
  - **Schema 变更**: 
    ```sql
    CREATE TABLE tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      points INTEGER NOT NULL
    );
    ```
  - **回滚脚本**: `database/migrations/001_add_task_table_rollback.sql`
  
  ### 3. API 变更
  - **新端点**: `GET /api/tasks`
  - **请求参数**: `familyId` (query, required)
  - **响应格式**: `TaskResponseDto[]`
  
  ### 4. PWA 影响评估
  - [ ] 影响 Service Worker 缓存策略
  - [ ] 需要更新 manifest.json
  - [ ] 新增离线功能支持
  
  ### 5. 风险评估
  | 风险项 | 等级 | 缓解措施 |
  |--------|------|----------|
  | 新 API 与旧版本不兼容 | 中 | 添加 API 版本前缀 `/api/v1/` |
  | 数据库表结构变更导致数据丢失 | 高 | 完整迁移脚本 + 数据备份验证 |
  ```

- **存储位置**：
  - 单次变更：直接输出在对话中
  - 复杂功能（>5 个文件）：创建 `docs/adr/[feature-name].md`
```

---

#### 条款 III.2 - Verification Flow

**当前内容**：
```markdown
- **Server Pre-flight Check:**
  - Verify if the port is occupied.
  - **Identity Check:** Run `curl http://localhost:[port]/` and verify if the `<title>` matches the metadata in Next.js.
```

**问题**：
1. PowerShell 命令与 Unix 命令混用（`curl` 在 PowerShell 中是别名）
2. 端口检测命令未提供
3. 验证失败后的处理流程未明确

**优化建议**：
```markdown
- **本地开发验证流程**（PowerShell 命令）：

  ```powershell
  # 1. 端口检测（3344 为默认端口）
  $port = 3344
  $connection = Test-NetConnection -ComputerName localhost -Port $port
  if ($connection.TcpTestSucceeded) {
      Write-Host "⚠️  端口 $port 已被占用，尝试查找进程..."
      Get-Process -Id (Get-NetTCPConnection -LocalPort $port).OwningProcess
      # 如需终止：Stop-Process -Id <PID>
  } else {
      Write-Host "✅ 端口 $port 可用"
  }

  # 2. 服务启动（后台运行）
  Start-Process -FilePath "bun" -ArgumentList "run","dev" -WindowStyle Hidden
  Start-Sleep -Seconds 5  # 等待服务启动

  # 3. 身份验证（检查标题是否匹配）
  $response = Invoke-WebRequest -Uri "http://localhost:$port/"
  $expectedTitle = "Family Reward"  # 应与 app/layout.tsx 中的 metadata.title 一致
  if ($response.Content -match "<title>$expectedTitle</title>") {
      Write-Host "✅ 身份验证通过，标题匹配: $expectedTitle"
  } else {
      Write-Host "❌ 身份验证失败，请检查 metadata 配置"
      # 终止冲突进程逻辑...
  }

  # 4. API 健康检查
  $apiResponse = Invoke-WebRequest -Uri "http://localhost:$port/api/health" -ErrorAction SilentlyContinue
  if ($apiResponse.StatusCode -eq 200) {
      Write-Host "✅ API 服务正常"
  } else {
      Write-Host "❌ API 服务异常"
  }
  ```

- **自动化验证脚本**：
  创建 `scripts/verify-local.ps1`，每次开发前自动执行上述检查
```

---

#### 条款 III.4 - Testing & Coverage

**当前内容**：
```markdown
- **Hierarchy:** Integration Tests (Primary) > Unit Tests > E2E Tests (Playwright with local Chrome).
- **Metric:** Minimum **80% code coverage** required. Report actual coverage metrics upon completion.
```

**问题**：
1. 测试文件命名和位置规范未明确
2. 80% 覆盖率的统计范围未定义（是否包含类型定义文件？）
3. E2E 测试的数据准备策略未说明

**优化建议**：
```markdown
- **测试策略金字塔**：
  
  ```
       /\
      /  \   E2E Tests (Playwright)
     /____\     10% - 关键用户旅程
    /      \
   /        \ Integration Tests (bun test)
  /__________\   60% - API 端点、数据库查询、业务逻辑
  /            \
 /              \ Unit Tests (bun test)
/________________\ 30% - 纯函数、工具类、类型守卫
  ```

- **测试文件规范**：
  ```
  __tests__/
  ├── unit/                    # 单元测试
  │   ├── lib/
  │   │   └── utils.test.ts    # 对应 lib/utils.ts
  │   └── types/
  │       └── guards.test.ts
  ├── integration/             # 集成测试
  │   ├── api/
  │   │   ├── tasks.test.ts    # 对应 app/api/tasks/
  │   │   └── auth.test.ts
  │   └── db/
  │       └── queries.test.ts  # 对应 lib/db/queries.ts
  └── e2e/                     # E2E 测试（Playwright）
      ├── auth-flow.spec.ts
      └── task-lifecycle.spec.ts
  ```

- **覆盖率计算规则**：
  - **统计范围**：`app/`, `lib/`, `types/dto/`, `types/db/`
  - **排除项**：`types/base/`（纯类型定义）、`components/`（UI 组件通过 E2E 覆盖）
  - **目标分解**：
    | 模块类型 | 覆盖率目标 | 说明 |
    |----------|------------|------|
    | API 路由 | 90% | 必须覆盖所有错误处理分支 |
    | 数据库查询 | 85% | 复杂查询必须测试 |
    | 业务逻辑 | 80% | 核心积分计算、权限判断 |
    | 工具函数 | 70% | 简单函数可降低要求 |

- **测试数据管理**：
  - **单元/集成测试**：使用 `database/db.test.sql` + 每个测试文件的 `beforeEach` 重置
  - **E2E 测试**：使用 `scripts/seed-e2e.ts` 准备固定数据集（测试数据套件）
  - **数据隔离**：每个测试文件使用独立的事务，测试后回滚
```

---

#### 新增条款：数据留存与隐私合规

**背景**：PRD 中提到了 COPPA/GDPR/中国儿童个人信息网络保护规定，但 `AGENTS.md` 未明确技术实现要求。

**建议新增内容**：
```markdown
### IV. 数据留存与隐私合规

- **儿童年龄分级**：
  | 年龄段 | 合规要求 | 技术实现 |
  |--------|----------|----------|
  | < 14 岁 | 家长同意机制 | 注册时必须验证家长手机号 |
  | 14-16 岁 | 明确同意 | 独立同意流程，家长可查看 |
  | > 16 岁 | 标准 GDPR | 完全自主权 |

- **数据保留策略**：
  - **活跃用户数据**：3 年保留期（可配置）
  - **软删除**：`deleted_at` 字段标记，保留 7 天可恢复
  - **归档数据**：超过 3 年的历史数据迁移到 `database/archive.db`（只读）
  - **完全删除**：用户主动请求后 30 天内物理删除（符合 GDPR "Right to Erasure"）

- **隐私保护技术措施**：
  - **数据最小化**：仅收集必要字段（手机号、昵称、积分）
  - **敏感数据加密**：儿童真实姓名存储在独立表，AES-256 加密
  - **访问日志**：所有数据查询记录到 `logs/data_access.log`
  - **家长控制面板**：家长可查看孩子所有数据，支持导出（GDPR Right to Data Portability）
```

---

#### 新增条款：错误处理与日志规范

**建议新增内容**：
```markdown
### V. 错误处理与日志

- **错误码规范**（`constants/error-codes.ts`）：
  ```typescript
  export const ErrorCodes = {
    // 认证错误 (1xxx)
    AUTH_INVALID_CREDENTIALS: 'AUTH_1001',
    AUTH_SESSION_EXPIRED: 'AUTH_1002',
    AUTH_PIN_LOCKED: 'AUTH_1003',
    
    // 业务错误 (2xxx)
    TASK_NOT_FOUND: 'BIZ_2001',
    TASK_ALREADY_COMPLETED: 'BIZ_2002',
    INSUFFICIENT_POINTS: 'BIZ_2003',
    
    // 系统错误 (9xxx)
    DB_CONNECTION_ERROR: 'SYS_9001',
    UNKNOWN_ERROR: 'SYS_9999',
  } as const;
  ```

- **API 错误响应格式**：
  ```json
  {
    "code": "BIZ_2001",
    "message": "任务不存在",
    "details": {
      "taskId": "task-123",
      "suggestion": "请检查任务ID是否正确"
    },
    "requestId": "req_abc123"  // 用于日志追踪
  }
  ```

- **日志规范**：
  - **日志级别**：ERROR（生产环境）/ WARN / INFO / DEBUG（开发环境）
  - **日志内容**：时间戳、请求ID、用户ID、操作、结果、耗时
  - **存储位置**：`logs/app.log`（轮转，保留 30 天）
  - **敏感信息**：手机号、PIN 码必须脱敏（如 `138****0001`）
```

---

## 三、Specs 文档优化建议

### 3.1 文档间依赖关系梳理

**当前问题**：
- `task-plans/index.md` 提到 "日期策略"，但未链接到 `date-strategy/` 文档
- `wishlist/index.md` 内容过于简略（仅 7 行），缺少与 `task-plans` 的关联说明（积分如何兑换愿望）

**优化建议**：

在每个 `index.md` 中增加 "相关文档" 章节：

```markdown
## 相关文档

- **上游依赖**：
  - [日期策略](../date-strategy/index.md) - 任务计划依赖日期策略生成具体任务
  - [用户认证](../../AGENTS.md#authentication--ui-framework) - 权限控制
  
- **下游影响**：
  - [积分系统](../points/index.md) - 任务完成产生积分
  - [愿望单](../wishlist/index.md) - 积分用于兑换愿望

## 数据流

```
日期策略 + 任务计划模板 → 生成每日任务 → 儿童完成 → 家长审批 → 积分结算 → 愿望兑换
```
```

### 3.2 具体文档优化

#### `specs/task-plans/new.md`

**问题**：
- "日期策略" 下拉选框的值来源描述复杂（"如果角色是管理员..."），建议用表格简化
- "连击策略" 的校验逻辑不完整（未说明最多次数的上限）
- 缺少表单提交后的业务逻辑（如异步生成任务的具体流程）

**优化建议**：

```markdown
## 计划任务创建/编辑表单

### 字段清单

| 字段名 | 类型 | 必填 | 角色权限 | 验证规则 | 说明 |
|--------|------|------|----------|----------|------|
| 设为模板 | checkbox | 否 | Admin Only | - | 勾选后以下字段变更：①日期范围变为可选 ②任务对象禁用 ③显示"年龄建议"和"设为公开" |
| 计划名称 | text | 是 | All | 2-20字符 | - |
| 描述 | textarea | 否 | All | 0-200字符 | - |
| 任务名称 | text | 是 | All | 2-20字符 | 显示在任务卡片上的名称 |
| 分类 | select | 否 | All | - | 可选值：学习、家务、行为 |
| 基础奖励 | number | 是 | All | 整数，可为负 | 正数奖励，负数惩罚 |
| 任务对象 | multi-select | 条件 | Parent Only | 非模板时必填 | 选项：当前家庭的儿童成员（儿童排在前面） |
| 图标 | image-picker | 是 | All | - | 使用 `components/image-picker` 组件 |
| 日期范围 | date-range | 条件 | All | 非模板时必填 | [开始日期, 结束日期] |
| 日期策略 | select | 是 | All | - | 选项来源见下表 |
| 开启连击 | checkbox | 否 | All | - | 勾选后显示连击策略配置 |
| 连击策略 | object | 条件 | All | 见下方"连击策略验证" | 类型：线性 / 阶梯 |
| 徽章 | select | 否 | All | - | 选项来源：Admin=所有公开徽章；Parent=自己创建的徽章 |
| 任务类型 | select | 是 | All | - | 可选值：日常、隐藏 |
| 年龄建议 | number-range | 否 | Admin Only | 后者>前者 | 模板的推荐年龄段 |
| 设为公开 | checkbox | 否 | Admin Only | - | 模板是否对所有家长可见 |

### 日期策略选项来源

| 角色 | 可选值来源 |
|------|------------|
| Admin | 所有公开的日期策略（`isPublic = true`） |
| Parent | 自己家庭创建的日期策略 + 所有公开的日期策略 |

### 连击策略验证规则

**线性连击**：
- 最少次数：正整数，≥ 1
- 最多次数：正整数，> 最少次数，≤ 100（防止过度设计）
- 奖励积分：非零整数

**阶梯连击**：
- 支持多个阶梯条目
- 第 N 个阶梯的最少次数 = 第 N-1 个阶梯的最多次数 + 1
- 最多支持 5 个阶梯（防止过度复杂）

### 表单提交业务逻辑

1. **客户端校验**：
   - 所有字段格式校验通过
   - 如果未勾选"设为模板"，校验日期范围和日期策略是否有交集（至少有一天重叠）
   - 如果没有交集，显示确认对话框："所选日期范围和日期策略没有重合，不会产生任务，确定保存吗？"

2. **服务端处理**：
   - 校验用户权限（Admin 可创建模板，Parent 只能创建自己家庭的任务）
   - 写入 `task_plans` 表
   - 如果状态为 `active` 且非模板，**异步触发任务生成**：
     ```typescript
     // 伪代码
     await generateTasksForPlan(planId, dateRange, dateStrategy);
     // 将任务写入 tasks 表
     ```

3. **异步任务生成**：
   - 根据日期策略计算所有有效日期
   - 在 `tasks` 表中为每个任务对象、每个有效日期创建一条记录
   - 状态初始化为 `pending`
   - 发送通知给相关儿童（如开启了推送）

### 数据库 Schema

```sql
CREATE TABLE task_plans (
  id TEXT PRIMARY KEY,
  is_template INTEGER NOT NULL DEFAULT 0, -- 0=false, 1=true
  family_id TEXT, -- NULL for admin templates
  name TEXT NOT NULL,
  description TEXT,
  task_name TEXT NOT NULL,
  category TEXT,
  points INTEGER NOT NULL,
  image_type TEXT NOT NULL, -- 'icon' | 'upload'
  color TEXT,
  image TEXT,
  border_style TEXT,
  status TEXT NOT NULL DEFAULT 'noTask', -- active, suspend, noTask, deleted, noExecutor, published, unpublished
  created_by TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  template_id TEXT, -- 复制来源模板ID
  -- 连击配置 (JSON)
  combo_enabled INTEGER DEFAULT 0,
  combo_config TEXT, -- JSON: { type: 'linear' | 'ladder', tiers: [...] }
  -- 日期配置
  date_range_start DATE,
  date_range_end DATE,
  date_strategy_id TEXT,
  -- 模板专用字段
  age_min INTEGER,
  age_max INTEGER,
  is_public INTEGER DEFAULT 0,
  FOREIGN KEY (family_id) REFERENCES families(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (template_id) REFERENCES task_plans(id),
  FOREIGN KEY (date_strategy_id) REFERENCES date_strategies(id)
);
```

### 状态流转图

```
noTask (新建) 
  ↓ [点击开始]
active (进行中)
  ↓ [点击暂停]    ↓ [日期范围结束]
suspend (暂停)   completed (已完成)
  ↓ [点击开始]
active
  ↓ [点击删除]
deleted (已删除，软删除)
```
```

#### `specs/wishlist/index.md`

**当前问题**：内容几乎为空，无法指导开发。

**优化建议**：

```markdown
# 愿望单系统

## 概述

愿望单系统是 Family Reward 的核心激励机制，儿童通过完成任务获得积分，积分可用于兑换愿望单中的物品或体验。

## 核心概念

### 愿望类型

| 类型 | 说明 | 示例 |
|------|------|------|
| 物品 | 实体商品 | 玩具、书籍、电子产品 |
| 体验 | 互动活动 | 去公园、看电影、听故事 |

### 愿望生命周期

```
创建（草稿）
   ↓ [激活]
已激活（可兑换）
   ↓ [儿童发起兑换请求]
待确认（家长审批中）
   ↓ [家长确认]
已兑换（待履行）
   ↓ [家长标记完成]
已完成（积分已扣除，愿望已兑现）
```

## 权限矩阵

| 操作 | Admin | Parent | Child |
|------|-------|--------|-------|
| 创建模板 | ✅ | ❌ | ❌ |
| 复制模板 | ✅ | ✅ | ❌ |
| 创建愿望 | ✅ | ✅ | ✅ |
| 修改自己的愿望 | ✅ | ✅ | ✅ |
| 修改他人的愿望 | ✅ | ✅ (自己家庭) | ❌ |
| 删除愿望 | ✅ | ✅ (自己创建) | ✅ (自己创建，未激活) |
| 激活愿望 | ✅ | ✅ | ❌ |
| 发起兑换 | ❌ | ❌ | ✅ |
| 确认兑换 | ✅ | ✅ | ❌ |

## 相关文档

- [愿望列表页](list.md) - 列表展示和筛选
- [创建/编辑表单](create-edit-form.md) - 表单设计和校验
- [积分系统](../points/index.md) - 积分获取和扣除逻辑
```

#### `specs/date-strategy/index.md`

**问题**：假日安排数据与业务逻辑混在一起。

**优化建议**：

```markdown
# 日期策略系统

## 概述

日期策略定义了一组日期规则，用于任务计划中确定哪些日期需要生成任务。

## 策略类型

| 策略名称 | 说明 | 适用场景 |
|----------|------|----------|
| 每天 | 日期范围内每一天 | 日常习惯任务 |
| 周末 | 周六、周日 | 周末特殊任务 |
| 工作日 | 周一到周五 | 上学日任务 |
| 工作日（含国假调休） | 工作日 + 国假调休后的工作日 | 精确控制 |
| 休息日（含国假） | 周末 + 国假 | 假期任务 |

## 2026 年国假数据

> 数据源：国务院 2026 年节假日安排

| 节日 | 日期范围 | 调休上班日 |
|------|----------|------------|
| 元旦 | 1月1日 - 1月3日 | 1月4日（周日） |
| 春节 | 2月15日 - 2月23日 | 2月14日（周六）、2月28日（周六） |
| 清明节 | 4月4日 - 4月6日 | - |
| 劳动节 | 5月1日 - 5月5日 | 5月9日（周六） |
| 端午节 | 6月19日 - 6月21日 | - |
| 中秋节 | 9月25日 - 9月27日 | - |
| 国庆节 | 10月1日 - 10月7日 | 9月20日（周日）、10月10日（周六） |

## 系统初始化脚本

**文件位置**：`scripts/init-date-strategies.ts`

**功能**：
1. 启动时检测数据库是否已存在默认日期策略
2. 如果不存在，根据上述国假数据创建以下策略：
   - 每天
   - 周末（不含国假）
   - 工作日（不含国假）
   - 工作日（含国假调休）
   - 休息日（含国假）
3. 打印初始化日志

**默认策略配置**：

```typescript
const DEFAULT_STRATEGIES = [
  {
    name: '每天',
    description: '日期范围内每一天',
    region: '全国',
    year: 2026,
    isPublic: true,
    dates: '2026-01-01 to 2026-12-31', // 实际存储为日期数组
  },
  // ... 其他策略
];
```

## 相关文档

- [日期策略列表](list.md) - 列表展示
- [创建/编辑表单](create-edit-form.md) - 日历选择和日期管理
```

---

## 四、冲突点识别与解决方案

### 4.1 已发现的冲突

| 冲突点 | 涉及文档 | 冲突描述 | 建议方案 |
|--------|----------|----------|----------|
| **Better-Auth Skills 包名** | `AGENTS.md` I.2 | `onmax/next-skills` 包名疑似笔误，Better-Auth 官方仓库中没有此包 | 核实正确包名，或删除此项（可能混淆了技能系统和 Next.js 集成） |
| **Redis 缓存要求** | `AGENTS.md` I.1, `prd.md` NFR-4 | AGENTS 未明确 Redis 配置，PRD 提到但未说明使用场景 | 在 `AGENTS.md` 中增加 Redis 配置章节，明确缓存策略和降级方案 |
| **小程序支持** | `prd.md` NFR-2 | PRD 提到 "小程序支持推送通知"，但技术栈选型未提及小程序框架 | 明确是否一期实现小程序，如暂不实现需在 PRD 中标记为 "二期规划" |
| **PWA 离线范围** | `prd.md` NFR-2, `AGENTS.md` I.3 | PRD 要求 "离线使用"，但 AGENTS 未明确离线功能范围 | 在 `AGENTS.md` 中明确哪些功能必须离线可用，哪些需要联网 |
| **测试框架** | `AGENTS.md` I.1, III.4 | 要求使用 `bun test`，但未说明与 Playwright E2E 测试的集成方式 | 补充 `bun test` 运行单元/集成测试，`npx playwright test` 运行 E2E 的分工 |
| **数据库路径** | `AGENTS.md` I.1 | 要求 `database/db.sql`，但 SQLite 是文件型数据库，开发/测试/生产环境如何区分 | 明确不同环境的数据库文件路径规范（如 `database/db.dev.sql`, `database/db.test.sql`） |

### 4.2 潜在风险

| 风险项 | 风险等级 | 说明 | 缓解措施 |
|--------|----------|------|----------|
| **SQLite 并发写入** | 高 | `bun:sqlite` 单连接模式，高并发场景（17:00-20:00 高峰期）可能成为瓶颈 | 增加写入队列机制，或评估是否需要切换到 PostgreSQL |
| **15岁过渡机制** | 中 | PRD 要求灵活过渡，但未明确技术实现方案（数据权限变更、账户迁移） | 在 Architecture 文档中设计数据隔离和权限升级方案 |
| **PWA Lighthouse 90分** | 中 | PWA 要求高，开发和测试成本较大 | 分阶段实现：MVP 先满足 Installable，再优化到 90 分 |
| **多端数据同步** | 中 | 家长用小程序，儿童用 PWA，数据同步策略未明确 | 设计 WebSocket 或轮询方案，明确实时性要求（PRD 说 3 秒可接受） |

---

## 五、优先级建议

### 5.1 文档优化优先级

**P0（立即执行）**：
1. 修复 `AGENTS.md` 中的 "Skills" 包名错误
2. 补充 SQLite 数据库环境区分规范（dev/test/prod）
3. 为 `specs/wishlist/index.md` 补充内容

**P1（本周完成）**：
1. 重写 `specs/task-plans/new.md`，增加业务逻辑和状态流转
2. 在 `AGENTS.md` 中增加 Redis 配置章节
3. 建立 `specs/README.md` 索引文档

**P2（本月完成）**：
1. 拆分 `AGENTS.md` 为技术规范和代理指南
2. 为所有 specs 增加 "相关文档" 和 "数据流" 章节
3. 编写 PowerShell 自动化脚本（端口检测、身份验证）

**P3（持续改进）**：
1. 建立需求追踪矩阵（PRD 需求 ↔ 验收标准 ↔ 测试用例）
2. 编写 Architecture Decision Records (ADR)
3. 完善测试覆盖率统计和报告机制

### 5.2 实施建议

1. **先修复明显错误**：如包名、路径等，避免开发误导
2. **再补全缺失内容**：如 `wishlist/index.md`、PWA 缓存策略等
3. **后优化结构**：如文档拆分、索引建立等，不影响开发进度
4. **持续维护**：每次需求变更时同步更新相关文档

---

## 六、总结

### 6.1 主要问题

1. **文档结构不清晰**：`AGENTS.md` 职责过多，`specs/` 缺乏索引
2. **内容不完整**：PRD 缺少验收标准，specs 缺少业务逻辑
3. **技术规范有冲突**：Redis/SQLite 并发、PWA 范围、测试框架分工
4. **示例不足**：TypeScript 继承模式、PowerShell 命令等缺乏可执行示例

### 6.2 核心优化方向

1. **建立层级体系**：PRD → Architecture → Epic/Story → Task
2. **明确技术边界**：哪些必须遵守，哪些允许例外
3. **增加可执行性**：提供代码示例、脚本、检查清单
4. **完善追踪机制**：需求-验收标准-测试用例的完整链路

### 6.3 预期效果

- **开发效率提升**：开发者能快速定位相关文档，减少沟通成本
- **质量风险降低**：明确的规范和检查清单减少遗漏
- **AI 代理效能提升**：清晰的边界和示例让 AI 更容易遵循规范
- **维护成本降低**：结构化的文档更容易持续更新

---

*报告生成时间：2026-02-06*
*针对项目：Family Reward - 家庭行为管理游戏平台*
