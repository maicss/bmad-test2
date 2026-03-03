# Story 4.5: Smart Wish Estimation

Status: ready-for-dev

## Story

As a 系统,
I want 显示智能估算,
so that 儿童可以知道大概什么时候能实现愿望。

## Acceptance Criteria

1. Given 儿童有已审核通过的愿望且积分不足
   When 儿童查看愿望详情页面
   Then 系统显示智能估算信息

2. Given 儿童有积分历史数据
   When 显示估算信息
   Then 系统显示"按历史速度估算"信息
   And 格式："按照你的速度，{X}天后就能兑换了！"
   And X = ceil((目标积分 - 当前积分) / 平均每日积分)

3. Given 儿童查看愿望详情
   When 显示估算信息
   Then 系统显示"按任务估算"信息
   And 格式："还差{Y}分，再完成{Z}个刷牙任务就够啦！"
   And Y = 目标积分 - 当前积分
   And Z = ceil(Y / 刷牙任务平均积分值)

4. Given 估算信息显示
   Then 估算基于儿童过去7天的平均每日获得积分
   And 7天内无积分变动时显示"加油！完成更多任务来实现愿望吧"
   And 估算每天自动更新

5. Given 儿童有多个可用任务类型
   When 显示"按任务估算"
   Then 系统显示多个任务类型估算：
     - "再完成{Z1}个刷牙任务（{P1}分/个）"
     - "再完成{Z2}个阅读任务（{P2}分/个）"
     - "再完成{Z3}个数学练习（{P3}分/个）"
   And 显示最常见任务类型优先

6. Given 儿童完成任意任务
   When 积分余额更新
   Then 估算信息实时更新（2-3秒同步，NFR4）
   And 估算天数减少
   And 或任务数量减少

7. Given 家长修改愿望积分门槛（Story 4.3）
   When 估算信息显示
   Then 估算立即反映新门槛值
   And 估算天数和任务数量重新计算

8. Given 儿童近期（7天）无积分变动
   When 查看愿望估算
   Then 系统显示"加油！完成更多任务来实现愿望吧"
   And 显示当前积分余额
   And 显示目标积分值
   And 显示"已停滞：7天未获得积分"提示

9. Given 儿童有积分历史但波动较大
   When 显示估算信息
   Then 系统使用加权平均（最近3天权重更高）
   And 显示"最近加快了！"或"最近减慢了！"趋势提示

10. Given 估算天数 = 1
    When 显示"按历史速度估算"
    Then 系统显示"按照你的速度，明天就能兑换了！"
    And 使用鼓励性的"明天"代替"1天"

11. Given 估算天数 = 0（积分已足够）
    When 显示估算信息
    Then 系统显示"你已经可以兑换这个愿望了！"
    And 显示"兑换"按钮（跳转到兑换流程）

12. Given 估算任务数量为0（积分已足够）
    When 显示"按任务估算"
    Then 系统显示"你已经足够兑换这个愿望啦！"
    And 显示"兑换"按钮

13. Given 估算天数 > 30（超过一个月）
    When 显示估算信息
    Then 系统显示"加油！这是一个长期目标，继续努力！"
    And 显示月度分解："大约需要{M}个月"（M = ceil(X / 30)）

14. Given 儿童在愿望列表中
    When 显示多个愿望
    Then 系统在每个愿望卡片上显示简略估算
    And 格式："还需X天"或"还需Y分"
    And 点击愿望卡片查看详细估算

15. Given 儿童查看愿望详情
    When 显示估算信息
    Then 系统提供两种估算方法：
     - 方法1：按历史速度（基于7天平均）
     - 方法2：按任务类型（基于任务积分值）
    And 两种方法同时显示
    And 帮助儿童理解不同路径

16. Given 估算计算完成
    When 显示估算信息
    Then 估算包含置信度提示：
     - 高置信度（7天数据稳定）："数据稳定"
     - 中等置信度（3-7天数据）："最近波动"
     - 低置信度（<3天数据）："数据不足"

17. Given 儿童查看估算信息
    When 点击"查看详细数据"按钮
    Then 系统显示估算计算依据：
     - 最近7天积分历史图表
     - 平均每日积分：X分
     - 最快单日：Y分
     - 最慢单日：Z分
     - 推荐任务列表（按效率排序）

