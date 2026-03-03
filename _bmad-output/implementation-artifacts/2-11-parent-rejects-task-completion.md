# Story 2.11: Parent Rejects Task Completion

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长,
I want 驳回任务完成标记,
so that 我可以拒绝不符合要求的任务完成并告知孩子原因。

## Acceptance Criteria

1. **Given** 孩子标记了任务完成，等待我审批
   **When** 我点击"驳回"按钮
   **Then** 系统显示驳回原因输入框（必填，最多200字）
   **And** 我可以选择预设原因或自定义输入：
     - 预设原因：
       - "任务没有完成"
       - "完成质量不达标"
       - "时间不符合要求"
       - "其他"（自定义输入）
   **And** 驳回确认后：
     - 任务状态变回"待完成"
     - 驳回原因显示在任务卡片上
     - 孩子收到通知："你的任务被驳回：{原因}"
   **And** 驳回操作记录到审计日志（NFR14）

2. **And** 驳回操作后，任务不发放积分且任务返回孩子"待完成"列表

3. **And** 驳回通知在3秒内推送到孩子设备（NFR4: 实时）

## Tasks / Subtasks

- [ ] Task 1: Create task rejection API endpoint (AC: 1, 2)
  - [ ] Subtask 1.1: Design API route for `POST /api/tasks/[id]/reject`
  - [ ] Subtask 1.2: Implement task status update logic (pending_approval -> pending)
  - [ ] Subtask 1.3: Validate rejection reason (required, max 200 chars)
  - [ ] Subtask 1.4: Store rejection reason in task record
  - [ ] Subtask 1.5: Add rejection audit logging
  - [ ] Subtask 1.6: Test rejection workflow with BDD tests

- [ ] Task 2: Build parent rejection UI (AC: 1)
  - [ ] Subtask 2.1: Create rejection dialog component with reason input
  - [ ] Subtask 2.2: Add preset rejection reasons (selectable)
  - [ ] Subtask 2.3: Add custom reason input field (max 200 chars)
  - [ ] Subtask 2.4: Implement validation for required reason
  - [ ] Subtask 2.5: Add optimistic UI updates
  - [ ] Subtask 2.6: Display rejection reason on task card after rejection

- [ ] Task 3: Implement rejection notification (AC: 1, 3)
  - [ ] Subtask 3.1: Create rejection notification service
  - [ ] Subtask 3.2: Send notification to child on rejection
  - [ ] Subtask 3.3: Polling implementation (2-3 second intervals)
  - [ ] Subtask 3.4: Test notification delivery timing

- [ ] Task 4: Add rejection audit log (AC: 1)
  - [ ] Subtask 4.1: Create audit log database schema (if not exists)
  - [ ] Subtask 4.2: Implement audit log query functions
  - [ ] Subtask 4.3: Add rejection audit logging to API
  - [ ] Subtask 4.4: Test audit log functionality

- [ ] Task 5: Integrate with existing approval system (AC: 2)
  - [ ] Subtask 5.1: Ensure rejection returns task to pending state
  - [ ] Subtask 5.2: Verify no points are awarded for rejected tasks
  - [ ] Subtask 5.3: Test child can re-attempt rejected task
  - [ ] Subtask 5.4: Verify rejection reason visible in child's task list

## Dev Notes

### Architecture & Technology Stack

**Technology Stack (MUST FOLLOW):**
- Runtime: Bun 1.3.x+ (NO Node.js compatibility layer)
- Framework: Next.js 16.1.6 + React 19.2.3
- Database: bun:sqlite + Drizzle ORM 0.45.1+ (NO raw SQL)
- Auth: Better-Auth 1.4.18+ with session management
- UI: Tailwind CSS 4 + Shadcn UI 3.7.0+
- Testing: Bun Test + Playwright (BDD style)
- Types: TypeScript 5 strict mode (NO `any` type)

**Critical RED LIST Rules:**
- ❌ **NO raw SQL** - Use Drizzle ORM query builder only
- ❌ **NO string concatenation** in SQL queries
- ❌ **NO database queries in components/routes** - All queries MUST be in `lib/db/queries/`
- ❌ **NO `any` type** - Use `unknown` + type guards
- ❌ **NO `@ts-ignore` / `@ts-expect-error`** - Fix type errors
- ❌ **NO Node.js tools** - Use Bun native APIs (Bun.file(), Bun.password.hash(), Bun.env)
- ❌ **NO `alert()`** - Use Shadcn Dialog/Toast
- ❌ **NO new dependencies** - Without explicit confirmation

