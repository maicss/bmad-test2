# Story 3.1: System Calculates Points on Task Approval

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 在任务审批通过后自动计算积分,
so that 儿童可以根据任务价值获得相应的积分奖励。

## Acceptance Criteria

1. Given 家长审批通过了一个任务完成
   When 审批操作被确认
   Then 系统自动计算该任务的积分值
2. And 积分从系统账户转移到儿童账户（原子事务）
3. And 积分变动记录到积分历史表
4. And 儿童实时收到积分变动通知
5. And 如果任务为负向积分（惩罚），则从儿童账户扣除
6. And 积分settlement事务必须具有原子性（要么全部成功，要么全部回滚）

## Tasks / Subtasks

- [ ] Task 1: Create points settlement service (AC: 1, 2, 6)
  - [ ] Subtask 1.1: Create `lib/services/points-calculator.ts` service
  - [ ] Subtask 1.2: Implement atomic transaction for points transfer
  - [ ] Subtask 1.3: Add unit tests for atomic transaction rollback scenarios
- [ ] Task 2: Integrate points settlement with task approval API (AC: 1)
  - [ ] Subtask 2.1: Modify `/api/tasks/[id]/approve` endpoint to trigger points calculation
  - [ ] Subtask 2.2: Add integration test for task approval → points settlement flow
  - [ ] Subtask 2.3: Verify Drizzle ORM transaction isolation
- [ ] Task 3: Create points history recording (AC: 3)
  - [ ] Subtask 3.1: Create database query functions in `lib/db/queries/points.ts`
  - [ ] Subtask 3.2: Implement points history insertion on settlement
  - [ ] Subtask 3.3: Add unit tests for points history recording
- [ ] Task 4: Implement points change notification (AC: 4)
  - [ ] Subtask 4.1: Create notification in `lib/notifications/push.ts`
  - [ ] Subtask 4.2: Send real-time notification to child device
  - [ ] Subtask 4.3: Add integration test for notification delivery (< 3 seconds)
- [ ] Task 5: Handle negative points deduction (AC: 5)
  - [ ] Subtask 5.1: Extend points calculator to support negative values
  - [ ] Subtask 5.2: Verify account balance can go negative (per FR28)
  - [ ] Subtask 5.3: Add unit tests for negative points scenarios

## Dev Notes

### Architecture Patterns & Constraints

**Database Queries (RED LIST - MUST FOLLOW):**
- Location: `lib/db/queries/` directory, split by table
- Points queries file: `lib/db/queries/points.ts`
- MUST use Drizzle ORM query builder (NEVER native SQL or string concatenation)
- Export functions, NOT Repository pattern

**Technology Stack (from architecture.md):**
- Runtime: Bun 1.3.x+ (NO Node.js compatibility layer)
- Database: bun:sqlite + Drizzle ORM 0.45.x+
- Use Drizzle's `.transaction()` for atomic operations

**Database Schema References:**
- `tasks` table: contains task points value (`points` field)
- `point-balances` table: stores child's current points balance
- `points` table: points history/ledger for tracking all changes
- Task approval status: `tasks.status` field ("completed", "rejected")

**BDD Development Requirements:**
- Tests MUST use Given-When-Then format
- Tests MUST use business language (not technical terms)
- Tests MUST be written BEFORE implementation

### File Structure Requirements

**Files to Create:**
```
lib/
├── services/
│   └── points-calculator.ts      # Points settlement service
├── db/queries/
│   └── points.ts                 # Points database queries (NEW file)
lib/notifications/
    └── push.ts                    # Push notification service

tests/
├── unit/
│   └── lib/
│       └── services/
│           └── points-calculator.spec.ts
└── integration/
    └── api/
        └── tasks.spec.ts
```

**API Routes to Modify:**
- `app/api/tasks/[id]/approve/route.ts` - Integrate points settlement

### Testing Standards

**BDD Format Example:**
```typescript
it('given 家长审批通过任务完成，when 审批被确认，then 积分自动计算并转移到儿童账户', async () => {
  // Given: 任务已存在且需要家长审批，儿童当前积分为100
  const task = await createTask({ points: 10, status: 'pending_approval' });
  const child = await createChild({ balance: 100 });

  // When: 家长审批通过任务
  const response = await request(app)
    .post(`/api/tasks/${task.id}/approve`)
    .set('Cookie', parentSession);

  // Then: 任务标记为已完成，儿童积分增加到110
  expect(response.status).toBe(200);
  const updatedChild = await getChild(child.id);
  expect(updatedChild.balance).toBe(110);

  // And: 积分历史记录包含此次变动
  const pointsHistory = await getPointsHistory(child.id);
  expect(pointsHistory).toHaveLength(1);
  expect(pointsHistory[0].amount).toBe(10);
  expect(pointsHistory[0].reason).toContain('任务奖励');
});
```

**Coverage Requirements:**
- Unit tests for `points-calculator.ts` service
- Integration tests for approval → settlement flow
- Test rollback scenarios (partial failures)
- Test negative points deduction
- Test concurrent approvals (transaction isolation)

### Performance Requirements (from PRD)

- API response time < 500ms (P95) [NFR3]
- Points settlement must be atomic
- Real-time sync delay < 3 seconds for notification [NFR4]

### Security & Compliance

**COPPA/GDPR Compliance:**
- Points changes must be auditable (operation log) [NFR14]
- Parent approval required for all points settlements [FR23]
- Data retention: 3 years for points history [NFR18]

### Integration Notes

**Depends on:**
- Epic 2: Task approval workflow (Stories 2.10, 2.11)
- Database tables: tasks, point-balances, points

**Triggers:**
- Epic 4: Wish redemption eligibility check (Story 4.4)
- Story 3.10: Points change notification
- Story 3.11: Points milestone notification

### Project Structure Notes

**Alignment with unified project structure:**
- Queries file `lib/db/queries/points.ts` follows per-table pattern
- Service `lib/services/points-calculator.ts` follows service layer pattern
- No conflicts detected

### References

**Functional Requirements:**
- FR20: 系统根据任务完成情况计算积分 [Source: _bmad-output/planning-artifacts/prd.md#FR20]
- FR21: 系统支持正向积分（好行为奖励） [Source: _bmad-output/planning-artifacts/prd.md#FR21]
- FR22: 系统支持负向积分（坏行为扣除） [Source: _bmad-output/planning-artifacts/prd.md#FR22]
- FR23: 家长审批后积分才正式结算 [Source: _bmad-output/planning-artifacts/prd.md#FR23]
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
- Tasks table with `points` field [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- Point-balances table for child's current balance [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- Points table for history/ledger tracking [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]

**Acceptance Criteria:**
- AC9: 积分变动历史记录完整，支持按时间范围查询 [Source: _bmad-output/planning-artifacts/prd.md#AC9]
- AC11: 积分可以为负数，最低显示-999分，超额负数显示为"需努力" [Source: _bmad-output/planning-artifacts/prd.md#AC11]

**Integration Points:**
- Points calculation triggered by task approval [Source: _bmad-output/planning-artifacts/prd.md#Integration-Notes]
- Triggers wish redemption eligibility check [Source: _bmad-output/planning-artifacts/prd.md#Integration-Notes]

**Previous Story Intelligence:**
- N/A (First story in Epic 3)

## Dev Agent Record

### Agent Model Used
glm-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References
N/A

### Completion Notes List
Story context created from comprehensive analysis of epics.md, PRD, architecture.md, and UX specifications.

### File List
Story file: _bmad-output/implementation-artifacts/3-1-system-calculates-points-on-task-approval.md
