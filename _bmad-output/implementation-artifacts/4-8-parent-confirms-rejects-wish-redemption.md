# Story 4.8: Parent Confirms/Rejects Wish Redemption

Status: ready-for-dev

## Story

As a 家长,
I want 确认或拒绝兑换请求,
so that 我可以确保兑换是合理的。

## Acceptance Criteria

1. Given 我已登录系统并具有家长角色
   When 孩子发起兑换请求（等待家长确认）
   Then 我在3秒内收到兑换审核通知（NFR4）
   And 通知内容："孩子{姓名}发起兑换「{愿望名称}」的请求，请审核"
   And 通知跳转到"兑换审核"页面

2. Given 我收到兑换审核通知
   When 我点击通知或进入"兑换审核"页面
   Then 系统显示所有待审核兑换请求
   And 请求按创建时间倒序排列（最新的在前）
   And 每个请求显示完整信息

3. Given "兑换审核"页面显示
   Then 每个兑换请求卡片包含：
     - 愿望名称和图片（点击可放大）
     - 消耗积分数量（醒目显示）
     - 孩子当前积分余额
     - 兑换后积分余额
     - 请求时间（X小时前）
     - 孩子姓名和头像
     - 愿望类型图标（物品/体验）

4. Given 我查看兑换请求卡片
   Then 系统显示操作按钮：
     - "确认兑换"按钮（绿色，突出显示）
     - "拒绝"按钮（红色/橙色）
     - "查看愿望详情"按钮（链接到愿望详情页）

5. Given 我点击"确认兑换"按钮
   Then 系统显示确认对话框
   And 对话框包含：
     - 愿望名称和图片
     - 消耗积分数量
     - 孩子当前积分
     - 兑换后积分余额
     - "确认兑换"和"取消"按钮
   And 对话框使用模态弹窗或Shadcn Dialog

6. Given 我在确认对话框中点击"确认兑换"
   Then 系统执行以下操作（原子事务）：
     - 扣除消耗的积分
     - 更新redemption_requests状态为'confirmed'
     - 记录确认人（家长ID）和确认时间
     - 更新wishlists状态为'redeemed'
     - 在points_history创建交易记录
     - 更新child的points_balance

7. Given 兑换请求确认成功
   Then 系统向该儿童发送通知（NFR4）
   And 通知内容："恭喜！你成功兑换「{愿望名称}」，可以去实现它了！"
   And 系统在3秒内送达通知

8. Given 我点击"拒绝"按钮
   Then 系统显示拒绝对话框
   And 对话框包含：
     - 愿望名称和图片
     - 预设拒绝原因选项：
       - "愿望不合适"
       - "积分过高，建议完成更多任务"
       - "愿望描述不够详细，请提供更多信息"
       - "其他"（自定义输入）
     - 自定义原因输入框（可选，最多200字）
     - "确认拒绝"和"取消"按钮

9. Given 我在拒绝对话框中点击"确认拒绝"
   Then 系统执行以下操作：
     - 更新redemption_requests状态为'rejected'
     - 记录拒绝原因
     - 记录拒绝人（家长ID）和拒绝时间
     - 退还积分（如果已扣除）
     - 恢复wishlists状态为'approved'（可重新兑换）

10. Given 兑换请求被拒绝
    Then 系统向该儿童发送通知（NFR4）
    And 通知内容包含愿望名称和拒绝原因
    And 通知格式："很遗憾，你的愿望「{愿望名称}」未通过兑换：{拒绝原因}"
    And 系统在3秒内送达通知

11. Given 我有多个待审核兑换请求
    When 显示兑换审核列表
    Then 系统支持批量操作
    And 批量操作包括：
     - "全部确认"按钮
     - "全部拒绝"按钮
     - 单选/全选复选框

12. Given 我选择多个请求并点击"全部确认"
    Then 系统逐个确认每个请求
    And 每个请求独立执行原子事务
    And 系统验证每个请求的积分充足度
    And 系统发送单个通知给儿童（每个请求一条）

13. Given 我选择多个请求并点击"全部拒绝"
    Then 系统显示统一拒绝原因对话框
    And 对话框包含：
     - 预设原因选项
     - 自定义原因输入
     - "确认全部拒绝"和"取消"按钮
    And 统一原因应用到所有选中的请求
    And 系统发送单个通知给儿童

