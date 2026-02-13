# Story 6.6: Admin Sends System Announcement

Status: ready-for-dev

## Story

As a **管理员**,
I want **向所有家长发送系统公告或重要通知**,
So that **家长可以了解系统更新、新功能发布、重要事件**。

## Acceptance Criteria

**Given** 我已登录Family Reward系统并有管理员权限
**When** 我进入管理员"系统通知"页面并点击"发送通知"按钮
**Then** 系统显示通知发送表单，包含：
  - 通知类型选择器：
     - 系统公告（默认）
     - 新功能发布
     - 重要提醒
     - 活动通知
  - 标题输入框（必填，最多100字）
  - 内容输入框（必填，最多500字，支持Markdown格式）
  - 目标群体选择器：
     - 所有家长
     - 特定年龄段（可选）
     - 特定家庭ID（可选）
  - 发送方式：
     - 立即发送：推送到所有在线家长设备
     - 定时发送：选择具体时间发送
  - 发布开关：
     - 草稿：保存后不立即发送
     - 发布：立即推送通知
**And** 当我输入完标题和内容后，可以点击"预览"按钮查看最终效果
**Then** 预览显示在对话框中，支持Markdown渲染（标题加粗、列表格式、链接）
**And** 如果选择"立即发送"，验证内容是否为空
**And** 点击"发送"按钮后，通知推送到所有家长设备（PWA和小程序）
**Then** 通知内容显示在家长"通知中心"页面（已从Epic 6迁移）
**Then** 通知在PWA中显示为弹窗或横幅，在小程序中显示为消息条
**Then** 通知包含：
  - 管理员头像和姓名
  - 发送时间
  - 通知类型标签（不同颜色）
  - 标题和内容
  - 阅读状态（未读/已读）
**And** 发送成功后，显示成功提示："通知已发送到X个家长"
**And** 通知记录存储在`notifications`表中，关联到所有家长账户
**And** 家长可以标记通知为已读
**And** 操作记录到审计日志（NFR14）
**And** 通知类型标记为"系统公告"（便于家长筛选）
**And** API响应时间<500ms（NFR3: P95）
**And** 参考Architecture: 使用`lib/notifications/push.ts`服务发送通知
**And** 参考FR54: 管理员可以向家长发送系统通知

## Tasks / Subtasks

- [ ] Task 1: Verify/extend database schema for notifications (AC: Then)
  - [ ] Subtask 1.1: Review notifications table schema in database/schema/
  - [ ] Subtask 1.2: Add admin-specific fields if needed (admin_id, system_announcement flag)
  - [ ] Subtask 1.3: Create migration if schema changes needed
  - [ ] Subtask 1.4: Add audit log entry (NFR14)

- [ ] Task 2: Create database query functions for notifications (AC: Then)
  - [ ] Subtask 2.1: Create lib/db/queries/notifications.ts
  - [ ] Subtask 2.2: Implement createSystemAnnouncement() function
  - [ ] Subtask 2.3: Implement bulkCreateNotifications() function (for all parents)
  - [ ] Subtask 2.4: Implement markNotificationAsRead() function
  - [ ] Subtask 2.5: Implement getNotificationStats() function

- [ ] Task 3: Create API endpoints for system announcements (AC: When/Then)
  - [ ] Subtask 3.1: Create POST /api/admin/announcements endpoint (create announcement)
  - [ ] Subtask 3.2: Create GET /api/admin/announcements/[id] endpoint (preview announcement)
  - [ ] Subtask 3.3: Create GET /api/admin/announcements endpoint (list announcements)
  - [ ] Subtask 3.4: Add admin authentication middleware
  - [ ] Subtask 3.5: Validate request data (Zod schemas)
  - [ ] Subtask 3.6: Implement scheduled sending (background job placeholder)

