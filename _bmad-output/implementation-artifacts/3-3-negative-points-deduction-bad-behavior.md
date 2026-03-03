# Story 3.3: Negative Points Deduction (Bad Behavior)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 支持负向积分扣除,
so that 不良行为可以扣除积分，形成约束机制。

## Acceptance Criteria

1. Given 家长手动扣除儿童积分（负向积分）
   When 家长确认扣除操作
   Then 负向积分从儿童账户扣除
2. And 积分可以为负数（账户可到负数，见FR28）
3. And 积分显示为红色"-N"标识
4. And 积分历史记录显示为"家长扣分：{原因}"
5. And 负分需记录原因到审计日志

## Tasks / Subtasks

- [ ] Task 1: Implement negative points API endpoint (AC: 1, 2)
  - [ ] Subtask 1.1: Create `/api/points/deduct` endpoint with parent authentication
  - [ ] Subtask 1.2: Validate deduction amount and child balance constraints
  - [ ] Subtask 1.3: Add unit tests for negative points deduction
- [ ] Task 2: Implement negative points display (AC: 3)
  - [ ] Subtask 2.1: Extend PointsDisplay component with red color for negative values
  - [ ] Subtask 2.2: Add "-N" visual format for negative points changes
  - [ ] Subtask 2.3: Add unit tests for negative points display formatting
- [ ] Task 3: Create points history with deduction reason (AC: 4, 5)
  - [ ] Subtask 3.1: Update points calculator to generate "家长扣分：{原因}" description
  - [ ] Subtask 3.2: Add integration test for points history with deduction reason
  - [ ] Subtask 3.3: Verify audit log captures deduction reason
- [ ] Task 4: Integrate with points settlement from Story 3.1 (AC: 1, 2, 4)
  - [ ] Subtask 4.1: Ensure negative points use red display format
  - [ ] Subtask 4.2: Ensure points history records deduction reason
  - [ ] Subtask 4.3: Add integration test for complete negative deduction flow

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
- Negative points must be supported (no minimum balance constraint)
- Audit log should capture deduction reason

**BDD Development Requirements:**
- Tests MUST use Given-When-Then format
- Tests MUST use business language (not technical terms)
- Tests MUST be written BEFORE implementation

### File Structure Requirements

**Files to Create:**
```
lib/
├── services/
│   └── points-calculator.ts      # Update for negative points deduction
├── db/queries/
│   └── points.ts                 # Extend for deduction queries
└── components/
    └── features/
        └── points-display.tsx     # Update for negative display

tests/
├── unit/
│   ├── lib/
│   │   ├── services/
│   │   │   └── points-calculator.spec.ts  # Extend for negative tests
│   │   └── components/
│   │       └── points-display.spec.ts     # Extend for negative display
└── integration/
    └── api/
        └── points.spec.ts          # NEW: Negative points API tests
```

**API Routes to Create:**
- `app/api/points/deduct/route.ts` - Parent-initiated points deduction

### Testing Standards

**BDD Format Example:**
```typescript
it('given 家长手动扣除儿童积分（负向积分），when 家长确认扣除操作，then 负向积分从儿童账户扣除', async () => {
  // Given: 儿童当前积分为100
  const child = await createChild({ balance: 100 });
  const parent = await createParent({ familyId: child.familyId });

  // When: 家长确认扣除操作（扣除5分，原因：不听话）
  const response = await request(app)
    .post('/api/points/deduct')
    .set('Cookie', parentSession)
    .send({
      childId: child.id,
      amount: -5,
      reason: '不听话'
    });

  // Then: 负向积分从儿童账户扣除
  expect(response.status).toBe(200);
  const updatedChild = await getChild(child.id);
  expect(updatedChild.balance).toBe(95);

  // And: 积分显示为红色"-N"标识
  const pointsDisplay = response.body.pointsChange;
  expect(pointsDisplay.amount).toBe('-5');
  expect(pointsDisplay.color).toBe('red');

  // And: 积分历史记录显示为"家长扣分：{原因}"
  const pointsHistory = await getPointsHistory(child.id);
  expect(pointsHistory[0].reason).toBe('家长扣分：不听话');

  // And: 负分需记录原因到审计日志
  const auditLog = await getAuditLog();
  expect(auditLog).toHaveLength(1);
  expect(auditLog[0].action).toBe('points_deduction');
  expect(auditLog[0].reason).toBe('不听话');
});
```

