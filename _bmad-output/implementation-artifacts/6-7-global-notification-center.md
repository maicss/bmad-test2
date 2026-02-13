# Story 6.7: Global Notification Center (Migrated from Epic 6)

Status: ready-for-dev

## Story

As a **家长**,
I want **集中查看所有类型的通知（任务、积分、愿望、Combo、系统公告）**,
So that **我不会错过任何重要信息，并能按类型筛选查看**。

## Acceptance Criteria

**Given** 我已登录Family Reward系统并有家长权限
**When** 我进入"通知中心"页面（已从Epic 6迁移）
**Then** 系统显示通知列表，包含：
  - 通知类型标签页签：
     - 全部通知（未读计数）
     - 任务提醒（已从Epic 2迁移，FR55）
     - 积分变动（已从Epic 3迁移）
     - 愿望相关（已从Epic 4迁移，FR57）
     - Combo预警（已从Epic 5迁移，FR58）
     - 系统公告（Epic 6本机，FR54）
  - 每个通知类型显示未读计数徽章
  - 支持按类型筛选：点击标签页签只显示该类型通知
  - 支持按时间排序：最新通知在前（最近7天/30天/全部）
  - 通知列表项显示：
     - 通知类型图标（不同颜色区分）
     - 发送者头像（儿童/管理员/系统）和姓名
     - 通知标题
     - 通知内容（预览文本，长文本折叠）
     - 发送时间（相对时间：刚刚/2分钟前/今天X点）
     - 操作按钮：
       - 任务通知：跳转到审批页面
       - 愿望通知：跳转到愿望管理
       - 积分通知：跳转到积分历史
       - Combo通知：查看Combo状态
       - 系统通知：标记为已读
     - 支持滑动批量标记为已读
**And** 当我点击通知类型标签时，列表自动刷新为该类型通知
**And** 点击通知卡片时，执行该类型关联的操作
**And** 未读通知总数实时更新（3秒内同步，AC20）
**And** 通知列表分页加载，每页显示20个通知
**And** 如果通知数量超过50个，显示"加载更多"按钮
**And** 页面加载时间<3秒（NFR2: 家长端页面）
**And** 支持下拉刷新手动同步最新通知
**And** 操作记录到审计日志（标记已读操作）
**And** 参考FR59: 家长可以集中查看所有通知
**And** 参考Architecture: 通知聚合所有Epic的通知类型，存储在`notifications`表中
**And** 通知支持离线模式：如果家长离线，通知缓存在本地，上线后标记

## Tasks / Subtasks

- [ ] Task 1: Verify/extend database schema for notifications (AC: Then)
  - [ ] Subtask 1.1: Review notifications table schema in database/schema/
  - [ ] Subtask 1.2: Verify all required fields exist (type, subtype, isRead, sentBy, etc.)
  - [ ] Subtask 1.3: Add missing fields if needed (unread_count indexes)
  - [ ] Subtask 1.4: Create migration if schema changes needed

- [ ] Task 2: Create database query functions for notifications (AC: Then)
  - [ ] Subtask 2.1: Create lib/db/queries/notifications.ts
  - [ ] Subtask 2.2: Implement getNotificationsByUser() function (with filters)
  - [ ] Subtask 2.3: Implement getNotificationById() function
  - [ ] Subtask 2.4: Implement getUnreadCountByType() function (for badges)
  - [ ] Subtask 2.5: Implement markAsRead() function (single)
  - [ ] Subtask 2.6: Implement markAllAsRead() function (batch)

- [ ] Task 3: Create API endpoints for notification center (AC: When/Then)
  - [ ] Subtask 3.1: Create GET /api/notifications endpoint (list notifications)
  - [ ] Subtask 3.2: Create GET /api/notifications/[id] endpoint (get notification details)
  - [ ] Subtask 3.3: Create PUT /api/notifications/[id]/read endpoint (mark as read)
  - [ ] Subtask 3.4: Create PUT /api/notifications/read-all endpoint (batch mark as read)
  - [ ] Subtask 3.5: Add parent authentication middleware
  - [ ] Subtask 3.6: Add type filter query parameter (task/points/wish/combo/system)
  - [ ] Subtask 3.7: Add time range query parameter (7/30/all)

