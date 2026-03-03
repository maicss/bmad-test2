# Story 4.1: Child Creates Wish

Status: ready-for-dev

## Story

As a 儿童,
I want 创建愿望,
so that 我可以设定自己想要的奖励目标。

## Acceptance Criteria

1. Given 我已登录系统（PIN码或家长设备）并具有儿童角色
   When 我进入"愿望清单"页面
   Then 系统显示"添加愿望"按钮

2. Given 我在"愿望清单"页面
   When 我点击"添加愿望"按钮
   Then 系统显示愿望创建表单，包含：
     - 愿望名称（必填，最多50字）
     - 愿望类型选择：物品 / 体验
     - 期望积分（必填，范围10-10000）
     - 愿望描述（可选，最多200字）
     - 图片上传（可选）
     - 链接（可选，如淘宝商品链接）

3. Given 我填写愿望创建表单
   When 我填写愿望名称（必填，1-50字）
   Then 系统实时验证字段长度

4. Given 我填写愿望创建表单
   When 我选择愿望类型（物品/体验）
   Then 系统更新类型选择状态

5. Given 我填写愿望创建表单
   When 我设置期望积分值
   Then 系统验证积分范围（10-10000）
   And 系统显示"按照你的速度，X天后就能兑换了！"（基于当前积分历史速度估算）

6. Given 我填写愿望创建表单
   When 我上传图片（可选）
   Then 系统验证图片格式（支持jpg, png, gif）
   And 系统验证图片大小（最大5MB）
   And 系统将图片上传到图床（本地存储，预留云OSS接口）

7. Given 我填写愿望创建表单
   When 我填写商品链接（可选）
   Then 系统验证URL格式

8. Given 我填写完所有必填字段
   When 我点击"保存"按钮
   Then 系统验证所有必填字段
   And 系统验证期望积分范围
   And 系统保存愿望到数据库
   And 愿望状态设置为"等待家长审核"
   And 愿望记录关联到当前儿童用户
   And 愿望记录关联到当前家庭

9. Given 愿望保存成功
   Then 系统在3秒内向家长发送通知（NFR4）
   And 通知内容："新愿望待审核：{孩子姓名}创建了新愿望「{愿望名称}」，请审核"
   And 通知跳转到审核页面

10. Given 愿望保存成功
    Then 系统返回成功响应
    And 系统显示乐观UI更新（立即反馈）
    And 系统跳转到愿望列表页面

11. Given 愿望保存失败
    Then 系统显示错误提示（使用Shadcn Toast）
    And 错误信息包含具体原因（必填字段、积分范围、图片大小等）
    And 保留用户已填写的内容

12. Given 我未登录或登录状态失效
    When 我尝试进入"愿望清单"页面
    Then 系统重定向到登录页面

## Tasks / Subtasks

