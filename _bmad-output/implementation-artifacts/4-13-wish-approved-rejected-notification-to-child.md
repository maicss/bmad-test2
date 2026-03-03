# Story 4.13: Wish Approved/Rejected Notification (to Child)

Status: ready-for-dev

## Story

As a 系统,
I want 在愿望审核结果出来后通知孩子,
so that 孩子知道愿望状态变化。

## Acceptance Criteria

1. Given 家长审核通过了一个愿望（从"等待家长审核"→"已通过"）
   When 愿望状态变更完成
   Then 系统推送通知给孩子，包含：
     - 通知标题："恭喜！"
     - 通知内容："你的愿望「{愿望名称}」已通过，积满{积分}分就能兑换了！"
     - 点击通知跳转到愿望详情页
   And 通知在3秒内送达（NFR4: 实时<3秒）
   And 通知存储在`notifications`表中，类型为"wish_approved"
   And 通知包含相关数据：wishId, wishName, pointsThreshold, childUserId

2. Given 家长拒绝了一个愿望（从"等待家长审核"→"已拒绝"）
   When 愿望状态变更完成
   Then 系统推送通知给孩子，包含：
     - 通知标题："很遗憾"
     - 通知内容："你的愿望「{愿望名称}」未通过：{拒绝原因}"
     - 点击通知跳转到愿望详情页
   And 通知在3秒内送达（NFR4）
   And 通知存储在`notifications`表中，类型为"wish_rejected"
   And 通知包含相关数据：wishId, wishName, rejectionReason, childUserId

3. Given 家长确认了孩子的兑换请求（从"等待家长确认"→"已兑换"）
   When 兑换请求处理完成
   Then 系统推送通知给孩子，包含：
     - 通知标题："太棒了！"
     - 通知内容："你的愿望「{愿望名称}」已兑换成功！"
     - 点击通知跳转到已兑换愿望历史
   And 通知在3秒内送达（NFR4）
   And 通知存储在`notifications`表中，类型为"redemption_approved"
   And 通知包含相关数据：wishId, wishName, redeemedAt, childUserId

4. Given 家长拒绝了孩子的兑换请求（从"等待家长确认"→"进行中"）
   When 兑换请求处理完成
   Then 系统推送通知给孩子，包含：
     - 通知标题："很遗憾"
     - 通知内容："你的兑换请求被拒绝：{拒绝原因}"
     - 点击通知跳转到愿望详情页
   And 通知在3秒内送达（NFR4）
   And 通知存储在`notifications`表中，类型为"redemption_rejected"
   And 通知包含相关数据：wishId, wishName, rejectionReason, childUserId

5. Given 孩子设备在线
   When 通知生成
   Then 通知通过PWA推送（Service Worker）
   And 通知显示在设备通知中心
   And 点击通知打开应用并跳转到对应页面

6. Given 孩子设备离线
   When 通知生成
   Then 通知存储在服务器，标记为"待推送"
   And 孩子上线后自动同步通知
   And 通知状态从"待推送"更新为"已送达"

7. Given 孩子有多个待读通知
   When 孩子打开应用
   Then 通知中心显示未读计数徽章
   And 未读计数实时更新（2-3秒同步）
   And 通知按时间倒序排列，最新在前

8. Given 孩子点击通知
   When 应用打开
   Then 标记该通知为"已读"
   And 应用跳转到对应页面：
     - wish_approved → 愿望详情页
     - wish_rejected → 愿望详情页
     - redemption_approved → 已兑换历史页
     - redemption_rejected → 愿望详情页
   And 页面显示最新数据

9. Given 通知已存在同类型待读通知（如多个愿望被拒绝）
   When 新通知到达
   Then 系统合并相同类型的待读通知（可选优化）
   Or 显示为独立通知（简化实现）
   And 通知总数正确计数

10. Given 通知发送失败（网络问题、推送服务错误）
    When 发送失败
    Then 通知标记为"发送失败"
    And 系统自动重试3次（间隔30秒、5分钟、15分钟）
    And 如果仍失败，标记为"需人工处理"并记录错误日志

11. Given 孩子收到通知后7天内未读
    When 达到过期时间
    Then 通知自动标记为"已读"（不删除）
    And 通知历史保留

