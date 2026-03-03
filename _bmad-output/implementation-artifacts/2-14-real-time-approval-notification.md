# Story 2.14: Real-Time Approval Notification

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 在孩子标记任务完成后实时推送通知给家长,
so that 家长可以尽快审批任务，孩子也能快速获得积分反馈。

## Acceptance Criteria

**Given** 孩子标记任务完成且需要家长审批
**When** 任务状态变为"待审批"
**Then** 系统在3秒内推送通知到家长设备，包含：
  - 通知标题："任务待审批"
  - 通知内容："{孩子姓名}完成了「{任务名称}」，请审批"
  - 点击通知跳转到审批页面
**And** 通知支持以下推送渠道：
  - PWA推送（需要Service Worker）
  - 站内消息通知
**And** 如果家长设备离线，通知存储在服务器，待家长上线后同步
**And** 通知存储在`notifications`表中，类型为"task_approval_pending"

## Tasks / Subtasks

- [ ] Task 1: Extend notification infrastructure for real-time events (AC: #1, #2, #3)
  - [ ] Subtask 1.1: Review and reuse web-push infrastructure from Story 2.13
  - [ ] Subtask 1.2: Implement real-time notification trigger on task status change
  - [ ] Subtask 1.3: Add notification payload builder for approval events
  - [ ] Subtask 1.4: Implement parent device subscription lookup
- [ ] Task 2: Implement task completion event listener (AC: #1)
  - [ ] Subtask 2.1: Add trigger when task status changes to "pending_approval"
  - [ ] Subtask 2.2: Query task details (child name, task name, points)
  - [ ] Subtask 2.3: Lookup parent devices from family relationships
  - [ ] Subtask 2.4: Filter out offline devices for queueing
- [ ] Task 3: Build real-time notification sending service (AC: #1, #2, #3, #5)
  - [ ] Subtask 3.1: Create notification sender function with 3-second SLA
  - [ ] Subtask 3.2: Implement retry logic for failed push attempts
  - [ ] Subtask 3.3: Add notification queue for offline devices
  - [ ] Subtask 3.4: Store notification in database before sending
- [ ] Task 4: Implement offline queue and sync logic (AC: #4)
  - [ ] Subtask 4.1: Add notification sync endpoint for parent devices
  - [ ] Subtask 4.2: Implement pending notification delivery on device reconnect
  - [ ] Subtask 4.3: Add notification deduplication logic
  - [ ] Subtask 4.4: Track notification delivery status
- [ ] Task 5: Update Service Worker for approval notifications (AC: #3)
  - [ ] Subtask 5.1: Extend push-handler.js to handle approval notification type
  - [ ] Subtask 5.2: Implement click action to navigate to approval page
  - [ ] Subtask 5.3: Add notification icon and badge
  - [ ] Subtask 5.4: Test notification display on different devices
- [ ] Task 6: Add in-app notification support (AC: #2)
  - [ ] Subtask 6.1: Create notification center component
  - [ ] Subtask 6.2: Implement real-time notification polling (2-3 seconds)
  - [ ] Subtask 6.3: Add notification unread count indicator
  - [ ] Subtask 6.4: Handle notification read status
- [ ] Task 7: Implement notification database schema and queries (AC: #5)
  - [ ] Subtask 7.1: Create notifications table with task_approval_pending type
  - [ ] Subtask 7.2: Implement notification CRUD operations using Drizzle
  - [ ] Subtask 7.3: Add notification filtering by type and read status
  - [ ] Subtask 7.4: Implement notification deletion/archival logic
- [ ] Task 8: Testing and validation (All ACs)
  - [ ] Subtask 8.1: Write BDD tests for real-time notification flow
  - [ ] Subtask 8.2: Test 3-second delivery SLA with timing assertions
  - [ ] Subtask 8.3: Verify offline queue and sync behavior
  - [ ] Subtask 8.4: Test notification click navigation to approval page

## Dev Notes

### Technical Requirements

**Real-Time Notification Architecture:**
- Leverage web-push infrastructure from Story 2.13 (VAPID keys, Service Worker)
- Event-driven architecture: task status change → notification trigger → push send
- 3-second SLA for notification delivery (NFR4: Real-time < 3s)
- Support multiple delivery channels: PWA push + in-app notifications
- Offline-first: queue notifications for offline devices, sync on reconnect

**Integration Points:**
- Trigger location: Task completion API endpoint (Story 2.9)
- Parent device lookup: Family relationships via `families` table
- Notification storage: `notifications` table with `task_approval_pending` type
- Click navigation: `/parent/approvals` route (Story 2.10)

**Technology Stack:**
- Bun 1.3.x+ runtime (NO Node.js compatibility layer)
- Reuse web-push package from Story 2.13
- Service Worker for PWA push (extend existing `public/sw/push-handler.js`)
- Next.js API Routes for notification sync
- Drizzle ORM for database operations
- Polling for in-app notifications (2-3 second interval)

**Database Schema:**
```typescript
// Reuse from Story 2.13:
// database/schema/notifications.ts
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // 'task_approval_pending', 'task_reminder', etc.
  title: text('title').notNull(),
  body: text('body').notNull(),
  data: text('data'), // JSON string: { taskId, childName, taskName, points }
  read: integer('read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Reference to existing tables:
// database/schema/tasks.ts - task status field
// database/schema/users.ts - user relationships
// database/schema/families.ts - parent-child relationships
```

**File Structure:**
- Extend Service Worker: `public/sw/push-handler.js` (add approval notification handler)
- Notification Service: `lib/notifications/push.ts` (add real-time trigger function)
- Notification Queries: `lib/db/queries/notifications.ts` (reusable from Story 2.13)
- Task Status Listener: `lib/services/task-events.ts` (new file for event handling)
- API Routes: `app/api/notifications/**` (add sync endpoint)
- In-app Notification Hook: `lib/hooks/use-notifications.ts` (new file)

**Architecture Patterns to Follow:**
- Drizzle ORM for all database operations (NO native SQL)
- Function-based queries in `lib/db/queries/` directory
- BDD testing: Given-When-Then format, tests BEFORE implementation
- File length limit: All files ≤ 800 lines
- TypeScript strict mode (NO `any` type, NO @ts-ignore)
- Event-driven architecture for real-time notifications

### Project Structure Notes

**Alignment with unified project structure:**
- Reuse PWA infrastructure from Story 2.13 (`public/sw/push-handler.js`)
- Extend notification service in `lib/notifications/` (cross-cutting concern)
- Database queries follow per-table file pattern: `lib/db/queries/notifications.ts`
- New event service: `lib/services/task-events.ts` (real-time event handling)
- API routes use Next.js App Router: `app/api/notifications/sync/route.ts`
- In-app notification hook: `lib/hooks/use-notifications.ts` (React hook pattern)

**Detected conflicts or variances:**
- None. Story builds upon Story 2.13 infrastructure.
- Real-time polling (2-3 seconds) aligns with ADR-1 (polling → SSE upgrade path)

### Previous Story Intelligence

**From Story 2.13: Task Reminder Push Notification:**
- ✅ Web Push infrastructure already implemented (VAPID keys, Service Worker)
- ✅ `web-push` package installed and configured
- ✅ Push subscription management API exists
- ✅ Notification database schema created (`notifications` table)
- ✅ Service Worker push handler implemented in `public/sw/push-handler.js`

**Learnings to Apply:**
- Reuse VAPID keys and configuration from Story 2.13
- Extend existing notification schema with new `task_approval_pending` type
- Follow same permission request flow for parent devices
- Use same notification payload builder pattern
- Apply Service Worker lifecycle best practices learned

**Files Created/Modified in Story 2.13:**
- `public/sw/push-handler.js` - Service Worker for push handling
- `lib/notifications/push.ts` - Push notification service
- `lib/db/queries/notifications.ts` - Notification queries
- `app/api/notifications/subscribe/route.ts` - Subscription API

**Testing Approaches:**
- BDD tests for notification flow (Given-When-Then format)
- Cross-browser compatibility testing (Chrome, Firefox, iOS Safari)
- Permission flow testing with different user states

### References

**Epic 2 Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-2] - Task Planning & Management
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.10] - Parent Approves Task Completion
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.11] - Parent Rejects Task Completion
- FR56: 审批通知推送（3秒内实时推送给家长）

**Architecture Documentation:**
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-1] - Real-time communication (polling → SSE)
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-4] - Offline queue architecture
- [Source: docs/TECH_SPEC_PWA.md] - PWA push notification best practices

**UX Design Specification:**
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Parent-Feedback] - Real-time feedback requirements
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Notification-Design] - Notification center design
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility] - Notification accessibility requirements

**Technical Specifications:**
- [Source: docs/TECH_SPEC_API.md] - API endpoint patterns
- [Source: docs/TECH_SPEC_DATABASE.md] - Database query patterns
- [Source: docs/TECH_SPEC_LOGGING.md] - Notification logging requirements
- [Source: docs/TECH_SPEC_PERFORMANCE.md] - 3-second delivery SLA (NFR4)

### Dev Agent Record

### Agent Model Used

glm-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

### Completion Notes List

### File List