### Database Schema & Query Layer

**Database Tables Involved:**
- `tasks` - Task instances with status field (pending/pending_approval/approved/rejected)
- `users` - Parent and child user records
- `notifications` - Notification records
- `audit_log` - Approval/rejection audit trail

**MUST USE:** `lib/db/queries/tasks.ts` for all task-related database operations

```typescript
// ✅ CORRECT - Use Drizzle ORM in lib/db/queries/tasks.ts
import { db } from '@/lib/db';
import { tasks, notifications, auditLog } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Task rejection query
export async function rejectTask(taskId: string, parentUserId: string, reason: string) {
  // Transaction to update task and create notification/audit record
  return db.transaction(async (tx) => {
    // Update task status and rejection reason
    const [task] = await tx.update(tasks)
      .set({
        status: 'pending',
        rejectionReason: reason,
        rejectedBy: parentUserId,
        rejectedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    // Create notification for child
    await tx.insert(notifications).values({
      userId: task.childId,
      type: 'task_rejected',
      title: '任务被驳回',
      content: `你的任务"${task.title}"被驳回：${reason}`,
      data: { taskId: task.id, reason },
      read: false,
    });

    // Create audit log entry
    await tx.insert(auditLog).values({
      action: 'task_rejected',
      userId: parentUserId,
      targetId: taskId,
      targetType: 'task',
      details: { reason },
      timestamp: new Date(),
    });

    return task;
  });
}

// ❌ FORBIDDEN - Raw SQL
await db.execute(`UPDATE tasks SET status = 'pending', rejection_reason = '${reason}' WHERE id = '${taskId}'`);
```

### Project Structure Notes

**File Structure:**
```
app/
  (parent)/
    approvals/
      [id]/
        page.tsx            # Task detail and approval/rejection UI
components/
  features/
    task-rejection-dialog.tsx  # Rejection dialog component
lib/
  db/
    queries/
      tasks.ts                  # Task queries (MANDATORY)
      notifications.ts           # Notification queries
      audit-log.ts              # Audit log queries
  services/
    notification-sender.ts       # Notification sending service
types/
  task.ts                          # Task type definitions
```

**Naming Conventions:**
- Files: kebab-case (e.g., task-rejection-dialog.tsx)
- Components: PascalCase (e.g., TaskRejectionDialog)
- Functions: camelCase (e.g., rejectTask)
- Constants: UPPER_SNAKE_CASE

### API Design

**Rejection Endpoint:**
```
POST /api/tasks/[id]/reject
Headers: Cookie (session)
Body: { reason: string } (required, max 200 chars, presetId?: string }
Response: { success: true, taskId, rejectionReason }
```

**Validation:**
- Reason must be non-empty string
- Reason must be ≤ 200 characters
- If presetId provided, use preset reason value
- Task must be in `pending_approval` status
- User must have parent role
- Parent must be in same family as task

### Testing Standards (BDD - Given-When-Then)

**MUST write BDD-style tests:**

```typescript
// ❌ FORBIDDEN - Technical test
it('should reject task', async () => {
  const res = await request(app).post('/api/tasks/123/reject').send({ reason: 'test' });
  expect(res.status).toBe(200);
});

// ✅ CORRECT - BDD style (Given-When-Then)
describe('Task Rejection', () => {
  it('given 家长已登录且有等待审批的任务, when 家长点击驳回并填写原因, then 任务状态变回待完成且孩子收到驳回通知', async () => {
    // Given: 家长已登录且有任务
    const parent = await createParent();
    const child = await createChild({ familyId: parent.familyId });
    const task = await createTask({ familyId: parent.familyId, childId: child.id, status: 'pending_approval' });

    // When: 家长驳回任务
    const res = await request(app)
      .post(`/api/tasks/${task.id}/reject`)
      .set('Cookie', parent.session)
      .send({ reason: '任务没有完成' });

    // Then: 驳回成功
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.rejectionReason).toBe('任务没有完成');

    const rejectedTask = await getTaskById(task.id);
    expect(rejectedTask.status).toBe('pending');
    expect(rejectedTask.rejectionReason).toBe('任务没有完成');

    // And: 孩子收到通知
    const notifications = await getNotifications(child.id);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('task_rejected');
    expect(notifications[0].content).toContain('任务没有完成');
  });

  it('given 家长已登录且有等待审批的任务, when 家长点击驳回但未填写原因, then 返回错误提示必须填写原因', async () => {
    // Given: 家长已登录且有任务
    const parent = await createParent();
    const task = await createTask({ familyId: parent.familyId, status: 'pending_approval' });

    // When: 家长驳回任务但未填写原因
    const res = await request(app)
      .post(`/api/tasks/${task.id}/reject`)
      .set('Cookie', parent.session)
      .send({});

    // Then: 驳回失败
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('reason');
  });

  it('given 家长已登录且有等待审批的任务, when 家长选择预设原因, then 使用预设原因进行驳回', async () => {
    // Given: 家长已登录且有任务
    const parent = await createParent();
    const task = await createTask({ familyId: parent.familyId, status: 'pending_approval' });

    // When: 家长选择预设原因
    const res = await request(app)
      .post(`/api/tasks/${task.id}/reject`)
      .set('Cookie', parent.session)
      .send({ reason: '任务没有完成' }); // Using preset value

    // Then: 驳回成功
    expect(res.status).toBe(200);
    expect(res.body.rejectionReason).toBe('任务没有完成');
  });
});
```

