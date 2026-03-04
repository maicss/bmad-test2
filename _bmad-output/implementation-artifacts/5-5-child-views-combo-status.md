# Story 5.5: Child Views Combo Status
# Status: ready-for-dev

## Story

As a 儿童,
I want 查看当前Combo状态,
So that 我可以知道自己的连续完成记录和距离下一个奖励还有多远。

## Acceptance Criteria

### Combo Status Display (AC1-AC5)

1. Given 我已登录系统（PIN码或家长设备）
   When 我打开应用首页或Combo页面
   Then 系统显示Combo状态卡片区域
   And 卡片位于首页 prominent 位置（顶部或第二屏）
   And 卡片有吸引力设计（带阴影、圆角、渐变背景）

2. Given 我有进行中的Combo（任一任务类型连续计数>0）
   When 显示Combo状态时
   Then 系统显示：
   - 火焰图标（🔥，表示进行中）
   - 当前连续天数（按任务类型分组）
   - 每个任务类型的进度条
   - 任务类型名称（中文）
   And 每个任务类型有独立的卡片

3. Given 我有多个任务类型的进行中Combo
   When 显示Combo状态时
   Then 每个任务类型独立显示
   And 卡片横向滚动或网格布局（响应式设计）
   And 刷牙、学习、运动等任务类型都有对应卡片
   And 卡片按最近更新时间排序

4. Given 显示进度条时
   When 计算进度时
   Then 系统显示：
   - 格式："已完成{当前天数}/{下一个阈值}天"
   - 进度百分比 = (当前天数 / 下一个阈值) * 100%
   - 颜色：
     - 0-25%：灰色（#9CA3AF）
     - 26-50%：蓝色（#3B82F6）
     - 51-75%：橙色（#F97316）
     - 76-99%：绿色（#22C55E）
     - 100%+：金色（#FFD700）
   And 进度条有动画效果（从0增长到当前值）

5. Given 我已达到最高阶梯（所有阶梯已触发）
   When 显示进度时
   Then 显示"🏆 已达成最高成就！"而不是进度条
   And 显示金色边框和发光效果
   And 显示总连续天数

### Empty State (AC6-AC7)

6. Given 我没有进行中的Combo
   When 显示Combo状态时
   Then 显示：
   - 插图（儿童角色 illustration）
   - "今天还没有完成任何任务"
   - "完成首个任务开始你的Combo吧！🚀"
   - "完成任务页面"按钮（跳转到任务列表）
   And 背景色为温暖的鼓励色（如浅橙色）

7. Given 我从来没有过Combo记录
   When 显示Combo状态时
   Then 显示首次引导：
   - "什么是Combo？"
   - "连续完成任务，保持Combo，获得积分奖励！"
   - "开始你的第一个Combo吧！"
   And 点击"什么是Combo？"显示帮助弹窗

### Combo Detail Modal (AC8-AC12)

8. Given 我查看Combo详情
   When 点击Combo卡片时
   Then 系统显示详情弹窗（全屏或大尺寸模态）：
   - 任务类型名称和图标
   - 当前连续天数（大字体）
   - 进度条（带动画）
   - 下一个阈值和奖励
   - 历史连续记录（最长一次）
   - 已获得奖励总积分
   - Combo日历可视化（显示完成和不完成的天数）
   And 弹窗底部有"关闭"按钮

9. Given 查看Combo详情
   When 显示历史连续记录
   Then 系统显示：
   - "最长连续：{天数}天"
   - 起止日期（2026-02-01 至 2026-02-28）
   - 统计数据：总天数、中断次数、平均连续天数

10. Given 查看Combo详情
    When 显示已获得奖励总积分
    Then 系统显示：
    - "已获得奖励：{总积分}分"
    - 奖励列表（最近5次）：
      - 连续7天：+30分（2026-02-07）
      - 连续14天：+70分（2026-02-14）
    And 点击"查看全部"跳转到积分历史

