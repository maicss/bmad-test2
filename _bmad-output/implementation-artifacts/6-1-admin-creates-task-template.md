# Story 6.1: Admin Creates Task Template

Status: ready-for-dev

## Story

As a **管理员**,
I want **为系统创建任务模板**,
So that **家长可以快速复制使用，减少从零开始的设计负担**。

## Acceptance Criteria

**Given** 我已登录Family Reward系统并有管理员权限
**When** 我进入管理员"任务模板"管理页面并点击"创建新模板"按钮
**Then** 系统显示任务模板创建表单，包含：
  - 模板名称（必填，最多50字）
  - 适用年龄段选择器（6-8岁 / 9-12岁）
  - 任务列表编辑器（支持添加、编辑、删除、拖拽排序）
  - 每个任务配置：
    - 任务名称（必填）
    - 任务类型选择器（刷牙/学习/运动/家务）
    - 积分值（数字输入，1-100）
    - 循环规则选择（每日/每周/工作日/周末）
    - 可选：排除日期（日历选择器）
  - 循环规则配置：
    - 每日任务列表预览（未来7天）
    - "保存为草稿"和"发布"按钮（两步流程）
**And** 模板保存为草稿后，仅管理员可见
**And** 点击"发布"按钮时，显示确认对话框："发布后，所有家长都能看到此模板"
**And** 发布成功后，模板状态变为"已发布"，对所有家长可见
**And** 模板数据存储在`admin_templates`表中，包含`is_published`、`reference_count`字段
**And** 发布后，家长在任务计划页面的"使用模板"tab中可以看到新模板
**And** 创建成功后，显示成功提示："任务模板创建成功"
**And** 操作记录到审计日志（NFR14）
**And** API响应时间<500ms（NFR3: P95）
**And** 参考Architecture: 管理员模板存储在`admin_templates`表中，家长任务计划通过`template_id`外键引用

## Tasks / Subtasks

- [ ] Task 1: Create database schema and migration for admin_templates (AC: Given/Then)
  - [ ] Subtask 1.1: Design admin_templates table schema in database/schema/
  - [ ] Subtask 1.2: Create Drizzle migration file in database/migrations/
  - [ ] Subtask 1.3: Run migration to create admin_templates table
  - [ ] Subtask 1.4: Add audit log entry (NFR14)

- [ ] Task 2: Create database query functions (AC: Then)
  - [ ] Subtask 2.1: Create lib/db/queries/admin-templates.ts
  - [ ] Subtask 2.2: Implement createTemplate() function
  - [ ] Subtask 2.3: Implement updateTemplate() function (draft → publish)
  - [ ] Subtask 2.4: Implement getTemplateById() function
  - [ ] Subtask 2.5: Implement listTemplates() function (with filters)

- [ ] Task 3: Create API endpoints (AC: When/Then)
  - [ ] Subtask 3.1: Create POST /api/admin/templates endpoint (create template)
  - [ ] Subtask 3.2: Create PUT /api/admin/templates/[id] endpoint (update/publish)
  - [ ] Subtask 3.3: Create GET /api/admin/templates endpoint (list templates)
  - [ ] Subtask 3.4: Create GET /api/admin/templates/[id] endpoint (get template)
  - [ ] Subtask 3.5: Add admin authentication middleware
  - [ ] Subtask 3.6: Validate request data (Zod schemas)

- [ ] Task 4: Create admin task template page (AC: When)
  - [ ] Subtask 4.1: Create app/admin/templates/page.tsx (template list view)
  - [ ] Subtask 4.2: Create app/admin/templates/create/page.tsx (create form)
  - [ ] Subtask 4.3: Create components/forms/admin-template-form.tsx
  - [ ] Subtask 4.4: Create components/features/task-list-editor.tsx (drag & drop)
  - [ ] Subtask 4.5: Create components/features/calendar-preview.tsx (7-day preview)

