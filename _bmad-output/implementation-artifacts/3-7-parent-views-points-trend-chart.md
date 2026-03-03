# Story 3.7: Parent Views Points Trend Chart

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长,
I want 查看积分变化趋势图表,
so that 我可以直观地了解儿童积分的走势和习惯养成情况。

## Acceptance Criteria

1. Given 我已登录系统并有家长权限
   When 我进入"积分趋势"页面
   Then 系统显示积分趋势图表，包含：
   - 折线图显示每日积分变化
   - 默认显示最近30天
   - 支持时间范围选择：7天 / 30天 / 90天
   - 支持按儿童筛选（家庭有多个儿童时）
2. And 图表包含：
   - 积分净变化曲线（收入-支出）
   - 任务完成次数柱状图
   - 愿望兑换标记点
3. And 显示统计摘要：
   - 累计获得积分
   - 累计消耗积分
   - 平均每日积分
   - 最佳连续正向天数
4. And 页面加载时间<3秒（NFR2）

## Tasks / Subtasks

- [ ] Task 1: Create parent points trend chart page (AC: 1)
  - [ ] Subtask 1.1: Create page route `app/(parent)/points/trend/page.tsx`
  - [ ] Subtask 1.2: Create PointsTrendChart component
  - [ ] Subtask 1.3: Add time range selector (7d/30d/90d)
  - [ ] Subtask 1.4: Add child selector (if multiple children)
  - [ ] Subtask 1.5: Add unit tests for filtering logic
- [ ] Task 2: Implement chart library integration (AC: 1, 2)
  - [ ] Subtask 2.1: Install and configure Recharts (latest stable version: `bun add recharts`)
  - [ ] Subtask 2.2: Create LineChart for daily points change
  - [ ] Subtask 2.3: Create BarChart for task completion count
  - [ ] Subtask 2.4: Add wishlist redemption markers
  - [ ] Subtask 2.5: Add integration tests for chart rendering
- [ ] Task 3: Implement statistics summary (AC: 3)
  - [ ] Subtask 3.1: Calculate cumulative earned points
  - [ ] Subtask 3.2: Calculate cumulative spent points
  - [ ] Subtask 3.3: Calculate average daily points
  - [ ] Subtask 3.4: Calculate best positive streak
  - [ ] Subtask 3.5: Add unit tests for statistics calculations
- [ ] Task 4: Optimize page loading performance (AC: 4)
  - [ ] Subtask 4.1: Implement data aggregation API endpoint
  - [ ] Subtask 4.2: Add caching for trend data
  - [ ] Subtask 4.3: Add performance tests for <3 second load time

## Dev Notes

### Architecture Patterns & Constraints

**Database Queries (RED LIST - MUST FOLLOW):**
- Location: `lib/db/queries/` directory, split by table
- Points queries file: `lib/db/queries/points.ts` (created in Story 3.1)
- MUST use Drizzle ORM query builder (NEVER native SQL or string concatenation)
- Export functions, NOT Repository pattern

**Technology Stack (from architecture.md):**
- Runtime: Bun 1.3.x+ (NO Node.js compatibility layer)
- Database: bun:sqlite + Drizzle ORM 0.45.x+
- UI System: Tailwind CSS 4 + Shadcn UI 3.7.0+
- Chart Library: Recharts (React-native, TypeScript support)

**Recharts Library Details:**
- **Latest Stable Version**: recharts@2.10.0+
- **Installation Command**: `bun add recharts`
- **TypeScript Support**: Full type definitions included
- **Performance**: Optimized for large datasets with responsive rendering
- **Next.js 16 Compatibility**: Full support with App Router
- **ADR Reference**: Architecture Decision Point 4 (Chart Library Selection)

**Database Schema References:**
- `points` table: points history/ledger for tracking all changes
  - Fields: `amount`, `reason`, `type`, `createdAt`, `taskId` (optional), `childId`
- Types: "task_reward", "manual_adjust", "wish_redemption"
- Statistics derived from points history aggregation

**BDD Development Requirements:**
- Tests MUST use Given-When-Then format
- Tests MUST use business language (not technical terms)
- Tests MUST be written BEFORE implementation

### File Structure Requirements