11. Given 查看Combo详情
    When 显示Combo日历
    Then 系统显示当月日历：
    - 已完成任务：绿色标记（✅）
    - 未完成任务：空白或灰色标记
    - 中断日期：红色标记（❌）
    - 今天：高亮边框
    And 点击日期显示该日的完成详情

12. Given 查看Combo详情
    When 向下滚动
    Then 弹窗支持滚动查看完整内容
    And 顶部保持固定（任务类型、当前天数）
    And 底部"关闭"按钮始终可见

### Reward Animation (AC13-AC15)

13. Given 我刚获得Combo奖励
    When 完成任务后
    Then 页面显示奖励获得动画和消息：
    - "🎉 恭喜！连续{天数}天获得{积分}分奖励！"
    - 粒子特效（confetti）
    - 积分数字滚动增长动画
    - 动画持续2-3秒
    And 动画结束后显示Toast通知

14. Given 获得奖励后
    When Combo状态卡片更新
    Then 卡片有短暂的高亮动画（闪光效果）
    And 进度条平滑过渡到新值
    And 连续天数数字更新动画

15. Given 在查看Combo详情时获得奖励
    When 触发奖励
    Then 详情页也显示奖励动画
    And 不关闭详情弹窗
    And 显示"获得{积分}分"悬浮通知

### Loading and Error States (AC16-AC18)

16. Given 页面加载
    When 数据获取时
    Then 显示骨架屏Loading状态
    - Combo卡片占位符（灰色骨架）
    - 进度条占位符（条纹动画）
    And 加载完成后显示实际数据
    And 加载超时（>5秒）显示错误状态

17. Given 数据获取失败
    When 加载Combo状态时
    Then 显示错误提示：
    - "加载失败，请下拉刷新"
    - 刷新图标按钮
    And 点击刷新按钮重新加载数据

18. Given 网络断开
    When 显示Combo状态
    Then 显示缓存数据（如果有）
    And 显示"离线模式"图标
    And 不显示Loading骨架

### Responsive Design (AC19-AC20)

19. Given 在平板设备上
    When 显示Combo状态
    Then 卡片布局为2列或3列网格
    And 卡片大小适配平板屏幕
    And 详情弹窗为居中模态（非全屏）

20. Given 在手机设备上
    When 显示Combo状态
    Then 卡片布局为单列滚动
    And 卡片宽度适配手机屏幕
    And 详情弹窗为全屏模态

### Real-time Updates (AC21-AC22)

21. Given 我的Combo状态发生变化
    When 其他设备完成任务或家长审批
    Then 当前页面实时更新
    - Combo卡片刷新
    - 进度条动画更新
    - 连续天数数字更新
    And 不需要手动刷新页面

22. Given 后台接收Combo奖励
    When 前台应用运行中
    Then 立即显示奖励动画
    And 不延迟显示
    And 后台接收时显示Badge提示

## Tasks / Subtasks

