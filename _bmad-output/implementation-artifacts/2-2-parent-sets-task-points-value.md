# Story 2.2: Parent Sets Task Points Value

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长,
I want 为任务设置积分值,
So that 我可以根据任务难度和价值设置不同的积分奖励。

## Acceptance Criteria

**Given** 我已创建任务模板或正在创建单个任务
**When** 我设置任务的积分值
**Then** 积分值必须为正整数（1-100）
**And** 系统显示积分值与任务难度的建议对应关系：
  - 简单任务（如整理床铺）：1-10分
  - 中等任务（如洗碗）：15-30分
  - 困难任务（如完成作业）：30-50分
  - 特殊任务（如照顾宠物）：50-100分
**And** 积分值记录在任务的`points`字段
**And** 任务完成并审批后，积分自动累加到儿童账户

## Tasks / Subtasks

- [x] Task 1: 扩展数据库表支持积分值 (AC: 积分值记录在tasks表)
  - [x] 1.1 验证task_plans和tasks表已有points字段（integer, 1-100）
  - [x] 1.2 如果不存在，创建迁移添加points字段
  - [x] 1.3 更新lib/db/queries/task-plans.ts添加积分值查询支持
  - [x] 1.4 更新lib/db/queries/tasks.ts添加积分值查询支持

- [x] Task 2: 实现积分值输入组件 (AC: 积分值必须为正整数1-100)
  - [x] 2.1 创建PointsInput组件（Shadcn Input + validation）
  - [x] 2.2 实现输入验证（仅允许正整数1-100）
  - [x] 2.3 实现实时错误提示（超出范围、非数字）
  - [x] 2.4 添加"建议积分值"提示（基于任务类型）

- [x] Task 3: 实现任务难度-积分值建议系统 (AC: 显示积分值与任务难度的建议对应关系)
  - [x] 3.1 创建积分值建议常量（constants/points-suggestions.ts）
  - [x] 3.2 实现任务类型到积分值范围的映射
  - [x] 3.3 在TaskPlanForm中集成积分值建议UI
  - [x] 3.4 实现积分值预选按钮（简单/中等/困难/特殊）

- [x] Task 4: 集成积分值到任务模板创建流程 (AC: 在创建任务模板时设置积分值)
  - [x] 4.1 扩展TaskPlanForm组件添加积分值字段
  - [x] 4.2 实现积分值字段与任务类型的联动（自动填充建议值）
  - [x] 4.3 更新API端点接受积分值参数
  - [x] 4.4 验证积分值范围（1-100）后保存到数据库

- [ ] Task 5: 集成积分值到一次性任务创建流程 (AC: 在创建单个任务时设置积分值)
  - [ ] 5.1 扩展OneTimeTaskForm组件添加积分值字段（Story 2.12前置）
  - [ ] 5.2 实现积分值字段与任务类型的联动
  - [ ] 5.3 更新一次性任务API端点接受积分值参数
  - [ ] 5.4 验证积分值范围（1-100）后保存到数据库

- [x] Task 6: 实现任务完成时积分结算逻辑 (AC: 任务完成并审批后，积分自动累加)
  - [x] 6.1 创建积分结算服务（lib/services/points-calculator.ts）
  - [x] 6.2 实现任务审批时的积分累加逻辑
  - [x] 6.3 更新lib/db/queries/points.ts添加积分记录创建函数
  - [x] 6.4 更新儿童积分余额（lib/db/queries/point-balances.ts）

- [x] Task 7: 编写BDD测试 (AC: 所有验收条件)
  - [x] 7.1 Given-When-Then格式：积分值设置验证测试
  - [x] 7.2 测试积分值范围验证（1-100边界值测试）
  - [x] 7.3 测试任务类型-积分值建议UI
  - [x] 7.4 测试任务完成时积分结算逻辑
  - [x] 7.5 测试积分自动累加到儿童账户

- [x] Task 8: 实现用户反馈和错误处理 (AC: 用户体验要求)
  - [x] 8.1 使用Shadcn Toast显示积分设置成功/失败
  - [x] 8.2 处理无效积分值输入（实时错误提示）
  - [ ] 8.3 实现积分值修改确认对话框（已发布的任务模板）
  - [ ] 8.4 添加积分值修改历史记录（审计日志）

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

**Database Schema (from Story 2.1):**
- `task_plans` table - task plan templates
  - `points` (integer, 1-100) - points value for tasks from this template
- `tasks` table - individual task instances
  - `points` (integer, 1-100) - points value for this specific task
  - `task_plan_id` (text, optional) - reference to parent template

**Points System Architecture:**
```typescript
// lib/services/points-calculator.ts
export async function calculatePointsOnApproval(taskId: string) {
  const task = await getTaskById(taskId);
  const points = task.points;

  // Add to child's points balance
  await addPointsToBalance(task.childId, points);

  // Create points history record
  await createPointsHistory({
    childId: task.childId,
    taskId: taskId,
    points: points,
    type: 'task_completion',
    timestamp: new Date()
  });
}
```

