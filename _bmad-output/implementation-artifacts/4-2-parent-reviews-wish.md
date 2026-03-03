# Story 4.2: Parent Reviews Wish

Status: ready-for-dev

## Story

As a 家长,
I want 审核愿望,
so that 我可以确保儿童的愿望合理，安全。

## Acceptance Criteria

1. Given 我已登录系统并具有家长角色
   When 孩子创建了愿望
   Then 我在3秒内收到"新愿望待审核"通知（NFR4）
   And 通知内容包含：孩子姓名、愿望名称、审核链接

2. Given 我收到新愿望通知
   When 我点击通知或进入"愿望审核"页面
   Then 系统显示待审核愿望列表
   And 列表包含：
     - 愿望卡片显示：图片/图标、名称、类型、期望积分、创建时间
     - 按创建时间倒序排列（最新的在前）
     - 显示未审核数量徽章

3. Given 我在"愿望审核"页面
   When 我点击某个愿望卡片
   Then 系统显示愿望详情页面，包含：
     - 愿望图片（如果有，支持点击放大）
     - 愿望名称（只读）
     - 愿望类型（只读）
     - 儿童设置的期望积分（只读）
     - 愿望描述（只读）
     - 商品链接（如果有，点击在新标签打开）
     - 创建时间
     - 儿童姓名

4. Given 我在愿望详情页面
   When 我选择"通过"操作
   Then 系统显示积分门槛设置表单
   And 表单包含：
     - 建议积分范围（根据愿望类型和儿童历史）
     - 积分门槛输入框（范围10-10000）
     - "确认通过"和"取消"按钮

5. Given 我在积分门槛设置表单
   When 我填写积分门槛
   Then 系统实时验证积分范围（10-10000）
   And 系统显示当前儿童积分余额
   And 系统显示"按照当前速度，还需X天"估算（可选）

6. Given 我填写有效的积分门槛
   When 我点击"确认通过"按钮
   Then 系统更新愿望状态为"已通过"
   And 系统设置正式积分门槛（points_threshold）
   And 系统记录审核人（家长用户ID）
   And 系统记录审核时间

7. Given 愿望审核通过
   Then 系统在3秒内向该儿童发送通知（NFR4）
   And 通知内容："恭喜！你的愿望「{愿望名称}」已通过，积满{积分门槛}分就能兑换了！"
   And 通知跳转到愿望详情页

8. Given 我在愿望详情页面
   When 我选择"拒绝"操作
   Then 系统显示拒绝原因表单
   And 表单包含：
     - 拒绝原因输入框（必填，最多200字）
     - 预设原因选项（可选）：
       - "愿望不合适"
       - "积分要求太高"
       - "需要更多信息"
       - "其他"（自定义输入）
     - "确认拒绝"和"取消"按钮

9. Given 我填写拒绝原因（必填）
   When 我点击"确认拒绝"按钮
   Then 系统更新愿望状态为"已拒绝"
   And 系统记录拒绝原因
   And 系统记录审核人（家长用户ID）
   And 系统记录审核时间

10. Given 愿望被拒绝
    Then 系统在3秒内向该儿童发送通知（NFR4）
    And 通知内容："很遗憾，你的愿望「{愿望名称}」未通过：{拒绝原因}"
    And 通知跳转到愿望详情页

11. Given 我在愿望详情页面
    When 我选择"修改"操作
    Then 系统显示修改表单
    And 表单包含：
     - 积分门槛输入框（可调整）
     - 可选修改愿望类型
     - 可选修改愿望描述
     - "保存修改并审核通过"和"取消"按钮

12. Given 我修改愿望信息并点击"保存修改并审核通过"
    Then 系统更新愿望信息
    And 系统更新愿望状态为"已通过"
    And 系统设置正式积分门槛
    And 系统记录审核人、审核时间、修改记录

13. Given 愿望被修改后通过
    Then 系统在3秒内向该儿童发送通知（NFR4）
    And 通知内容："你的愿望「{愿望名称}」已修改并通过，积满{积分门槛}分就能兑换了！"

