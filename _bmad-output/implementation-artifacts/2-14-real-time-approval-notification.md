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

**Offline Queue Architecture:**
```typescript
// Offline queue configuration
export const OFFLINE_QUEUE_CONFIG = {
  MAX_CAPACITY: 100, // Maximum notifications in queue
  RETENTION_DAYS: 7, // Queue retention period (7 days)
  DEDUP_WINDOW_MS: 5000, // Deduplication window (5 seconds)
  MAX_RETRY_ATTEMPTS: 3, // Retry attempts for failed sends
  RETRY_DELAY_MS: [1000, 5000, 15000], // Exponential backoff
} as const;

// Queue capacity limit
- When queue reaches MAX_CAPACITY (100 notifications):
  - Remove oldest notification (FIFO)
  - Log warning: "Offline queue at capacity, removing oldest notification"
  - Preserve high-priority notifications (task_approval_pending)

// Queue retention period
- Notifications older than 7 days are automatically removed:
  - Cleanup job runs daily at 02:00 UTC
  - Deletes notifications where `createdAt < NOW() - 7 days`
  - Log removed notifications for audit trail

// Deduplication logic
- Prevent duplicate notifications within 5 seconds:
  - Key: `{userId} + {type} + {taskId}`
  - Check queue for existing notification with same key
  - If duplicate found, skip new notification
  - Example: If child marks same task complete twice in 3 seconds, only send one notification

// Notification delivery status
- Each notification has delivery status:
  - 'queued' - Waiting for device online
  - 'delivered' - Successfully sent
  - 'failed' - Failed after MAX_RETRY_ATTEMPTS
- Failed notifications are logged for admin review
```

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

### Testing Requirements

**BDD Format (GIVEN-WHEN-THEN):**
```typescript
// tests/integration/real-time-approval-notification.spec.ts

it('given 孩子标记任务完成，when 状态变为待审批，then 3秒内推送通知给家长', async () => {
  // Given: 孩子标记任务完成
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child = await createChild({ familyId: family.id });
  const task = await createTask({
    childId: child.id,
    status: 'pending'
  });

  // Mock家长设备推送订阅
  const parentSubscription = await createPushSubscription(parent.id);

  // When: 孩子标记任务完成
  const startTime = Date.now();
  await completeTask(task.id, child.id);

  // Then: 3秒内家长收到推送通知
  await waitFor(() => {
    const notifications = await getPushNotifications(parentSubscription.endpoint);
    expect(notifications.length).toBeGreaterThan(0);
  }, 3000); // 3秒SLA

  const elapsedTime = Date.now() - startTime;
  expect(elapsedTime).toBeLessThan(3000); // 确保在3秒内

  // And: 通知内容正确
  const notification = notifications[0];
  expect(notification.title).toBe('任务待审批');
  expect(notification.body).toContain(child.name);
  expect(notification.body).toContain(task.title);
});

it('given 家长设备离线，when 孩子标记任务完成，then 通知存储在服务器，上线后同步', async () => {
  // Given: 家长设备离线
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child = await createChild({ familyId: family.id });
  const task = await createTask({ childId: child.id, status: 'pending' });
  const offlineSubscription = await createPushSubscription(parent.id, offline: true);

  // When: 孩子标记任务完成
  await completeTask(task.id, child.id);

  // Then: 通知存储在服务器（队列中）
  const queuedNotifications = await getQueuedNotifications(parent.id);
  expect(queuedNotifications).toHaveLength(1);
  expect(queuedNotifications[0].delivered).toBe(false);

  // And: 离线设备不收到通知
  const offlineNotifications = await getPushNotifications(offlineSubscription.endpoint);
  expect(offlineNotifications).toHaveLength(0);

  // When: 家长设备重新上线
  await simulateOnline(parent.id);
  await syncOfflineQueue();

  // Then: 通知推送到设备
  const onlineNotifications = await getPushNotifications(offlineSubscription.endpoint);
  expect(onlineNotifications).toHaveLength(1);
  expect(onlineNotifications[0].delivered).toBe(true);
});

it('given 家长收到审批通知，when 点击通知，then 导航到审批页面', async () => {
  // Given: 家长收到审批通知
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child = await createChild({ familyId: family.id });
  const task = await createTask({ childId: child.id, status: 'pending_approval' });

  const notification = await sendApprovalNotification({
    taskId: task.id,
    childId: child.id,
    parentId: parent.id
  });

  // When: 家长点击通知
  await simulateNotificationClick(notification, parent.id);

  // Then: 导航到审批页面
  expect(currentPath(parent.id)).toBe(`/approvals/${task.id}`);
  expect(taskApprovalVisible()).toBe(true);
});

it('given 站内消息通知，when 孩子标记任务完成，then 2-3秒内站内消息更新', async () => {
  // Given: 家长已登录应用
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child = await createChild({ familyId: family.id });
  const task = await createTask({ childId: child.id, status: 'pending' });
  await login(parent);

  // When: 孩子标记任务完成
  const startTime = Date.now();
  await completeTask(task.id, child.id);

  // Then: 2-3秒内站内消息更新
  await waitFor(() => {
    const notifications = await getInAppNotifications(parent.id);
    expect(notifications).toHaveLength(1);
  }, 3000); // 2-3秒轮询

  const elapsedTime = Date.now() - startTime;
  expect(elapsedTime).toBeLessThan(3000);

  // And: 未读计数增加
  const unreadCount = await getUnreadNotificationCount(parent.id);
  expect(unreadCount).toBe(1);
});
```

**Test Coverage:**
- Real-time notification delivery (3-second SLA with timing assertions)
- PWA push notification sending and handling
- In-app notification polling (2-3 second intervals)
- Offline queue and sync behavior
- Notification click navigation to approval page
- Notification deduplication (same event multiple triggers)
- Notification delivery status tracking
- Service Worker push handler extension
- Notification payload builder
- Parent device subscription lookup
- Task status change event listener
```

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