- [ ] Task 4: Create notification center page (AC: When)
  - [ ] Subtask 4.1: Create app/(parent)/notifications/page.tsx (main page)
  - [ ] Subtask 4.2: Create components/features/notification-tabs.tsx (type tabs)
  - [ ] Subtask 4.3: Create components/features/notification-list.tsx (notification cards)
  - [ ] Subtask 4.4: Create components/features/notification-card.tsx (single card)
  - [ ] Subtask 4.5: Create components/features/notification-badge.tsx (unread badge)

- [ ] Task 5: Implement notification filtering and tabs (AC: Then)
  - [ ] Subtask 5.1: Add type tabs (all/task/points/wish/combo/system)
  - [ ] Subtask 5.2: Display unread count badge for each type
  - [ ] Subtask 5.3: Filter notifications by type on tab click
  - [ ] Subtask 5.4: Maintain tab state in URL query params

- [ ] Task 6: Implement notification list with pagination (AC: Then)
  - [ ] Subtask 6.1: Display notification cards with icons (colored by type)
  - [ ] Subtask 6.2: Display sender avatar and name (child/admin/system)
  - [ ] Subtask 6.3: Display notification title and content (collapsed preview)
  - [ ] Subtask 6.4: Display relative timestamp (just now/2 min ago/etc)
  - [ ] Subtask 6.5: Implement pagination (20 items per page)
  - [ ] Subtask 6.6: Add "Load More" button when > 50 notifications

- [ ] Task 7: Implement notification actions (AC: Then)
  - [ ] Subtask 7.1: Task notification → navigate to approval page
  - [ ] Subtask 7.2: Wish notification → navigate to wish management
  - [ ] Subtask 7.3: Points notification → navigate to points history
  - [ ] Subtask 7.4: Combo notification → navigate to combo status
  - [ ] Subtask 7.5: System notification → mark as read action
  - [ ] Subtask 7.6: Implement swipe gesture for batch mark as read

- [ ] Task 8: Implement real-time sync (AC: AC20)
  - [ ] Subtask 8.1: Add polling mechanism (3-second intervals)
  - [ ] Subtask 8.2: Update unread count badges in real-time
  - [ ] Subtask 8.3: Add pull-to-refresh gesture for manual sync
  - [ ] Subtask 8.4: Show loading indicator during sync

- [ ] Task 9: Add offline support (AC: Then)
  - [ ] Subtask 9.1: Cache notifications in IndexedDB (offline mode)
  - [ ] Subtask 9.2: Store offline actions (mark as read)
  - [ ] Subtask 9.3: Sync offline actions when network restores
  - [ ] Subtask 9.4: Display network status indicator (green/orange/red)

- [ ] Task 10: Add validation and error handling (AC: NFR14, NFR2)
  - [ ] Subtask 10.1: Validate user is parent (permission check)
  - [ ] Subtask 10.2: Add error messages for API failures
  - [ ] Subtask 10.3: Add Shadcn Toast notifications for actions
  - [ ] Subtask 10.4: Log audit trail for mark-as-read operations

- [ ] Task 11: Write BDD tests (AC: NFR2, NFR14, AC20)
  - [ ] Subtask 11.1: Write integration tests for API endpoints
  - [ ] Subtask 11.2: Write unit tests for query functions
  - [ ] Subtask 11.3: Write E2E tests with Playwright (filter by type, mark as read)
  - [ ] Subtask 11.4: Verify page load time < 3 seconds
  - [ ] Subtask 11.5: Verify real-time sync (3-second intervals)

## Dev Notes

### Technical Stack & Requirements

**Core Technologies:**
- Bun 1.3.x+ (runtime)
- Next.js 16.1.6 + React 19.2.3
- Drizzle ORM 0.45.1+ (database queries)
- TypeScript 5 strict mode
- Shadcn UI 3.7.0+ (UI components)
- Tailwind CSS 4 (styling)
- Zustand (for notification state management)

### Database Schema (Review existing)

**Notifications table should include:**
```typescript
// database/schema/notifications.ts - REVIEW existing schema
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // Recipient user ID
  type: text('type', { enum: ['task', 'points', 'wish', 'combo', 'system'] }).notNull(),
  subtype: text('subtype'), // task_reminder, points_change, wish_review, etc.
  title: text('title').notNull(),
  content: text('content').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false).notNull(),
  sentBy: text('sent_by'), // User ID who triggered notification
  sentAt: timestamp('sent_at').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
```