**Files to Create:**
```
app/
├── (parent)/
│   └── points/
│       └── trend/
│           └── page.tsx            # NEW: Parent points trend chart page

lib/
├── db/queries/
│   └── points.ts                 # Extend for trend aggregation queries
└── services/
    └── points-statistics.ts        # NEW: Statistics calculation service

components/
└── features/
    └── points-trend-chart.tsx    # NEW: Trend chart component

tests/
├── unit/
│   ├── lib/
│   │   └── services/
│   │       └── points-statistics.spec.ts  # NEW
│   └── components/
│       └── features/
│           └── points-trend-chart.spec.ts  # NEW
└── integration/
    └── api/
        └── points.spec.ts              # Extend for trend aggregation tests
```

**API Routes to Create:**
- `app/api/points/trend/route.ts` - Get aggregated trend data with filters

### Testing Standards

**BDD Format Example:**
```typescript
it('given 家长已登录系统并有家长权限，when 进入积分趋势页面，then 系统显示积分趋势图表', async () => {
  // Given: 家长已登录且有积分历史记录
  const parent = await createParent();
  const child = await createChild({ familyId: parent.familyId });
  await createPointsHistory([
    { amount: 10, reason: '任务奖励：刷牙', type: 'task_reward', childId: child.id, createdAt: '2026-01-01' },
    { amount: 10, reason: '任务奖励：学习', type: 'task_reward', childId: child.id, createdAt: '2026-01-02' },
    { amount: -50, reason: '愿望兑换：乐高玩具', type: 'wish_redemption', childId: child.id, createdAt: '2026-01-03' },
    { amount: 5, reason: '家长加分：表现好', type: 'manual_adjust', childId: child.id, createdAt: '2026-01-04' }
  ]);

  // When: 进入"积分趋势"页面
  const page = render(<PointsTrendPage childId={child.id} />);

  // Then: 系统显示积分趋势图表
  expect(page.getByTestId('points-trend-chart')).toBeInTheDocument();
  
  // And: 折线图显示每日积分变化
  expect(page.getByTestId('line-chart')).toBeInTheDocument();
  
  // And: 默认显示最近30天
  expect(page.getByText('最近30天')).toBeInTheDocument();
});

it('given 家长查看积分趋势，when 选择时间范围7天，then 显示7天数据', async () => {
  // Given: 家长已登录且有30天的积分历史
  const parent = await createParent();
  const child = await createChild({ familyId: parent.familyId });
  await createPointsHistory(child.id, 30);

  // When: 选择时间范围7天
  const response = await request(app)
    .get('/api/points/trend')
    .query({ childId: child.id, range: '7d' })
    .set('Cookie', parentSession);

  // Then: 显示7天数据
  expect(response.status).toBe(200);
  expect(response.body.trendData).toHaveLength(7);
});

it('given 家长查看积分趋势，when 查看统计摘要，then 显示累计、平均和最佳天数', async () => {
  // Given: 家长已登录且有积分历史
  const parent = await createParent();
  const child = await createChild({ familyId: parent.familyId });
  await createPointsHistory([
    { amount: 10, type: 'task_reward', childId: child.id },
    { amount: 10, type: 'task_reward', childId: child.id },
    { amount: 10, type: 'task_reward', childId: child.id },
    { amount: -50, type: 'wish_redemption', childId: child.id }
  ]);

  // When: 查看统计摘要
  const response = await request(app)
    .get('/api/points/trend/statistics')
    .query({ childId: child.id })
    .set('Cookie', parentSession);

  // Then: 显示统计摘要
  expect(response.status).toBe(200);
  expect(response.body.earned).toBe(30); // 累计获得
  expect(response.body.spent).toBe(50); // 累计消耗
  expect(response.body.averageDaily).toBeCloseTo(-6.67, 1); // 平均每日
  expect(response.body.bestPositiveStreak).toBe(3); // 最佳连续正向天数
});
```

**Coverage Requirements:**
- Unit tests for PointsTrendChart component rendering
- Unit tests for time range filtering (7d/30d/90d)
- Unit tests for child filtering
- Unit tests for statistics calculations
- Integration test for trend aggregation API
- Performance test for <3 second page load time

### Performance Requirements (from PRD)

- Parent stats page load time < 3 seconds [NFR2]
- API response time < 500ms (P95) [NFR3]
- Chart rendering must be optimized for mobile devices

**Animation Implementation Details:**

**Animation Library Decision (ADR-5):**
- **Primary**: CSS Animations (Tailwind CSS built-in)
- **Secondary**: Framer Motion (for complex chart animations)
- **Reference**: Architecture Decision Record 5 (Animation System)