- [ ] Task 4: Create admin announcement page (AC: When)
  - [ ] Subtask 4.1: Create app/admin/announcements/page.tsx (list view)
  - [ ] Subtask 4.2: Create app/admin/announcements/create/page.tsx (create form)
  - [ ] Subtask 4.3: Create components/forms/announcement-form.tsx
  - [ ] Subtask 4.4: Create components/features/announcement-preview.tsx (markdown preview)
  - [ ] Subtask 4.5: Create components/features/markdown-editor.tsx (rich text placeholder)

- [ ] Task 5: Implement announcement creation form UI (AC: When/Then)
  - [ ] Subtask 5.1: Add notification type selector (system/update/reminder/activity)
  - [ ] Subtask 5.2: Add title input (required, max 100 chars)
  - [ ] Subtask 5.3: Add content input (required, max 500 chars, markdown support)
  - [ ] Subtask 5.4: Add target group selector (all parents / age group / specific families)
  - [ ] Subtask 5.5: Add send method selector (immediate / scheduled)
  - [ ] Subtask 5.6: Add "Save as Draft" / "Publish" toggle
  - [ ] Subtask 5.7: Add "Preview" button for markdown rendering

- [ ] Task 6: Implement announcement sending workflow (AC: Then)
  - [ ] Subtask 6.1: Add draft save functionality (stores announcement, does not send)
  - [ ] Subtask 6.2: Add publish confirmation dialog
  - [ ] Subtask 6.3: Implement immediate sending (push to all parent devices)
  - [ ] Subtask 6.4: Implement scheduled sending (background job placeholder)
  - [ ] Subtask 6.5: Create notifications for all parents in database
  - [ ] Subtask 6.6: Display success message: "通知已发送到X个家长"

- [ ] Task 7: Create notification preview modal (AC: Then)
  - [ ] Subtask 7.1: Create preview dialog modal (Shadcn Dialog)
  - [ ] Subtask 7.2: Render markdown content (title, lists, links)
  - [ ] Subtask 7.3: Display admin avatar and name
  - [ ] Subtask 7.4: Display notification type badge (colored)
  - [ ] Subtask 7.5: Show timestamp

- [ ] Task 8: Add validation and error handling (AC: NFR14, NFR3)
  - [ ] Subtask 8.1: Validate required fields (Zod schemas)
  - [ ] Subtask 8.2: Add error messages for validation failures
  - [ ] Subtask 8.3: Add Shadcn Toast notifications for success/error
  - [ ] Subtask 8.4: Log audit trail for all operations

- [ ] Task 9: Write BDD tests (AC: NFR14, NFR3)
  - [ ] Subtask 9.1: Write integration tests for API endpoints
  - [ ] Subtask 9.2: Write unit tests for query functions
  - [ ] Subtask 9.3: Write E2E tests with Playwright (create draft → preview → publish)
  - [ ] Subtask 9.4: Verify API response time < 500ms
  - [ ] Subtask 9.5: Verify notification creation for all parents

## Dev Notes

### Technical Stack & Requirements

**Core Technologies:**
- Bun 1.3.x+ (runtime)
- Next.js 16.1.6 + React 19.2.3
- Drizzle ORM 0.45.1+ (database queries)
- TypeScript 5 strict mode
- Shadcn UI 3.7.0+ (UI components)
- Tailwind CSS 4 (styling)

**Markdown Support:**
- Simple markdown rendering for announcement content
- Bold, lists, links support
- Use Shadcn UI components for preview

### Database Schema Extensions

**Notifications table (extended if needed):**
```typescript
// database/schema/notifications.ts - REVIEW existing schema
import { sqliteTable, text, integer, timestamp, boolean } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // Recipient parent ID
  type: text('type', { enum: ['system', 'task', 'points', 'wish', 'combo'] }).notNull(),
  subtype: text('subtype'), // system, update, reminder, activity
  title: text('title').notNull(),
  content: text('content').notNull(), // Markdown format
  isRead: integer('is_read', { mode: 'boolean' }).default(false).notNull(),
  sentBy: text('sent_by'), // Admin user ID for system announcements
  scheduledFor: timestamp('scheduled_for'), // NULL for immediate, timestamp for scheduled
  sentAt: timestamp('sent_at'), // Actual send time
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
```

