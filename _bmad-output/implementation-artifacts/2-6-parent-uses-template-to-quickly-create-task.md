# Story 2.6: Parent Uses Template to Quickly Create Task

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长,
I want 使用任务模板快速创建单个任务,
So that 我可以快速为孩子添加不在计划内的任务。

## Acceptance Criteria

**Given** 系统中已有至少一个任务模板
**When** 我在任务计划页面点击"使用模板创建任务"
**Then** 系统显示模板列表（仅显示我创建或管理员发布的模板）
**When** 我选择一个模板
**Then** 系统预填模板中的任务信息，家长可修改：
  - 任务名称（可修改）
  - 积分值（可修改，默认使用模板值）
  - 执行日期（必填，默认今天）
  - 适用儿童（必填）
  - 备注（可选）
**And** 点击"创建"后，任务实例立即生成并出现在儿童今日任务中
**And** 任务实例标记为"手动创建"以区分计划任务

## Tasks / Subtasks

- [ ] Task 1: 设计并扩展tasks表支持手动创建标记 (AC: 任务实例标记为手动创建)
  - [ ] 1.1 验证tasks表已有is_manual字段（boolean）
  - [ ] 1.2 如果不存在，创建迁移添加is_manual字段
  - [ ] 1.3 更新lib/db/queries/tasks.ts支持is_manual字段查询
  - [ ] 1.4 创建索引优化查询（is_manual, date, child_id）

- [ ] Task 2: 实现模板选择器UI (AC: 显示模板列表，仅显示我创建或管理员发布的模板)
  - [ ] 2.1 创建TemplateSelector组件（Shadcn Dialog + Radio Group）
  - [ ] 2.2 实现模板列表加载（获取我的模板+管理员发布模板）
  - [ ] 2.3 实现模板卡片展示（标题、任务类型、积分值）
  - [ ] 2.4 添加模板筛选功能（我的模板/管理员模板/全部）
  - [ ] 2.5 实现模板搜索功能（按标题搜索）

- [ ] Task 3: 实现快速创建任务表单 (AC: 系统预填模板信息，家长可修改)
  - [ ] 3.1 创建QuickTaskForm组件（复用TaskPlanForm组件逻辑）
  - [ ] 3.2 实现模板信息预填（选择模板后自动填充）
  - [ ] 3.3 实现表单字段：任务名称（可编辑）
  - [ ] 3.4 实现表单字段：积分值（可编辑，默认模板值）
  - [ ] 3.5 实现表单字段：执行日期（必填，默认今天）
  - [ ] 3.6 实现表单字段：适用儿童（必填，多选）
  - [ ] 3.7 实现表单字段：备注（可选）
  - [ ] 3.8 添加"重置为模板值"按钮

- [ ] Task 4: 实现快速创建任务API (AC: 点击创建后，任务实例立即生成)
  - [ ] 4.1 创建app/api/tasks/route.ts（POST端点）
  - [ ] 4.2 实现手动创建任务逻辑（创建tasks表记录）
  - [ ] 4.3 设置is_manual=true标记手动创建
  - [ ] 4.4 不创建task_plan关联（手动创建无模板关联）
  - [ ] 4.5 实现批量创建（多个儿童时）
  - [ ] 4.6 添加性能监控确保<500ms

- [ ] Task 5: 集成到任务计划页面 (AC: 点击"使用模板创建任务"按钮)
  - [ ] 5.1 创建"使用模板创建任务"按钮
  - [ ] 5.2 集成TemplateSelector到任务计划页面
  - [ ] 5.3 实现选择模板后显示QuickTaskForm
  - [ ] 5.4 实现表单提交和任务生成
  - [ ] 5.5 添加成功提示并返回任务计划页面

- [ ] Task 6: 实现任务列表显示区分 (AC: 任务实例标记为手动创建，以区分计划任务)
  - [ ] 6.1 更新TaskCard组件显示is_manual标签
  - [ ] 6.2 实现手动创建任务的视觉区分（不同颜色或图标）
  - [ ] 6.3 在任务列表中添加筛选（计划任务/手动任务）
  - [ ] 6.4 实现手动创建任务的编辑功能
  - [ ] 6.5 实现手动创建任务的删除功能（仅删除该实例）

- [ ] Task 7: 编写BDD测试 (AC: 所有验收条件)
  - [ ] 7.1 Given-When-Then格式：模板选择测试
  - [ ] 7.2 测试模板列表显示（我的模板+管理员模板）
  - [ ] 7.3 测试模板信息预填
  - [ ] 7.4 测试表单字段修改（任务名称、积分值、日期）
  - [ ] 7.5 测试批量创建（多个儿童）
  - [ ] 7.6 测试is_manual标记
  - [ ] 7.7 测试任务列表显示区分

