# Story 5.8: Badge Showcase Wall
# Status: ready-for-dev

## Story

As a 儿童,
I want 查看徽章成就墙,
So that 我可以展示自己获得的徽章，看到自己的成长历程。

## Acceptance Criteria

### Badge Wall Display (AC1-AC6)

1. Given 我已登录系统（PIN码或家长设备）
   When 我进入"徽章"页面
   Then 系统显示徽章成就墙
   And 页面标题："我的徽章"
   And 页面包含：徽章网格、分类标签、统计数据

2. Given 我查看成就墙时
   When 页面加载时
   Then 系统显示：
   - 已获得徽章网格（按获得时间倒序）
   - 未获得徽章（灰度显示，按解锁条件排序）
   - 徽章统计："已获得X / 总数Y"
   And 页面在2秒内完成加载（NFR1）

3. Given 显示单个徽章卡片时
   When 徽章为已获得状态
   Then 显示：
   - 徽章图标（80x80pt，彩色）
   - 徽章名称（大字体，bold）
   - 获得日期（"YYYY-MM-DD"）
   - 获得原因说明（简短）
   - 金色边框或发光效果
   And 卡片有轻微阴影和圆角

4. Given 显示单个徽章卡片时
   When 徽章为未获得状态
   Then 显示：
   - 徽章图标（80x80pt，灰度）
   - 徽章名称（小字体）
   - 获得条件说明（"连续X天"、"累计X分"等）
   - 进度条（显示完成百分比）
   And 卡片不发光，无金色边框

5. Given 徽章分类显示
   When 页面显示时
   Then 按分类展示徽章：
   - 任务类（连续完成任务）
   - 积分类（累计积分）
   - 签到类（每日签到）
   - 愿望类（兑换愿望）
   - 成就类（特殊成就）
   And 每个分类有图标和徽章数量

6. Given 点击分类标签
   When 切换分类时
   Then 只显示该分类的徽章
   - 已获得徽章在顶部
   - 未获得徽章在底部
   And 分类标签高亮显示

### Badge Detail Modal (AC7-AC10)

7. Given 我点击已获得徽章
   When 点击时
   Then 显示徽章详情弹窗：
   - 徽章大图（200x200pt，居中）
   - 徽章名称（超大字体）
   - 获得日期时间（完整格式）
   - 获得原因详细说明
   - 进度条（显示解锁条件完成度）
   - "分享"按钮
   - "查看相关记录"按钮（如任务记录）
   And 弹窗背景模糊（blur效果）

8. Given 查看未获得徽章详情
   When 点击未获得徽章时
   Then 显示：
   - 徽章大图（200x200pt，灰度）
   - 徽章名称
   - 获得条件详细说明
   - 当前进度（百分比）
   - "如何获得"提示
   And 不显示"分享"按钮

9. Given 徽章详情弹窗
   When 向下滚动
   Then 弹窗支持滚动查看完整内容
   And 顶部保持固定（徽章名称、图片）
   And 底部"关闭"按钮始终可见

10. Given 点击"分享"按钮
    When 分享时
    Then 显示分享选项：
    - 分享到微信
    - 分享到朋友圈
    - 保存图片
    - 复制文字
    And 使用Epic 5.11分享功能

### Badge Progress Tracking (AC11-AC14)

11. Given 查看未获得徽章
    When 显示进度条时
    Then 系统计算完成百分比：
    - 连续任务徽章：current / threshold * 100%
    - 累计积分徽章：currentPoints / targetPoints * 100%
    - 签到徽章：checkInDays / targetDays * 100%
    And 进度条颜色：0-25%灰色，26-50%蓝色，51-75%橙色，76-99%绿色，100%金色

12. Given 查看连续任务徽章进度
    When 显示时
    Then 进度条显示：
    - "连续X / Y天"
    - 当前进度百分比
    - 预计达成时间（可选）
    And 实时更新（基于最新streak）

13. Given 查看累计积分徽章进度
    When 显示时
    Then 进度条显示：
    - "已获得X / Y分"
    - 当前进度百分比
    And 实时更新（基于最新积分）

14. Given 查看签到徽章进度
    When 显示时
    Then 进度条显示：
    - "已签到X / Y天"
    - 当前进度百分比
    And 基于本月签到记录