- [ ] Task 1: Create wishlists database schema (AC: #2, #8)
  - [ ] Create wishlists table with columns:
    - id (primary key, uuid)
    - family_id (references families.id)
    - child_id (references users.id)
    - title (text, not null)
    - type (enum: 'item' | 'experience', not null)
    - desired_points (integer, not null, 10-10000)
    - description (text, nullable)
    - image_url (text, nullable)
    - product_link (text, nullable)
    - status (enum: 'pending_review' | 'approved' | 'rejected', default 'pending_review')
    - points_threshold (integer, nullable, set by parent)
    - created_at (timestamp, default now)
    - updated_at (timestamp, default now)
  - [ ] Generate Drizzle migration
  - [ ] Apply migration to database

- [ ] Task 2: Create wish-related query functions (AC: #8)
  - [ ] Create lib/db/queries/wishlists.ts
  - [ ] Create createWish() - Insert new wish
  - [ ] Create getWishesByChild() - Get wishes for a child
  - [ ] Create getWishById() - Get wish details by ID
  - [ ] Create getWishesByFamily() - Get all wishes for a family

- [ ] Task 3: Create wish creation API endpoint (AC: #1-#11)
  - [ ] Create POST /api/wishlists
  - [ ] Verify user authentication (Better-Auth session)
  - [ ] Verify user role is 'child'
  - [ ] Validate request body (Zod schema)
  - [ ] Validate image upload (if provided)
  - [ ] Handle image upload to local storage
  - [ ] Create wish record in database
  - [ ] Send notification to parents (pending review)
  - [ ] Return created wish data

- [ ] Task 4: Create wish listing API endpoint (AC: #1)
  - [ ] Create GET /api/wishlists
  - [ ] Verify user authentication
  - [ ] Filter wishes by child_id for child role
  - [ ] Filter wishes by family_id for parent role
  - [ ] Support status filter (all, pending, approved)
  - [ ] Return wishes with progress information

- [ ] Task 5: Implement image upload functionality (AC: #6)
  - [ ] Create lib/services/image-uploader.ts
  - [ ] Validate image format (jpg, png, gif)
  - [ ] Validate image size (max 5MB)
  - [ ] Store images in public/images/wishes/
  - [ ] Return image URL
  - [ ] Create image deletion utility

- [ ] Task 6: Create wish creation form UI (AC: #2-#7, #11)
  - [ ] Create app/(child)/wishlist/create/page.tsx
  - [ ] Create wish form component (lib/components/forms/wish-form.tsx)
  - [ ] Add form fields:
    - Title input (1-50 characters, required)
    - Type selector (item/experience, required)
    - Desired points input (10-10000, required)
    - Description textarea (optional, 200 chars)
    - Image upload (optional, with preview)
    - Product link input (optional)
  - [ ] Add real-time validation
  - [ ] Add smart estimation display (based on points history)
  - [ ] Add error handling (Shadcn Toast)
  - [ ] Add optimistic UI update
  - [ ] Responsive design (child-end: tablet-optimized, large buttons)

- [ ] Task 7: Create wish listing UI (AC: #1, #10)
  - [ ] Create app/(child)/wishlist/page.tsx
  - [ ] Display wish list with status indicators
  - [ ] Add "添加愿望" button
  - [ ] Show wish progress bars
  - [ ] Card grid layout for touch optimization
  - [ ] Status grouping (pending, approved, rejected)

- [ ] Task 8: Implement notification sending (AC: #9)
  - [ ] Create notification when wish created
  - [ ] Notification type: "wish_created"
  - [ ] Target: all parents in family
  - [ ] Include wish details in notification
  - [ ] Link to wish review page
  - [ ] Send within 3 seconds (NFR4)

- [ ] Task 9: Write BDD tests (AC: #1-#11)
  - [ ] **Given** 儿童已登录 **When** 进入愿望清单 **Then** 显示"添加愿望"按钮
  - [ ] **Given** 儿童填写愿望表单 **When** 所有必填字段有效 **Then** 保存成功，状态为"等待家长审核"
  - [ ] **Given** 儿童填写愿望表单 **When** 积分超出范围 **Then** 显示错误提示
  - [ ] **Given** 儿童上传图片 **When** 图片格式/大小有效 **Then** 上传成功
  - [ ] **Given** 愿望创建成功 **When** 家长在线 **Then** 3秒内收到通知
  - [ ] **Given** 儿童未登录 **When** 访问愿望清单 **Then** 重定向到登录页
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 10: Performance and compliance verification (AC: #1-#12)
  - [ ] Verify API response time < 500ms (NFR3: P95)
  - [ ] Verify page load time < 2 seconds (NFR1)
  - [ ] Verify notification delivery < 3 seconds (NFR4)
  - [ ] Verify image upload validation
  - [ ] Verify COPPA/GDPR compliance (child data protection)

- [ ] Task 11: Smart estimation feature (AC: #5)
  - [ ] Calculate points earning rate from last 7 days
  - [ ] Display "按照你的速度，X天后就能兑换了！"
  - [ ] Fallback: "加油！完成更多任务来实现愿望吧" (if no history)
  - [ ] Update estimation when points value changes

## Dev Notes

### Project Structure Notes

**Alignment with unified project structure:**
- Database queries: `lib/db/queries/wishlists.ts` (per-table file pattern)
- Schema: `database/schema/wishlists.ts`
- API endpoints: `app/api/wishlists/route.ts`
- UI pages: `app/(child)/wishlist/**`
- Types: `types/wishlist.ts`

**Detected conflicts/variances:**
- None identified at story creation time

### Database Schema

**wishlists Table:**
```sql
CREATE TABLE wishlists (
  id TEXT PRIMARY KEY, -- uuid
  family_id TEXT NOT NULL REFERENCES families(id),
  child_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL, -- 1-50 characters
  type TEXT NOT NULL CHECK(type IN ('item', 'experience')),
  desired_points INTEGER NOT NULL CHECK(desired_points >= 10 AND desired_points <= 10000),
  description TEXT, -- optional, max 200 characters
  image_url TEXT, -- optional
  product_link TEXT, -- optional
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review', 'approved', 'rejected')),
  points_threshold INTEGER, -- set by parent during review
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Indexes for performance
CREATE INDEX idx_wishlists_family ON wishlists(family_id);
CREATE INDEX idx_wishlists_child ON wishlists(child_id);
CREATE INDEX idx_wishlists_status ON wishlists(status);
CREATE INDEX idx_wishlists_created ON wishlists(created_at DESC);
```

### API Endpoints to Create

**Wishlist Management:**
- `POST /api/wishlists` - Create new wish
- `GET /api/wishlists` - List wishes (with optional status filter)
- `GET /api/wishlists/[id]` - Get wish details
- `PUT /api/wishlists/[id]` - Update wish (future story)
- `DELETE /api/wishlists/[id]` - Delete wish (future story)

### UI Pages to Create

**Child Wishlist:**
- `app/(child)/wishlist/page.tsx` - Wishlist listing page
- `app/(child)/wishlist/create/page.tsx` - Wish creation page

### Image Upload Requirements

**Image Upload Flow:**
1. User selects image from device (camera or gallery)
2. Client-side validation:
   - File format: jpg, png, gif
   - File size: max 5MB
3. Upload to `/api/images/upload`
4. Server-side validation (duplicate check)
5. Store in `public/images/wishes/`
6. Return URL to client
7. Display preview in form

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. Child views wishlist page
2. Child creates wish with all required fields
3. Child creates wish with invalid points range
4. Child uploads valid image
5. Child uploads invalid image (format/size)
6. Wish notification sent to parents
7. Smart estimation displayed based on history
8. Unauthenticated user redirected to login

**Integration Tests:**
- Wish CRUD operations
- Image upload functionality
- Notification creation and delivery
- Permission checks (child role only)

**E2E Tests (Playwright):**
- Complete wish creation flow
- Form validation
- Image upload workflow
- Error handling scenarios
- Notification verification

### Performance Requirements

- Wish list API: < 500ms (P95) - AC #1
- Wish creation API: < 500ms (P95) - AC #8
- Image upload: < 2s (P95) - AC #6
- Notification delivery: < 3s (NFR4) - AC #9
- Page load: < 2 seconds (NFR1) - AC #1

### Security Requirements

- Only authenticated users can access - AC #1, #12
- Only child role can create wishes - AC #1
- Image upload validation (format, size) - AC #6
- Product link URL validation - AC #7
- XSS prevention (sanitize user input)
- Child data protection (COPPA/GDPR) - AC #12

### Previous Story Intelligence

**From Epic 1 (User Authentication):**
- Users table exists with role column
- Better-Auth configured with session management
- Child PIN login implemented (Story 1.3)
- Family membership structure established

**From Epic 2 (Task Management):**
- Points system exists (Story 3.1-3.8)
- Points history tracking implemented
- Can reuse: points history for smart estimation calculation

**From Epic 3 (Points System):**
- lib/db/queries/points.ts - Points queries
- Points balance calculation
- Points history records
- **Can reuse:** Points history for smart estimation (AC #5)

**From Architecture:**
- Notification infrastructure exists (lib/notifications/)
- Image storage pattern established (public/images/)
- Drizzle ORM query pattern established
- Better-Auth session management

### Smart Estimation Implementation

**Calculation Logic:**
1. Query points history for child (last 7 days)
2. Calculate average points earned per day
3. Estimate days to reach desired points:
   ```
   days_needed = ceil((desired_points - current_points) / avg_daily_earning)
   ```
4. Display message:
   - If has history: "按照你的速度，{days_needed}天后就能兑换了！"
   - If no history: "加油！完成更多任务来实现愿望吧"

**Fallback Handling:**
- No points history in last 7 days
- Zero average points earned
- Child already has enough points: "你已经可以兑换这个愿望了！"

### Notification Implementation

**Notification Type:** `wish_created`

**Target Recipients:** All parents in the child's family

**Notification Payload:**
```typescript
{
  type: 'wish_created',
  childName: string,
  wishTitle: string,
  wishId: string,
  actionUrl: '/parent/wishlist/review',
  createdAt: timestamp
}
```

**Delivery Channels:**
- PWA push notification (if enabled)
- In-app notification center
- Store in `notifications` table

### Compliance Requirements

**COPPA/GDPR Compliance:**
- Child data minimization: Only collect necessary fields
- Parental consent: Wish requires parent review
- Data retention: 3 years (NFR18)
- Right to export: Parents can export child's wishes

**Image Upload:**
- Validate file type on server-side
- Scan for malware (optional, reserved for production)
- Store in secure location
- No PII in file names (use UUIDs)

### UX Requirements

**Child-End Design (from UX decisions):**
- Tablet-optimized layout (landscape, ≥768px)
- Large buttons (≥80x80pt recommended for children)
- Gamified UI elements
- Clear visual feedback
- Simple, intuitive flow

**Form Design:**
- Progressive disclosure: Show only necessary fields initially
- Real-time validation: Immediate feedback
- Smart estimation: Motivational messaging
- Image preview: Visual confirmation

**Error Handling:**
- Clear error messages in simple language
- Shadcn Toast notifications
- Preserve form data on errors
- No `alert()` dialogs

### Open Questions / Decisions Needed

1. **Image Storage Strategy:**
   - Option A: Local storage only (MVP)
   - Option B: Cloud OSS from day one
   - **Decision:** Local storage (public/images/) with cloud OSS interface reserved (per architecture)

2. **Smart Estimation Time Window:**
   - Option A: Last 7 days
   - Option B: Last 14 days
   - Option C: Last 30 days
   - **Decision:** Last 7 days (matches PRD requirement for estimation)

3. **Product Link Validation:**
   - Option A: Any URL format
   - Option B: Specific domains only (Taobao, JD, etc.)
   - **Decision:** Any valid URL format (permissive, parent review will catch issues)

4. **Wish Creation Limits:**
   - Option A: No limit
   - Option B: Limit per family (configurable by parent)
   - **Decision:** No limit initially (Story 4.6 says "愿望数量无限制（家长可设置上限，见FR60）")

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<500ms API, <2s page load, <3s notification)
5. [ ] Security requirements met (auth checks, image validation, child data protection)
6. [ ] Smart estimation feature working
7. [ ] Notification delivery verified
8. [ ] Code review passed
9. [ ] Sprint status updated to ready-for-dev

### Tasks Blocked By

**Prerequisites:**
- Epic 1 (User Authentication) - Complete ✅
- Epic 3 (Points System) - Complete ✅
- Users table exists - Complete ✅
- Families table exists - Complete ✅
- Notification infrastructure - Complete ✅

**None identified at story creation time.**

## Dev Agent Record

### Agent Model Used

GLM-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None at story creation time.

### Completion Notes List

Story created with comprehensive implementation guidance including:
- Database schema design with proper constraints and indexes
- API endpoint specifications with validation requirements
- UI component structure with child-friendly design considerations
- BDD test scenarios covering all acceptance criteria
- Smart estimation implementation details
- Notification system integration
- Image upload handling
- Security and compliance requirements
- Performance targets

### File List

**Files to Create:**
- database/schema/wishlists.ts
- database/migrations/XXX_create_wishlists.sql
- lib/db/queries/wishlists.ts
- lib/services/image-uploader.ts
- app/api/wishlists/route.ts (POST)
- app/api/wishlists/route.ts (GET)
- app/(child)/wishlist/page.tsx
- app/(child)/wishlist/create/page.tsx
- lib/components/forms/wish-form.tsx
- lib/components/features/wish-card.tsx
- types/wishlist.ts

**Files to Modify:**
- database/schema/index.ts (export wishlists table)
- lib/db/queries/index.ts (export wish functions)
- app/(child)/layout.tsx (add wishlist to nav, if needed)

**Test Files:**
- tests/integration/wishlists.spec.ts
- tests/e2e/wishlist.spec.ts
- tests/fixtures/wishes.ts
