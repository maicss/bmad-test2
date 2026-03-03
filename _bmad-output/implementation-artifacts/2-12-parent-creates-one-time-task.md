# Story 2.12: Parent Creates One-Time Task

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长,
I want 临时创建一次性任务,
So that 我可以快速添加不在计划内的特殊任务。

## Acceptance Criteria

1. **Given** 我有临时需求想分配给孩子（如帮忙买酱油）
   **When** 我在任务页面点击"临时任务"按钮
   **Then** 系统显示一次性任务创建表单，包含：
     - 任务名称（必填，最多50字）
     - 积分值（可选，默认0分）
     - 截止日期和时间（可选）
     - 任务说明（可选，最多200字）
     - 适用儿童（必填，可多选）
     - 需家长审批开关（默认开启）

2. **Given** 我已填写完整的一次性任务表单
   **When** 我点击"创建"按钮
   **Then** 任务立即生成
   **And** 任务不关联任何计划模板（`task_plan_id = null`）
   **And** 任务单独显示在儿童任务列表中
   **And** 任务完成后自动消失，不重复生成

3. **Given** 我正在创建一次性任务
   **When** API响应
   **Then** 响应时间<500ms（NFR3: P95）

## Tasks / Subtasks

- [ ] Task 1: Create API endpoint for one-time task creation (AC: 1, 3)
  - [ ] Subtask 1.1: Create `app/api/tasks/one-time/route.ts` with POST handler
  - [ ] Subtask 1.2: Implement request validation using Zod or similar schema validation
  - [ ] Subtask 1.3: Return unified response format (success/error with error codes)
  - [ ] Subtask 1.4: Add Better-Auth session verification for parent role

- [ ] Task 2: Implement database query for one-time task creation (AC: 2)
  - [ ] Subtask 2.1: Create `lib/db/queries/tasks.ts` with `createOneTimeTask()` function
  - [ ] Subtask 2.2: Use Drizzle ORM to insert task without `task_plan_id` reference
  - [ ] Subtask 2.3: Set task status as 'pending' by default
  - [ ] Subtask 2.4: Support multiple assignees by creating separate task instances per child

- [ ] Task 3: Create frontend component for one-time task creation form (AC: 1)
  - [ ] Subtask 3.1: Create reusable form component using Shadcn UI Form components
  - [ ] Subtask 3.2: Implement form fields with proper validation (required/optional constraints)
  - [ ] Subtask 3.3: Add child selector with multi-select capability
  - [ ] Subtask 3.4: Add "需家长审批" toggle switch with default checked

- [ ] Task 4: Integrate form with API endpoint (AC: 1, 2, 3)
  - [ ] Subtask 4.1: Call API endpoint on form submission
  - [ ] Subtask 4.2: Display success/error messages using Shadcn Toast (no alert())
  - [ ] Subtask 4.3: Handle API errors with proper user-friendly messages
  - [ ] Subtask 4.4: Redirect to task list or refresh on successful creation

- [ ] Task 5: Write BDD-style tests (TECH_SPEC_BDD.md)
  - [ ] Subtask 5.1: Write integration test for API endpoint POST /api/tasks/one-time
  - [ ] Subtask 5.2: Test scenarios:
     - Valid request creates one-time task without plan_id
     - Multiple assignees create multiple task instances
     - Validation errors return proper error codes (VAL_3001, VAL_3002)
     - Unauthorized requests return AUTH_1004
  - [ ] Subtask 5.3: Write component test for form validation and submission

- [ ] Task 6: Update type definitions (AC: 2)
  - [ ] Subtask 6.1: Define DTO types in `types/task.ts` for request/response
  - [ ] Subtask 6.2: Export CreateOneTimeTaskRequest, CreateOneTimeTaskResponse types

## Dev Notes

### Relevant architecture patterns and constraints