### Badge Statistics (AC15-AC17)

15. Given 查看徽章统计
    When 页面显示时
    Then 系统显示统计面板：
    - 总徽章数量："共X个徽章"
    - 已获得数量："已获得Y个"
    - 获得率："获得率Z%"
    - 最近获得的徽章（最近3个）
    And 统计有动画效果

16. Given 查看最近获得的徽章
    When 显示时
    Then 显示最近3个徽章：
    - 徽章缩略图
    - 徽章名称
    - 获得时间（相对时间，如"3小时前"）
    And 点击跳转到详情

17. Given 查看获得率
    When 计算时
    Then 获得率 = (已获得徽章数量 / 总徽章数量) * 100%
    And 显示百分比
    - 0-20%：红色"继续努力！"
    - 21-50%：橙色"已经不错了！"
    - 51-80%：绿色"快达成了！"
    - 81-100%：金色"太棒了！"

### Empty State (AC18)

18. Given 还没有获得任何徽章
    When 查看成就墙时
    Then 显示空状态：
    - 插图（儿童角色 illustration）
    - "还没有获得徽章"
    - "完成任务、累积积分、每日签到，就能获得徽章啦！"
    - "开始你的第一个成就吧！"
    And "查看任务"按钮

### Performance and Optimization (AC19-AC20)

19. Given 徽章数量很多（100+）
    When 加载页面时
    Then 系统使用虚拟滚动
    - 只渲染可见区域的徽章
    - 滚动时动态加载
    And 保持流畅滚动体验（60fps）

20. Given 徽章图片加载
    When 加载图片时
    Then 系统显示占位符
    - 灰色背景色块
    - 加载动画（骨架屏）
    And 图片加载完成后淡入显示

## Tasks / Subtasks

