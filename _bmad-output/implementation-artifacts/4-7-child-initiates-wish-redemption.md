# Story 4.7: Child Initiates Wish Redemption

Status: ready-for-dev

## Story

As a 儿童,
I want 发起兑换请求,
so that 我可以用积分兑换愿望。

## Acceptance Criteria

1. Given 儿童已登录系统（PIN码或家长设备）并具有儿童角色
   When 儿童查看已通过的愿望列表
   Then 系统显示每个愿望的"兑换"按钮（来自Story 4.6）

2. Given 儿童积分足够兑换某个愿望（当前积分 ≥ 积分门槛）
   When 儿童点击愿望上的"兑换"按钮
   Then 系统显示兑换确认对话框
   And 对话框使用模态弹窗或Shadcn Dialog
   And 对话框背景模糊或半透明

3. Given 兑换确认对话框显示
   Then 对话框包含：
     - 愿望名称（大字体突出显示）
     - 愿望图片（如果有，点击可放大）
     - 消耗积分数量（醒目显示，如"消耗 500分"）
     - 当前积分余额（"当前积分：600分"）
     - 兑换后积分余额（"兑换后：100分"）
     - 愿望类型图标（物品/体验）
     - "确认兑换"和"取消"按钮
     - 兑换规则提示（如"兑换后愿望将进入已兑换历史"）

4. Given 兑换确认对话框显示
   Then "确认兑换"按钮使用主色调（突出显示）
   And "取消"按钮使用次要样式
   And "确认兑换"按钮在儿童操作时禁用（防止重复点击）

5. Given 儿童点击"取消"按钮
   Then 对话框关闭
   And 不创建兑换请求
   And 不扣除积分
   And 返回到愿望列表或详情页

6. Given 儿童点击"确认兑换"按钮
   Then 系统检查家庭配置的"兑换是否需要家长确认"设置
   And 系统检查儿童当前积分是否足够（防止并发扣分）

7. Given 家庭配置"兑换需要家长确认"为true（默认）
   When 儿童点击"确认兑换"按钮
   Then 系统创建兑换请求记录
   And 兑换请求状态设置为"等待家长确认"
   And 系统显示"兑换请求已发送"提示（Shadcn Toast）
   And 对话框关闭
   And 返回到愿望列表

8. Given 家庭配置"兑换需要家长确认"为false
   When 儿童点击"确认兑换"按钮
   Then 系统立即扣除积分
   And 系统更新愿望状态为"已兑换"
   And 系统记录兑换到历史（points_history表）
   And 系统显示"兑换成功！"提示
   And 对话框关闭
   And 返回到愿望列表

9. Given 兑换请求创建成功（等待家长确认）
   Then 系统向家长发送通知（NFR4）
   And 通知内容："孩子{姓名}发起兑换「{愿望名称}」的请求，请审核"
   And 通知跳转到兑换审核页面
   And 系统在3秒内送达通知

10. Given 兑换成功（无需家长确认或家长已确认）
    Then 系统向家长发送通知（NFR4）
    And 通知内容："孩子{姓名}已成功兑换「{愿望名称}」，消耗{X}分"
    And 系统在3秒内送达通知

11. Given 儿童积分不足（当前积分 < 积分门槛）
    When 儿童查看愿望列表
    Then "兑换"按钮禁用（显示为灰色）
    And 按钮显示"积分不足"提示
    And 点击按钮不触发兑换确认对话框
    And 显示"还差Y分"提示

12. Given 儿童积分足够但接近门槛（当前积分 >= 积分门槛）
    When 显示兑换确认对话框
    Then 系统显示兑换后积分余额（警告样式）
    And 兑换后余额 < 100分时显示黄色警告
    And 兑换后余额为0或负数时显示红色警告
    And 显示提示："兑换后积分较少，建议完成更多任务"

13. Given 儿童发起兑换请求（等待家长确认）
    When 儿童查看愿望列表
    Then 对应愿望显示"兑换中"状态标签
    And "兑换"按钮隐藏或禁用
    And 愿望卡片显示"等待家长审核"覆盖层
    And 显示"已发起兑换请求"提示文字

14. Given 兑换请求被家长拒绝
    When 儿童端同步数据
    Then 系统显示"兑换被拒绝"通知
    And 通知内容包含拒绝原因
    And 愿望状态返回"已通过"（可以重新兑换）
    And "兑换"按钮恢复显示
    And 愿望卡片返回正常状态

