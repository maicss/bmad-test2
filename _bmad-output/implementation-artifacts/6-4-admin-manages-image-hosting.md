# Story 6.4: Admin Manages Image Hosting

Status: ready-for-dev

## Story

As a **管理员**,
I want **上传、查看和删除系统使用的图片**,
So that **家长可以为孩子的任务和愿望选择图标，保持系统整洁**。

## Acceptance Criteria

**Given** 我已登录Family Reward系统并有管理员权限
**When** 我进入管理员"图床管理"页面
**Then** 系统显示图床管理界面，包含：
  - 图片上传区域（拖拽上传或点击选择文件）
  - 图片列表（网格视图，每行显示图片预览、上传时间、文件大小）
  - 支持的图片格式：JPG、PNG、WebP、GIF
  - 上传文件大小限制：单图<2MB（NFR7: 性能要求）
  - 批量操作支持：多选删除
  - 图片分类标签：
    - 任务图标（刷牙、学习、运动）
    - 徽章图标（金/银/铜）
    - 愿望图片（玩具、活动、书籍）
  - 搜索框：按文件名或标签快速查找
  - 每张图片卡片显示：
     - 图片预览（200x200px）
     - 上传时间
     - 文件大小
     - 操作按钮：预览、下载、删除
**And** 当我点击"上传图片"并选择文件时
**Then** 系统验证图片格式和大小
**And** 图片上传到图床存储（本地目录或预留OSS接口）
**Then** 生成唯一文件名（UUID + 时间戳）避免冲突
**Then** 返回图片访问URL（如`/api/images/[filename]`）
**Then** 图片信息存储在`images`表中，包含：
  - 文件名、URL、上传时间、上传者（管理员ID）、文件大小、分类标签
**And** 上传成功后，图片自动添加到对应的分类标签
**And** 显示上传成功提示："图片上传成功"
**And** 如果是GIF格式，自动标记为"动画资源"
**And** 操作记录到审计日志（NFR14）
**And** API响应时间<1秒（图片上传可接受较慢）
**And** 参考Architecture: 图片存储在`images`表中，预留云OSS接口
**And** 参考FR52: 管理员可以管理图床（上传、查看、删除）

## Tasks / Subtasks

- [ ] Task 1: Create database schema for images table (AC: Given/Then)
  - [ ] Subtask 1.1: Design images table schema in database/schema/
  - [ ] Subtask 1.2: Create Drizzle migration file in database/migrations/
  - [ ] Subtask 1.3: Run migration to create images table
  - [ ] Subtask 1.4: Add audit log entry (NFR14)

- [ ] Task 2: Create database query functions for images (AC: Then)
  - [ ] Subtask 2.1: Create lib/db/queries/images.ts
  - [ ] Subtask 2.2: Implement uploadImage() function
  - [ ] Subtask 2.3: Implement listImages() function (with filters)
  - [ ] Subtask 2.4: Implement getImageById() function
  - [ ] Subtask 2.5: Implement deleteImage() function
  - [ ] Subtask 2.6: Implement deleteMultipleImages() function

- [ ] Task 3: Create API endpoints for image hosting (AC: When/Then)
  - [ ] Subtask 3.1: Create POST /api/admin/images/upload endpoint (multipart/form-data)
  - [ ] Subtask 3.2: Create GET /api/admin/images endpoint (list images with filters)
  - [ ] Subtask 3.3: Create GET /api/admin/images/[id] endpoint (get image details)
  - [ ] Subtask 3.4: Create DELETE /api/admin/images/[id] endpoint (delete single)
  - [ ] Subtask 3.5: Create DELETE /api/admin/images endpoint (batch delete)
  - [ ] Subtask 3.6: Create GET /api/images/[filename] endpoint (serve image file)
  - [ ] Subtask 3.7: Add admin authentication middleware
  - [ ] Subtask 3.8: Validate file formats (JPG, PNG, WebP, GIF)
  - [ ] Subtask 3.9: Validate file size < 2MB
  - [ ] Subtask 3.10: Generate unique filename (UUID + timestamp)

