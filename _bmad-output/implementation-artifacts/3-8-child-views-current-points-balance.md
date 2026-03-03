# Story 3.8: Child Views Current Points Balance

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 儿童,
I want 查看当前积分余额,
so that 我知道自己有多少积分可以用于兑换愿望。

## Acceptance Criteria

1. Given 我已登录系统（PIN码或家长设备）
   When 我打开应用首页或积分页面
   Then 系统显示当前积分余额，大字体突出显示
2. And 余额实时更新（3秒内同步，NFR4）
3. And 显示积分变化动画：余额增加时绿色闪烁，减少时红色闪烁
4. And 页面加载时间<2秒（NFR1）

## Tasks / Subtasks

- [ ] Task 1: Create child points balance display component (AC: 1, 3)
  - [ ] Subtask 1.1: Create ChildPointsBalance component with large font display
  - [ ] Subtask 1.2: Add points change animation (green flash for +, red flash for -)
  - [ ] Subtask 1.3: Add unit tests for display and animations
- [ ] Task 2: Integrate with real-time sync (AC: 2)
  - [ ] Subtask 2.1: Create polling mechanism for points balance updates
  - [ ] Subtask 2.2: Set 3-second polling interval (NFR4)
  - [ ] Subtask 2.3: Add integration test for real-time sync (< 3 seconds)
- [ ] Task 3: Optimize page loading performance (AC: 4)
  - [ ] Subtask 3.1: Implement component lazy loading
  - [ ] Subtask 3.2: Add caching for points balance data
  - [ ] Subtask 3.3: Add performance tests for < 2 second load time
- [ ] Task 4: Create child dashboard page (AC: 1)
  - [ ] Subtask 4.1: Create page route `app/(child)/dashboard/page.tsx`
  - [ ] Subtask 4.2: Integrate ChildPointsBalance component
  - [ ] Subtask 4.3: Add unit tests for dashboard page rendering

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
- Real-time: Polling mechanism (2-3 second interval, per ADR-1)

**Database Schema References:**
- `point-balances` table: stores child's current points balance
- `points` table: points history/ledger for tracking changes
- Child authentication: PIN code login (Epic 1, Story 1.3)

**BDD Development Requirements:**
- Tests MUST use Given-When-Then format
- Tests MUST use business language (not technical terms)
- Tests MUST be written BEFORE implementation

### File Structure Requirements

**Files to Create:**
```
app/
├── (child)/
│   └── dashboard/
│       └── page.tsx            # NEW: Child dashboard page

lib/
├── db/queries/
│   └── points.ts                 # Extend for balance query
└── hooks/
    └── use-points-balance.ts    # NEW: Points balance polling hook

components/
└── features/
    └── child-points-balance.tsx  # NEW: Child points balance component

tests/
├── unit/
│   ├── components/
│   │   └── features/
│   │       └── child-points-balance.spec.ts  # NEW
│   └── lib/
│       └── hooks/
│           └── use-points-balance.spec.ts      # NEW
└── integration/
    └── api/
        └── points.spec.ts              # Extend for balance tests
```

### Testing Standards

**BDD Format Example:**
```typescript
it('given 儿童已登录系统，when 打开应用首页，then 系统显示当前积分余额大字体突出显示', async () => {
  // Given: 儿童已登录且有积分余额
  const child = await createChild({ balance: 100 });

  // When: 打开应用首页
  const page = render(<ChildDashboard childId={child.id} />);

  // Then: 系统显示当前积分余额
  const pointsDisplay = page.getByTestId('points-balance');
  expect(pointsDisplay).toBeInTheDocument();
  expect(pointsDisplay).toHaveTextContent('100');

  // And: 大字体突出显示
  expect(pointsDisplay).toHaveClass('text-6xl'); // Tailwind large font
});

it('given 儿童积分余额变化，when 积分增加，then 绿色闪烁动画', async () => {
  // Given: 儿童已登录，当前积分为100
  const child = await createChild({ balance: 100 });

  // When: 积分增加（家长审批任务）
  await approveTask({ points: 10 });
  const page = render(<ChildDashboard childId={child.id} />);

  // Then: 绿色闪烁动画
  const pointsDisplay = page.getByTestId('points-balance');
  expect(pointsDisplay).toHaveClass('animate-green-flash');
  expect(pointsDisplay).toHaveTextContent('110');
});

it('given 儿童积分余额变化，when 积分减少，then 红色闪烁动画', async () => {
  // Given: 儿童已登录，当前积分为100
  const child = await createChild({ balance: 100 });

  // When: 积分减少（愿望兑换）
  await redeemWish({ points: 50 });
  const page = render(<ChildDashboard childId={child.id} />);

  // Then: 红色闪烁动画
  const pointsDisplay = page.getByTestId('points-balance');
  expect(pointsDisplay).toHaveClass('animate-red-flash');
  expect(pointsDisplay).toHaveTextContent('50');
});

it('given 儿童打开应用，when 积分变化，then 3秒内同步', async () => {
  // Given: 儿童已登录，应用显示积分为100
  const child = await createChild({ balance: 100 });
  const page = render(<ChildDashboard childId={child.id} />);

  // When: 积分变化（家长审批任务）
  const startTime = Date.now();
  await approveTask({ points: 10 });

  // Then: 3秒内同步
  await waitFor(() => {
    const pointsDisplay = page.getByTestId('points-balance');
    expect(pointsDisplay).toHaveTextContent('110');
  }, { timeout: 3500 }); // 3.5 seconds buffer

  const syncTime = Date.now() - startTime;
  expect(syncTime).toBeLessThan(3000); // < 3 seconds
});
```