### Performance Requirements

- **API Response Time:** < 500ms (P95) - NFR3
- **Real-time Notification:** < 3 seconds - NFR4
- **Database Optimization:** Use indexes on tasks.status, tasks.familyId

### Security & Compliance

- **Authentication:** Only parents can reject tasks (RBAC)
- **Authorization:** Parents can only reject tasks in their family
- **Audit Logging:** Record all rejection actions (NFR14)
- **Data Integrity:** Transaction-based rejection (task status + notification + audit log)
- **Validation:** Reject reason must be ≤ 200 characters to prevent abuse

### Cross-Cutting Concerns

**Real-time Synchronization:**
- Use 2-3 second polling for task status updates
- PWA push notifications for rejection events
- Background Sync API for offline rejection queue

**Offline Support:**
- IndexedDB queue for pending rejections
- Conflict resolution: timestamp priority + user confirmation
- Network status indicator (green/orange/red)

**Child Privacy:**
- COPPA compliance (children < 13 years old)
- Rejection reason stored securely
- Parental consent for data collection

### Integration Points

**Depends on:**
- Epic 1: User Authentication & Family Management (completed)
- Story 2.9: Child Marks Task Complete (must be completed first)
- Story 2.10: Parent Approves Task Completion (for reference)

**Triggers:**
- Story 2.14: Real-time Approval/Rejection Notification
- Child task re-attempt workflow

**Data Flow:**
```
Child marks task complete → Status: pending_approval
↓
Parent receives notification → View approval page
↓
Parent rejects task → Update task status to pending
↓
Create rejection notification → Send to child
↓
Child sees rejection reason → Can re-attempt task
```

### Error Handling

**Error Scenarios:**
1. Task not in pending_approval status → Return 409 Conflict
2. Parent not authorized → Return 403 Forbidden
3. Task not found → Return 404 Not Found
4. Missing or invalid rejection reason → Return 400 Bad Request
5. Rejection reason exceeds 200 chars → Return 400 Bad Request
6. Database transaction failure → Return 500 Internal Server Error

**UI Error Handling:**
- Use Shadcn Dialog/Toast for errors
- Display user-friendly error messages
- Provide retry mechanisms for network failures

### Previous Story Intelligence

**From Story 2.10 (Parent Approves Task Completion):**
- Similar approval/rejection workflow pattern
- API structure mirrors approval endpoint design
- Same transaction-based approach for atomicity
- Audit logging pattern already established
- Real-time notification service exists for approval events

**Key Learnings:**
- Use transactions to ensure task status + points + notification consistency
- Audit logging is required for all approval/rejection actions (NFR14)
- Real-time notification timing is critical (< 3 seconds)
- Optimistic UI updates improve perceived performance
- Rejection workflow should mirror approval workflow for consistency

### Git Intelligence Summary

**Recent Epic 2 Work Patterns:**
- Stories 2.1-2.10 follow consistent API structure: `POST /api/tasks/[id]/{action}`
- All task operations use `lib/db/queries/tasks.ts` for database access
- Transaction-based updates ensure data consistency
- BDD testing pattern established with Given-When-Then format
- Shadcn UI components used for all dialogs and forms

**Code Patterns to Follow:**
1. All API routes in `app/api/tasks/[id]/` directory
2. Query functions in `lib/db/queries/tasks.ts`
3. Type definitions in `types/task.ts`
4. Reusable components in `components/features/`
5. Integration tests in `tests/integration/`

### Latest Technical Information

