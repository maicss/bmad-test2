# Story 2.10: Parent Approves Task Completion

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长,
I want 审批任务完成,
so that 我可以验证孩子是否真正完成了任务后再发放积分。

## Acceptance Criteria

1. **Given** 孩子标记了任务完成，等待我审批
   **When** 我收到审批通知并进入任务审批页面
   **Then** 系统显示任务详情，包含：
   - 任务名称和计划时间
   - 孩子姓名和完成时间
   - 完成证明（如有照片）
   - 积分值

2. **And** 我可以选择：
   - 通过：任务标记为"已完成"，积分累加到孩子账户
   - 驳回：填写驳回原因（必填），任务返回到孩子"待完成"列表

3. **And** 审批操作记录到审计日志（NFR14）

4. **And** 审批通过后，积分变动通知立即推送给孩子（NFR4: 实时）

## Tasks / Subtasks

- [ ] Task 1: Create task approval API endpoint (AC: 1, 2)
  - [ ] Subtask 1.1: Design API route for `POST /api/tasks/[id]/approve`
  - [ ] Subtask 1.2: Implement task status update logic (pending -> completed)
  - [ ] Subtask 1.3: Implement points calculation and accrual
  - [ ] Subtask 1.4: Add approval audit logging
  - [ ] Subtask 1.5: Test approval workflow with BDD tests

- [ ] Task 2: Create task rejection API endpoint (AC: 2, 3)
  - [ ] Subtask 2.1: Design API route for `POST /api/tasks/[id]/reject`
  - [ ] Subtask 2.2: Implement task status update logic (pending_approval -> pending)
  - [ ] Subtask 2.3: Validate rejection reason (required, max 200 chars)
  - [ ] Subtask 2.4: Add rejection audit logging
  - [ ] Subtask 2.5: Test rejection workflow with BDD tests

- [ ] Task 3: Build parent approval UI (AC: 1)
  - [ ] Subtask 3.1: Create approval page component at `app/(parent)/approvals/page.tsx`
  - [ ] Subtask 3.2: Display task details (name, time, child, proof, points)
  - [ ] Subtask 3.3: Add approve/reject action buttons
  - [ ] Subtask 3.4: Implement rejection reason input dialog
  - [ ] Subtask 3.5: Add optimistic UI updates

- [ ] Task 4: Implement real-time notifications (AC: 4)
  - [ ] Subtask 4.1: Create points change notification service
  - [ ] Subtask 4.2: Send notification to child on approval
  - [ ] Subtask 4.3: Polling implementation (2-3 second intervals)
  - [ ] Subtask 4.4: Test notification delivery timing

- [ ] Task 5: Add approval history and audit log (AC: 3)
  - [ ] Subtask 5.1: Create audit log database schema
  - [ ] Subtask 5.2: Implement audit log query functions
  - [ ] Subtask 5.3: Add audit log UI for parent
  - [ ] Subtask 5.4: Test audit log functionality

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
- `tasks` - Task instances with status field (pending/approved/rejected)
- `users` - Parent and child user records
- `points_history` - Points transaction history
- `notifications` - Notification records
- `audit_log` - Approval/rejection audit trail

**MUST USE:** `lib/db/queries/tasks.ts` for all task-related database operations

```typescript
// ✅ CORRECT - Use Drizzle ORM in lib/db/queries/tasks.ts
import { db } from '@/lib/db';
import { tasks, pointsHistory, notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Task approval query
export async function approveTask(taskId: string, parentUserId: string) {
  // Transaction to update task and create points record
  return db.transaction(async (tx) => {
    // Update task status
    const [task] = await tx.update(tasks)
      .set({ status: 'approved', approvedBy: parentUserId })
      .where(eq(tasks.id, taskId))
      .returning();

    // Create points record
    await tx.insert(pointsHistory).values({
      userId: task.childId,
      taskId: task.id,
      points: task.points,
      type: 'approval',
    });

    return task;
  });
}

// ❌ FORBIDDEN - Raw SQL
await db.execute(`UPDATE tasks SET status = 'approved' WHERE id = '${taskId}'`);
```

### Project Structure Notes