**Coverage Requirements:**
- Unit tests for ChildPointsBalance component rendering
- Unit tests for points change animations (green flash for +, red flash for -)
- Unit tests for large font display styling
- Unit tests for usePointsBalance polling hook
- Integration test for real-time sync (< 3 seconds)
- Performance test for < 2 second page load time

### Performance Requirements (from PRD)

- Child dashboard page load time < 2 seconds [NFR1]
- Real-time sync delay < 3 seconds for points display update [NFR4]
- API response time < 500ms (P95) [NFR3]

### Security & Compliance

**COPPA/GDPR Compliance:**
- Child PIN code authentication (Epic 1, Story 1.3)
- Parent device access allowed (Epic 1, Story 1.6)
- Points balance data accessible only by authenticated child or parent

### Integration Notes

**Depends on:**
- Story 3.1: System Calculates Points on Task Approval (creates points balance tracking)
- Story 3.2: Positive Points Reward (creates PointsDisplay component - reuse for child)
- Story 3.3: Negative Points Deduction (extends PointsDisplay for negative values)
- Story 3.4: Points Settlement After Approval (ensures settlement triggers updates)
- Story 3.5: Parent Temporary Points Adjustment (adds adjustment updates)
- Epic 1: User Authentication & Family Management (child PIN login)
- Database tables: point-balances, points

**Previous Story Intelligence (Story 3.1):**
- Story 3.1 creates `lib/db/queries/points.ts` with balance tracking
- Story 3.1 implements atomic transaction for points transfer
- This story provides child-facing UI for viewing that balance

**Previous Story Intelligence (Story 3.2):**
- Story 3.2 creates PointsDisplay component with positive formatting (green)
- This story reuses PointsDisplay but with large font for child

**Previous Story Intelligence (Story 3.3):**
- Story 3.3 extends PointsDisplay for negative values (red)
- This story reuses red display for child balance

**Triggers:**
- Story 4.1: Child Views Wishlist (shows how close to redemption)
- Story 4.4: Wish Redemption Eligibility Check (uses balance for validation)

### Project Structure Notes

**Alignment with unified project structure:**
- New page route follows Next.js App Router conventions
- New component in `components/features/` follows feature component pattern
- New hook in `lib/hooks/` follows React hooks pattern
- Modifying existing `lib/db/queries/points.ts` from Story 3.1
- No conflicts detected

### References

**Functional Requirements:**
- FR21: 系统支持正向积分（好行为奖励） [Source: _bmad-output/planning-artifacts/prd.md#FR21]
- FR22: 系统支持负向积分（坏行为扣除） [Source: _bmad-output/planning-artifacts/prd.md#FR22]

**Non-Functional Requirements:**
- NFR1: 儿童端页面加载时间 < 2秒 [Source: _bmad-output/planning-artifacts/prd.md#NFR1]
- NFR3: API 响应时间 < 500ms（P95） [Source: _bmad-output/planning-artifacts/prd.md#NFR3]
- NFR4: 实时数据同步延迟 < 3秒 [Source: _bmad-output/planning-artifacts/prd.md#NFR4]

**Architecture Decisions:**
- ADR-1: 实时通信架构 - 轮询机制（2-3秒间隔） [Source: _bmad-output/planning-artifacts/architecture.md#ADR-1]
- ADR-2: SQLite + Drizzle ORM (初期) → PostgreSQL升级路径（二期） [Source: _bmad-output/planning-artifacts/architecture.md#ADR-2]
- Database queries: Function-based (NOT Repository pattern) [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5]
- BDD Development: Given-When-Then format, tests BEFORE implementation [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5]

**Database Schema:**
- Point-balances table for child's current balance [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- Points table for history/ledger tracking [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]

**Acceptance Criteria:**
- AC9: 积分变动历史记录完整，支持按时间范围查询 [Source: _bmad-output/planning-artifacts/prd.md#AC9]

**UX Design Specifications:**
- Child-friendly UI with gamification elements [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Executive-Summary]
- Visual feedback (animations, progress bars, sound effects) [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Opportunities]
- Large font display for balance (child tablet optimization) [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Directions]

**Integration Points:**
- Points balance displayed on child dashboard [Source: _bmad-output/planning-artifacts/prd.md#Integration-Notes]

**Previous Story Intelligence:**
- Story 3.1 created points settlement service with atomic transactions
- Story 3.2 created PointsDisplay component with positive formatting (green)
- Story 3.3 extended PointsDisplay for negative values (red)
- Story 3.4 added parent approval gate for task-based settlements
- Story 3.5 added parent adjustment capability
- Story 3.6 created points history API
- Story 3.7 created points trend chart
- This story provides child-facing UI for viewing current balance with large font and animations

## Dev Agent Record

### Agent Model Used
glm-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References
N/A

### Completion Notes List
Story context created from comprehensive analysis of epics.md, PRD, architecture.md, and UX specifications. Builds on Stories 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, and 3.7 foundation.

### File List
Story file: _bmad-output/implementation-artifacts/3-8-child-views-current-points-balance.md
