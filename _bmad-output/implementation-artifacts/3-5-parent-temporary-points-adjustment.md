# Story 3.5: Parent Temporary Points Adjustment

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 家长,
I want 临时加减分,
so that 我可以灵活地对儿童进行即时的积分奖励或惩罚。

## Acceptance Criteria

1. Given 我有家长权限
   When 我进入积分调整页面
   Then 系统显示积分调整表单，包含：
   - 调整方向选择：增加 / 减少
   - 积分值输入（1-100）
   - 原因选择或输入（必填）
     - 预设原因："表现好"、"帮助家务"、"学习进步"、"不听话"、"迟到"、"其他"
   - 适用儿童选择（必填）
2. And 点击确认后，积分立即调整
3. And 积分历史记录显示调整原因
4. And 家长可以查看所有历史调整记录

## Tasks / Subtasks

- [ ] Task 1: Create parent points adjustment page (AC: 1)
  - [ ] Subtask 1.1: Create page route `app/(parent)/points/adjust/page.tsx`
  - [ ] Subtask 1.2: Create PointsAdjustmentForm component
  - [ ] Subtask 1.3: Add validation for required fields
  - [ ] Subtask 1.4: Add unit tests for form validation
- [ ] Task 2: Implement API endpoint for points adjustment (AC: 2)
  - [ ] Subtask 2.1: Create `/api/points/adjust` endpoint with parent authentication
  - [ ] Subtask 2.2: Validate adjustment amount (1-100 range)
  - [ ] Subtask 2.3: Add integration test for points adjustment
- [ ] Task 3: Integrate with points history recording (AC: 3, 4)
  - [ ] Subtask 3.1: Update points calculator to generate adjustment reason format
  - [ ] Subtask 3.2: Add integration test for history record with reason
  - [ ] Subtask 3.3: Create parent adjustment history view component
- [ ] Task 4: Support both positive and negative adjustments (AC: 1, 2)
  - [ ] Subtask 4.1: Reuse PointsDisplay component from Story 3.2/3.3
  - [ ] Subtask 4.2: Ensure green display for positive, red for negative
  - [ ] Subtask 4.3: Add integration test for both adjustment types

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

**Database Schema References:**
- `point-balances` table: stores child's current points balance (can be negative)
- `points` table: points history/ledger for tracking all changes with `reason` field
- Positive and negative adjustments must be supported
- Adjustment reason must be recorded in history

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
│       └── adjust/
│           └── page.tsx            # NEW: Parent points adjustment page

lib/
├── services/
│   └── points-calculator.ts      # Extend for adjustment functionality
├── db/queries/
│   └── points.ts                 # Extend for adjustment queries
└── components/
    └── features/
        ├── points-adjustment-form.tsx  # NEW: Adjustment form component
        └── points-adjustment-history.tsx  # NEW: History view component

tests/
├── unit/
│   ├── components/
│   │   └── features/
│   │       ├── points-adjustment-form.spec.ts  # NEW
│   │       └── points-adjustment-history.spec.ts  # NEW
└── integration/
    └── api/
        └── points.spec.ts              # Extend for adjustment tests
```

**API Routes to Create:**
- `app/api/points/adjust/route.ts` - Parent-initiated points adjustment

### Testing Standards

**BDD Format Example:**
```typescript
it('given 家长有权限，when 进入积分调整页面，then 系统显示积分调整表单', async () => {
  // Given: 家长已登录并有至少一个儿童
  const parent = await createParent();
  const child = await createChild({ familyId: parent.familyId });

  // When: 进入积分调整页面
  const page = render(<PointsAdjustmentPage />);

  // Then: 系统显示积分调整表单
  expect(page.getByLabelText('调整方向')).toBeInTheDocument();
  expect(page.getByLabelText('积分值')).toBeInTheDocument();
  expect(page.getByLabelText('原因')).toBeInTheDocument();
  expect(page.getByLabelText('适用儿童')).toBeInTheDocument();

  // And: 预设原因选项显示
  expect(page.getByText('表现好')).toBeInTheDocument();
  expect(page.getByText('帮助家务')).toBeInTheDocument();
  expect(page.getByText('学习进步')).toBeInTheDocument();
  expect(page.getByText('不听话')).toBeInTheDocument();
  expect(page.getByText('迟到')).toBeInTheDocument();
  expect(page.getByText('其他')).toBeInTheDocument();
});