- [ ] Task 4: Create admin image management page (AC: When)
  - [ ] Subtask 4.1: Create app/admin/images/page.tsx (grid view)
  - [ ] Subtask 4.2: Create components/features/image-uploader.tsx (drag & drop)
  - [ ] Subtask 4.3: Create components/features/image-grid.tsx (grid display)
  - [ ] Subtask 4.4: Create components/features/image-card.tsx (preview + actions)
  - [ ] Subtask 4.5: Create components/forms/image-search-filter.tsx (search + filter)

- [ ] Task 5: Implement image upload functionality (AC: When/Then)
  - [ ] Subtask 5.1: Add drag & drop upload area
  - [ ] Subtask 5.2: Add file picker button
  - [ ] Subtask 5.3: Validate file format (JPG, PNG, WebP, GIF)
  - [ ] Subtask 5.4: Validate file size < 2MB
  - [ ] Subtask 5.5: Generate unique filename (Bun.randomUUIDv7() + timestamp)
  - [ ] Subtask 5.6: Upload file to storage (local directory or OSS placeholder)
  - [ ] Subtask 5.7: Store metadata in images table
  - [ ] Subtask 5.8: Auto-tag GIF files as "animation"

- [ ] Task 6: Implement image management features (AC: When/Then)
  - [ ] Subtask 6.1: Add image preview modal (200x200px)
  - [ ] Subtask 6.2: Add download button
  - [ ] Subtask 6.3: Add delete button (single)
  - [ ] Subtask 6.4: Add multi-select for batch delete
  - [ ] Subtask 6.5: Add category filter (task/badge/wish)
  - [ ] Subtask 6.6: Add search by filename or tag
  - [ ] Subtask 6.7: Display upload time and file size

- [ ] Task 7: Add validation and error handling (AC: NFR14)
  - [ ] Subtask 7.1: Add error messages for invalid format
  - [ ] Subtask 7.2: Add error messages for file size > 2MB
  - [ ] Subtask 7.3: Add Shadcn Toast notifications for success/error
  - [ ] Subtask 7.4: Log audit trail for all operations

- [ ] Task 8: Write BDD tests (AC: NFR14, NFR7)
  - [ ] Subtask 8.1: Write integration tests for API endpoints
  - [ ] Subtask 8.2: Write unit tests for query functions
  - [ ] Subtask 8.3: Write E2E tests with Playwright (upload, delete, search)
  - [ ] Subtask 8.4: Verify file format validation
  - [ ] Subtask 8.5: Verify file size validation (< 2MB)
  - [ ] Subtask 8.6: Verify unique filename generation

## Dev Notes

### Technical Stack & Requirements

**Core Technologies:**
- Bun 1.3.x+ (runtime)
- Next.js 16.1.6 + React 19.2.3
- Drizzle ORM 0.45.1+ (database queries)
- TypeScript 5 strict mode
- Shadcn UI 3.7.0+ (UI components)
- Tailwind CSS 4 (styling)

### Database Schema

**New images table:**
```typescript
// database/schema/images.ts
import { sqliteTable, text, integer, timestamp, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const images = sqliteTable('images', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(), // UUID + timestamp
  originalName: text('original_name').notNull(), // User's original filename
  mimeType: text('mime_type').notNull(), // image/jpeg, image/png, etc.
  fileSize: integer('file_size').notNull(), // in bytes
  category: text('category', { enum: ['task', 'badge', 'wish', 'animation'] }).notNull(),
  url: text('url').notNull(), // /api/images/[filename]
  uploadedBy: text('uploaded_by').notNull(), // admin user ID
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  categoryIdx: index('category_idx').on(table.category),
  uploadedByIdx: index('uploaded_by_idx').on(table.uploadedBy),
}));

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
```

### API Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/admin/images/upload` | Upload image file | Admin |
| GET | `/api/admin/images` | List images (with filters) | Admin |
| GET | `/api/admin/images/[id]` | Get image details | Admin |
| DELETE | `/api/admin/images/[id]` | Delete single image | Admin |
| DELETE | `/api/admin/images` | Batch delete images | Admin |
| GET | `/api/images/[filename]` | Serve image file | Public |