**Coverage Requirements:**
- Unit tests for negative points deduction API endpoint
- Unit tests for PointsDisplay component negative formatting
- Unit tests for points history reason generation
- Integration test for complete negative deduction flow
- Test various negative point values (1-100 range)
- Test balance going negative (per FR28)
- Test audit log captures deduction reason

### Performance Requirements (from PRD)

- API response time < 500ms (P95) [NFR3]
- Real-time sync delay < 3 seconds for points display update [NFR4]

### Security & Compliance

**COPPA/GDPR Compliance:**
- Points changes must be auditable (operation log) [NFR14]
- Parent must be authenticated for points deductions
- Data retention: 3 years for points history [NFR18]
- Audit log must capture reason for negative deductions

### Integration Notes

**Depends on:**
- Story 3.1: System Calculates Points on Task Approval (creates points settlement service)
- Story 3.2: Positive Points Reward (creates PointsDisplay component)
- Epic 1: User Authentication & Family Management (parent authentication)
- Database tables: point-balances, points

**Previous Story Intelligence (Story 3.1):**
- Story 3.1 creates `lib/services/points-calculator.ts` service
- Story 3.1 creates `lib/db/queries/points.ts` query file
- Story 3.1 implements atomic transaction for points transfer
- This story extends settlement service for parent-initiated negative deductions

**Previous Story Intelligence (Story 3.2):**
- Story 3.2 creates PointsDisplay component
- This story extends PointsDisplay for negative value formatting

**Triggers:**
- Story 3.10: Points change notification
- Story 3.11: Points milestone achievement notification

### Project Structure Notes

**Alignment with unified project structure:**
- New API endpoint follows Next.js App Router conventions
- Modifying existing `points-calculator.ts` and `PointsDisplay` component
- No conflicts detected

### References

**Functional Requirements:**
- FR22: 系统支持负向积分（坏行为扣除） [Source: _bmad-output/planning-artifacts/prd.md#FR22]
- FR24: 家长可以临时加减分 [Source: _bmad-output/planning-artifacts/prd.md#FR24]
- FR28: 积分变动线性叠加，不回退，可为负数 [Source: _bmad-output/planning-artifacts/prd.md#FR28]

**Non-Functional Requirements:**
- NFR3: API 响应时间 < 500ms（P95） [Source: _bmad-output/planning-artifacts/prd.md#NFR3]
- NFR4: 实时数据同步延迟 < 3秒 [Source: _bmad-output/planning-artifacts/prd.md#NFR4]
- NFR14: 操作日志审计（记录所有关键操作） [Source: _bmad-output/planning-artifacts/prd.md#NFR14]

**Architecture Decisions:**
- ADR-2: SQLite + Drizzle ORM (初期) → PostgreSQL升级路径（二期） [Source: _bmad-output/planning-artifacts/architecture.md#ADR-2]
- Database queries: Function-based (NOT Repository pattern) [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5]
- BDD Development: Given-When-Then format, tests BEFORE implementation [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5]

**Database Schema:**
- Point-balances table for child's current balance (no minimum constraint) [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- Points table with `reason` field for history tracking [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]

**Acceptance Criteria:**
- AC11: 积分可以为负数，最低显示-999分，超额负数显示为"需努力" [Source: _bmad-output/planning-artifacts/prd.md#AC11]

**UX Design Specifications:**
- Child-friendly UI with gamification elements [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Executive-Summary]
- Visual feedback (animations, progress bars, sound effects) [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Opportunities]
- Color system: Error red for negative points [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-System-Foundation]

**Integration Points:**
- Points calculation triggered by parent-initiated deduction [Source: _bmad-output/planning-artifacts/prd.md#Integration-Notes]

**Previous Story Intelligence:**
- Story 3.1 created points settlement service with atomic transactions
- Story 3.2 created PointsDisplay component with positive formatting
- This story extends both for negative points support

## Dev Agent Record

### Agent Model Used
glm-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References
N/A

### Completion Notes List
Story context created from comprehensive analysis of epics.md, PRD, architecture.md, and UX specifications. Builds on Stories 3.1 and 3.2 foundation.

### File List
Story file: _bmad-output/implementation-artifacts/3-3-negative-points-deduction-bad-behavior.md