### API Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/admin/announcements` | Create announcement (draft/publish) | Admin |
| GET | `/api/admin/announcements/[id]` | Preview announcement | Admin |
| GET | `/api/admin/announcements` | List announcements (with filters) | Admin |
| DELETE | `/api/admin/announcements/[id]` | Delete announcement | Admin |
| PUT | `/api/admin/notifications/[id]/read` | Mark notification as read | Parent |

**Request/Response DTOs:**

```typescript
// Create Announcement Request
{
  type: 'system' | 'update' | 'reminder' | 'activity';
  title: string; // max 100 chars
  content: string; // max 500 chars, markdown
  targetGroup: {
    type: 'all' | 'age-group' | 'families';
    ageGroup?: '6-8' | '9-12';
    familyIds?: string[];
  };
  sendMethod: 'immediate' | 'scheduled';
  scheduledFor?: string; // ISO timestamp if scheduled
  isPublished: boolean; // false = draft, true = publish
}

// Create Announcement Response
{
  id: string;
  title: string;
  content: string;
  type: string;
  subtype: string;
  targetGroup: object;
  sendMethod: string;
  scheduledFor?: string;
  isPublished: boolean;
  createdAt: string;
  recipientsCount: number; // Number of parents notified
}

// Preview Response
{
  type: string;
  subtype: string;
  title: string;
  content: string;
  renderedMarkdown: string; // HTML preview
  sentBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
}
```

### Project Structure Notes

**Files to Create/Modify:**

```
database/schema/
├── notifications.ts       # REVIEW: Verify schema supports announcements

lib/db/queries/
├── notifications.ts        # EXTEND: Add announcement functions

lib/notifications/
├── push.ts               # REVIEW: Verify supports system announcements

app/admin/announcements/
├── page.tsx               # NEW: Announcement list
├── create/
│   └── page.tsx           # NEW: Create form

components/forms/
├── announcement-form.tsx   # NEW: Announcement creation/edit form

components/features/
├── announcement-preview.tsx  # NEW: Markdown preview modal
├── markdown-editor.tsx       # NEW: Simple markdown editor

tests/integration/
├── announcements.spec.ts  # NEW: API tests

tests/e2e/
├── announcements.spec.ts  # NEW: E2E tests
```

**Alignment with Unified Project Structure:**

- ✅ Schema in `database/schema/notifications.ts` (per architecture)
- ✅ Queries in `lib/db/queries/notifications.ts` (per-table file pattern)
- ✅ API routes in `app/api/admin/announcements/` (RESTful pattern)
- ✅ Components in `components/forms/` and `components/features/`
- ✅ No conflicts detected

### References

