# Story 4.10: Redeemed Wish History

Status: ready-for-dev

## Story

As a 儿童,
I want 查看已兑换愿望的历史记录,
so that 我可以回顾自己曾经兑换过的愿望。

## Acceptance Criteria

1. Given 我已登录系统（PIN码或家长设备）并具有儿童角色
   When 我有已兑换的愿望（愿望状态为'redeemed'）
   Then 我可以访问"愿望历史"页面

2. Given 我进入"愿望历史"页面
   When 页面加载完成
   Then 系统显示已兑换愿望列表
   And 列表按兑换时间倒序排列（最新的在前）
   And 列表适合儿童查看（平板优化）

3. Given 愿望历史页面显示
   Then 每个已兑换愿望卡片包含：
     - 愿望名称（可点击查看详情）
     - 愿望图片（如果有，可点击放大）
     - 兑换时间（格式："2024年3月15日 15:30"）
     - 消耗积分数量（醒目显示，如"消耗 500分"）
     - 愿望类型图标（物品/体验）

4. Given 愿望历史卡片显示
   Then 系统显示额外的兑换详情：
     - 兑换时积分余额（如"兑换前：600分"）
     - 兑换后积分余额（如"兑换后：100分"）
     - 确认家长姓名（如"确认人：妈妈"）

5. Given 儿望历史页面
   Then 系统支持筛选功能
     - 筛选标签页：最近30天 / 最近90天 / 全部
     - 默认显示"全部"
     - 筛选结果实时更新列表

6. Given 儿童选择"最近30天"筛选
    Then 系统只显示30天内兑换的愿望
    And 系统显示筛选结果数量
    And 系统隐藏不符合条件的愿望

7. Given 儿童选择"最近90天"筛选
    Then 系统只显示90天内兑换的愿望
    And 系统显示筛选结果数量
    And 系统隐藏不符合条件的愿望

8. Given 儿童选择"全部"筛选
    Then 系统显示所有已兑换愿望
    And 系统按时间倒序排列

9. Given 儿童有大量已兑换愿望（>20个）
    When 显示列表
    Then 系统支持分页或无限滚动
    And 每页显示12-16个愿望（4x3或4x4网格）
    And 显示"加载更多"提示

10. Given 儿童点击某个已兑换愿望卡片
    Then 系统跳转到愿望详情页面
    And 页面显示愿望的完整信息：
     - 愿望名称和图片（大图展示）
     - 愿望描述
     - 兑换详情（时间、积分消耗、余额变化）
     - 兑换凭证（可选，如照片或备注）
     - 家长确认姓名
     - 返回到历史列表按钮

11. Given 儿望历史页面为空
    When 没有已兑换愿望
    Then 系统显示空状态提示
    And 提示内容："你还没有兑换过愿望哦！"
    And 显示引导插画或图标
    And 建议："去创建愿望并完成任务来获得积分吧"

12. Given 儿童在历史页面
    When 系统收到新的已兑换愿望（Story 4.7或4.8触发）
    Then 历史列表实时更新（2-3秒同步，NFR4）
    And 新愿望自动添加到列表顶部
    And 显示"新兑换！"动画提示

13. Given 儿童在家长设备上登录（共享设备）
    When 家长查看儿童的愿望历史
    Then 家长可以查看所有已兑换愿望
    And 显示格式相同
    And 家长可以看到完整的兑换详情

14. Given 愿童查看已兑换愿望
    Then 系统显示总消耗积分统计
    And 统计内容："累计消耗{总积分}分，兑换了{总数量}个愿望"
    And 统计显示在页面顶部或底部

15. Given 儿童查看已兑换愿望
    Then 系统显示按时间分组的历史记录
    And 分组格式：
     - "今天"（今天的兑换）
     - "本周"（本周的兑换）
     - "本月"（本月的兑换）
    - "更早"（更早的兑换）
    And 每个组可折叠/展开

16. Given 儿童点击某个愿望卡片
    Then 系统显示快捷操作菜单
    And 菜单包含：
     - "查看详情"
     - "再次兑换"（仅允许已通过的愿望重新兑换）
     - "标记为喜欢"
    - "分享给家长"（可选）

17. Given 儿童标记愿望为"喜欢"
    Then 系统记录喜欢状态
    And 愿望卡片显示"喜欢"图标高亮
    And 喜欢历史记录到favorites表
    And 喜欢计数显示

18. Given 儿童分享愿望给家长（可选功能）
    When 点击"分享给家长"
    Then 系统生成分享链接
    And 系统显示分享对话框
    And 家长可以查看愿望详情

19. Given 儿童再次兑换已兑换过的愿望
    When 愿望状态为'approved'（已通过）
    Then 系统允许再次兑换
    And 愿望状态更新为'redeemed'
    And 记录新的兑换记录
    And 系统显示"兑换成功"通知

