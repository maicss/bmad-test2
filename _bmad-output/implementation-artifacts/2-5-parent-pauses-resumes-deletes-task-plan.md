# Story 2.5: Parent Pauses/Resumes/Deletes Task Plan

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长,
I want 暂停、恢复或删除任务计划,
So that 我可以灵活控制任务计划的执行状态。

## Acceptance Criteria

**Given** 我已有至少一个任务模板
**When** 我进入任务计划管理页面
**Then** 每个模板显示以下操作按钮：
  - 暂停：暂时停止生成新任务实例（已生成的不受影响）
  - 恢复：重新激活暂停的模板，继续生成任务实例
  - 删除：永久删除模板（已生成的任务实例保留）
**And** 点击暂停时，显示确认对话框并要求选择暂停时长：
  - 暂停1天
  - 暂停3天
  - 暂停7天
  - 自定义暂停时长
  - 永久暂停
**And** 暂停期间，模板状态显示为"已暂停"并显示预计恢复时间
**And** 恢复操作立即生效，模板状态变回"已发布"
**And** 删除操作显示警告："删除后无法恢复，但已生成的任务实例将保留"

## Tasks / Subtasks

- [ ] Task 1: 扩展task_plans表支持暂停/恢复状态 (AC: 模板状态变更为已暂停/已发布)
  - [ ] 1.1 扩展task_plans表添加status枚举（draft/published/paused）
  - [ ] 1.2 添加paused_until字段（timestamp, nullable）
  - [ ] 1.3 添加deleted_at字段（timestamp, nullable, soft delete）
  - [ ] 1.4 创建并执行数据库迁移
  - [ ] 1.5 更新lib/db/queries/task-plans.ts支持新字段

- [ ] Task 2: 实现任务计划暂停功能 (AC: 暂停操作，显示暂停时长选择)
  - [ ] 2.1 创建PauseTaskPlanDialog组件（Shadcn Dialog + Radio Group）
  - [ ] 2.2 实现暂停时长选项（1天/3天/7天/自定义/永久）
  - [ ] 2.3 实现自定义时长输入（天数，min=1）
  - [ ] 2.4 实现暂停确认逻辑
  - [ ] 2.5 更新API端点支持暂停操作
  - [ ] 2.6 实现状态变更为"已暂停"并设置paused_until时间戳

- [ ] Task 3: 实现任务计划恢复功能 (AC: 恢复操作立即生效，状态变回已发布)
  - [ ] 3.1 恢复按钮逻辑（仅对暂停状态的模板显示）
  - [ ] 3.2 实现恢复确认对话框
  - [ ] 3.3 更新API端点支持恢复操作
  - [ ] 3.4 清除paused_until时间戳
  - [ ] 3.5 状态立即变更为"已发布"
  - [ ] 3.6 触发即时任务生成（可选：恢复时生成当天任务）

- [ ] Task 4: 实现任务计划删除功能 (AC: 删除操作，显示警告，已生成任务保留)
  - [ ] 4.1 创建DeleteTaskPlanDialog组件（Shadcn Dialog）
  - [ ] 4.2 实现删除警告提示："删除后无法恢复，但已生成的任务实例将保留"
  - [ ] 4.3 实现删除确认逻辑
  - [ ] 4.4 更新API端点支持软删除
  - [ ] 4.5 设置deleted_at时间戳（软删除）
  - [ ] 4.6 验证已生成的任务实例不受影响

- [ ] Task 5: 集成到任务计划管理页面 (AC: 进入任务计划管理页面显示操作按钮)
  - [ ] 5.1 创建TaskPlanList组件（显示所有任务计划）
  - [ ] 5.2 为每个模板添加操作按钮行（暂停/恢复/删除）
  - [ ] 5.3 根据状态显示不同按钮（暂停显示恢复，已发布显示暂停）
  - [ ] 5.4 实现状态徽章显示（已发布/已暂停/草稿）
  - [ ] 5.5 实现暂停倒计时显示（剩余暂停时间）
  - [ ] 5.6 实现已暂停模板的高亮显示

