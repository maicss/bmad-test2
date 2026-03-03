# Story 2.1: Parent Creates Task Plan Template

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长,
I want 创建任务计划模板,
So that 我可以定义重复性任务的结构和规则，减少重复设置工作。

## Acceptance Criteria

**Given** 我已登录Family Reward系统并有家长权限
**When** 我进入"任务计划"页面并点击"创建模板"按钮
**Then** 系统显示任务模板创建表单，包含：
  - 模板名称（必填，最多50字）
  - 任务类型选择（刷牙/学习/运动/家务/自定义）
  - 适用儿童选择（可多选）
  - 积分值设置（数字输入，1-100）
  - 循环规则选择（每日/每周/工作日/周末/自定义）
  - 排除日期选择（可选，日历选择器）
  - 任务提醒时间设置（可选）
  - "保存草稿"和"立即发布"按钮
**And** 模板保存后，状态为"草稿"或"已发布"
**And** 如果选择"立即发布"，系统根据循环规则生成未来7天的任务实例
**And** 模板数据存储在`task_plans`表中
**And** API响应时间<500ms（NFR3: P95）

## Tasks / Subtasks

- [ ] Task 1: 创建数据库表结构和迁移 (AC: 模板数据存储在task_plans表中)
  - [ ] 1.1 设计并创建task_plans表schema（包括rule JSON字段）
  - [ ] 1.2 创建并执行数据库迁移
  - [ ] 1.3 编写lib/db/queries/task-plans.ts查询函数

- [ ] Task 2: 实现任务模板创建表单UI (AC: 显示任务模板创建表单)
  - [ ] 2.1 创建TaskPlanForm组件（使用Shadcn UI）
  - [ ] 2.2 实现表单字段：模板名称、任务类型、适用儿童、积分值
  - [ ] 2.3 实现循环规则选择器组件
  - [ ] 2.4 实现排除日期选择器（日历选择器）
  - [ ] 2.5 实现任务提醒时间设置组件
  - [ ] 2.6 添加"保存草稿"和"立即发布"按钮

- [ ] Task 3: 实现API端点 (AC: 模板保存、API响应<500ms)
  - [ ] 3.1 创建app/api/task-plans/route.ts（POST端点）
  - [ ] 3.2 实现模板创建逻辑（保存到task_plans表）
  - [ ] 3.3 实现草稿/已发布状态处理
  - [ ] 3.4 添加表单验证（模板名称必填、最多50字、积分值1-100）
  - [ ] 3.5 添加性能监控确保API响应<500ms

- [ ] Task 4: 实现任务实例自动生成逻辑 (AC: 立即发布生成未来7天任务)
  - [ ] 4.1 创建任务日期策略引擎（lib/services/task-engine.ts）
  - [ ] 4.2 实现基于循环规则生成任务实例的逻辑
  - [ ] 4.3 实现排除日期过滤逻辑
  - [ ] 4.4 生成未来7天的任务实例到tasks表
  - [ ] 4.5 关联task_plan_id到生成的任务实例

- [ ] Task 5: 编写BDD测试 (AC: 所有验收条件)
  - [ ] 5.1 Given-When-Then格式：创建任务模板的集成测试
  - [ ] 5.2 测试表单验证（模板名称、积分值）
  - [ ] 5.3 测试草稿/已发布状态转换
  - [ ] 5.4 测试任务实例自动生成（循环规则、排除日期）
  - [ ] 5.5 性能测试（API响应<500ms）

- [ ] Task 6: 实现家长权限验证 (AC: 家长权限要求)
  - [ ] 6.1 使用Better-Auth的权限守卫
  - [ ] 6.2 验证用户角色为Parent
  - [ ] 6.3 验证用户属于正确的家庭
  - [ ] 6.4 返回403错误如果权限不足

- [ ] Task 7: 实现错误处理和用户反馈 (AC: 用户体验要求)
  - [ ] 7.1 使用Shadcn Toast显示成功/错误提示
  - [ ] 7.2 处理网络错误（离线状态）
  - [ ] 7.3 处理表单验证错误（实时反馈）
  - [ ] 7.4 实现加载状态指示器

## Dev Notes

### Technical Requirements

**Technology Stack (MUST USE):**
- Runtime: Bun 1.3.x+ (NO Node.js compatibility layer)
- Framework: Next.js 16.x + React 19.x
- Database: bun:sqlite + Drizzle ORM 0.45.1+ (NO native SQL)
- Auth: Better-Auth 1.4.x+ with phone plugin
- UI: Tailwind CSS 4 + Shadcn UI 3.7.0+
- Testing: Bun Test + Playwright (BDD style)
- Types: TypeScript 5 strict mode (NO `any`, NO `@ts-ignore`)

**RED LIST Rules (CRITICAL - DO NOT VIOLATE):**
1. ❌ NO native SQL - MUST use Drizzle ORM
2. ❌ NO string concatenation for SQL - use Drizzle query builder
3. ❌ NO SQL in components/routes - encapsulate in lib/db/queries/task-plans.ts
4. ❌ NO `any` type - use `unknown` + type guards
5. ❌ NO `@ts-ignore` - fix type errors
6. ❌ NO Node.js compatibility layer - use Bun built-ins (Bun.file(), Bun.password.hash(), Bun.env)
7. ❌ NO process.env - use Bun.env
8. ❌ NO alert() - use Shadcn Dialog/Toast
9. ❌ NO new dependencies without explicit approval

