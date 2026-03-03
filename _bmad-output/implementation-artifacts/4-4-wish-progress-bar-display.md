# Story 4.4: Wish Progress Bar Display

Status: ready-for-dev

## Story

As a 系统,
I want 显示愿望进度条,
so that 儿童可以直观看到距离目标还需要多少积分。

## Acceptance Criteria

1. Given 儿童有已审核通过的愿望
   When 儿童查看愿望列表或愿望详情页
   Then 系统为每个愿望显示进度条

2. Given 进度条显示
   Then 进度条包含：
     - 当前积分值
     - 目标积分值（points_threshold）
     - 格式："X / Y分" 或 "X分（目标：Y分）"
     - 进度百分比数字

3. Given 进度条显示
   Then 系统显示视觉进度条（填充效果）
   And 进度条宽度或填充度反映完成百分比
   And 进度条有平滑的填充动画

4. Given 进度百分比 < 1%（积分极少）
   When 显示进度条
   Then 进度条颜色为灰色
   And 进度条显示"加油！"提示文字

5. Given 进度百分比在 1-25%
   When 显示进度条
   Then 进度条颜色为灰色（#9CA3AF or Tailwind gray-400）
   And 进度条显示"刚刚起步"提示文字

6. Given 进度百分比在 26-50%
   When 显示进度条
   Then 进度条颜色为蓝色（#3B82F6 or Tailwind blue-600）
   And 进度条显示"继续努力"提示文字

7. Given 进度百分比在 51-75%
   When 显示进度条
   Then 进度条颜色为橙色（#F59E0B or Tailwind orange-500）
   And 进度条显示"快到了"提示文字

8. Given 进度百分比在 76-99%
   When 显示进度条
   Then 进度条颜色为绿色（#10B981 or Tailwind green-600）
   And 进度条显示"即将达成"提示文字

9. Given 进度百分比 ≥ 100%
   When 显示进度条
   Then 进度条颜色为金色（#FBBF24 or Tailwind amber-400）
   And 进度条显示"可以兑换啦！"提示文字
   And 显示"兑换"按钮（跳转到兑换流程）

10. Given 儿童查看愿望列表
    When 显示多个愿望的进度条
    Then 每个愿望独立显示进度条
    And 进度条按完成度倒序或按创建时间排序

11. Given 进度条在愿望卡片中
    Then 进度条设计适合小屏幕显示
    And 进度条高度适中（不占用过多空间）
    And 文字清晰可读

12. Given 进度条在愿望详情页
    Then 进度条设计更大更突出
    And 显示完整的进度信息
    And 显示"还差Y分"具体数字（Y = points_threshold - current_points）

13. Given 儿童积分余额更新（完成任务、家长加减分）
    When 进度条页面打开或用户活跃
    Then 进度条实时更新（2-3秒同步，NFR4）
    And 进度条更新有动画效果
    And 不需要刷新页面

14. Given 愿望积分门槛被家长修改（Story 4.3）
    When 儿童端同步新数据
    Then 进度条立即反映新门槛值
    And 进度百分比重新计算
    And 进度条颜色根据新进度更新

15. Given 进度百分比计算
    Then 百分比 = (当前积分 / 目标积分) × 100
    And 百分比四舍五入到整数
    And 超过100%时显示为"可兑换"（不显示具体百分比）

16. Given 积分余额为0或负数
    When 显示进度条
    Then 进度条颜色为灰色
    And 显示"开始任务来获得积分吧"提示
    And 进度条显示0%或最低可见填充

17. Given 愿望状态为"等待家长审核"
    When 儿童查看愿望
    Then 显示临时进度条
    And 使用儿童设置的期望积分（desired_points）作为参考
    And 显示"等待审核"标签覆盖进度条
    And 进度条显示为灰色

18. Given 愿望状态为"已拒绝"
    When 儿童查看愿望
    Then 显示进度条
    And 使用儿童设置的期望积分作为参考
    And 显示"已拒绝"标签
    And 进度条显示为灰色

19. Given 儿童在家长设备上登录（共享设备）
    When 家长查看儿童的愿望列表
    Then 家长可以看到儿童的愿望进度条
    And 显示格式相同，但可能显示更多详情

