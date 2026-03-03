# Story 4.12: Wish Redemption Request Notification (to Parent)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 在孩子发起兑换时通知家长,
So that 家长可以及时确认兑换。

## Acceptance Criteria

### Notification Trigger Conditions (AC1-AC3)
1. **AC1**: Given 孩子发起兑换请求，When 兑换请求状态变为"等待家长确认"，Then 系统立即触发通知推送
2. **AC2**: Given 愿望积分门槛已满足，When 孩子点击"兑换"按钮并确认，Then 发送通知到所有关联家长（主要家长+次要家长）
3. **AC3**: Given 家长设备离线，When 通知无法立即推送，Then 通知存储在服务器端队列，待设备上线后推送

### Push Notification Delivery (AC4-AC6)
4. **AC4**: Given 通知已触发，When 推送服务可用，Then 通知在3秒内送达家长设备（满足NFR4: 实时同步<3秒）
5. **AC5**: Given 通知推送中，When 首次推送失败，Then 系统自动重试最多3次，每次间隔使用指数退避（5s, 15s, 30s）
6. **AC6**: Given 所有重试均失败，When 达到最大重试次数，Then 通知标记为"failed"并记录到错误日志，管理员可查看失败通知列表

### Notification Content Format (AC7-AC10)
7. **AC7**: Given 通知触发成功，When 通知内容生成，Then 通知标题为"兑换请求待确认"（固定格式）
8. **AC8**: Given 通知触发成功，When 通知内容生成，Then 通知正文格式为"{孩子姓名}请求兑换「{愿望名称}」，消耗{积分}积分"
9. **AC9**: Given 通知触发成功，When 通知显示，Then 包含愿望缩略图（如果愿望有图片）
10. **AC10**: Given 通知触发成功，When 通知生成，Then 通知包含动作按钮："确认"和"拒绝"（支持快捷操作）

### Deep Link to Parent Review Page (AC11-AC12)
11. **AC11**: Given 用户点击通知，When 通知被点击，Then 跳转到家长端愿望审核页面 `/parent/wishlist/review/[wishId]`
12. **AC12**: Given 用户点击通知动作按钮，When 点击"确认"或"拒绝"，Then 直接执行审核操作，显示成功Toast，无需跳转页面

### Offline Queue Handling (AC13-AC15)
13. **AC13**: Given 家长设备处于离线状态，When 通知触发，Then 通知存储到 `notifications` 表，状态为"pending"
14. **AC14**: Given 设备从离线恢复到在线，When Background Sync API 触发，Then 自动同步所有 pending 状态的通知到设备
15. **AC15**: Given 离线队列中有超过50条未读通知，When 同步时，Then 优先同步最近24小时的通知，其他通知标记为"archived"

### Notification Status Tracking (AC16-AC19)
16. **AC16**: Given 通知创建，When 初始状态，Then 通知状态为"pending"（已创建但未发送）
17. **AC17**: Given 通知成功推送到设备，When 推送服务返回成功响应，Then 状态更新为"delivered"（已送达）
18. **AC18**: Given 用户打开通知，When 通知被点击或展开，Then 状态更新为"read"（已读），同时更新 `readAt` 时间戳
19. **AC19**: Given 通知7天未被读取，When 系统定时任务检查，Then 自动标记为"auto-read"（自动已读），保留3年（符合NFR18数据留存要求）

### Sound and Visual Feedback (AC20-AC21)
20. **AC20**: Given 家长设备接收到通知，When 通知到达，Then 播放默认通知音（系统音效，家长可在设置中关闭）
21. **AC21**: Given 通知到达，When 应用在前台运行，Then 显示应用内Toast通知（3秒自动消失）和顶部通知栏红点徽章

### Cleanup Policy and Error Handling (AC22-AC25)
22. **AC22**: Given 通知创建时间超过3年，When 系统清理任务执行，Then 软删除通知（设置 `deletedAt` 时间戳），保留7天可恢复窗口（符合NFR19）
23. **AC23**: Given 通知推送失败，When 错误类型为"设备令牌无效"，Then 自动清理该设备令牌，下次推送时不再尝试
24. **AC24**: Given 通知发送过程中出现异常，When 错误发生，Then 记录详细错误日志到 `notifications.errorLog` 字段（JSON格式）
25. **AC25**: Given 通知系统出现批量失败，When 1小时内失败率超过10%，Then 向管理员发送告警通知（类型："system_alert"）