14. Given 兑换请求列表有大量请求（>10个）
    When 显示列表
    Then 系统支持分页或无限滚动
    And 每页显示10-15个请求
    And 显示"加载更多"提示

15. Given 兑换请求在审核期间（等待确认）
    When 积分门槛被家长修改（Story 4.3）
    Then 系统自动取消兑换请求
    And 请求状态更新为'invalidated'
    And 系统记录无效原因："积分门槛已更新，兑换请求无效"
    And 系统通知儿童："兑换请求已取消（积分门槛变化）"

16. Given 兑换请求在审核期间
    When 愿望被家长删除或拒绝（Story 4.2）
    Then 系统自动取消兑换请求
    And 请求状态更新为'invalidated'
    And 系统记录无效原因："愿望已被删除/拒绝"
    And 系统通知儿童："兑换请求已取消（愿望状态变化）"

17. Given 兑换请求在审核期间
    When 儿童主动取消请求（Story 4.7）
    Then 请求状态更新为'cancelled'
    And 系统通知家长："孩子取消了兑换「{愿望名称}」的请求"
    And 通知跳转到兑换审核页面

18. Given 兑换请求确认成功
    When 儿童查看已兑换愿望（Story 4.10）
    Then 系统显示兑换详情：
     - 兑换日期时间
     - 消耗积分数量
     - 兑换时余额
     - 愿望名称和图片
     - 确认家长姓名（可选显示）

19. Given 兑换请求被拒绝
    When 儿童查看愿望列表
    Then 愿望状态返回'approved'（可重新兑换）
    And "兑换"按钮恢复显示
    And 儿童可以修改愿望或重新发起兑换

20. Given 家长在"兑换审核"页面
    When 系统显示待审核请求数量
    Then 显示未审核数量徽章
    And 徽章位置：页面标题旁边
    And 徽章使用醒目颜色（如红色或主色调）

21. Given 兑换请求已审核（确认或拒绝）
    When 家长查看审核列表
    Then 系统支持显示历史记录
    And 使用标签页切换："待审核" / "已审核"
    And 已审核记录包括：
     - 请求时间
     - 审核时间
     - 审核结果（确认/拒绝）
     - 拒绝原因（如适用）
     - 操作家长

22. Given 系统处理确认操作
    When 原子事务失败或出现错误
    Then 系统回滚所有更改
    And 不扣除积分
    And 不更新请求状态
    And 向家长显示错误提示（Shadcn Toast）
    And 请求保持'pending_confirmation'状态

23. Given 兑换审核列表为空
    When 没有待审核请求
    Then 系统显示空状态提示
    And 提示内容："暂无待审核的兑换请求"
    And 显示引导插画或图标

24. Given 家长在"兑换审核"页面
    Then 系统支持下拉刷新功能
    And 下拉刷新时重新获取最新数据
    And 显示刷新动画
    And 刷新完成后隐藏动画

25. Given 家长在审核兑换请求
    When 儿童同时发起新的兑换请求
    Then 系统实时更新列表（2-3秒同步，NFR4）
    And 新请求自动添加到列表顶部
    And 显示新请求通知徽章

26. Given 系统执行批量确认或拒绝
    Then API响应时间<500ms（NFR3: P95）
    And 每个请求独立处理
    And 系统为每个操作记录审计日志

27. Given 家长在"兑换审核"页面
    When 查看兑换请求详情
    Then 系统支持点击展开查看更多信息
    And 展开信息包括：
     - 愿望完整描述
     - 愿望创建时间
     - 儿童近期积分获取趋势（7天平均）

28. Given 兑换请求已审核（确认或拒绝）
    When 家长撤销审核结果
    Then 系统支持撤销操作
    And 仅在审核后5分钟内可撤销
    And 撤销时：
     - 退还已扣除积分（如确认）
     - 恢复redemption_requests状态为'pending_confirmation'
     - 恢复wishlists状态为'approved'
     - 通知儿童："家长撤销了兑换审核"

29. Given 兑换请求已审核超过5分钟
    When 家长尝试撤销
    Then 系统显示错误提示："审核已超过5分钟，无法撤销"
    And 撤销操作被禁用

30. Given 家长在"兑换审核"页面
    Then 系统显示兑换统计信息
    And 统计包括：
     - 本周确认数量
     - 本周拒绝数量
     - 本月确认数量
     - 本月拒绝数量
    And 统计数据使用图表显示（可选）

## Tasks / Subtasks

