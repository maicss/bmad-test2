# Story 4.11: Wish Created Notification to Parent

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 在孩子创建愿望时通知家长,
So that 家长可以及时审核愿望。

## Acceptance Criteria

1. Given 孩子创建了愿望
2. When 愿望状态变为"等待家长审核"
3. Then 系统推送通知给家长，包含：
   - 通知标题："新愿望待审核"
   - 通知内容："{孩子姓名}创建了新愿望「{愿望名称}」，请审核"
   - 点击通知跳转到审核页面
4. And 通知在3秒内送达（NFR4: 实时数据同步延迟 < 3秒）
5. And 通知存储在`notifications`表中，类型为"wish_created"
6. And 如果家长设备离线，通知存储在服务器，待家长上线后同步

## Tasks / Subtasks

- [ ] Task 1: Create notification when wish is created (AC: 1, 2, 5)
  - [ ] Subtask 1.1: Create database insert function for wish_created notification
  - [ ] Subtask 1.2: Call notification function after wish creation API endpoint
- [ ] Task 2: Implement push notification delivery (AC: 3, 4, 6)
  - [ ] Subtask 2.1: Set up PWA Service Worker for push notifications
  - [ ] Subtask 2.2: Create notification sender service with Web Push API
  - [ ] Subtask 2.3: Ensure notification delivery within 3 seconds
- [ ] Task 3: Handle notification click action (AC: 3)
  - [ ] Subtask 3.1: Configure notification click to navigate to wish review page
  - [ ] Subtask 3.2: Handle offline queue for delayed delivery
- [ ] Task 4: Test notification flow end-to-end (AC: all)
  - [ ] Subtask 4.1: Write BDD tests for wish creation notification
  - [ ] Subtask 4.2: Test notification delivery timing (< 3 seconds)
  - [ ] Subtask 4.3: Test offline scenario and queue synchronization

## Dev Notes

### Technical Requirements

**MUST FOLLOW RED LIST RULES:**
- ❌ **禁止使用原生 SQL** - 必须使用 Drizzle ORM
- ❌ **禁止字符串拼接 SQL** - 必须使用 Drizzle 的查询构建器
- ❌ **禁止在组件/路由中直接写 SQL** - 所有查询必须封装到 `lib/db/queries/` 目录下，按表分文件存储（如 `lib/db/queries/wishes.ts`, `lib/db/queries/notifications.ts`）
- ❌ **使用 `any` 类型** - 必须用 `unknown` + 类型守卫
- ❌ **使用 `@ts-ignore` / `@ts-expect-error`** - 必须修复类型错误
- ❌ **使用 Node.js 兼容层** - 如 `node-fetch`, `node-crypto`, `fs/promises`
- ❌ **使用 `process.env`** - 改用 `Bun.env`
- ❌ **使用 `alert()` 显示错误** - 必须用 Shadcn Dialog/Toast

**Tech Stack (Locked):**
- Bun 1.3.x+ runtime
- Next.js 16.x + React 19.x
- bun:sqlite + Drizzle ORM 0.45.x+
- Better-Auth 1.4.x
- Tailwind CSS 4 + Shadcn UI 3.7.0+
- TypeScript 5 strict mode
- Zustand for state management
- Bun Test + Playwright for testing (BDD style)

### Architecture Patterns

**Database Query Pattern (ADR-5):**
- Location: `lib/db/queries/` directory with per-table files
- Pattern: Function-based queries (NOT Repository pattern)
- Example:
  ```typescript
  // lib/db/queries/notifications.ts
  import { db } from '@/lib/db';
  import { notifications, users } from '@/lib/db/schema';
  import { eq, and } from 'drizzle-orm';

  export async function createWishCreatedNotification(data: {
    userId: string; // Parent user ID
    childId: string;
    wishId: string;
    wishName: string;
    childName: string;
  }) {
    return await db.insert(notifications).values({
      type: 'wish_created',
      title: '新愿望待审核',
      content: `${data.childName}创建了新愿望「${data.wishName}」，请审核`,
      userId: data.userId,
      data: {
        wishId: data.wishId,
        childId: data.childId,
        actionUrl: `/parent/wishlist/review/${data.wishId}`
      },
      read: false,
      createdAt: new Date(),
    }).returning();
  }
  ```

