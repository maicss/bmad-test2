# Story 2.13: Task Reminder Push Notification

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 在任务提醒时间推送通知,
so that 孩子不会忘记完成每日任务。

## Acceptance Criteria

**Given** 任务模板设置了提醒时间
**When** 系统时钟到达提醒时间
**Then** 系统推送通知到孩子的设备，包含：
  - 通知标题："时间到！"
  - 通知内容："{任务名称} - {积分值}分等你来拿"
  - 点击通知跳转到任务详情页
**And** 提醒时间默认设置为：
  - 早上8:00（起床任务）
  - 下午5:00（放学后任务）
  - 晚上8:00（睡前任务）
**And** 家长可在任务模板设置中自定义提醒时间
**And** 如果任务已完成或已过期，不发送提醒
**And** 通知存储在`notifications`表中，类型为"task_reminder"

## Tasks / Subtasks

- [ ] Task 1: Setup Web Push infrastructure (AC: #1, #5)
  - [ ] Subtask 1.1: Install and configure web-push package
  - [ ] Subtask 1.2: Generate VAPID keys and configure environment variables
  - [ ] Subtask 1.3: Register Service Worker for push notifications
  - [ ] Subtask 1.4: Create push subscription management API
- [ ] Task 2: Implement notification request permission flow (AC: #1)
  - [ ] Subtask 2.1: Create permission request UI component
  - [ ] Subtask 2.2: Handle user permission states (granted, denied, default)
  - [ ] Subtask 2.3: Store push subscription in database
- [ ] Task 3: Build scheduled task reminder system (AC: #1, #2, #3, #4)
  - [ ] Subtask 3.1: Create reminder time field in task_plans schema
  - [ ] Subtask 3.2: Implement cron-based job to check for due reminders
  - [ ] Subtask 3.3: Query tasks due for reminder at current time
  - [ ] Subtask 3.4: Filter out completed or expired tasks
- [ ] Task 4: Implement push notification sending logic (AC: #1, #2, #3)
  - [ ] Subtask 4.1: Create notification payload builder with title, body, icon
  - [ ] Subtask 4.2: Implement Web Push API send function
  - [ ] Subtask 4.3: Add click action to navigate to task detail page
  - [ ] Subtask 4.4: Store sent notification in database
- [ ] Task 5: Create Service Worker push handler (AC: #3)
  - [ ] Subtask 5.1: Implement push event listener in service worker
  - [ ] Subtask 5.2: Display notification with proper options
  - [ ] Subtask 5.3: Handle notification click events
- [ ] Task 6: Add customizable reminder time settings (AC: #4, #5)
  - [ ] Subtask 6.1: Update task plan template form with reminder time picker
  - [ ] Subtask 6.2: Store reminder time in task_plans table
  - [ ] Subtask 6.3: Validate reminder time format and timezone
  - [ ] Subtask 6.4: Set default reminder times for new templates
- [ ] Task 7: Implement notification history and management (AC: #6)
  - [ ] Subtask 7.1: Create notifications table schema
  - [ ] Subtask 7.2: Implement notification CRUD operations
  - [ ] Subtask 7.3: Add notification type filtering (task_reminder)
- [ ] Task 8: Testing and validation (All ACs)
  - [ ] Subtask 8.1: Write BDD tests for permission flow
  - [ ] Subtask 8.2: Test reminder scheduling and execution
  - [ ] Subtask 8.3: Verify notification display on different browsers
  - [ ] Subtask 8.4: Test click navigation to task details

## Dev Notes

### Technical Requirements

**Web Push API Implementation:**
- Use Web Push API + Notifications API (two separate but complementary standards)
- Service Worker required for handling push events even when app is closed
- User permission must be granted before sending notifications
- Browser compatibility: Chrome, Edge, Firefox (desktop); Android Chrome; iOS Safari (requires PWA home screen install)

**Technology Stack:**
- Bun 1.3.x+ runtime (NO Node.js compatibility layer)
- web-push package for server-side push notification sending
- VAPID keys for authentication (Voluntary Application Server Identification)
- Service Worker for client-side push handling
- Next.js API Routes for push subscription management

**Database Schema Updates:**
```typescript
// database/schema/task-plans.ts
export const taskPlans = sqliteTable('task_plans', {
  // ... existing fields
  reminderTime: text('reminder_time'), // HH:MM format, e.g., "08:00"
  reminderEnabled: integer('reminder_enabled', { mode: 'boolean' }).default(true),
});

// database/schema/notifications.ts
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // 'task_reminder', 'task_approval_pending', etc.
  title: text('title').notNull(),
  body: text('body').notNull(),
  data: text('data'), // JSON string for additional data
  read: integer('read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**File Structure Requirements:**
- Service Worker: `public/sw/push-handler.js`
- Push Notification Service: `lib/notifications/push.ts`
- Notification Queries: `lib/db/queries/notifications.ts`
- Task Plan Queries: Update `lib/db/queries/tasks.ts`
- API Routes: `app/api/notifications/**`

**Architecture Patterns to Follow:**
- Drizzle ORM for all database operations (NO native SQL)
- Function-based queries in `lib/db/queries/` directory
- BDD testing: Given-When-Then format, tests BEFORE implementation
- File length limit: All files ≤ 800 lines
- TypeScript strict mode (NO `any` type, NO @ts-ignore)

### Project Structure Notes

**Alignment with unified project structure:**
- Service Worker follows PWA pattern: `public/sw/push-handler.js`
- Notification service in `lib/notifications/` (cross-cutting concern)
- Database queries follow per-table file pattern: `lib/db/queries/notifications.ts`
- API routes use Next.js App Router: `app/api/notifications/subscribe/route.ts`

**Detected conflicts or variances:**
- None. Story aligns with existing architecture.

### Previous Story Intelligence

No previous Epic 2 story files exist yet. This is one of the first stories in Epic 2.

**Key Context from Epics:**
- Epic 2 focuses on Task Planning & Management
- Stories 2.1-2.12 should be completed before this story (task creation, completion flow)
- This story builds upon task plan templates (Story 2.1) and task generation (Story 2.4)
- Integration with child task viewing (Story 2.8) and task completion (Story 2.9)

### Git Intelligence

No recent commits to analyze. This is a fresh implementation.

### Latest Technical Information

**Web Push Best Practices (2025):**
1. **VAPID Authentication**: Required for all modern browsers. Generate keys with `web-push generate-vapid-keys`
2. **Payload Encryption**: Web Push protocol requires payload encryption for security
3. **User Permission**: Always ask for permission with clear context ("Receive task reminders to never miss completing your tasks")
4. **Timing Strategy**: Send notifications at optimal times (default: 8:00, 17:00, 20:00)
5. **Click Action**: Always include a click action to navigate to relevant content
6. **Service Worker Lifecycle**: Handle push events properly to ensure notifications display even when app is closed

**Bun Runtime Considerations:**
- Bun supports web-push package (cross-platform compatibility)
- Use `Bun.serve()` for custom server if needed
- Environment variables: `Bun.env.VAPID_PUBLIC_KEY`, `Bun.env.VAPID_PRIVATE_KEY`
- No Node.js compatibility layer needed

**Service Worker Best Practices:**
- Register service worker early in app lifecycle
- Handle push event: `self.addEventListener('push', event => { ... })`
- Use `event.waitUntil()` to keep service worker alive until notification displays
- Include icon and badge for visual consistency
- Use `notificationclick` event for navigation

**Browser Compatibility Notes:**
- iOS Safari requires PWA home screen install for push notifications
- Desktop: Chrome, Edge, Firefox support Web Push API
- Mobile: Android Chrome supports fully; iOS Safari limited
- Fallback: In-app notifications for unsupported browsers

### Testing Requirements

**BDD Format (GIVEN-WHEN-THEN):**
```typescript
// tests/integration/task-reminder-notification.spec.ts

it('given 用户首次登录应用，when 请求推送通知权限，then 显示权限请求对话框', async () => {
  // Given: 用户首次登录
  const child = await createChild();
  await login(child);

  // When: 应用请求推送通知权限
  await requestNotificationPermission();

  // Then: 显示权限请求对话框
  expect(permissionDialogVisible()).toBe(true);
  expect(permissionMessage).toContain('接收任务提醒，不再忘记完成任务');
});

it('given 用户授予推送权限，when 任务提醒时间到达，then 发送推送通知', async () => {
  // Given: 用户已授予推送权限
  const child = await createChild();
  const subscription = await requestNotificationPermission();
  await storePushSubscription(child.id, subscription);

  // And: 创建任务模板并设置提醒时间为08:00
  const taskPlan = await createTaskPlan({
    reminderTime: '08:00',
    reminderEnabled: true
  });

  // When: 任务提醒时间到达（08:00）
  await simulateTime('08:00');
  await runReminderScheduler();

  // Then: 发送推送通知到用户设备
  const notifications = await getPushNotifications(subscription.endpoint);
  expect(notifications).toHaveLength(1);
  expect(notifications[0].title).toBe('时间到！');
  expect(notifications[0].body).toContain(taskPlan.title);
});

it('given 任务已完成，when 提醒时间到达，then 不发送提醒', async () => {
  // Given: 任务已标记为完成
  const child = await createChild();
  const task = await createTask({
    childId: child.id,
    status: 'completed'
  });

  // When: 提醒时间到达
  await simulateTime(task.reminderTime);
  await runReminderScheduler();

  // Then: 不发送提醒
  const notifications = await getPushNotifications(child.id);
  expect(notifications).toHaveLength(0);
});

it('given 设备离线，when 提醒时间到达，then 通知存储在服务器，上线后同步', async () => {
  // Given: 设备离线
  const child = await createChild();
  const subscription = await storePushSubscription(child.id, offlineDevice());
  await simulateOffline(true);

  // When: 提醒时间到达
  const taskPlan = await createTaskPlan({ reminderEnabled: true });
  await simulateTime(taskPlan.reminderTime);
  await runReminderScheduler();

  // Then: 通知存储在服务器（不发送）
  const queuedNotifications = await getQueuedNotifications(child.id);
  expect(queuedNotifications).toHaveLength(1);
  expect(queuedNotifications[0].delivered).toBe(false);

  // When: 设备重新上线
  await simulateOffline(false);
  await syncOfflineQueue();

  // Then: 通知推送到设备
  const deliveredNotifications = await getPushNotifications(subscription.endpoint);
  expect(deliveredNotifications).toHaveLength(1);
  expect(queuedNotifications[0].delivered).toBe(true);
});

it('given 用户点击通知，when 点击事件触发，then 导航到任务详情页', async () => {
  // Given: 用户收到任务提醒通知
  const task = await createTask();
  const notification = await sendPushNotification(task);

  // When: 用户点击通知
  await simulateNotificationClick(notification);

  // Then: 导航到任务详情页
  expect(currentPath()).toBe(`/tasks/${task.id}`);
  expect(taskDetailVisible()).toBe(true);
});
```

**Test Coverage:**
- Permission request flow (grant/deny/default states)
- Reminder scheduling and execution (cron job)
- Push notification sending (web-push package)
- Service worker push handler
- Notification display on different browsers
- Click navigation to task details
- Offline queue and sync
- Notification storage in database
- Customizable reminder times
- Completed task filtering
```

## Dev Agent Record

### Agent Model Used

glm-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

### Completion Notes List

### File List
