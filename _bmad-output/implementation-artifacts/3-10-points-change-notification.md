# Story 3.10: Points Change Notification

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 在积分变动时推送通知,
So that 儿童和家长能及时知道积分变化情况。

## Acceptance Criteria

1. Given 发生积分变动（任务审批、手动调整、愿望兑换）
   When 积分变动事务完成
   Then 系统推送通知到相关用户设备
   And 通知内容包含：变动类型、变动积分值、当前余额
   And 通知在3秒内送达（NFR4: 实时<3秒）
   And 通知存储在`notifications`表中，类型为"points_change"

## Tasks / Subtasks

- [ ] Task 1: Design notification data structure for points changes (AC: 1)
  - [ ] Subtask 1.1: Define notification schema in database/schema/notifications.ts
  - [ ] Subtask 1.2: Create notification type enum for "points_change"
  - [ ] Subtask 1.3: Add fields for change type, points value, current balance
- [ ] Task 2: Implement notification trigger on points settlement (AC: 1)
  - [ ] Subtask 2.1: Modify points-calculator.ts service to emit notifications
  - [ ] Subtask 2.2: Integrate with task approval workflow (Story 3.1)
  - [ ] Subtask 2.3: Integrate with manual adjustment workflow (Story 3.5)
  - [ ] Subtask 2.4: Integrate with wish redemption workflow (Epic 4)
- [ ] Task 3: Implement push notification delivery (AC: 1)
  - [ ] Subtask 3.1: Create notification-sender.ts service
  - [ ] Subtask 3.2: Implement PWA push notification
  - [ ] Subtask 3.3: Ensure delivery within 3 seconds (NFR4)
- [ ] Task 4: Create notification database queries (AC: 1)
  - [ ] Subtask 4.1: Create lib/db/queries/notifications.ts
  - [ ] Subtask 4.2: Implement insertNotification function
  - [ ] Subtask 4.3: Implement getUserNotifications function
- [ ] Task 5: Implement notification UI components (AC: 1)
  - [ ] Subtask 5.1: Create notification-list.tsx component
  - [ ] Subtask 5.2: Add notification toast component
  - [ ] Subtask 5.3: Integrate with parent and child dashboards
- [ ] Task 6: Write BDD tests for notification flow (AC: 1)
  - [ ] Subtask 6.1: Test points change triggers notification
  - [ ] Subtask 6.2: Test notification delivery timing (<3s)
  - [ ] Subtask 6.3: Test notification content accuracy

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Technical Stack:**
- Bun 1.3.x+ runtime (NO Node.js compatibility layer)
- Next.js 16.x + React 19.x
- bun:sqlite + Drizzle ORM 0.45.x+ (NO native SQL)
- Better-Auth 1.4.x
- Zustand for state management

**Architecture Decisions:**
- ADR-1: Real-time communication via polling (2-3s) → SSE upgrade path
- ADR-3: Better-Auth with phone plugin + PIN login
- ADR-5: Function-based queries in lib/db/queries/ (NOT Repository pattern)

**Critical RED LIST Rules:**
- ❌ PROHIBITED: Native SQL, `any` type, Node.js tools, process.env
- ✅ REQUIRED: Drizzle ORM, TypeScript strict mode, Bun native tools
- ✅ REQUIRED: BDD development (Given-When-Then), tests BEFORE implementation
- ✅ REQUIRED: Database queries in lib/db/queries/ per table (notifications.ts)

### Source Tree Components to Touch

**Database Schema:**
- `database/schema/notifications.ts` - Add notification table definition
- `database/schema/index.ts` - Export notifications schema

**Database Queries (NEW - lib/db/queries/notifications.ts):**
- `createNotification()` - Insert notification record
- `getUserNotifications(userId, limit?)` - Fetch user notifications
- `markNotificationRead(notificationId)` - Update read status

**Services:**
- `lib/services/points-calculator.ts` - MODIFY: Add notification trigger
- `lib/services/notification-sender.ts` - NEW: Push notification service

**Components:**
- `components/features/notification-list.tsx` - NEW: Notification list UI
- `components/ui/toast.tsx` - USE: Shadcn toast for notifications

**API Routes:**
- `app/api/notifications/route.ts` - NEW: Notification endpoints

**Store:**
- `lib/store/notification-store.ts` - NEW: Zustand store for notifications

