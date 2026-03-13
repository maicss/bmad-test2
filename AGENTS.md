# AGENTS.md

> **AI 决策手册** - 本文档为 AI 代理提供关键决策依据
> 
> 详细技术规范请参考 [docs/TECH_SPEC.md](./docs/TECH_SPEC.md)

---

## 🚨 平台检测（每次会话开始时执行）

**在每次会话开始时，你必须先确定当前平台，以使用正确的命令：**

```bash
# 检测操作系统
uname -s  # Linux/macOS
ver       # Windows

# 检测 Shell
echo $SHELL
```

| 平台 | 检测特征 | 命令风格 |
|------|----------|----------|
| Windows | `ver` 成功 | PowerShell / CMD |
| Linux | `uname -s` = Linux | Bash |
| macOS | `uname -s` = Darwin | Bash/Zsh |

**命令选择优先级：**
1. 如果用户明确指定了平台，使用用户指定的命令
2. 如果检测为 Windows，优先使用 PowerShell 命令
3. 其他平台使用标准 Unix 命令

---

## 🚨 Git 分支检测（每次实现工作开始前执行）

**在开始任何实现工作之前，必须检查当前 Git 分支：**

```bash
# 检查当前分支是否符合规范（推荐，脚本会自动拦截非法名称）
bun run scripts/check-branch.ts

# 如果在 main 分支，必须先创建 feature 分支
git checkout main && git pull
git checkout -b feature/story-X-Y-name
```

| 当前分支 | 是否允许实现 | 操作 |
|----------|--------------|------|
| `main` | ❌ 禁止 | 必须创建 feature 分支 |
| `fix-e2e` | ❌ 禁止 | 仅供 E2E 测试修复 |
| `hotfix-*` | ❌ 禁止 | 仅供紧急修复 |
| `feature/story-X-Y-*` | ✅ 允许 | 正确的功能分支 |
| `experiment-*` | ✅ 允许 | 实验性分支 |

**分支命名规范：**
- 功能开发：`feature/story-{Epic}-{Story}-{description}`
- 示例：`feature/story-2-9-child-marks-task-complete`

**参考：** [docs/GIT_WORKFLOW.md](./docs/GIT_WORKFLOW.md) 第 7-23 行

---

## 🔴 RED LIST（绝对禁止）

违反以下任何一条将导致任务失败：

### 数据库（强制 Drizzle ORM）
- ❌ **禁止使用原生 SQL 操作数据库** - 必须使用 Drizzle ORM
- ❌ **禁止字符串拼接 SQL** - 必须使用 Drizzle 的查询构建器
- ❌ **禁止在组件/路由中直接写 SQL** - 所有查询必须封装到 `lib/db/queries/` 目录下，按表分文件存储（如 `lib/db/queries/tasks.ts`, `lib/db/queries/users.ts`）
- ❌ **使用第三方数据库驱动** - 只能用 `bun:sqlite` + Drizzle ORM

```typescript
// ✅ 正确 - 必须使用 Drizzle ORM
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// 查询
const result = await db.query.tasks.findMany({
  where: eq(tasks.familyId, familyId)
});

// 插入
await db.insert(tasks).values({ title: 'xxx', points: 10 });

// ❌ 绝对禁止 - 原生 SQL
const result = db.execute(`SELECT * FROM tasks WHERE id = ${id}`);
```

### 运行时与类型
- ❌ **使用 `any` 类型** - 必须用 `unknown` + 类型守卫
- ❌ **使用 `@ts-ignore` / `@ts-expect-error`** - 必须修复类型错误
- ❌ **使用 Node.js 兼容层** - 如 `node-fetch`, `node-crypto`, `fs/promises`
- ❌ **使用 `process.env`** - 改用 `Bun.env`
- ❌ **使用 `alert()` 显示错误** - 必须用 Shadcn Dialog/Toast
- ❌ **引入新依赖** - 未经明确确认禁止安装

### Bun 工具函数使用规范（强制）

**详细规范请参考 [docs/TECH_SPEC_BUN.md](./docs/TECH_SPEC_BUN.md)**

- ❌ **重复实现 Bun 已提供的工具函数** - 严禁！必须优先使用 Bun 内置工具
- ❌ **手动实现文件操作** - 必须用 `Bun.file()`, `Bun.write()`
- ❌ **手动实现密码哈希** - 必须用 `Bun.password.hash()`, `Bun.password.verify()`
- ❌ **手动实现 HTTP 服务器** - 必须用 `Bun.serve()`
- ❌ **手动实现环境变量读取** - 必须用 `Bun.env`
- ❌ **手动实现路径拼接** - 必须用 `import.meta.dir`, `import.meta.resolve()`

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

// ❌ 禁止 - 重复实现
import { readFile } from 'fs/promises';     // 禁止
import { hash, compare } from 'bcrypt';      // 禁止
import { createServer } from 'http';         // 禁止
const env = process.env;                     // 禁止
```

### Git
- ❌ **提交 `.env` 文件** - 敏感配置禁止入库
- ✅ **使用 GitHub CLI 自动创建 PR** - 如果 `gh` 命令可用，Story 完成后自动 push 并使用 `gh pr create` 发起 PR 到 main 分支

**Git 工作流自动化（当 gh 可用时）：**

Story 开发完成后，自动执行以下操作：
```bash
# 1. Push feature branch to remote
git push -u origin feature/story-X-Y-name

# 2. Create PR to main using gh CLI
gh pr create --base main --title "feat(story-X-Y): [story title]" --body "[PR description]"
```

**检查 gh 可用性：**
```bash
# 检查 gh 是否安装并已认证
gh auth status