- [ ] Task 8: 实现错误处理和用户反馈 (AC: 用户体验要求)
  - [ ] 8.1 使用Shadcn Toast显示创建成功/失败
  - [ ] 8.2 处理必填字段验证（执行日期、适用儿童）
  - [ ] 8.3 处理无模板可用的情况
  - [ ] 8.4 实现表单验证（日期不能早于今天）
  - [ ] 8.5 添加重置表单功能

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
3. ❌ NO SQL in components/routes - encapsulate in lib/db/queries/
4. ❌ NO `any` type - use `unknown` + type guards
5. ❌ NO `@ts-ignore` - fix type errors
6. ❌ NO Node.js compatibility layer - use Bun built-ins
7. ❌ NO process.env - use Bun.env
8. ❌ NO alert() - use Shadcn Dialog/Toast
9. ❌ NO new dependencies without explicit approval

**Database Schema:**
```typescript
// database/schema/tasks.ts (from Story 2.4)
import { sqliteTable, text, integer, timestamp, boolean } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  taskPlanId: text('task_plan_id'), // NULL for manual tasks
  childId: text('child_id').notNull(),
  title: text('title').notNull(),
  taskType: text('task_type').notNull(),
  points: integer('points').notNull(),
  status: text('status').notNull().default('pending'),
  date: text('date').notNull(),
  notes: text('notes'), // Optional notes for manual tasks
  isManual: boolean('is_manual').notNull().default(false), // NEW: Manual task marker
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});
```

**API Pattern:**
```typescript
// app/api/tasks/route.ts (NEW - creates manual tasks)
import { NextRequest, NextResponse } from 'next/server';
import { createManualTask } from '@/lib/db/queries/tasks';
import { requireParentAuth } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  try {
    const session = await requireParentAuth(req);
    const body = await req.json();

    const manualTaskData = {
      familyId: session.familyId,
      title: body.title,
      taskType: body.taskType,
      points: body.points,
      date: body.date,
      childIds: body.childIds, // Array for batch creation
      notes: body.notes,
      isManual: true, // Mark as manual task
      createdBy: session.userId
    };

    const tasks = await createManualTask(manualTaskData);

    return NextResponse.json({ 
      success: true, 
      tasks,
      message: `成功创建 ${tasks.length} 个任务` 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

**Query Pattern:**
```typescript
// lib/db/queries/tasks.ts
import { db } from '@/lib/db';
import { tasks, taskPlans } from '@/lib/db/schema';
import { eq, and, inArray, or } from 'drizzle-orm';

export async function getTaskTemplatesForQuickCreate(familyId: string) {
  // Get parent's own templates (published)
  const parentTemplates = await db.query.taskPlans.findMany({
    where: and(
      eq(taskPlans.familyId, familyId),
      eq(taskPlans.status, 'published'),
      eq(taskPlans.createdBy, familyId) // Created by this family
    )
  });

  // Get admin templates (published)
  const adminTemplates = await db.query.taskPlans.findMany({
    where: and(
      eq(taskPlans.status, 'published'),
      // TODO: Add admin template filtering (Story 6.1)
      // For now, return all published templates that are not family-specific
      sql`${taskPlans.createdBy} IS NULL` 
    )
  });

  return {
    parentTemplates,
    adminTemplates
  };
}

export async function createManualTask(data: CreateManualTaskDTO) {
  const taskIds: string[] = [];
  const now = new Date();

  // Create a task instance for each child
  for (const childId of data.childIds) {
    const taskId = crypto.randomUUID();
    taskIds.push(taskId);

    await db.insert(tasks).values({
      id: taskId,
      taskPlanId: null, // Manual tasks have no template
      childId: childId,
      title: data.title,
      taskType: data.taskType,
      points: data.points,
      status: 'pending',
      date: data.date,
      notes: data.notes,
      isManual: true,
      createdAt: now,
      updatedAt: now
    });
  }

  // Return all created tasks
  return await db.query.tasks.findMany({
    where: inArray(tasks.id, taskIds)
  });
}

