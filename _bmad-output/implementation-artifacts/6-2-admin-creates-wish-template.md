# Story 6.2: Admin Creates Wish Template

Status: ready-for-dev

## Story

As a **管理员**,
I want **为系统创建愿望模板**,
So that **家长可以快速为孩子设置合理的愿望门槛**。

## Acceptance Criteria

**Given** 我已登录Family Reward系统并有管理员权限
**When** 我进入管理员"愿望模板"管理页面并点击"创建新模板"按钮
**Then** 系统显示愿望模板创建表单，包含：
  - 模板名称（必填，最多50字）
  - 适用年龄段选择器（6-8岁 / 9-12岁）
  - 愿望列表编辑器（支持添加、编辑、删除）
  - 每个愿望配置：
     - 愿望名称（必填）
     - 积分要求范围（默认500分，可配置）
     - 建议物品类别（玩具/活动/书籍）
     - 可选：预设图标选择器
  - "保存为草稿"和"发布"按钮（两步流程）
**And** 模板保存为草稿后，仅管理员可见
**And** 点击"发布"按钮时，显示确认对话框："发布后，所有家长都能看到此模板"
**And** 发布成功后，模板状态变为"已发布"，对所有家长可见
**And** 家长在创建愿望时可以浏览管理员模板并一键复制
**And** 创建成功后，显示成功提示："愿望模板创建成功"
**And** 操作记录到审计日志（NFR14）
**And** API响应时间<500ms（NFR3: P95）
**And** 参考Architecture: 愿望模板存储在`admin_templates`表中

## Tasks / Subtasks

- [ ] Task 1: Extend admin_templates schema for wish templates (AC: Given/Then)
  - [ ] Subtask 1.1: Add template_type field (task/wish/combo) to admin_templates
  - [ ] Subtask 1.2: Create migration to extend admin_templates table
  - [ ] Subtask 1.3: Run migration
  - [ ] Subtask 1.4: Add audit log entry (NFR14)

- [ ] Task 2: Create database query functions for wish templates (AC: Then)
  - [ ] Subtask 2.1: Extend lib/db/queries/admin-templates.ts
  - [ ] Subtask 2.2: Implement createWishTemplate() function
  - [ ] Subtask 2.3: Implement listWishTemplates() function (filter by type)
  - [ ] Subtask 2.4: Implement getTemplateById() function

- [ ] Task 3: Extend API endpoints for wish templates (AC: When/Then)
  - [ ] Subtask 3.1: Extend POST /api/admin/templates endpoint (support template_type)
  - [ ] Subtask 3.2: Extend GET /api/admin/templates endpoint (filter by type)
  - [ ] Subtask 3.3: Validate wish template data (Zod schemas)
  - [ ] Subtask 3.4: Add admin authentication middleware

- [ ] Task 4: Create admin wish template page (AC: When)
  - [ ] Subtask 4.1: Create app/admin/wish-templates/page.tsx (list view)
  - [ ] Subtask 4.2: Create app/admin/wish-templates/create/page.tsx (create form)
  - [ ] Subtask 4.3: Create components/forms/wish-template-form.tsx
  - [ ] Subtask 4.4: Create components/features/wish-list-editor.tsx

- [ ] Task 5: Implement wish template creation form UI (AC: When/Then)
  - [ ] Subtask 5.1: Add template name input (required, max 50 chars)
  - [ ] Subtask 5.2: Add age group selector (6-8 / 9-12)
  - [ ] Subtask 5.3: Add wish list editor with CRUD operations
  - [ ] Subtask 5.4: Add wish configuration form (name, points range, category, icon)
  - [ ] Subtask 5.5: Add icon picker (preset icons)

- [ ] Task 6: Implement draft → publish workflow (AC: Then)
  - [ ] Subtask 6.1: Add "Save as Draft" button (stores template with is_published=false, type='wish')
  - [ ] Subtask 6.2: Add "Publish" button with confirmation dialog
  - [ ] Subtask 6.3: Implement publish confirmation: "发布后，所有家长都能看到此模板"
  - [ ] Subtask 6.4: Update template status to is_published=true on publish

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

### Database Schema Extensions