18. Given 估算信息显示
    When 积分门槛降低
    Then 估算天数减少
    And 任务数量减少
    And 显示鼓励消息："家长降低了门槛，更快实现了！"

19. Given 估算信息显示
    When 积分门槛升高
    Then 估算天数增加
    And 任务数量增加
    And 显示提示："门槛提高了，继续努力！"

20. Given 儿童查看估算信息
    Then 系统提供个性化鼓励消息
    And 消息基于估算天数和儿童历史：
     - 1-3天："很快了！坚持住！"
     - 4-7天："一周内就能实现！"
     - 8-14天："半个月内实现，继续加油！"
     - 15-30天："这是中期目标，稳扎稳打！"
     - >30天："长期目标，坚持每天进步！"

21. Given 儿童离线查看估算信息
    When 无网络连接
    Then 系统显示缓存的估算数据
    And 显示"估算基于上次数据：{时间}前"

22. Given 估算算法计算
    Then 使用儿童隐私保护的计算方法
    And 不暴露儿童具体积分值给其他用户
    And 仅儿童和家长可以看到估算

23. Given 估算信息在家长端显示
    When 家长查看儿童愿望
    Then 家长可以看到儿童的估算信息
    And 显示格式相同
    And 家长可以调整积分门槛并看到实时估算变化

24. Given 估算显示在进度条旁边
    When 进度条和估算同时显示
    Then 视觉上清晰区分
    And 进度条使用图形，估算使用文字
    And 不产生视觉混淆

## Tasks / Subtasks