### Performance and SLA (AC26-AC27)
26. **AC26**: Given 通知触发，When 通知存储到数据库，Then 数据库插入操作在100ms内完成（满足NFR3: API响应<500ms）
27. **AC27**: Given 家长请求通知列表，When 查询 `notifications` 表，Then API响应时间<500ms（NFR3: P95），支持分页（每页20条）

## Tasks / Subtasks

### Task 1: Database Schema Setup (AC16-AC19, AC22-AC27)
- [ ] 1.1 Verify `notifications` table exists with required fields:
  - [ ] id (TEXT PRIMARY KEY)
  - [ ] type (TEXT) - "wish_redemption_request"
  - [ ] recipientUserId (TEXT) - Foreign key to users.id
  - [ ] senderUserId (TEXT) - Child user ID (optional, nullable)
  - [ ] title (TEXT) - "兑换请求待确认"
  - [ ] body (TEXT) - Dynamic content
  - [ ] data (JSON) - wishId, wishName, points, childName
  - [ ] status (TEXT) - "pending" | "sent" | "delivered" | "read" | "failed" | "auto-read"
  - [ ] priority (TEXT) - "high" | "normal" | "low" (default: "high")
  - [ ] sentAt (TIMESTAMP)
  - [ ] deliveredAt (TIMESTAMP, nullable)
  - [ ] readAt (TIMESTAMP, nullable)
  - [ ] errorLog (JSON, nullable)
  - [ ] retryCount (INTEGER, default: 0)
  - [ ] maxRetries (INTEGER, default: 3)
  - [ ] nextRetryAt (TIMESTAMP, nullable)
  - [ ] createdAt (TIMESTAMP, default: CURRENT_TIMESTAMP)
  - [ ] deletedAt (TIMESTAMP, nullable) - Soft delete
- [ ] 1.2 Create migration file `database/migrations/add_notifications_table.sql` if not exists
- [ ] 1.3 Add indexes for performance:
  - [ ] idx_notifications_recipient_status - (recipientUserId, status)
  - [ ] idx_notifications_type_created - (type, createdAt DESC)
  - [ ] idx_notifications_status_retry - (status, nextRetryAt) for retry queue

### Task 2: Notification Service Implementation (AC1, AC4-AC6, AC16-AC19)
- [ ] 2.1 Create `lib/services/notification-sender.ts`:
  - [ ] `createNotification()` - Insert notification record with status="pending"
  - [ ] `sendNotification()` - Push notification to device via Web Push API
  - [ ] `retryNotification()` - Exponential backoff retry logic
  - [ ] `markNotificationDelivered()` - Update status to "delivered"
  - [ ] `markNotificationRead()` - Update status to "read"
  - [ ] `markNotificationFailed()` - Update status to "failed" with errorLog
- [ ] 2.2 Implement exponential backoff:
  - [ ] Retry delays: 5s, 15s, 30s (base: 5s, multiplier: 3)
  - [ ] Max retries: 3 (configurable via MAX_RETRIES constant)
  - [ ] Schedule next retry with `nextRetryAt` timestamp
- [ ] 2.3 Create retry queue processor:
  - [ ] Cron job to check for pending notifications with `nextRetryAt <= now`
  - [ ] Batch processing (max 100 notifications per run)
  - [ ] Error handling and logging for batch failures

### Task 3: Wish Redemption Request Notification Trigger (AC1-AC3, AC7-AC10)
- [ ] 3.1 Create `lib/services/wish-redemption-notifier.ts`:
  - [ ] `sendWishRedemptionRequestNotification(wishId: string, childId: string)`
- [ ] 3.2 Generate notification content:
  - [ ] Title: "兑换请求待确认"
  - [ ] Body: "{childName}请求兑换「{wishName}」，消耗{points}积分"
  - [ ] Data payload: { wishId, wishName, points, childName, childAvatar }
- [ ] 3.3 Fetch parent recipients:
  - [ ] Query all parents in the family (primary + secondary)
  - [ ] Exclude parents who have notification disabled (via family settings)
- [ ] 3.4 Call `notification-sender.createNotification()` for each parent:
  - [ ] Set priority="high" (important user action)
  - [ ] Set type="wish_redemption_request"
  - [ ] Associate with child user for "senderUserId"

### Task 4: PWA Integration - Web Push API (AC4-AC6, AC13-AC15, AC20-AC21)
- [ ] 4.1 Update Service Worker (`public/sw/sw.js`):
  - [ ] Handle push event: `self.addEventListener('push', ...)`
  - [ ] Parse notification data and display with Notification API
  - [ ] Handle notification click: navigate to review page