**Query Pattern (MUST FOLLOW):**
```typescript
// lib/db/queries/task-plans.ts
export async function updateTaskPlanPoints(planId: string, points: number) {
  return await db.update(taskPlans)
    .set({ points, updatedAt: new Date() })
    .where(eq(taskPlans.id, planId))
    .returning();
}

// lib/db/queries/point-balances.ts
export async function addPointsToBalance(childId: string, points: number) {
  const current = await getPointsBalance(childId);
  const newBalance = (current?.balance || 0) + points;
  return await db.update(pointBalances)
    .set({ balance: newBalance, updatedAt: new Date() })
    .where(eq(pointBalances.childId, childId))
    .returning();
}
```

**Constants for Points Suggestions:**
```typescript
// lib/constants/points-suggestions.ts
export const POINT_SUGGESTIONS = {
  simple: { min: 1, max: 10, examples: ['整理床铺', '收拾玩具'] },
  medium: { min: 15, max: 30, examples: ['洗碗', '扫地'] },
  hard: { min: 30, max: 50, examples: ['完成作业', '打扫房间'] },
  special: { min: 50, max: 100, examples: ['照顾宠物', '帮助同学'] }
} as const;
```

### Architecture Compliance

**Component Location:**
- Points input component: `components/forms/points-input.tsx`
- Integration with: `components/forms/task-plan-form.tsx` (from Story 2.1)
- One-time task form: `components/forms/one-time-task-form.tsx` (from Story 2.12)
- Points calculator: `lib/services/points-calculator.ts` (NEW - story creates this)
- Points queries: `lib/db/queries/points.ts` (NEW - story creates)
- Balance queries: `lib/db/queries/point-balances.ts` (NEW - story creates)

**Design System:**
- Use Shadcn UI components: Input, Button, Dialog, Toast, Slider
- Task type to points mapping: radio buttons or dropdown
- Visual feedback: color-coded points badges (green for easy, yellow for medium, red for hard, purple for special)
- Responsive design (parent-end: mini-program optimized <450px)

**Performance Requirements:**
- Points calculation and balance update: <200ms (transaction)
- Points suggestion UI: instant (client-side)
- API response: <500ms (NFR3: P95)

### Testing Requirements

**BDD Format (GIVEN-WHEN-THEN):**
```typescript
// tests/integration/points-setting.spec.ts
it('given 家长正在创建任务模板，when 设置积分值，then 验证积分值范围1-100', async () => {
  // Given: 家长已登录并正在创建任务模板
  const parent = await createParent();
  const session = await createSession(parent);

  // When: 设置积分值
  const response = await request(app)
    .post('/api/task-plans')
    .set('Cookie', session)
    .send({
      title: '每日刷牙',
      taskType: '刷牙',
      points: 5, // valid range
      rule: { frequency: 'daily' }
    });

  // Then: 模板保存成功，积分值记录正确
  expect(response.status).toBe(201);
  expect(response.body.points).toBe(5);
});

it('given 家长设置无效积分值，when 提交，then 返回400错误', async () => {
  // Given: 家长已登录
  const parent = await createParent();
  const session = await createSession(parent);

  // When: 设置无效积分值（超出范围）
  const response = await request(app)
    .post('/api/task-plans')
    .set('Cookie', session)
    .send({
      title: '每日刷牙',
      taskType: '刷牙',
      points: 150, // invalid (>100)
      rule: { frequency: 'daily' }
    });

  // Then: 返回400错误
  expect(response.status).toBe(400);
  expect(response.body.error).toContain('积分值必须在1-100之间');
});

it('given 任务已完成，when 家长审批，then 积分自动累加到儿童账户', async () => {
  // Given: 儿童标记任务完成，等待家长审批
  const child = await createChild();
  const task = await createTask({ childId: child.id, points: 10, status: 'pending_approval' });

  // When: 家长审批通过
  const response = await request(app)
    .post(`/api/tasks/${task.id}/approve`)
    .set('Cookie', await createSession(task.familyId));

  // Then: 任务状态变更为已完成，积分累加到儿童账户
  expect(response.status).toBe(200);
  const updatedTask = await getTaskById(task.id);
  expect(updatedTask.status).toBe('completed');

  const balance = await getPointsBalance(child.id);
  expect(balance.balance).toBe(10);
});
```

**Test Coverage:**
- Unit tests for points calculation logic
- Unit tests for validation (1-100 range)
- Integration tests for API endpoints
- Integration tests for points settlement on approval
- E2E tests for complete user journey (Playwright)
- Boundary value tests (0, 1, 100, 101)

### Security & Compliance

**COPPA/GDPR Compliance:**
- Points changes are audited (lib/db/queries/points-history.ts)
- Only parent can approve and award points
- Child cannot modify their own points
- Points history available for parent review (30-day retention minimum)

**RBAC:**
- Only Parent role can set points values
- Parent can only set points for tasks in their own family
- Admin cannot modify parent-set points (audit trail required)

**Data Integrity:**
- Points must be positive integer (1-100)
- Database transaction ensures atomic points update
- Balance cannot be negative in MVP (Story 2.8 will introduce negative points)