**Extended admin_templates table:**
```typescript
// database/schema/admin-templates.ts - EXTENDED
import { sqliteTable, text, integer, timestamp } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const adminTemplates = sqliteTable('admin_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  templateType: text('template_type', { enum: ['task', 'wish', 'combo'] }).notNull(), // NEW FIELD
  ageGroup: text('age_group', { enum: ['6-8', '9-12'] }).notNull(),
  dataJson: text('data_json').notNull(), // JSON array of wish/task/combo configurations
  description: text('description'),
  iconUrl: text('icon_url'),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false).notNull(),
  referenceCount: integer('reference_count').default(0).notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type AdminTemplate = typeof adminTemplates.$inferSelect;
export type NewAdminTemplate = typeof adminTemplates.$inferInsert;
```

**Wish Template Data Structure:**
```typescript
// Data structure for dataJson field when template_type = 'wish'
{
  name: string;
  ageGroup: '6-8' | '9-12';
  wishes: Array<{
    name: string;
    pointsRange: {
      min: number;
      max: number;
      default: number;
    };
    category: 'toy' | 'activity' | 'book';
    iconUrl?: string;
  }>;
  description?: string;
  iconUrl?: string;
}
```

**API Endpoints:**

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/admin/templates` | Create new template (task/wish/combo) | Admin |
| PUT | `/api/admin/templates/[id]` | Update template / publish | Admin |
| GET | `/api/admin/templates?type=wish` | List wish templates (with filters) | Admin |
| GET | `/api/admin/templates/[id]` | Get template details | Admin |
| DELETE | `/api/admin/templates/[id]` | Delete/unpublish template | Admin |

**Request/Response DTOs:**

```typescript
// Create Wish Template Request
{
  templateType: 'wish'; // NEW: discriminating field
  name: string; // max 50 chars
  ageGroup: '6-8' | '9-12';
  data: {
    wishes: Array<{
      name: string;
      pointsRange: {
        min: number;
        max: number;
        default: number;
      };
      category: 'toy' | 'activity' | 'book';
      iconUrl?: string;
    }>;
  };
  description?: string;
  iconUrl?: string;
}

// Publish Template Request
{
  isPublished: true;
}

// Template Response (same for task/wish/combo)
{
  id: string;
  name: string;
  templateType: 'task' | 'wish' | 'combo';
  ageGroup: string;
  data: object; // type-specific data structure
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
├── admin-templates.ts      # MODIFY: Add template_type field

database/migrations/
├── xxx_extend_admin_templates.sql  # NEW: Migration for template_type

lib/db/queries/
├── admin-templates.ts      # MODIFY: Add wish template functions

app/admin/wish-templates/
├── page.tsx               # NEW: Wish template list
└── create/
    └── page.tsx           # NEW: Create form

components/forms/
├── wish-template-form.tsx   # NEW: Wish template creation/edit form

components/features/
├── wish-list-editor.tsx     # NEW: Wish list editor
```

**Alignment with Unified Project Structure:**

- ✅ Schema extended in `database/schema/admin-templates.ts` (per architecture)
- ✅ Queries in `lib/db/queries/admin-templates.ts` (per-table file pattern)
- ✅ API routes extended in `app/api/admin/templates/` (RESTful pattern)
- ✅ Components in `components/forms/` and `components/features/`
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

- **Wish List Editor:**
  - Add/Edit/Delete buttons for each wish
  - Visual representation of points range (min-default-max)
  - Category icons for toy/activity/book

- **Feedback:**
  - Success toast: "愿望模板创建成功"
  - Error toast with clear message
  - Loading states during API calls

### Testing Standards Summary

**BDD Format (Given-When-Then):**

```typescript
// Example: Create wish template as draft
it('given 管理员已登录，when 创建草稿愿望模板，then 模板保存为草稿状态', async () => {
  // Given: 管理员已登录
  const admin = await createAdmin();

  // When: 创建草稿愿望模板
  const res = await request(app)
    .post('/api/admin/templates')
    .set('Cookie', admin.session)
    .send({
      templateType: 'wish',
      name: '奖励愿望模板',
      ageGroup: '6-8',
      data: {
        wishes: [...]
      },
      isPublished: false
    });

  // Then: 模板保存为草稿状态
  expect(res.status).toBe(201);
  expect(res.body.template.templateType).toBe('wish');
  expect(res.body.template.isPublished).toBe(false);
  expect(res.body.template.referenceCount).toBe(0);
});

// Example: Publish wish template
it('given 草稿愿望模板存在，when 管理员发布模板，then 显示确认对话框并发布成功', async () => {
  // Given: 草稿愿望模板存在
  const template = await createDraftWishTemplate();

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