- [ ] 4.2 Implement subscription management:
  - [ ] Request notification permission on app first load
  - [ ] Store push subscription in `users.pushSubscription` field
  - [ ] Renew subscription when expired
- [ ] 4.3 Offline queue handling:
  - [ ] Use IndexedDB to cache notifications when offline
  - [ ] Background Sync API to sync on network restore
  - [ ] Conflict resolution: server timestamp wins
- [ ] 4.4 Sound and visual feedback:
  - [ ] Play default system notification sound
  - [ ] Show in-app Toast when app is in foreground
  - [ ] Update notification badge count on parent navigation

### Task 5: Deep Link to Parent Review Page (AC11-AC12)
- [ ] 5.1 Create parent review page route:
  - [ ] `app/(parent)/wishlist/review/[wishId]/page.tsx`
  - [ ] Display wish details, child points, redemption confirmation
  - [ ] "确认" and"拒绝" buttons
- [ ] 5.2 Implement deep link handling:
  - [ ] Extract wishId from notification data
  - [ ] Navigate to `/parent/wishlist/review/${wishId}`
  - [ ] Auto-select the review request in the list
- [ ] 5.3 Add action buttons to notification:
  - [ ] "确认" action: Call API `/api/wishlists/redemption/[wishId]/approve`
  - [ ] "拒绝" action: Open reject reason dialog
  - [ ] Show success Toast after action completes

### Task 6: Notification Status Tracking API (AC16-AC19, AC26-AC27)
- [ ] 6.1 Create API endpoint `app/api/notifications/route.ts`:
  - [ ] GET /api/notifications - List notifications for authenticated user
  - [ ] Supports query params: ?status=unread&type=wish_redemption_request&page=1
  - [ ] Returns: { notifications: Notification[], total, page, pageSize }
  - [ ] Performance: <500ms P95
- [ ] 6.2 Create API endpoint `app/api/notifications/[id]/read/route.ts`:
  - [ ] PATCH /api/notifications/[id]/read - Mark notification as read
  - [ ] Updates status="read" and readAt=now
- [ ] 6.3 Create API endpoint `app/api/notifications/[id]/dismiss/route.ts`:
  - [ ] PATCH /api/notifications/[id]/dismiss - Dismiss notification (mark as read without action)
- [ ] 6.4 Implement pagination:
  - [ ] Page size: 20 notifications
  - [ ] Use OFFSET/LIMIT for pagination
  - [ ] Order by createdAt DESC

### Task 7: Cleanup and Retention Jobs (AC22-AC23)
- [ ] 7.1 Create cron job script `scripts/cleanup-old-notifications.ts`:
  - [ ] Find notifications where createdAt < 3 years ago and deletedAt IS NULL
  - [ ] Soft delete: SET deletedAt = now
  - [ ] Preserve 7-day recovery window (actual hard delete after 7 days)
  - [ ] Log cleanup statistics (count deleted)
- [ ] 7.2 Create cron job script `scripts/cleanup-expired-device-tokens.ts`:
  - [ ] Find failed notifications with errorLog containing "invalid token"
  - [ ] Extract device tokens from errorLog
  - [ ] Clear users.pushSubscription for those tokens
  - [ ] Log cleanup count
- [ ] 7.3 Create cron job script `scripts/auto-read-old-notifications.ts`:
  - [ ] Find notifications where status="unread" AND createdAt < 7 days ago
  - [ ] Update status="auto-read", readAt=now
  - [ ] Log count of auto-read notifications
- [ ] 7.4 Schedule cron jobs via bun-cron or next-cron:
  - [ ] Cleanup old notifications: Daily at 2:00 AM
  - [ ] Cleanup expired tokens: Daily at 3:00 AM
  - [ ] Auto-read old notifications: Daily at 1:00 AM

### Task 8: Error Handling and Logging (AC24-AC25)
- [ ] 8.1 Create `lib/constants/error-codes.ts` additions:
  - [ ] NOTIFICATION_SEND_FAILED - Generic notification failure
  - [ ] NOTIFICATION_DEVICE_INVALID - Invalid device token
  - [ ] NOTIFICATION_RATE_LIMITED - Rate limit exceeded
  - [ ] NOTIFICATION_SYSTEM_ERROR - Internal system error
- [ ] 8.2 Implement structured logging:
  - [ ] Log all notification lifecycle events (created, sent, delivered, read, failed)
  - [ ] Use Bun logger with context: { notificationId, type, recipientId, error }
  - [ ] Log levels: INFO (success), WARN (retries), ERROR (failures)