12. Given 家长在批量操作中处理多个愿望/兑换请求
    When 批量操作完成
    Then 为每个愿望/兑换请求独立发送通知
    And 通知不进行批量合并（确保孩子看到每个反馈）
    And 通知发送时间控制在5秒内完成所有推送

13. Given 通知推送到PWA
    Then 通知使用Web Push API
    And 通知包含应用图标
    And 通知支持操作按钮（如"查看"、"忽略"）

14. Given 通知类型为"wish_approved"
    Then 通知使用绿色图标/颜色（成功状态）
    And 播放成功音效（叮~！）

15. Given 通知类型为"wish_rejected"或"redemption_rejected"
    Then 通知使用红色图标/颜色（失败状态）
    And 播放提示音效（柔和的提醒音）

16. Given 通知类型为"redemption_approved"
    Then 通知使用金色图标/颜色（庆祝状态）
    And 播放庆祝音效（掌声+彩带音效）
    And 触发简单的庆祝动画（可选）

17. Given 孩子在同一会话中收到多个通知
    Then 通知不重复弹出
    And 未读计数正确更新
    And 通知中心显示所有通知

18. Given 通知推送成功
    Then 记录发送日志：通知类型、接收者、发送时间、送达时间
    And 发送日志保留3年（NFR18: 数据留存）

19. Given 通知内容包含中文字符
    Then 确保UTF-8编码正确
    And 通知显示无乱码

20. Given 家长审核时填写了详细原因（拒绝场景）
    When 通知生成
    Then 通知内容显示完整原因（最多200字）
    And 超过长度时显示前100字+"..."（保护屏幕空间）

21. Given 家长审核时未填写原因（拒绝场景）
    When 通知生成
    Then 通知显示默认原因："未提供详细原因，请联系家长了解详情"

22. Given 愿望名称过长（超过30字）
    When 通知生成
    Then 通知中显示前30字+"..."
    And 点击通知后显示完整名称

23. Given 孩子已禁用通知权限
    When 通知生成
    Then 通知存储在应用内通知中心
    And 打开应用时显示应用内通知横幅
    And 引导用户开启通知权限（一次性提示）

24. Given 通知数据库记录
    Then 包含字段：
     - id (UUID主键)
     - type (枚举：wish_approved, wish_rejected, redemption_approved, redemption_rejected)
     - userId (接收者ID)
     - title (通知标题)
     - content (通知内容)
     - data (JSON: wishId, wishName, pointsThreshold, rejectionReason等)
     - status (枚举：pending, sent, failed, delivered, read)
     - sentAt (发送时间)
     - deliveredAt (送达时间)
     - readAt (已读时间)
     - retryCount (重试次数)
     - errorMessage (错误信息，失败时)

25. Given 通知系统与离线队列集成
    When 孩子离线期间收到通知
    Then 通知加入离线同步队列
    And 上线后立即同步并推送

## Tasks / Subtasks