14. Given 我有多个待审核愿望
    When 我在"愿望审核"页面
    Then 系统支持批量操作：
     - 全选/取消全选
     - 批量通过（需要为每个设置积分门槛）
     - 批量拒绝（需要填写统一拒绝原因或每个单独填写）

15. Given 愿望已审核（通过或拒绝）
    When 我进入"愿望审核"页面
    Then 系统显示已审核愿望列表（可切换视图）
    And 支持"待审核"和"已审核"标签页切换

16. Given 愿望已审核通过
    When 儿童查看愿望列表
    Then 愿望显示"已通过"状态
    And 愿望显示正式积分门槛
    And 愿望显示进度条（当前积分/所需积分）

17. Given 愿望已审核拒绝
    When 儿童查看愿望列表
    Then 愿望显示"已拒绝"状态
    And 愿望显示拒绝原因
    And 愿望可以重新提交（新建愿望）

18. Given 我未登录或登录状态失效
    When 我尝试进入"愿望审核"页面
    Then 系统重定向到登录页面

19. Given 我没有家长权限
    When 我尝试进入"愿望审核"页面
    Then 系统显示错误提示："权限不足，仅家长可审核愿望"
    And 系统不显示审核页面

20. Given 愿望被审核后
    Then 审核操作记录到审计日志（NFR14）
    And 记录包含：审核人、操作类型（通过/拒绝/修改）、时间、原因（拒绝时）、修改内容（修改时）

21. Given 家长批量审核愿望
    When 系统处理批量操作
    Then API响应时间<500ms（NFR3: P95）
    And 系统为每个愿望发送单独的通知

22. Given 审核操作失败（网络错误、数据库错误等）
    Then 系统显示错误提示（使用Shadcn Toast）
    And 错误信息包含具体原因
    And 保留用户已填写的内容（如拒绝原因）

## Tasks / Subtasks