**File Structure:**
```
app/
  (parent)/
    approvals/
      page.tsx              # Approval list page
      [id]/
        page.tsx            # Task detail and approval UI
components/
  features/
    task-approval-card.tsx  # Reusable approval card
lib/
  db/
    queries/
      tasks.ts             # Task queries (MANDATORY)
      notifications.ts     # Notification queries
      audit-log.ts         # Audit log queries
  services/
    notification-sender.ts # Notification sending service
types/
  task.ts                  # Task type definitions
```

**Naming Conventions:**
- Files: kebab-case (e.g., task-approval-card.tsx)
- Components: PascalCase (e.g., TaskApprovalCard)
- Functions: camelCase (e.g., approveTask)
- Constants: UPPER_SNAKE_CASE

### API Design

**Approval Endpoint:**
```
POST /api/tasks/[id]/approve
Headers: Cookie (session)
Body: {} (empty)
Response: { success: true, taskId, pointsAdded }
```

**Rejection Endpoint:**
```
POST /api/tasks/[id]/reject
Headers: Cookie (session)
Body: { reason: string } (required, max 200 chars)
Response: { success: true, taskId }
```

**Get Pending Tasks:**
```
GET /api/tasks/pending
Headers: Cookie (session)
Response: { tasks: [...] }
```

### Testing Standards (BDD - Given-When-Then)

**MUST write BDD-style tests:**

```typescript
// ❌ FORBIDDEN - Technical test
it('should approve task', async () => {
  const res = await request(app).post('/api/tasks/123/approve');
  expect(res.status).toBe(200);
});

// ✅ CORRECT - BDD style (Given-When-Then)
describe('Task Approval', () => {
  it('given 家长已登录且有等待审批的任务, when 家长点击通过, then 任务状态变更为已完成且积分累加到孩子账户', async () => {
    // Given: 家长已登录且有任务
    const parent = await createParent();
    const child = await createChild({ familyId: parent.familyId });
    const task = await createTask({ familyId: parent.familyId, childId: child.id, status: 'pending' });

    // When: 家长审批通过
    const res = await request(app)
      .post(`/api/tasks/${task.id}/approve`)
      .set('Cookie', parent.session);

    // Then: 任务已批准，积分已累加
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pointsAdded).toBe(task.points);

    const approvedTask = await getTaskById(task.id);
    expect(approvedTask.status).toBe('approved');

    const balance = await getPointsBalance(child.id);
    expect(balance).toBe(task.points);
  });

  it('given 家长已登录且有等待审批的任务, when 家长点击驳回, then 必须填写驳回原因且任务返回待完成状态', async () => {
    // Given: 家长已登录且有任务
    const parent = await createParent();
    const task = await createTask({ familyId: parent.familyId, status: 'pending' });

    // When: 家长驳回任务但未填写原因
    const res = await request(app)
      .post(`/api/tasks/${task.id}/reject`)
      .set('Cookie', parent.session)
      .send({});

    // Then: 驳回失败，提示填写原因
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('reason');

    // When: 填写驳回原因后再次驳回
    const res2 = await request(app)
      .post(`/api/tasks/${task.id}/reject`)
      .set('Cookie', parent.session)
      .send({ reason: '任务没有完成' });

    // Then: 驳回成功，任务状态仍为pending
    expect(res2.status).toBe(200);
    const rejectedTask = await getTaskById(task.id);
    expect(rejectedTask.status).toBe('pending');
    expect(rejectedTask.rejectionReason).toBe('任务没有完成');
  });
});
```

### Performance Requirements

- **API Response Time:** < 500ms (P95) - NFR3
- **Real-time Notification:** < 3 seconds - NFR4
- **Database Optimization:** Use indexes on tasks.status, tasks.familyId

### Security & Compliance

- **Authentication:** Only parents can approve tasks (RBAC)
- **Authorization:** Parents can only approve tasks in their family
- **Audit Logging:** Record all approval/rejection actions (NFR14)
- **Data Integrity:** Transaction-based approval (task status + points)
- **Privacy:** Child's completion proof (photos) only visible to parents

### Cross-Cutting Concerns

**Real-time Synchronization:**
- Use 2-3 second polling for task status updates
- PWA push notifications for approval events
- Background Sync API for offline approval queue

**Offline Support:**
- IndexedDB queue for pending approvals
- Conflict resolution: timestamp priority + user confirmation
- Network status indicator (green/orange/red)

**Child Privacy:**
- COPPA compliance (children < 13 years old)
- Task completion proof (photos) stored securely
- Parental consent for data collection

### Integration Points