- [ ] Task 6: 修改任务生成逻辑支持暂停状态 (AC: 暂停时停止生成新任务)
  - [ ] 6.1 修改Story 2.4的TaskGenerator类
  - [ ] 6.2 添加状态过滤（只处理status='published'的模板）
  - [ ] 6.3 验证已暂停模板不生成任务实例
  - [ ] 6.4 添加日志记录（暂停模板跳过生成）
  - [ ] 6.5 测试暂停-恢复-生成的完整流程

- [ ] Task 7: 实现暂停倒计时和自动恢复 (AC: 暂停期间显示预计恢复时间)
  - [ ] 7.1 创建暂停倒计时组件（PausedCountdown）
  - [ ] 7.2 实现剩余时间计算（paused_until - now）
  - [ ] 7.3 实现倒计时格式化（X天Y小时Z分钟）
  - [ ] 7.4 创建自动恢复调度器（使用Bun定时器）
  - [ ] 7.5 实现自动恢复逻辑（暂停到期自动恢复）
  - [ ] 7.6 发送恢复通知（可选：邮件/推送）

- [ ] Task 8: 编写BDD测试 (AC: 所有验收条件)
  - [ ] 8.1 Given-When-Then格式：暂停任务计划集成测试
  - [ ] 8.2 测试暂停操作（不同时长：1天/3天/7天/自定义/永久）
  - [ ] 8.3 测试恢复操作（立即生效）
  - [ ] 8.4 测试删除操作（软删除，任务实例保留）
  - [ ] 8.5 测试暂停期间任务生成被阻止
  - [ ] 8.6 测试自动恢复功能
  - [ ] 8.7 测试暂停倒计时显示

- [ ] Task 9: 实现错误处理和用户反馈 (AC: 用户体验要求)
  - [ ] 9.1 使用Shadcn Toast显示操作成功/失败
  - [ ] 9.2 处理无效暂停时长（必须>0）
  - [ ] 9.3 处理已删除模板的操作拦截
  - [ ] 9.4 实现操作确认对话框（防误操作）
  - [ ] 9.5 添加操作历史记录（审计日志）

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

**Database Schema Changes:**
```typescript
// database/schema/task-plans.ts (UPDATE from Story 2.1)
import { sqliteTable, text, integer, timestamp } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const taskPlans = sqliteTable('task_plans', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull(),
  title: text('title').notNull(),
  taskType: text('task_type').notNull(),
  points: integer('points').notNull(),
  rule: text('rule').notNull(), // JSON
  excludedDates: text('excluded_dates'), // JSON array
  reminderTime: text('reminder_time'),
  
  // NEW: Status with paused state
  status: text('status').notNull().default('draft'), // 'draft' | 'published' | 'paused'
  
  // NEW: Pause until timestamp
  pausedUntil: timestamp('paused_at'), // null = not paused
  
  // NEW: Soft delete
  deletedAt: timestamp('deleted_at'), // null = not deleted
  
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});
```

**Pause/Resume/Delete Architecture:**
```typescript
// lib/db/queries/task-plans.ts
import { db } from '@/lib/db';
import { taskPlans } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export type TaskPlanStatus = 'draft' | 'published' | 'paused';

export async function pauseTaskPlan(
  planId: string, 
  durationDays: number | null // null = permanent pause
) {
  const pausedUntil = durationDays 
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : null; // Permanent pause

  return await db.update(taskPlans)
    .set({ 
      status: 'paused',
      pausedUntil: pausedUntil,
      updatedAt: new Date()
    })
    .where(eq(taskPlans.id, planId))
    .returning();
}

export async function resumeTaskPlan(planId: string) {
  return await db.update(taskPlans)
    .set({ 
      status: 'published',
      pausedUntil: null,
      updatedAt: new Date()
    })
    .where(eq(taskPlans.id, planId))
    .returning();
}

export async function deleteTaskPlan(planId: string) {
  // Soft delete - set deleted_at, don't actually delete
  return await db.update(taskPlans)
    .set({ 
      deletedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(taskPlans.id, planId))
    .returning();
}

export async function getActiveTaskPlans(familyId: string) {
  // Get only non-deleted plans
  return await db.query.taskPlans.findMany({
    where: and(
      eq(taskPlans.familyId, familyId),
      isNull(taskPlans.deletedAt)
    )
  });
}

export async function getPublishedTaskPlansForGeneration() {
  // Get only published plans (exclude paused and deleted)
  return await db.query.taskPlans.findMany({
    where: and(
      eq(taskPlans.status, 'published'),
      isNull(taskPlans.deletedAt)
    )
  });
}
```