- [ ] 8.3 Create admin alerting:
  - [ ] Monitor failure rate in last hour
  - [ ] If failure rate > 10%, send alert to admin
  - [ ] Alert format: "Notification System Alert: Failure rate 15% in last hour"
  - [ ] Store alert in `notifications` table with type="system_alert"

### Task 9: Frontend Integration (AC11-AC12, AC20-AC21)
- [ ] 9.1 Update parent navigation bar:
  - [ ] Add notification icon with badge count
  - [ ] Fetch unread count on app load and every 10 seconds
  - [ ] Badge shows total unread count
- [ ] 9.2 Create notification center component:
  - [ ] `components/features/notification-list.tsx`
  - [ ] List all notifications grouped by type
  - [ ] Filter tabs: All, Unread, Wish Redemption, Task Approval, etc.
  - [ ] Click notification to open review page
- [ ] 9.3 Implement in-app Toast:
  - [ ] Use Shadcn Toast component
  - [ ] Show when notification arrives while app is in foreground
  - [ ] Auto-dismiss after 3 seconds
- [ ] 9.4 Request notification permission:
  - [ ] Show permission request modal on first app load
  - [ ] Explain why notifications are needed: "Get notified when your child requests to redeem a wish"
  - [ ] Store user preference in `users.notificationEnabled`

### Task 10: Testing (All ACs)
- [ ] 10.1 Write BDD tests for notification trigger:
  - [ ] `given 孩子发起兑换请求，when 请求状态变为等待确认，then 通知已创建并存储在数据库`
  - [ ] `given 通知已创建，when 推送服务可用，then 通知在3秒内送达`
- [ ] 10.2 Write BDD tests for retry logic:
  - [ ] `given 首次推送失败，when 重试机制触发，then 通知在5秒后重试`
  - [ ] `given 3次重试均失败，when 达到最大重试次数，then 通知状态为failed并记录错误日志`
- [ ] 10.3 Write BDD tests for offline handling:
  - [ ] `given 家长设备离线，when 通知触发，then 通知存储为pending状态`
  - [ ] `given 设备恢复在线，when Background Sync触发，then 通知同步到设备`
- [ ] 10.4 Write BDD tests for cleanup:
  - [ ] `given 通知创建时间超过3年，when 清理任务执行，then 通知软删除`
  - [ ] `given 通知软删除7天，when 清理任务再次执行，then 通知永久删除`
- [ ] 10.5 Write integration tests:
  - [ ] Test full flow: child redemption request → notification sent → parent receives → parent approves
  - [ ] Test error scenarios: invalid device token, network timeout, rate limit
  - [ ] Test performance: 100 concurrent notifications sent in <5 seconds

## Dev Notes

### RED LIST Compliance

**Database Operations:**
- ✅ Must use Drizzle ORM - NO native SQL
- ✅ All queries in `lib/db/queries/notifications.ts`
- ✅ Use Drizzle query builder for all database operations
- ❌ Forbidden: `db.execute()`, string concatenation, raw SQL in components

**Runtime and Types:**
- ✅ NO `any` types - Use `unknown` + type guards
- ✅ NO `@ts-ignore` / `@ts-expect-error`
- ✅ Use Bun runtime features: `Bun.env`, not `process.env`
- ✅ Use Shadcn Dialog/Toast for errors, not `alert()`

**BDD Testing:**
- ✅ Write tests FIRST (Given-When-Then format)
- ✅ Use business language, not technical terms
- ✅ All ACs must have corresponding BDD tests

**File Structure:**
- ✅ Max file length: 800 lines
- ✅ Split large components if needed

### Architecture Patterns

**Notification Service Layer (`lib/services/notification-sender.ts`):**
- Single Responsibility: Send notifications and track status
- Dependency Injection: Accept database instance and push service
- Error Handling: All errors logged, status updated appropriately

**Retry Strategy:**
- Exponential backoff: 5s, 15s, 30s
- Max retries: 3 (configurable)
- Store `nextRetryAt` timestamp for query optimization

**Offline Queue:**
- IndexedDB for client-side queue
- Background Sync API for automatic sync
- Timestamp-based conflict resolution

### Database Schema Extensions