**Depends on:**
- Epic 1: User Authentication & Family Management (completed)
- Story 2.9: Child Marks Task Complete (must be completed first)

**Triggers:**
- Epic 3: Points calculation (on approval)
- Story 2.14: Real-time Approval Notification

**Data Flow:**
```
Child marks task complete → Status: pending_approval
↓
Parent receives notification → View approval page
↓
Parent approves/rejects → Update task status
↓
If approved → Calculate points → Update balance → Send notification
↓
If rejected → Update rejection reason → Notify child
```

### Error Handling

**Error Scenarios:**
1. Task already approved/rejected → Return 409 Conflict
2. Parent not authorized → Return 403 Forbidden
3. Task not found → Return 404 Not Found
4. Invalid rejection reason → Return 400 Bad Request
5. Database transaction failure → Return 500 Internal Server Error

**UI Error Handling:**
- Use Shadcn Dialog/Toast for errors
- Display user-friendly error messages
- Provide retry mechanisms for network failures

### References

**Source Documents:**
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.10](epics.md) - Story requirements and AC
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-2](epics.md) - Epic 2 context and dependencies
- [Source: _bmad-output/planning-artifacts/prd.md#FR17](prd.md) - Functional requirement FR17: 家长审批任务
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
- [Source: database/schema/points-history.ts](schema/points-history.ts) - Points history table
- [Source: database/schema/notifications.ts](schema/notifications.ts) - Notifications table
- [Source: database/schema/audit-log.ts](schema/audit-log.ts) - Audit log table

**API Documentation:**
- [Source: app/api/tasks/[id]/approve/route.ts](route.ts) - Approval endpoint
- [Source: app/api/tasks/[id]/reject/route.ts](route.ts) - Rejection endpoint
- [Source: app/api/tasks/pending/route.ts](route.ts) - Pending tasks endpoint

**Testing:**
- [Source: tests/integration/task-approval.spec.ts](task-approval.spec.ts) - BDD integration tests
- [Source: tests/e2e/approval-flow.spec.ts](approval-flow.spec.ts) - Playwright E2E tests

## Dev Agent Record

### Agent Model Used

Zai Coding (glm-4.7)

### Debug Log References

None - This is a fresh story file creation.

### Completion Notes List

1. Epic 2, Story 2.10 is the first story being created in the implementation artifacts
2. Previous stories (2.1-2.9) are marked as "ready-for-dev" but have no story files yet
3. This story depends on Story 2.9 (Child Marks Task Complete) being completed first
4. Real-time notification timing requirement: < 3 seconds per NFR4
5. Points calculation must use transaction to ensure atomicity
6. Audit logging is required per NFR14
7. All database queries MUST use Drizzle ORM in lib/db/queries/ directory

### File List

**Files to Create:**
- `_bmad-output/implementation-artifacts/2-10-parent-approves-task-completion.md` (this file)

**Files to Modify (During Implementation):**
- `app/(parent)/approvals/page.tsx` - Create approval page
- `app/(parent)/approvals/[id]/page.tsx` - Create task detail approval UI
- `app/api/tasks/[id]/approve/route.ts` - Create approval API endpoint
- `app/api/tasks/[id]/reject/route.ts` - Create rejection API endpoint
- `app/api/tasks/pending/route.ts` - Create pending tasks endpoint
- `lib/db/queries/tasks.ts` - Add approval/rejection query functions
- `lib/db/queries/notifications.ts` - Add notification query functions
- `lib/db/queries/audit-log.ts` - Add audit log query functions
- `components/features/task-approval-card.tsx` - Create reusable approval card
- `lib/services/notification-sender.ts` - Create notification sending service
- `database/schema/audit-log.ts` - Create audit log schema
- `types/task.ts` - Add task-related type definitions
- `tests/integration/task-approval.spec.ts` - Create BDD integration tests
- `tests/e2e/approval-flow.spec.ts` - Create E2E tests

**Existing Files to Reference:**
- `database/schema/tasks.ts` - Task table schema
- `database/schema/points-history.ts` - Points history table schema
- `database/schema/notifications.ts` - Notifications table schema
- `lib/db/schema/index.ts` - Schema exports
- `lib/auth/guards.ts` - Auth guards (for parent authorization)
- `components/ui/dialog.tsx` - Shadcn Dialog component
- `components/ui/toast.tsx` - Shadcn Toast component
