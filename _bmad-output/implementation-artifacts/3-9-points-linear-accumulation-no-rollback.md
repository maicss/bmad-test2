# Story 3.9: Points Linear Accumulation (No Rollback)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 积分线性叠加、不回退、可为负数,
So that 积分系统简单透明，家长和儿童都能理解。

## Acceptance Criteria

**Given** 儿童的积分账户
**When** 积分发生变动
**Then** 新积分 = 原积分 + 变动值（线性叠加）
**And** 积分只能通过新变动覆盖，永不回滚历史记录
**And** 积分可以为负数（账户可到负数）
**And** 积分历史记录永久保留，每笔变动都是独立记录

## Tasks / Subtasks

- [ ] Task 1: Design and create points history and point balances tables (AC: #1, #2, #4)
  - [ ] Subtask 1.1: Create `points_history` table schema with all required fields
  - [ ] Subtask 1.2: Create `point_balances` table schema for current balance tracking
  - [ ] Subtask 1.3: Generate and apply database migration
  - [ ] Subtask 1.4: Add indexes for performance optimization

- [ ] Task 2: Implement points calculation logic (AC: #1, #2)
  - [ ] Subtask 2.1: Create `lib/db/queries/points.ts` with addPoints and deductPoints functions
  - [ ] Subtask 2.2: Implement linear accumulation formula: new_balance = old_balance + delta
  - [ ] Subtask 2.3: Ensure atomic transaction for points updates
  - [ ] Subtask 2.4: Handle negative balances correctly (no minimum constraint)

- [ ] Task 3: Implement points history tracking (AC: #4)
  - [ ] Subtask 3.1: Create function to record every points change in history table
  - [ ] Subtask 3.2: Ensure history records are immutable (no updates/deletes)
  - [ ] Subtask 3.3: Include all metadata in history: type, amount, reason, related_task_id
  - [ ] Subtask 3.4: Add timestamp for each history record

- [ ] Task 4: Create API endpoints for points operations (AC: #1)
  - [ ] Subtask 4.1: POST /api/points/add - Add points to user account
  - [ ] Subtask 4.2: POST /api/points/deduct - Deduct points from user account
  - [ ] Subtask 4.3: GET /api/points/balance - Get current balance for user
  - [ ] Subtask 4.4: GET /api/points/history - Get points history with pagination

- [ ] Task 5: Write comprehensive tests (AC: All)
  - [ ] Subtask 5.1: Test linear accumulation with positive values
  - [ ] Subtask 5.2: Test linear accumulation with negative values
  - [ ] Subtask 5.3: Test negative balance support
  - [ ] Subtask 5.4: Test history record immutability
  - [ ] Subtask 5.5: Test concurrent points updates (transaction isolation)

- [ ] Task 6: Update documentation and schemas (AC: All)
  - [ ] Subtask 6.1: Update database schema documentation
  - [ ] Subtask 6.2: Add type definitions for points-related operations
  - [ ] Subtask 6.3: Document points calculation rules in code comments

## Dev Notes

### Architecture Patterns and Constraints

**Database Schema Design:**

- **MUST** create `points_history` table to track every points transaction permanently
- **MUST** create `point_balances` table to store current balance per user
- **MUST** use Drizzle ORM for all database operations (NO raw SQL)
- **MUST** follow lib/db/queries/ directory structure (create `lib/db/queries/points.ts`)

**Database Schema Definitions:**

```typescript
// database/schema/points-history.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { children } from './children';

export const pointsHistory = sqliteTable('points_history', {
  id: text('id').primaryKey(),
  childId: text('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  taskId: text('task_id'), // Optional: NULL for manual adjustments or redemptions
  type: text('type').notNull(), // 'task_reward', 'manual_adjust', 'wish_redemption'
  amount: integer('amount').notNull(), // Can be positive or negative
  balance: integer('balance').notNull(), // Balance after this transaction
  reason: text('reason'), // Optional: Task name or adjustment reason
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  // Index for querying child's history
  index('idx_points_history_child_id').on(table.childId),
  // Index for querying by type
  index('idx_points_history_type').on(table.type),
  // Index for time-range queries
  index('idx_points_history_created_at').on(table.createdAt),
  // Composite index for child + time queries (common pattern)
  index('idx_points_history_child_created').on(table.childId, table.createdAt),
]);

// database/schema/point-balances.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { children } from './children';

export const pointBalances = sqliteTable('point_balances', {
  id: text('id').primaryKey(),
  childId: text('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  balance: integer('balance').notNull().default(0), // Current balance (can be negative)
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  // Unique index: one balance record per child
  index('idx_point_balances_child_id_unique').on(table.childId),
  // Index for balance queries
  index('idx_point_balances_child_id').on(table.childId),
]);

// Table Relationships:
// - pointsHistory.childId → children.id (Foreign Key, cascade delete)
// - pointBalances.childId → children.id (Foreign Key, cascade delete)
// - pointBalances is denormalized cache: balance = SUM(pointsHistory.amount) for each child
// - pointBalances updated via triggers or application logic for performance

// Query Patterns:
// - Get current balance: SELECT * FROM point_balances WHERE child_id = ?
// - Get history with pagination: SELECT * FROM points_history WHERE child_id = ? ORDER BY created_at DESC LIMIT 20
// - Time range query: SELECT * FROM points_history WHERE child_id = ? AND created_at >= ? AND created_at <= ?
```

**Points Calculation Rules:**
- Linear accumulation: `new_balance = old_balance + delta` where delta can be positive or negative
- No rollback: Once a points change is recorded, it's permanent
- Negative balance allowed: Balance can go below zero (account can have negative points)
- History immutability: Points history records are append-only, never modified or deleted

**Transaction Safety:**
- All points updates MUST be atomic transactions
- Balance update AND history insert must succeed or fail together
- Use Drizzle's transaction API: `db.transaction(async (tx) => { ... })`

### Source Tree Components to Touch

**New Files to Create:**
- `lib/db/schema/points-history.ts` - Points history table schema
- `lib/db/schema/point-balances.ts` - Point balances table schema
- `lib/db/queries/points.ts` - Points operations query functions
- `app/api/points/add/route.ts` - API endpoint for adding points
- `app/api/points/deduct/route.ts` - API endpoint for deducting points
- `app/api/points/balance/route.ts` - API endpoint for getting balance
- `app/api/points/history/route.ts` - API endpoint for points history
- `tests/integration/points-accumulation.test.ts` - Integration tests

**Files to Modify:**
- `lib/db/schema/index.ts` - Export new tables
- `database/migrations/YYYYMMDDHHMMSS_points_system.sql` - Migration file

### Testing Standards Summary

**BDD Format Required:**
- Use Given-When-Then format for all tests
- Business language, not technical terms
- Tests MUST be written before implementation (Red-Green-Refactor)

**Test Coverage:**
- Core points calculation logic: 95%+ coverage
- API endpoints: 100% coverage
- Transaction handling: Test all failure scenarios

**Test Isolation:**
- Use beforeEach to cleanup database state
- Use real database (NO mocking for database operations)
- Tests run serially due to shared state

### Project Structure Notes

**Alignment with Unified Project Structure:**
- Follow lib/db/queries/ pattern (function-based, per-table files)
- Use TypeScript strict mode (no `any` types)
- All files ≤ 800 lines (split if necessary)
- Use Bun native APIs (Bun.randomUUIDv7() for IDs)

**Detected Conflicts or Variances:**
- None - this is a new feature, no conflicts with existing code

**Story Responsibility - Base Infrastructure:**
- **This story (3.9) provides**:
  - Database table schemas: `points_history` and `point_balances`
  - Core transaction utility functions: `addPoints()`, `deductPoints()`, `getBalance()`
  - Atomic transaction implementation using Drizzle's `db.transaction()`
  - These functions do NOT check task approval status (business logic)

- **Other stories extend this base**:
  - **Story 3.4**: Adds parent approval check before calling `addPoints()`
  - **Story 3.5**: Calls `addPoints()` / `deductPoints()` for manual adjustments
  - **Epic 4**: Calls `deductPoints()` for wish redemptions
  - Each story adds its own business logic (approval check, validation, etc.) before calling base functions

**Example Integration Pattern:**
```typescript
// This story (3.9) provides - lib/services/points-calculator.ts:
export async function addPointsToChild(
  childId: string,
  amount: number,
  reason: string,
  taskId?: string
): Promise<void> {
  await db.transaction(async (tx) => {
    // Update balance
    const currentBalance = await getBalance(tx, childId);
    const newBalance = currentBalance + amount;

    await tx.update(pointBalances)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(pointBalances.childId, childId));

    // Insert history record
    await tx.insert(pointsHistory).values({
      id: uuid(),
      childId,
      taskId,
      type: 'task_reward',
      amount,
      balance: newBalance,
      reason,
      createdAt: new Date(),
    });
  });
}

// Story 3.4 extends - app/api/tasks/[id]/approve/route.ts:
export async function POST(req: NextRequest, { params }) {
  // Parent approval check (business logic)
  const task = await getTask(params.id);
  if (task.status !== 'pending_approval') {
    throw new Error('Task not ready for approval');
  }

  // Call Story 3.9's base function
  await addPointsToChild(childId, task.points, `任务奖励：${task.title}`, task.id);

  // Update task status
  await updateTaskStatus(task.id, 'completed');
}
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.9](epics.md#Story-3.9) - Story requirements and acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-2](architecture.md#ADR-2) - Database selection (SQLite)
- [Source: _bmad-output/project-context.md#Critical-Implementation-Rules](project-context.md#Critical-Implementation-Rules) - Database operations MUST use Drizzle ORM
- [Source: _bmad-output/project-context.md#Bun-Built-in-Tools](project-context.md#Bun-Built-in-Tools) - Use Bun native APIs
- [Source: docs/TECH_SPEC_DATABASE.md](docs/TECH_SPEC_DATABASE.md) - Database specification

## Dev Agent Record

### Agent Model Used

Claude 4.7 (zai-coding-plan/glm-4.7)

### Debug Log References

### Completion Notes List

### File List