15. Given 兑换请求被家长确认
    When 儿童端同步数据
    Then 系统显示"兑换成功"通知
    And 通知内容："恭喜！你成功兑换「{愿望名称}」，可以去实现它了！"
    And 愿望状态更新为"已兑换"
    And 积分余额实时更新（减少消耗的积分）
    And 愿望从"可兑换"列表移除

16. Given 兑换成功（愿望状态为"已兑换"）
    When 儿童查看已兑换愿望（Story 4.10）
    Then 系统显示兑换详情：
     - 兑换日期时间
     - 消耗积分数量
     - 兑换时余额
     - 愿望名称和图片

17. Given 儿童同时发起多个兑换请求
    When 系统处理请求
    Then 系统逐个创建请求
    And 每个请求独立审核
    And 家长收到多个兑换审核通知
    And 防止积分超支（检查余额）

18. Given 儿童在兑换确认对话框中
    When 愿望积分门槛被家长修改（Story 4.3）
    Then 对话框自动关闭
    And 显示"积分门槛已更新，请重新确认"提示
    And 愿望卡片刷新显示新门槛
    And 如果新门槛 > 当前积分，"兑换"按钮变为禁用

19. Given 儿童在兑换确认对话框中
    When 积分余额实时更新（如家长临时加减分）
    Then 对话框显示最新余额
    And 兑换后余额实时更新
    And 不需要关闭对话框

20. Given 兑换请求已发起（等待家长确认）
    When 儿童试图修改愿望或创建新愿望
    Then 兑换请求不受影响
    And 可以正常操作其他功能

21. Given 兑换请求已发起（等待家长确认）
    When 儿童点击"取消兑换"按钮（可选功能）
    Then 系统取消兑换请求
    And 请求状态更新为"已取消"
    And 通知家长："孩子取消了兑换「{愿望名称}」的请求"
    And 愿望返回"可兑换"状态

22. Given 兑换确认对话框显示
    Then 对话框支持游戏化动画
    And 点击"确认兑换"时显示庆祝动画
    And 动画持续1-2秒
    And 动画完成后显示成功提示

23. Given 兑换请求在家长审核期间
    When 家长修改愿望积分门槛导致积分不足
    Then 系统自动取消兑换请求
    And 通知儿童："积分门槛已更新，兑换请求已取消"
    And 通知原因："需要{新门槛}分，你当前只有{当前积分}分"
    And 愿望返回"可兑换"状态

24. Given 兑换请求在家长审核期间
    When 家长删除或拒绝愿望（Story 4.2）
    Then 系统自动取消兑换请求
    And 通知儿童："愿望已被删除/拒绝，兑换请求已取消"
    And 愿望从列表移除或显示"已拒绝"

25. Given 儿童在离线状态
    When 点击"兑换"按钮
    Then 系统显示离线错误提示
    And 提示："请检查网络连接后重试"
    And 不创建兑换请求
    And 保留用户在对话框中

26. Given 儿童在兑换确认对话框中
    When 愿望被家长拒绝（来自Story 4.2）
    Then 对话框自动关闭
    And 显示"愿望已被家长拒绝"提示
    And 显示拒绝原因
    And 跳转到愿望详情或列表

## Tasks / Subtasks