20. Given 儿童在离线状态
    When 查看愿望历史
    Then 系统显示缓存的数据
    And 显示"离线模式：上次更新于X分钟前"提示
    And 支持基本操作（查看详情）

21. Given 愿童查看愿望历史
    Then 系统支持下拉刷新功能
    And 下拉刷新时重新获取最新数据
    And 显示刷新动画
    And 刷新完成后隐藏动画

22. Given 儿童点击"再次兑换"
    When 系统执行兑换操作（调用Story 4.7或4.8）
    Then 历史列表实时更新
    And 愿望卡片状态更新
    And 显示"兑换成功"提示
    And 愿望从当前列表移除（或标记为最新兑换）

23. Given 儿童查看已兑换愿望列表
    Then 系统显示搜索功能
    And 搜索框支持按愿望名称搜索
    And 搜索结果实时过滤列表
    And 显示"找到X个匹配结果"

24. Given 儿童点击某个已兑换愿望
    Then 系统显示愿望详情页
    And 详情页显示：
     - 愿望完整信息（来自Story 4.1）
     - 兑换信息（时间、积分消耗、余额变化）
     - 确认家长姓名
     - 家长备注（如有）
     - 操作按钮（标记喜欢、再次兑换、分享）

25. Given 儿童查看愿望历史
    Then 系统显示月度统计（可选）
    And 统计包括：
     - 本月兑换愿望数量
     - 本月消耗积分总数
     - 累计兑换愿望总数
     - 累计消耗积分总数
    And 使用图表或卡片展示

26. Given 儿童查看大量历史记录
    When 滚动列表
    Then 系统保持虚拟滚动位置
    And 新数据加载时自动追加
    And 不会丢失用户的滚动位置

27. Given 儿童查看愿望历史
    Then 系统记住用户的筛选偏好
    And 下次打开时自动应用上次筛选
    And 使用localStorage记住偏好设置

28. Given 愿童已登录并进入"愿望清单"页面（Story 4.6）
    Then 系统显示"查看历史"按钮
    And 按钮位置：页面标题旁边或底部导航栏
    And 点击跳转到愿望历史页面

29. Given 儿童点击"查看历史"按钮
    Then 系统跳转到愿望历史页面
    And 页面顶部显示导航：
     - 返回"愿望清单"按钮
     - 当前页面标题："愿望历史"
     - 总消耗积分统计

30. Given 愿童查看已兑换愿望
    Then 系统显示游戏化元素
    And 已兑换愿望显示"已实现"徽章（绿色徽章）
    And 集合多个相同愿望的"成就"

31. Given 儿童查看某个已兑换愿望的详情
    Then 系统支持"写感想"功能（可选）
    And 儿童可以记录兑换体验
    And 感想显示在历史记录中
    And 儿童后续可以查看感想

32. Given 儿童查看愿望历史
    Then 系统显示"重播回忆"按钮（可选）
    And 按钮播放兑换时的庆祝动画
    And 帮助儿童回忆实现愿望的快乐时刻

33. Given 愿童在家长设备上登录
    When 家长查看儿童的愿望历史
    Then 家长可以删除兑换记录
    And 删除前需要确认对话框
    And 删除后通知儿童："家长删除了兑换记录"
    And 儿望重新回到可兑换状态（如果未删除wishlists记录）

34. Given 儿童点击再次兑换
    When 系统执行兑换（通过Story 4.7）
    Then 系统验证当前积分是否足够
    And 如果积分不足，显示"积分不足"提示
    And 如果积分足够，执行兑换流程

35. Given 儿童再次兑换已兑换愿望
    Then 系统创建新的兑换记录
    And 愿望状态更新为'redeemed'
    And 系统生成新的兑换时间戳
    And 历史列表显示最新兑换记录

36. Given 系统显示总消耗积分统计
    Then 统计实时更新（当新兑换完成时）
    And 统计包括所有历史兑换记录
    And 统计不包括取消的兑换

37. Given 儿童查看愿望历史
    Then 系统支持导出历史数据（可选功能）
    And 导出格式支持：CSV
    And 导出内容包括：愿望名称、兑换时间、消耗积分、兑换详情
    And 导出按钮在设置页面或历史页面右上角

38. Given 系统处理大量历史记录
    When 历史记录超过100个
    Then 系统按时间分页加载
    And 每页50个记录（提高加载速度）
    And 分页导航显示：第X页 / 共Y页

39. Given 儿童查看已兑换愿望列表
    Then 系统显示视觉进度指示器
    And 进度指示器显示："已显示X/Y个，加载更多..."
    And 或使用无限滚动加载指示器