### API Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/notifications` | List notifications (with filters) | Parent |
| GET | `/api/notifications/[id]` | Get notification details | Parent |
| PUT | `/api/notifications/[id]/read` | Mark notification as read | Parent |
| PUT | `/api/notifications/read-all` | Mark all as read (by type) | Parent |
| POST | `/api/notifications/poll` | Get new notifications (for real-time sync) | Parent |

**Request/Response DTOs:**

```typescript
// List Notifications Request
{
  type?: 'task' | 'points' | 'wish' | 'combo' | 'system'; // Filter by type
  timeRange?: '7d' | '30d' | 'all'; // Time range filter
  limit?: number; // Pagination
  offset?: number;
}

// List Notifications Response
{
  notifications: Array<{
    id: string;
    userId: string;
    type: string;
    subtype: string;
    title: string;
    content: string;
    isRead: boolean;
    sentBy: {
      id: string;
      name: string;
      avatarUrl?: string;
      role: 'child' | 'admin' | 'system';
    };
    sentAt: string;
    relativeTime: string; // "just now", "2 min ago", etc.
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  unreadCounts: {
    all: number;
    task: number;
    points: number;
    wish: number;
    combo: number;
    system: number;
  };
}

// Mark as Read Response
{
  success: boolean;
  notification: {
    id: string;
    isRead: true;
  };
}
```

### State Management (Zustand)

**Notification Store:**
```typescript
// lib/store/notification-store.ts
interface NotificationState {
  notifications: Notification[];
  unreadCounts: UnreadCounts;
  currentType: string | null;
  loading: boolean;
  error: string | null;
}

interface UnreadCounts {
  all: number;
  task: number;
  points: number;
  wish: number;
  combo: number;
  system: number;
}
```

### Project Structure Notes

**Files to Create/Modify:**

```
database/schema/
├── notifications.ts       # REVIEW: Verify schema

lib/db/queries/
├── notifications.ts        # REVIEW/EXTEND: Add center functions

app/(parent)/
├── notifications/
│   └── page.tsx           # NEW: Notification center page

components/features/
├── notification-tabs.tsx   # NEW: Type tabs with badges
├── notification-list.tsx    # NEW: List of notification cards
├── notification-card.tsx    # NEW: Single notification card
└── notification-badge.tsx   # NEW: Unread count badge

lib/store/
├── notification-store.ts  # NEW: Zustand store for notifications

tests/integration/
├── notifications.spec.ts  # NEW: API tests

tests/e2e/
├── notifications.spec.ts  # NEW: E2E tests
```

**Alignment with Unified Project Structure:**

- ✅ Schema in `database/schema/notifications.ts` (per architecture)
- ✅ Queries in `lib/db/queries/notifications.ts` (per-table file pattern)
- ✅ API routes in `app/api/notifications/` (RESTful pattern)
- ✅ Components in `components/features/` (feature-based)
- ✅ No conflicts detected

### References