export async function getTasksByChild(childId: string, date?: string, isManual?: boolean) {
  const conditions = [eq(tasks.childId, childId)];

  if (date) {
    conditions.push(eq(tasks.date, date));
  }

  if (isManual !== undefined) {
    conditions.push(eq(tasks.isManual, isManual));
  }

  return await db.query.tasks.findMany({
    where: and(...conditions),
    orderBy: [tasks.createdAt]
  });
}
```

### Architecture Compliance

**Component Location:**
- Template selector: `components/forms/template-selector.tsx`
- Quick task form: `components/forms/quick-task-form.tsx`
- Integration with: `app/(parent)/tasks/page.tsx`
- Task card update: `components/features/task-card.tsx` (add isManual badge)

**Design System:**
- Use Shadcn UI components: Dialog, RadioGroup, Button, Input, Select, Badge, Toast
- Template cards: Similar to task plan cards but simpler
- Manual task badge: Blue badge with "手动" text
- Form layout: Two-column grid on desktop, single column on mobile
- Responsive design (parent-end: mini-program optimized <450px)

**Performance Requirements:**
- Template list loading: <300ms
- Manual task creation: <500ms (NFR3: P95)
- Batch creation (5 children): <1 second

### Testing Requirements

**BDD Format (GIVEN-WHEN-THEN):**
```typescript
// tests/integration/quick-task-creation.spec.ts
it('given 家长有已发布任务模板，when 点击使用模板创建任务，then 显示模板列表', async () => {
  // Given: 家长已登录并创建任务模板
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const taskPlan = await createTaskPlan({
    familyId: family.id,
    title: '每日刷牙',
    status: 'published'
  });

  // When: 获取模板列表
  const response = await request(app)
    .get('/api/task-plans/for-quick-create')
    .set('Cookie', await createSession(parent));

  // Then: 显示模板列表
  expect(response.status).toBe(200);
  expect(response.body.parentTemplates).toHaveLength(1);
  expect(response.body.parentTemplates[0].title).toBe('每日刷牙');
});

it('given 家长选择模板，when 预填信息后创建任务，then 任务实例立即生成并标记为手动创建', async () => {
  // Given: 家长已创建任务模板
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child = await createChild({ familyId: family.id });

  const taskPlan = await createTaskPlan({
    familyId: family.id,
    title: '每日刷牙',
    taskType: '刷牙',
    points: 5,
    status: 'published'
  });

  const today = new Date().toISOString().split('T')[0];

  // When: 使用模板快速创建任务
  const response = await request(app)
    .post('/api/tasks')
    .set('Cookie', await createSession(parent))
    .send({
      taskPlanId: taskPlan.id,
      title: '临时刷牙任务', // Modified from template
      taskType: '刷牙',
      points: 10, // Modified from template (default 5)
      date: today,
      childIds: [child.id],
      isManual: true
    });

  // Then: 任务实例立即生成
  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
  expect(response.body.tasks).toHaveLength(1);

  // And: 标记为手动创建
  const task = response.body.tasks[0];
  expect(task.isManual).toBe(true);
  expect(task.title).toBe('临时刷牙任务'); // Modified title
  expect(task.points).toBe(10); // Modified points
  expect(task.taskPlanId).toBeNull(); // No template reference

  // And: 任务出现在儿童今日任务中
  const childTasks = await getTasksByChild(child.id, today);
  expect(childTasks).toHaveLength(1);
  expect(childTasks[0].id).toBe(task.id);
});

it('given 家长为多个儿童创建任务，when 提交，then 为每个儿童生成独立任务', async () => {
  // Given: 家庭有2个儿童，家长创建任务模板
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child1 = await createChild({ familyId: family.id });
  const child2 = await createChild({ familyId: family.id });

  const taskPlan = await createTaskPlan({
    familyId: family.id,
    title: '每日刷牙',
    taskType: '刷牙',
    points: 5,
    status: 'published'
  });

  const today = new Date().toISOString().split('T')[0];

  // When: 为2个儿童批量创建任务
  const response = await request(app)
    .post('/api/tasks')
    .set('Cookie', await createSession(parent))
    .send({
      taskPlanId: taskPlan.id,
      title: '临时刷牙任务',
      taskType: '刷牙',
      points: 5,
      date: today,
      childIds: [child1.id, child2.id],
      isManual: true
    });

  // Then: 为每个儿童生成独立任务
  expect(response.status).toBe(201);
  expect(response.body.tasks).toHaveLength(2);

  const child1Tasks = await getTasksByChild(child1.id, today, true);
  const child2Tasks = await getTasksByChild(child2.id, today, true);

  expect(child1Tasks).toHaveLength(1);
  expect(child2Tasks).toHaveLength(1);

  // And: 两个任务实例完全独立
  expect(child1Tasks[0].id).not.toBe(child2Tasks[0].id);
  expect(child1Tasks[0].childId).toBe(child1.id);
  expect(child2Tasks[0].childId).toBe(child2.id);

  // And: 都标记为手动创建
  expect(child1Tasks[0].isManual).toBe(true);
  expect(child2Tasks[0].isManual).toBe(true);
});