# 如果已认证，gh 可用，则自动执行 PR 创建
# 如果未认证或不可用，则手动创建 PR（提供链接）
```

### BDD（行为驱动开发）
- ❌ **先写实现后写测试** - 必须先写测试/规范，后写实现（红-绿-重构）
- ❌ **测试使用技术术语** - 必须使用业务语言（Given-When-Then 格式）
- ❌ **测试与需求脱节** - 每个测试必须对应一个业务场景

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

---

## ✅ 决策检查清单（每个任务前必须执行）

```markdown
## 任务分析：[功能名称]

### 1. 影响文件清单
| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `app/api/x/route.ts` | 新增 | API 端点 |
| `lib/db/queries/[table].ts` | 修改 | 数据库查询（按表分文件，如 `tasks.ts`, `users.ts`） |
| `types/dto/x.ts` | 新增 | DTO 类型 |

### 2. 数据库变更
- [ ] 无需变更
- [ ] 需要迁移：`database/migrations/XXX_description.sql`

### 3. PWA 影响
- [ ] 影响 Service Worker / manifest

### 4. 风险评估
| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 示例 | 中 | 措施 |
```

---

## 📋 快速参考

### 关键路径

| 资源 | 路径 | 说明 |
|------|------|------|
| **数据库文件** | `database/db.sql` | 开发/生产共用（Git 跟踪） |
| **数据库查询** | `lib/db/queries/` | Drizzle 查询按表分文件存储（如 `tasks.ts`, `users.ts`） |
| **类型定义** | `types/[模块].ts` | 按模块命名，如 `types/task.ts` |
| **迁移脚本** | `database/migrations/` | SQL 迁移 |
| **错误码** | `constants/error-codes.ts` | 统一错误码 |

### 技术栈

| 技术 | 版本 |
|------|------|
| Bun | 1.3.x+ |
| Next.js | 16.x |
| Drizzle ORM | 0.45.x+ |
| Better-Auth | 1.4.x |

### 数据库表

| 表名 | 说明 |
|------|------|
| `users` | 用户（家长/儿童） |
| `families` | 家庭 |
| `task_plans` | 计划任务模板 |
| `tasks` | 具体任务实例 |
| `wishlists` | 愿望单 |

### 测试数据

> 测试用户初始化: `bun run database/seed-test-users.ts`

| 角色 | 姓名 | 手机号 | PIN | 密码 | 家庭 |
|------|------|--------|-----|------|------|
| Admin | admin | 13800000001 | - | 1111 | - |
| Parent | Zhang 1 (Primary) | 13800000100 | - | 1111 | family-001 |
| Parent | Zhang 2 (Secondary) | 12800000200 | - | 1111 | family-001 |
| Child | Zhang 3 | - | 1111 | - | family-001 |
| Parent | Li 1 (Primary) | 13800000300 | - | 1111 | family-002 |
| Parent | Li 2 (Secondary) | 13800000400 | - | 1111 | family-002 |

---

## 🛑 升级路径（必须询问人类）

以下情况**不得擅自决定**，必须询问：

- 需要使用未列出的 npm 包
- 修改技术栈（如更换数据库）
- 修改数据库表结构（已有数据）
- 需求文档描述模糊或冲突
- Better-Auth/Drizzle/Next.js 有 breaking change
- 发现潜在安全漏洞

---

## 🧪 验证流程

### 提交前检查

- [ ] `bun tsc --noEmit` 通过
- [ ] `bun test` 通过
- [ ] 新功能有测试
- [ ] 数据库迁移已创建（如有变更）
- [ ] 不使用 `any` 类型
- [ ] UI 使用 Shadcn 组件
- [ ] **文件长度检查：所有文件不超过 800 行**
  - 如文件过大，必须先拆分为小组件再提交
- [ ] **BDD 规范检查**
  - 测试使用 Given-When-Then 格式
  - 使用业务语言（非技术术语）
  - 先写测试/规范，后写实现

---

## 📚 扩展阅读

- **[docs/TECH_SPEC.md](./docs/TECH_SPEC.md)** - 完整技术规范索引
- **[docs/TECH_SPEC_BUN.md](./docs/TECH_SPEC_BUN.md)** - Bun 运行时使用规范
- **[docs/TECH_SPEC_PERFORMANCE.md](./docs/TECH_SPEC_PERFORMANCE.md)** - 性能优化规范
- **[docs/TECH_SPEC_LOGGING.md](./docs/TECH_SPEC_LOGGING.md)** - 日志规范
- **[docs/TECH_SPEC_DATABASE.md](./docs/TECH_SPEC_DATABASE.md)** - 数据库详细规范
- **[docs/TECH_SPEC_TYPES.md](./docs/TECH_SPEC_TYPES.md)** - 类型系统规范
- **[docs/TECH_SPEC_BDD.md](./docs/TECH_SPEC_BDD.md)** - BDD 开发规范
- **[specs/prd.md](./specs/prd.md)** - 产品需求

---

## 📝 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-12 | 3.3 | 重构：数据库查询从单文件 `lib/db/queries.ts` 改为按表分文件 `lib/db/queries/*.ts` |
| 2026-02-10 | 3.2 | 新增：Bun 工具函数使用规范（强制使用 Bun 内置工具） |
| 2026-02-06 | 3.1 | 新增：强制 BDD 开发规范（Given-When-Then） |
| 2026-02-06 | 3.0 | 重构：强制 Drizzle ORM，平台检测，精简内容 |
| 2026-02-06 | 2.0 | 分离 TECH_SPEC.md |
| 2026-02-05 | 1.0 | 初始版本 |