- **Architecture Decision:** ADR-5 (Function-based queries, NOT Repository pattern)
- **API Pattern:** [Source: docs/TECH_SPEC_API.md#REST-endpoints]
- **Component System:** [Source: docs/TECH_SPEC_ARCHITECTURE.md#component-boundaries]
- **Testing Standard:** [Source: docs/TECH_SPEC_BDD.md#Given-When-Then]
- **FR59:** [Source: _bmad-output/planning-artifacts/prd.md#FR59] 家长可以集中查看所有通知
- **Real-Time Sync:** [Source: docs/TECH_SPEC_ARCHITECTURE.md#real-time-communication-architecture] (3-second polling)
- **Offline Support:** [Source: docs/TECH_SPEC_ARCHITECTURE.md#adr-4-offline-queue-conflict-resolution]

### Critical Implementation Constraints

**🔴 RED LIST - MUST OBEY:**

1. **Database Operations:**
   - ✅ MUST use Drizzle ORM query builder
   - ❌ NEVER use raw SQL
   - ❌ NEVER write SQL in components/routes
   - ✅ All queries MUST be in `lib/db/queries/notifications.ts`

2. **Type Safety:**
   - ❌ NEVER use `any` type
   - ✅ MUST use `unknown` + type guards
   - ✅ NO `@ts-ignore` or `@ts-expect-error`

3. **Bun Runtime:**
   - ✅ MUST use `Bun.file()`, `Bun.write()` for file ops
   - ✅ MUST use `Bun.env` for environment variables
   - ❌ NEVER use Node.js APIs (`fs/promises`, `process.env`)

4. **Real-Time Sync:**
   - ✅ MUST implement 3-second polling for sync (AC20)
   - ✅ MUST show loading indicator during sync
   - ✅ MUST support pull-to-refresh for manual sync

5. **BDD Testing:**
   - ✅ MUST write tests BEFORE implementation
   - ✅ MUST use Given-When-Then format
   - ✅ MUST use business language, NOT technical terms

6. **File Length:**
   - ✅ All files MUST be ≤ 800 lines
   - ✅ Split large components if needed

### UX/UI Requirements

**From UX Design Specification:**

- **Responsive Design:**
  - Parent mini-program layout: <450px width (portrait optimization)
  - Large buttons for easy clicking
  - Clear visual hierarchy

- **Notification Tabs:**
  - Type tabs at top (all/task/points/wish/combo/system)
  - Unread count badge on each tab
  - Active tab highlighted
  - Click tab to filter notifications

- **Notification List:**
  - Card-based layout for each notification
  - Icon colored by type (task=blue, points=green, wish=purple, combo=orange, system=gray)
  - Sender avatar + name (child/admin/system)
  - Collapsed content (show more on click)
  - Relative timestamp (just now/2 min ago/today 3pm)

- **Action Buttons:**
  - Task notification → "查看审批" (navigate to approval)
  - Wish notification → "查看愿望" (navigate to wish)
  - Points notification → "查看积分" (navigate to history)
  - Combo notification → "查看Combo" (navigate to combo status)
  - System notification → "已读" button

- **Batch Actions:**
  - Swipe gesture to mark as read
  - "全部标记为已读" button for current type
  - Confirmation dialog before batch mark

- **Feedback:**
  - Loading states during data fetch
  - Network status indicator (green/orange/red)
  - Error toast with clear message

### Testing Standards Summary

**BDD Format (Given-When-Then):**

```typescript
// Example: Get all notifications
it('given 家长已登录，when 查询所有通知，then 返回通知列表和未读计数', async () => {
  // Given: 家长已登录
  const parent = await createParent();
  await createTestNotifications(parent);

  // When: 查询所有通知
  const res = await request(app)
    .get('/api/notifications')
    .set('Cookie', parent.session);

  // Then: 返回通知列表和未读计数
  expect(res.status).toBe(200);
  expect(res.body.notifications).toBeInstanceOf(Array);
  expect(res.body.unreadCounts).toHaveProperty('all');
  expect(res.body.unreadCounts.all).toBeGreaterThan(0);
});

// Example: Filter notifications by type
it('given 家长已登录，when 筛选任务通知，then 只返回任务类型通知', async () => {
  // Given: 家长已登录
  const parent = await createParent();

  // When: 筛选任务通知
  const res = await request(app)
    .get('/api/notifications?type=task')
    .set('Cookie', parent.session);

  // Then: 只返回任务类型通知
  expect(res.status).toBe(200);
  expect(res.body.notifications.every(n => n.type === 'task')).toBe(true);
});

// Example: Mark notification as read
it('given 未读通知存在，when 标记为已读，then 未读计数减少', async () => {
  // Given: 未读通知存在
  const parent = await createParent();
  const notification = await createUnreadNotification(parent);

  // When: 标记为已读
  const res = await request(app)
    .put(`/api/notifications/${notification.id}/read`)
    .set('Cookie', parent.session);

  // Then: 未读计数减少
  expect(res.status).toBe(200);
  expect(res.body.notification.isRead).toBe(true);
  const unreadCount = await getUnreadCount(parent.id);
  expect(unreadCount).toBe(0);
});

// Example: Batch mark all as read
it('given 家长已登录且有多个未读通知，when 批量标记为已读，then 所有通知变为已读', async () => {
  // Given: 家长已登录且有多个未读通知
  const parent = await createParent();
  await createTestNotifications(parent, 5); // 5 unread

  // When: 批量标记为已读
  const res = await request(app)
    .put('/api/notifications/read-all')
    .set('Cookie', parent.session)
    .send({ type: 'all' });

  // Then: 所有通知变为已读
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  const unreadCount = await getUnreadCount(parent.id);
  expect(unreadCount).toBe(0);
});
```

**Test Coverage Requirements:**
- API endpoints: 100% coverage
- Query functions: 95%+ coverage
- E2E tests: Main workflows (filter, mark as read, pagination)
- Performance tests: Verify page load time < 3 seconds

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
