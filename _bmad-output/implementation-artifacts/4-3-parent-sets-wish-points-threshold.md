# Story 4.3: Parent Sets Wish Points Threshold

Status: ready-for-dev

## Story

As a 家长,
I want 设置愿望的积分门槛,
so that 我可以控制儿童兑换愿望的积分要求。

## Acceptance Criteria

1. Given 我已登录系统并具有家长角色
   When 孩子创建了愿望（等待审核或已通过）
   Then 我可以查看愿望的当前积分门槛设置

2. Given 我查看愿望详情（无论审核状态）
   When 我想调整愿望的积分门槛
   Then 系统显示积分门槛编辑功能
   And 系统显示当前积分门槛值
   And 系统显示儿童设置的期望积分（作为参考）

3. Given 我进入积分门槛编辑模式
   Then 系统显示建议积分范围
   And 建议基于：
     - 愿望类型（物品/体验）
     - 愿望价值（高/中/低）
     - 儿童历史积分获取速度
     - 当前儿童积分余额

4. Given 我调整积分门槛
   When 系统显示建议范围
   Then 建议范围格式："建议 {min}-{max} 分"
   And 系统显示推荐值（基于历史数据）
   And 推荐值 = 儿童平均7天积分 × 7 × 类型系数

5. Given 我填写新的积分门槛值
   Then 系统实时验证范围（10-10000）
   And 系统显示："按照当前速度，还需X天"估算
   And 系统显示当前儿童积分余额
   And 系统显示修改后的进度百分比

6. Given 修改后积分门槛 > 儿童当前积分
   When 愿望在儿童视图中
   Then 愿望状态保持"已通过"
   And 进度条显示完成度 < 100%
   And 显示"还差Y分"提示

7. Given 修改后积分门槛 ≤ 儿童当前积分
   When 愿望在儿童视图中
   Then 愿望状态更新为"可兑换"
   And 进度条显示完成度 ≥ 100%
   And 显示"可以兑换啦！"提示

8. Given 我修改已审核通过愿望的积分门槛
   Then 系统记录修改历史（audit log）
   And 记录包含：
     - 修改人（家长ID）
     - 修改时间
     - 旧积分门槛值
     - 新积分门槛值
     - 修改原因（可选，100字）

9. Given 我修改积分门槛
   Then 积分门槛设置立即生效
   And 儿童端实时更新（2-3秒同步，NFR4）
   And 愿望进度条立即反映新值

10. Given 积分门槛修改成功
    Then 系统在3秒内向儿童发送通知（NFR4）
    And 通知内容："你的愿望「{愿望名称}」积分门槛已更新：{旧值} → {新值}"
    And 通知跳转到愿望详情页

11. Given 愿望积分门槛修改后
    When 儿童查看愿望列表或详情
    Then 愿望进度条颜色根据新进度更新：
      - 0-25%：灰色
      - 26-50%：蓝色
      - 51-75%：橙色
      - 76-99%：绿色
      - 100%+：金色（可兑换）

12. Given 我修改积分门槛到低于10或高于10000
    When 我点击保存
    Then 系统显示错误提示："积分门槛必须在10-10000之间"
    And 保存操作失败
    And 保留用户输入的值

13. Given 修改后愿望从"可兑换"状态变回"进行中"
    When 儿童已经发起兑换请求（但未确认）
    Then 兑换请求自动失效
    And 儿童收到通知："积分门槛已更新，请重新发起兑换"
    And 愿望状态回到"进行中"

14. Given 愿望审核中（等待家长审核）
    When 我修改积分门槛
    Then 系统将积分门槛值保存为"拟设置值"
    And 正式积分门槛在愿望审核通过时才生效
    And 儿童看到的是儿童期望积分（不是家长设置值）

15. Given 愿望已审核通过
    When 我修改积分门槛
    Then 积分门槛立即生效
    And 覆盖之前设置的积分门槛
    And 记录修改历史到audit log

16. Given 我没有家长权限
    When 我尝试修改积分门槛
    Then 系统显示错误提示："权限不足，仅家长可修改积分门槛"
    And 修改操作失败

17. Given 家长修改积分门槛
    Then 系统验证家长属于愿望所在家庭
    And 只有愿望所在家庭的家长可以修改