- **Database Operations**: MUST use Drizzle ORM - NO native SQL allowed
- **Query Location**: All database queries MUST be in `lib/db/queries/tasks.ts` (per-table file structure)
- **Query Style**: Function-based queries (NOT Repository pattern)
- **Authentication**: Better-Auth 1.4.x with session verification for parent role
- **API Response**: Unified response format with error codes from `constants/error-codes.ts`
- **Error Handling**: Use Shadcn Dialog/Toast components - NO alert()
- **Type Safety**: TypeScript 5 strict mode - NO `any` type, NO @ts-ignore
- **BDD Development**: Given-When-Then format, write tests BEFORE implementation
- **File Length**: All files ≤ 800 lines (split into smaller components if needed)
- **Performance**: API response time < 500ms (P95) - optimize database queries

### Source tree components to touch

- `app/api/tasks/one-time/route.ts` - New API endpoint for creating one-time tasks
- `lib/db/queries/tasks.ts` - Create `createOneTimeTask()` function (or create file if not exists)
- `types/task.ts` - Define DTO types for one-time task creation
- `components/tasks/one-time-task-form.tsx` - New form component (may need to create components directory)
- `constants/error-codes.ts` - Error codes: VALIDATION_REQUIRED_FIELD (VAL_3001), AUTH_UNAUTHORIZED (AUTH_1004)
- `lib/auth/index.ts` - Better-Auth configuration for session verification

### Testing standards summary

- **BDD Format**: Given-When-Then format describing business scenarios (not technical details)
- **Test Location**:
  - Integration tests: `__tests__/integration/tasks/one-time-task-creation.test.ts`
  - Component tests: `__tests__/components/tasks/one-time-task-form.test.tsx`
- **Testing Framework**: Bun Test for unit/integration, Playwright for E2E
- **Coverage**: All critical paths must have tests before implementation
- **Test Scenarios**:
  1. Parent creates one-time task with single child
  2. Parent creates one-time task with multiple children
  3. Form validation (required fields, max lengths)
  4. Unauthorized access (non-parent role)
  5. API error handling (invalid data, database errors)

### Project Structure Notes

- **Unified Project Structure**: Following existing patterns from project
- **Database Queries**: `lib/db/queries/tasks.ts` - per-table file structure as per TECH_SPEC_DATABASE.md
- **Type Definitions**: `types/task.ts` - centralized type definitions
- **API Routes**: `app/api/tasks/one-time/route.ts` - Next.js App Router convention
- **Components**: `components/tasks/one-time-task-form.tsx` - reusable UI component
- **Conflicts**: No known conflicts - this is Epic 2 Story 12, building on task management foundation

### References

- Story Requirements: [_bmad-output/planning-artifacts/epics.md](../_bmad-output/planning-artifacts/epics.md) - Story 2.12
- Database Schema: [docs/TECH_SPEC_DATABASE.md](../../docs/TECH_SPEC_DATABASE.md) - tasks table structure
- API Design: [docs/TECH_SPEC_API.md](../../docs/TECH_SPEC_API.md) - Unified response format, error codes
- BDD Development: [docs/TECH_SPEC_BDD.md](../../docs/TECH_SPEC_BDD.md) - Given-When-Then format
- General Tech Spec: [docs/TECH_SPEC.md](../../docs/TECH_SPEC.md) - Technology stack, constraints
- AGENTS.md: [AGENTS.md](../../AGENTS.md) - Development guidelines, RED LIST (no native SQL, no any type)

### Database Schema Reference (from TECH_SPEC_DATABASE.md)

```typescript
// tasks table structure for one-time tasks
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  planId: text('plan_id')  // NULL for one-time tasks
    .references(() => taskPlans.id),  // Optional reference
  assigneeId: text('assignee_id')
    .notNull()
    .references(() => users.id),
  status: text('status', {
    enum: ['pending', 'completed', 'cancelled', 'expired']
  }).notNull().default('pending'),
  dueDate: integer('due_date', { mode: 'timestamp' }),  // Optional for one-time tasks
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  completedBy: text('completed_by').references(() => users.id),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  approvedBy: text('approved_by').references(() => users.id),
  actualPoints: integer('actual_points'),  // Points from task plan
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**Critical Implementation Notes**:
- One-time tasks MUST have `planId = NULL` (no reference to task_plans table)
- One-time tasks can have optional `dueDate` (user may not set deadline)
- Task points come from the request (not from plan - since there's no plan)
- If multiple children selected, create separate task instances per child

## Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

### Completion Notes List

### File List