**Database Architecture:**
- Table: `task_plans` - stores task plan templates
  - `id` (text primary key)
  - `family_id` (text foreign key to families)
  - `title` (text, required, max 50 chars)
  - `task_type` (text:刷牙/学习/运动/家务/自定义)
  - `points` (integer, 1-100)
  - `rule` (JSON, stores date strategy: daily/weekly/weekdays/weekends/custom)
  - `excluded_dates` (JSON array, optional date strings)
  - `reminder_time` (text, optional, time string)
  - `status` (text: draft/published)
  - `created_by` (text, user_id of parent)
  - `created_at`, `updated_at` (timestamps)

**Query Pattern (MUST FOLLOW):**
```typescript
// lib/db/queries/task-plans.ts
import { db } from '@/lib/db';
import { taskPlans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function createTaskPlan(data: CreateTaskPlanDTO) {
  const result = await db.insert(taskPlans).values(data).returning();
  return result[0];
}

export async function getTaskPlansByFamily(familyId: string) {
  return await db.query.taskPlans.findMany({
    where: eq(taskPlans.familyId, familyId)
  });
}
```

**API Pattern:**
```typescript
// app/api/task-plans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createTaskPlan } from '@/lib/db/queries/task-plans';
import { requireParentAuth } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  const session = await requireParentAuth(req);
  // ... implementation
}
```

### Architecture Compliance

**Component Location:**
- Form component: `components/forms/task-plan-form.tsx`
- Route: `app/(parent)/tasks/create/page.tsx`
- API: `app/api/task-plans/route.ts`
- Queries: `lib/db/queries/task-plans.ts`
- Service: `lib/services/task-engine.ts` (date strategy logic)

**Design System:**
- Use Shadcn UI components: Card, Form, Input, Select, Button, Dialog, Toast
- Tailwind CSS classes for styling
- Responsive design (parent-end: mini-program optimized <450px)

**Performance Requirements:**
- API response < 500ms (NFR3: P95)
- Form validation: real-time feedback
- Task generation: batch insert for efficiency

### Testing Requirements

**BDD Format (GIVEN-WHEN-THEN):**
```typescript
// tests/integration/task-plan-creation.spec.ts
it('given 家长已登录，when 创建任务模板，then 模板保存并生成任务实例', async () => {
  // Given: 家长已登录
  const parent = await createParent();
  const session = await createSession(parent);

  // When: 创建任务模板
  const response = await request(app)
    .post('/api/task-plans')
    .set('Cookie', session)
    .send({
      title: '每日刷牙',
      taskType: '刷牙',
      points: 5,
      rule: { frequency: 'daily' },
      status: 'published'
    });

  // Then: 模板保存成功
  expect(response.status).toBe(201);
  expect(response.body.title).toBe('每日刷牙');

  // And: 生成未来7天任务实例
  const tasks = await getTasksByFamily(parent.familyId);
  expect(tasks).toHaveLength(7);
  expect(tasks[0].title).toBe('每日刷牙');
});
```

**Test Coverage:**
- Unit tests for task-engine.ts (date strategy logic)
- Integration tests for API endpoints
- E2E tests for complete user journey (Playwright)
- Performance tests (API response < 500ms)

### Security & Compliance

**COPPA/GDPR Compliance:**
- Child data stored securely (PIN code encrypted with bcrypt)
- Parent authorization required for task creation
- Audit trail for all task plan modifications
- No sensitive data in logs

**RBAC:**
- Only Parent role can create task plans
- Parent can only create tasks for their own family
- Admin templates (Story 6.1) are read-only for parents

### File Length Constraint

**MAX 800 lines per file** - If component exceeds limit, split into:
- task-plan-form.tsx (main form)
- task-plan-fields.tsx (form fields)
- task-plan-date-picker.tsx (date selector)

### Project Structure Notes

**Alignment:**
- Follows unified project structure (paths, modules, naming)
- Database queries in `lib/db/queries/task-plants.ts` (per-table file)
- Function-based queries (NOT Repository pattern)
- BDD development (Given-When-Then, tests BEFORE implementation)

**Dependencies:**
- Depends on Epic 1: User Authentication & Family Management (must be completed)
- Prerequisite: Families table, Users table, Sessions table exist
- Next story: Story 2.2 (Parent Sets Task Points Value) will extend task plan with points validation

### References

- Source: docs/TECH_SPEC.md - Technical specifications
- Source: docs/TECH_SPEC_DATABASE.md - Database schema
- Source: docs/TECH_SPEC_BUN.md - Bun runtime requirements
- Source: docs/TECH_SPEC_BDD.md - BDD development guidelines
- Source: docs/TECH_SPEC_PWA.md - PWA requirements
- Source: _bmad-output/planning-artifacts/epics.md#Epic-2 - Story requirements
- Source: _bmad-output/planning-artifacts/architecture.md#ADR-5 - Database query layer architecture
- Source: _bmad-output/planning-artifacts/ux-design-specification.md - UI/UX specifications

### Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

### Completion Notes List

### File List

- `database/schema/task-plans.ts` - Drizzle schema definition
- `database/migrations/xxx_create_task_plans.sql` - Migration file
- `lib/db/queries/task-plans.ts` - Database queries
- `lib/services/task-engine.ts` - Date strategy engine
- `app/api/task-plans/route.ts` - API endpoint
- `app/(parent)/tasks/create/page.tsx` - Parent task creation page
- `components/forms/task-plan-form.tsx` - Task plan form component
- `components/forms/task-plan-fields.tsx` - Form fields (if split)
- `tests/integration/task-plan-creation.spec.ts` - Integration tests
- `tests/e2e/task-plan-creation.spec.ts` - E2E tests