18. Given 我修改多个愿望的积分门槛
    When 系统处理批量修改
    Then API响应时间<500ms（NFR3: P95）
    And 系统为每个愿望发送单独的修改通知
    And 系统记录每个修改到audit log

19. Given 愿望已兑换（状态为"已兑换"）
    When 我尝试修改积分门槛
    Then 系统显示错误提示："已兑换的愿望无法修改积分门槛"
    And 修改操作失败

20. Given 积分门槛修改操作
    Then 审核操作记录到审计日志（NFR14）
    And 记录包含：审核人、操作类型（修改）、修改时间、旧值、新值、原因（可选）

21. Given 愿望积分门槛修改后
    When 系统计算进度条
    Then 进度百分比 = (儿童当前积分 / 积分门槛) × 100
    And 进度四舍五入到整数百分比
    And 超过100%时显示为"可兑换"

22. Given 积分门槛修改失败（网络错误、数据库错误等）
    Then 系统显示错误提示（使用Shadcn Toast）
    And 错误信息包含具体原因
    And 保留用户已填写的内容（积分门槛值、修改原因）

## Tasks / Subtasks

- [ ] Task 1: Update wishlists schema for points threshold tracking (AC: #8, #15, #20)
  - [ ] Add threshold_history column (JSON array, nullable)
    ```typescript
    // Example structure:
    [
      {
        "threshold": 500,
        "changed_at": 1234567890,
        "changed_by": "parent_user_id",
        "old_threshold": 400,
        "reason": "adjusted for difficulty"
      }
    ]
    ```
  - [ ] Add temp_threshold column (integer, nullable) - for pending review wishes
  - [ ] Generate Drizzle migration
  - [ ] Apply migration to database

- [ ] Task 2: Create points threshold management query functions (AC: #1-#20)
  - [ ] Create updateWishThreshold() - Update points threshold with history tracking
  - [ ] Create getWishThresholdHistory() - Get threshold modification history
  - [ ] Create batchUpdateWishThresholds() - Batch update multiple thresholds
  - [ ] Create canModifyWishThreshold() - Check if wish threshold can be modified
  - [ ] Validate threshold range (10-10000)
  - [ ] Record threshold modification to history

- [ ] Task 3: Create points threshold API endpoints (AC: #2-#18, #20, #22)
  - [ ] Create PUT /api/wishlists/[id]/threshold - Update wish threshold
  - [ ] Create GET /api/wishlists/[id]/threshold-history - Get modification history
  - [ ] Create POST /api/wishlists/batch-update-threshold - Batch update thresholds
  - [ ] Verify user authentication (Better-Auth session)
  - [ ] Verify user role is 'parent'
  - [ ] Verify user belongs to wish's family
  - [ ] Verify wish status allows threshold modification
  - [ ] Validate new threshold value (10-10000)
  - [ ] Record modification to threshold_history
  - [ ] Invalidate pending redemption requests if status changes to not redeemable
  - [ ] Send notification to child after modification
  - [ ] Log operation to audit logs

- [ ] Task 4: Create smart points suggestion algorithm (AC: #3-#5)
  - [ ] Create lib/services/points-suggestion.ts
  - [ ] Calculate suggestion based on wish type (item/experience)
  - [ ] Calculate suggestion based on child's points history
  - [ ] Calculate suggestion based on wish value (high/medium/low)
  - [ ] Generate min/max suggestion range
  - [ ] Generate recommended value (avg_daily_points × 7 × type_coefficient)
  - [ ] Display "按照当前速度，还需X天" estimation
  - [ ] Update estimation when threshold value changes

- [ ] Task 5: Create threshold modification UI - Edit Mode (AC: #2-#7, #11)
  - [ ] Create lib/components/dialogs/threshold-edit-dialog.tsx
  - [ ] Display current threshold value
  - [ ] Display child's desired points (reference)
  - [ ] Display suggested points range (min-max)
  - [ ] Display recommended value
  - [ ] Add threshold input (10-10000)
  - [ ] Display child's current points balance
  - [ ] Display "按照当前速度，还需X天" estimation
  - [ ] Display progress bar preview (showing new completion %)
  - [ ] Add real-time validation
  - [ ] Add "保存" and"取消" buttons
  - [ ] Optional: Add modification reason input (100 chars)
  - [ ] Optimistic UI update
  - [ ] Responsive design (parent-end: mini-program optimized)

- [ ] Task 6: Create threshold modification UI - Batch Edit (AC: #18)
  - [ ] Create lib/components/dialogs/batch-threshold-edit-dialog.tsx
  - [ ] Allow selection of multiple wishes
  - [ ] Add "批量修改积分门槛" button
  - [ ] Support setting same threshold for all selected wishes
  - [ ] Support individual threshold setting
  - [ ] Add "确认批量修改" and"取消" buttons
  - [ ] Display batch modification summary
  - [ ] API response time < 500ms

- [ ] Task 7: Update wish progress bar calculation (AC: #6, #7, #11, #21)
  - [ ] Update lib/components/features/wish-progress.tsx (from Story 4.4)
  - [ ] Calculate progress percentage = (current_points / points_threshold) × 100
  - [ ] Update progress bar colors based on new percentage
  - [ ] Handle edge case: percentage ≥ 100% (show "可兑换")
  - [ ] Handle edge case: percentage < 0 (show "需努力")
  - [ ] Real-time update when threshold changes
  - [ ] Display "还差Y分" when not yet redeemable

- [ ] Task 8: Implement redemption request invalidation (AC: #13)
  - [ ] Check if wish has pending redemption request
  - [ ] If threshold increases beyond current points, invalidate request
  - [ ] Update redemption request status to 'invalidated'
  - [ ] Send notification to child: "积分门槛已更新，请重新发起兑换"
  - [ ] Allow child to create new redemption request

- [ ] Task 9: Create threshold modification notification (AC: #10)
  - [ ] Create notification type: "wish_threshold_updated"
  - [ ] Send notification to child after threshold modification
  - [ ] Include old and new threshold values
  - [ ] Include wish name
  - [ ] Link to wish detail page
  - [ ] Deliver within 3 seconds (NFR4)
  - [ ] Store in notifications table

- [ ] Task 10: Add permission and status checks (AC: #16-#19)
  - [ ] Verify only parents can modify thresholds
  - [ ] Verify parent belongs to wish's family
  - [ ] Check wish status allows modification:
     - pending_review: can modify (temp_threshold)
     - approved: can modify (points_threshold)
     - rejected: can modify (temp_threshold)
     - redeemed: cannot modify
  - [ ] Return appropriate error messages for each case

- [ ] Task 11: Update audit logging for threshold modifications (AC: #8, #20)
  - [ ] Log threshold modification operations
  - [ ] Record: who, when, which wish, old value, new value, reason
  - [ ] Store in audit logs table
  - [ ] Support audit log retrieval
  - [ ] Include in threshold_history JSON in wishlists table

- [ ] Task 12: Write BDD tests (AC: #1-#22)
  - [ ] **Given** 家长查看愿望 **When** 进入积分门槛编辑 **Then** 显示建议范围
  - [ ] **Given** 家长修改积分门槛 **When** 保存成功 **Then** 儿童端实时更新
  - [ ] **Given** 积分门槛降低 **When** 儿童积分充足 **Then** 愿望变为"可兑换"
  - [ ] **Given** 积分门槛升高 **When** 低于儿童积分 **Then** 愿望兑换请求失效
  - [ ] **Given** 积分门槛修改 **When** 儿童**在线 **Then** 3秒内收到通知
  - [ ] **Given** 非家长用户 **When** 尝试修改门槛 **Then** 显示权限错误
  - [ ] **Given** 已兑换愿望 **When** 尝试修改门槛 **Then** 显示"已兑换无法修改"
  - [ ] **Given** 积分门槛超出范围 **When** 保存 **Then** 显示验证错误
  - [ ] **Given** 家长批量修改门槛 **When** 选择多个愿望 **Then** 批量操作成功
  - [ ] **Given** 积分门槛修改 **Then** 记录到审计日志
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 13: Performance and compliance verification (AC: #18, #20-#22)
  - [ ] Verify API response time < 500ms (NFR3: P95)
  - [ ] Verify notification delivery < 3 seconds (NFR4)
  - [ ] Verify audit logging (NFR14)
  - [ ] Verify progress bar calculation accuracy
  - [ ] Verify permission checks
  - [ ] Verify threshold range validation

## Dev Notes

### Project Structure Notes

**Alignment with unified project structure:**
- Database queries: `lib/db/queries/wishlists.ts` (extend from Stories 4.1 and 4.2)
- Schema: `database/schema/wishlists.ts` (extend from Stories 4.1 and 4.2)
- API endpoints: `app/api/wishlists/[id]/threshold/route.ts`
- Dialogs: `lib/components/dialogs/` (extend from Story 4.2)
- Services: `lib/services/points-suggestion.ts` (new)
- Types: `types/wishlist.ts` (extend from Stories 4.1 and 4.2)

**Detected conflicts/variances:**
- None identified at story creation time

### Previous Story Intelligence

**From Story 4.1: Child Creates Wish:**
- wishlists table created with points_threshold field
- Child sets desired_points (child's expectation)
- **Can reuse:** desire_points as reference value in edit dialog

**From Story 4.2: Parent Reviews Wish:**
- Approval workflow includes setting points_threshold
- Smart suggestion algorithm exists (partial)
- Notification infrastructure exists
- Audit logging infrastructure exists
- **Can reuse:** Smart suggestion base algorithm
- **Can reuse:** Notification sending logic
- **Can reuse:** Audit logging pattern
- **Can reuse:** Permission check patterns

**From Story 4.4: Wish Progress Bar Display (future):**
- Progress bar component will exist
- **Will extend:** Progress bar to support real-time threshold updates
- **Will extend:** Progress bar color scheme (already defined in AC #11)

### Database Schema Updates

**wishlists Table Extensions:**
```sql
-- Add threshold tracking fields
ALTER TABLE wishlists ADD COLUMN threshold_history TEXT; -- JSON array of modification records
ALTER TABLE wishlists ADD COLUMN temp_threshold INTEGER; -- For pending review wishes

-- Example threshold_history JSON structure:
[
  {
    "threshold": 600,
    "changed_at": 1234567890,
    "changed_by": "parent_user_id",
    "old_threshold": 500,
    "reason": "increased for difficulty"
  },
  {
    "threshold": 500,
    "changed_at": 1234567800,
    "changed_by": "parent_user_id",
    "old_threshold": 400,
    "reason": null
  }
]
```

**Audit Log Integration:**
```sql
-- Audit log entry for threshold modification
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
VALUES (
  'parent_user_id',
  'wish_threshold_updated',
  'wish',
  'wish_id',
  '{"old_threshold": 500, "new_threshold": 600, "reason": "adjusted for difficulty"}'
);
```

### API Endpoints to Create

**Points Threshold Management:**
- `PUT /api/wishlists/[id]/threshold` - Update wish threshold
- `GET /api/wishlists/[id]/threshold-history` - Get modification history
- `POST /api/wishlists/batch-update-threshold` - Batch update thresholds

**Response Format:**
```typescript
// PUT /api/wishlists/[id]/threshold
Request: {
  points_threshold: number, // 10-10000
  reason?: string // optional, max 100 chars
}

Response: {
  success: boolean,
  wish: {
    id: string,
    points_threshold: number,
    status: string,
    progress_percentage: number
  },
  notification_sent: boolean
}
```

### UI Components to Create

**Points Threshold Edit:**
- `lib/components/dialogs/threshold-edit-dialog.tsx` - Single wish threshold edit
- `lib/components/dialogs/batch-threshold-edit-dialog.tsx` - Batch threshold edit

**Extended Components:**
- `lib/components/features/wish-progress.tsx` - Extend for real-time updates
- `app/(parent)/wishlist/view/[id]/page.tsx` - Add edit threshold button

### Smart Points Suggestion Algorithm

**Enhanced Algorithm (from Story 4.2):**
```typescript
function getPointsSuggestion(
  wishType: 'item' | 'experience',
  childPointsHistory: PointsHistory[],
  currentPoints: number,
  previousThreshold?: number
): {
  min: number,
  max: number,
  recommended: number,
  estimated_days: number
} {
  const avgDailyPoints = calculateAvgDailyPoints(childPointsHistory);
  
  // Type coefficient (items cost more than experiences)
  const typeCoefficient = wishType === 'item' ? 1.2 : 1.0;
  
  // Difficulty coefficient (based on value estimation)
  const difficultyCoefficient = estimateDifficulty(wish) || 1.0;
  
  // Base calculation
  const basePoints = avgDailyPoints * 7 * typeCoefficient * difficultyCoefficient;
  
  // Calculate range
  const min = Math.max(10, Math.round(basePoints * 0.5));
  const max = Math.min(10000, Math.round(basePoints * 2.0));
  const recommended = Math.round(basePoints);
  
  // Estimate days to reach
  const estimatedDays = Math.ceil((recommended - currentPoints) / avgDailyPoints);
  
  return {
    min,
    max,
    recommended: clamp(recommended, 10, 10000),
    estimated_days: Math.max(1, estimatedDays)
  };
}

function estimateDifficulty(wish: Wish): number | undefined {
  // Estimate difficulty based on wish description, type, etc.
  // This could use NLP or manual tagging
  // For MVP, use type-based default
  return undefined; // Default to 1.0
}
```

### Progress Bar Calculation

**Real-time Progress Update:**
```typescript
function calculateProgress(
  currentPoints: number,
  pointsThreshold: number
): {
  percentage: number,
  color: string,
  status: string,
  remaining_points: number
} {
  const percentage = Math.round((currentPoints / pointsThreshold) * 100);
  
  // Determine color based on percentage
  let color: string;
  if (percentage < 26) color = 'gray';
  else if (percentage < 51) color = 'blue';
  else if (percentage < 76) color = 'orange';
  else if (percentage < 100) color = 'green';
  else color = 'gold'; // 100%+ - redeemable
  
  // Determine status message
  let status: string;
  if (percentage >= 100) status = '可以兑换啦！';
  else status = `还差${pointsThreshold - currentPoints}分`;
  
  return {
    percentage,
    color,
    status,
    remaining_points: Math.max(0, pointsThreshold - currentPoints)
  };
}
```

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. Parent views threshold suggestions when editing wish
2. Parent updates threshold with valid value
3. Parent updates threshold with invalid value (out of range)
4. Child sees real-time progress update after threshold change
5. Child receives notification when threshold updated
6. Redemption request invalidated when threshold increases
7. Non-parent user cannot modify threshold
8. Cannot modify threshold for redeemed wish
9. Batch threshold update for multiple wishes
10. Threshold modification logged to audit
11. Permission checks for cross-family wishes
12. Progress bar color updates correctly

**Integration Tests:**
- Threshold update workflow
- Smart suggestion accuracy
- Notification delivery
- Redemption request invalidation
- Permission and status checks
- Audit log recording
- Batch operations

**E2E Tests (Playwright):**
- Complete threshold edit flow
- Batch threshold edit workflow
- Progress bar real-time update
- Notification verification
- Permission denial scenarios
- Error handling scenarios

### Performance Requirements

- Threshold update API: < 500ms (P95) - AC #18
- Batch threshold update API: < 500ms (P95) - AC #18
- Notification delivery: < 3 seconds (NFR4) - AC #10
- Progress bar update: < 2s sync (NFR4) - AC #9
- Smart suggestion calculation: < 100ms

### Security Requirements

- Only authenticated parents can access - AC #16
- Only parents in same family can modify - AC #17
- Threshold range validation (10-10000) - AC #12
- Permission checks for all operations - AC #16-#17
- Audit logging for all modifications - AC #8, #20
- Child data protection (COPPA/GDPR) - AC #16

### Notification Implementation

**Notification Type:** `wish_threshold_updated`

**Target Recipient:** The child who owns the wish

**Notification Payload:**
```typescript
{
  type: 'wish_threshold_updated',
  wishId: string,
  wishTitle: string,
  oldThreshold: number,
  newThreshold: number,
  currentProgress: number,
  message: string,
  actionUrl: '/child/wishlist/view',
  createdAt: timestamp
}
```

**Message Templates:**
- Threshold increased: "你的愿望「{愿望名称}」积分门槛已更新：{旧值} → {新值}"
- Threshold decreased: "好消息！你的愿望「{愿望名称}」积分门槛降低了：{旧值} → {新值}"
- Redemption invalidated: "积分门槛已更新，请重新发起兑换"

### Redemption Request Invalidation

**Invalidation Logic:**
```typescript
async function invalidatePendingRedemptions(wishId: string, newThreshold: number, currentPoints: number) {
  // Check if wish has pending redemption requests
  const pendingRequests = await getPendingRedemptionRequests(wishId);
  
  // If new threshold > current points, invalidate requests
  if (newThreshold > currentPoints) {
    for (const request of pendingRequests) {
      await updateRedemptionRequestStatus(request.id, 'invalidated');
      await sendNotification(request.childId, {
        type: 'redemption_invalidated',
        wishId: wishId,
        message: '积分门槛已更新，请重新发起兑换'
      });
    }
  }
}
```

### UX Requirements

**Parent-End Design (from UX decisions):**
- Mini-program optimized (portrait, <450px)
- Quick edit access from wish detail
- Smart suggestions to reduce decision time
- Batch operations for efficiency
- Clear progress preview
- Real-time validation

**Edit Flow Design:**
- Direct edit from wish detail page
- Single-page dialog with all information
- Smart suggestions displayed prominently
- Progress bar preview shows result
- Optional reason field for audit

**Progress Bar Design:**
- Real-time updates when threshold changes
- Color-coded status (gray → blue → orange → green → gold)
- Percentage display
- "还差X分" message when not yet redeemable
- "可以兑换啦！" message when 100%+

**Error Handling:**
- Clear error messages
- Shadcn Toast notifications
- Preserve form data on errors
- No `alert()` dialogs
- Helpful validation messages

### Compliance Requirements

**COPPA/GDPR Compliance:**
- Parental control over wish thresholds
- Audit trail for all parental decisions
- Child data minimization in notifications
- Data retention: 3 years (NFR18)
- Right to explanation (child sees why threshold changed)

### Open Questions / Decisions Needed

1. **Modification Reason Requirement:**
   - Option A: Required (must fill reason)
   - Option B: Optional (can fill reason)
   - **Decision:** Optional (reduce friction, still audit who made change)

2. **Batch Modification Workflow:**
   - Option A: Set same threshold for all selected
   - Option B: Allow individual threshold setting per wish
   - **Decision:** Support both (flexible for different wish values)

3. **Smart Suggestion Algorithm:**
   - Option A: Use simple historical average
   - Option B: Use ML-based prediction
   - **Decision:** Simple historical average (MVP, sufficient accuracy)

4. **Redemption Invalidation Behavior:**
   - Option A: Auto-invalidate when threshold increases
   - Option B: Keep request but mark as "insufficient points"
   - **Decision:** Auto-invalidate (clearer state, prevents confusion)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<500ms API, <3s notification, <100ms suggestion)
5. [ ] Security requirements met (auth checks, permissions, audit logging)
6. [ ] Smart suggestion feature working accurately
7. [ ] Progress bar real-time updates working
8. [ ] Notification delivery verified
9. [ ] Batch operations working efficiently
10. [ ] Redemption request invalidation working
11. [ ] Code review passed
12. [ ] Sprint status updated to ready-for-dev

### Tasks Blocked By

**Prerequisites:**
- Story 4.1: Child Creates Wish - Complete ✅
- Story 4.2: Parent Reviews Wish - Complete ✅
- wishlists table exists with points_threshold - Complete ✅
- Notification infrastructure - Complete ✅
- Audit logging infrastructure - Complete ✅
- Smart suggestion base algorithm - Complete ✅

**None identified at story creation time.**

## Dev Agent Record

### Agent Model Used

GLM-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None at story creation time.

### Completion Notes List

Story created with comprehensive implementation guidance including:
- Database schema extensions for threshold history tracking
- API endpoint specifications for threshold modification
- UI component structure with parent-friendly design
- BDD test scenarios covering all acceptance criteria
- Enhanced smart points suggestion algorithm
- Batch threshold modification workflow
- Redemption request invalidation logic
- Notification system integration (threshold_updated)
- Real-time progress bar updates
- Audit logging for all modifications
- Permission and status validation
- Performance targets for suggestion calculation

### File List

**Files to Modify:**
- database/schema/wishlists.ts (add threshold_history, temp_threshold)
- database/migrations/XXX_add_threshold_tracking.sql
- lib/db/queries/wishlists.ts (add threshold functions)
- types/wishlist.ts (add threshold types)
- app/(parent)/wishlist/view/[id]/page.tsx (add edit threshold button)

**Files to Create:**
- app/api/wishlists/[id]/threshold/route.ts
- lib/services/points-suggestion.ts
- lib/components/dialogs/threshold-edit-dialog.tsx
- lib/components/dialogs/batch-threshold-edit-dialog.tsx

**Test Files:**
- tests/integration/wishlists-threshold.spec.ts
- tests/e2e/wishlist-threshold.spec.ts
- tests/fixtures/wish-threshold.ts