**New Table: `notifications`**
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- "wish_redemption_request", "task_approval", etc.
  recipientUserId TEXT NOT NULL REFERENCES users(id),
  senderUserId TEXT REFERENCES users(id), -- nullable
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSON NOT NULL, -- { wishId, wishName, points, childName, childAvatar }
  status TEXT NOT NULL DEFAULT 'pending', -- "pending" | "sent" | "delivered" | "read" | "failed" | "auto-read"
  priority TEXT NOT NULL DEFAULT 'normal', -- "high" | "normal" | "low"
  sentAt TIMESTAMP,
  deliveredAt TIMESTAMP,
  readAt TIMESTAMP,
  errorLog JSON,
  retryCount INTEGER DEFAULT 0,
  maxRetries INTEGER DEFAULT 3,
  nextRetryAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP, -- Soft delete
  FOREIGN KEY (recipientUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (senderUserId) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_notifications_recipient_status ON notifications(recipientUserId, status);
CREATE INDEX idx_notifications_type_created ON notifications(type, createdAt DESC);
CREATE INDEX idx_notifications_status_retry ON notifications(status, nextRetryAt);
CREATE INDEX idx_notifications_deleted_at ON notifications(deletedAt);
```

**Existing Table: `users` (Additions)**
```sql
ALTER TABLE users ADD COLUMN pushSubscription TEXT; -- JSON string of Web Push subscription
ALTER TABLE users ADD COLUMN notificationEnabled INTEGER DEFAULT 1; -- Boolean (0/1)
```

### API Integration Points

**Notification API Endpoints:**
1. `GET /api/notifications` - List notifications for authenticated user
   - Query params: ?status=unread&type=wish_redemption_request&page=1
   - Response: `{ notifications: Notification[], total, page, pageSize }`
   - Auth: Required (parent role)

2. `PATCH /api/notifications/[id]/read` - Mark notification as read
   - Request: `{}`
   - Response: `{ success: true }`
   - Auth: Required (recipient must match authenticated user)

3. `POST /api/notifications/register` - Register push subscription
   - Request: `{ subscription: PushSubscriptionJSON }`
   - Response: `{ success: true }`
   - Auth: Required

**Wish Redemption API (Integration Point):**
- Modify `POST /api/wishlists/[wishId]/redeem` to trigger notification
- After successful redemption request creation, call `sendWishRedemptionRequestNotification()`

### PWA / Service Worker Integration

**Service Worker (`public/sw/sw.js`):**
```javascript
// Handle push events
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    tag: data.id, // Group notifications
    requireInteraction: true,
    data: { wishId: data.data.wishId, reviewUrl: data.data.reviewUrl }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const wishId = event.notification.data.wishId;
  event.waitUntil(
    clients.openWindow(`/parent/wishlist/review/${wishId}`)
  );
});
```

**Background Sync:**
```javascript
// Register sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});
```

**IndexedDB Schema:**
- Store: `offline-notifications`
- Indexes: `id`, `status`, `createdAt`
- Conflict resolution: Server timestamp wins

### BDD Test Scenarios

**Scenario 1: Notification Trigger**
```typescript
it('given 孩子发起兑换请求，when 请求状态变为等待确认，then 通知已创建并存储在数据库', async () => {
  // Given: 儿童账户有足够积分，家长已注册推送订阅
  const child = await createChildWithPoints(100);
  const parent = await createParentWithPushSubscription();
  const wish = await createWish({ points: 50, childId: child.id, status: 'approved' });

  // When: 儿童发起兑换请求
  await request(app)
    .post(`/api/wishlists/${wish.id}/redeem`)
    .set('Cookie', child.session);

  // Then: 通知已创建
  const notifications = await db.query.notifications.findMany({
    where: eq(notifications.recipientUserId, parent.id)
  });
  expect(notifications).toHaveLength(1);
  expect(notifications[0].type).toBe('wish_redemption_request');
  expect(notifications[0].status).toBe('pending');
});
```

**Scenario 2: Push Delivery in 3 Seconds**
```typescript
it('given 通知已创建，when 推送服务可用，then 通知在3秒内送达', async () => {
  // Given: 通知已创建，推送服务mock为成功
  const notification = await createNotification({ type: 'wish_redemption_request' });
  mockPushService.resolves({ success: true });

  // When: 触发推送
  const startTime = Date.now();
  await sendNotification(notification.id);
  const duration = Date.now() - startTime;

  // Then: 送达时间 < 3秒
  expect(duration).toBeLessThan(3000);
  expect(mockPushService.calledOnce).toBe(true);
});
```

**Scenario 3: Retry with Exponential Backoff**
```typescript
it('given 首次推送失败，when 重试机制触发，then 通知在5秒后重试', async () => {
  // Given: 推送服务第一次失败，第二次成功
  mockPushService
    .onCall(0).rejects(new Error('Network timeout'))
    .onCall(1).resolves({ success: true });

  const notification = await createNotification({ status: 'sent', retryCount: 0 });

  // When: 重试队列处理器运行
  await processRetryQueue();

  // Then: 通知已重试1次，下次重试时间为5秒后
  const updated = await getNotification(notification.id);
  expect(updated.retryCount).toBe(1);
  expect(updated.status).toBe('delivered'); // 第二次成功
});
```

**Scenario 4: Offline Queue**
```typescript
it('given 家长设备离线，when 通知触发，then 通知存储为pending状态', async () => {
  // Given: 推送服务不可用
  mockPushService.rejects(new Error('Device offline'));
  const parent = await createParent();

  // When: 触发通知
  await sendWishRedemptionRequestNotification(wishId, childId);

  // Then: 通知状态为pending
  const notifications = await db.query.notifications.findMany({
    where: eq(notifications.recipientUserId, parent.id)
  });
  expect(notifications[0].status).toBe('pending');
});
```

**Scenario 5: Deep Link Navigation**
```typescript
it('given 用户点击通知，when 通知被点击，then 跳转到家长端愿望审核页面', async () => {
  // Given: 通知包含wishId
  const notification = await createNotification({
    data: { wishId: 'wish-123', wishName: '乐高', points: 50, childName: '小明' }
  });

  // When: 用户点击通知
  await clickNotification(notification.id);

  // Then: 跳转到审核页面
  expect(navigateMock).toHaveBeenCalledWith('/parent/wishlist/review/wish-123');
});
```

### Project Structure Notes

**Alignment with Unified Project Structure:**
- Notification service: `lib/services/notification-sender.ts`
- Wish redemption notifier: `lib/services/wish-redemption-notifier.ts`
- Notification queries: `lib/db/queries/notifications.ts`
- Notification types: `types/notification.ts`
- Cleanup scripts: `scripts/cleanup-*.ts`
- Service Worker: `public/sw/sw.js`
- Parent notification list: `components/features/notification-list.tsx`
- Parent review page: `app/(parent)/wishlist/review/[wishId]/page.tsx`
- API endpoints: `app/api/notifications/route.ts`

**Detected Conflicts or Variances:**
- None identified - Architecture supports notification system design
- Existing `notifications` table may need migration (check existing schema)
- Ensure parent navigation bar has notification icon slot

### References

- [Source: AGENTS.md#RED LIST](../AGENTS.md) - Database and runtime constraints
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.12](../_bmad-output/planning-artifacts/epics.md) - Original story requirements
- [Source: _bmad-output/planning-artifacts/prd.md#Notifications](../_bmad-output/planning-artifacts/prd.md) - PRD notification requirements (FR57, NFR4)
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-4](../_bmad-output/planning-artifacts/architecture.md) - Offline queue architecture
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure](../_bmad-output/planning-artifacts/architecture.md) - Directory structure
- [Source: docs/TECH_SPEC_PWA.md](../docs/TECH_SPEC_PWA.md) - PWA and Service Worker specs
- [Source: docs/TECH_SPEC_BDD.md](../docs/TECH_SPEC_BDD.md) - BDD testing guidelines
- [Source: docs/TECH_SPEC_DATABASE.md](../docs/TECH_SPEC_DATABASE.md) - Database schema guidelines
- [Source: docs/TECH_SPEC_PERFORMANCE.md](../docs/TECH_SPEC_PERFORMANCE.md) - Performance requirements

## Dev Agent Record

### Agent Model Used
zai-coding-plan/glm-4.7

### Debug Log References
None

### Completion Notes List
None

### File List
- database/migrations/add_notifications_table.sql
- lib/services/notification-sender.ts
- lib/services/wish-redemption-notifier.ts
- lib/db/queries/notifications.ts
- types/notification.ts
- public/sw/sw.js
- components/features/notification-list.tsx
- app/(parent)/wishlist/review/[wishId]/page.tsx
- app/api/notifications/route.ts
- app/api/notifications/[id]/read/route.ts
- app/api/notifications/[id]/dismiss/route.ts
- app/api/notifications/register/route.ts
- scripts/cleanup-old-notifications.ts
- scripts/cleanup-expired-device-tokens.ts
- scripts/auto-read-old-notifications.ts
- tests/e2e/wishlist.spec.ts
- tests/integration/notifications.spec.ts
