# Story 5.7: Daily Check-in System
# Status: ready-for-dev

## Story

As a 儿童,
I want 每日签到获得积分,
So that 我可以通过简单的签到动作获得积分奖励，培养每日参与习惯。

## Acceptance Criteria

### Check-in Page Display (AC1-AC4)

1. Given 我已登录系统（PIN码或家长设备）
   When 我进入签到页面
   Then 系统检查今日是否已签到
   And 显示签到页面，包含：
   - 签到按钮（大尺寸，适合儿童点击，≥80x80pt）
   - 今日可获得积分提示
   - 连续签到加成提示（如果有）
   - 签到日历（本月日期，显示已签到/未签到）
   And 页面标题："每日签到"

2. Given 我今日尚未签到
   When 显示签到页面时
   Then 系统显示：
   - 签到按钮（大尺寸，≥80x80pt，圆角设计）
   - 签到按钮图标（👋 或 ✓ 图标）
   - "点击签到"提示文字
   - 今日可获得积分："今日可得X分"
   - 连续签到加成："连续签到加成+Y分"
   - 签到日历（本月日期网格）

3. Given 查看签到日历
   When 显示日历时
   Then 系统显示：
   - 本月所有日期（7x5网格）
   - 已签到日期：显示勾选标记（✅），绿色背景
   - 今日：突出显示（金色边框）
   - 未来日期：灰色不可点击
   - 本月签到天数统计："本月已签到X天"
   And 支持左右滑动或点击切换月份

4. Given 查看签到统计
   When 页面显示时
   Then 系统显示统计面板：
   - 连续签到天数："已连续签到X天"
   - 历史最高："最高连续X天"
   - 累计签到："累计签到X天"
   - 累计获得积分："累计获得X分"
   And 统计数据有图标和动画效果

### Check-in Action (AC5-AC10)

5. Given 我点击签到按钮
   When 签到时
   Then 系统执行：
   - 检查今日是否已签到（防止重复）
   - 获取当前连续签到天数
   - 计算签到积分（基础 + 连续加成）
   - 发放积分到账户
   - 记录签到到check_in_records表
   - 更新连续签到计数
   - 显示签到成功动画
   And 整个流程在500ms内完成

6. Given 签到积分计算规则（默认配置）
   When 计算积分时
   Then 系统使用：
   - 基础积分：5分（第1天）
   - 连续加成：每天+1分，最多+5分
     - 第1天：5 + 1 = 6分
     - 第2天：5 + 2 = 7分
     - 第3天：5 + 3 = 8分
     - 第4天：5 + 4 = 9分
     - 第5天：5 + 5 = 10分
     - 第6天及以上：5 + 5 = 10分（保持+5）
   - 连续签到中断后重置为第1天

7. Given 签到成功显示
   When 动画播放时
   Then 系统显示：
   - 全屏半透明遮罩（0.5透明度）
   - 彩色纸屑从顶部飘落（confetti效果）
   - "+X积分"金色大字（大字体，居中）
   - "签到成功！"标题
   - "连续签到X天"副标题
   - 纸屑颜色：金、红、橙、绿、蓝
   And 动画持续2-3秒

8. Given 签到成功动画播放
   When 动画播放时
   Then 纸屑效果：
   - 粒子数量：50-100个
   - 粒子形状：圆、方、三角、星形
   - 飘落速度：随机
   - 旋转角度：随机
   And 积分数字滚动增长效果（从0增长到实际积分）

9. Given 动画播放完成
   When 动画结束后
   Then 遮罩和动画元素淡出
   - 动画元素opacity从1→0（持续0.5秒）
   - 页面恢复正常显示
   - 签到按钮变为"已签到"状态
   - 签到日历今日标记为已签到
   - 统计数据更新

10. Given 用户不想等待动画
    When 动画播放时
    Then 用户可以点击任意位置或"跳过"按钮
    And 立即结束动画
    And 显示签到成功状态

### Already Checked-in State (AC11-AC13)