- [ ] Task 1: Extend redemption requests query functions (AC: #1-#3, #14-#16, #21, #25-#30)
  - [ ] Extend lib/db/queries/redemptions.ts (from Story 4.7)
  - [ ] Create getPendingRedemptionRequests() - Get requests with status 'pending_confirmation'
  - [ ] Create getReviewedRedemptionRequests() - Get confirmed/rejected/invalidated/cancelled requests
  - [ ] Create getRedemptionRequestsByFamily() - Get all requests for family
  - [ ] Create confirmRedemptionRequest() - Confirm request with points deduction
  - [ ] Create rejectRedemptionRequest() - Reject request with reason
  - [ ] Create batchConfirmRequests() - Batch confirm multiple requests
  - [ ] Create batchRejectRequests() - Batch reject multiple requests
  - [ ] Create revertRedemptionRequest() - Revert recent confirmation
  - [ ] Create getRedemptionStatistics() - Get weekly/monthly stats
  - [ ] Support pagination (offset, limit)
  - [ ] Support filtering by status and date range

- [ ] Task 2: Create redemption review API endpoints (AC: #1-#13, #15-#16, #21-#22, #26, #28-#29)
  - [ ] Create GET /api/redemptions/pending-review - Get pending requests
  - [ ] Create GET /api/redemptions/reviewed - Get reviewed requests
  - [ ] Create POST /api/redemptions/[id]/confirm - Confirm single request
  - [ ] Create POST /api/redemptions/[id]/reject - Reject single request
  - [ ] Create POST /api/redemptions/batch-confirm - Batch confirm requests
  - [ ] Create POST /api/redemptions/batch-reject - Batch reject requests
  - [ ] Create POST /api/redemptions/[id]/revert - Revert recent confirmation
  - [ ] Verify user authentication (Better-Auth session)
  - [ ] Verify user role is 'parent'
  - [ ] Verify user belongs to redemption's family
  - [ ] Validate request body (Zod schema)
  - [ ] Handle confirm operation (atomic transaction with points deduction)
  - [ ] Handle reject operation (update status, record reason)
  - [ ] Send notifications to child on confirm/reject
  - [ ] Send notification to parent on child cancellation
  - [ ] Handle auto-invalidation (threshold change, wish deletion)
  - [ ] Record audit logs for all operations
  - [ ] Return updated request data

- [ ] Task 3: Create redemption review UI page (AC: #1-#4, #14, #20-#24, #30)
  - [ ] Create app/(parent)/redemptions/review/page.tsx
  - [ ] Create redemption review page structure:
     - Header with pending count badge
     - Tab navigation: 待审核 / 已审核
     - Request cards grid/list
     - Batch action buttons (全部确认/全部拒绝)
     - Statistics section (optional chart)
     - Pull-to-refresh
  - [ ] Display pending requests (status = 'pending_confirmation')
  - [ ] Display reviewed requests with status tabs
  - [ ] Support pagination/infinite scroll
  - [ ] Empty state handling
  - [ ] Responsive design (parent-end: mini-program optimized)

- [ ] Task 4: Create redemption request card component (AC: #3-#4, #27)
  - [ ] Create lib/components/features/redemption-request-card.tsx
  - [ ] Display wish information:
     - Wish name and image (click to zoom)
     - Wish type icon
     - Child name and avatar
  - [ ] Display points information:
     - Points cost
     - Child's current balance
     - Balance after redemption
  - [ ] Display request time
  - [ ] Add action buttons:
     - "确认兑换" (green, primary)
     - "拒绝" (red/orange)
     - "查看愿望详情" (link)
  - [ ] Add expand button for more details
  - [ ] Add checkbox for batch selection
  - [ ] Support expandable details (wish description, 7-day trend)

- [ ] Task 5: Create confirmation dialog (AC: #5-#6)
  - [ ] Create lib/components/dialogs/redemption-confirm-dialog.tsx
  - [ ] Display wish details (name, image, type)
  - [ ] Display points information (cost, current, after)
  - [ ] Add "确认兑换" and"取消" buttons
  - [ ] Use Shadcn Dialog
  - [ ] Add warning if post-redemption balance is low
  - [ ] Responsive design

- [ ] Task 6: Create rejection dialog (AC: #8-#9)
  - [ ] Create lib/components/dialogs/redemption-reject-dialog.tsx
  - [ ] Display wish details (name, image)
  - [ ] Add preset rejection reasons:
     - "愿望不合适"
     - "积分过高，建议完成更多任务"
     - "愿望描述不够详细，请提供更多信息"
     - "其他" (custom input)
  - [ ] Add custom reason input (max 200 chars)
  - [ ] Add "确认拒绝" and"取消" buttons
  - [ ] Use Shadcn Dialog

- [ ] Task 7: Implement batch operations (AC: #11-#13, #26)
  - [ ] Create lib/components/dialogs/batch-review-dialog.tsx
  - [ ] Display selected requests count
  - [ ] Add "全部确认" button
  - [ ] Add "全部拒绝" button
  - [ ] For batch rejection: show unified reason dialog
  - [ ] Handle checkbox selection (single/all)
  - [ ] Process each request independently
  - [ ] Send individual notifications per request
  - [ ] Show progress indicator during batch processing

- [ ] Task 8: Implement confirm operation (AC: #6-#7, #22)
  - [ ] Create lib/services/redemption-confirmation.ts
  - [ ] Use database transaction (atomic)
  - [ ] Steps:
     1. Lock redemption request row
     2. Verify child has enough points
     3. Deduct points from child's balance
     4. Update redemption request status to 'confirmed'
     5. Record confirmed_by and confirmed_at
     6. Update wish status to 'redeemed'
     7. Create points history transaction
     8. Update balance timestamp
  - [ ] Rollback on error
  - [ ] Send notification to child
  - [ ] Return success/failure

- [ ] Task 9: Implement reject operation (AC: #9-#10, #16)
  - [ ] Create lib/services/redemption-rejection.ts
  - [ ] Steps:
     1. Update redemption request status to 'rejected'
     2. Record rejection_reason
     3. Record rejected_by and rejected_at
     4. Update wish status back to 'approved' (redeemable)
     5. Return points if already deducted
  - [ ] Send notification to child
  - [ ] Return success/failure

- [ ] Task 10: Implement auto-invalidation logic (AC: #15-#16)
  - [ ] Create lib/services/redemption-invalidation.ts
  - [ ] Listen for threshold changes (from Story 4.3)
  - [ ] Listen for wish deletions/rejections (from Story 4.2)
  - [ ] On threshold change:
     - Find pending redemption requests
     - Invalidate if new threshold > current points
     - Update status to 'invalidated'
     - Record invalidation_reason
     - Notify child
  - [ ] On wish deletion/rejection:
     - Find related redemption requests
     - Invalidate all pending requests
     - Update status to 'invalidated'
     - Record invalidation_reason
     - Notify child

- [ ] Task 11: Implement revert operation (AC: #28-#29)
  - [ ] Create revertRedemptionRequest() function
  - [ ] Check if within 5-minute window
  - [ ] If yes:
     - Return deducted points
     - Update redemption status to 'pending_confirmation'
     - Update wish status back to 'approved'
     - Record revert action in audit logs
     - Notify child
  - [ ] If no (beyond 5 minutes):
     - Return error: "审核已超过5分钟，无法撤销"
  - [ ] Prevent duplicate reverses

- [ ] Task 12: Create notification sending (AC: #1, #7, #10, #17)
  - [ ] Extend lib/notifications/redemption-notifications.ts
  - [ ] Create notification type: 'redemption_confirmed'
  - [ ] Create notification type: 'redemption_rejected'
  - [ ] Create notification type: 'redemption_invalidated'
  - [ ] Create notification type: 'redemption_cancelled_by_child'
  - [ ] Create notification type: 'redemption_reverted'
  - [ ] Send to child on confirm/reject/invalidation/reversion
  - [ ] Send to parent on child cancellation
  - [ ] Deliver within 3 seconds (NFR4)

- [ ] Task 13: Implement statistics display (AC: #30)
  - [ ] Create lib/components/features/redemption-statistics.tsx
  - [ ] Calculate weekly stats (confirmed/rejected counts)
  - [ ] Calculate monthly stats (confirmed/rejected counts)
  - [ ] Display using Recharts or simple stats cards
  - [ ] Show as collapsible section on review page

- [ ] Task 14: Implement reviewed history (AC: #21)
  - [ ] Add tab navigation: 待审核 / 已审核
  - [ ] Reviewed tab shows:
     - Reviewed requests list
     - Review result (confirmed/rejected/invalidated/cancelled)
     - Review time
     - Reviewed by parent name
     - Rejection reason (if applicable)
     - Support filtering and sorting

- [ ] Task 15: Write BDD tests (AC: #1-#30)
  - [ ] **Given** 孩子发起兑换请求 **When** 家长在线 **Then** 3秒内收到通知
  - [ ] **Given** 家长进入审核页 **When** 有待审核请求 **Then** 显示请求列表
  - [ ] **Given** 家长确认兑换 **When** 点击确认 **Then** 扣除积分并通知儿童
  - [ ] **Given** 家长拒绝兑换 **When** 填写原因 **Then** 愿望返回可兑换状态并通知儿童
  - [ ] **Given** 家长批量确认 **When** 选择多个 **Then** 每个请求独立处理
  - [ ] **Given** 门槛修改 **When** 请求待审核 **Then** 自动取消并通知儿童
  - [ ] **Given** 愿望被删除 **When** 请求待审核 **Then** 自动取消并通知儿童
  - [ ] **Given** 儿童取消请求 **When** 家长在线 **Then** 收到取消通知
  - [ ] **Given** 审核成功 **When** 5分钟内 **Then** 可以撤销
  - [ ] **Given** 审核超过5分钟 **When** 尝试撤销 **Then** 显示错误提示
  - [ ] **Given** 原子事务失败 **When** 确认操作 **Then** 回滚更改并显示错误
  - [ ] **Given** 下拉刷新 **When** 释放 **Then** 刷新数据
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 16: Performance and compliance verification (AC: #26, #30)
  - [ ] Verify API response time < 500ms (NFR3: P95)
  - [ ] Verify notification delivery < 3 seconds (NFR4)
  - [ ] Verify batch operations performance
  - [ ] Verify atomic transaction reliability
  - [ ] Verify audit logging (NFR14)
  - [ ] Verify child data privacy (COPPA/GDPR)

## Dev Notes

### Project Structure Notes

**Alignment with unified project structure:**
- Queries: `lib/db/queries/redemptions.ts` (extend from Story 4.7)
- Service: `lib/services/redemption-confirmation.ts` (new)
- Service: `lib/services/redemption-rejection.ts` (new)
- Service: `lib/services/redemption-invalidation.ts` (new)
- Page: `app/(parent)/redemptions/review/page.tsx` (new)
- Component: `lib/components/features/redemption-request-card.tsx` (new)
- Component: `lib/components/dialogs/redemption-confirm-dialog.tsx` (new)
- Component: `lib/components/dialogs/redemption-reject-dialog.tsx` (new)
- Component: `lib/components/dialogs/batch-review-dialog.tsx` (new)
- Component: `lib/components/features/redemption-statistics.tsx` (new)
- Types: `types/redemption.ts` (extend from Story 4.7)

**Detected conflicts/variances:**
- None identified at story creation time

### Previous Story Intelligence

**From Story 4.1 (Child Creates Wish):**
- wishlists table exists
- Wish status tracking (approved, pending_review, rejected)

**From Story 4.2 (Parent Reviews Wish):**
- Wish approval/rejection workflow exists
- Audit logging infrastructure exists
- Notification infrastructure exists
- **Can reuse:** Audit logging pattern
- **Can reuse:** Notification system

**From Story 4.3 (Parent Sets Points Threshold):**
- Points threshold can be modified
- Real-time updates supported
- **Can reuse:** Threshold change triggers invalidation

**From Story 4.4 (Wish Progress Bar Display):**
- Progress tracking exists
- Current points calculation exists
- **Can reuse:** Current points for display

**From Story 4.5 (Smart Wish Estimation):**
- 7-day average calculation exists
- **Can reuse:** Child's points trend for review

**From Story 4.6 (Child Views All Wishes):**
- Wish card structure exists
- **Can reuse:** Similar card pattern for redemption requests

**From Story 4.7 (Child Initiates Wish Redemption):**
- redemption_requests table created
- Redemption request lifecycle defined
- Pending request handling exists
- **Can reuse:** redemption_requests schema
- **Can reuse:** Request statuses

**From Epic 3 (Points System):**
- Points balance tracking exists
- Points history tracking exists
- Points deduction logic exists
- **Can reuse:** Points balance queries
- **Can reuse:** Points history recording
- **Can reuse:** Atomic transaction patterns

### Database Schema Extensions

**redemption_requests Table** (from Story 4.7):
```typescript
// database/schema/redemption-requests.ts (already exists)
// Existing fields:
- id, wishId, childId, familyId, pointsCost, pointsBefore, pointsAfter
- status (pending_confirmation, confirmed, rejected, cancelled, invalidated)
- confirmedBy, confirmedAt, rejectionReason, cancelledAt, invalidationReason
- createdAt, updatedAt

// New indexes for review queries:
CREATE INDEX idx_redemption_requests_status_created 
  ON redemption_requests(status, created_at DESC);

CREATE INDEX idx_redemption_requests_family_status 
  ON redemption_requests(family_id, status);
```

### Confirmation Transaction Logic

**Atomic Transaction Steps:**
```typescript
// lib/services/redemption-confirmation.ts
async function confirmRedemption(
  redemptionRequestId: string,
  parentId: string
): Promise<ConfirmationResult> {
  const transaction = await db.transaction(async (tx) => {
    // 1. Lock and verify request
    const request = await tx.query.redemptionRequests.findFirst({
      where: eq(redemptionRequests.id, redemptionRequestId)
    });
    
    if (!request) throw new Error('Request not found');
    if (request.status !== 'pending_confirmation') {
      throw new Error('Request already processed');
    }
    
    // 2. Verify child has enough points
    const balance = await tx.query.pointBalances.findFirst({
      where: eq(pointBalances.userId, request.childId)
    });
    
    if (balance.balance < request.pointsCost) {
      throw new Error('Insufficient points');
    }
    
    // 3. Deduct points
    await tx.update(pointBalances)
      .set({
        balance: balance.balance - request.pointsCost,
        updatedAt: Date.now()
      })
      .where(eq(pointBalances.userId, request.childId));
    
    // 4. Update redemption request
    await tx.update(redemptionRequests)
      .set({
        status: 'confirmed',
        confirmedBy: parentId,
        confirmedAt: Date.now(),
        updatedAt: Date.now()
      })
      .where(eq(redemptionRequests.id, redemptionRequestId));
    
    // 5. Update wish status
    await tx.update(wishlists)
      .set({
        status: 'redeemed',
        updatedAt: Date.now()
      })
      .where(eq(wishlists.id, request.wishId));
    
    // 6. Create points history transaction
    await tx.insert(pointsHistory)
      .values({
        userId: request.childId,
        familyId: request.familyId,
        type: 'redemption',
        points: -request.pointsCost,
        balanceBefore: request.pointsBefore,
        balanceAfter: request.pointsAfter,
        relatedWishId: request.wishId,
        relatedRedemptionId: redemptionRequestId,
        description: `兑换愿望（确认：${parentId}）`
      });
    
    return {
      success: true,
      newBalance: balance.balance - request.pointsCost
    };
  });
  
  // Send notification after transaction
  await sendRedemptionConfirmedNotification(request);
  
  // Audit log
  await createAuditLog({
    userId: parentId,
    action: 'redemption_confirmed',
    resourceType: 'redemption_request',
    resourceId: redemptionRequestId,
    details: {
      wishId: request.wishId,
      childId: request.childId,
      pointsCost: request.pointsCost
    }
  });
  
  return {
    success: true,
    newBalance: transaction.newBalance
  };
}
```

### Rejection Logic

```typescript
// lib/services/redemption-rejection.ts
async function rejectRedemption(
  redemptionRequestId: string,
  parentId: string,
  rejectionReason: string
): Promise<RejectionResult> {
  // Get request details
  const request = await getRedemptionRequestById(redemptionRequestId);
  if (!request) throw new Error('Request not found');
  
  // Update redemption request status
  await db.update(redemptionRequests)
    .set({
      status: 'rejected',
      rejectedBy: parentId,
      rejectionReason,
      updatedAt: Date.now()
    })
    .where(eq(redemptionRequests.id, redemptionRequestId));
  
  // Update wish status back to 'approved' (redeemable)
  await db.update(wishlists)
    .set({
      status: 'approved',
      updatedAt: Date.now()
    })
    .where(eq(wishlists.id, request.wishId));
  
  // Send notification to child
  await sendRedemptionRejectedNotification(request, rejectionReason);
  
  // Audit log
  await createAuditLog({
    userId: parentId,
    action: 'redemption_rejected',
    resourceType: 'redemption_request',
    resourceId: redemptionRequestId,
    details: {
      wishId: request.wishId,
      childId: request.childId,
      rejectionReason
    }
  });
  
  return {
    success: true,
    wishStatus: 'approved' (redeemable again)
  };
}
```

### Revert Logic (5-minute window)

```typescript
async function revertRedemption(
  redemptionRequestId: string,
  parentId: string
): Promise<RevertResult> {
  const request = await getRedemptionRequestById(redemptionRequestId);
  if (!request) throw new Error('Request not found');
  
  // Check if within 5-minute window
  const confirmedAt = request.confirmedAt || 0;
  const now = Date.now();
  const fiveMinutesMs = 5 * 60 * 1000;
  
  if (now - confirmedAt > fiveMinutesMs) {
    throw new Error('审核已超过5分钟，无法撤销');
  }
  
  // Verify parent is the one who confirmed
  if (request.confirmedBy !== parentId) {
    throw new Error('只能撤销自己的审核操作');
  }
  
  // Return points
  await db.update(pointBalances)
    .set({
      balance: request.pointsBefore,
      updatedAt: Date.now()
    })
    .where(eq(pointBalances.userId, request.childId));
  
  // Update redemption status back to pending
  await db.update(redemptionRequests)
    .set({
      status: 'pending_confirmation',
      confirmedBy: null,
      confirmedAt: null,
      updatedAt: Date.now()
    })
    .where(eq(redemptionRequests.id, redemptionRequestId));
  
  // Update wish status back to approved
  await db.update(wishlists)
    .set({
      status: 'approved',
      updatedAt: Date.now()
    })
    .where(eq(wishlists.id, request.wishId));
  
  // Notify child
  await sendRedemptionRevertedNotification(request);
  
  // Audit log
  await createAuditLog({
    userId: parentId,
    action: 'redemption_reverted',
    resourceType: 'redemption_request',
    resourceId: redemptionRequestId,
    details: {
      wishId: request.wishId,
      childId: request.childId,
      originalConfirmedAt: confirmedAt
    }
  });
  
  return {
    success: true
  };
}
```

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. Parent receives notification when child initiates redemption
2. Parent views pending redemption requests
3. Parent confirms redemption request
4. Parent rejects redemption request
5. Child receives notification when confirmed
6. Child receives notification when rejected
7. Parent confirms multiple requests (batch)
8. Parent rejects multiple requests with unified reason
9. Auto-invalidation when threshold changes
10. Auto-invalidation when wish deleted
11. Child cancels request, parent receives notification
12. Parent reverts recent confirmation (within 5 min)
13. Parent cannot revert beyond 5-minute window
14. Transaction rollback on error
15. Pull-to-refresh updates list
16. Real-time updates when new requests arrive
17. Statistics display (weekly/monthly)
18. Reviewed history navigation

**Integration Tests:**
- Confirmation transaction atomicity
- Rejection status updates
- Points deduction accuracy
- Batch operations performance
- Auto-invalidation triggers
- Revert window enforcement
- Audit logging completeness

**E2E Tests (Playwright):**
- Complete confirmation flow
- Complete rejection flow
- Batch confirmation flow
- Batch rejection flow
- Revert operation flow
- Auto-invalidation scenarios
- Statistics display verification
- Reviewed history navigation

### Performance Requirements

- API response time: < 500ms (NFR3: P95) - AC #26
- Notification delivery: < 3 seconds (NFR4) - AC #1, #7, #10
- Transaction completion: < 200ms
- Batch operations: < 1s for 10 requests
- Page load: < 3 seconds (NFR2)

### UX Requirements

**Parent-End Design (from UX decisions):**
- Mini-program optimized (portrait, <450px)
- Efficient batch operations
- Clear action buttons
- Quick navigation
- Review history access

**Review Page Design:**
- Header with pending count badge
- Tab navigation: 待审核 / 已审核
- Request cards with all information
- Batch action buttons
- Statistics section (optional)
- Pull-to-refresh

**Request Card Design:**
- Wish image and name prominent
- Points information clearly labeled
- Child name and avatar
- Action buttons (confirm/reject) prominent
- Expand button for details
- Checkbox for batch selection

**Confirmation Dialog Design:**
- Wish details prominent
- Points breakdown clear
- Warning for low post-redemption balance
- "确认兑换" button primary, green

**Rejection Dialog Design:**
- Preset reasons for quick selection
- Custom reason input optional
- Clear, actionable rejection reasons

**Error Handling:**
- Clear error messages
- Shadcn Toast notifications
- Transaction rollback with feedback
- No `alert()` dialogs

### Compliance Requirements

**COPPA/GDPR Compliance:**
- Parental control (confirmation default)
- Child data privacy (only child/parent can see)
- Audit trail for all redemption operations
- Data retention: 3 years (NFR18)
- Clear age-appropriate messaging for child notifications

### Open Questions / Decisions Needed

1. **Revert Window Duration:**
   - Option A: 1 minute
   - Option B: 5 minutes
   - Option C: 10 minutes
   - **Decision:** 5 minutes (per AC #29, balanced between flexibility and control)

2. **Batch Operation Limit:**
   - Option A: No limit
   - Option B: Limit to 10 per batch
   - Option C: Limit to 20 per batch
   - **Decision:** No limit with progress indicator (flexible, per AC #11)

3. **Statistics Display:**
   - Option A: Always show
   - Option B: Collapsible section
   - Option C: Separate page
   - **Decision:** Collapsible section (non-intrusive, per AC #30)

4. **Notification Content Tone:**
   - Option A: Formal
   - Option B: Encouraging
   - Option C: Informative only
   - **Decision:** Encouraging (positive reinforcement, per product vision)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<500ms API, <3s notification)
5. [ ] Security requirements met (auth checks, atomic transactions)
6. [ ] Atomic transaction reliability verified
7. [ ] Auto-invalidation logic working
8. [ ] Revert operation working within time window
9. [ ] Batch operations working efficiently
10. [ ] Statistics display functional
11. [ ] Audit logging complete
12. [ ] Child data privacy maintained
13. [ ] Code review passed
14. [ ] Sprint status updated to ready-for-dev

### Tasks Blocked By

**Prerequisites:**
- Story 4.1: Child Creates Wish - Complete ✅
- Story 4.2: Parent Reviews Wish - Complete ✅
- Story 4.3: Parent Sets Points Threshold - Complete ✅
- Story 4.4: Wish Progress Bar Display - Complete ✅
- Story 4.5: Smart Wish Estimation - Complete ✅
- Story 4.6: Child Views All Wishes - Complete ✅
- Story 4.7: Child Initiates Wish Redemption - Complete ✅
- redemption_requests table exists - Complete ✅
- Points system exists - Complete ✅
- Notification infrastructure exists - Complete ✅

**None identified at story creation time.**

## Dev Agent Record

### Agent Model Used

GLM-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None at story creation time.

### Completion Notes List

Story created with comprehensive implementation guidance including:
- Complete redemption review page design
- Redemption request card component with expandable details
- Confirmation dialog with points breakdown
- Rejection dialog with preset reasons
- Atomic transaction logic for confirmation
- Rejection logic with wish status recovery
- Batch operations for efficiency
- Auto-invalidation logic (threshold changes, wish deletions)
- Revert operation with 5-minute window
- Real-time updates and pull-to-refresh
- Statistics display (weekly/monthly)
- Reviewed history navigation
- Notification system integration
- BDD test scenarios covering all acceptance criteria
- Performance targets for API and transactions
- Child data privacy and COPPA/GDPR compliance
- Audit logging for all redemption operations

### File List

**Files to Create:**
- app/(parent)/redemptions/review/page.tsx
- lib/components/features/redemption-request-card.tsx
- lib/components/dialogs/redemption-confirm-dialog.tsx
- lib/components/dialogs/redemption-reject-dialog.tsx
- lib/components/dialogs/batch-review-dialog.tsx
- lib/components/features/redemption-statistics.tsx
- lib/services/redemption-confirmation.ts
- lib/services/redemption-rejection.ts
- lib/services/redemption-invalidation.ts
- lib/notifications/redemption-notifications.ts
- app/api/redemptions/pending-review/route.ts
- app/api/redemptions/reviewed/route.ts
- app/api/redemptions/[id]/confirm/route.ts
- app/api/redemptions/[id]/reject/route.ts
- app/api/redemptions/batch-confirm/route.ts
- app/api/redemptions/batch-reject/route.ts
- app/api/redemptions/[id]/revert/route.ts

**Files to Modify:**
- lib/db/queries/redemptions.ts (extend with review queries)
- lib/db/queries/points.ts (extend with balance updates)
- types/redemption.ts (add review types)

**Test Files:**
- tests/integration/redemption-review.spec.ts (extend from Story 4.7)
- tests/e2e/redemption-review.spec.ts
- tests/fixtures/redemption-requests.ts