- [ ] Task 5: Implement template creation form UI (AC: When/Then)
  - [ ] Subtask 5.1: Add template name input (required, max 50 chars)
  - [ ] Subtask 5.2: Add age group selector (6-8 / 9-12)
  - [ ] Subtask 5.3: Add task list editor with CRUD operations
  - [ ] Subtask 5.4: Add task configuration form (name, type, points, recurrence)
  - [ ] Subtask 5.5: Add date exclusion picker (calendar)
  - [ ] Subtask 5.6: Add 7-day task preview (calendar view)

- [ ] Task 6: Implement draft → publish workflow (AC: Then)
  - [ ] Subtask 6.1: Add "Save as Draft" button (stores template with is_published=false)
  - [ ] Subtask 6.2: Add "Publish" button with confirmation dialog
  - [ ] Subtask 6.3: Implement publish confirmation: "发布后，所有家长都能看到此模板"
  - [ ] Subtask 6.4: Update template status to is_published=true on publish
  - [ ] Subtask 6.5: Update reference_count on parent copy (future story)

- [ ] Task 7: Add validation and error handling (AC: NFR14, NFR3)
  - [ ] Subtask 7.1: Validate required fields (Zod schemas)
  - [ ] Subtask 7.2: Add error messages for validation failures
  - [ ] Subtask 7.3: Add Shadcn Toast notifications for success/error
  - [ ] Subtask 7.4: Log audit trail for all operations

- [ ] Task 8: Write BDD tests (AC: NFR14, NFR3)
  - [ ] Subtask 8.1: Write integration tests for API endpoints
  - [ ] Subtask 8.2: Write unit tests for query functions
  - [ ] Subtask 8.3: Write E2E tests with Playwright (create draft → publish)
  - [ ] Subtask 8.4: Verify API response time < 500ms

## Dev Notes

### Technical Stack & Requirements

**Core Technologies:**
- Bun 1.3.x+ (runtime)
- Next.js 16.1.6 + React 19.2.3
- Drizzle ORM 0.45.1+ (database queries)
- TypeScript 5 strict mode
- Shadcn UI 3.7.0+ (UI components)
- Tailwind CSS 4 (styling)

**Database Schema:**
```typescript
// database/schema/admin-templates.ts
import { sqliteTable, text, integer, timestamp } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const adminTemplates = sqliteTable('admin_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ageGroup: text('age_group', { enum: ['6-8', '9-12'] }).notNull(),
  tasksJson: text('tasks_json').notNull(), // JSON array of task configurations
  description: text('description'),
  iconUrl: text('icon_url'),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false).notNull(),
  referenceCount: integer('reference_count').default(0).notNull(),
  createdBy: text('created_by').notNull(), // admin user ID
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type AdminTemplate = typeof adminTemplates.$inferSelect;
export type NewAdminTemplate = typeof adminTemplates.$inferInsert;
```

**API Endpoints:**

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/admin/templates` | Create new template (draft) | Admin |
| PUT | `/api/admin/templates/[id]` | Update template / publish | Admin |
| GET | `/api/admin/templates` | List templates (with filters) | Admin |
| GET | `/api/admin/templates/[id]` | Get template details | Admin |
| DELETE | `/api/admin/templates/[id]` | Delete/unpublish template | Admin |

**Request/Response DTOs:**

```typescript
// Create Template Request
{
  name: string; // max 50 chars
  ageGroup: '6-8' | '9-12';
  tasks: Array<{
    name: string;
    type: 'brushing' | 'studying' | 'exercise' | 'housework';
    points: number; // 1-100
    recurrence: 'daily' | 'weekly' | 'weekdays' | 'weekends';
    excludeDates?: string[]; // ISO date strings
  }>;
  description?: string;
  iconUrl?: string;
}

// Publish Template Request
{
  isPublished: true;
}