11. Given 我已完成今日签到
    When 再次进入签到页面时
    Then 系统显示：
    - 今日已签到状态
    - 签到按钮禁用状态（灰色）
    - 签到按钮文字："今日已签到"
    - 已领取的积分数量："今日获得X分"
    - 签到日历今日标记为已签到
    - "明天再来吧"提示

12. Given 今日已签到
    When 尝试再次签到时
    Then 系统拒绝签到请求
    And 显示提示："今天已经签到过了，明天再来吧！"
    And 不重复发放积分

13. Given 跨天（北京时间0点后）
    When 进入签到页面时
    Then 系统重置为未签到状态
    And 显示新的签到按钮
    And 连续签到天数根据昨日是否签到计算

### Parent Settings (AC14-AC17)

14. Given 家长配置签到规则
    When 家长进入设置时
    Then 家长可以配置：
    - 每日基础积分值（默认5，可调1-20）
    - 连续加成开关（默认开启）
    - 连续加成最大值（默认5，可调1-10）
    - 签到功能启用/禁用（默认启用）
    And 设置页面在家长设置菜单中

15. Given 家长修改基础积分值
    When 保存时
    Then 新积分值立即生效
    And 影响未来的签到计算
    And 已发放的积分不追溯调整

16. Given 家长禁用连续加成
    When 保存时
    Then 未来签到只发放基础积分
    And 不计算连续加成
    And 连续签到天数仍记录（用于统计）

17. Given 家长禁用签到功能
    When 保存时
    Then 儿童端签到页面隐藏
    - 页面显示"签到功能已关闭"
    - 不显示签到按钮
    And 可以重新启用

### Check-in History and Statistics (AC18-AC21)

18. Given 我查看签到历史
    When 点击"签到记录"时
    Then 系统显示：
    - 连续签到天数（当前和历史最高）
    - 本月签到天数
    - 累计签到天数
    - 累计获得积分
    - 最近30天签到记录（列表）
    And 列表显示日期、积分、连续天数

19. Given 查看最近30天签到记录
    When 显示列表时
    Then 每条记录显示：
    - 日期（MM-DD格式）
    - 获得积分
    - 连续天数标记（如"第7天"）
    - 图标（✅ 已签到，❌ 未签到）
    And 列表按日期降序排列

20. Given 查看签到日历历史
    When 切换月份时
    Then 系统显示该月的签到记录
    - 已签到日期：绿色标记
    - 未签到日期：空白或灰色
    - 中断日期：红色标记（显示中断前连续天数）
    And 支持查看任意历史月份

21. Given 查看连续签到中断
    When 日历显示中断日期时
    Then 系统标记中断日为红色
    And 显示中断前连续天数（如"连续7天后中断"）
    And 提示："连续签到已重置，重新开始吧！"

### Performance and Error Handling (AC22-AC25)

22. Given 页面加载性能
    When 页面加载时
    Then 系统在1秒内完成加载（NFR1）
    - 签到状态查询：< 200ms
    - 签到历史查询：< 300ms
    - 页面渲染：< 500ms

23. Given 签到请求失败
    When 网络错误或服务器错误
    Then 系统显示错误提示：
    - "签到失败，请稍后重试"
    - 显示重试按钮
    And 保留签到按钮可用状态

24. Given 重复签到请求
    When 快速多次点击签到按钮
    Then 系统只处理一次签到
    - 使用请求防抖（debounce 500ms）
    - 或使用乐观锁
    And 不重复发放积分

25. Given 离线状态
    When 尝试签到时
    Then 系统显示离线提示
    - "网络未连接，无法签到"
    - 显示刷新按钮
    And 签到按钮禁用

## Tasks / Subtasks