**Auto-Resume Scheduler:**
```typescript
// lib/schedulers/auto-resume-scheduler.ts
import { db } from '@/lib/db';
import { taskPlans } from '@/lib/db/schema';
import { eq, and, isNull, lt } from 'drizzle-orm';

export class AutoResumeScheduler {
  /**
   * Check and auto-resume paused task plans
   */
  async checkAndResume() {
    const now = new Date();

    // Find all paused plans where paused_until has passed
    const expiredPausedPlans = await db.query.taskPlans.findMany({
      where: and(
        eq(taskPlans.status, 'paused'),
        lt(taskPlans.pausedUntil, now)
      )
    });

    console.log(`Found ${expiredPausedPlans.length} paused plans to auto-resume`);

    let resumedCount = 0;
    for (const plan of expiredPausedPlans) {
      try {
        await db.update(taskPlans)
          .set({ 
            status: 'published',
            pausedUntil: null,
            updatedAt: now
          })
          .where(eq(taskPlans.id, plan.id));

        resumedCount++;
        console.log(`Auto-resumed task plan: ${plan.id}`);
      } catch (error) {
        console.error(`Failed to auto-resume task plan ${plan.id}:`, error);
      }
    }

    return resumedCount;
  }

  /**
   * Start auto-resume scheduler
   * Checks every hour for expired paused plans
   */
  start() {
    console.log('Starting auto-resume scheduler');

    // Run immediately on startup
    this.checkAndResume();

    // Run every hour
    setInterval(async () => {
      await this.checkAndResume();
    }, 60 * 60 * 1000); // 1 hour
  }
}

// Export singleton instance
export const autoResumeScheduler = new AutoResumeScheduler();
```

### Architecture Compliance

**Component Location:**
- Task plan list: `components/features/task-plan-list.tsx`
- Pause dialog: `components/dialogs/pause-task-plan-dialog.tsx`
- Delete dialog: `components/dialogs/delete-task-plan-dialog.tsx`
- Pause countdown: `components/features/paused-countdown.tsx`
- Auto-resume scheduler: `lib/schedulers/auto-resume-scheduler.ts`
- Queries: `lib/db/queries/task-plans.ts` (extend existing)
- Route: `app/api/task-plans/[id]/pause/route.ts`
- Route: `app/api/task-plans/[id]/resume/route.ts`
- Route: `app/api/task-plans/[id]/route.ts` (DELETE for soft delete)

**Design System:**
- Use Shadcn UI components: Button, Dialog, RadioGroup, Badge, Alert, Toast
- Pause countdown: visual countdown timer with format "X天Y小时"
- Status badges: 
  - "已发布" (green)
  - "已暂停" (orange with countdown)
  - "草稿" (gray)
- Delete warning: Shadcn Alert component with destructive variant
- Responsive design (parent-end: mini-program optimized <450px)

**Performance Requirements:**
- Pause/Resume/Delete operations: <200ms
- Auto-resume check: <1 second for all paused plans
- API response: <500ms (NFR3: P95)

### Testing Requirements