40. Given 儿童在历史页面
    Then 系统支持删除多个兑换记录（批量操作）
    And 通过长按或复选框选择
    And 批量删除需要家长确认（如果已设置）
    或儿童自己的删除（允许删除自己的兑换记录）

## Tasks / Subtasks

- [ ] Task 1: Create redeemed wish query functions (AC: #2-#4, #6, #15-#17)
  - [ ] Create getRedeemedWishes() - Get redeemed wishes for a child
  - [ ] Create getRedeemedWishesByDateRange() - Get wishes within date range (30 days, 90 days, all)
  - [ ] Create getRedeemedWishById() - Get single wish with full details
  - [ ] Create getTotalPointsSpent() - Calculate total points spent
  - [ ] Create getRedemptionCount() - Get count of redeemed wishes
  - [ ] Search redeemed wishes by name
  - [ ] Support pagination (offset, limit, total count)
  - [ ] Group by date for grouping

- [ ] Task 2: Create redeemed wish API endpoint (AC: #2-#4, #6, #12-#21)
  - [ ] Create GET /api/wishlists/redeemed
  - [ ] Verify user authentication (Better-Auth session)
  - [ ] Verify user role is 'child'
  - [ ] Support date filter query parameter (30d, 90d, all)
  - [ ] Support pagination (page, pageSize)
  - [ ] Support search query parameter
  - [ ] Return wishes with full redemption details
  - [ ] Return total points spent and count
  - [ ] Return grouped wishes (by date if requested)

- [ ] Task 3: Create wish history page (AC: #1-#5, #9, #14, #28-#29)
  - [ ] Create app/(child)/wishlist/history/page.tsx
  - [ ] Create page structure:
    - Header with navigation (return to wish list, title)
    - Filter tabs: 全部 / 最近30天 / 最近90天
    - Total points spent stats
    - Optional monthly stats section
    - Grouped redeemed wishes grid/list
    - Infinite scroll or pagination
    - Pull-to-refresh
    - Empty state
  - [ ] Display total points spent at top
  - [ ] Implement filter tab switching
  - [ ] Support infinite scroll with loading indicator
  - [ ] Empty state handling
  - [ ] Responsive design (child-end: tablet optimized)

- [ ] Task 4: Create redeemed wish card component (AC: #3-#4, #10, #16, #19)
  - [ ] Create lib/components/features/redeemed-wish-card.tsx
  - [ ] Display wish name (clickable to detail)
  - [ ] Display wish image (clickable to zoom)
  - [ ] Display redemption timestamp
  - [ ] Display points cost (consumed points)
  - [ ] Display points balance before and after
  - [ ] Display confirmed parent name
  - [ ] Display wish type icon
  - [ ] Add "喜欢" button (toggle favorite)
  - [ ] Show "已实现" badge (green)
  - [ ] Add context menu (view details, redeem again, share with parent, delete if allowed)
  - [ ] Touch-friendly large card design

- [ ] Task 5: Implement filtering logic (AC: #5-#8, #27)
  - [ ] Create filter state management
  - [ ] Implement date filtering logic:
    - 30 days: date >= today - 30 days
    - 90 days: date >= today - 90 days
    - All: all time
  - [ ] Update wish list on filter change
  - [ ] Display filter count
  - [ ] Save preference to localStorage
  - [ ] Load preference on page load

- [ ] Task 6: Implement search functionality (AC: #23)
  - [ ] Add search input component
  - [ ] Real-time filtering as user types
  - [ ] Debounce search (300ms delay)
  - [ ] Display match count
  - [ ] Filter results immediately

- [ ] Task 7: Implement redemption details page (AC: #10, #24, #31)
  - [ ] Create app/(child)/wishlist/history/[id]/page.tsx
  - [ ] Display wish full information (reuse from Story 4.1 details)
  - [ ] Display redemption information:
    - Redemption time
    - Points cost
    - Balance before and after
    - Confirmed by (parent name)
    - Parent notes (if any)
  - [ ] Add action buttons:
    - "标记为喜欢" button
    - "写感想" button (expandable)
    - "再次兑换" button (if wish is 'approved')
    - "分享给家长" button
    - "返回历史列表" button
  - [ ] Add celebration replay button (optional)
  - [ ] Responsive design

- [ ] Task 8: Implement favorites system (AC: #17, #19)
  - [ ] Create favorites table:
    ```sql
    CREATE TABLE favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      wish_id TEXT NOT NULL REFERENCES wishlists(id),
      family_id TEXT NOT NULL REFERENCES families(id),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE INDEX idx_favorites_user ON favorites(user_id);
    CREATE INDEX idx_favorites_wish ON favorites(wish_id);
    ```
  - [ ] Create lib/db/queries/favorites.ts
  - [ ] Create toggleFavorite() - Toggle favorite status
  - [ ] Create getUserFavorites() - Get user's favorite wishes
  - [ ] Check if wish is favorite
  - [ ] Generate Drizzle migration
  - [ ] Apply migration to database

- [ [ ] Task 9: Implement real-time updates (AC: #12, #22, #35)
  - [ ] Use polling or Zustand store for real-time updates
  - [ ] Poll every 2-3 seconds for new redemptions
  - [ ] Update wish list when status changes
  - [ ] Update when new redemption added
  - [ ] Show "新兑换！" toast notification
  - [ ] Update without page refresh

- [ ] Task 10: Implement group by date (AC: #15)
  - [ ] Create lib/components/features/date-group-section.tsx
  - [ ] Group wishes by redemption date:
    - "今天" (today)
    - "本周" (this week)
    - "本月" (this month)
    - "更早" (earlier)
  - [ ] Display collapsible section headers
    - [ ] Calculate date boundaries dynamically
  - [ ] Remember collapsed state

- [ ] Task 11: Implement share with parent (AC: #18)
  - [ ] Create share dialog component
  - [ ] Generate share link (e.g., `/child/wishlist/history/${wishId}`)
  - [ ] Display sharing options:
    - Copy link
    - Share to WeChat (optional, QR code)
    - Share via system notification
  - [ ] Show parent preview in dialog

- [ ] Task 12: Implement "redeem again" feature (AC: #19, #34, #35)
  - [ ] Check if wish status is 'approved' (redeemable)
  - [ ] If yes: trigger redemption flow (Story 4.7 or 4.8)
  - [ ] If no: show "愿望已兑换，无法再次兑换" error
  - [ ] Display confirmation dialog before redeeming
  - [ ] Create new redemption record
  - [ ] Update wish status to 'redeemed'
  - [ ] Send notification to child

- [ ] Task 13: Implement "replay celebration" (AC: #32)
  - [ ] Add celebration animation button
  - [ ] Create celebration animation (confetti effect)
  - [ ] Show redemption moment recap (wish name, image)
  - [ ] Display child's initial reaction (if recorded)
  - [ ] Support re-play on demand

- [ ] Task 14: Implement export functionality (AC: #37)
  - [ ] Create export buttons component
  - [ ] Export to CSV format
  - [ ] Include: wish name, redemption date, points cost, redemption details
  - [ ] Generate CSV download
  - [ ] Add to history page header or settings

- [ Task 15: Implement pagination/infinite scroll (AC: #9, #38, #39)
  - [ ] Use intersection observer for infinite scroll
  - [ ] Load more wishes on scroll to bottom
  - [ ] Display loading skeleton or spinner
  - [ ] Handle all wishes loaded state
  - [ ] Show page navigation if pagination used
  - [ ] Display "第X页 / 共Y页" if paginated

- [ ] Task 16: Implement batch delete (AC: #40)
  - [ ] Add selection mechanism (long press or checkboxes)
  - [ ] Create batch delete dialog
  - [ ] Require parent confirmation if configured
  - [ ] Delete redemption_requests records
  - [ ] Update wish status back to 'approved' (if wishlists record not deleted)
  - [ ] Or delete wishlists record entirely (if configured)
  - [ ] Send notification to child: "家长删除了兑换记录"
  - [ ] Remove from history list

- [ ] Task 17: Implement offline support (AC: #20)
  - [ ] Cache redeemed wishes in IndexedDB
  - [ ] Display cached data when offline
  - [ ] Show "离线模式：上次更新于X分钟前" timestamp
  - [ ] Update immediately when network recovers
  - [ ] Background sync when back online

- [ ] Task 18: Write BDD tests (AC: #1-#40)
  - [ ] **Given** 儿童有已兑换愿望 **When** 进入历史页 **Then** 显示列表并按时间排序
  - [ ] **Given** 选择30天筛选 **When** 筛选更新 **Then** 只显示30天内的愿望
  - [ ] **Given** 选择90天筛选 **When** 筛选更新 **Then** 只显示90天内的愿望
  - [ ] **Given** 搜索愿望名称 **When** 输入关键字 **Then** 实时过滤列表
  - [ ] **Given** 点击愿望卡片 **When** 跳转详情 **Then** 显示完整兑换信息
  - [ ] **Given** 标记为喜欢 **When** 操作完成 **Then** 显示"喜欢"图标高亮
  - [ ] **Given** 再次兑换愿望 **When** 积分足够 **Then** 创建新兑换记录
  - [ ] **Given** 批量删除 **When** 选择记录 **Then** 删除并通知儿童
  - [ ] **Given** 新愿望兑换完成 **When** 历史**打开 **Then** 实时更新
  - [ ] **Given** 下拉刷新 **When** 释放 **Then** 刷新数据并显示动画
  - [ ] **Given** 愿量记录 **When** 分页加载 **Then** 显示加载指示器
  - [ ] **Given** 导出历史 **When** 点击按钮 **Then** 生成CSV下载
  - [ ] **Given** 重播庆祝 **When** 点击按钮 **Then** 播放动画
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 19: Performance and compliance verification (AC: #22, #38)
  - [ ] Verify API response time < 500ms (NFR3: P95)
  - [ ] Verify real-time update < 2s (NFR4)
  - [ ] Verify page load time < 3 seconds (NFR2)
  - [ ] Verify child data privacy (only child can see their history)
  - [ ] Verify search performance (<300ms filtering)
  - [ ] Verify pagination performance

## Dev Notes

### Project Structure Notes

**Alignment with unified project structure:**
- Schema: `database/schema/favorites.ts` (new)
- Queries: `lib/db/queries/wishlists.ts` (extend with redeemed history queries)
- API: `app/api/wishlists/redeemed/route.ts` (new)
- Page: `app/(child)/wishlist/history/page.tsx` (new)
- Detail Page: `app/(child)/wishlist/history/[id]/page.tsx` (new)
- Component: `lib/components/features/redeemed-wish-card.tsx` (new)
- Component: `lib/components/features/date-group-section.tsx` (new)
- Dialog: `lib/components/dialogs/share-dialog.tsx` (new, optional)
- Types: `types/wishlist.ts` (extend from Story 4.1)
- Favorites: `lib/db/queries/favorites.ts` (new)

**Detected conflicts/variances:**
- None identified at story creation time

### Previous Story Intelligence

**From Story 4.1 (Child Creates Wish):**
- wishlists table exists with status field
- Wish data structure (name, image, description, type)
- **Can reuse:** Wish data for history display

**From Story 4.7 (Child Initiates Wish Redemption):**
- redemption_requests table created with full lifecycle tracking
- Points deduction and transaction recording exists
- **Can reuse:** redemption data for history display

**From Story 4.8 (Parent Confirms/Rejects Wish Redemption):**
- Redemption confirmation workflow exists
- Status tracking (confirmed, rejected)
- **Can reuse:** Confirmation data for history

**From Story 4.9 (Points Deducted on Redemption):**
- Points deduction service exists
- Transaction history recording exists
- **Can reuse:** Transaction data for history display

**From Story 4.5 (Smart Wish Estimation):**
- 7-day average points calculation exists
- **Can reuse:** Integration with history (points acquisition trend)

### Database Schema Design

**favorites Table (new):**
```typescript
// database/schema/favorites.ts
export const favorites = pgTable('favorites', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  wishId: text('wish_id').notNull().references(() => wishlists.id),
  familyId: text('family_id').notNull().references(() => families.id),
  createdAt: integer('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Indexes for performance
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_wish ON favorites(wish_id);
```

**wishlists Table Extensions:**
```typescript
// Already exists from Story 4.1
// Fields that help with history:
// - status ('pending_review', 'approved', 'rejected', 'redeemed')
// - createdAt, updatedAt
// - pointsThreshold
// - type, title, description, imageUrl
```

**redemption_requests Table (reuse from Story 4.7):**
```typescript
// Already exists
// Fields that help with history:
// - pointsCost, pointsBefore, pointsAfter
// - status ('pending_confirmation', 'confirmed', 'rejected', 'cancelled', 'invalidated')
// - confirmedBy, confirmedAt, rejectedAt, rejectionReason
// - wishId, childId, familyId
```

**Query Integration:**
```typescript
// lib/db/queries/wishlists.ts (extend)
import { db } from '@/lib/db';
import { wishlists, redemptionRequests, pointsHistory } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

// Get redeemed wishes with date filter
export async function getRedeemedWishes(
  childId: string,
  dateRange: '30d' | '90d' | 'all' = 'all',
  offset: number = 0,
  limit: number = 50
): Promise<{
  wishes: RedeemedWishWithDetails[];
  total: number;
  pointsSpent: number;
}> {
  let dateFilter: Date | undefined;
  
  const now = new Date();
  if (dateRange === '30d') {
    date = new Date(now.getTime() - 30 * 24 * 60 * 1000);
  } else if (dateRange === '90d') {
    date = new Date(now.getTime() - 90 * 24 * 60 * 1000);
  }
  
  const wishes = await db.query.wishlists.findMany({
    where: and(
      eq(wishlists.childId, childId),
      eq(wishlists.status, 'redeemed')
      dateFilter ? sql`${wishlists.createdAt} >= ${date.getTime()}` : undefined
    ),
    orderBy: desc(wishlists.createdAt)
    limit,
    offset
  });
  
  // Get total count
  const totalResult = await db.select({ count: sql<number>`count(*)` })
    .from(wishlists)
    .where(and(
      eq(wishlists.childId, childId),
      eq(wishlists.status, 'redeemed'),
      dateFilter ? sql`${wishlists.createdAt} >= ${date.getTime()}` : undefined
    ));
  
  // Calculate total points spent
  const pointsResult = await db.select({
    total: sql<number>`sum(${redemptionRequests.pointsCost})`
  }).from(redemptionRequests)
    .where(and(
      eq(redemptionRequests.childId, childId),
      eq(redemptionRequests.status, 'confirmed')
    ));
  
  const total = totalResult[0]?.total || 0;
  const pointsSpent = pointsResult[0]?.total || 0;
  
  return { wishes, total, pointsSpent };
}

// Get single redeemed wish with full details
export async function getRedeemedWishById(
  wishId: string
): Promise<RedeemedWishDetails | null> {
  const wish = await db.query.wishlists.findFirst({
    where: eq(wishlists.id, wishId),
    with: {
      redemptionRequest: {
        columns: {
          pointsCost: true,
          pointsBefore: true,
          pointsAfter: true,
          confirmedBy: true,
          confirmedAt: true
        }
      }
    }
  });
  
  return wish || null;
}
```

### Redeemed Wish Card Component Design

**Component Structure:**
```typescript
// lib/components/features/redeemed-wish-card.tsx
export function RedeemedWishCard({
  wish,
  redemptionDetails,
  isFavorite,
  onFavoriteToggle,
  onViewDetail,
  onRedeem,
  onShare,
  isCompact = false
}: RedeemedWishCardProps) {
  return (
    <Card
      className={`redeemed-wish-card ${isCompact ? 'compact' : ''}`}
      onClick={onViewDetail}
    >
      {/* Wish Image/Icon */}
      <div className="wish-image">
        {wish.imageUrl ? (
          <img src={wish.imageUrl} alt={wish.title} />
        ) : (
          <DefaultIcon type={wish.type} />
        )}
      </div>
      
      {/* Status Badge */}
      <Badge className="badge-redeemed">已实现</Badge>
      
      {/* Wish Name */}
      <h3>{wish.title}</h3>
      
      {/* Wish Type Icon */}
      <div className="wish-type">
        <TypeIcon type={wish.type} />
        <span>{wish.type === 'item' ? '物品' : '体验'}</span>
      </div>
      
      {/* Redemption Information */}
      <div className="redemption-info">
        <div className="redemption-time">
          <Clock />
          <span>{formatRedemptionDate(wish.createdAt)}</span>
        </div>
        
        <div className="points-cost">
          <span className="label">消耗</span>
          <span className="value">{redemptionDetails.pointsCost}分</span>
        </div>
        
        <div className="balance-change">
          <div className="before-balance">
            <span className="label">兑换前</span>
            <span className="value">{redemptionDetails.pointsBefore}分</span>
          </div>
          <div className="after-balance">
            <span className="label">兑换后</span>
            <span className="value">{redemptionDetails.pointsAfter}分</span>
          </div>
        </div>
        
        <div className="confirmed-by">
          <UserIcon />
          <span>确认人：{redemptionDetails.confirmedByParentName}</span>
        </div>
      </div>
      
      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="icon"
        className={`favorite-btn ${isFavorite ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle();
        }}
      >
        <Heart className={isFavorite ? 'filled' : 'outline'} />
      </Button>
      
      {/* Context Menu */}
      <ContextMenu>
        <MenuItem onClick={onViewDetail}>查看详情</MenuItem>
        {wish.status === 'approved' && (
          <MenuItem onClick={onRedeem}>再次兑换</MenuItem>
        )}
        <MenuItem onClick={onShare}>分享给家长</MenuItem>
        {canDelete && (
          <MenuItem onClick={onDelete}>删除记录</MenuItem>
        )}
      </ContextMenu>
    </Card>
  );
}
```

### History Page Structure

**Page Layout:**
```typescript
// app/(child)/wishlist/history/page.tsx
export default function WishlistHistoryPage() {
  const [filter, setFilter] = useState<'all' | '30d' | '90d'>('all');
  const [wishes, setWishes] = useState<GroupedWishes>({});
  const [totalPointsSpent, setTotalPointsSpent] = useState(0);
  const [redeemCount, setRedeemCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch redeemed wishes
  useEffect(() => {
    fetchRedeemedWishes();
    // Poll every 2-3 seconds for new redemptions
    const interval = setInterval(fetchRedeemedWishes, 2500);
    return () => clearInterval(interval);
  }, [filter, searchQuery]);
  
  return (
    <div className="wishlist-history-page">
      {/* Header */}
      <header className="history-header">
        <h1>愿望历史</h1>
        <nav className="history-nav">
          <Button variant="outline" onClick={() => navigate('/child/wishlist')}>
            返回愿望清单
          </Button>
        </nav>
        
        {/* Total Points Stats */}
        <StatsCard
          totalPointsSpent={totalPointsSpent}
          redeemCount={redeemCount}
        />
      </header>
      
      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="30d">最近30天</TabsTrigger>
          <TabsTrigger value="90d">最近90天</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Search Input */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="搜索愿望名称..."
      />
      
      {/* Export Button */}
      <div className="history-actions">
        <Button variant="outline" onClick={exportHistory}>
          导出历史
        </Button>
      </div>
      
      {/* Grouped Wishes */}
      <div className="grouped-wishes">
        {Object.entries(wishes).map(([dateGroup, wishesInGroup]) => (
          <section key={dateGroup}>
            <DateGroupHeader
              date={dateGroup}
              count={wishesInGroup.length}
              collapsible
              onToggle={() => toggleGroup(dateGroup)}
            />
            
            {wishesInGroup.map(wish => (
              <RedeemedWishCard
                key={wish.id}
                wish={wish}
                redemptionDetails={wish.redemptionDetails}
                isFavorite={wish.isFavorite}
                onFavoriteToggle={() => toggleFavorite(wish.id)}
                onViewDetail={() => navigate(`/child/wishlist/history/${wish.id}`)}
              />
            ))}
          </section>
        ))}
      </div>
      
      {/* Empty State */}
      {total === 0 && (
        <EmptyState
          message="你还没有兑换过愿望哦！"
          action="去创建愿望并完成任务来获得积分吧"
          onAction={() => navigate('/child/wishlist/create')}
        />
      )}
      
      {/* Pull-to-Refresh */}
      <PullToRefresh onRefresh={fetchRedeemedWishes} />
    </div>
  );
}
```

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. Child enters history page → shows list sorted by time
2. Child selects 30-day filter → shows only recent wishes
3. Child selects 90-day filter → shows 1.5 month of wishes
4. Child selects all filter → shows all wishes
5. Child searches wish name → filters list in real-time
6. Child clicks wish card → navigates to detail page
7. Child toggles favorite → shows heart icon highlighted
8. Child redeems wish → creates new redemption record
9. Child shares with parent → share dialog opens
10. Child exports history → CSV download starts
11. Child clicks date group → collapses/expands
12. Child views batch delete → confirmation dialog shows
13. New redemption appears → history list updates
14. Pull-to-refresh → data refreshes with animation
15. Offline state → cached data displayed
16. Child views redemption details → all info displayed
17. Child clicks "redeem again" → creates new redemption if points enough
18. Child replays celebration → animation plays
19. Infinite scroll → loads more wishes smoothly
20. Pagination → page navigation works
21. Total points spent displayed → accurate calculation
22. Search functionality → filters correctly
23. Date grouping → correct date boundaries
24. Favorites toggle → updates database

**Integration Tests:**
- Redeemed wishes query with date filters
- Total points calculation accuracy
- Search filtering performance
- Favorite toggle functionality
- Batch delete operations
- Date grouping logic
- Real-time update mechanism

**E2E Tests (Playwright):**
- Complete history viewing flow
- Filter switching (30d/90d/all)
- Search functionality
- Wish card interactions (view, favorite, share)
- Batch delete flow
- Redemption detail view
- Export functionality
- Real-time updates verification
- Pull-to-refresh
- Infinite scroll
- Offline state handling

### Performance Requirements

- Redeemed wishes API: < 500ms (NFR3: P95) - AC #38
- Search filtering: < 300ms - AC #38
- Real-time update: < 2s (NFR4) - AC #22
- Page load: < 3 seconds (NFR2) - AC #38
- Infinite scroll: < 100ms load more
- Export generation: < 1s for 100 records

### UX Requirements

**Child-End Design (from UX decisions):**
- Tablet-optimized layout (landscape, ≥768px)
- Large, touch-friendly cards
- Gamified elements: "已实现" badge, celebration animations
- Quick navigation
- Search and filter for easy access

**History Page Design:**
- Header with navigation and stats
- Filter tabs (全部 / 最近30天 / 最近90天)
- Search bar at top
- Grouped by date (collapsible)
- Infinite scroll for smooth browsing

**Redeemed Card Design:**
- Wish image and name prominent
- Redemption information clearly labeled
- Favorite toggle (heart icon)
- Context menu for actions
- "已实现" green badge

**Detail View Design:**
- Full wish information
- Redemption details with before/after balance
- Favorite toggle
- "写感想" button (expandable)
- "重播庆祝" button
- Action buttons (redeem again, share)
- "返回" button

**Error Handling:**
- Clear error messages
- Shadcn Toast notifications
- No `alert()` dialogs
- Confirmation dialogs for destructive actions

### Compliance Requirements

**COPPA/GDPR Compliance:**
- Child data privacy (only child can see their history)
- Audit trail for all redemption operations (from Story 4.9)
- Data retention: 3 years (NFR18)
- Clear, age-appropriate UI
- Parental control over deletion

### Open Questions / Decisions Needed

1. **Favorite System Scope:**
   - Option A: For redeemed wishes only
   - Option B: For all wishes (including pending/approved)
   - Option C: For all stories
   - **Decision:** Redeemed wishes only (per story context, can expand later)

2. **Batch Delete Permission:**
   - Option A: Child can delete their own records
   - Option B: Parent approval required
   - Option C: Both, with configuration
   - **Decision:** Child can delete their own records (child autonomy, per AC #40)

3. **Export Functionality:**
   - Option A: CSV only
   - Option B: CSV + PDF
   - Option C: CSV + JSON
   - **Decision:** CSV only (MVP, per AC #37, can expand later)

4. **Date Grouping Algorithm:**
   - Option A: Today, This Week, This Month, Earlier
   - Option B: Week number, Month number, Year number
   - Option C: Flexible grouping
   - **Decision:** Today/This Week/This Month/Earlier (clear, per AC #15)

5. **Replay Celebration Trigger:**
   - Option A: Always show button
   - Option B: Show for 7 days after redemption
   - Option C: Show on special occasions
   - **Decision:** Always show button (per AC #32, child choice)

6. **Share With Parent Implementation:**
   - Option A: System notification
   - Option B: Direct link sharing
   - Option C: Email integration
   - **Decision:** System notification + Direct link (MVP, per AC #18)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<500ms API, <300ms search, <2s update)
5. [ ] Security requirements met (auth, child privacy, permissions)
6. [ ] Favorites system working
7. [ ] Batch operations working
8. [ ] Date grouping correct
9. [ ] Export functionality working
10. [ ] Real-time updates working smoothly
11. [ ] Celebration replay implemented
12. [ ] Code review passed
13. [ ] Sprint status updated to ready-for-dev

### Tasks Blocked By

**Prerequisites:**
- Story 4.1: Child Creates Wish - Complete ✅
- Story 4.7: Child Initiates Wish Redemption - Complete ✅
- Story 4.8: Parent Confirms/Rejects Wish Redemption - Complete ✅
- Story 4.9: Points Deducted on Redemption - Complete ✅
- wishlists table exists with status field - Complete ✅
- redemption_requests table exists - Complete ✅
- Points system exists - Complete ✅
- Notification infrastructure exists - Complete ✅
- Wish card component structure exists - Complete ✅

**None identified at story creation time.**

## Dev Agent Record

### Agent Model Used

GLM-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None at story creation time.

### Completion Notes List

Story created with comprehensive implementation guidance including:
- Complete redeemed wish history query functions with date filtering
- API endpoint with search and pagination support
- History page with grouped display (by date)
- Redeemed wish card with redemption details
- Favorites system with database schema and queries
- Real-time updates for new redemptions
- Share with parent functionality
- "Redeem again" feature with validation
- Celebration replay with animation
- Date grouping (today, this week, this month, earlier)
- Batch delete with parent confirmation option
- Export to CSV functionality
- Infinite scroll and pagination support
- Search functionality with real-time filtering
- BDD test scenarios covering all acceptance criteria
- Performance targets for API, search, and updates
- Child-friendly UX design with gamified elements
- Integration with previous stories (4.1, 4.7, 4.8, 4.9)
- Child data privacy and COPPA/GDPR compliance

### File List

**Files to Create:**
- database/schema/favorites.ts
- lib/db/queries/favorites.ts
- app/api/wishlists/redeemed/route.ts
- app/(child)/wishlist/history/page.tsx
- lib/components/features/redeemed-wish-card.tsx
- lib/components/features/date-group-section.tsx
- lib/components/dialogs/share-dialog.tsx
- lib/components/dialogs/batch-delete-dialog.tsx
- lib/components/ui/search-input.tsx (new, optional or reuse)

**Files to Modify:**
- lib/db/queries/wishlists.ts (add redeemed history queries)
- types/wishlist.ts (add redeemed types)
- app/(child)/wishlist/history/[id]/page.tsx (extend from Story 4.1 or 4.7)

**Test Files:**
- tests/integration/redeemed-history.spec.ts
- tests/e2e/wishlist-history.spec.ts
- tests/fixtures/redeemed-history.ts