- [ ] Task 1: Create estimation calculation service (AC: #1-#5, #16)
  - [ ] Create lib/services/wish-estimation.ts
  - [ ] Calculate 7-day average daily points
  - [ ] Calculate weighted average (recent 3 days weighted higher)
  - [ ] Calculate days to reach threshold
  - [ ] Calculate task counts needed
  - [ ] Determine confidence level (high/medium/low)
  - [ ] Generate personalized encouragement messages

- [ ] Task 2: Create estimation query functions (AC: #2-#5)
  - [ ] Extend lib/db/queries/points.ts (from Epic 3)
  - [ ] Create getPointsHistory7Days() - Get last 7 days of points
  - [ ] Create getAverageDailyPoints() - Calculate 7-day average
  - [ ] Create getTaskTypesAndPoints() - Get available task types with points
  - [ ] Create getEstimationData() - Get all data needed for estimation

- [ ] Task 3: Create estimation API endpoint (AC: #1-#7, #16-#20)
  - [ ] Create GET /api/wishlists/[id]/estimation
  - [ ] Verify user authentication
  - [ ] Verify user is child or parent in same family
  - [ ] Calculate historical speed estimation
  - [ ] Calculate task-based estimation
  - [ ] Return estimation data:
    ```typescript
    {
      historicalSpeed: {
        averageDailyPoints: number,
        daysToReach: number,
        message: string,
        confidence: 'high' | 'medium' | 'low',
        trend: 'increasing' | 'decreasing' | 'stable'
      },
      taskBased: {
        remainingPoints: number,
        tasksByType: Array<{
          taskType: string,
          pointsPerTask: number,
          tasksNeeded: number,
          message: string
        }>,
        recommendedTasks: Array<{taskType: string, priority: number}>
      },
      encouragement: string,
      lastUpdated: timestamp
    }
    ```

- [ ] Task 4: Create estimation display component (AC: #1-#5, #10-#15, #20)
  - [ ] Create lib/components/features/wish-estimation.tsx
  - [ ] Display historical speed estimation
  - [ ] Display task-based estimation
  - [ ] Show confidence level indicator
  - [ ] Add personalized encouragement message
  - [ ] Support detailed data view (expandable)
  - [ ] Compact mode for wish list cards
  - [ ] Detail mode for wish detail pages
  - [ ] Responsive design (child-end: tablet optimized)

- [ ] Task 5: Implement real-time estimation updates (AC: #6, #7, #18-#19)
  - [ ] Use polling or Zustand store for real-time updates
  - [ ] Poll estimation data every 2-3 seconds
  - [ ] Trigger UI update when estimation changes
  - [ ] Update without page refresh
  - [ ] Show animation when estimation improves

- [ ] Task 6: Implement fallback handling (AC: #8)
  - [ ] Check if 7-day history exists
  - [ ] If no recent points:
    - Display "加油！完成更多任务来实现愿望吧"
    - Show "已停滞：7天未获得积分" warning
    - Display current points and threshold
    - Skip task-based estimation

- [ ] Task 7: Implement trend analysis (AC: #9)
  - [ ] Calculate 3-day trend (increasing/decreasing/stable)
  - [ ] Compare recent 3 days to previous 4 days
  - [ ] Display trend message:
    - Increasing: "最近加快了！"
    - Decreasing: "最近减慢了！"
    - Stable: "保持稳定！"

- [ ] Task 8: Implement task type recommendations (AC: #5, #17)
  - [ ] Get all available task types for child
  - [ ] Calculate efficiency (points per time estimate)
  - [ ] Sort by efficiency and frequency
  - [ ] Display top 3 recommended tasks
  - [ ] Show points per task

- [ ] Task 9: Implement detailed data view (AC: #17)
  - [ ] Create lib/components/dialogs/estimation-detail-dialog.tsx
  - [ ] Display 7-day points history chart (using Recharts)
  - [ ] Show statistics:
    - Average daily points
    - Fastest day
    - Slowest day
    - Total points in 7 days
  - [ ] Display recommended tasks list
  - [ ] Add "关闭" button

- [ ] Task 10: Implement offline support (AC: #21)
  - [ ] Cache estimation data in IndexedDB
  - [ ] Display cached data when offline
  - [ ] Show "估算基于上次数据：{时间}前" timestamp
  - [ ] Update immediately when network recovers
  - [ ] Background sync when back online

- [ ] Task 11: Integrate estimation in wish list (AC: #14, #24)
  - [ ] Update lib/components/features/wish-card.tsx (from Story 4.1)
  - [ ] Add compact estimation display
  - [ ] Format: "还需X天" or "还需Y分"
  - [ ] Position below progress bar
  - [ ] Tap to view detail (if detailed mode desired)

- [ ] Task 12: Integrate estimation in wish detail (AC: #15, #24)
  - [ ] Update app/(child)/wishlist/view/[id]/page.tsx (from Story 4.1)
  - [ ] Add WishEstimation component in detail mode
  - [ ] Position beside or below progress bar
  - [ ] Clear visual distinction from progress bar
  - [ ] Expandable detailed view

- [ ] Task 13: Write BDD tests (AC: #1-#24)
  - [ ] **Given** 儿童查看愿望 **When** 有积分历史 **Then** 显示"按历史速度估算"
  - [ ] **Given** 儿童查看愿望 **When** 显示估算 **Then** 显示"按任务估算"
  - [ ] **Given** 7天无积分 **When** 查看估算 **Then** 显示"加油！完成更多任务"
  - [ ] **Given** 估算1天 **When** 显示 **Then** 显示"明天就能兑换"
  - [ ] **Given** 估算0天 **When** 显示 **Then** 显示"可以兑换啦"
  - [ ] **Given** 积分更新 **When** 估算打开 **Then** 实时更新
  - [ ] **Given** 门槛修改 **When** 同步数据 **Then** 估算反映新值
  - [ ] **Given** 查看详细数据 **When** 点击按钮 **Then** 显示图表和统计
  - [ ] **Given** 离线状态 **When** 查看估算 **Then** 显示缓存数据
  - [ ] **Given** 趋势加快 **When** 查看估算 **Then** 显示"最近加快了"
  - [ ] **Given** 家长查看儿童愿望 **When** 显示估算 **Then** 格式相同
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 14: Performance and compliance verification (AC: #6, #22)
  - [ ] Verify estimation calculation < 100ms
  - [ ] Verify API response time < 500ms (NFR3: P95)
  - [ ] Verify real-time update < 2s (NFR4)
  - [ ] Verify child data privacy (only child/parent can see)
  - [ ] Verify chart rendering performance

## Dev Notes

### Project Structure Notes

**Alignment with unified project structure:**
- Service: `lib/services/wish-estimation.ts` (new)
- Queries: `lib/db/queries/points.ts` (extend from Epic 3)
- Component: `lib/components/features/wish-estimation.tsx` (new)
- Dialog: `lib/components/dialogs/estimation-detail-dialog.tsx` (new)
- API: `app/api/wishlists/[id]/estimation/route.ts` (new)
- Integration: Extend wish-card.tsx and wish detail pages
- Charts: Use Recharts (from architecture decision)

**Detected conflicts/variances:**
- None identified at story creation time

### Previous Story Intelligence

**From Story 4.1 (Child Creates Wish):**
- wishlists table created
- Wish card component exists (wish-card.tsx)
- Wish list page exists (wishlist/page.tsx)
- Wish detail page exists (wishlist/view/[id]/page.tsx)
- **Can reuse:** Wish card as container for estimation display
- **Can reuse:** Wish list and detail pages for integration

**From Story 4.2 (Parent Reviews Wish):**
- Approval workflow sets points_threshold
- **Can reuse:** Points threshold for estimation calculation

**From Story 4.3 (Parent Sets Points Threshold):**
- Real-time threshold updates
- **Can reuse:** Real-time update mechanism for estimation

**From Story 4.4 (Wish Progress Bar Display):**
- Progress bar component exists
- Real-time points balance updates
- **Can reuse:** Current points query for estimation
- **Can reuse:** Real-time update polling mechanism

**From Epic 3 (Points System):**
- Points history tracking exists
- lib/db/queries/points.ts exists
- Points balance calculation exists
- **Can reuse:** Points history queries for 7-day average
- **Can reuse:** Task type definitions for task-based estimation

### Estimation Calculation Algorithms

**Historical Speed Estimation:**
```typescript
function calculateHistoricalSpeed(
  currentPoints: number,
  pointsThreshold: number,
  pointsHistory: PointsHistory[]
): {
  averageDailyPoints: number,
  daysToReach: number,
  confidence: 'high' | 'medium' | 'low',
  trend: 'increasing' | 'decreasing' | 'stable'
} {
  // Get last 7 days of points
  const last7Days = pointsHistory.slice(-7);
  const totalPoints = last7Days.reduce((sum, h) => sum + h.pointsEarned, 0);
  
  // Calculate average daily points
  const averageDailyPoints = totalPoints / 7;
  
  // Calculate days to reach threshold
  const remainingPoints = pointsThreshold - currentPoints;
  const daysToReach = Math.ceil(remainingPoints / averageDailyPoints);
  
  // Determine confidence level
  const daysWithData = last7Days.filter(h => h.pointsEarned > 0).length;
  let confidence: 'high' | 'medium' | 'low';
  if (daysWithData >= 5) confidence = 'high';
  else if (daysWithData >= 3) confidence = 'medium';
  else confidence = 'low';
  
  // Calculate trend
  const recent3Days = last7Days.slice(-3);
  const previous4Days = last7Days.slice(0, 4);
  const recentAvg = recent3Days.reduce((sum, h) => sum + h.pointsEarned, 0) / 3;
  const previousAvg = previous4Days.reduce((sum, h) => sum + h.pointsEarned, 0) / 4;
  let trend: 'increasing' | 'decreasing' | 'stable';
  if (recentAvg > previousAvg * 1.2) trend = 'increasing';
  else if (recentAvg < previousAvg * 0.8) trend = 'decreasing';
  else trend = 'stable';
  
  return {
    averageDailyPoints,
    daysToReach,
    confidence,
    trend
  };
}
```

**Task-Based Estimation:**
```typescript
function calculateTaskBasedEstimation(
  currentPoints: number,
  pointsThreshold: number,
  taskTypes: TaskType[]
): {
  remainingPoints: number,
  tasksByType: TaskEstimation[]
} {
  const remainingPoints = pointsThreshold - currentPoints;
  
  // Calculate tasks needed for each type
  const tasksByType = taskTypes
    .filter(type => type.points > 0) // Only consider tasks with points
    .map(type => ({
      taskType: type.name,
      pointsPerTask: type.points,
      tasksNeeded: Math.ceil(remainingPoints / type.points),
      message: `再完成${Math.ceil(remainingPoints / type.points)}个${type.name}任务（${type.points}分/个）`
    }))
    .sort((a, b) => a.tasksNeeded - b.tasksNeeded); // Sort by efficiency
  
  return {
    remainingPoints,
    tasksByType
  };
}
```

**Personalized Encouragement:**
```typescript
function getEncouragementMessage(
  daysToReach: number,
  trend: 'increasing' | 'decreasing' | 'stable'
): string {
  // Time-based messages
  if (daysToReach <= 3) return "很快了！坚持住！";
  if (daysToReach <= 7) return "一周内就能实现！";
  if (daysToReach <= 14) return "半个月内实现，继续加油！";
  if (daysToReach <= 30) return "这是中期目标，稳扎稳打！";
  if (daysToReach <= 60) return "长期目标，坚持每天进步！";
  
  return "这是一个挑战，但你能做到的！";
}

function getTrendMessage(trend: 'increasing' | 'decreasing' | 'stable'): string {
  switch (trend) {
    case 'increasing': return "最近加快了！";
    case 'decreasing': return "最近减慢了！";
    case 'stable': return "保持稳定！";
    default: return "";
  }
}
```

### Estimation Component Design

**Component Structure:**
```typescript
// lib/components/features/wish-estimation.tsx
export function WishEstimation({
  wishId,
  childId,
  isCompact = false,
  isDetailView = false
}: WishEstimationProps) {
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  
  useEffect(() => {
    fetchEstimation();
    // Poll every 2-3 seconds
    const interval = setInterval(fetchEstimation, 2500);
    return () => clearInterval(interval);
  }, [wishId, childId]);
  
  if (!estimation) return <Skeleton />;
  
  return (
    <div className="wish-estimation">
      {!isCompact && (
        <>
          {/* Historical speed estimation */}
          <div className="estimation-section">
            <h4>按历史速度估算</h4>
            <p className="estimation-message">
              {estimation.historicalSpeed.daysToReach === 0
                ? "你已经可以兑换这个愿望了！"
                : estimation.historicalSpeed.daysToReach === 1
                  ? "按照你的速度，明天就能兑换了！"
                  : `按照你的速度，${estimation.historicalSpeed.daysToReach}天后就能兑换了！`
              }
            </p>
            <div className="confidence-badge">
              {estimation.historicalSpeed.confidence === 'high' && '数据稳定'}
              {estimation.historicalSpeed.confidence === 'medium' && '最近波动'}
              {estimation.historicalSpeed.confidence === 'low' && '数据不足'}
            </div>
            {estimation.historicalSpeed.trend && (
              <p className="trend-message">
                {getTrendMessage(estimation.historicalSpeed.trend)}
              </p>
            )}
          </div>
          
          {/* Task-based estimation */}
          <div className="estimation-section">
            <h4>按任务估算</h4>
            {estimation.taskBased.tasksByType.slice(0, 3).map(task => (
              <p key={task.taskType}>{task.message}</p>
            ))}
          </div>
          
          {/* Encouragement */}
          <div className="encouragement">
            <p>{estimation.encouragement}</p>
          </div>
          
          {/* Detailed data view button */}
          <Button onClick={openDetailDialog}>查看详细数据</Button>
        </>
      )}
      
      {isCompact && (
        <p className="compact-estimation">
          {estimation.historicalSpeed.daysToReach === 0
            ? `还差${estimation.taskBased.remainingPoints}分`
            : `还需${estimation.historicalSpeed.daysToReach}天`
          }
        </p>
      )}
    </div>
  );
}
```

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. Child views estimation with historical data
2. Child views estimation with no recent points
3. Estimation updates when points change
4. Estimation reflects threshold modification
5. Estimation shows 1 day as "明天"
6. Estimation shows 0 days as "可以兑换"
7. Child views detailed data (chart + statistics)
8. Child sees task-based estimation
9. Child sees trend message
10. Offline state shows cached data
11. Parent views child's estimation
12. Confidence levels display correctly

**Integration Tests:**
- 7-day average calculation accuracy
- Task-based estimation accuracy
- Trend analysis accuracy
- Real-time updates
- Confidence level determination
- Encouragement message generation

**E2E Tests (Playwright):**
- Complete estimation viewing flow
- Real-time updates on points change
- Detailed data view interaction
- Task-based estimation display
- Offline state handling
- Parent view of child's estimation

### Performance Requirements

- Estimation calculation: < 100ms
- API response time: < 500ms (NFR3: P95)
- Real-time update: < 2s (NFR4)
- Chart rendering: < 200ms
- Component render: < 50ms

### UX Requirements

**Child-End Design (from UX decisions):**
- Tablet-optimized layout (landscape, ≥768px)
- Encouraging, child-friendly language
- Clear, easy-to-understand format
- Visual feedback on improvements
- Gamified approach (progress + estimation)

**Estimation Display Design:**
- Historical speed: Time-based ("X天后")
- Task-based: Action-based ("再完成Y个任务")
- Dual display methods for clarity
- Confidence indicators
- Trend messages
- Encouragement messages

**Detailed View Design:**
- 7-day points history chart (Recharts)
- Statistics (average, fastest, slowest)
- Recommended tasks list
- Clean, readable layout

**Error/Fallback Handling:**
- No recent history: "加油！完成更多任务"
- No data: Show current points and threshold
- Offline: Show cached data with timestamp
- No `alert()` dialogs

### Compliance Requirements

**COPPA/GDPR Compliance:**
- Child data privacy (only child/parent can see estimation)
- No PII in estimation display
- Data retention: 3 years (NFR18)
- Clear, age-appropriate messaging

### Open Questions / Decisions Needed

1. **Task Type Selection for Estimation:**
   - Option A: Top 3 most common tasks
   - Option B: Top 3 highest-point tasks
   - Option C: Top 3 most efficient (points/time)
   - **Decision:** Top 3 most common (relatable to child, per AC #5)

2. **Trend Analysis Window:**
   - Option A: Compare recent 3 days to previous 4 days
   - Option B: Compare recent 5 days to previous 2 days
   - Option C: Simple 7-day slope
   - **Decision:** 3 vs 4 days (more granular, per AC #9)

3. **Confidence Level Thresholds:**
   - Option A: 7 days high, 3-7 medium, <3 low
   - Option B: 5 days high, 2-5 medium, <2 low
   - Option C: All 7 days high, some data medium, no data low
   - **Decision:** 5/3-5/<3 (stricter, per AC #16)

4. **Encouragement Message Categories:**
   - Option A: 5 categories (1-3, 4-7, 8-14, 15-30, >30)
   - Option B: 3 categories (short, medium, long)
   - Option C: Dynamic based on individual child's history
   - **Decision:** 5 categories (more granular, per AC #20)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<100ms calc, <500ms API, <2s update)
5. [ ] Estimation algorithms accurate
6. [ ] Real-time updates working
7. [ ] Offline support functional
8. [ ] Child data privacy maintained
9. [ ] Code review passed
10. [ ] Sprint status updated to ready-for-dev

### Tasks Blocked By

**Prerequisites:**
- Story 4.1: Child Creates Wish - Complete ✅
- Story 4.2: Parent Reviews Wish - Complete ✅
- Story 4.3: Parent Sets Points Threshold - Complete ✅
- Story 4.4: Wish Progress Bar Display - Complete ✅
- Epic 3: Points System - Complete ✅
- Points history tracking - Complete ✅
- Task types defined - Complete ✅
- Recharts library installed - Complete ✅

**None identified at story creation time.**

## Dev Agent Record

### Agent Model Used

GLM-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None at story creation time.

### Completion Notes List

Story created with comprehensive implementation guidance including:
- Complete estimation calculation algorithms (historical + task-based)
- Trend analysis and confidence level determination
- Personalized encouragement message generation
- Estimation component design (compact and detail modes)
- Real-time update strategy (polling 2-3s)
- Detailed data view with Recharts integration
- Task type recommendations
- Offline support with IndexedDB caching
- BDD test scenarios covering all acceptance criteria
- Performance targets for calculation and rendering
- Child data privacy compliance (COPPA/GDPR)
- UX requirements with child-friendly messaging

### File List

**Files to Create:**
- lib/services/wish-estimation.ts
- lib/components/features/wish-estimation.tsx
- lib/components/dialogs/estimation-detail-dialog.tsx
- app/api/wishlists/[id]/estimation/route.ts

**Files to Modify:**
- lib/db/queries/points.ts (add estimation queries)
- lib/components/features/wish-card.tsx (integrate compact estimation)
- app/(child)/wishlist/view/[id]/page.tsx (integrate detail estimation)
- types/estimation.ts (add estimation types)

**Test Files:**
- tests/integration/wish-estimation.spec.ts
- tests/e2e/wish-estimation.spec.ts
- tests/fixtures/estimation-data.ts
