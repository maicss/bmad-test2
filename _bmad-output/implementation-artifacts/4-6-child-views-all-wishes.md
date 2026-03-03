# Story 4.6: Child Views All Wishes

Status: ready-for-dev

## Story

As a 儿童,
I want 查看所有愿望及进度,
so that 我可以管理自己的愿望清单。

## Acceptance Criteria

1. Given 我已登录系统（PIN码或家长设备）并具有儿童角色
   When 我进入"愿望清单"页面
   Then 系统显示我的所有愿望
   And 愿望按创建时间倒序排列

2. Given 愿望清单页面显示
   Then 系统显示愿望卡片网格布局
   And 网格适合触摸操作（儿童友好的大卡片）
   And 网格响应式适配平板屏幕（≥768px landscape）
   And 卡片间距适中，便于操作

3. Given 愿望卡片显示
   Then 每个愿望卡片包含：
     - 愿望图片或默认图标
     - 愿望名称
     - 愿望类型图标（物品/体验）
     - 进度条（来自Story 4.4）
     - 当前积分 / 目标积分
     - 愿望状态（可兑换/进行中/已拒绝）
     - 简略估算："还需X天"（来自Story 4.5，可选）

4. Given 愿望按状态分组
   Then 系统支持分组显示：
     - 可兑换（积分≥门槛，status='approved'）
     - 进行中（积分<门槛，status='approved'）
     - 已拒绝（status='rejected'）
     - 等待审核（status='pending_review'）
   And 每个分组有明确的标签或标题

5. Given 愿望清单页面
   Then 系统显示筛选功能
   And 支持筛选选项：
     - 全部（显示所有愿望）
     - 可兑换（只显示积分足够的愿望）
     - 进行中（只显示积分不足但已通过的愿望）
   And 筛选按钮突出显示
   And 默认显示"全部"

6. Given 点击某个愿望卡片
   When 我点击愿望卡片
   Then 系统跳转到愿望详情页面
   And 页面显示愿望完整信息
   And 页面支持返回到列表

7. Given 愿望状态为"可兑换"
   When 显示愿望卡片
   Then 卡片显示"可兑换"金色徽章
   And 显示"兑换"按钮
   And 卡片边框或背景有金色高亮
   And 进度条显示为金色（来自Story 4.4）

8. Given 愿望状态为"进行中"
   When 显示愿望卡片
   Then 卡片显示进度条（彩色，来自Story 4.4）
   And 显示"还差X分"提示
   And 不显示"兑换"按钮
   And 卡片无金色高亮

9. Given 愿望状态为"已拒绝"
   When 显示愿望卡片
   Then 卡片显示"已拒绝"灰色徽章
   And 显示拒绝原因简略版（如"愿望不合适"）
   And 进度条显示为灰色（来自Story 4.4）
   And 愿望卡片半透明或灰度处理
   And 支持"重新提交"按钮（创建新愿望）

10. Given 愿望状态为"等待审核"
    When 显示愿望卡片
    Then 卡片显示"等待审核"蓝色徽章
    And 使用儿童设置的期望积分显示进度
    And 进度条显示为灰色（来自Story 4.4）
    And 不显示"兑换"按钮

11. Given 愿望列表页面
    When 有可兑换愿望
    Then 系统显示"可兑换"数量徽章
    And 徽章位置：页面标题旁边
    And 徽章点击可快速筛选只显示可兑换愿望
    And 徽章使用金色或醒目颜色

12. Given 愿望数量较多（>10个）
    When 显示愿望列表
    Then 系统支持分页或无限滚动
    And 每页显示12-16个愿望（4x3或4x4网格）
    And 显示"加载更多"提示

13. Given 愿望列表页面
    Then 系统显示"添加愿望"按钮
    And 按钮位置：页面右上角或底部导航栏
    And 按钮突出显示（使用主色调）
    And 点击跳转到愿望创建页面（来自Story 4.1）

