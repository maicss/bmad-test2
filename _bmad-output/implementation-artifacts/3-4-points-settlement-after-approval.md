# Story 3.4: Points Settlement After Approval

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 在家长审批后才正式结算积分,
so that 积分发放有家长把关，确保公平性。

## Acceptance Criteria

1. Given 儿童标记任务完成
   When 家长审批通过
   Then 积分才正式结算到儿童账户
2. And 如果家长驳回，积分不发放
3. And 审批通过后，积分变动通知在3秒内推送给儿童（NFR4）
4. And 积分settlement为原子操作

## Tasks / Subtasks

- [ ] Task 1: Implement settlement transaction with parent approval check (AC: 1, 2, 4)
  - [ ] Subtask 1.1: Extend points calculator to check parent approval status
  - [ ] Subtask 1.2: Implement atomic transaction for settlement
  - [ ] Subtask 1.3: Add unit tests for rejection scenarios (no points awarded)
  - [ ] Subtask 1.4: Add unit tests for atomic transaction rollback
- [ ] Task 2: Ensure rejection prevents points settlement (AC: 2)
  - [ ] Subtask 2.1: Test that rejected tasks don't award points
  - [ ] Subtask 2.2: Verify task status reset to "待完成" on rejection
  - [ ] Subtask 2.3: Add integration test for rejection flow
- [ ] Task 3: Integrate settlement with task approval API (AC: 1, 3)
  - [ ] Subtask 3.1: Ensure settlement triggers only on parent approval
  - [ ] Subtask 3.2: Ensure notification sent within 3 seconds
  - [ ] Subtask 3.3: Add integration test for approval → settlement → notification flow
- [ ] Task 4: Enhance error handling and logging (AC: 4)
  - [ ] Subtask 4.1: Add comprehensive error logging for settlement failures
  - [ ] Subtask 4.2: Add unit tests for error scenarios

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
- Use Drizzle's `.transaction()` for atomic operations

**Database Schema References:**
- `tasks` table: contains task status (`status` field) and approval status
- `point-balances` table: stores child's current points balance
- `points` table: points history/ledger for tracking all changes
- Task approval status: `tasks.status` field ("completed", "rejected", "pending_approval")

**BDD Development Requirements:**
- Tests MUST use Given-When-Then format
- Tests MUST use business language (not technical terms)
- Tests MUST be written BEFORE implementation

### File Structure Requirements

**Files to Modify:**
```
lib/
├── services/
│   └── points-calculator.ts      # Extend for settlement with approval check
├── db/queries/
│   └── points.ts                 # Extend for settlement queries
└── notifications/
    └── push.ts                    # Notification service (verify 3-second delivery)

tests/
├── unit/
│   └── lib/
│       └── services/
│           └── points-calculator.spec.ts  # Extend for settlement tests
└── integration/
    └── api/
        └── tasks.spec.ts               # Extend for approval → settlement flow
```

### Testing Standards

**BDD Format Example:**
```typescript
it('given 儿童标记任务完成，when 家长审批通过，then 积分才正式结算到儿童账户', async () => {
  // Given: 儿童标记任务完成，当前积分为100
  const task = await createTask({ status: 'completed', points: 10 });
  const child = await createChild({ balance: 100 });

  // When: 家长审批通过
  const response = await request(app)
    .post(`/api/tasks/${task.id}/approve`)
    .set('Cookie', parentSession);

  // Then: 积分才正式结算到儿童账户
  expect(response.status).toBe(200);
  const updatedChild = await getChild(child.id);
  expect(updatedChild.balance).toBe(110);
});

it('given 儿童标记任务完成，when 家长驳回，then 积分不发放', async () => {
  // Given: 儿童标记任务完成，当前积分为100
  const task = await createTask({ status: 'completed', points: 10 });
  const child = await createChild({ balance: 100 });

  // When: 家长驳回
  const response = await request(app)
    .post(`/api/tasks/${task.id}/reject`)
    .send({ reason: '完成质量不达标' })
    .set('Cookie', parentSession);

  // Then: 积分不发放
  expect(response.status).toBe(200);
  const updatedChild = await getChild(child.id);
  expect(updatedChild.balance).toBe(100); // Balance unchanged

  // And: 任务状态变回"待完成"
  const updatedTask = await getTask(task.id);
  expect(updatedTask.status).toBe('待完成');
});

it('given 积分settlement为原子操作，when 数据库更新失败，then 所有变更回滚', async () => {
  // Given: 设置一个会失败的数据库场景
  const mockDbError = vi.spyOn(db, 'update').mockRejectedValueOnce(new Error('DB Error'));
  
  // When: 尝试结算积分
  const task = await createTask({ points: 10 });
  const child = await createChild({ balance: 100 });

  try {
    await settlePoints(task.id, child.id);
    fail('Should have thrown error');
  } catch (error) {
    // Then: 所有变更回滚
    expect(error).toBeInstanceOf(Error);
    const updatedChild = await getChild(child.id);
    expect(updatedChild.balance).toBe(100); // Original balance preserved
    
    const pointsHistory = await getPointsHistory(child.id);
    expect(pointsHistory).toHaveLength(0); // No history record created
  }
  
  mockDbError.mockRestore();
});
```

**Coverage Requirements:**
- Unit tests for settlement with parent approval check
- Unit tests for rejection scenarios (no points awarded)
- Unit tests for atomic transaction rollback
- Integration test for approval → settlement → notification flow
- Test notification delivery within 3 seconds

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
- Story 3.1: System Calculates Points on Task Approval (creates points settlement service)
- Story 3.2: Positive Points Reward (creates PointsDisplay component)
- Story 3.3: Negative Points Deduction (extends points calculator)
- Epic 2: Task approval workflow (Stories 2.10, 2.11)
- Database tables: tasks, point-balances, points

**Previous Story Intelligence (Story 3.1):**
- Story 3.1 creates `lib/services/points-calculator.ts` service
- Story 3.1 implements atomic transaction for points transfer
- This story adds parent approval check before settlement
- This story ensures settlement only happens on approval, not just task completion

**Triggers:**
- Story 3.10: Points change notification (triggered by settlement)
- Story 3.11: Points milestone achievement notification

### Project Structure Notes

**Alignment with unified project structure:**
- Extends existing `points-calculator.ts` from Story 3.1
- Reuses `lib/db/queries/points.ts` from Story 3.1
- No conflicts detected

### References

**Functional Requirements:**
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
- Tasks table with `status` field for approval status [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- Point-balances table for child's current balance [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- Points table for history/ledger tracking [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]

**Acceptance Criteria:**
- AC9: 积分变动历史记录完整，支持按时间范围查询 [Source: _bmad-output/planning-artifacts/prd.md#AC9]

**Integration Points:**
- Points settlement triggered by parent approval [Source: _bmad-output/planning-artifacts/prd.md#Integration-Notes]
- Triggers wish redemption eligibility check [Source: _bmad-output/planning-artifacts/prd.md#Integration-Notes]

**Previous Story Intelligence:**
- Story 3.1 created points settlement service with atomic transactions
- Story 3.2 created PointsDisplay component with formatting
- Story 3.3 extended points calculator for negative values
- This story ensures settlement only happens on parent approval, not task completion

## Dev Agent Record

### Agent Model Used
glm-4.7 (zai-coding-plan/glm-4.7)

### Debug Log References
N/A

### Completion Notes List
Story context created from comprehensive analysis of epics.md, PRD, architecture.md, and UX specifications. Builds on Stories 3.1, 3.2, and 3.3 foundation.

### File List
Story file: _bmad-output/implementation-artifacts/3-4-points-settlement-after-approval.md
