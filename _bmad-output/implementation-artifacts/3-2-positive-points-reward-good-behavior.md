# Story 3.2: Positive Points Reward (Good Behavior)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 支持正向积分奖励,
so that 好的行为可以获得积分奖励，激励儿童保持良好习惯。

## Acceptance Criteria

1. Given 任务模板设置了正向积分值
   When 任务完成并通过家长审批
   Then 正向积分值累加到儿童账户
2. And 积分显示为绿色"+N"标识
3. And 积分历史记录显示为"任务奖励：{任务名称}"

## Tasks / Subtasks

- [ ] Task 1: Implement positive points display (AC: 2)
  - [ ] Subtask 1.1: Create PointsDisplay component with green color for positive values
  - [ ] Subtask 1.2: Add "+N" visual format for positive points changes
  - [ ] Subtask 1.3: Add unit tests for points display formatting
- [ ] Task 2: Enhance points history description (AC: 3)
  - [ ] Subtask 2.1: Update points calculator to generate "任务奖励：{任务名称}" description
  - [ ] Subtask 2.2: Add integration test for points history with task name
  - [ ] Subtask 2.3: Verify points history query includes task name field
- [ ] Task 3: Integrate with points settlement from Story 3.1 (AC: 1, 2, 3)
  - [ ] Subtask 3.1: Ensure positive points use green display format
  - [ ] Subtask 3.2: Ensure points history records task name for positive rewards
  - [ ] Subtask 3.3: Add integration test for complete positive reward flow

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
- `tasks` table: contains task name (`title` field) and points value (`points` field)
- `point-balances` table: stores child's current points balance
- `points` table: points history/ledger for tracking all changes with `reason` field
- Points history should include task name reference for "任务奖励：{任务名称}" format

**BDD Development Requirements:**
- Tests MUST use Given-When-Then format
- Tests MUST use business language (not technical terms)
- Tests MUST be written BEFORE implementation

### File Structure Requirements

**Files to Modify:**
```
lib/
├── services/
│   └── points-calculator.ts      # Update for task name in reason
├── db/queries/
│   └── points.ts                 # Add task name to history query
└── components/
    └── features/
        └── points-display.tsx     # NEW: Points display component

tests/
├── unit/
│   ├── lib/
│   │   └── components/
│   │       └── points-display.spec.ts  # NEW
└── integration/
    └── api/
        └── tasks.spec.ts          # Extend for positive reward tests
```

### Testing Standards

**BDD Format Example:**
```typescript
it('given 任务模板设置了正向积分值，when 任务完成并通过家长审批，then 正向积分值累加到儿童账户并显示为绿色+N', async () => {
  // Given: 任务模板设置了正向积分值
  const taskPlan = await createTaskPlan({ points: 10 });
  const task = await createTask({ taskPlanId: taskPlan.id, title: '刷牙任务' });
  const child = await createChild({ balance: 100 });

  // When: 任务完成并通过家长审批
  const response = await request(app)
    .post(`/api/tasks/${task.id}/approve`)
    .set('Cookie', parentSession);

  // Then: 正向积分值累加到儿童账户
  expect(response.status).toBe(200);
  const updatedChild = await getChild(child.id);
  expect(updatedChild.balance).toBe(110);

  // And: 积分显示为绿色"+N"标识
  const pointsDisplay = response.body.pointsChange;
  expect(pointsDisplay.amount).toBe('+10');
  expect(pointsDisplay.color).toBe('green');

  // And: 积分历史记录显示为"任务奖励：{任务名称}"
  const pointsHistory = await getPointsHistory(child.id);
  expect(pointsHistory[0].reason).toBe('任务奖励：刷牙任务');
});
```

**Coverage Requirements:**
- Unit tests for PointsDisplay component color/formatting
- Unit tests for points history reason generation
- Integration test for complete positive reward flow
- Test various positive point values (1-100 range)

### Performance Requirements (from PRD)

- API response time < 500ms (P95) [NFR3]
- Real-time sync delay < 3 seconds for points display update [NFR4]

### Security & Compliance

**COPPA/GDPR Compliance:**
- Points changes must be auditable (operation log) [NFR14]
- Parent approval required for all positive points settlements [FR23]
- Data retention: 3 years for points history [NFR18]

### Integration Notes

**Depends on:**
- Story 3.1: System Calculates Points on Task Approval (already creates points settlement service)
- Epic 2: Task approval workflow (Stories 2.10, 2.11)
- Database tables: tasks, point-balances, points

**Previous Story Intelligence (Story 3.1):**
- Story 3.1 creates `lib/services/points-calculator.ts` service
- Story 3.1 creates `lib/db/queries/points.ts` query file
- Story 3.1 implements atomic transaction for points transfer
- This story extends the settlement service to enhance UX for positive points

**Triggers:**
- Story 3.10: Points change notification
- Story 3.11: Points milestone achievement notification

### Project Structure Notes

**Alignment with unified project structure:**
- PointsDisplay component in `components/features/` follows feature component pattern
- Modifying existing `points-calculator.ts` from Story 3.1
- No conflicts detected

### References

**Functional Requirements:**
- FR21: 系统支持正向积分（好行为奖励） [Source: _bmad-output/planning-artifacts/prd.md#FR21]
- FR23: 家长审批后积分才正式结算 [Source: _bmad-output/planning-artifacts/prd.md#FR23]

**Non-Functional Requirements:**
- NFR3: API 响应时间 < 500ms（P95） [Source: _bmad-output/planning-artifacts/prd.md#NFR3]
- NFR4: 实时数据同步延迟 < 3秒 [Source: _bmad-output/planning-artifacts/prd.md#NFR4]
- NFR14: 操作日志审计（记录所有关键操作） [Source: _bmad-output/planning-artifacts/prd.md#NFR14]

**Architecture Decisions:**
- ADR-2: SQLite + Drizzle ORM (初期) → PostgreSQL升级路径（二期） [Source: _bmad-output/planning-artifacts/architecture.md#ADR-2]
- Database queries: Function-based (NOT Repository pattern) [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5]
- BDD Development: Given-When-Then format, tests BEFORE implementation [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5]

**Database Schema:**
- Tasks table with `points` and `title` fields [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- Points table with `reason` field for history tracking [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]

**Acceptance Criteria:**
- AC9: 积分变动历史记录完整，支持按时间范围查询 [Source: _bmad-output/planning-artifacts/prd.md#AC9]

**UX Design Specifications:**
- Child-friendly UI with gamification elements [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Executive-Summary]
- Visual feedback (animations, progress bars, sound effects) [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Opportunities]
- Color system: Success green for positive points [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-System-Foundation]

**Integration Points:**
- Points calculation triggered by task approval [Source: _bmad-output/planning-artifacts/prd.md#Integration-Notes]

**Previous Story Intelligence:**
- Story 3.1 created points settlement service with atomic transactions
- This story enhances the UX of positive points display
- Reuse `lib/db/queries/points.ts` created in Story 3.1

## Dev Agent Record

### Agent Model Used
glm-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References
N/A

### Completion Notes List
Story context created from comprehensive analysis of epics.md, PRD, architecture.md, and UX specifications. Builds on Story 3.1 foundation.

### File List
Story file: _bmad-output/implementation-artifacts/3-2-positive-points-reward-good-behavior.md