- **Architecture Decision:** ADR-5 (Function-based queries, NOT Repository pattern)
- **API Pattern:** [Source: docs/TECH_SPEC_API.md#REST-endpoints]
- **Component System:** [Source: docs/TECH_SPEC_ARCHITECTURE.md#component-boundaries]
- **Testing Standard:** [Source: docs/TECH_SPEC_BDD.md#Given-When-Then]
- **FR54:** [Source: _bmad-output/planning-artifacts/prd.md#FR54] 管理员可以向家长发送系统通知
- **Notification Center:** [Source: _bmad-output/planning-artifacts/epics.md#Story-6.7] Global Notification Center

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

4. **BDD Testing:**
   - ✅ MUST write tests BEFORE implementation
   - ✅ MUST use Given-When-Then format
   - ✅ MUST use business language, NOT technical terms

5. **File Length:**
   - ✅ All files MUST be ≤ 800 lines
   - ✅ Split large components if needed

### UX/UI Requirements

**From UX Design Specification:**

- **Responsive Design:**
  - Admin PC layout: ≥1024px width
  - Large buttons for easy clicking
  - Clear visual hierarchy

- **Form Design:**
  - "保存为草稿" and "发布" two-step workflow
  - Real-time validation feedback
  - Confirmation dialog before publishing
  - Markdown editor for content

- **Target Group Selector:**
  - "所有家长" (default)
  - Specific age group (6-8 / 9-12)
  - Specific family IDs (multi-select)

- **Send Method:**
  - Immediate: Push to all online devices immediately
  - Scheduled: Pick date/time for sending

- **Preview Modal:**
  - Render markdown content (bold, lists, links)
  - Show admin avatar and name
  - Display notification type badge (colored)
  - Show timestamp
  - "预览" button to open modal

- **Feedback:**
  - Success toast: "通知已发送到X个家长"
  - Error toast with clear message
  - Loading states during send

### Testing Standards Summary

**BDD Format (Given-When-Then):**

```typescript
// Example: Create announcement as draft
it('given 管理员已登录，when 创建草稿系统公告，then 公告保存为草稿状态', async () => {
  // Given: 管理员已登录
  const admin = await createAdmin();

  // When: 创建草稿系统公告
  const res = await request(app)
    .post('/api/admin/announcements')
    .set('Cookie', admin.session)
    .send({
      type: 'system',
      title: '系统更新通知',
      content: '# 系统更新\\n\\n我们将于本周进行系统维护...',
      targetGroup: { type: 'all' },
      sendMethod: 'immediate',
      isPublished: false // Draft
    });

  // Then: 公告保存为草稿状态
  expect(res.status).toBe(201);
  expect(res.body.announcement.isPublished).toBe(false);
  expect(res.body.announcement.subtype).toBe('system');
});

// Example: Publish announcement
it('given 草稿公告存在，when 管理员发布公告，then 向所有家长发送通知', async () => {
  // Given: 草稿公告存在
  const draft = await createDraftAnnouncement();
  const parents = await getAllParents(); // Mock multiple parents

  // When: 管理员发布公告
  const res = await request(app)
    .put(`/api/admin/announcements/${draft.id}`)
    .set('Cookie', admin.session)
    .send({ isPublished: true });

  // Then: 向所有家长发送通知
  expect(res.status).toBe(200);
  expect(res.body.announcement.isPublished).toBe(true);
  expect(res.body.announcement.recipientsCount).toBe(parents.length);
  // Verify notifications created for all parents
  const notifications = await getNotificationsForParents(parents.map(p => p.id));
  expect(notifications).toHaveLength(parents.length);
});

// Example: Preview announcement
it('given 草稿公告存在，when 管理员预览公告，then 显示Markdown渲染效果', async () => {
  // Given: 草稿公告存在
  const announcement = await createDraftAnnouncement();

  // When: 管理员预览公告
  const res = await request(app)
    .get(`/api/admin/announcements/${announcement.id}/preview`)
    .set('Cookie', admin.session);

  // Then: 显示Markdown渲染效果
  expect(res.status).toBe(200);
  expect(res.body.preview).toContain('<h1>'); // Markdown bold
  expect(res.body.preview).toContain('<ul>'); // Markdown list
  expect(res.body.preview).toContain('<a>'); // Markdown link
});

// Example: Verify notification appears in parent's notification center
it('given 系统公告已发送，when 家长查看通知中心，then 显示系统公告', async () => {
  // Given: 系统公告已发送
  const parent = await createParent();
  await publishSystemAnnouncement(parent);

  // When: 家长查看通知中心
  const res = await request(app)
    .get('/api/notifications')
    .set('Cookie', parent.session);

  // Then: 显示系统公告
  expect(res.status).toBe(200);
  const systemAnnouncement = res.body.notifications.find(n => n.subtype === 'system');
  expect(systemAnnouncement).toBeDefined();
  expect(systemAnnouncement.isRead).toBe(false);
});
```

**Test Coverage Requirements:**
- API endpoints: 100% coverage
- Query functions: 95%+ coverage
- E2E tests: Main workflows (create draft → preview → publish → verify delivery)
- Performance tests: Verify API response time < 500ms

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