**Request/Response DTOs:**

```typescript
// Upload Request (multipart/form-data)
FormData: {
  file: File; // JPG, PNG, WebP, GIF
  category?: string; // task, badge, wish, animation
}

// Upload Response
{
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number; // bytes
  category: string;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

// List Images Request
{
  category?: 'task' | 'badge' | 'wish' | 'animation';
  search?: string;
  limit?: number;
  offset?: number;
}

// List Images Response
{
  images: Image[];
  total: number;
  page: number;
  pageSize: number;
}

// Delete Request (batch)
{
  ids: string[];
}
```

### Project Structure Notes

**Files to Create/Modify:**

```
database/schema/
├── images.ts               # NEW: Table schema

database/migrations/
├── xxx_create_images.sql  # NEW: Migration

lib/db/queries/
├── images.ts              # NEW: Query functions

app/admin/images/
├── page.tsx               # NEW: Image management grid
└── upload/
    └── route.ts           # NEW: Upload API endpoint

components/features/
├── image-uploader.tsx     # NEW: Drag & drop upload area
├── image-grid.tsx         # NEW: Grid display
├── image-card.tsx         # NEW: Image preview card
└── image-search-filter.tsx # NEW: Search + filter

tests/integration/
├── images.spec.ts         # NEW: API tests

tests/e2e/
├── images.spec.ts         # NEW: E2E tests
```

**Alignment with Unified Project Structure:**

- ✅ Schema in `database/schema/images.ts` (per architecture)
- ✅ Queries in `lib/db/queries/images.ts` (per-table file pattern)
- ✅ API routes in `app/api/admin/images/` (RESTful pattern)
- ✅ Components in `components/features/` (feature-based)
- ✅ No conflicts detected

### Image Storage Strategy

**Local Storage (MVP):**
```
public/images/
├── tasks/      # Task icons
├── badges/     # Badge icons
├── wishes/     # Wish images
└── uploads/    # User uploads
```

**Cloud OSS (Future):**
- Placeholder interface for Tencent COS / Alibaba OSS
- Migration path when scaling beyond 5000 DAU

**Unique Filename Generation:**
```typescript
import { Bun } from 'bun';

const uuid = Bun.randomUUIDv7();
const timestamp = Date.now();
const extension = originalFilename.split('.').pop();
const uniqueFilename = `${uuid}-${timestamp}.${extension}`;
```

### References