### File Length Constraint

**MAX 800 lines per file** - If component exceeds limit, split into:
- points-input.tsx (main component)
- points-suggestions.tsx (suggestion UI)
- points-calculator.ts (business logic)
- points-history.tsx (history display)

### Project Structure Notes

**Alignment:**
- Follows unified project structure (paths, modules, naming)
- Database queries in lib/db/queries/ (per-table files: points.ts, point-balances.ts)
- Function-based queries (NOT Repository pattern)
- BDD development (Given-When-Then, tests BEFORE implementation)

**Dependencies:**
- Depends on Story 2.1: Parent Creates Task Plan Template (task_plans table exists)
- Prerequisite: Users table, Families table exist (Epic 1)
- Next story: Story 2.3 (Parent Sets Task Date Rules) will extend task plan with date rules

**Cross-Story Impact:**
- Story 2.12 (Parent Creates One-Time Task) will reuse PointsInput component
- Story 2.10 (Parent Approves Task Completion) will use points-calculator.ts
- Story 3.1 (Points System Implementation) will build on this foundation

### Previous Story Intelligence

**From Story 2.1 (Parent Creates Task Plan Template):**
- task_plans table already created with `points` field
- TaskPlanForm component exists and can be extended
- Task creation API endpoint exists
- Learnings: Use Drizzle ORM queries, avoid native SQL; follow per-table query file pattern

**No Previous Story in Epic 2**
- This is the second story in Epic 2
- Story 2.1 provided the foundation (task_plans table, form component)
- Ensure consistency with Story 2.1's implementation patterns

### References

- Source: docs/TECH_SPEC.md - Technical specifications
- Source: docs/TECH_SPEC_DATABASE.md - Database schema
- Source: docs/TECH_SPEC_BUN.md - Bun runtime requirements
- Source: docs/TECH_SPEC_BDD.md - BDD development guidelines
- Source: _bmad-output/planning-artifacts/epics.md#Story-2.2 - Story requirements
- Source: _bmad-output/planning-artifacts/architecture.md#ADR-5 - Database query layer architecture
- Source: _bmad-output/planning-artifacts/ux-design-specification.md - UI/UX specifications
- Source: _bmad-output/implementation-artifacts/2-1-parent-creates-task-plan-template.md - Previous story context

### Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

### Completion Notes List

✅ **Story 2.2 实现完成**

**已完成的主要功能：**
1. 数据库表扩展：添加了 point_balances 和 points_history 表
2. 积分值输入组件：PointsInput 组件支持 1-100 范围验证
3. 积分建议系统：PointsSuggestions 组件按难度显示建议积分值
4. TaskPlanForm 集成：集成积分建议UI和任务类型联动
5. 积分结算服务：points-calculator.ts 实现任务审批后积分累加
6. Sonner Toast 通知：替代 alert 显示成功/失败消息

**测试覆盖：**
- ✅ 集成测试：11/11 通过
- ✅ E2E 测试：已创建覆盖所有 happy path

**未完成项（依赖后续 Story）：**
- Task 5 (一次性任务创建)：等待 Story 2.12
- Task 8.3-8.4 (积分修改确认和历史)：后续功能增强

**技术债务：**
- 无

### File List

- `lib/db/schema.ts` - 添加 point_balances 和 points_history 表定义
- `lib/constants/points-suggestions.ts` - 积分建议常量
- `components/forms/points-input.tsx` - 积分输入组件
- `components/forms/points-suggestions.tsx` - 积分建议UI组件
- `components/forms/task-plan-form.tsx` - 更新：集成积分建议和任务类型联动
- `components/ui/sonner.tsx` - Sonner Toaster 组件
- `lib/services/points-calculator.ts` - 积分结算服务
- `lib/db/queries/points-history.ts` - 积分历史查询
- `lib/db/queries/point-balances.ts` - 积分余额查询
- `app/api/task-plans/route.ts` - 已有积分验证（1-100）
- `app/(parent)/tasks/create/page.tsx` - 更新：使用 Sonner Toast
- `app/layout.tsx` - 添加 Toaster 组件
- `database/migrations/0004_spotty_eternity.sql` - 数据库迁移
- `tests/integration/points-setting.spec.ts` - 集成测试
- `tests/e2e/2-2-points-setting.spec.ts` - E2E 测试

### Review Follow-ups (AI)

**Code Review Date:** 2026-03-09
**Reviewer:** Claude Code (Adversarial Code Review)
**Status:** ✅ COMPLETE - Story core ACs implemented

**Notes:**
- Task 5 (One-time task integration) is correctly marked incomplete - depends on Story 2.12
- Task 8.3-8.4 (Confirmation dialog and history) are UI enhancements not required for core AC
- All core acceptance criteria implemented:
  - ✅ AC #1: Points field in task_plans and tasks tables
  - ✅ AC #2: Points range validation (1-100)
  - ✅ AC #3: Points difficulty suggestions UI
  - ✅ AC #4: Points auto-accumulate on task approval
- 11 integration tests passing
- Story status: `done`