14. Given 儿童查看愿望列表
    When 家长修改愿望积分门槛（Story 4.3）
    Then 愿望卡片实时更新（2-3秒同步，NFR4）
    And 进度条立即反映新值
    And 愿望状态可能变化（可兑换 ↔ 进行中）

15. Given 儿童查看愿望列表
    When 家长审核愿望（通过或拒绝，来自Story 4.2）
    Then 愿望卡片实时更新（2-3秒同步，NFR4）
    And 愿望状态立即反映审核结果
    And 通知儿童审核结果（来自Story 4.2）

16. Given 儿童查看愿望列表
    When 儿童获得积分（完成任务、家长加减分）
    Then 愿望卡片实时更新（2-3秒同步，NFR4）
    And 进度条立即反映新积分
    And 可能显示"可兑换"徽章

17. Given 愿望列表为空
    When 没有愿望
    Then 系统显示空状态提示
    And 提示内容："你还没有创建愿望哦！"
    And 显示"添加第一个愿望"按钮
    And 显示引导插画或图标

18. Given 有已拒绝的愿望
    When 显示愿望列表
    Then 系统支持隐藏已拒绝愿望
    And 显示"隐藏已拒绝愿望"开关
    And 开关状态记住用户偏好（localStorage）

19. Given 儿童查看愿望列表
    Then 愿望列表按分组显示
    And 分组顺序：
     1. 可兑换（最优先）
     2. 进行中
     3. 已拒绝（可选显示）
     4. 等待审核
   And 每个分组内有创建时间排序

20. Given 愿望卡片长按或右键点击
    When 显示上下文菜单
    Then 菜单包含：
     - "查看详情"
     - "编辑愿望"（仅等待审核状态）
     - "删除愿望"（仅等待审核或已拒绝状态）
    And 不提供"编辑"或"删除"已通过状态的愿望

21. Given 愿望数量无限制
    When 儿童创建愿望
    Then 系统允许创建任意数量愿望
    And 除非家长设置了愿望上限（FR60：家长可配置）
    And 如果达到上限，显示"已达上限（{N}个），请联系家长"提示

22. Given 儿童在离线状态
    When 查看愿望列表
    Then 系统显示缓存的数据
    And 显示"离线模式：上次更新于X分钟前"提示
    And 支持基本操作（查看详情）

23. Given 儿童在家长设备上登录（共享设备）
    When 家长查看儿童的愿望列表
    Then 家长可以看到儿童的愿望
    And 显示格式相同
    And 家长可以点击进入详情进行审核或调整

24. Given 愿望列表页面
    Then 系统显示下拉刷新功能
    And 下拉刷新时重新获取最新数据
    And 显示刷新动画
    And 刷新完成后隐藏动画

## Tasks / Subtasks