20. Given 进度条动画
    When 进度条首次加载或数值变化
    Then 动画持续时间适中（300-500ms）
    And 动画平滑自然
    And 使用CSS动画（不消耗性能）

21. Given 多个愿望同时达到可兑换状态
    When 儿童查看愿望列表
    Then 系统显示"可兑换"徽章
    And 徽章显示可兑换愿望数量
    And 点击徽章筛选只显示可兑换愿望

22. Given 进度条长时间未更新（离线状态）
    When 网络恢复并同步
    Then 进度条立即更新到最新值
    And 显示同步完成的动画提示

23. Given 进度条在离线状态
    When 儿童查看愿望
    Then 显示离线缓存的数据
    And 显示"上次更新：X分钟前"提示

24. Given 进度条在高对比度模式
    When 用户启用高对比度
    Then 进度条颜色适配高对比度
    And 确保可访问性（WCAG AA标准）

## Tasks / Subtasks

- [ ] Task 1: Create progress bar component (AC: #1-#11, #20, #24)
  - [ ] Create lib/components/features/wish-progress.tsx
  - [ ] Props interface:
    ```typescript
    interface WishProgressProps {
      currentPoints: number;
      pointsThreshold: number;
      status: 'approved' | 'pending_review' | 'rejected';
      isCompact?: boolean; // For list view
      isDetailView?: boolean; // For detail view
    }
    ```
  - [ ] Calculate progress percentage
  - [ ] Determine progress color based on percentage
  - [ ] Render progress bar with fill effect
  - [ ] Add smooth CSS animations (300-500ms)
  - [ ] Add support text messages based on progress range
  - [ ] Support high contrast mode (accessibility)
  - [ ] Responsive design (list vs detail view)

- [ ] Task 2: Create progress bar query functions (AC: #13, #14)
  - [ ] Extend lib/db/queries/wishlists.ts
  - [ ] Create getWishProgress() - Get wish with progress data
  - [ ] Calculate current points for child
  - [ ] Join with points_history for real-time balance
  - [ ] Return progress object with all needed data

- [ ] Task 3: Create progress bar API endpoint (AC: #13, #14)
  - [ ] Create GET /api/wishlists/[id]/progress
  - [ ] Return current points and threshold
  - [ ] Return calculated percentage
  - [ ] Return color and message data
  - [ ] Support real-time updates (polling 2-3s)

- [ ] Task 4: Integrate progress bar in wish list (AC: #2-#11, #20)
  - [ ] Update lib/components/features/wish-card.tsx (from Story 4.1)
  - [ ] Add WishProgress component in compact mode
  - [ ] Display in card footer or sidebar
  - [ ] Show "X / Y分" format
  - [ ] Show progress percentage
  - [ ] Add tap/water tap hint for detail view

- [ ] Task 5: Integrate progress bar in wish detail (AC: #12, #14)
  - [ ] Update app/(child)/wishlist/view/[id]/page.tsx (from Story 4.1)
  - [ ] Add WishProgress component in detail mode
  - [ ] Display larger, more prominent progress bar
  - [ ] Show complete progress information
  - [ ] Display "还差Y分" specific number
  - [ ] Add "兑换" button when progress ≥ 100%

- [ ] Task 6: Handle pending review wishes (AC: #17)
  - [ ] Check wish status before rendering progress
  - [ ] If status is 'pending_review':
    - Use desired_points as reference threshold
    - Display "等待审核" overlay
    - Set progress bar color to gray
    - Disable progress calculation

- [ ] Task 7: Handle rejected wishes (AC: #18)
  - [ ] Check wish status before rendering progress
  - [ ] If status is 'rejected':
    - Use desired_points as reference threshold
    - Display "已拒绝" badge
    - Set progress bar color to gray

- [ ] Task 8: Implement real-time progress updates (AC: #13, #14, #22)
  - [ ] Use polling or Zustand store for real-time updates
  - [ ] Poll points balance every 2-3 seconds
  - [ ] Recalculate progress when points change
  - [ ] Trigger progress bar update animation
  - [ ] Update without page refresh

- [ ] Task 9: Implement redeemable wishes highlighting (AC: #21)
  - [ ] Track number of redeemable wishes (progress ≥ 100%)
  - [ ] Display "可兑换" badge with count in wishlist header
  - [ ] Add filter: "只显示可兑换"
  - [ ] Show "兑换" button on redeemable wishes

- [ ] Task 10: Add offline support (AC: #22, #23)
  - [ ] Cache progress data in IndexedDB
  - [ ] Display cached data when offline
  - [ ] Show "上次更新：X分钟前" when offline
  - [ ] Update immediately when network recovers
  - [ ] Background sync when back online

- [ ] Task 11: Write BDD tests (AC: #1-#24)
  - [ ] **Given** 儿童查看愿望 **When** 进度0-25% **Then** 显示灰色进度条
  - [ ] **Given** 儿童查看愿望 **When** 进度26-50% **Then** 显示蓝色进度条
  - [ ] **Given** 儿童查看愿望 **When** 进度51-75% **Then** 显示橙色进度条
  - [ ] **Given** 儿童查看愿望 **When** 进度76-99% **Then** 显示绿色进度条
  - [ ] **Given** 儿童查看愿望 **When** 进度≥100% **Then** 显示金色进度条和"兑换"按钮
  - [ ] **Given** 积分更新 **When** 进度条打开 **Then** 实时更新
  - [ ] **Given** 门槛修改 **When** 同步数据 **Then** 进度条反映新值
  - [ ] **Given** 等待审核 **When** 查看愿望 **Then** 显示"等待审核"覆盖
  - [ ] **Given** 已拒绝愿望 **When** 查看愿望 **Then** 显示"已拒绝"标签
  - [ ] **Given** 离线状态 **When** 查看愿望 **Then** 显示缓存数据和"上次更新"时间
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 12: Performance and compliance verification (AC: #13, #20, #24)
  - [ ] Verify progress bar update < 2s (NFR4)
  - [ ] Verify animation performance (smooth, no lag)
  - [ ] Verify accessibility (WCAG AA compliance)
  - [ ] Verify color contrast ratios
  - [ ] Verify responsive design

## Dev Notes

### Project Structure Notes

**Alignment with unified project structure:**
- Component: `lib/components/features/wish-progress.tsx` (new)
- Queries: `lib/db/queries/wishlists.ts` (extend from Stories 4.1-4.3)
- API: `app/api/wishlists/[id]/progress/route.ts` (new)
- Integration: Extend wish-card.tsx and wish detail pages
- Types: `types/wishlist.ts` (extend from Stories 4.1-4.3)

**Detected conflicts/variances:**
- None identified at story creation time

### Previous Story Intelligence

**From Story 4.1 (Child Creates Wish):**
- wishlists table created with points_threshold field
- Child sets desired_points
- Wish card component exists (wish-card.tsx)
- Wish list page exists (wishlist/page.tsx)
- **Can reuse:** Wish card as container for progress bar
- **Can reuse:** Wish list page structure

**From Story 4.2 (Parent Reviews Wish):**
- Approval workflow sets points_threshold
- Wish status tracking (pending_review, approved, rejected)
- **Can reuse:** Wish status to determine progress bar display mode

**From Story 4.3 (Parent Sets Points Threshold):**
- Points threshold can be modified
- Real-time updates supported
- **Can reuse:** Real-time update mechanism for progress bar

**From Story 3.8 (Child Views Current Points Balance):**
- Points balance query exists
- Real-time balance updates
- **Can reuse:** Current points for progress calculation

### Progress Bar Component Design

**Component Structure:**
```typescript
// lib/components/features/wish-progress.tsx
export function WishProgress({
  currentPoints,
  pointsThreshold,
  status,
  isCompact = false,
  isDetailView = false
}: WishProgressProps) {
  // Calculate percentage
  const percentage = Math.round((currentPoints / pointsThreshold) * 100);
  
  // Determine color and message
  const { color, message } = getProgressInfo(percentage, status);
  
  return (
    <div className="wish-progress">
      <div className="progress-info">
        <span className="current-points">{currentPoints} / {pointsThreshold}分</span>
        {isDetailView && (
          <span className="remaining-points">还差{pointsThreshold - currentPoints}分</span>
        )}
      </div>
      
      <div className="progress-bar-container">
        <div 
          className={`progress-fill ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        >
          <div className="progress-animation" />
        </div>
      </div>
      
      {status === 'pending_review' && (
        <div className="status-overlay">等待审核</div>
      )}
      
      {status === 'rejected' && (
        <div className="status-badge rejected">已拒绝</div>
      )}
      
      {percentage >= 100 && status === 'approved' && (
        <Button className="redeem-button">兑换</Button>
      )}
    </div>
  );
}
```

**Progress Color Scheme:**
```typescript
function getProgressInfo(
  percentage: number, 
  status: string
): { color: string, message: string } {
  if (status === 'pending_review' || status === 'rejected') {
    return { color: 'gray', message: '' };
  }
  
  if (percentage < 1) {
    return { color: 'gray', message: '加油！' };
  }
  
  if (percentage <= 25) {
    return { color: 'gray', message: '刚刚起步' };
  }
  
  if (percentage <= 50) {
    return { color: 'blue', message: '继续努力' };
  }
  
  if (percentage <= 75) {
    return { color: 'orange', message: '快到了' };
  }
  
  if (percentage <= 99) {
    return { color: 'green', message: '即将达成' };
  }
  
  // percentage >= 100
  return { color: 'gold', message: '可以兑换啦！' };
}
```

### Progress Bar CSS Styling

**Tailwind Classes:**
```css
/* Progress bar container */
.wish-progress {
  @apply w-full;
}

.progress-bar-container {
  @apply w-full h-3 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full transition-all duration-500 ease-out;
}

/* Color variants */
.progress-fill.gray {
  @apply bg-gray-400;
}

.progress-fill.blue {
  @apply bg-blue-600;
}

.progress-fill.orange {
  @apply bg-orange-500;
}

.progress-fill.green {
  @apply bg-green-600;
}

.progress-fill.gold {
  @apply bg-amber-400;
}

/* Animation */
.progress-animation {
  @apply animate-pulse;
}

/* Status overlay */
.status-overlay {
  @apply absolute inset-0 bg-white/80 flex items-center justify-center;
  text-sm font-semibold;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .progress-fill.gray { @apply bg-gray-600; }
  .progress-fill.blue { @apply bg-blue-800; }
  .progress-fill.orange { @apply bg-orange-700; }
  .progress-fill.green { @apply bg-green-700; }
  .progress-fill.gold { @apply bg-yellow-500; }
}
```

### Real-Time Update Strategy

**Polling Implementation:**
```typescript
// lib/hooks/use-wish-progress.ts
export function useWishProgress(wishId: string, childId: string) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  
  useEffect(() => {
    // Initial fetch
    fetchProgress();
    
    // Poll every 2-3 seconds
    const interval = setInterval(fetchProgress, 2500);
    
    return () => clearInterval(interval);
  }, [wishId, childId]);
  
  async function fetchProgress() {
    const data = await getWishProgress(wishId, childId);
    setProgress(data);
  }
  
  return progress;
}
```

### Offline Support

**IndexedDB Caching:**
```typescript
// Cache progress data
async function cacheProgressData(wishId: string, data: ProgressData) {
  const db = await openDatabase();
  await db.put('progress', {
    ...data,
    wishId,
    cachedAt: Date.now()
  });
}

// Retrieve cached data
async function getCachedProgress(wishId: string): Promise<ProgressData | null> {
  const db = await openDatabase();
  const cached = await db.get('progress', wishId);
  
  if (cached) {
    const ageMinutes = (Date.now() - cached.cachedAt) / 60000;
    return {
      ...cached,
      isStale: ageMinutes > 5
    };
  }
  
  return null;
}
```

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. Child views wish with 0-25% progress
2. Child views wish with 26-50% progress
3. Child views wish with 51-75% progress
4. Child views wish with 76-99% progress
5. Child views wish with 100%+ progress (redeemable)
6. Progress bar updates when points change
7. Progress bar reflects threshold modification
8. Pending review wish shows overlay
9. Rejected wish shows badge
10. Offline state shows cached data
11. High contrast mode colors
12. List view vs detail view differences
13. Redeemable wishes filter

**Integration Tests:**
- Progress calculation accuracy
- Color scheme application
- Animation performance
- Real-time updates
- Offline cache retrieval
- Status handling (pending/rejected/approved)

**E2E Tests (Playwright):**
- Complete progress bar viewing flow
- Progress bar updates when points change
- Threshold modification updates
- Redeemable wishes badge
- Filter redeemable wishes
- Offline state display
- High contrast mode verification

### Performance Requirements

- Progress bar render: < 50ms - AC #20
- Real-time update: < 2s sync (NFR4) - AC #13
- Animation duration: 300-500ms (smooth) - AC #20
- Cache retrieval: < 100ms

### UX Requirements

**Child-End Design (from UX decisions):**
- Tablet-optimized layout (landscape, ≥768px)
- Large, clear progress visualization
- Color-coded status (gamified approach)
- Encouraging messages at all progress levels
- Smooth animations (reward visual feedback)

**Progress Bar Design:**
- List view: Compact, minimal space
- Detail view: Large, prominent, complete info
- Clear color differentiation (gray → blue → orange → green → gold)
- Encouraging messages (not just technical)
- "兑换" button when ready

**Visual Feedback:**
- Smooth fill animations
- Color transitions when progress changes
- Status overlays for pending/rejected
- "可以兑换啦！" celebration message when 100%

**Accessibility:**
- High contrast mode support
- Screen reader friendly labels
- Color not only indicator (use text + percentage)
- WCAG AA color contrast ratios
- Keyboard navigation support

### Open Questions / Decisions Needed

1. **Progress Animation Type:**
   - Option A: CSS transition only
   - Option B: CSS transition + Framer Motion
   - **Decision:** CSS transition only (sufficient, lighter weight, per AC #20)

2. **Real-Time Update Method:**
   - Option A: Polling every 2-3 seconds
   - Option B: WebSocket/SSE (future enhancement)
   - **Decision:** Polling (MVP, per architecture NFR4 requirement)

3. **Progress Bar Height:**
   - Option A: Fixed height (e.g., 12px)
   - Option B: Proportional to screen size
   - **Decision:** Responsive (list view: thin, detail view: thicker)

4. **"兑换" Button Placement:**
   - Option A: Inside progress bar component
   - Option B: Separate action in wish card
   - **Decision:** Inside component when 100%+ (per AC #9)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<50ms render, <2s sync)
5. [ ] Accessibility requirements met (WCAG AA, high contrast)
6. [ ] All progress color states working correctly
7. [ ] Real-time updates working smoothly
8. [ ] Offline support functional
9. [ ] Code review passed
10. [ ] Sprint status updated to ready-for-dev

### Tasks Blocked By

**Prerequisites:**
- Story 4.1: Child Creates Wish - Complete ✅
- Story 4.2: Parent Reviews Wish - Complete ✅
- Story 4.3: Parent Sets Points Threshold - Complete ✅
- wishlists table exists with points_threshold - Complete ✅
- Child points balance query exists - Complete ✅
- Wish card component exists - Complete ✅
- Wish list pages exist - Complete ✅

**None identified at story creation time.**

## Dev Agent Record

### Agent Model Used

GLM-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None at story creation time.

### Completion Notes List

Story created with comprehensive implementation guidance including:
- Complete progress bar component design with color scheme
- Integration points with existing wish components
- Real-time update strategy using polling
- Offline support with IndexedDB caching
- Status handling (pending/rejected/approved)
- Accessibility support (high contrast mode)
- Responsive design (list vs detail view)
- Redeemable wishes highlighting
- BDD test scenarios covering all progress states
- Performance targets for animations and updates
- UX requirements with encouraging messages

### File List

**Files to Create:**
- lib/components/features/wish-progress.tsx
- lib/hooks/use-wish-progress.ts
- app/api/wishlists/[id]/progress/route.ts

**Files to Modify:**
- lib/db/queries/wishlists.ts (add getWishProgress)
- lib/components/features/wish-card.tsx (integrate progress bar)
- app/(child)/wishlist/page.tsx (add redeemable filter)
- app/(child)/wishlist/view/[id]/page.tsx (integrate progress bar detail)
- types/wishlist.ts (add progress types)

**Test Files:**
- tests/integration/wish-progress.spec.ts
- tests/e2e/wish-progress.spec.ts
- tests/fixtures/progress-data.ts