**BDD Format (GIVEN-WHEN-THEN):**
```typescript
// tests/integration/task-plan-lifecycle.spec.ts
it('given 家长有已发布任务计划，when 暂停7天，then 模板状态变更为已暂停，7天后不生成任务', async () => {
  // Given: 家长已创建并发布任务计划
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const taskPlan = await createTaskPlan({
    familyId: family.id,
    status: 'published'
  });

  // When: 暂停7天
  const response = await request(app)
    .post(`/api/task-plans/${taskPlan.id}/pause`)
    .set('Cookie', await createSession(parent))
    .send({ durationDays: 7 });

  // Then: 模板状态变更为已暂停
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('paused');
  
  // And: 设置paused_until时间戳
  const updatedPlan = await getTaskPlanById(taskPlan.id);
  expect(updatedPlan.pausedUntil).not.toBeNull();
  
  const pausedUntil = new Date(updatedPlan.pausedUntil);
  const expectedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  expect(pausedUntil.getTime()).toBeCloseTo(expectedDate.getTime(), 1000);

  // And: 暂停期间不生成任务
  const generator = new TaskGenerator();
  const today = new Date().toISOString().split('T')[0];
  const result = await generator.generateForDate(today);

  // Should not generate tasks for paused plan
  const tasks = await getTasksByPlan(taskPlan.id, today);
  expect(tasks).toHaveLength(0);
});

it('given 任务计划已暂停，when 恢复，then 模板状态立即变更为已发布', async () => {
  // Given: 任务计划已暂停
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const taskPlan = await createTaskPlan({
    familyId: family.id,
    status: 'paused',
    pausedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // paused for 1 day
  });

  // When: 恢复任务计划
  const response = await request(app)
    .post(`/api/task-plans/${taskPlan.id}/resume`)
    .set('Cookie', await createSession(parent));

  // Then: 模板状态立即变更为已发布
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('published');

  // And: 清除paused_until时间戳
  const updatedPlan = await getTaskPlanById(taskPlan.id);
  expect(updatedPlan.pausedUntil).toBeNull();
});

it('given 任务计划已生成任务实例，when 删除，then 已生成的任务实例保留', async () => {
  // Given: 任务计划已生成任务实例
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child = await createChild({ familyId: family.id });
  const taskPlan = await createTaskPlan({
    familyId: family.id,
    status: 'published'
  });

  // Generate tasks for today
  const generator = new TaskGenerator();
  const today = new Date().toISOString().split('T')[0];
  await generator.generateForDate(today);

  const tasksBefore = await getTasksByPlan(taskPlan.id, today);
  expect(tasksBefore).toHaveLength(1);

  // When: 删除任务计划
  const response = await request(app)
    .delete(`/api/task-plans/${taskPlan.id}`)
    .set('Cookie', await createSession(parent));

  // Then: 任务计划被软删除
  expect(response.status).toBe(200);
  const deletedPlan = await getTaskPlanById(taskPlan.id);
  expect(deletedPlan.deletedAt).not.toBeNull();

  // And: 已生成的任务实例保留
  const tasksAfter = await getTasksByPlan(taskPlan.id, today);
  expect(tasksAfter).toHaveLength(1);
  expect(tasksAfter[0].id).toBe(tasksBefore[0].id);
});

it('given 任务计划永久暂停，when 系统生成任务，then 不生成任务实例', async () => {
  // Given: 任务计划永久暂停
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const taskPlan = await createTaskPlan({
    familyId: family.id,
    status: 'paused',
    pausedUntil: null // Permanent pause
  });

  // When: 系统生成任务
  const generator = new TaskGenerator();
  const today = new Date().toISOString().split('T')[0];
  const result = await generator.generateForDate(today);

  // Then: 不生成任务实例
  const tasks = await getTasksByPlan(taskPlan.id, today);
  expect(tasks).toHaveLength(0);
});

it('given 任务计划暂停，when 暂停时间到期，then 自动恢复并开始生成任务', async () => {
  // Given: 任务计划暂停1分钟（便于测试）
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const taskPlan = await createTaskPlan({
    familyId: family.id,
    status: 'paused',
    pausedUntil: new Date(Date.now() + 60 * 1000) // 1 minute from now
  });

  // When: 等待1分钟，自动恢复检查
  await sleep(65 * 1000); // Wait 65 seconds

  const scheduler = new AutoResumeScheduler();
  await scheduler.checkAndResume();

  // Then: 任务计划自动恢复
  const updatedPlan = await getTaskPlanById(taskPlan.id);
  expect(updatedPlan.status).toBe('published');
  expect(updatedPlan.pausedUntil).toBeNull();

  // And: 系统可以生成任务
  const generator = new TaskGenerator();
  const today = new Date().toISOString().split('T')[0];
  await generator.generateForDate(today);

  const tasks = await getTasksByPlan(taskPlan.id, today);
  expect(tasks).toHaveLength(1);
});
```

**Test Coverage:**
- Unit tests for pause/resume/delete logic
- Unit tests for auto-resume scheduler
- Integration tests for API endpoints
- Integration tests for task generation with paused plans
- E2E tests for complete user journey (Playwright)
- Countdown timer tests (formatting accuracy)

### Security & Compliance