- [ ] Task 1: Create check-in database schema (AC: #5, #18)
  - [ ] Create check_in_records table:
    - id (TEXT, PRIMARY KEY)
    - child_id (TEXT, NOT NULL, REFERENCES users(id))
    - check_in_date (DATE, NOT NULL)
    - points_earned (INTEGER, NOT NULL)
    - consecutive_day (INTEGER, NOT NULL)
    - created_at (INTEGER, NOT NULL)
  - [ ] Add UNIQUE constraint on (child_id, check_in_date)
  - [ ] Create migration file: database/migrations/XXX_create_check_in_records.sql
  - [ ] Add indexes: idx_check_in_child_date (child_id, check_in_date DESC)

- [ ] Task 2: Create check-in service (AC: #5-#6)
  - [ ] Create lib/services/check-in.ts
  - [ ] Implement checkIn(childId) function
    ```typescript
    export async function checkIn(childId: string): Promise<CheckInResult>
    ```
  - [ ] Implement calculateCheckInPoints(consecutiveDays, settings) function
  - [ ] Implement getConsecutiveDays(childId) function
  - [ ] Implement hasCheckedInToday(childId) function
  - [ ] Implement getLastCheckInDate(childId) function
  - [ ] Add duplicate check
  - [ ] Add points award integration

- [ ] Task 3: Create check-in API (AC: #5, #12, #22-#24)
  - [ ] Create POST /api/check-in - Perform check-in
  - [ ] Implement check-in logic
  - [ ] Add duplicate check
  - [ ] Add points award integration
  - [ ] Implement error handling
  - [ ] Add rate limiting (prevent spam)

- [ ] Task 4: Create check-in status API (AC: #1, #11)
  - [ ] Create GET /api/check-in/status
  - [ ] Return today's check-in status
  - [ ] Return current consecutive days
  - [ ] Return today's points
  - [ ] Return month check-in count

- [ ] Task 5: Create check-in history API (AC: #18-#20)
  - [ ] Create GET /api/check-in/history
  - [ ] Return check-in statistics
  - [ ] Return last 30 days records
  - [ ] Support pagination

- [ ] Task 6: Create CheckInButton component (AC: #2, #5, #11)
  - [ ] Create components/features/check-in/check-in-button.tsx
  - [ ] Implement large touch target (≥80x80pt)
  - [ ] Implement success animation
  - [ ] Implement disabled state for already checked-in
  - [ ] Implement loading state

- [ ] Task 7: Create CheckInCalendar component (AC: #3, #11, #20-#21)
  - [ ] Create components/features/check-in/check-in-calendar.tsx
  - [ ] Display current month grid (7x5)
  - [ ] Mark checked-in dates (✅, green)
  - [ ] Highlight today (gold border)
  - [ ] Mark missed dates (red)
  - [ ] Navigate between months
  - [ ] Show check-in streak info

- [ ] Task 8: Create CheckInStats component (AC: #4)
  - [ ] Create components/features/check-in/check-in-stats.tsx
  - [ ] Display consecutive days
  - [ ] Display highest consecutive days
  - [ ] Display total days
  - [ ] Display total points
  - [ ] Add icons and animations

- [ ] Task 9: Create CheckInCelebration component (AC: #7-#10)
  - [ ] Create components/features/check-in/check-in-celebration.tsx
  - [ ] Implement confetti effect (canvas or CSS)
  - [ ] Implement points number scroll animation
  - [ ] Implement overlay fade out
  - [ ] Implement skip button
  - [ ] Use Framer Motion

- [ ] Task 10: Create CheckInPage (AC: #1, #11)
  - [ ] Create app/(child)/check-in/page.tsx
  - [ ] Display check-in button
  - [ ] Display calendar
  - [ ] Display stats
  - [ ] Implement loading state
  - [ ] Implement error state

- [ ] Task 11: Create check-in history page (AC: #18-#20)
  - [ ] Create app/(child)/check-in/history/page.tsx
  - [ ] Display check-in statistics
  - [ ] Display last 30 days records list
  - [ ] Implement calendar view

- [ ] Task 12: Create check-in settings (AC: #14-#17)
  - [ ] Create parent check-in settings page
  - [ ] Create PUT /api/check-in/settings
  - [ ] Store in family settings table
  - [ ] Implement form validation

- [ ] Task 13: Write BDD tests (All ACs)
  - [ ] Test first day check-in
  - [ ] Test consecutive days calculation
  - [ ] Test points calculation with bonus
  - [ ] Test duplicate check-in prevention
  - [ ] Test calendar display
  - [ ] Test history display
  - [ ] Test streak interruption marking
  - [ ] Test settings update
  - [ ] Test error handling
  - [ ] Test performance requirements

## Dev Notes

### Database Schema

**New Table: `check_in_records`**
```sql
CREATE TABLE check_in_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  points_earned INTEGER NOT NULL,
  consecutive_day INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(child_id, check_in_date)
);

-- Indexes
CREATE INDEX idx_check_in_child_date ON check_in_records(child_id, check_in_date DESC);
CREATE INDEX idx_check_in_date ON check_in_records(check_in_date);
```

**Family Settings for Check-in:**
```sql
-- Add to family_settings table (from Epic 6)
INSERT INTO family_settings (family_id, setting_key, setting_value) VALUES
  (familyId, 'check_in.base_points', '5'),
  (familyId, 'check_in.consecutive_bonus_enabled', 'true'),
  (familyId, 'check_in.max_consecutive_bonus', '5'),
  (familyId, 'check_in.enabled', 'true');
```

### API Endpoints

```
POST   /api/check-in              # Perform check-in
GET    /api/check-in/status       # Get today's status
GET    /api/check-in/history      # Get check-in history
PUT    /api/check-in/settings     # Parent: update settings
```

### API Response Formats

```typescript
// POST /api/check-in
interface CheckInRequest {
  childId: string;
}

interface CheckInResponse {
  success: boolean;
  pointsEarned: number;
  consecutiveDay: number;
  totalPoints: number;
  message: string;
}

// GET /api/check-in/status
interface CheckInStatusResponse {
  hasCheckedInToday: boolean;
  todayPoints?: number;
  consecutiveDays: number;
  monthCheckInCount: number;
  totalCheckInDays: number;
  totalPointsEarned: number;
  maxConsecutiveDays: number;
}

// GET /api/check-in/history?limit=30&offset=0
interface CheckInHistoryResponse {
  records: CheckInRecord[];
  statistics: CheckInStatistics;
}

interface CheckInRecord {
  id: string;
  checkInDate: string; // YYYY-MM-DD
  pointsEarned: number;
  consecutiveDay: number;
}

interface CheckInStatistics {
  consecutiveDays: number;
  maxConsecutiveDays: number;
  totalDays: number;
  totalPointsEarned: number;
  monthDays: number;
}
```

### Points Calculation Logic

```typescript
// lib/services/check-in.ts
interface CheckInSettings {
  basePoints: number; // default: 5
  consecutiveBonusEnabled: boolean; // default: true
  maxConsecutiveBonus: number; // default: 5
  enabled: boolean; // default: true
}

function calculateCheckInPoints(
  consecutiveDays: number,
  settings: CheckInSettings
): number {
  if (!settings.enabled) return 0;

  let points = settings.basePoints;

  if (settings.consecutiveBonusEnabled) {
    const bonus = Math.min(consecutiveDays, settings.maxConsecutiveBonus);
    points += bonus;
  }

  return points;
}

// Examples:
// Day 1: 5 + 1 = 6
// Day 2: 5 + 2 = 7
// Day 3: 5 + 3 = 8
// Day 4: 5 + 4 = 9
// Day 5+: 5 + 5 = 10 (max)
// After gap: Day 1: 5 + 1 = 6 (reset)
```

### Consecutive Days Calculation

```typescript
// lib/services/check-in.ts
async function getConsecutiveDays(childId: string): Promise<number> {
  // Get last check-in date
  const lastRecord = await getLastCheckInRecord(childId);
  if (!lastRecord) return 0;

  // Check if last check-in was yesterday
  const lastDate = new Date(lastRecord.check_in_date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // If last check-in was yesterday, increment
  // If last check-in was today, return same consecutive_day
  // If last check-in was before yesterday, reset to 0
  const diffDays = getDaysDifference(lastDate, today);
  
  if (diffDays === 1) {
    // Yesterday was last check-in, increment
    return lastRecord.consecutive_day + 1;
  } else if (diffDays === 0) {
    // Already checked in today
    return lastRecord.consecutive_day;
  } else {
    // Gap, reset
    return 0;
  }
}
```

### BDD Test Scenarios

```typescript
describe('Story 5.7: Daily Check-in System', () => {
  it('given 儿童首次签到，then 获得6分（5基础+1加成）', async () => {
    // Given: 儿童首次登录
    const child = await createChild();

    // When: 签到
    const result = await checkIn(child.id);

    // Then: 获得6分
    expect(result.pointsEarned).toBe(6);
    expect(result.consecutiveDay).toBe(1);
    
    const balance = await getPointsBalance(child.id);
    expect(balance).toBe(6);
  });

  it('given 儿童连续签到5天，then 第5天获得10分', async () => {
    // Given: 连续签到4天
    const child = await createChild();
    for (let i = 0; i < 4; i++) {
      await checkIn(child.id);
      await advanceTime(1, 'day');
    }

    // When: 第5天签到
    const result = await checkIn(child.id);

    // Then: 获得10分（5基础+5加成，已达到最大）
    expect(result.pointsEarned).toBe(10);
    expect(result.consecutiveDay).toBe(5);
  });

  it('given 连续签到中断，then 重置为第1天', async () => {
    // Given: 连续签到7天，然后中断
    const child = await createChild();
    for (let i = 0; i < 7; i++) {
      await checkIn(child.id);
      await advanceTime(1, 'day');
    }
    await advanceTime(1, 'day'); // Skip a day

    // When: 重新签到
    const result = await checkIn(child.id);

    // Then: 重置为第1天
    expect(result.consecutiveDay).toBe(1);
    expect(result.pointsEarned).toBe(6);
  });

  it('given 今日已签到，then 不能重复签到', async () => {
    // Given: 今日已签到
    const child = await createChild();
    await checkIn(child.id);

    // When: 再次尝试签到
    try {
      await checkIn(child.id);
      fail('Should throw error');
    } catch (error) {
      // Then: 拒绝签到
      expect(error.message).toContain('已经签到过了');
    }
  });
});
```

### Components Structure

```
components/features/check-in/
├── check-in-page.tsx              # Main page
├── check-in-button.tsx             # Large check-in button
├── check-in-calendar.tsx           # Calendar grid
├── check-in-stats.tsx              # Statistics display
├── check-in-celebration.tsx        # Success animation
├── check-in-history-page.tsx       # History page
└── check-in-record-item.tsx        # Single history item
```

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] Check-in works correctly
4. [ ] Points calculation correct with bonus
5. [ ] Duplicate check-in prevented
6. [ ] Consecutive days calculated correctly
7. [ ] Calendar displays correctly
8. [ ] Celebration animation smooth
9. [ ] History records accurate
10. [ ] Settings work correctly
11. [ ] Error handling robust
12. [ ] Performance requirements met (< 1s load)
13. [ ] Code review passed

## Dependencies

- Epic 3: Story 3.1 (System Calculates Points) - Points award mechanism
- Epic 5: Story 5.6 (Parent Configures) - Family settings
- Epic 6: Family Settings System - Settings storage

## Dev Agent Record

### File List

**Files to Create:**
- database/migrations/XXX_create_check_in_records.sql
- lib/db/queries/check-in.ts
- lib/services/check-in.ts
- app/api/check-in/route.ts
- app/api/check-in/status/route.ts
- app/api/check-in/history/route.ts
- app/(child)/check-in/page.tsx
- app/(child)/check-in/history/page.tsx
- components/features/check-in/check-in-button.tsx
- components/features/check-in/check-in-calendar.tsx
- components/features/check-in/check-in-stats.tsx
- components/features/check-in/check-in-celebration.tsx

**Files to Modify:**
- app/(child)/layout.tsx (add check-in nav)
- lib/db/queries/index.ts (export check-in queries)