- [ ] Task 1: Create notification types and interfaces (AC: #24)
  - [ ] Extend types/notification.ts
  - [ ] Add WishNotificationType enum (wish_approved, wish_rejected, redemption_approved, redemption_rejected)
  - [ ] Add WishNotificationData interface
  - [ ] Add NotificationStatus enum (pending, sent, failed, delivered, read)

- [ ] Task 2: Create notification service functions (AC: #1-#4, #10)
  - [ ] Create lib/notifications/wish-notifications.ts
  - [ ] Implement sendWishApprovedNotification()
  - [ ] Implement sendWishRejectedNotification()
  - [ ] Implement sendRedemptionApprovedNotification()
  - [ ] Implement sendRedemptionRejectedNotification()
  - [ ] Add retry logic with exponential backoff (30s, 5m, 15m)
  - [ ] Add error logging and manual handling flag

- [ ] Task 3: Create database queries for notifications (AC: #24)
  - [ ] Extend lib/db/queries/notifications.ts
  - [ ] Implement createNotification()
  - [ ] Implement markNotificationAsRead()
  - [ ] Implement markNotificationAsDelivered()
  - [ ] Implement getUnreadNotificationsCount()
  - [ ] Implement getNotificationsByUser()
  - [ ] Implement updateNotificationStatus()

- [ ] Task 4: Integrate with wish approval workflow (AC: #1, #2)
  - [ ] Modify Story 4.2: Parent Reviews Wish
  - [ ] On wish approval: call sendWishApprovedNotification()
  - [ ] On wish rejection: call sendWishRejectedNotification()
  - [ ] Pass rejection reason if provided
  - [ ] Handle notification errors gracefully

- [ ] Task 5: Integrate with wish redemption workflow (AC: #3, #4)
  - [ ] Modify Story 4.8: Parent Confirms/Rejects Wish Redemption
  - [ ] On redemption confirmation: call sendRedemptionApprovedNotification()
  - [ ] On redemption rejection: call sendRedemptionRejectedNotification()
  - [ ] Pass rejection reason if provided
  - [ ] Handle notification errors gracefully

- [ ] Task 6: Create child notification center UI (AC: #7, #8, #17)
  - [ ] Create lib/components/features/notification-center.tsx
  - [ ] Display unread count badge
  - [ ] Display notification list (time-ordered)
  - [ ] Implement mark as read on click
  - [ ] Implement navigation to target pages
  - [ ] Add refresh button

- [ ] Task 7: Implement PWA push notifications (AC: #5, #13)
  - [ ] Create public/sw/push-handler.js
  - [ ] Configure Service Worker for push events
  - [ ] Handle notification click events
  - [ ] Add app icon to notifications
  - [ ] Support action buttons ("查看", "忽略")

- [ ] Task 8: Implement offline notification sync (AC: #6, #25)
  - [ ] Extend lib/offline/sync.ts
  - [ ] Add notification sync to offline queue
  - [ ] Handle "pending" → "delivered" status update
  - [ ] Sync notifications on network restore

- [ ] Task 9: Add notification sound effects and icons (AC: #14-#16)
  - [ ] Prepare audio files:
    - success.mp3 (叮~!)
    - alert.mp3 (柔和提醒)
    - celebration.mp3 (掌声+彩带)
  - [ ] Define notification icon colors:
    - success: green (#10B981)
    - rejected: red (#EF4444)
    - celebration: gold (#FBBF24)
  - [ ] Integrate sound playback with notifications

- [ ] Task 10: Implement notification cleanup and retention (AC: #11, #18)
  - [ ] Create lib/services/notification-cleanup.ts
  - [ ] Mark 7-day-old unread notifications as read
  - [ ] Delete notifications older than 3 years (NFR18)
  - [ ] Implement cleanup job (cron or periodic task)

- [ ] Task 11: Handle edge cases (AC: #9, #12, #19-#23)
  - [ ] Implement notification merging (optional for same-type notifications)
  - [ ] Batch notification sending with timeout protection (5s)
  - [ ] Ensure UTF-8 encoding for Chinese characters
  - [ ] Truncate long wish names (30 chars + "...")
  - [ ] Handle missing rejection reason with default text
  - [ ] Handle disabled notification permissions gracefully

- [ ] Task 12: Write BDD tests (AC: #1-#25)
  - [ ] **Given** 家长审核通过愿望 **When** 状态变更 **Then** 孩子收到通知
  - [ ] **Given** 家长拒绝愿望 **When** 提供原因 **Then** 通知包含原因
  - [ ] **Given** 家长确认兑换 **When** 完成 **Then** 孩子收到成功通知
  - [ ] **Given** 家长拒绝兑换 **When** 提供原因 **Then** 孩子收到拒绝通知
  - [ ] **Given** 孩子在线 **When** 通知生成 **Then** PWA推送成功
  - [ ] **Given** 孩子离线 **When** 通知生成 **Then** 存储待推送
  - [ ] **Given** 通知点击 **When** 应用打开 **Then** 跳转正确页面
  - [ ] **Given** 发送失败 **When** 重试3次 **Then** 仍失败标记需人工处理
  - [ ] **Given** 通知7天未读 **When** 自动清理任务运行 **Then** 标记已读
  - [ ] **Given** 批量操作 **When** 多个通知 **Then** 5秒内发送完成
  - [ ] **Given** 长愿望名 **When** 通知生成 **Then** 截断显示
  - [ ] **Given** 通知权限禁用 **When** 通知生成 **Then** 应用内显示
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 13: Performance and compliance verification (AC: #5, #10, #18)
  - [ ] Verify notification delivery < 3s (NFR4)
  - [ ] Verify retry logic works correctly
  - [ ] Verify notification logs retained for 3 years
  - [ ] Verify UTF-8 encoding for Chinese characters
  - [ ] Verify batch sending completes within 5s

## Dev Notes

### Project Structure Notes

**Alignment with unified project structure:**
- Service: `lib/notifications/wish-notifications.ts` (new)
- Queries: `lib/db/queries/notifications.ts` (extend)
- UI Component: `lib/components/features/notification-center.tsx` (new)
- Service Worker: `public/sw/push-handler.js` (new)
- Cleanup Service: `lib/services/notification-cleanup.ts` (new)
- Types: `types/notification.ts` (extend)
- Integration points:
  - Story 4.2: Parent Reviews Wish (call notification functions)
  - Story 4.8: Parent Confirms/Rejects Wish Redemption (call notification functions)

**Detected conflicts/variances:**
- None identified at story creation time

### Previous Story Intelligence

**From Story 4.2 (Parent Reviews Wish):**
- Wish approval workflow exists
- Wish status tracking (pending_review, approved, rejected)
- Rejection reason field available
- **Integration point:** Call notification functions on approval/rejection

**From Story 4.8 (Parent Confirms/Rejects Wish Redemption):**
- Redemption confirmation/rejection workflow exists
- Redemption status tracking
- **Integration point:** Call notification functions on confirmation/rejection

**From Story 2.14 (Real-Time Approval Notification):**
- Notification system architecture established
- 3-second delivery requirement pattern
- **Can reuse:** Notification delivery mechanism, retry logic

**From Story 4.4 (Wish Progress Bar Display):**
- Real-time update pattern using polling
- **Can reuse:** Real-time sync pattern for notification count

### Notification System Architecture

**Notification Flow:**
```
Parent Action (approval/rejection)
  ↓
Update Wish Status (lib/db/queries/wishlists.ts)
  ↓
Call Notification Service (lib/notifications/wish-notifications.ts)
  ↓
Create Notification Record (lib/db/queries/notifications.ts)
  ↓
Send PWA Push (public/sw/push-handler.js)
  ↓
Update Delivery Status (lib/db/queries/notifications.ts)
  ↓
Child Receives → Mark as Read → Navigate to Page
```

**Notification Data Model:**
```typescript
interface Notification {
  id: string; // UUID
  type: 'wish_approved' | 'wish_rejected' | 'redemption_approved' | 'redemption_rejected';
  userId: string; // Child user ID
  title: string;
  content: string;
  data: {
    wishId: string;
    wishName: string;
    pointsThreshold?: number;
    rejectionReason?: string;
    redeemedAt?: string;
  };
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  retryCount: number;
  errorMessage?: string;
}
```

**Notification Service Pattern:**
```typescript
// lib/notifications/wish-notifications.ts
export async function sendWishApprovedNotification(
  wishId: string,
  childUserId: string,
  wishName: string,
  pointsThreshold: number
): Promise<void> {
  const notification = await createNotification({
    type: 'wish_approved',
    userId: childUserId,
    title: '恭喜！',
    content: `你的愿望「${wishName}」已通过，积满${pointsThreshold}分就能兑换了！`,
    data: { wishId, wishName, pointsThreshold },
  });

  await sendPWANotification(notification);
}
```

### PWA Push Notification Implementation

**Service Worker Configuration:**
```javascript
// public/sw/push-handler.js
self.addEventListener('push', (event) => {
  const notification = event.data.json();

  const options = {
    body: notification.content,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      notificationId: notification.id,
      wishId: notification.data.wishId,
      type: notification.type,
    },
    actions: [
      { action: 'view', title: '查看' },
      { action: 'ignore', title: '忽略' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(notification.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, notificationId, wishId, type } = event.notification.data;

  if (action === 'ignore') {
    return; // Do nothing
  }

  // Mark as read and navigate
  event.waitUntil(
    Promise.all([
      fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' }),
      clients.openWindow(getTargetUrl(type, wishId)),
    ])
  );
});

function getTargetUrl(type, wishId) {
  switch (type) {
    case 'wish_approved':
    case 'wish_rejected':
      return `/child/wishlist/view/${wishId}`;
    case 'redemption_approved':
      return `/child/wishlist/history`;
    case 'redemption_rejected':
      return `/child/wishlist/view/${wishId}`;
    default:
      return '/child/dashboard';
  }
}
```

### Child Notification Center UI

**Component Structure:**
```typescript
// lib/components/features/notification-center.tsx
export function NotificationCenter({ userId }: Props) {
  const { notifications, unreadCount } = useNotifications(userId);

  return (
    <div className="notification-center">
      <header>
        <h2>通知中心</h2>
        <Badge count={unreadCount} />
      </header>

      <NotificationList notifications={notifications} />
    </div>
  );
}

function NotificationList({ notifications }) {
  return (
    <div className="notification-list">
      {notifications.map((notif) => (
        <NotificationItem
          key={notif.id}
          notification={notif}
          onRead={handleRead}
        />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onRead }) {
  const { type, title, content, createdAt } = notification;
  const iconColor = getNotificationIconColor(type);

  return (
    <div
      className={`notification-item ${notification.status === 'unread' ? 'unread' : ''}`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className={`notification-icon ${iconColor}`}>
        {getNotificationIcon(type)}
      </div>
      <div className="notification-content">
        <h3 className="notification-title">{title}</h3>
        <p className="notification-text">{content}</p>
        <span className="notification-time">{formatTime(createdAt)}</span>
      </div>
    </div>
  );
}
```

### Retry Logic with Exponential Backoff

**Error Handling Pattern:**
```typescript
// lib/notifications/wish-notifications.ts
async function sendNotificationWithRetry(notification: Notification): Promise<void> {
  const maxRetries = 3;
  const retryDelays = [30000, 300000, 900000]; // 30s, 5m, 15m

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await sendPWANotification(notification);
      await markNotificationAsDelivered(notification.id);
      return; // Success
    } catch (error) {
      notification.retryCount = attempt + 1;

      if (attempt < maxRetries) {
        const delay = retryDelays[attempt];
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Max retries reached
        await markNotificationAsFailed(notification.id, error.message);
        throw error;
      }
    }
  }
}
```

### Offline Notification Sync

**Integration with Offline Queue:**
```typescript
// lib/offline/sync.ts
export async function syncNotifications(userId: string): Promise<void> {
  // Fetch pending notifications from server
  const pendingNotifications = await getPendingNotifications(userId);

  // Add to offline queue
  for (const notif of pendingNotifications) {
    await queueOfflineNotification(notif);
  }

  // Mark as delivered on client side
  await markNotificationsAsDelivered(userId);
}
```

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. Parent approves wish → child receives notification
2. Parent rejects wish with reason → child receives notification with reason
3. Parent confirms redemption → child receives success notification
4. Parent rejects redemption with reason → child receives notification with reason
5. Child online → PWA push notification delivered
6. Child offline → notification stored, delivered when online
7. Notification click → mark as read, navigate to correct page
8. Send failure → retry 3 times, then mark as failed
9. Notification 7 days unread → automatically marked as read
10. Batch operation → all notifications sent within 5s
11. Long wish name → truncated in notification
12. Notification permissions disabled → show in-app notification
13. Multiple notifications → correct unread count
14. Notification cleanup → 3-year retention policy

**Integration Tests:**
- Notification service functions
- Database queries for notifications
- Service Worker push handling
- Offline notification sync
- Retry logic with backoff

**E2E Tests (Playwright):**
- Complete wish approval → child receives notification flow
- Complete wish rejection → child receives notification with reason flow
- Complete redemption confirmation → child receives success notification flow
- Complete redemption rejection → child receives notification with reason flow
- Offline notification sync flow
- Notification click and navigation flow
- Batch notification sending flow

### Performance Requirements

- Notification delivery: < 3s (NFR4) - AC #1-#4
- Batch sending: < 5s for multiple notifications - AC #12
- Retry delay: 30s, 5m, 15m (exponential backoff) - AC #10
- Notification render: < 100ms

### UX Requirements

**Child-End Design (from UX decisions):**
- Tablet-optimized layout (landscape, ≥768px)
- Clear, encouraging messages
- Color-coded status (success: green, rejected: red, celebration: gold)
- Sound effects for different notification types
- Simple, intuitive navigation
- Optimistic feedback (instant notification updates)

**Notification Design:**
- Success notifications: Celebratory tone ("恭喜！", "太棒了！")
- Rejection notifications: Gentle but clear tone ("很遗憾")
- Encouraging messages even in rejection ("请联系家长了解详情")
- Visual feedback (icons, colors, badges)
- Easy dismissal ("忽略" button)

**Accessibility:**
- High contrast mode support
- Screen reader friendly labels
- Sound effects toggle (for accessibility preferences)
- Keyboard navigation support

### Open Questions / Decisions Needed

1. **Notification Merging:**
   - Option A: Merge same-type notifications (e.g., multiple rejections)
   - Option B: Show individual notifications
   - **Decision:** Show individual notifications (simpler implementation, clearer feedback)

2. **Notification Retention:**
   - Option A: Auto-delete after 30 days
   - Option B: Mark as read after 7 days, keep for 3 years
   - **Decision:** Mark as read after 7 days, keep for 3 years (per NFR18)

3. **Batch Sending Strategy:**
   - Option A: Send in parallel (faster but higher load)
   - Option B: Send sequentially with timeout (controlled load)
   - **Decision:** Sequential with 5s timeout protection (AC #12)

4. **Sound Effects:**
   - Option A: Browser's Audio API
   - Option B: Service Worker sound
   - **Decision:** Browser's Audio API (more reliable, simpler)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<3s delivery, <5s batch)
5. [ ] Accessibility requirements met
6. [ ] Retry logic working correctly
7. [ ] Offline sync functional
8. [ ] Notification cleanup scheduled
9. [ ] Code review passed
10. [ ] Sprint status updated to ready-for-dev

### Tasks Blocked By

**Prerequisites:**
- Story 4.2: Parent Reviews Wish - Complete ✅
- Story 4.8: Parent Confirms/Rejects Wish Redemption - Complete ✅
- notifications table exists - Need to create (part of this story)
- Notification system architecture - Established from Story 2.14 ✅
- Service Worker setup - Need to verify
- PWA push configuration - Need to verify

**Database Changes Needed:**
- Create notifications table (if not exists)
- Add status tracking fields
- Add retry tracking fields

**None identified at story creation time.**

## Dev Agent Record

### Agent Model Used

GLM-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None at story creation time.

### Completion Notes List

Story created with comprehensive implementation guidance including:
- Complete notification data model with status tracking
- Notification service functions for all four notification types
- Integration points with wish approval and redemption workflows
- PWA push notification implementation
- Offline notification sync strategy
- Retry logic with exponential backoff
- Child notification center UI component
- Sound effects and visual feedback
- Edge case handling (long names, missing reasons, disabled permissions)
- Notification cleanup and retention policy
- BDD test scenarios covering all acceptance criteria
- Performance targets and UX requirements

### File List

**Files to Create:**
- lib/notifications/wish-notifications.ts
- lib/components/features/notification-center.tsx
- public/sw/push-handler.js
- lib/services/notification-cleanup.ts
- audio/success.mp3
- audio/alert.mp3
- audio/celebration.mp3

**Files to Modify:**
- types/notification.ts (add notification types and interfaces)
- lib/db/queries/notifications.ts (add wish notification queries)
- Story 4.2 implementation (integrate notification calls)
- Story 4.8 implementation (integrate notification calls)
- app/(child)/wishlist/page.tsx (add notification center access)
- app/(child)/wishlist/view/[id]/page.tsx (handle notification navigation)
- app/(child)/wishlist/history/page.tsx (handle notification navigation)

**Database Changes:**
- database/schema/notifications.ts (ensure table exists with required fields)
- database/migrations/add_notification_fields.sql (if needed)

**Test Files:**
- tests/unit/wish-notifications.spec.ts
- tests/integration/notification-center.spec.ts
- tests/e2e/wish-notification-flow.spec.ts