- [ ] Task 1: Create wish list query functions (AC: #1, #4, #6)
  - [ ] Extend lib/db/queries/wishlists.ts (from Stories 4.1-4.3)
  - [ ] Create getWishesByChild() - Get all wishes for a child
  - [ ] Create getWishesByStatus() - Filter wishes by status
  - [ ] Create getRedeemableWishes() - Get wishes with enough points
  - [ ] Create getWishesCountByStatus() - Get count per status for badges
  - [ ] Support pagination (offset, limit)

- [ ] Task 2: Create wish list API endpoint (AC: #1-#6, #13-#14, #24)
  - [ ] Create GET /api/wishlists
  - [ ] Verify user authentication (Better-Auth session)
  - [ ] Verify user role is 'child'
  - [ ] Query wishes by child_id
  - [ ] Support status filter query parameter
  - [ ] Support pagination (page, pageSize)
  - [ ] Return wishes with progress data (integrate Story 4.4)
  - [ ] Return estimation data (integrate Story 4.5, optional)
  - [ ] Return grouped wishes (by status)
  - [ ] Return counts per status

- [ ] Task 3: Create wish list UI page (AC: #1-#10, #12-#13, #19, #24)
  - [ ] Create app/(child)/wishlist/page.tsx
  - [ ] Create wish list page structure:
     - Header with title and "添加愿望" button
     - Redeemable count badge
     - Filter tabs: 全部 / 可兑换 / 进行中
     - Grouped wish cards grid
     - Infinite scroll or pagination
     - Pull-to-refresh
  - [ ] Display grouped wishes (by status)
  - [ ] Support filter tab switching
  - [ ] Support pull-to-refresh
  - [ ] Empty state handling
  - [ ] Responsive design (child-end: tablet optimized)

- [ ] Task 4: Create wish card component (AC: #3, #7-#10, #20)
  - [ ] Create lib/components/features/wish-card.tsx
  - [ ] Display wish image/icon
  - [ ] Display wish name
  - [ ] Display wish type icon
  - [ ] Integrate WishProgress component (from Story 4.4)
  - [ ] Integrate WishEstimation component (from Story 4.5, optional compact mode)
  - [ ] Display status badges (可兑换/进行中/已拒绝/等待审核)
  - [ ] Add "兑换" button for redeemable wishes
  - [ ] Add context menu (long press/right click)
  - [ ] Support edit/delete for pending/rejected wishes
  - [ ] Touch-friendly large card design
  - [ ] Click to view detail

- [ ] Task 5: Implement status grouping (AC: #4, #19)
  - [ ] Group wishes by status
  - [ ] Sort groups: 可兑换 > 进行中 > 已拒绝 > 等待审核
  - [ ] Display group headers/titles
  - [ ] Support collapsing/expanding groups
  - [ ] Remember collapsed state

- [ ] Task 6: Implement filtering (AC: #5, #11)
  - [ ] Create filter tabs component
  - [ ] Filter states: 全部 / 可兑换 / 进行中
  - [ ] Update wish list on filter change
  - [ ] Display active filter highlight
  - [ ] Click redeemable badge to filter "可兑换"

- [ ] Task 7: Implement redeemable badge (AC: #11)
  - [ ] Calculate redeemable count
  - [ ] Display badge in header
  - [ ] Badge color: Gold or primary color
  - [ ] Click badge to filter "可兑换"
  - [ ] Hide badge when count = 0

- [ ] Task 8: Implement pagination/infinite scroll (AC: #12)
  - [ ] Use infinite scroll with intersection observer
  - [ ] Load more wishes on scroll to bottom
  - [ ] Display "加载更多" skeleton or spinner
  - [ ] Handle all wishes loaded state
  - [ ] Or use pagination with "下一页" button

- [ ] Task 9: Handle rejected wishes (AC: #9, #18)
  - [ ] Display "已拒绝" gray badge
  - [ ] Display simplified rejection reason
  - [ ] Gray out wish card
  - [ ] Add "重新提交" button (navigate to create wish)
  - [ ] Support hide rejected wishes toggle
  - [ ] Remember preference in localStorage

- [ ] Task 10: Handle pending review wishes (AC: #10, #20)
  - [ ] Display "等待审核" blue badge
  - [ ] Use desired_points for progress display
  - [ ] Add context menu options:
     - "查看详情"
     - "编辑愿望"
     - "删除愿望"
  - [ ] Edit navigates to form with pre-filled data
  - [ ] Delete shows confirmation dialog

- [ ] Task 11: Implement real-time updates (AC: #14-#16)
  - [ ] Use polling or Zustand store for real-time updates
  - [ ] Poll every 2-3 seconds
  - [ ] Update wish list when points change
  - [ ] Update wish list when threshold changes
  - [ ] Update wish list when status changes
  - [ ] Show animation on update

- [ ] Task 12: Implement empty state (AC: #17)
  - [ ] Display when no wishes exist
  - [ ] Show empty state message
  - [ ] Display "添加第一个愿望" button
  - [ ] Show illustration or icon
  - [ ] Navigate to create wish page on button click

- [ ] Task 13: Implement pull-to-refresh (AC: #24)
  - [ ] Add pull gesture detection
  - [ ] Show loading spinner on pull
  - [ ] Fetch latest data on release
  - [ ] Update wish list
  - [ ] Hide spinner and show "已更新" toast

- [ ] Task 14: Write BDD tests (AC: #1-#24)
  - [ ] **Given** 儿童已登录 **When** 进入愿望清单 **Then** 显示所有愿望
  - [ ] **Given** 愿望列表显示 **When** 有可兑换愿望 **Then** 显示金色徽章和"兑换"按钮
  - [ ] **Given** 点击筛选 **When** 选择"可兑换" **Then** 只显示可兑换愿望
  - [ ] **Given** 点击愿望卡片 **When** 点击 **Then** 跳转到详情页
  - [ ] **Given** 愿望已拒绝 **When** 显示 **Then** 显示"已拒绝"徽章和灰度处理
  - [ ] **Given** 愿望等待审核 **When** 显示 **Then** 显示"等待审核"徽章
  - [ ] **Given** 积分更新 **When** 愿望列表打开 **Then** 实时更新
  - [ ] **Given** 愿望列表为空 **When** 进入页面 **Then** 显示空状态
  - [ ] **Given** 长按愿望 **When** 上下文菜单显示 **Then** 显示"查看详情/编辑/删除"
  - [ ] **Given** 下拉刷新 **When** 释放 **Then** 刷新数据
  - [ ] **Given** 离线状态 **When** 查看愿望列表 **Then** 显示缓存数据
  - [ ] Use Bun Test for unit tests, Playwright for E2E tests

- [ ] Task 15: Performance and compliance verification (AC: #14-#16, #22)
  - [ ] Verify API response time < 500ms (NFR3: P95)
  - [ ] Verify real-time update < 2s (NFR4)
  - [ ] Verify pull-to-refresh performance
  - [ ] Verify infinite scroll performance
  - [ ] Verify child data privacy (only child can see)

## Dev Notes

### Project Structure Notes

**Alignment with unified project structure:**
- Queries: `lib/db/queries/wishlists.ts` (extend from Stories 4.1-4.3)
- API: `app/api/wishlists/route.ts` (extend from Story 4.1)
- Page: `app/(child)/wishlist/page.tsx` (new)
- Component: `lib/components/features/wish-card.tsx` (extend from Story 4.1)
- Reuse: WishProgress (from Story 4.4), WishEstimation (from Story 4.5)
- Types: `types/wishlist.ts` (reuse from Stories 4.1-4.5)

**Detected conflicts/variances:**
- None identified at story creation time

### Previous Story Intelligence

**From Story 4.1 (Child Creates Wish):**
- wishlists table created
- Wish creation page exists (wishlist/create/page.tsx)
- Basic wish card structure exists
- **Can reuse:** Extend wish card with progress and status badges
- **Can reuse:** Navigate to create wish page

**From Story 4.2 (Parent Reviews Wish):**
- Wish status tracking (pending_review, approved, rejected)
- Rejection reasons stored
- **Can reuse:** Display rejection reasons on cards

**From Story 4.3 (Parent Sets Points Threshold):**
- Points threshold can be modified
- Real-time updates supported
- **Can reuse:** Reflect threshold changes in real-time

**From Story 4.4 (Wish Progress Bar Display):**
- WishProgress component exists
- Progress color scheme defined
- Real-time progress updates
- **Can reuse:** Integrate WishProgress in wish cards
- **Can reuse:** Real-time update mechanism

**From Story 4.5 (Smart Wish Estimation):**
- WishEstimation component exists
- Compact estimation display mode
- **Can reuse:** Integrate WishEstimation in wish cards (optional)

### Wish List Page Structure

**Page Layout:**
```typescript
// app/(child)/wishlist/page.tsx
export default function WishlistPage() {
  const [filter, setFilter] = useState<'all' | 'redeemable' | 'in-progress'>('all');
  const [wishes, setWishes] = useState<GroupedWishes>({});
  const [redeemableCount, setRedeemableCount] = useState(0);
  
  return (
    <div className="wishlist-page">
      {/* Header */}
      <header className="wishlist-header">
        <h1>我的愿望</h1>
        <div className="header-actions">
          {redeemableCount > 0 && (
            <Badge onClick={() => setFilter('redeemable')}>
              可兑换 {redeemableCount}
            </Badge>
          )}
          <Link to="/wishlist/create">
            <Button>+ 添加愿望</Button>
          </Link>
        </div>
      </header>
      
      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="redeemable">可兑换</TabsTrigger>
          <TabsTrigger value="in-progress">进行中</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Grouped Wish Cards */}
      <div className="wishes-container">
        {filter === 'all' ? (
          <>
            {/* 可兑换 group */}
            {wishes.redeemable?.length > 0 && (
              <section>
                <h2>可兑换</h2>
                <div className="wishes-grid">
                  {wishes.redeemable.map(wish => (
                    <WishCard key={wish.id} wish={wish} />
                  ))}
                </div>
              </section>
            )}
            
            {/* 进行中 group */}
            {wishes.inProgress?.length > 0 && (
              <section>
                <h2>进行中</h2>
                <div className="wishes-grid">
                  {wishes.inProgress.map(wish => (
                    <WishCard key={wish.id} wish={wish} />
                  ))}
                </div>
              </section>
            )}
            
            {/* 已拒绝 group (optional) */}
            {!hideRejected && wishes.rejected?.length > 0 && (
              <section>
                <h2>已拒绝</h2>
                <div className="wishes-grid">
                  {wishes.rejected.map(wish => (
                    <WishCard key={wish.id} wish={wish} />
                  ))}
                </div>
              </section>
            )}
            
            {/* 等待审核 group */}
            {wishes.pendingReview?.length > 0 && (
              <section>
                <h2>等待审核</h2>
                <div className="wishes-grid">
                  {wishes.pendingReview.map(wish => (
                    <WishCard key={wish.id} wish={wish} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          /* Filtered view - single grid */
          <div className="wishes-grid">
            {filteredWishes.map(wish => (
              <WishCard key={wish.id} wish={wish} />
            ))}
          </div>
        )}
      </div>
      
      {/* Empty State */}
      {wishes.total === 0 && (
        <EmptyState
          message="你还没有创建愿望哦！"
          action="添加第一个愿望"
          onAction={() => navigate('/wishlist/create')}
        />
      )}
    </div>
  );
}
```

### Wish Card Component Design

**Component Structure:**
```typescript
// lib/components/features/wish-card.tsx
export function WishCard({
  wish,
  isCompact = false,
  onEdit,
  onDelete
}: WishCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [hideRejected, setHideRejected] = useState(false);
  
  // Don't show rejected wishes if hidden
  if (wish.status === 'rejected' && hideRejected) {
    return null;
  }
  
  return (
    <Card
      className={`wish-card wish-card-${wish.status}`}
      onClick={() => navigate(`/wishlist/view/${wish.id}`)}
      onLongPress={() => setShowMenu(true)}
    >
      {/* Image/Icon */}
      <div className="wish-image">
        {wish.imageUrl ? (
          <img src={wish.imageUrl} alt={wish.title} />
        ) : (
          <DefaultIcon type={wish.type} />
        )}
      </div>
      
      {/* Status Badges */}
      <div className="wish-status">
        {wish.status === 'redeemable' && (
          <Badge className="badge-redeemable">可兑换</Badge>
        )}
        {wish.status === 'inProgress' && (
          <Badge className="badge-in-progress">进行中</Badge>
        )}
        {wish.status === 'rejected' && (
          <Badge className="badge-rejected">已拒绝</Badge>
        )}
        {wish.status === 'pendingReview' && (
          <Badge className="badge-pending">等待审核</Badge>
        )}
      </div>
      
      {/* Wish Name and Type */}
      <div className="wish-info">
        <h3>{wish.title}</h3>
        <div className="wish-type">
          <TypeIcon type={wish.type} />
          <span>{wish.type === 'item' ? '物品' : '体验'}</span>
        </div>
      </div>
      
      {/* Progress Bar (from Story 4.4) */}
      <WishProgress
        currentPoints={wish.currentPoints}
        pointsThreshold={wish.pointsThreshold}
        status={wish.status}
        isCompact
      />
      
      {/* Estimation (from Story 4.5, optional) */}
      {!isCompact && wish.status === 'approved' && (
        <WishEstimation
          wishId={wish.id}
          childId={wish.childId}
          isCompact
        />
      )}
      
      {/* Redeem Button */}
      {wish.status === 'redeemable' && (
        <Button
          className="redeem-button"
          onClick={(e) => {
            e.stopPropagation();
            initiateRedemption(wish.id);
          }}
        >
          兑换
        </Button>
      )}
      
      {/* Rejected Actions */}
      {wish.status === 'rejected' && !isCompact && (
        <div className="rejected-actions">
          <p className="rejection-reason">{wish.rejectionReason}</p>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/wishlist/create', { state: { wish } });
            }}
          >
            重新提交
          </Button>
        </div>
      )}
      
      {/* Context Menu */}
      {showMenu && (
        <ContextMenu onClose={() => setShowMenu(false)}>
          <MenuItem onClick={() => navigate(`/wishlist/view/${wish.id}`)}>
            查看详情
          </MenuItem>
          {wish.status === 'pendingReview' && (
            <>
              <MenuItem onClick={() => onEdit(wish)}>编辑愿望</MenuItem>
              <MenuItem onClick={() => onDelete(wish)}>删除愿望</MenuItem>
            </>
          )}
          {wish.status === 'rejected' && (
            <MenuItem onClick={() => onDelete(wish)}>删除愿望</MenuItem>
          )}
        </ContextMenu>
      )}
    </Card>
  );
}
```

### Testing Strategy

**BDD Tests (Given-When-Then):**
1. Child views wish list with all wishes
2. Child filters wishes by status
3. Child clicks wish card to view detail
4. Child sees redeemable wishes with gold badge
5. Child sees rejected wishes with gray badge
6. Child sees pending review wishes with blue badge
7. Real-time updates when points change
8. Real-time updates when threshold changes
9. Real-time updates when status changes
10. Empty state display
11. Infinite scroll / pagination
12. Pull-to-refresh
13. Long press context menu
14. Hide rejected wishes toggle
15. Redeemable badge click to filter
16. Offline state display

**Integration Tests:**
- Wish list query with filters
- Status grouping logic
- Redeemable count calculation
- Context menu actions
- Real-time update mechanism
- Pagination/infinite scroll
- Pull-to-refresh handling

**E2E Tests (Playwright):**
- Complete wish list viewing flow
- Filter switching
- Wish card interactions
- Context menu actions
- Real-time updates verification
- Pull-to-refresh
- Empty state
- Offline state

### Performance Requirements

- Wish list API: < 500ms (NFR3: P95)
- Real-time update: < 2s (NFR4)
- Wish card render: < 50ms
- Infinite scroll loading: < 100ms
- Pull-to-refresh: < 1s

### UX Requirements

**Child-End Design (from UX decisions):**
- Tablet-optimized layout (landscape, ≥768px)
- Large, touch-friendly cards (≥120x120px)
- Gamified elements (gold badges, colors)
- Clear visual feedback
- Easy navigation

**Wish List Design:**
- Grid layout: 4x3 or 4x4 for tablet
- Grouped by status
- Clear group headers
- Highlight redeemable wishes
- Smooth animations

**Wish Card Design:**
- Large image/icon
- Clear status indicators
- Progress bar (from Story 4.4)
- Estimation (from Story 4.5)
- Action buttons (redeem, re-submit)
- Context menu on long press

**Filter Design:**
- Tabs: 全部 / 可兑换 / 进行中
- Active filter highlight
- Quick access to redeemable wishes via badge

### Compliance Requirements

**COPPA/GDPR Compliance:**
- Child data privacy (only child can see their wishes)
- No PII in wish list
- Clear, age-appropriate UI
- Data retention: 3 years (NFR18)

### Open Questions / Decisions Needed

1. **Wish Limit Configuration:**
   - Option A: No limit by default, parent can set (FR60)
   - Option B: Default limit (e.g., 20), parent can adjust
   - **Decision:** No limit by default, parent can set (per AC #21, FR60)

2. **Infinite Scroll vs Pagination:**
   - Option A: Infinite scroll (modern, continuous)
   - Option B: Pagination (traditional, controlled)
   - **Decision:** Infinite scroll with intersection observer (better UX, per AC #12)

3. **Rejected Wishes Default Display:**
   - Option A: Show by default, can hide
   - Option B: Hide by default, can show
   - **Decision:** Show by default, can hide (more transparent, per AC #18)

4. **Estimation Display on Card:**
   - Option A: Always show compact estimation
   - Option B: Only show in detail view
   - Option C: User preference
   - **Decision:** Optional compact mode (default on, per AC #3)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] All E2E tests passing
4. [ ] Performance requirements met (<500ms API, <2s update, <50ms render)
5. [ ] Child data privacy maintained
6. [ ] Real-time updates working smoothly
7. [ ] All status types displayed correctly
8. [ ] Filtering and grouping working
9. [ ] Empty state handled
10. [ ] Code review passed
11. [ ] Sprint status updated to ready-for-dev

### Tasks Blocked By

**Prerequisites:**
- Story 4.1: Child Creates Wish - Complete ✅
- Story 4.2: Parent Reviews Wish - Complete ✅
- Story 4.3: Parent Sets Points Threshold - Complete ✅
- Story 4.4: Wish Progress Bar Display - Complete ✅
- Story 4.5: Smart Wish Estimation - Complete ✅
- wishlists table exists - Complete ✅
- WishProgress component exists - Complete ✅
- WishEstimation component exists - Complete ✅

**None identified at story creation time.**

## Dev Agent Record

### Agent Model Used

GLM-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

None at story creation time.

### Completion Notes List

Story created with comprehensive implementation guidance including:
- Complete wish list page design with grouping and filtering
- Enhanced wish card component with status badges and actions
- Context menu implementation for edit/delete operations
- Real-time update strategy (polling 2-3s)
- Infinite scroll with intersection observer
- Pull-to-refresh functionality
- Empty state handling
- Offline support with caching
- Rejected wishes handling with hide toggle
- Redeemable badge and quick filter
- BDD test scenarios covering all acceptance criteria
- Performance targets for rendering and updates
- Child-friendly UX design (tablet optimized, large cards)
- Integration with previous stories (4.4 progress bar, 4.5 estimation)

### File List

**Files to Create:**
- app/(child)/wishlist/page.tsx
- lib/components/features/wish-card.tsx (extend from Story 4.1)
- lib/components/ui/context-menu.tsx

**Files to Modify:**
- lib/db/queries/wishlists.ts (add list queries)
- app/api/wishlists/route.ts (add status filter, pagination)
- types/wishlist.ts (add grouped types)

**Test Files:**
- tests/integration/wishlist.spec.ts (extend from Story 4.1)
- tests/e2e/wishlist-list.spec.ts
- tests/fixtures/wishlist-list.ts