it('given 家长填写积分调整表单，when 点击确认，then 积分立即调整并记录历史', async () => {
  // Given: 儿童当前积分为100
  const child = await createChild({ balance: 100 });
  const parent = await createParent({ familyId: child.familyId });

  // When: 家长填写积分调整表单并点击确认
  const response = await request(app)
    .post('/api/points/adjust')
    .set('Cookie', parentSession)
    .send({
      direction: 'increase',
      amount: 5,
      reason: '表现好',
      childId: child.id
    });

  // Then: 积分立即调整
  expect(response.status).toBe(200);
  const updatedChild = await getChild(child.id);
  expect(updatedChild.balance).toBe(105);

  // And: 积分历史记录显示调整原因
  const pointsHistory = await getPointsHistory(child.id);
  expect(pointsHistory[0].amount).toBe('+5');
  expect(pointsHistory[0].reason).toBe('家长加分：表现好');
  expect(pointsHistory[0].type).toBe('adjustment');
});
```

**Coverage Requirements:**
- Unit tests for PointsAdjustmentForm component validation
- Unit tests for PointsAdjustmentHistory component display
- Unit tests for API endpoint validation (amount range, required fields)
- Integration test for complete adjustment flow
- Test both positive and negative adjustments
- Test preset and custom reason inputs
- Test adjustment history view

### Performance Requirements (from PRD)

- API response time < 500ms (P95) [NFR3]
- Real-time sync delay < 3 seconds for points display update [NFR4]

### Security & Compliance

**COPPA/GDPR Compliance:**
- Points changes must be auditable (operation log) [NFR14]
- Parent must be authenticated for points adjustments
- Data retention: 3 years for points history [NFR18]
- Adjustment reason must be recorded

### Integration Notes

**Depends on:**
- Story 3.1: System Calculates Points on Task Approval (creates points settlement service)
- Story 3.2: Positive Points Reward (creates PointsDisplay component)
- Story 3.3: Negative Points Deduction (extends points calculator)
- Story 3.4: Points Settlement After Approval (adds parent approval check)
- Epic 1: User Authentication & Family Management (parent authentication)
- Database tables: point-balances, points

**Previous Story Intelligence (Story 3.1):**
- Story 3.1 creates `lib/services/points-calculator.ts` service
- Story 3.1 creates `lib/db/queries/points.ts` query file
- Story 3.1 implements atomic transaction for points transfer
- This story adds parent-initiated adjustment use case

**Previous Story Intelligence (Story 3.2):**
- Story 3.2 creates PointsDisplay component with positive formatting (green)
- This story reuses PointsDisplay for both positive and negative adjustments

**Previous Story Intelligence (Story 3.3):**
- Story 3.3 extends points calculator for negative points
- This story reuses negative points display formatting

**Previous Story Intelligence (Story 3.4):**
- Story 3.4 adds parent approval gate for task-based points
- This story bypasses approval for direct parent adjustments

**Triggers:**
- Story 3.10: Points change notification
- Story 3.11: Points milestone achievement notification

### Project Structure Notes

**Alignment with unified project structure:**
- New page route follows Next.js App Router conventions
- New components in `components/features/` follow feature component pattern
- Modifying existing `points-calculator.ts` and `PointsDisplay` component
- No conflicts detected

### References

**Functional Requirements:**
- FR24: 家长可以临时加减分 [Source: _bmad-output/planning-artifacts/prd.md#FR24]

**Non-Functional Requirements:**
- NFR3: API 响应时间 < 500ms（P95） [Source: _bmad-output/planning-artifacts/prd.md#NFR3]
- NFR4: 实时数据同步延迟 < 3秒 [Source: _bmad-output/planning-artifacts/prd.md#NFR4]
- NFR14: 操作日志审计（记录所有关键操作） [Source: _bmad-output/planning-artifacts/prd.md#NFR14]

**Architecture Decisions:**
- ADR-2: SQLite + Drizzle ORM (初期) → PostgreSQL升级路径（二期） [Source: _bmad-output/planning-artifacts/architecture.md#ADR-2]
- Database queries: Function-based (NOT Repository pattern) [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5]
- BDD Development: Given-When-Then format, tests BEFORE implementation [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5]

**Database Schema:**
- Point-balances table for child's current balance [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- Points table with `reason` field for history tracking [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]

**Acceptance Criteria:**
- AC9: 积分变动历史记录完整，支持按时间范围查询 [Source: _bmad-output/planning-artifacts/prd.md#AC9]

**UX Design Specifications:**
- Child-friendly UI with gamification elements [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Executive-Summary]
- Visual feedback (animations, progress bars, sound effects) [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Opportunities]
- Parent efficiency design: batch operations, data visualization [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Directions]

**Integration Points:**
- Points calculation triggered by parent-initiated adjustment [Source: _bmad-output/planning-artifacts/prd.md#Integration-Notes]

**Previous Story Intelligence:**
- Story 3.1 created points settlement service with atomic transactions
- Story 3.2 created PointsDisplay component with positive formatting (green)
- Story 3.3 extended points calculator for negative values and red display
- Story 3.4 added parent approval gate for task-based settlements
- This story adds direct parent adjustment capability (bypasses task approval)
- Reuses PointsDisplay component for formatting
- Reuses points calculator for settlement logic

## Dev Agent Record

### Agent Model Used
glm-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References
N/A

### Completion Notes List
Story context created from comprehensive analysis of epics.md, PRD, architecture.md, and UX specifications. Builds on Stories 3.1, 3.2, 3.3, and 3.4 foundation.

### File List
Story file: _bmad-output/implementation-artifacts/3-5-parent-temporary-points-adjustment.md