- [ ] Task 1: Create combo status API (AC: #1, #8-#12)
  - [ ] Create GET /api/combo/status
  - [ ] Get streak data for child from users.streak_data
  - [ ] Get combo rules for family
  - [ ] Calculate progress for each task type
  - [ ] Get streak history for longest streak calculation
  - [ ] Get combo rewards earned from points_history
  - [ ] Return: { combos: [{ taskType, currentStreak, nextThreshold, progress, isMaxTier, rewardsEarned, lastRewardAt, longestStreak, totalDays }] }

- [ ] Task 2: Create ComboStatusCard component (AC: #2-#5)
  - [ ] Create components/features/combo/combo-status-card.tsx
  - [ ] Implement fire icon display with animation
  - [ ] Implement streak count display with number animation
  - [ ] Implement progress bar integration
  - [ ] Implement card layout and styling
  - [ ] Add click handler to open detail modal

- [ ] Task 3: Create ComboProgressBar component (AC: #4)
  - [ ] Create components/features/combo/combo-progress-bar.tsx
  - [ ] Implement progress percentage calculation
  - [ ] Implement color coding based on progress
  - [ ] Implement smooth animation (Framer Motion)
  - [ ] Implement "已达成最高成就" state
  - [ ] Implement "已完成X/Y天" label

- [ ] Task 4: Create ComboDetailModal component (AC: #8-#12)
  - [ ] Create components/features/combo/combo-detail-modal.tsx
  - [ ] Display task type name and icon
  - [ ] Display current streak (large font)
  - [ ] Display progress bar with animation
  - [ ] Display next threshold and reward
  - [ ] Display longest streak history
  - [ ] Display total rewards earned
  - [ ] Display reward list (last 5 rewards)
  - [ ] Create ComboCalendar component for visualization
  - [ ] Implement scroll behavior

- [ ] Task 5: Create ComboCalendar component (AC: #11)
  - [ ] Create components/features/combo/combo-calendar.tsx
  - [ ] Display month calendar grid
  - [ ] Mark completed days (✅ green)
  - [ ] Mark missed days (❌ red)
  - [ ] Highlight today
  - [ ] Implement day click handler (show detail)
  - [ ] Support month navigation

- [ ] Task 6: Create ComboEmptyState component (AC: #6-#7)
  - [ ] Create components/features/combo/combo-empty-state.tsx
  - [ ] Display illustration
  - [ ] Display encouraging message
  - [ ] Display "完成任务" button
  - [ ] Create onboarding modal for first-time users

- [ ] Task 7: Create ComboPage (AC: #1, #6-#7, #16-#20)
  - [ ] Create app/(child)/combo/page.tsx
  - [ ] Display all combo cards in grid layout
  - [ ] Implement empty state when no combos
  - [ ] Implement loading skeleton state
  - [ ] Implement error state with retry
  - [ ] Implement responsive design (mobile/tablet)
  - [ ] Add pull-to-refresh functionality

- [ ] Task 8: Add combo reward notification (AC: #13-#15, #21-#22)
  - [ ] Integrate with Story 5.2, 5.3 reward triggers
  - [ ] Show toast notification on reward
  - [ ] Implement confetti animation
  - [ ] Implement points number scroll animation
  - [ ] Implement card highlight animation
  - [ ] Implement real-time updates via WebSocket or polling

- [ ] Task 9: Add loading skeletons (AC: #16)
  - [ ] Create components/features/combo/combo-skeleton.tsx
  - [ ] Implement card skeleton with shimmer effect
  - [ ] Implement progress bar skeleton with stripes

- [ ] Task 10: Implement real-time sync (AC: #21-#22)
  - [ ] Use WebSocket or polling for real-time updates
  - [ ] Update combo state on streak changes
  - [ ] Show badge for background rewards
  - [ ] Implement optimistic UI updates

- [ ] Task 11: Write BDD tests (All ACs)
  - [ ] Test combo status display with active streak
  - [ ] Test progress bar calculation and colors
  - [ ] Test max tier state
  - [ ] Test empty state
  - [ ] Test loading state
  - [ ] Test error state
  - [ ] Test detail modal
  - [ ] Test calendar visualization
  - [ ] Test reward animation
  - [ ] Test real-time updates
  - [ ] Test responsive design

## Dev Notes

### API Response Format

```typescript
// GET /api/combo/status
interface ComboStatusResponse {
  combos: ComboStatus[];
  totalRewardsEarned: number;
}

interface ComboStatus {
  taskType: TaskType; // 'brush' | 'teach' | 'exercise' | 'chores' | 'custom'
  taskTypeName: string; // '刷牙' | '学习' | '运动' | '家务' | '自定义'
  currentStreak: number;
  nextThreshold: number | null; // null if no next threshold (max tier reached)
  progress: number; // percentage 0-100
  isMaxTier: boolean;
  rewardsEarned: number;
  lastRewardAt: string | null; // ISO timestamp
  longestStreak: number;
  totalDays: number;
  calendarData: CalendarDay[];
}

interface CalendarDay {
  date: string; // YYYY-MM-DD
  status: 'completed' | 'missed' | 'empty';
  streakCount?: number;
}

// Example response:
{
  "combos": [
    {
      "taskType": "brush",
      "taskTypeName": "刷牙",
      "currentStreak": 5,
      "nextThreshold": 7,
      "progress": 71,
      "isMaxTier": false,
      "rewardsEarned": 0,
      "lastRewardAt": null,
      "longestStreak": 14,
      "totalDays": 45,
      "calendarData": [
        { "date": "2026-03-01", "status": "completed", "streakCount": 1 },
        { "date": "2026-03-02", "status": "completed", "streakCount": 2 },
        { "date": "2026-03-03", "status": "missed" },
        { "date": "2026-03-04", "status": "completed", "streakCount": 1 },
        { "date": "2026-03-05", "status": "completed", "streakCount": 2 },
        { "date": "2026-03-06", "status": "completed", "streakCount": 3 },
        { "date": "2026-03-07", "status": "completed", "streakCount": 4 },
        { "date": "2026-03-08", "status": "completed", "streakCount": 5 }
      ]
    },
    {
      "taskType": "teach",
      "taskTypeName": "学习",
      "currentStreak": 14,
      "nextThreshold": 30,
      "progress": 46,
      "isMaxTier": false,
      "rewardsEarned": 100,
      "lastRewardAt": "2026-02-01T10:00:00Z",
      "longestStreak": 21,
      "totalDays": 67,
      "calendarData": [...]
    }
  ],
  "totalRewardsEarned": 100
}
```

### Progress Bar Colors

```typescript
// components/features/combo/combo-progress-bar.tsx
const getProgressColor = (progress: number): string => {
  if (progress >= 100) return '#FFD700'; // 金色
  if (progress >= 76) return '#22C55E'; // 绿色
  if (progress >= 51) return '#F97316'; // 橙色
  if (progress >= 26) return '#3B82F6'; // 蓝色
  return '#9CA3AF'; // 灰色
};
```

### Task Type Names and Icons

```typescript
const TASK_TYPE_CONFIG: Record<TaskType, { name: string; icon: string; emoji: string }> = {
  brush: { name: '刷牙', icon: '🦷', emoji: '🦷' },
  teach: { name: '学习', icon: '📚', emoji: '📚' },
  exercise: { name: '运动', icon: '🏃', emoji: '🏃' },
  chores: { name: '家务', icon: '🧹', emoji: '🧹' },
  custom: { name: '自定义', icon: '⭐', emoji: '⭐' }
};
```

### Components Structure

```
components/features/combo/
├── combo-page.tsx              # Main page
├── combo-status-card.tsx       # Card showing streak
├── combo-progress-bar.tsx      # Progress visualization
├── combo-detail-modal.tsx      # Detail popup
├── combo-calendar.tsx          # Calendar visualization
├── combo-empty-state.tsx       # Empty state
├── combo-skeleton.tsx          # Loading skeleton
├── combo-reward-animation.tsx   # Reward confetti animation
└── combo-onboarding-modal.tsx  # First-time user guide
```

### Real-time Update Strategy

```typescript
// hooks/useRealtimeComboUpdates.ts
export function useRealtimeComboUpdates(childId: string) {
  const [comboStatus, setComboStatus] = useState<ComboStatusResponse | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchComboStatus(childId).then(setComboStatus);

    // WebSocket connection
    const ws = new WebSocket(`wss://api.example.com/combos/${childId}`);
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setComboStatus(update);
      showRewardAnimation(update.newReward);
    };

    return () => ws.close();
  }, [childId]);

  return comboStatus;
}
```

### BDD Test Scenarios

```typescript
describe('Story 5.5: Child Views Combo Status', () => {
  it('given 儿童有进行中Combo，then 显示Combo状态卡片', async () => {
    // Given: 儿童有5天刷牙Combo
    const child = await createChildWithStreak('brush', 5);

    // When: 打开Combo页面
    const page = await renderComboPage(child.id);

    // Then: 显示Combo状态卡片
    expect(page.getByText('刷牙')).toBeInTheDocument();
    expect(page.getByText('5天')).toBeInTheDocument();
    expect(page.getByTestId('fire-icon')).toBeInTheDocument();
  });

  it('given 进度为71%，then 显示橙色进度条', async () => {
    // Given: 5/7天，进度71%
    const child = await createChildWithStreak('brush', 5);
    await setComboThreshold(7);

    // When: 渲染进度条
    const { getByRole } = render(<ComboProgressBar current={5} next={7} />);

    // Then: 进度为71%，橙色
    const progressBar = getByRole('progressbar');
    expect(progressBar).toHaveStyle({ width: '71%' });
    expect(progressBar).toHaveStyle({ backgroundColor: '#F97316' });
    expect(screen.getByText('已完成5/7天')).toBeInTheDocument();
  });

  it('given 达到最高阶梯，then 显示金色成就状态', async () => {
    // Given: 已达成所有阶梯
    const child = await createChildWithMaxTier();

    // When: 渲染Combo卡片
    const page = await renderComboPage(child.id);

    // Then: 显示金色成就
    expect(page.getByText('🏆 已达成最高成就！')).toBeInTheDocument();
    expect(page.getByTestId('max-tier-badge')).toHaveClass('gold-border');
  });

  it('given 无进行中Combo，then 显示空状态', async () => {
    // Given: 儿童没有Combo
    const child = await createChild();

    // When: 打开Combo页面
    const page = await renderComboPage(child.id);

    // Then: 显示空状态
    expect(page.getByText('今天还没有完成任何任务')).toBeInTheDocument();
    expect(page.getByText('完成首个任务开始你的Combo吧！🚀')).toBeInTheDocument();
    expect(page.getByRole('button', { name: '完成任务页面' })).toBeInTheDocument();
  });
});
```

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] Combo cards display correctly for each task type
4. [ ] Progress bar colors match specification
5. [ ] Detail modal shows complete info
6. [ ] Calendar visualization accurate
7. [ ] Empty state displays correctly
8. [ ] Loading skeleton works
9. [ ] Error state with retry works
10. [ ] Reward animation smooth
11. [ ] Real-time updates work
12. [ ] Responsive design tested
13. [ ] Code review passed

## Dependencies

- Epic 5: Story 5.1 (Streak Tracking) - Streak data source
- Epic 5: Story 5.2, 5.3 (Combo Rewards) - Rule and reward data
- Epic 5: Story 5.4 (Combo Warning) - Notification integration
- Epic 3: Points History System - Rewards data

## Dev Agent Record

### File List

**Files to Create:**
- app/api/combo/status/route.ts
- components/features/combo/combo-page.tsx
- components/features/combo/combo-status-card.tsx
- components/features/combo/combo-progress-bar.tsx
- components/features/combo/combo-detail-modal.tsx
- components/features/combo/combo-calendar.tsx
- components/features/combo/combo-empty-state.tsx
- components/features/combo/combo-skeleton.tsx
- components/features/combo/combo-reward-animation.tsx
- components/features/combo/combo-onboarding-modal.tsx
- hooks/useRealtimeComboUpdates.ts

**Files to Modify:**
- app/(child)/layout.tsx (add combo nav item)
- lib/db/queries/streaks.ts (add combo status query)

**Test Files:**
- tests/e2e/combo-status.spec.ts
- tests/components/combo-progress-bar.spec.tsx
- tests/components/combo-calendar.spec.tsx