- [ ] Task 1: Create badge database schema (AC: #1)
  - [ ] Create badges table (system definitions)
    - id (TEXT, PRIMARY KEY)
    - name (TEXT, NOT NULL)
    - icon_url (TEXT, NOT NULL)
    - description (TEXT)
    - category (TEXT, NOT NULL)
    - condition_type (TEXT, NOT NULL)
    - condition_value (INTEGER, NOT NULL)
    - created_at (INTEGER, NOT NULL)
  - [ ] Create user_badges table (earned badges)
    - id (TEXT, PRIMARY KEY)
    - user_id (TEXT, NOT NULL, REFERENCES users(id))
    - badge_id (TEXT, NOT NULL, REFERENCES badges(id))
    - earned_at (INTEGER, NOT NULL)
    - earned_reason (TEXT)
  - [ ] Add UNIQUE constraint on (user_id, badge_id)
  - [ ] Create migration file
  - [ ] Add indexes

- [ ] Task 2: Initialize default badges (AC: #5)
  - [ ] Task badges: [3, 7, 14, 30, 60, 90, 365] days
  - [ ] Points badges: [100, 500, 1000, 5000] points
  - [ ] Checkin badges: [7, 30, 90] days
  - [ ] Wish badges: [1, 5, 10, 20] wishes
  - [ ] Achievement badges: [first task, first wish, perfect month]

- [ ] Task 3: Create badge query functions (AC: #1-#6)
  - [ ] Get all badges with user status
  - [ ] Get badges by category
  - [ ] Get earned badges only
  - [ ] Get unearned badges only
  - [ ] Get badge progress

- [ ] Task 4: Create badge API (AC: #1-#6, #15-#17)
  - [ ] Create GET /api/badges
  - [ ] Return badges with earned status
  - [ ] Return statistics
  - [ ] Support category filter

- [ ] Task 5: Create BadgeCard component (AC: #3-#4)
  - [ ] Create components/features/badge/badge-card.tsx
  - [ ] Earned/unearned states
  - [ ] Progress bar display
  - [ ] Click to show detail

- [ ] Task 6: Create BadgeDetailModal (AC: #7-#10)
  - [ ] Create components/features/badge/badge-detail-modal.tsx
  - [ ] Badge info display
  - [ ] Progress display
  - [ ] Share button integration
  - [ ] View related records button

- [ ] Task 7: Create BadgeWallPage (AC: #1-#6, #15-#18)
  - [ ] Create app/(child)/badges/page.tsx
  - [ ] Display badge grid
  - [ ] Category tabs
  - [ ] Statistics display
  - [ ] Empty state
  - [ ] Virtual scrolling (if many badges)

- [ ] Task 8: Create BadgeProgress component (AC: #11-#14)
  - [ ] Create components/features/badge/badge-progress.tsx
  - [ ] Calculate progress percentage
  - [ ] Color coding
  - [ ] Real-time updates

- [ ] Task 9: Create BadgeStats component (AC: #15-#17)
  - [ ] Create components/features/badge/badge-stats.tsx
  - [ ] Display total badges
  - [ ] Display earned count
  - [ ] Display completion rate
  - [ ] Display recent earned badges

- [ ] Task 10: Create badge checker service (for Story 5.9)
  - [ ] Create lib/services/badge-checker.ts
  - [ ] checkAndAwardBadges(userId, actionType)
  - [ ] Integrate with task completion, points change, check-in

- [ ] Task 11: Write BDD tests (All ACs)
  - [ ] Test badge display
  - [ ] Test earned/unearned states
  - [ ] Test category filtering
  - [ ] Test detail modal
  - [ ] Test progress calculation
  - [ ] Test statistics display
  - [ ] Test empty state
  - [ ] Test virtual scrolling
  - [ ] Test performance

## Dev Notes

### Database Schema

**Table: `badges`**
```sql
CREATE TABLE badges (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK(category IN ('task', 'points', 'checkin', 'wish', 'achievement')),
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_badges_category ON badges(category);
```

**Table: `user_badges`**
```sql
CREATE TABLE user_badges (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  earned_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);
```

### API Response

```typescript
// GET /api/badges?category=task
interface BadgesResponse {
  badges: Badge[];
  statistics: BadgeStatistics;
}

interface Badge {
  id: string;
  name: string;
  iconUrl: string;
  description: string;
  category: 'task' | 'points' | 'checkin' | 'wish' | 'achievement';
  conditionType: 'consecutive_days' | 'total_points' | 'checkin_days' | 'wishes_redeemed' | 'achievement';
  conditionValue: number;
  earned: boolean;
  earnedAt?: string;
  earnedReason?: string;
  progress: number; // 0-100 percentage
}

interface BadgeStatistics {
  total: number;
  earned: number;
  completionRate: number;
  recentBadges: Badge[]; // last 3
}
```

### Default Badges

```typescript
const DEFAULT_BADGES = [
  // Task badges
  { id: 'task-3', name: '初出茅庐', description: '连续3天完成任务', category: 'task', conditionType: 'consecutive_days', conditionValue: 3 },
  { id: 'task-7', name: '持之以恒', description: '连续7天完成任务', category: 'task', conditionType: 'consecutive_days', conditionValue: 7 },
  { id: 'task-14', name: '双周达人', description: '连续14天完成任务', category: 'task', conditionType: 'consecutive_days', conditionValue: 14 },
  { id: 'task-30', name: '月度冠军', description: '连续30天完成任务', category: 'task', conditionType: 'consecutive_days', conditionValue: 30 },
  { id: 'task-60', name: '双月传奇', description: '连续60天完成任务', category: 'task', conditionType: 'consecutive_days', conditionValue: 60 },
  { id: 'task-90', name: '季度英雄', description: '连续90天完成任务', category: 'task', conditionType: 'consecutive_days', conditionValue: 90 },
  { id: 'task-365', name: '年度王者', description: '连续365天完成任务', category: 'task', conditionType: 'consecutive_days', conditionValue: 365 },
  
  // Points badges
  { id: 'points-100', name: '积分新星', description: '累计获得100积分', category: 'points', conditionType: 'total_points', conditionValue: 100 },
  { id: 'points-500', name: '积分高手', description: '累计获得500积分', category: 'points', conditionType: 'total_points', conditionValue: 500 },
  { id: 'points-1000', name: '积分大师', description: '累计获得1000积分', category: 'points', conditionType: 'total_points', conditionValue: 1000 },
  { id: 'points-5000', name: '积分传奇', description: '累计获得5000积分', category: 'points', conditionType: 'total_points', conditionValue: 5000 },
  
  // Check-in badges
  { id: 'checkin-7', name: '坚持一周', description: '累计签到7天', category: 'checkin', conditionType: 'checkin_days', conditionValue: 7 },
  { id: 'checkin-30', name: '满勤月度', description: '累计签到30天', category: 'checkin', conditionType: 'checkin_days', conditionValue: 30 },
  { id: 'checkin-90', name: '满勤季度', description: '累计签到90天', category: 'checkin', conditionType: 'checkin_days', conditionValue: 90 },
  
  // Wish badges
  { id: 'wish-1', name: '第一个愿望', description: '首次兑换愿望', category: 'wish', conditionType: 'wishes_redeemed', conditionValue: 1 },
  { id: 'wish-5', name: '愿望小能手', description: '兑换5个愿望', category: 'wish', conditionType: 'wishes_redeemed', conditionValue: 5 },
  { id: 'wish-10', name: '愿望达人', description: '兑换10个愿望', category: 'wish', conditionType: 'wishes_redeemed', conditionValue: 10 },
  { id: 'wish-20', name: '愿望专家', description: '兑换20个愿望', category: 'wish', conditionType: 'wishes_redeemed', conditionValue: 20 },
  
  // Achievement badges
  { id: 'achievement-first-task', name: '第一步', description: '完成第一个任务', category: 'achievement', conditionType: 'achievement', conditionValue: 1 },
  { id: 'achievement-first-wish', name: '第一次', description: '首次兑换愿望', category: 'achievement', conditionType: 'achievement', conditionValue: 2 },
  { id: 'achievement-perfect-month', name: '完美月度', description: '单月完成任务率100%', category: 'achievement', conditionType: 'achievement', conditionValue: 3 }
];
```

### Progress Calculation

```typescript
// lib/services/badge-progress.ts
function calculateBadgeProgress(badge: Badge, userData: UserData): number {
  switch (badge.conditionType) {
    case 'consecutive_days':
      // Get current streak for each task type
      return Math.min(100, (userData.streak / badge.conditionValue) * 100);
    
    case 'total_points':
      return Math.min(100, (userData.points / badge.conditionValue) * 100);
    
    case 'checkin_days':
      return Math.min(100, (userData.checkinDays / badge.conditionValue) * 100);
    
    case 'wishes_redeemed':
      return Math.min(100, (userData.wishesRedeemed / badge.conditionValue) * 100);
    
    case 'achievement':
      // Special logic for each achievement
      return calculateAchievementProgress(badge, userData);
    
    default:
      return 0;
  }
}
```

### Components Structure

```
components/features/badge/
├── badge-wall-page.tsx        # Main page
├── badge-grid.tsx             # Badge grid with virtual scroll
├── badge-card.tsx             # Single badge display
├── badge-detail-modal.tsx     # Detail popup
├── badge-progress.tsx         # Progress bar
├── badge-stats.tsx            # Statistics display
└── empty-state.tsx            # No badges state
```

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] Badge display correct
4. [ ] Progress calculation accurate
5. [ ] Detail modal works
6. [ ] Category filtering works
7. [ ] Statistics correct
8. [ ] Empty state displays
9. [ ] Virtual scrolling smooth (60fps)
10. [ ] Page load < 2s
11. [ ] Code review passed

## Dependencies

- Epic 5: Story 5.9 - Animation on earn
- Epic 5: Story 5.10 - Notification on earn
- Epic 5: Story 5.11 - Share from detail
- Epic 2: Task completion for progress
- Epic 3: Points system for progress
- Epic 5.7: Check-in for progress

## Dev Agent Record

### File List

**Files to Create:**
- database/migrations/XXX_create_badges.sql
- lib/db/queries/badges.ts
- lib/services/badge-progress.ts
- app/api/badges/route.ts
- app/(child)/badges/page.tsx
- components/features/badge/badge-grid.tsx
- components/features/badge/badge-card.tsx
- components/features/badge/badge-detail-modal.tsx
- components/features/badge/badge-progress.tsx
- components/features/badge/badge-stats.tsx
- components/features/badge/empty-state.tsx

**Files to Modify:**
- app/(child)/layout.tsx (add badges nav)
- lib/db/queries/index.ts (export badge queries)