**COPPA/GDPR Compliance:**
- Soft delete ensures audit trail (deleted tasks not immediately purged)
- Parent authorization required for all operations
- Pause/resume history logged
- No sensitive data in logs

**RBAC:**
- Only Parent role can pause/resume/delete their own family's task plans
- Cannot pause/resume/delete templates from other families
- Admin cannot modify parent's task plans (audit trail required)

**Data Integrity:**
- Soft delete prevents accidental data loss
- Paused plans are clearly marked in database
- Auto-resume uses transaction to ensure atomic update
- Unique constraints remain valid after soft delete

### File Length Constraint

**MAX 800 lines per file** - If component exceeds limit, split into:
- task-plan-list.tsx (main list)
- task-plan-actions.tsx (action buttons)
- pause-task-plan-dialog.tsx (pause dialog)
- delete-task-plan-dialog.tsx (delete dialog)
- paused-countdown.tsx (countdown component)
- auto-resume-scheduler.ts (scheduler logic)

### Project Structure Notes

**Alignment:**
- Follows unified project structure (paths, modules, naming)
- Database queries in lib/db/queries/task-plans.ts (per-table file)
- Function-based queries (NOT Repository pattern)
- BDD development (Given-When-Then, tests BEFORE implementation)

**Dependencies:**
- Depends on Story 2.1: Parent Creates Task Plan Template (task_plans table)
- Depends on Story 2.4: System Auto-Generates Task Instances (TaskGenerator)
- Prerequisite: Users table, Families table, tasks table exist
- Next story: Story 2.6 (Parent Uses Template to Quickly Create Task) will reuse task plan list

**Cross-Story Impact:**
- Story 2.4 (System Auto-Generates Task Instances) must filter out paused plans
- Story 2.6 (Parent Uses Template) only shows published templates
- Story 2.8 (Child Views Today's Task List) displays tasks from published plans only

### Previous Story Intelligence

**From Story 2.1 (Parent Creates Task Plan Template):**
- task_plans table created with status field
- TaskPlanForm component exists
- Learnings: Use Drizzle ORM queries, avoid native SQL; follow per-table query file pattern

**From Story 2.4 (System Auto-Generates Task Instances):**
- TaskGenerator class created
- Task generation logic established
- Learnings: Status filtering is important for task generation

### References

- Source: docs/TECH_SPEC.md - Technical specifications
- Source: docs/TECH_SPEC_DATABASE.md - Database schema
- Source: docs/TECH_SPEC_BUN.md - Bun runtime requirements
- Source: docs/TECH_SPEC_BDD.md - BDD development guidelines
- Source: _bmad-output/planning-artifacts/epics.md#Story-2.5 - Story requirements
- Source: _bmad-output/planning-artifacts/architecture.md#ADR-5 - Database query layer architecture
- Source: _bmad-output/planning-artifacts/ux-design-specification.md - UI/UX specifications
- Source: _bmad-output/implementation-artifacts/2-1-parent-creates-task-plan-template.md - Story 2.1 context
- Source: _bmad-output/implementation-artifacts/2-4-system-auto-generates-task-instances.md - Story 2.4 context

### Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

### Completion Notes List

### File List

- `database/schema/task-plans.ts` - Update with status, pausedUntil, deletedAt fields
- `database/migrations/xxx_add_task_plan_lifecycle.sql` - Migration file
- `lib/db/queries/task-plans.ts` - Extend with pause/resume/delete functions
- `components/features/task-plan-list.tsx` - Task plan list with actions
- `components/dialogs/pause-task-plan-dialog.tsx` - Pause dialog
- `components/dialogs/delete-task-plan-dialog.tsx` - Delete dialog
- `components/features/paused-countdown.tsx` - Pause countdown component
- `lib/schedulers/auto-resume-scheduler.ts` - Auto-resume scheduler
- `app/api/task-plans/[id]/pause/route.ts` - Pause API endpoint
- `app/api/task-plans/[id]/resume/route.ts` - Resume API endpoint
- `app/api/task-plans/[id]/route.ts` - DELETE endpoint (soft delete)
- `tests/integration/task-plan-lifecycle.spec.ts` - Integration tests
- `tests/unit/auto-resume-scheduler.spec.ts` - Unit tests for scheduler
- `tests/e2e/task-plan-lifecycle.spec.ts` - E2E tests