**PWA Push Notification Pattern:**
- Location: `public/sw/` for Service Worker modules
- Pattern: Web Push API + Service Worker
- Reference: Next.js 16 PWA documentation [Source: https://nextjs.org/docs/app/guides/progressive-web-apps]
- Key requirements:
  - Service Worker registration on app load
  - Push subscription management in browser
  - Server-side notification delivery via Web Push API
  - Background Sync API for offline queue

**Real-time Notification Strategy (ADR-1):**
- Phase 1: Polling (2-3 second interval) - MILESTONE
- Upgrade path: SSE (Server-Sent Events)
- Note: Must deliver notifications within 3 seconds (NFR4)

### Project Structure Notes

**Alignment with unified project structure:**

| Component | Location | Notes |
|-----------|----------|-------|
| **Wish Creation API** | `app/api/parent/wishlists/route.ts` | POST endpoint for creating wishes |
| **Notification Insert** | `lib/db/queries/notifications.ts` | Create function `createWishCreatedNotification()` |
| **Notification Service** | `lib/services/notification-sender.ts` | Push notification delivery logic |
| **Service Worker** | `public/sw/push-handler.js` | Handle push notifications and clicks |
| **Push API Route** | `app/api/push/route.ts` | Web Push subscription and delivery |
| **Wish Review Page** | `app/(parent)/wishlist/review/[id]/page.tsx` | Destination for notification click |

**Naming Conventions (Project-wide):**
- Files: kebab-case (e.g., `notification-sender.ts`)
- Functions: camelCase (e.g., `createWishCreatedNotification`)
- Components: PascalCase (e.g., `NotificationList`)
- Variables: camelCase
- Database tables: snake_case (e.g., `wish_lists`, `notifications`)

**File Length Constraint:**
- All files must be ≤ 800 lines
- If file exceeds limit, split into smaller components

### Database Schema Reference

**Relevant Tables (from architecture.md):**

```sql
-- notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'wish_created', 'wish_approved', 'wish_rejected', etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES users(id),
  data JSON, -- Stores related data (wishId, actionUrl, etc.)
  read BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- wishlists table
CREATE TABLE wishlists (
  id TEXT PRIMARY KEY,
  childId TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  pointsThreshold INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'approved', 'rejected'
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Database Query File to Create/Modify:**
- `lib/db/queries/notifications.ts` - Add `createWishCreatedNotification()` function
- `lib/db/queries/wishes.ts` - Reference for wish data structure

### API Integration Points

**Wish Creation Flow:**
1. Child creates wish → POST `/api/child/wishlists` (or parent endpoint if parent creates for child)
2. Backend saves wish to `wishlists` table with status='pending'
3. **NEW:** Backend calls `createWishCreatedNotification()` with parent userId
4. **NEW:** Backend triggers push notification delivery
5. Parent receives notification and clicks → navigates to `/parent/wishlist/review/{wishId}`

**Parent User Lookup:**
- Must find parent user IDs associated with the child's family
- Use `lib/db/queries/users.ts`: `getParentsByChildId(childId)`

### Cross-Cutting Concerns

**Real-time Data Consistency:**
- Notifications must be delivered within 3 seconds (NFR4)
- Use polling mechanism (2-3s interval) for initial implementation
- Consider SSE upgrade path for better performance

**Multi-Device Sync:**
- If parent has multiple devices, deliver to all registered devices
- Store push subscriptions in `users` table or separate `push_subscriptions` table
- Background Sync API for offline scenario

**Children's Privacy Compliance:**
- **CRITICAL:** COPPA (13岁以下), GDPR (16岁以下), 中国儿童保护（14岁以下）
- Notification content must NOT expose sensitive child information
- Wish name is acceptable (child creates it), but limit other details
- Audit log required for notification delivery (NFR14)

**PWA Requirements:**
- Service Worker must be registered on app load
- Push notification permission must be requested explicitly
- Offline queue: Store notifications if parent device is offline
- Network status indicator: Show green/orange/red for connectivity

### Testing Requirements (BDD Style)

**Test Format: Given-When-Then**
- Write tests BEFORE implementation (红-绿-重构)
- Use business language, NOT technical terms

**Example BDD Test:**
```typescript
// tests/integration/wish-notification.spec.ts
describe('Wish Created Notification Flow', () => {
  it('given 孩子已创建愿望，when 请求提交，then 系统创建通知并推送给家长', async () => {
    // Given: 孩子已登录且有家庭
    const child = await createChild();
    const parent = await createParent({ familyId: child.familyId });
    const wishData = {
      name: '乐高积木',
      pointsThreshold: 100,
    };

    // When: 孩子创建愿望
    const response = await request(app)
      .post('/api/child/wishlists')
      .set('Cookie', child.session)
      .send(wishData);

    // Then: 愿望创建成功
    expect(response.status).toBe(201);
    const wish = response.body.wish;
    expect(wish.status).toBe('pending');

    // And: 系统创建通知
    const notifications = await getNotificationsByUserId(parent.userId);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('wish_created');
    expect(notifications[0].title).toBe('新愿望待审核');
    expect(notifications[0].content).toContain(child.name);
    expect(notifications[0].content).toContain('乐高积木');

    // And: 通知包含跳转链接
    expect(notifications[0].data.actionUrl).toBe(`/parent/wishlist/review/${wish.id}`);
  });

  it('given 家长设备离线，when 孩子创建愿望，then 通知存储在服务器待上线后同步', async () => {
    // Given: 家长设备离线（模拟无 push subscription）
    const child = await createChild();
    const parent = await createParent({ familyId: child.familyId, pushSubscription: null });

    // When: 孩子创建愿望
    await request(app)
      .post('/api/child/wishlists')
      .set('Cookie', child.session)
      .send({ name: '自行车', pointsThreshold: 200 });

    // Then: 通知存储在服务器
    const notifications = await getNotificationsByUserId(parent.userId);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].read).toBe(false);

    // And: 推送未执行（家长离线）
    // Verify no push was sent
  });

  it('given 通知已创建，when 家长设备上线，then 通知立即推送', async () => {
    // Given: 通知已存在（家长离线时创建的愿望）
    const notification = await createNotification({ type: 'wish_created' });
    const parent = await getUserById(notification.userId);

    // When: 家长设备上线（注册 push subscription）
    await registerPushSubscription(parent.userId, mockPushSubscription);

    // Then: 离线通知立即推送
    // Verify push notification sent
    expect(pushNotificationSpy).toHaveBeenCalledWith(
      mockPushSubscription,
      expect.objectContaining({
        title: '新愿望待审核',
      })
    );
  });
});
```

**Test Files to Create:**
- `tests/integration/wish-notification.spec.ts` - Integration tests for notification flow
- `tests/unit/lib/services/notification-sender.spec.ts` - Unit tests for notification service
- `tests/e2e/wishlist.spec.ts` - E2E tests including notification verification

### Performance Requirements

- API response time < 500ms (P95) for wish creation endpoint
- Notification delivery < 3 seconds (NFR4)
- Service Worker registration < 1 second
- Push notification delivery to all devices < 1 second per device

### Security Requirements

- Notifications must be delivered only to authorized parents (RBAC)
- Validate parent-child relationship before creating notification
- Sanitize notification content (prevent XSS)
- Use HttpOnly Cookie for session management (Better-Auth)
- Audit log all notification deliveries (NFR14)

### Error Handling

**Shadcn UI Components Required:**
- `Dialog` - For error display (NOT `alert()`)
- `Toast` - For success/error notifications
- `Alert` - For offline status indicator

**Error Scenarios:**
1. Parent not found → Show error toast, log to audit
2. Wish creation fails → Do NOT create notification, show error dialog
3. Push notification fails → Store notification in database, retry on next poll
4. Service Worker not supported → Fallback to in-app notifications only

### References

**Source Documents:**
- Epics and Stories: [Source: _bmad-output/planning-artifacts/epics.md#Epic-4]
- Story 4.11 details: [Source: _bmad-output/planning-artifacts/epics.md#Story-4.11]
- Architecture ADRs: [Source: _bmad-output/planning-artifacts/architecture.md#Architecture-Decision-Records]
- Database schema: [Source: _bmad-output/planning-artifacts/architecture.md#Database-Schema]
- PWA guidelines: [Source: _bmad-output/planning-artifacts/architecture.md#PWA-Support]
- NFR4 real-time requirement: [Source: _bmad-output/planning-artifacts/epics.md#NonFunctionalRequirements]

**Technical References:**
- Next.js 16 PWA Documentation: https://nextjs.org/docs/app/guides/progressive-web-apps
- Web Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- Better-Auth 1.4.x: [Source: _bmad-output/planning-artifacts/architecture.md#ADR-3]

**Project Documentation:**
- TECH_SPEC_DATABASE.md - Database patterns and constraints
- TECH_SPEC_PWA.md - PWA implementation guidelines
- TECH_SPEC_BDD.md - BDD testing standards
- TECH_SPEC_LOGGING.md - Logging and audit requirements

## Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

None

### Completion Notes List

Ultimate context engine analysis completed - comprehensive developer guide created

### File List

- `lib/db/queries/notifications.ts` - Add createWishCreatedNotification()
- `app/api/child/wishlists/route.ts` - Modify to call notification function
- `lib/services/notification-sender.ts` - Create if not exists
- `public/sw/push-handler.js` - Service Worker for push notifications
- `public/sw/sw.js` - Service worker entry point
- `tests/integration/wish-notification.spec.ts` - BDD integration tests
- `tests/unit/lib/services/notification-sender.spec.ts` - Unit tests
- `app/(parent)/wishlist/review/[id]/page.tsx` - Wish review page (destination)
- `components/features/notification-list.tsx` - Update to show wish notifications
- `public/manifest.json` - Ensure PWA manifest includes push settings