**Implementation Strategy:**
```typescript
// Animation Configuration
export const ANIMATION_CONFIG = {
  // CSS animations (primary - zero dependency)
  css: {
    duration: 300, // milliseconds
    easing: 'ease-in-out',
  },

  // Framer Motion (secondary - optional)
  framerMotion: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1], // cubic-bezier
    },
  },
} as const;

// Performance Optimization
export const CHART_ANIMATION_CONFIG = {
  // Disable animations for low-end devices
  prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,

  // Lazy load chart data
  lazyLoad: true,

  // Optimize re-renders
  memoize: true,
} as const;
```

### Security & Compliance

**COPPA/GDPR Compliance:**
- Data access restricted to parent only
- No child-specific identifiable information in chart data
- All data aggregated, not individual records

### Integration Notes

**Depends on:**
- Story 3.1: System Calculates Points on Task Approval (creates points history)
- Story 3.2: Positive Points Reward (creates PointsDisplay component)
- Story 3.3: Negative Points Deduction (extends points display)
- Story 3.4: Points Settlement After Approval (adds parent approval)
- Story 3.5: Parent Temporary Points Adjustment (adds adjustment history)
- Story 3.6: Parent Views Points History (creates history API)
- Epic 1: User Authentication & Family Management (parent authentication)
- Database tables: points

**Previous Story Intelligence (Story 3.1):**
- Story 3.1 creates `lib/db/queries/points.ts` with history tracking
- Story 3.1 implements atomic transaction for points transfer
- This story uses points history data as chart source

**Previous Story Intelligence (Story 3.6):**
- Story 3.6 creates points history API with filters
- This story extends API with trend aggregation
- This story adds visualization to that data

**Previous Story Intelligence (Story 3.5):**
- Story 3.5 adds manual adjustment history
- This story includes adjustment data in trend chart

### Project Structure Notes

**Alignment with unified project structure:**
- New page route follows Next.js App Router conventions
- New components in `components/features/` follow feature component pattern
- New service in `lib/services/` follows service layer pattern
- Recharts follows architecture decision for chart library
- No conflicts detected

### References

**Functional Requirements:**
- FR27: 家长可以查看积分趋势 [Source: _bmad-output/planning-artifacts/prd.md#FR27]
- FR26: 积分历史包含时间、类型、数值、原因 [Source: _bmad-output/planning-artifacts/prd.md#FR26]

**Non-Functional Requirements:**
- NFR2: 家长端统计页面加载时间 < 3秒 [Source: _bmad-output/planning-artifacts/prd.md#NFR2]
- NFR3: API 响应时间 < 500ms（P95） [Source: _bmad-output/planning-artifacts/prd.md#NFR3]

**Architecture Decisions:**
- ADR-4: 图表库选择 - Recharts [Source: _bmad-output/planning-artifacts/architecture.md#Decision-Point-4]
- ADR-2: SQLite + Drizzle ORM (初期) → PostgreSQL升级路径（二期） [Source: _bmad-output/planning-artifacts/architecture.md#ADR-2]
- Database queries: Function-based (NOT Repository pattern) [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5]
- BDD Development: Given-When-Then format, tests BEFORE implementation [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5]

**Database Schema:**
- Points table with fields: amount, reason, type, createdAt, childId [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]

**Acceptance Criteria:**
- AC9: 积分变动历史记录完整，支持按时间范围查询 [Source: _bmad-output/planning-artifacts/prd.md#AC9]

**UX Design Specifications:**
- Parent efficiency design: batch operations, data visualization [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Directions]
- Growth curves and completion rate charts [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Opportunities]
- Chart components for trend visualization [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Step-11-Component-Design-Specifications]

**Integration Points:**
- Trend data aggregated from points history [Source: _bmad-output/planning-artifacts/prd.md#Integration-Notes]

**Previous Story Intelligence:**
- Story 3.1 created points history tracking with atomic transactions
- Story 3.2 created PointsDisplay component with positive formatting (green)
- Story 3.3 extended PointsDisplay for negative values (red)
- Story 3.4 added parent approval gate for task-based settlements
- Story 3.5 added manual adjustment history records
- Story 3.6 created points history API with time and type filters
- This story adds trend visualization and statistics to that data

## Dev Agent Record

### Agent Model Used
glm-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References
N/A

### Completion Notes List
Story context created from comprehensive analysis of epics.md, PRD, architecture.md, and UX specifications. Builds on Stories 3.1, 3.2, 3.3, 3.4, 3.5, and 3.6 foundation.

### File List
Story file: _bmad-output/implementation-artifacts/3-7-parent-views-points-trend-chart.md