### Testing Standards Summary

**BDD Development Required:**
- Format: Given-When-Then
- Tests must be written BEFORE implementation
- Use business language, not technical terminology

**Example BDD Test:**
```typescript
it('given points are adjusted when task is approved then notification is sent within 3 seconds', async () => {
  // Given: Child has a pending task approval
  const task = await createTask();
  const child = await getChildUser();

  // When: Parent approves the task (points settlement)
  const startTime = Date.now();
  await approveTask(task.id);
  await waitForNotifications();

  // Then: Notification is sent with correct content
  const notifications = await getUserNotifications(child.id);
  expect(notifications).toHaveLength(1);
  expect(notifications[0].type).toBe('points_change');
  expect(notifications[0].pointsChange).toBe(task.points);
  expect(notifications[0].currentBalance).toBeGreaterThan(0);
  expect(Date.now() - startTime).toBeLessThan(3000); // < 3 seconds
});
```

**Test Coverage:**
- Unit tests: lib/services/points-calculator.ts, notification-sender.ts
- Integration tests: API routes, database queries
- E2E tests: Complete points change → notification flow

## Project Structure Notes

### Alignment with Unified Project Structure

**Following established patterns:**
- Notifications module follows Epic 3 pattern (like points-history, points-trend)
- Database queries in lib/db/queries/notifications.ts (per ADR-5)
- Service layer in lib/services/notification-sender.ts
- UI components in components/features/notification-list.tsx

**Consistent with similar modules:**
- Pattern follows Story 2.13 (task_reminder) and Story 2.14 (task_approval_pending)
- Uses same notification table structure for all notification types
- Reuses notification-sender.ts service for all notification delivery

**Reuses Notification Infrastructure from Epic 2:**
- **Story 2.13 (Task Reminder Push Notification)** provides:
  - `notifications` table schema (with `type` field for different notification types)
  - `lib/notifications/push.ts` - Push notification sending service
  - `public/sw/push-handler.js` - Service Worker for PWA push
  - VAPID keys configuration
- **Story 2.14 (Real-Time Approval Notification)** provides:
  - Real-time notification trigger infrastructure
  - `lib/services/notification-sender.ts` - Notification sender service
  - In-app notification polling mechanism (2-3 second intervals)
  - Offline queue for delayed delivery

**This story (3.10) extends**:
- Adds new notification type: `points_change`
- Triggers notification on points settlement (task approval, manual adjustment, wish redemption)
- Reuses Epic 2's notification infrastructure (no new infrastructure needed)

### Detected Conflicts or Variances

None - Story aligns with established architecture patterns.

## References

- **Source: _bmad-output/planning-artifacts/epics.md#Epic3-Story3.10** - Story requirements and acceptance criteria
- **Source: _bmad-output/planning-artifacts/epics.md#Epic3** - Epic context and integration notes
- **Source: _bmad-output/planning-artifacts/epics.md#FR20-28** - Functional requirements for points system
- **Source: _bmad-output/planning-artifacts/architecture.md#ADR-1** - Real-time communication decision
- **Source: _bmad-output/planning-artifacts/architecture.md#ADR-5** - Database query layer architecture
- **Source: docs/TECH_SPEC_DATABASE.md** - Database schema specifications
- **Source: docs/TECH_SPEC_PWA.md** - PWA and push notification requirements

## Dev Agent Record

### Agent Model Used

glm-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None - This is a new story file.

### Completion Notes List

Story context file created with comprehensive developer guidance including:
- Complete user story and acceptance criteria
- Task breakdown with subtasks
- Architecture alignment and constraints
- RED LIST rules compliance
- BDD testing standards
- File structure and integration points

### File List

**Story File:**
- `_bmad-output/implementation-artifacts/3-10-points-change-notification.md`

**Related Planning Artifacts:**
- `_bmad-output/planning-artifacts/epics.md` (Story 3.10 definition)
- `_bmad-output/planning-artifacts/prd.md` (FR20-28, NFR4)
- `_bmad-output/planning-artifacts/architecture.md` (ADR-1, ADR-5)

**Related Story Files (Epic 3):**
- Story 3.1: System Calculates Points on Task Approval (ready-for-dev)
- Story 3.5: Parent Temporary Points Adjustment (ready-for-dev)