- [ ] Task 1: Update wishlists schema for review fields (AC: #6, #9, #12, #20)
  - [ ] Add reviewed_by column (references users.id)
  - [ ] Add reviewed_at column (timestamp)
  - [ ] Add rejection_reason column (text, nullable)
  - [ ] Add modification_history column (JSON, nullable)
  - [ ] Generate Drizzle migration
  - [ ] Apply migration to database

- [ ] Task 2: Create wish review query functions (AC: #1, #6, #9, #12)
  - [ ] Create getPendingReviewWishes() - Get wishes pending review
  - [ ] Create getReviewedWishes() - Get reviewed wishes
  - [ ] Create getWishesByFamily() - Get all wishes for family
  - [ ] Create approveWish() - Approve wish with points threshold
  - [ ] Create rejectWish() - Reject wish with reason
  - [ ] Create modifyAndApproveWish() - Modify wish details and approve
  - [ ] Create batchApproveWishes() - Batch approve multiple wishes
  - [ ] Create batchRejectWishes() - Batch reject multiple wishes

- [ ] Task 3: Create wish review API endpoints (AC: #2-#13, #14-#21)
  - [ ] Create GET /api/wishlists/pending-review - Get pending review wishes
  - [ ] Create GET /api/wishlists/reviewed - Get reviewed wishes
  - [ ] Create GET /api/wishlists/[id] - Get wish details for review
  - [ ] Create POST /api/wishlists/[id]/approve - Approve wish
  - [ ] Create POST /api/wishlists/[id]/reject - Reject wish
  - [ ] Create PUT /api/wishlists/[id]/modify-approve - Modify and approve wish
  - [ ] Create POST /api/wishlists/batch-approve - Batch approve wishes
  - [ ] Create POST /api/wishlists/batch-reject - Batch reject wishes
  - [ ] Verify user authentication (Better-Auth session)
  - [ ] Verify user role is 'parent'
  - [ ] Verify user belongs to the wish's family
  - [ ] Validate request body (Zod schema)
  - [ ] Send notifications to child after review
  - [ ] Log review operations to audit logs

- [ ] Task 4: Create wish review notification (AC: #1, #7, #10, #13)
  - [ ] Create notification type: "wish_approved"
  - [ ] Create notification type: "wish_rejected"
  - [ ] Send notification to child when wish approved
  - [ ] Send notification to child when wish rejected
  - [ ] Include wish details in notification
  - [ ] Link to wish detail page
  - [ ] Deliver within 3 seconds (NFR4)
  - [ ] Store in notifications table

- [ ] Task 5: Create wish review UI - Review List (AC: #2, #15)
  - [ ] Create app/(parent)/wishlist/review/page.tsx
  - [ ] Display pending review wishes list
  - [ ] Display reviewed wishes list (tab switcher)
  - [ ] Add tab navigation: "待审核" / "已审核"
  - [ ] Show wish cards with image, name, type, points, created_at
  - [ ] Add unreviewed count badge
  - [ ] Responsive design (parent-end: mini-program optimized)

- [ ] Task 6: Create wish review UI - Wish Detail (AC: #3, #11)
  - [ ] Create app/(parent)/wishlist/review/[id]/page.tsx
  - [ ] Display complete wish information (read-only)
  - [ ] Display wish image (with zoom option)
  - [ ] Display product link (open in new tab)
  - [ ] Show child name and creation time
  - [ Add action buttons: "通过", "拒绝", "修改"
  - [ ] Display current wish status
  - [ ] Responsive design

- [ ] Task 7: Create approval dialog with points threshold (AC: #4-#7)
  - [ ] Create lib/components/dialogs/wish-approval-dialog.tsx
  - [ ] Display suggested points range
  - [ ] Add points threshold input (10-10000)
  - [ ] Display child's current points balance
  - [ ] Add estimation: "按照当前速度，还需X天"
  - [ ] Add validation for points range
  - [ ] Add "确认通过" and "取消" buttons
  - [ ] Optimistic UI update

- [ ] Task 8: Create rejection dialog with reason (AC: #8-#10)
  - [ ] Create lib/components/dialogs/wish-rejection-dialog.tsx
  - [ ] Add reason input (required, max 200 chars)
  - [ ] Add preset reason options:
     - "愿望不合适"
     - "积分要求太高"
     - "需要更多信息"
     - "其他" (custom input)
  - [ ] Add validation for reason (required)
  - [ ] Add "确认拒绝" and "取消" buttons
  - [ ] Optimistic UI update

- [ ] Task 9: Create modify dialog for wish details (AC: #11-#13)
  - [ ] Create lib/components/dialogs/wish-modify-dialog.tsx
  - [ ] Allow modification of:
     - Points threshold
     - Wish type (optional)
     - Wish description (optional)
  - [ ] Add validation for modified fields
  - [ ] Add "保存修改并审核通过" and "取消" buttons
  - [ ] Record modification history
  - [ ] Optimistic UI update

- [ ] Task 10: Implement batch review operations (AC: #14, #21)
  - [ ] Add batch select functionality
  - [ ] Add "全选" / "取消全选" checkboxes
  - [ ] Add batch approve button
  - [ ] Add batch reject button
  - [ ] Create batch approval workflow:
     - Step 1: Select wishes to batch approve
     - Step 2: Set points threshold for each wish (or use same threshold)
     - Step 3: Confirm batch approval
  - [ ] Create batch rejection workflow:
     - Step 1: Select wishes to batch reject
     - Step 2: Enter rejection reason (common for all or individual)
     - Step 3: Confirm batch rejection
  - [ ] Send individual notifications for each wish
  - [ ] Batch operations API response time < 500ms

- [ ] Task 11: Implement smart points suggestion (AC: #5, #11)
  - [ ] Calculate suggested points based on wish type
  - [ ] Use child's points history for personalized suggestions
  - [ ] Display suggested range (min/max)
  - [ ] Display "按照当前速度，还需X天" estimation
  - [ ] Update estimation when points threshold changes

- [ ] Task 12: Add audit logging for review operations (AC: #20)
  - [ ] Log approval operations (who, when, which wish, points threshold)
  - [ ] Log rejection operations (who, when, which wish, reason)
  - [ ] Log modification operations (who, when, which wish, what modified, new values)
  - [ ] Store in audit logs table
  - [ ] Support audit log retrieval

- [ ] Task 13: Write BDD tests (AC: #1-#22)
  - [ ] **Given** 儿童创建愿望 **When** 家长在线 **Then** 3秒内收到通知
  - [ ] **Given** 家长进入审核页 **When** 有待审核愿望 **Then** 显示愿望列表
  - [ ] **Given** 家长审核愿望 **When** 设置积分门槛并点击通过 **Then** 愿望状态变为"已通过"
  - [ ] **Given** 愿望审核通过 **When** 儿童**在线 **Then** 3秒内收到通知
  - [ ] **Given** 家长拒绝愿望 **When** 填写拒绝原因 **Then** 愿望状态变为"已拒绝"
  - [ ] **Given** 愿望被拒绝 **When** 儿童**查看 **Then** 显示拒绝原因
  - [ ] **Given** 家长修改愿望 **When** 修改积分门槛 **Then** 愿望状态变为"已通过"
  - [ ] **Given** 家长批量审核愿望 **When** 选择多个愿望 **Then** 批量操作成功
  - [ ] **Given** 非家长用户 **When** 尝试访问审核页 **Then** 显示权限错误
  - [ ] **Given** 审核操作 **When** 完成 **Then** 记录到审计日志
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 14: Performance and compliance verification (AC: #21, #22)
  - [ ] Verify API response time < 500ms (NFR3: P95)
  - [ ] Verify notification delivery < 3 seconds (NFR4)
  - [ ] Verify page load time < 3 seconds (NFR2)
  - [ ] Verify audit logging (NFR14)
  - [ ] Verify permission checks
  - [ ] Verify batch operations performance

## Dev Notes

### Project Structure Notes

**Alignment with unified project structure:**
- Database queries: `lib/db/queries/wishlists.ts` (reuse and extend from Story 4.1)
- Schema: `database/schema/wishlists.ts` (extend from Story 4.1)
- API endpoints: `app/api/wishlists/[id]/route.ts` (extend from Story 4.1)
- UI pages: `app/(parent)/wishlist/review/**`
- Dialogs: `lib/components/dialogs/`
- Types: `types/wishlist.ts` (reuse and extend from Story 4.1)

**Detected conflicts/variances:**
- None identified at story creation time

### Previous Story Intelligence

**From Story 4.1: Child Creates Wish:**
- wishlists table created with basic fields
- Image upload functionality implemented
- Notification infrastructure exists
- lib/db/queries/wishlists.ts created
- **Can reuse:** All database queries as base
- **Can reuse:** Notification sending logic
- **Can reuse:** Image display components

**From Story 3.8: Child Views Current Points Balance:**
- Points balance queries exist
- **Can reuse:** Points balance calculation for smart suggestions

**From Epic 1 (User Authentication):**
- Better-Auth session management
- Role-based access control
- Audit logging infrastructure

### Database Schema Updates

**wishlists Table Extensions:**
```sql
-- Add review-related fields
ALTER TABLE wishlists ADD COLUMN reviewed_by TEXT REFERENCES users(id);
ALTER TABLE wishlists ADD COLUMN reviewed_at INTEGER;
ALTER TABLE wishlists ADD COLUMN rejection_reason TEXT;
ALTER TABLE wishlists ADD COLUMN modification_history TEXT; -- JSON array of modification records

-- Example modification_history JSON structure:
[
  {
    "modified_at": 1234567890,
    "modified_by": "user_id",
    "field": "points_threshold",
    "old_value": 500,
    "new_value": 600
  }
]
```

### API Endpoints to Create/Extend

**Wishlist Review:**
- `GET /api/wishlists/pending-review` - Get pending review wishes
- `GET /api/wishlists/reviewed` - Get reviewed wishes (with status filter)
- `GET /api/wishlists/[id]` - Get wish details (reuse from Story 4.1)
- `POST /api/wishlists/[id]/approve` - Approve wish with points threshold
- `POST /api/wishlists/[id]/reject` - Reject wish with reason
- `PUT /api/wishlists/[id]/modify-approve` - Modify wish details and approve
- `POST /api/wishlists/batch-approve` - Batch approve wishes
- `POST /api/wishlists/batch-reject` - Batch reject wishes

### UI Pages to Create

**Parent Wishlist Review:**
- `app/(parent)/wishlist/review/page.tsx` - Review list with tabs
- `app/(parent)/wishlist/review/[id]/page.tsx` - Wish detail and review actions

### Dialog Components to Create

**Wishlist Review Dialogs:**
- `lib/components/dialogs/wish-approval-dialog.tsx` - Points threshold dialog
- `lib/components/dialogs/wish-rejection-dialog.tsx` - Rejection reason dialog
- `lib/components/dialogs/wish-modify-dialog.tsx` - Modify wish dialog
- `lib/components/dialogs/batch-review-dialog.tsx` - Batch review workflow

### Smart Points Suggestion Logic

**Suggestion Algorithm:**
```typescript
// Calculate suggested points based on wish type
function getSuggestedPoints(wishType: 'item' | 'experience', childPointsHistory: PointsHistory[]): {min: number, max: number, suggested: number} {
  const avgDailyPoints = calculateAvgDailyPoints(childPointsHistory);
  const baseMultiplier = wishType === 'item' ? 5 : 3; // Experience costs more

  return {
    min: Math.max(10, avgDailyPoints * baseMultiplier * 3),
    max: Math.min(10000, avgDailyPoints * baseMultiplier * 14),
    suggested: avgDailyPoints * baseMultiplier * 7 // 1 week worth
  };
}
```

**Estimation Display:**
```
"按照当前速度，还需X天" = ceil((points_threshold - current_points) / avg_daily_points)
```

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. Parent receives notification when child creates wish
2. Parent views pending review wishes
3. Parent approves wish with points threshold
4. Parent rejects wish with reason
5. Parent modifies and approves wish
6. Parent batch approves wishes
7. Parent batch rejects wishes
8. Child receives notification when wish approved
9. Child receives notification when wish rejected
10. Non-parent user cannot access review page
11. Audit logging for all review operations
12. Smart points suggestion accuracy

**Integration Tests:**
- Wish approval workflow
- Wish rejection workflow
- Wish modification workflow
- Batch review operations
- Notification delivery
- Audit log recording
- Permission checks

**E2E Tests (Playwright):**
- Complete review flow (approve)
- Complete review flow (reject)
- Complete review flow (modify and approve)
- Batch review workflows
- Error handling scenarios
- Permission denial scenarios
- Notification verification

### Performance Requirements

- Pending wishes API: < 500ms (P95) - AC #2
- Wish detail API: < 500ms (P95) - AC #3
- Approve/reject API: < 500ms (P95) - AC #21
- Batch approve API: < 500ms (P95) - AC #21
- Batch reject API: < 500ms (P95) - AC #21
- Notification delivery: < 3 seconds (NFR4) - AC #7, #10, #13
- Page load: < 3 seconds (NFR2) - AC #2

### Security Requirements

- Only authenticated parents can access - AC #18, #19
- Only parents in the same family can review - AC #19
- Points threshold validation (10-10000) - AC #6
- Rejection reason required - AC #9
- Permission checks for all operations - AC #19
- Audit logging for all review operations - AC #20
- Child data protection (COPPA/GDPR) - AC #18

### Notification Implementation

**Notification Type:** `wish_approved`

**Target Recipient:** The child who created the wish

**Notification Payload:**
```typescript
{
  type: 'wish_approved',
  wishId: string,
  wishTitle: string,
  pointsThreshold: number,
  estimatedDays: number, // optional
  message: string,
  actionUrl: '/child/wishlist/view',
  createdAt: timestamp
}
```

**Notification Type:** `wish_rejected`

**Target Recipient:** The child who created the wish

**Notification Payload:**
```typescript
{
  type: 'wish_rejected',
  wishId: string,
  wishTitle: string,
  rejectionReason: string,
  message: string,
  actionUrl: '/child/wishlist/view',
  createdAt: timestamp
}
```

### UX Requirements

**Parent-End Design (from UX decisions):**
- Mini-program optimized (portrait, <450px)
- Efficient batch operations
- Clear action buttons
- Quick navigation
- Efficient review workflow

**Review Flow Design:**
- List view with quick access to details
- Single-page review with all actions available
- Batch operations for efficiency
- Clear status indicators
- Smart suggestions to reduce decision time

**Form Design:**
- Progressive disclosure for complex flows
- Real-time validation
- Smart suggestions (points threshold)
- Preset reasons for rejection (reduce typing)
- Clear confirmations for critical actions

**Error Handling:**
- Clear error messages
- Shadcn Toast notifications
- Preserve form data on errors
- No `alert()` dialogs

### Compliance Requirements

**COPPA/GDPR Compliance:**
- Parental consent required for wish publication
- Child data minimization in notifications
- Audit trail for all parental decisions
- Data retention: 3 years (NFR18)
- Right to explanation (rejection reasons visible to child)

### Open Questions / Decisions Needed

1. **Batch Approval Workflow:**
   - Option A: Set same points threshold for all
   - Option B: Allow individual points setting per wish
   - **Decision:** Option B - Allow individual points setting (more flexible, per story AC #14)

2. **Rejection Preset Reasons:**
   - Option A: Fixed presets only
   - Option B: Presets + custom text
   - **Decision:** Option B - Presets + custom "其他" option (per story AC #8)

3. **Modification Scope:**
   - Option A: Allow modification of all fields
   - Option B: Allow modification of limited fields only
   - **Decision:** Option B - Limited fields (points, type, description) (per story AC #11)

4. **Notification Tone:**
   - Option A: Strict/formal tone
   - Option B: Encouraging/gentle tone (especially for rejections)
   - **Decision:** Option B - Encouraging tone (child-friendly, per PRD philosophy)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<500ms API, <3s notification, <3s page load)
5. [ ] Security requirements met (auth checks, permissions, audit logging)
6. [ ] Smart points suggestion feature working
7. [ ] Notification delivery verified
8. [ ] Batch operations working efficiently
9. [ ] Code review passed
10. [ ] Sprint status updated to ready-for-dev

### Tasks Blocked By

**Prerequisites:**
- Story 4.1: Child Creates Wish - Complete ✅
- wishlists table exists - Complete ✅
- Image upload functionality - Complete ✅
- Notification infrastructure - Complete ✅
- lib/db/queries/wishlists.ts - Complete ✅

**None identified at story creation time.**

## Dev Agent Record

### Agent Model Used

GLM-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None at story creation time.

### Completion Notes List

Story created with comprehensive implementation guidance including:
- Database schema extensions for review tracking
- API endpoint specifications for review operations
- UI component structure with parent-friendly design
- BDD test scenarios covering all acceptance criteria
- Smart points suggestion algorithm
- Batch review workflow implementation
- Notification system integration (approved/rejected)
- Dialog components for approval, rejection, and modification
- Security and permission requirements
- Performance targets for batch operations
- Audit logging for all review operations
- Child-friendly UX considerations

### File List

**Files to Modify:**
- database/schema/wishlists.ts (add review fields)
- database/migrations/XXX_add_wish_review_fields.sql
- lib/db/queries/wishlists.ts (add review functions)
- app/api/wishlists/[id]/route.ts (add approve/reject endpoints)
- app/api/wishlists/route.ts (add batch endpoints)
- types/wishlist.ts (add review types)

**Files to Create:**
- app/(parent)/wishlist/review/page.tsx
- app/(parent)/wishlist/review/[id]/page.tsx
- lib/components/dialogs/wish-approval-dialog.tsx
- lib/components/dialogs/wish-rejection-dialog.tsx
- lib/components/dialogs/wish-modify-dialog.tsx
- lib/components/dialogs/batch-review-dialog.tsx

**Test Files:**
- tests/integration/wishlists-review.spec.ts
- tests/e2e/wishlist-review.spec.ts