it('given 家长选择管理员模板，when 预填信息，then 正常预填管理员模板信息', async () => {
  // Given: 系统有管理员发布的模板
  const admin = await createAdmin();
  const adminTemplate = await createAdminTemplate({
    title: '管理员推荐任务',
    taskType: '学习',
    points: 20,
    status: 'published'
  });

  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });

  // When: 获取模板列表
  const response = await request(app)
    .get('/api/task-plans/for-quick-create')
    .set('Cookie', await createSession(parent));

  // Then: 显示管理员模板
  expect(response.status).toBe(200);
  expect(response.body.adminTemplates).toHaveLength(1);
  expect(response.body.adminTemplates[0].title).toBe('管理员推荐任务');
});
```

**Test Coverage:**
- Unit tests for template loading logic
- Integration tests for API endpoints
- Integration tests for manual task creation
- E2E tests for complete user journey (Playwright)
- Batch creation tests (multiple children)
- is_manual marker tests

### Security & Compliance

**COPPA/GDPR Compliance:**
- Manual tasks follow same access control as scheduled tasks
- Parent authorization required
- Audit trail for all manual task creation

**RBAC:**
- Only Parent role can create manual tasks
- Parent can only create tasks for their own family
- Admin templates are read-only for parents

**Data Integrity:**
- Manual tasks are clearly marked (is_manual=true)
- No task_plan_id for manual tasks
- Cannot convert manual task to scheduled task (create new scheduled task instead)

### File Length Constraint

**MAX 800 lines per file** - If component exceeds limit, split into:
- template-selector.tsx (main selector)
- template-card.tsx (template card component)
- quick-task-form.tsx (main form)
- quick-task-fields.tsx (form fields)

### Project Structure Notes

**Alignment:**
- Follows unified project structure (paths, modules, naming)
- Database queries in lib/db/queries/tasks.ts (per-table file)
- Function-based queries (NOT Repository pattern)
- BDD development (Given-When-Then, tests BEFORE implementation)

**Dependencies:**
- Depends on Story 2.1: Parent Creates Task Plan Template (task_plans table)
- Depends on Story 2.4: System Auto-Generates Task Instances (tasks table)
- Prerequisite: Users table, Families table exist (Epic 1)
- Next story: Story 2.7 (Parent Batch Approves Tasks) - can approve manual tasks

**Cross-Story Impact:**
- Story 2.8 (Child Views Today's Task List) - displays manual tasks with badge
- Story 2.9 (Child Marks Task Complete) - marks manual tasks complete
- Story 2.10 (Parent Approves Task Completion) - approves manual tasks
- Story 2.12 (Parent Creates One-Time Task) - similar functionality, but without template

### Previous Story Intelligence

**From Story 2.1 (Parent Creates Task Plan Template):**
- task_plans table created with full schema
- TaskPlanForm component exists
- Learnings: Use Drizzle ORM queries, avoid native SQL; follow per-table query file pattern

**From Story 2.4 (System Auto-Generates Task Instances):**
- tasks table created with schema
- Task creation logic established
- Learnings: Batch insert for efficiency, use transactions for atomicity

**From Story 2.5 (Parent Pauses/Resumes/Deletes Task Plan):**
- Template status filtering implemented
- Learnings: Status management is important, use soft delete

### References

- Source: docs/TECH_SPEC.md - Technical specifications
- Source: docs/TECH_SPEC_DATABASE.md - Database schema
- Source: docs/TECH_SPEC_BUN.md - Bun runtime requirements
- Source: docs/TECH_SPEC_BDD.md - BDD development guidelines
- Source: _bmad-output/planning-artifacts/epics.md#Story-2.6 - Story requirements
- Source: _bmad-output/planning-artifacts/architecture.md#ADR-5 - Database query layer architecture
- Source: _bmad-output/planning-artifacts/ux-design-specification.md - UI/UX specifications
- Source: _bmad-output/implementation-artifacts/2-1-parent-creates-task-plan-template.md - Story 2.1 context
- Source: _bmad-output/implementation-artifacts/2-4-system-auto-generates-task-instances.md - Story 2.4 context
- Source: _bmad-output/implementation-artifacts/2-5-parent-pauses-resumes-deletes-task-plan.md - Story 2.5 context

### Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

### Completion Notes List

### File List

- `database/schema/tasks.ts` - Update with is_manual field
- `database/migrations/xxx_add_is_manual_to_tasks.sql` - Migration file
- `lib/db/queries/tasks.ts` - Extend with manual task queries
- `components/forms/template-selector.tsx` - Template selector component
- `components/forms/quick-task-form.tsx` - Quick task form component
- `components/features/task-card.tsx` - Update with is_manual badge
- `app/api/tasks/route.ts` - Manual task creation API
- `tests/integration/quick-task-creation.spec.ts` - Integration tests
- `tests/e2e/quick-task-creation.spec.ts` - E2E tests