- [ ] Task 1: Create redemption request schema and queries (AC: #6-#8, #21, #23-#24)
  - [ ] Create redemption_requests table:
    ```sql
    CREATE TABLE redemption_requests (
      id TEXT PRIMARY KEY,
      wish_id TEXT NOT NULL REFERENCES wishlists(id),
      child_id TEXT NOT NULL REFERENCES users(id),
      family_id TEXT NOT NULL REFERENCES families(id),
      points_cost INTEGER NOT NULL,
      points_before INTEGER NOT NULL,
      points_after INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN (
        'pending_confirmation', -- 等待家长确认
        'confirmed', -- 家长确认
        'rejected', -- 家长拒绝
        'cancelled', -- 儿童取消
        'invalidated' -- 自动取消（门槛变化等）
      )),
      confirmed_by TEXT REFERENCES users(id), -- 家长用户ID
      confirmed_at INTEGER,
      rejection_reason TEXT,
      cancelled_at INTEGER,
      invalidation_reason TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
    
    -- Indexes
    CREATE INDEX idx_redemption_requests_child ON redemption_requests(child_id);
    CREATE INDEX idx_redemption_requests_family ON redemption_requests(family_id);
    CREATE INDEX idx_redemption_requests_status ON redemption_requests(status);
    CREATE INDEX idx_redemption_requests_created ON redemption_requests(created_at DESC);
    ```
  - [ ] Create getFamilyRedemptionPreference() - Check if parent confirmation required
  - [ ] Create createRedemptionRequest() - Create new request
  - [ ] Create getRedemptionRequestByWish() - Get request by wish ID
  - [ ] Create getPendingRedemptionRequests() - Get pending requests
  - [ ] Create cancelRedemptionRequest() - Child cancels request
  - [ ] Create invalidateRedemptionRequest() - Auto-cancel on threshold change
  - [ ] Generate Drizzle migration
  - [ ] Apply migration to database

- [ ] Task 2: Create redemption API endpoints (AC: #6-#10, #21-#24)
  - [ ] Create POST /api/redemptions/initiate - Initiate redemption
  - [ ] Create POST /api/redemptions/[id]/cancel - Cancel redemption request
  - [ ] Verify user authentication (Better-Auth session)
  - [ ] Verify user role is 'child'
  - [ ] Verify child has enough points
  - [ ] Check family redemption preference (parent confirmation)
  - [ ] If parent confirmation required: create request, send notification
  - [ ] If no parent confirmation: deduct points, mark as redeemed, send notification
  - [ ] Validate request body (Zod schema)
  - [ ] Handle concurrent requests (check balance before deducting)

- [ ] Task 3: Create redemption confirmation dialog component (AC: #2-#5, #13, #18-#20, #22)
  - [ ] Create lib/components/dialogs/redemption-confirmation-dialog.tsx
  - [ ] Display wish details (name, image, type)
  - [ ] Display points information:
     - Cost: "消耗 500分"
     - Current balance: "当前积分：600分"
     - After redemption: "兑换后：100分"
  - [ ] Add warning styles for low post-redemption balance
  - [ ] Add "确认兑换" and"取消" buttons
  - [ ] Add redemption rules hint
  - [ ] Disable "确认兑换" button during processing
  - [ ] Support celebration animation on success
  - [ ] Responsive design (child-end: tablet optimized)
  - [ ] Use Shadcn Dialog

- [ ] Task 4: Implement redemption initiation logic (AC: #6-#10)
  - [ ] Create lib/services/redemption-initiation.ts
  - [ ] Check family preference: parent confirmation required?
  - [ ] If true: create redemption request with status 'pending_confirmation'
  - [ ] If false: immediately deduct points and mark as redeemed
  - [ ] Update wish status to 'redeemed'
  - [ ] Update child points balance
  - [ ] Create points history record (transaction)
  - [ ] Send notification to parent(s)
  - [ ] Send notification to child
  - [ ] Handle success/error cases

- [ ] Task 5: Implement points deduction (AC: #8)
  - [ ] Create lib/services/points-deduction.ts
  - [ ] Validate child has enough points
  - [ ] Deduct points from point_balances
  - [ ] Create transaction record in points_history:
     ```typescript
     {
       userId: childId,
       familyId: familyId,
       type: 'redemption',
       points: -pointsCost,
       balanceAfter: currentBalance - pointsCost,
       relatedWishId: wishId,
       relatedRedemptionId: redemptionId,
       description: `兑换愿望：${wishTitle}`
     }
     ```
  - [ ] Update timestamp

- [ ] Task 6: Handle redemption requests in wish cards (AC: #13)
  - [ ] Update lib/components/features/wish-card.tsx (from Story 4.6)
  - [ ] Check if wish has pending redemption request
  - [ ] If pending: display"兑换中" badge
  - [ ] If pending: hide/disable"兑换" button
  - [ ] If pending: show"等待家长审核" overlay
  - [ ] Support"取消兑换" button (optional feature)

- [ ] Task 7: Implement redemption request cancellation (AC: #21)
  - [ ] Add "取消兑换" button in wish card (optional)
  - [ ] Click triggers cancel dialog
  - [ ] Confirm cancellation with child
  - [ ] Update request status to 'cancelled'
  - [ ] Record cancelled_at timestamp
  - [ ] Notify parent: "孩子取消了兑换请求"
  - [ ] Return wish to 'redeemable' status

- [ ] Task 8: Handle auto-invalidation (AC: #23-#24)
  - [ ] Listen for threshold changes (from Story 4.3)
  - [ ] If threshold increases beyond current points:
    - Find pending redemption requests
    - Invalidate requests (status = 'invalidated')
    - Record invalidation_reason
    - Notify child
  - [ ] Listen for wish deletions/rejections (from Story 4.2)
  - [ ] Invalidate related redemption requests
  - [ ] Notify child

- [ ] Task 9: Integrate redemption button in wish list (AC: #1-#2, #11)
  - [ ] Update lib/components/features/wish-card.tsx (from Story 4.6)
  - [ ] Check if points >= threshold
  - [ ] If yes: show "兑换" button
  - [ ] If no: show disabled button with"积分不足"
  - [ ] Click button opens redemption confirmation dialog
  - [ ] Show "还差Y分" if points < threshold

- [ ] Task 10: Implement celebration animation (AC: #22)
  - [ ] Add confetti effect using Framer Motion or CSS animation
  - [ ] Trigger on"确认兑换" success
  - [ ] Animation duration: 1-2 seconds
  - [ ] Show success toast after animation
  - [ ] Child-friendly, celebratory effect

- [ ] Task 11: Handle real-time updates (AC: #14-#15, #18-#19, #26)
  - [ ] Use polling or Zustand store for real-time updates
  - [ ] Poll redemption status every 2-3 seconds
  - [ ] Update wish card when status changes
  - [ ] Update dialog when balance changes (stay open)
  - [ ] Handle threshold changes (close dialog, show update)
  - [ ] Handle wish rejection (close dialog, show reason)

- [ ] Task 12: Handle offline state (AC: #25)
  - [ ] Check network status before initiating redemption
  - [ ] If offline: show error toast
  - [ ] Preserve dialog state
  - [ ] Allow retry when online

- [ ] Task 13: Write BDD tests (AC: #1-#26)
  - [ ] **Given** 儿童积分足够 **When** 点击兑换按钮 **Then** 显示确认对话框
  - [ ] **Given** 显示确认对话框 **When** 点击取消 **Then** 对话框关闭不创建请求
  - [ ] **Given** 需要家长确认 **When** 点击确认 **Then** 创建等待确认请求
  - [ ] **Given** 无需家长确认 **When** 点击确认 **Then** 扣除积分并兑换成功
  - [ ] **Given** 兑换成功 **When** 家长在线 **Then** 3秒内收到通知
  - [ ] **Given** 积分不足 **When** 查看愿望列表 **Then** 兑换按钮禁用
  - [ ] **Given** 等待确认 **When** 查看愿望列表 **Then** 显示"兑换中"标签
  - [ ] **Given** 家长拒绝兑换 **When** 同步数据 **Then** 愿望返回可兑换状态
  - [ ] **Given** 家长确认兑换 **When** 同步数据 **Then** 愿望变为已兑换
  - [ ] **Given** 门槛修改导致积分不足 **When** 等待确认 **Then** 请求自动取消
  - [ ] **Given** 离线状态 **When** 点击兑换 **Then** 显示离线错误
  - [ ] **Given** 点击确认 **When** 成功 **Then** 显示庆祝动画
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 14: Performance and compliance verification (AC: #6-#10, #22, #25)
  - [ ] Verify API response time < 500ms (NFR3: P95)
  - [ ] Verify notification delivery < 3 seconds (NFR4)
  - [ ] Verify animation performance (smooth, no lag)
  - [ ] Verify child data privacy (only child/parent can see)
  - [ ] Verify concurrent request handling

## Dev Notes

### Project Structure Notes

**Alignment with unified project structure:**
- Schema: `database/schema/redemption-requests.ts` (new)
- Queries: `lib/db/queries/redemptions.ts` (new)
- Service: `lib/services/redemption-initiation.ts` (new)
- Service: `lib/services/points-deduction.ts` (new)
- API: `app/api/redemptions/initiate/route.ts` (new)
- Component: `lib/components/dialogs/redemption-confirmation-dialog.tsx` (new)
- Integration: Extend wish-card.tsx (from Story 4.6)
- Types: `types/redemption.ts` (new)

**Detected conflicts/variances:**
- None identified at story creation time

### Previous Story Intelligence

**From Story 4.1 (Child Creates Wish):**
- wishlists table created with points_threshold
- Wish status tracking (approved, pending_review, rejected)
- **Can reuse:** Wish status for redemption eligibility check

**From Story 4.2 (Parent Reviews Wish):**
- Wish approval sets points_threshold
- Wish rejection tracked
- Notification infrastructure exists
- **Can reuse:** Wish status for redemption logic
- **Can reuse:** Notification system for parent notifications
- **Can reuse:** Rejection logic for auto-invalidation

**From Story 4.3 (Parent Sets Points Threshold):**
- Points threshold can be modified
- Real-time updates supported
- **Can reuse:** Threshold changes trigger auto-invalidation
- **Can reuse:** Real-time update mechanism

**From Story 4.4 (Wish Progress Bar Display):**
- Progress bar shows current points vs threshold
- Real-time points updates
- **Can reuse:** Current points for redemption eligibility check
- **Can reuse:** Real-time balance updates in dialog

**From Story 4.5 (Smart Wish Estimation):**
- Smart estimation for days to reach goal
- **Can reuse:** Display estimation in confirmation dialog

**From Story 4.6 (Child Views All Wishes):**
- Wish card component exists with "兑换" button
- Wish list page exists
- Status badges implemented
- **Can reuse:** Extend wish card for redemption state
- **Can reuse:** Extend wish list for "兑换中" display

**From Epic 3 (Points System):**
- Points balance tracking exists
- Points history tracking exists
- lib/db/queries/points.ts exists
- **Can reuse:** Points balance checking
- **Can reuse:** Points deduction logic
- **Can reuse:** Points history recording

### Database Schema Design

**redemption_requests Table:**
```typescript
// database/schema/redemption-requests.ts
export const redemptionRequests = pgTable('redemption_requests', {
  id: text('id').primaryKey(),
  wishId: text('wish_id').notNull().references(() => wishlists.id),
  childId: text('child_id').notNull().references(() => users.id),
  familyId: text('family_id').notNull().references(() => families.id),
  pointsCost: integer('points_cost').notNull(),
  pointsBefore: integer('points_before').notNull(),
  pointsAfter: integer('points_after').notNull(),
  status: text('status').notNull(), // pending_confirmation, confirmed, rejected, cancelled, invalidated
  confirmedBy: text('confirmed_by').references(() => users.id),
  confirmedAt: integer('confirmed_at'),
  rejectionReason: text('rejection_reason'),
  cancelledAt: integer('cancelled_at'),
  invalidationReason: text('invalidation_reason'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});

// Type for status
export type RedemptionStatus = 
  | 'pending_confirmation'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'invalidated';
```

### Redemption Initiation Logic

**Service Flow:**
```typescript
// lib/services/redemption-initiation.ts
async function initiateRedemption(
  wishId: string,
  childId: string,
  familyId: string
): Promise<RedemptionResult> {
  // 1. Get wish details
  const wish = await getWishById(wishId);
  if (!wish) throw new Error('Wish not found');
  
  // 2. Get child's current points
  const currentBalance = await getChildPointsBalance(childId);
  
  // 3. Check if points are sufficient
  if (currentBalance < wish.pointsThreshold) {
    throw new Error('Insufficient points');
  }
  
  // 4. Check family preference
  const family = await getFamilyById(familyId);
  const requiresParentConfirmation = family.redemptionRequiresParentConfirmation;
  
  // 5. Calculate points after redemption
  const pointsAfter = currentBalance - wish.pointsThreshold;
  
  if (requiresParentConfirmation) {
    // Path A: Create redemption request
    const request = await createRedemptionRequest({
      wishId,
      childId,
      familyId,
      pointsCost: wish.pointsThreshold,
      pointsBefore: currentBalance,
      pointsAfter,
      status: 'pending_confirmation'
    });
    
    // Send notification to parents
    await sendRedemptionRequestNotification(request, family.id);
    
    return {
      success: true,
      requestCreated: true,
      request
    };
  } else {
    // Path B: Immediate redemption
    await deductPoints(childId, wish.pointsThreshold, wish);
    
    await updateWishStatus(wishId, 'redeemed');
    
    await sendRedemptionSuccessNotification(childId, wish);
    
    return {
      success: true,
      requestCreated: false,
      redeemed: true,
      pointsAfter
    };
  }
}
```

### Points Deduction Logic

**Transaction Recording:**
```typescript
// lib/services/points-deduction.ts
async function deductPoints(
  childId: string,
  pointsCost: number,
  wish: Wish
): Promise<void> {
  // 1. Get current balance
  const currentBalance = await getChildPointsBalance(childId);
  
  // 2. Calculate new balance
  const newBalance = currentBalance - pointsCost;
  
  // 3. Update points balance
  await updatePointsBalance(childId, newBalance);
  
  // 4. Create transaction record
  await createTransaction({
    userId: childId,
    familyId: wish.familyId,
    type: 'redemption',
    points: -pointsCost,
    balanceBefore: currentBalance,
    balanceAfter: newBalance,
    relatedWishId: wish.id,
    description: `兑换愿望：${wish.title}`
  });
  
  // 5. Update timestamp
  await updateBalanceTimestamp(childId);
}
```

### Redemption Confirmation Dialog Component

**Component Structure:**
```typescript
// lib/components/dialogs/redemption-confirmation-dialog.tsx
export function RedemptionConfirmationDialog({
  wish,
  childBalance,
  isOpen,
  onClose,
  onConfirm
}: RedemptionConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const pointsAfter = childBalance - wish.pointsThreshold;
  
  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(wish.id);
      // Show celebration animation
      showCelebration();
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="redemption-confirmation">
        <DialogHeader>
          <DialogTitle>确认兑换</DialogTitle>
          <DialogDescription>你确定要兑换这个愿望吗？</DialogDescription>
        </DialogHeader>
        
        {/* Wish Image/Icon */}
        <div className="wish-display">
          {wish.imageUrl ? (
            <img src={wish.imageUrl} alt={wish.title} />
          ) : (
            <DefaultIcon type={wish.type} />
          )}
        </div>
        
        {/* Wish Name */}
        <h2 className="wish-title">{wish.title}</h2>
        
        {/* Points Information */}
        <div className="points-info">
          <div className="points-cost">
            <span className="label">消耗</span>
            <span className="value">{wish.pointsThreshold}分</span>
          </div>
          
          <div className="current-balance">
            <span className="label">当前积分</span>
            <span className="value">{childBalance}分</span>
          </div>
          
          <div className="after-balance">
            <span className="label">兑换后</span>
            <span className={`value ${pointsAfter < 100 ? 'warning' : ''}`}>
              {pointsAfter}分
            </span>
          </div>
          
          {pointsAfter < 100 && (
            <p className="warning-message">
              兑换后积分较少，建议完成更多任务
            </p>
          )}
        </div>
        
        {/* Rules Hint */}
        <p className="rules-hint">
          兑换后愿望将进入已兑换历史
        </p>
        
        {/* Buttons */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? '处理中...' : '确认兑换'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. Child initiates redemption with sufficient points
2. Child cancels redemption in confirmation dialog
3. Child initiates redemption with parent confirmation required
4. Child initiates redemption without parent confirmation
5. Child receives notification when parent confirms
6. Child receives notification when parent rejects
7. Child cannot initiate redemption with insufficient points
8. Child sees "兑换中" status for pending requests
9. Child cancels pending redemption request
10. Child sees auto-invalidation when threshold changes
11. Child sees auto-invalidation when wish rejected
12. Child sees celebration animation on success
13. Child sees warning for low post-redemption balance
14. Child handles offline state when initiating redemption
15. Concurrent redemption requests handling
16. Real-time updates in dialog (balance changes, threshold changes)

**Integration Tests:**
- Redemption request creation
- Points deduction and transaction recording
- Wish status updates
- Parent confirmation notification
- Auto-invalidation logic
- Points balance validation
- Concurrent request handling

**E2E Tests (Playwright):**
- Complete redemption flow (with parent confirmation)
- Complete redemption flow (without parent confirmation)
- Redemption cancellation flow
- Auto-invalidation scenarios
- Offline state handling
- Real-time updates verification
- Celebration animation verification

### Performance Requirements

- Redemption API: < 500ms (NFR3: P95)
- Notification delivery: < 3 seconds (NFR4)
- Points deduction: < 200ms
- Celebration animation: smooth, no lag

### UX Requirements

**Child-End Design (from UX decisions):**
- Tablet-optimized layout (landscape, ≥768px)
- Large, clear confirmation dialog
- Gamified celebration animation
- Clear points information display
- Encouraging messages

**Dialog Design:**
- Wish image/icon prominent
- Points information clearly labeled
- Warning styles for low balance
- "确认兑换" button primary, "取消" button secondary
- Redemption rules hint

**Success Feedback:**
- Celebration animation (confetti)
- Success toast notification
- "兑换成功！" message
- Child-friendly language

**Error Handling:**
- Insufficient points: disable button, show "积分不足"
- Offline state: show error toast, preserve dialog
- Network error: retry option
- No `alert()` dialogs

### Compliance Requirements

**COPPA/GDPR Compliance:**
- Child data privacy (only child/parent can see redemption requests)
- Parental control (parent confirmation default)
- Clear, age-appropriate messaging
- Data retention: 3 years (NFR18)
- Audit trail for all redemptions

### Open Questions / Decisions Needed

1. **Parent Confirmation Default:**
   - Option A: Enabled by default (recommended)
   - Option B: Disabled by default
   - **Decision:** Enabled by default (per AC #7, child protection priority)

2. **Redemption Request Cancellation:**
   - Option A: Always available
   - Option B: Time-limited (e.g., 5 minutes)
   - Option C: Not available (parent must approve/reject)
   - **Decision:** Always available (child autonomy, per AC #21)

3. **Celebration Animation:**
   - Option A: Simple CSS animation
   - Option B: Framer Motion confetti
   - Option C: Both (fallback)
   - **Decision:** CSS animation + Framer Motion if available (flexible, per AC #22)

4. **Low Balance Warning Threshold:**
   - Option A: < 100 points
   - Option B: < 50 points
   - Option C: Percentage (e.g., < 10% of threshold)
   - **Decision:** < 100 points absolute (clear, actionable, per AC #12)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<500ms API, <3s notification)
5. [ ] Security requirements met (points validation, child privacy)
6. [ ] Parent confirmation workflow working
7. [ ] Auto-invalidation logic working
8. [ ] Celebration animation implemented
9. [ ] Real-time updates working smoothly
10. [ ] Code review passed
11. [ ] Sprint status updated to ready-for-dev

### Tasks Blocked By

**Prerequisites:**
- Story 4.1: Child Creates Wish - Complete ✅
- Story 4.2: Parent Reviews Wish - Complete ✅
- Story 4.3: Parent Sets Points Threshold - Complete ✅
- Story 4.4: Wish Progress Bar Display - Complete ✅
- Story 4.5: Smart Wish Estimation - Complete ✅
- Story 4.6: Child Views All Wishes - Complete ✅
- wishlists table exists - Complete ✅
- Points system exists - Complete ✅
- Notification infrastructure exists - Complete ✅
- Wish card component exists - Complete ✅

**None identified at story creation time.**

## Dev Agent Record

### Agent Model Used

GLM-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None at story creation time.

### Completion Notes List

Story created with comprehensive implementation guidance including:
- Complete redemption_requests database schema
- Redemption initiation service with dual paths (parent confirmation vs immediate)
- Points deduction logic with transaction recording
- Redemption confirmation dialog component design
- Celebration animation implementation
- Real-time updates handling (status, balance, threshold changes)
- Auto-invalidation logic for threshold changes and wish rejections
- BDD test scenarios covering all acceptance criteria
- Performance targets for API, notification, and animation
- Child data privacy and COPPA/GDPR compliance
- Child-friendly UX design with gamified elements
- Integration with previous stories (wish card, points system, notifications)

### File List

**Files to Create:**
- database/schema/redemption-requests.ts
- database/migrations/XXX_create_redemption_requests.sql
- lib/db/queries/redemptions.ts
- lib/services/redemption-initiation.ts
- lib/services/points-deduction.ts
- lib/components/dialogs/redemption-confirmation-dialog.tsx
- app/api/redemptions/initiate/route.ts
- app/api/redemptions/[id]/cancel/route.ts
- types/redemption.ts

**Files to Modify:**
- lib/components/features/wish-card.tsx (add redemption state, cancel button)
- lib/db/queries/points.ts (add redemption transaction type)
- database/schema/families.ts (add redemptionRequiresParentConfirmation field)

**Test Files:**
- tests/integration/redemptions.spec.ts
- tests/e2e/redemption-initiation.spec.ts
- tests/fixtures/redemption-requests.ts