**Bun Runtime:**
- Version: 1.3.x+ (use latest stable)
- Key APIs: Bun.password.hash(), Bun.env, Bun.file()
- Test runner: Built-in `bun test` with expect() API

**Drizzle ORM:**
- Version: 0.45.1+ (use latest stable)
- Query builder: Use eq, and, desc operators
- Transactions: db.transaction(async (tx) => { ... })
- NO raw SQL or execute() calls

**Better-Auth:**
- Version: 1.4.18+ with phone plugin + PIN login
- Session management: 36-hour rolling refresh
- Role-based access control (RBAC)

### Project Context Reference

**Source Documents:**
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.11](epics.md) - Story requirements and AC
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-2](epics.md) - Epic 2 context and dependencies
- [Source: _bmad-output/planning-artifacts/prd.md#FR18](prd.md) - Functional requirement FR18: 家长驳回任务
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-1](architecture.md) - Real-time communication (polling strategy)
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-2](architecture.md) - Database architecture (SQLite)
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5](architecture.md) - Database query layer (functional exports)
- [Source: _bmad-output/project-context.md#Critical-Implementation-Rules](project-context.md) - RED LIST rules
- [Source: _bmad-output/project-context.md#Bun-Testing-Rules](project-context.md) - BDD testing standards
- [Source: docs/TECH_SPEC_DATABASE.md](TECH_SPEC_DATABASE.md) - Database schema and constraints
- [Source: docs/TECH_SPEC_API.md](TECH_SPEC_API.md) - API design patterns
- [Source: docs/TECH_SPEC_BDD.md](TECH_SPEC_BDD.md) - BDD development guidelines

**Database Schema:**
- [Source: database/schema/tasks.ts](schema/tasks.ts) - Tasks table definition
- [Source: database/schema/notifications.ts](schema/notifications.ts) - Notifications table
- [Source: database/schema/audit-log.ts](schema/audit-log.ts) - Audit log table

**API Documentation:**
- [Source: app/api/tasks/[id]/reject/route.ts](route.ts) - Rejection endpoint
- [Source: app/api/tasks/[id]/approve/route.ts](route.ts) - Approval endpoint (for reference)

**Testing:**
- [Source: tests/integration/task-rejection.spec.ts](task-rejection.spec.ts) - BDD integration tests
- [Source: tests/e2e/approval-rejection-flow.spec.ts](approval-rejection-flow.spec.ts) - Playwright E2E tests

## Dev Agent Record

### Agent Model Used

zai Coding (glm-4.7)

### Debug Log References

None - This is a fresh story file creation.

### Completion Notes List

1. Epic 2, Story 2.11 is being created following Story 2.10 (Parent Approves Task Completion)
2. This story implements FR18: 家长驳回任务
3. Rejection workflow mirrors approval workflow for consistency
4. Real-time notification timing requirement: < 3 seconds per NFR4
5. Audit logging is required per NFR14
6. All database queries MUST use Drizzle ORM in lib/db/queries/ directory
7. Rejection reasons must be ≤ 200 characters to prevent abuse
8. Rejection returns task to pending state, allowing child to re-attempt
9. No points are awarded for rejected tasks

### File List

**Files to Create:**
- `_bmad-output/implementation-artifacts/2-11-parent-rejects-task-completion.md` (this file)

**Files to Modify (During Implementation):**
- `app/api/tasks/[id]/reject/route.ts` - Create rejection API endpoint
- `lib/db/queries/tasks.ts` - Add rejection query function
- `lib/db/queries/notifications.ts` - Add notification query functions (if not exists)
- `lib/db/queries/audit-log.ts` - Add audit log query functions (if not exists)
- `components/features/task-rejection-dialog.tsx` - Create rejection dialog component
- `app/(parent)/approvals/[id]/page.tsx` - Add rejection dialog to task detail page
- `types/task.ts` - Add task-related type definitions
- `tests/integration/task-rejection.spec.ts` - Create BDD integration tests
- `tests/e2e/approval-rejection-flow.spec.ts` - Create E2E tests

**Existing Files to Reference:**
- `app/api/tasks/[id]/approve/route.ts` - Approval endpoint (for pattern reference)
- `database/schema/tasks.ts` - Task table schema
- `database/schema/notifications.ts` - Notifications table schema
- `database/schema/audit-log.ts` - Audit log table schema
- `lib/db/schema/index.ts` - Schema exports
- `lib/auth/guards.ts` - Auth guards (for parent authorization)
- `components/ui/dialog.tsx` - Shadcn Dialog component
- `components/ui/toast.tsx` - Shadcn Toast component