// Template Response
{
  id: string;
  name: string;
  ageGroup: string;
  tasks: Task[];
  description?: string;
  iconUrl?: string;
  isPublished: boolean;
  referenceCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Project Structure Notes

**Files to Create/Modify:**

```
database/schema/
├── admin-templates.ts      # NEW: Table schema

database/migrations/
├── xxx_create_admin_templates.sql  # NEW: Migration

lib/db/queries/
├── admin-templates.ts      # NEW: Query functions

app/admin/templates/
├── page.tsx               # NEW: Template list
├── create/
│   └── page.tsx           # NEW: Create form

components/forms/
├── admin-template-form.tsx  # NEW: Template creation/edit form

components/features/
├── task-list-editor.tsx    # NEW: Drag & drop task list
└── calendar-preview.tsx     # NEW: 7-day preview

tests/integration/
├── admin-templates.spec.ts  # NEW: API tests

tests/e2e/
├── admin-templates.spec.ts  # NEW: E2E tests
```

**Alignment with Unified Project Structure:**

- ✅ Schema in `database/schema/` (per architecture)
- ✅ Queries in `lib/db/queries/` (per-table file pattern)
- ✅ API routes in `app/api/admin/templates/` (RESTful pattern)
- ✅ Components in `components/forms/` and `components/features/`
- ✅ Tests in `tests/integration/` and `tests/e2e/`
- ✅ No conflicts detected

### References

- **Architecture Decision:** ADR-2 (Database: SQLite → PostgreSQL upgrade path)
- **Database Pattern:** ADR-5 (Function-based queries, NOT Repository pattern)
- **API Pattern:** [Source: docs/TECH_SPEC_API.md#REST-endpoints]
- **Component System:** [Source: docs/TECH_SPEC_ARCHITECTURE.md#component-boundaries]
- **Testing Standard:** [Source: docs/TECH_SPEC_BDD.md#Given-When-Then]
- **Admin Auth:** [Source: docs/TECH_SPEC_DATABASE.md#admin-templates-table]
- **Template Usage Logic:** [Source: _bmad-output/planning-artifacts/ux-design-specification.md#admin-template-usage-logic]

### Critical Implementation Constraints

**🔴 RED LIST - MUST OBEY:**

1. **Database Operations:**
   - ✅ MUST use Drizzle ORM query builder
   - ❌ NEVER use raw SQL
   - ❌ NEVER write SQL in components/routes
   - ✅ All queries MUST be in `lib/db/queries/admin-templates.ts`

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

- **Task List Editor:**
  - Drag & drop for reordering
  - Add/Edit/Delete buttons for each task
  - Collapsible task configuration

- **Calendar Preview:**
  - 7-day view showing generated tasks
  - Visual representation of recurrence patterns

- **Feedback:**
  - Success toast: "任务模板创建成功"
  - Error toast with clear message
  - Loading states during API calls

### Testing Standards Summary

**BDD Format (Given-When-Then):**

```typescript
// Example: Create template as draft
it('given 管理员已登录，when 创建草稿任务模板，then 模板保存为草稿状态', async () => {
  // Given: 管理员已登录
  const admin = await createAdmin();

  // When: 创建草稿任务模板
  const res = await request(app)
    .post('/api/admin/templates')
    .set('Cookie', admin.session)
    .send({
      name: '日常习惯模板',
      ageGroup: '6-8',
      tasks: [...],
      isPublished: false
    });

  // Then: 模板保存为草稿状态
  expect(res.status).toBe(201);
  expect(res.body.template.isPublished).toBe(false);
  expect(res.body.template.referenceCount).toBe(0);
});

// Example: Publish template
it('given 草稿模板存在，when 管理员发布模板，then 显示确认对话框并发布成功', async () => {
  // Given: 草稿模板存在
  const template = await createDraftTemplate();

  // When: 管理员发布模板
  const res = await request(app)
    .put(`/api/admin/templates/${template.id}`)
    .send({ isPublished: true });

  // Then: 显示确认对话框并发布成功
  expect(res.status).toBe(200);
  expect(res.body.template.isPublished).toBe(true);
});
```

**Test Coverage Requirements:**
- API endpoints: 100% coverage
- Query functions: 95%+ coverage
- E2E tests: Main workflows (create draft → publish)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