- **Architecture Decision:** ADR-2 (Database: SQLite → PostgreSQL upgrade path)
- **Database Pattern:** ADR-5 (Function-based queries, NOT Repository pattern)
- **API Pattern:** [Source: docs/TECH_SPEC_API.md#REST-endpoints]
- **File Upload Pattern:** [Source: docs/TECH_SPEC_BUN.md#file-operations]
- **Component System:** [Source: docs/TECH_SPEC_ARCHITECTURE.md#component-boundaries]
- **Testing Standard:** [Source: docs/TECH_SPEC_BDD.md#Given-When-Then]
- **FR52:** [Source: _bmad-output/planning-artifacts/prd.md#FR52] 管理员可以管理图床

### Critical Implementation Constraints

**🔴 RED LIST - MUST OBEY:**

1. **Database Operations:**
   - ✅ MUST use Drizzle ORM query builder
   - ❌ NEVER use raw SQL
   - ❌ NEVER write SQL in components/routes
   - ✅ All queries MUST be in `lib/db/queries/images.ts`

2. **Type Safety:**
   - ❌ NEVER use `any` type
   - ✅ MUST use `unknown` + type guards
   - ✅ NO `@ts-ignore` or `@ts-expect-error`

3. **Bun Runtime:**
   - ✅ MUST use `Bun.file()`, `Bun.write()` for file ops
   - ✅ MUST use `Bun.randomUUIDv7()` for UUID generation
   - ✅ MUST use `Bun.env` for environment variables
   - ❌ NEVER use Node.js APIs (`fs/promises`, `process.env`, `uuid` package)

4. **File Upload Security:**
   - ✅ MUST validate file format (JPG, PNG, WebP, GIF only)
   - ✅ MUST validate file size < 2MB
   - ✅ MUST generate unique filename
   - ❌ NEVER trust user-provided filename

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
  - Admin PC layout: ≥1024px width
  - Grid layout for image display (3-4 columns per row)

- **Image Grid Design:**
  - 200x200px image preview cards
  - Upload time and file size display
  - Category badges (task/badge/wish/animation)
  - Hover effects for action buttons

- **Upload Experience:**
  - Drag & drop upload area
  - File picker button fallback
  - Real-time progress indicator
  - Preview before upload

- **Search & Filter:**
  - Search by filename or tag
  - Filter by category
  - Pagination for large datasets

- **Feedback:**
  - Success toast: "图片上传成功"
  - Error toast with clear message (format, size limit)
  - Loading states during upload

- **Batch Operations:**
  - Multi-select checkboxes
  - Batch delete button
  - Confirmation dialog before batch delete

### Testing Standards Summary

**BDD Format (Given-When-Then):**

```typescript
// Example: Upload image successfully
it('given 管理员已登录，when 上传有效图片，then 图片上传成功并返回URL', async () => {
  // Given: 管理员已登录
  const admin = await createAdmin();
  const imageFile = createTestImageFile('test.jpg', 'image/jpeg', 1024 * 500); // 500KB

  // When: 上传有效图片
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('category', 'task');

  const res = await request(app)
    .post('/api/admin/images/upload')
    .set('Cookie', admin.session)
    .send(formData);

  // Then: 图片上传成功并返回URL
  expect(res.status).toBe(201);
  expect(res.body.image.url).toMatch(/^\/api\/images\//);
  expect(res.body.image.category).toBe('task');
  expect(res.body.image.mimeType).toBe('image/jpeg');
});

// Example: Validate file size
it('given 图片文件大小超过2MB，when 尝试上传，then 返回错误提示', async () => {
  // Given: 图片文件大小超过2MB
  const admin = await createAdmin();
  const largeFile = createTestImageFile('large.jpg', 'image/jpeg', 1024 * 1024 * 3); // 3MB

  // When: 尝试上传
  const formData = new FormData();
  formData.append('file', largeFile);

  const res = await request(app)
    .post('/api/admin/images/upload')
    .set('Cookie', admin.session)
    .send(formData);

  // Then: 返回错误提示
  expect(res.status).toBe(400);
  expect(res.body.error).toContain('文件大小超过2MB限制');
});

// Example: Validate file format
it('given 不支持的图片格式，when 尝试上传，then 返回错误提示', async () => {
  // Given: 不支持的图片格式
  const admin = await createAdmin();
  const invalidFile = createTestFile('test.bmp', 'image/bmp');

  // When: 尝试上传
  const formData = new FormData();
  formData.append('file', invalidFile);

  const res = await request(app)
    .post('/api/admin/images/upload')
    .set('Cookie', admin.session)
    .send(formData);

  // Then: 返回错误提示
  expect(res.status).toBe(400);
  expect(res.body.error).toContain('不支持的图片格式');
});

// Example: Delete image
it('given 图片存在，when 管理员删除图片，then 图片从数据库和存储中删除', async () => {
  // Given: 图片存在
  const admin = await createAdmin();
  const image = await uploadTestImage(admin);

  // When: 管理员删除图片
  const res = await request(app)
    .delete(`/api/admin/images/${image.id}`)
    .set('Cookie', admin.session);

  // Then: 图片从数据库和存储中删除
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  // Verify file deletion
  await expect(fs.exists(getImagePath(image.filename))).resolves.toBe(false);
});
```

**Test Coverage Requirements:**
- API endpoints: 100% coverage
- Query functions: 95%+ coverage
- E2E tests: Main workflows (upload, delete, search, filter)
- Security tests: File format validation, size validation, unique filename generation

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
