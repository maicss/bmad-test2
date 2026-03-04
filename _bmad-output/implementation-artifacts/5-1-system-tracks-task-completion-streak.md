# Story 5.1: System Tracks Task Completion Streak
# Status: ready-for-dev

## Story

As a 系统,
I want 追踪任务连续完成次数,
So that 我可以记录儿童连续完成任务的日数，为Combo奖励提供依据。

## Acceptance Criteria

### Streak Detection and Recording (AC#1-#5)

1. Given 儿童账户存在且关联了任务计划模板
   When 儿童完成并通过家长审批一个任务时
   Then 系统检查该任务是否属于有效的任务计划（task_plan_id不为空）
   And 如果task_plan_id为空，不触发streak计数

2. Given 任务属于有效的任务计划
   When 任务审批通过时
   Then 系统获取该任务的任务类型（task_type：brush/teach/exercise/chores/custom）
   And 获取该任务的适用儿童ID
   And 获取任务的完成日期（北京时间）

3. Given 系统获取到任务类型和儿童ID
   When 任务审批通过时
   Then 系统增加该儿童在该任务类型的连续完成计数
   And 计数存储在儿童账户的streak_data JSON字段中
   And 格式：`{ "brush": { "current": 5, "lastDate": "2026-03-04", "firstDate": "2026-02-28" } }`

4. Given 儿童在同一任务类型上已有连续计数
   When 儿童在同一天再次完成同一类型的任务
   Then 系统不增加计数（同一天只计数1次）
   And lastDate保持不变
   And 记录该任务为同一天完成的重复任务（用于统计）

5. Given 儿童在某一天没有完成某个类型的任务
   When 次日（北京时间0点后）该儿童完成同一类型的新任务
   Then 该任务类型的连续计数重置为1（从1开始重新计数）
   And 更新firstDate为当前日期
   And 更新lastDate为当前日期
   And 记录中断原因到streak_history表

### Streak History Recording (AC#6)

6. Given 儿童连续计数被重置
   When 计数重置时
   Then 系统记录上一次连续完成的天数到历史记录表streak_history
   And 记录开始日期（firstDate）和结束日期（lastDate）
   And 记录中断原因（new_day_break, manual_reset, task_plan_disabled）
   And 记录创建时间戳

### Independent Task Type Tracking (AC#7)

7. Given 儿童有多个任务计划模板
   When 系统追踪计数时
   Then 每个任务类型独立追踪计数（如刷牙计数、学习计数、运动计数）
   And 不同任务类型的streak互不影响
   And 每个任务类型有独立的firstDate和lastDate

### Combo Threshold Check (AC#8)

8. Given 家长配置了Combo规则
   When 连续计数达到或超过Combo阈值时
   Then 系统触发Combo奖励结算流程（见Story 5.2和5.3）
   And 传递参数：childId, taskType, streakCount, startDate
   And 不影响streak计数本身

### New Day Reset (AC#9)

9. Given 跨天时间点（北京时间每日0点）
   When 系统时钟到达0点
   Then 重置当天的首次完成标记，允许次日重新计数
   And 不主动重置streak计数（等待实际完成或不完成触发重置）
   And 系统运行后台任务检查是否有未完成的任务类型

### Data Initialization (AC#10)

10. Given streak_data字段不存在或为空
    When 首次追踪时
    Then 初始化streak_data为空JSON对象，然后增加计数
    And 避免JSON解析错误
    And 支持增量更新（不影响其他任务类型的数据）

### Task Plan State Check (AC#11)

11. Given 任务计划模板被禁用或删除
    When 儿童完成关联该模板的任务
    Then 系统不触发streak计数
    And 如果该类型已有streak计数，保持不变
    And 不重置现有streak

### Timezone Handling (AC#12-#13)

12. Given 跨时区使用场景
    When 计算日期时
    Then 统一使用北京时间（UTC+8）
    And 使用 `Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai' })` 获取当前日期
    And 存储的日期格式为 YYYY-MM-DD

13. Given 儿童在不同时区完成任务
    When 审批通过时
    Then 系统根据服务器时区（北京时间）计算完成日期
    And 不根据儿童设备的时区计算
    And 保证所有儿童使用相同的日期边界

### Concurrent Task Approval (AC#14)

14. Given 多个任务同时审批通过
    When 系统处理streak计数时
    Then 使用数据库事务保证原子性
    And 防止并发更新导致streak计数错误
    And 使用乐观锁或行级锁

### Streak Data Integrity (AC#15)

15. Given streak_data JSON字段被损坏或格式错误
    When 读取streak数据时
    Then 系统记录错误日志
    And 初始化为空JSON对象
    And 不影响任务审批流程
    And 通知开发团队数据完整性问题

### Streak Maximum Cap (AC#16)

16. Given 儿童连续完成很长时间的任务
    When streak计数达到999天时
    Then 系统不再增加计数（上限999天）
    And 显示"已达到最大连续天数"提示
    And 继续记录streak_history历史记录

### Manual Reset Support (AC#17)

17. Given 家长手动重置儿童的streak计数
    When 家长执行重置操作
    Then 系统记录上一次streak到streak_history
    And 重置指定任务类型的计数为0
    And 记录中断原因：manual_reset
    And 通知儿童"streak计数已被重置"

### Performance Requirements (AC#18)

18. Given 系统有大量streak数据
    When 查询儿童streak信息时
    Then 响应时间 < 500ms（1000条历史记录内）
    And 索引优化：child_id, task_type, lastDate
    And 使用分页查询历史记录

## Tasks / Subtasks

- [ ] Task 1: Create streak tracking database schema (AC: #3, #6, #10, #18)
  - [ ] Add streak_data TEXT field to users table
  - [ ] Add last_streak_reset_date DATE field to users table
  - [ ] Create streak_history table for historical records
  - [ ] Add composite index on (child_id, task_type, lastDate)
  - [ ] Add index on (start_date, end_date) for history queries
  - [ ] Create database migration file: database/migrations/XXX_add_streak_tracking.sql
  - [ ] Test migration rollback capability

- [ ] Task 2: Implement streak calculation service (AC: #1-#5, #9, #12-#14, #16)
  - [ ] Create lib/services/streak-calculator.ts
  - [ ] Implement incrementStreak(childId, taskType, completionDate) function
    ```typescript
    export async function incrementStreak(
      childId: string,
      taskType: TaskType,
      completionDate: Date
    ): Promise<{ currentStreak: number; isNewStreak: boolean }>
    ```
  - [ ] Implement resetStreak(childId, taskType, reason) function
    ```typescript
    export async function resetStreak(
      childId: string,
      taskType: TaskType,
      reason: 'new_day_break' | 'manual_reset' | 'task_plan_disabled'
    ): Promise<void>
    ```
  - [ ] Implement checkSameDayCompletion(childId, taskType, completionDate) logic
    ```typescript
    export async function checkSameDayCompletion(
      childId: string,
      taskType: TaskType,
      completionDate: Date
    ): Promise<boolean>
    ```
  - [ ] Implement isNewDay(lastCompletionDate, currentDate) logic (Beijing timezone)
  - [ ] Implement capStreakAt999(count) function
  - [ ] Add transaction support for concurrent updates
  - [ ] Add error handling for corrupted JSON data

- [ ] Task 3: Implement streak history recording (AC: #6, #17)
  - [ ] Create recordStreakHistory(childId, taskType, streakCount, startDate, endDate, reason) function
    ```typescript
    export async function recordStreakHistory(
      childId: string,
      taskType: TaskType,
      streakCount: number,
      startDate: Date,
      endDate: Date,
      reason: string
    ): Promise<void>
    ```
  - [ ] Implement getStreakHistory(childId, taskType, limit = 20) query
    ```typescript
    export async function getStreakHistory(
      childId: string,
      taskType?: TaskType,
      limit?: number
    ): Promise<StreakHistoryRecord[]>
    ```
  - [ ] Add pagination support for history queries

- [ ] Task 4: Integrate with task approval flow (AC: #1, #8, #11)
  - [ ] Modify Epic 2 Story 2.10 (Parent Approves Task Completion) to call streak calculator
  - [ ] After approval success, call incrementStreak()
  - [ ] Handle errors: log but don't fail task approval
  - [ ] After increment, check Combo thresholds and trigger reward if needed
  - [ ] Check task plan active status before counting
  - [ ] Pass completionDate in Beijing timezone

- [ ] Task 5: Add streak-related query functions (AC: #2, #7)
  - [ ] Create getStreakByChild(childId) query
    ```typescript
    export async function getStreakByChild(childId: string): Promise<StreakData[]>
    ```
  - [ ] Create getStreakByTaskType(childId, taskType) query
    ```typescript
    export async function getStreakByTaskType(
      childId: string,
      taskType: TaskType
    ): Promise<StreakData | null>
    ```
  - [ ] Create getCurrentStreak(childId, taskType) helper function
    ```typescript
    export async function getCurrentStreak(
      childId: string,
      taskType: TaskType
    ): Promise<number>
    ```

- [ ] Task 6: Implement manual reset API for parents (AC: #17)
  - [ ] Create POST /api/streaks/:childId/reset endpoint
  - [ ] Verify user authentication (Better-Auth session)
  - [ ] Verify user role is 'parent'
  - [ ] Verify parent has access to child (same family)
  - [ ] Validate request body: { taskType: 'brush' | 'teach' | ... }
  - [ ] Call resetStreak() with reason 'manual_reset'
  - [ ] Send notification to child
  - [ ] Return updated streak data

- [ ] Task 7: Implement timezone utilities (AC: #12-#13)
  - [ ] Create lib/utils/timezone.ts
  - [ ] Implement getBeijingDate() function
    ```typescript
    export function getBeijingDate(date?: Date): Date
    ```
  - [ ] Implement getBeijingDateString() function
    ```typescript
    export function getBeijingDateString(date?: Date): string // YYYY-MM-DD
    ```
  - [ ] Implement isNewDayBeijing(lastDateString: string, currentDateString: string): boolean
  - [ ] Add unit tests for timezone functions

- [ ] Task 8: Write BDD tests (AC: #1-#18)
  - [ ] Test streak increment on task completion
  - [ ] Test same-day duplicate counting prevention
  - [ ] Test streak reset on new day
  - [ ] Test independent tracking per task type
  - [ ] Test streak history recording on reset
  - [ ] Test task plan disabled - no streak counting
  - [ ] Test timezone handling (Beijing time)
  - [ ] Test concurrent task approval with transactions
  - [ ] Test corrupted JSON data recovery
  - [ ] Test manual reset by parent
  - [ ] Test streak cap at 999 days
  - [ ] Test Combo threshold trigger
  - [ ] Test performance with 1000+ history records

- [ ] Task 9: Create streak UI components (AC: #16, #18)
  - [ ] Create lib/components/features/streak-display.tsx
    - Display current streak count per task type
    - Show streak history in table format
    - Add "重置Streak" button for parents
    - Show "已达到最大连续天数" badge when cap reached
  - [ ] Add pagination for history records
  - [ ] Add filters: task type, date range
  - [ ] Responsive design (parent-end: mobile/tablet)

- [ ] Task 10: Implement scheduled new day check (AC: #9)
  - [ ] Create lib/jobs/check-new-day-streaks.ts
  - [ ] Run daily at 00:05 Beijing time
  - [ ] For each active child:
    - Check each task type
    - If no completion yesterday, record streak end
    - Update streak_data reset flags
  - [ ] Add error handling and retry logic
  - [ ] Log execution results

## Dev Notes

### Database Schema Extensions

**New Table: `streak_history`**
```sql
CREATE TABLE streak_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK(task_type IN ('brush', 'teach', 'exercise', 'chores', 'custom')),
  streak_count INTEGER NOT NULL,
  start_date DATE NOT NULL, -- Streak开始日期
  end_date DATE NOT NULL,   -- Streak结束日期（中断或当前）
  reason TEXT NOT NULL CHECK(reason IN (
    'new_day_break',      -- 新天未完成
    'manual_reset',       -- 家长手动重置
    'task_plan_disabled', -- 任务计划被禁用
    'max_cap_reached'     -- 达到999天上限
  )),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_streak_history_child_task ON streak_history(child_id, task_type);
CREATE INDEX idx_streak_history_dates ON streak_history(start_date DESC, end_date DESC);
CREATE INDEX idx_streak_history_created ON streak_history(created_at DESC);
```

**Existing Table: `users` (Additions)**
```sql
ALTER TABLE users ADD COLUMN streak_data TEXT DEFAULT '{}';
-- JSON format:
-- {
--   "brush": {
--     "current": 5,
--     "lastDate": "2026-03-04",
--     "firstDate": "2026-02-28"
--   },
--   "teach": {
--     "current": 3,
--     "lastDate": "2026-03-03",
--     "firstDate": "2026-03-01"
--   }
-- }

ALTER TABLE users ADD COLUMN last_streak_reset_date DATE;
-- Track when streak was last reset (for new day detection)

CREATE INDEX idx_users_streak_reset ON users(last_streak_reset_date) WHERE role = 'child';
```

### API Integration Points

**1. POST /api/tasks/[taskId]/approve** (from Epic 2)
- After successful approval, call `streakCalculator.incrementStreak(childId, taskType)`
- Handle streak calculator errors gracefully (log but don't fail approval)
- Pass Beijing timezone completionDate

**2. GET /api/streaks/:childId**
- Returns streak data for a child
- Query params: ?taskType=brush (optional filter)
- Response:
  ```json
  {
    "childId": "xxx",
    "streaks": {
      "brush": { "current": 5, "lastDate": "2026-03-04", "firstDate": "2026-02-28" },
      "teach": { "current": 3, "lastDate": "2026-03-03", "firstDate": "2026-03-01" },
      "exercise": { "current": 0 }
    },
    "lastUpdated": "2026-03-04T15:30:00Z"
  }
  ```

**3. GET /api/streaks/:childId/history**
- Returns historical streak records
- Query params: ?taskType=brush&startDate=2026-01-01&endDate=2026-02-01&limit=20
- Response:
  ```json
  {
    "records": [
      {
        "id": "xxx",
        "taskType": "brush",
        "streakCount": 5,
        "startDate": "2026-02-28",
        "endDate": "2026-03-04",
        "reason": "new_day_break",
        "createdAt": "2026-03-05T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
  ```

**4. POST /api/streaks/:childId/reset** (Parent only)
- Request body:
  ```json
  {
    "taskType": "brush"
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "message": "Streak已重置",
    "updatedStreak": {
      "taskType": "brush",
      "current": 0
    }
  }
  ```

### Logic Flow

```
Task Approval Flow:
POST /api/tasks/[taskId]/approve
  ↓
Verify parent authentication
  ↓
Approve task completion
  ↓
Check if task has task_plan_id
  ↓
If yes (valid task plan):
  Get task_type from task_plans table
  Get child_id
  Get completionDate (Beijing timezone)
  ↓
Call streakCalculator.incrementStreak(childId, taskType, completionDate)
  ↓
  Inside incrementStreak:
  Parse streak_data JSON
  Get current streak for taskType
  Check if same day (compare dates in Beijing timezone)
  ↓
  If same day completed:
    Return current streak (no change)
  ↓
  If new day:
    Check if yesterday was missed
      If yes: reset streak to 1, record history
      If no: increment streak
    Update streak_data JSON
    Check if streak >= 999: cap at 999
    Return updated streak
  ↓
  Trigger Combo reward check (if threshold reached)
  ↓
Return task approval success
```

### Timezone Handling

All streak calculations use Beijing Time (UTC+8):
- Day boundary: 00:00 Beijing Time
- Date storage: YYYY-MM-DD string format
- Date comparison: Compare date strings, not timestamps

```typescript
// lib/utils/timezone.ts
import { DateTime } from 'luxon';

const BEIJING_TZ = 'Asia/Shanghai';

export function getBeijingDate(date: Date = new Date()): Date {
  return DateTime.fromJSDate(date).setZone(BEIJING_TZ).toJSDate();
}

export function getBeijingDateString(date: Date = new Date()): string {
  return DateTime.fromJSDate(date).setZone(BEIJING_TZ).toFormat('yyyy-MM-dd');
}

export function isNewDayBeijing(lastDateString: string, currentDateString: string): boolean {
  return lastDateString !== currentDateString;
}

export function getDaysSince(lastDateString: string): number {
  const lastDate = DateTime.fromFormat(lastDateString, 'yyyy-MM-dd', { zone: BEIJING_TZ });
  const currentDate = DateTime.now().setZone(BEIJING_TZ);
  return currentDate.diff(lastDate, 'days').days;
}
```

### Testing Strategy

**Unit Tests:**
- Test streak increment logic
- Test same-day detection
- Test new day reset
- Test timezone utilities
- Test JSON parsing and error handling
- Test streak cap at 999

**Integration Tests:**
- Test task approval flow triggers streak update
- Test concurrent approval with transactions
- Test manual reset API
- Test streak history queries
- Test Combo threshold trigger

**BDD Test Examples:**
```typescript
describe('Story 5.1: Streak Tracking', () => {
  it('Given 儿童完成刷牙任务 When 审批通过 Then 增加streak计数', async () => {
    // Given
    const child = await createChild();
    const taskPlan = await createTaskPlan({ taskType: 'brush' });
    const task = await createTask({ taskPlanId: taskPlan.id, childId: child.id });

    // When
    await approveTask(task.id);

    // Then
    const streak = await getStreakByTaskType(child.id, 'brush');
    expect(streak.current).toBe(1);
  });

  it('Given 儿童同一天完成同一类型任务 When 再次审批 Then 不增加streak', async () => {
    // Given
    const child = await createChild();
    const taskPlan = await createTaskPlan({ taskType: 'brush' });
    const task1 = await createTask({ taskPlanId: taskPlan.id, childId: child.id });
    const task2 = await createTask({ taskPlanId: taskPlan.id, childId: child.id });

    // When
    await approveTask(task1.id);
    await approveTask(task2.id);

    // Then
    const streak = await getStreakByTaskType(child.id, 'brush');
    expect(streak.current).toBe(1); // Only 1, not 2
  });

  it('Given 儿童有3天streak When 第4天未完成 Then 重置为1', async () => {
    // Given
    const child = await createChild();
    const taskPlan = await createTaskPlan({ taskType: 'brush' });
    // Complete 3 days in a row
    for (let i = 0; i < 3; i++) {
      const task = await createTask({ taskPlanId: taskPlan.id, childId: child.id });
      await approveTask(task.id);
      await advanceTime(1, 'day');
    }
    // Day 4: no completion
    await advanceTime(1, 'day');

    // When
    const task = await createTask({ taskPlanId: taskPlan.id, childId: child.id });
    await approveTask(task.id);

    // Then
    const streak = await getStreakByTaskType(child.id, 'brush');
    expect(streak.current).toBe(1); // Reset to 1

    const history = await getStreakHistory(child.id, 'brush');
    expect(history).toHaveLength(1);
    expect(history[0].streakCount).toBe(3);
    expect(history[0].reason).toBe('new_day_break');
  });
});
```

### Performance Requirements

- Streak query response time: < 500ms (up to 1000 history records)
- Streak increment operation: < 100ms
- History query with pagination: < 300ms
- Use indexes on: (child_id, task_type), (start_date, end_date)
- Implement query result caching for frequent streak lookups

### Dependencies

- Epic 2: Story 2.10 (Parent Approves Task Completion) - Triggers streak update
- Epic 5: Story 5.2, 5.3 (Combo Rewards) - Receives streak threshold events
- Epic 2: Story 2.1 (Task Plan Template) - Provides task_type
- Luxon or date-fns for timezone handling

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] Streak increments correctly on task approval
4. [ ] Same-day duplicates prevented
5. [ ] Streak resets on new day after missed completion
6. [ ] Independent tracking per task type
7. [ ] Combo threshold check triggers correctly
8. [ ] Streak history recorded on reset
9. [ ] Manual reset works for parents
10. [ ] Timezone handling correct (Beijing time)
11. [ ] Concurrent updates handled with transactions
12. [ ] Code review passed

## Dev Agent Record

### File List

**Files to Create:**
- database/migrations/XXX_add_streak_tracking.sql
- lib/db/queries/streaks.ts
- lib/services/streak-calculator.ts
- lib/utils/timezone.ts
- app/api/streaks/[childId]/route.ts
- app/api/streaks/[childId]/history/route.ts
- app/api/streaks/[childId]/reset/route.ts
- lib/components/features/streak-display.tsx
- lib/jobs/check-new-day-streaks.ts

**Files to Modify:**
- database/schema/users.ts (add streak_data field)
- app/api/tasks/[taskId]/approve/route.ts (integrate streak update)
- lib/db/queries/index.ts (export streak queries)

**Test Files:**
- tests/integration/streaks.spec.ts
- tests/unit/streak-calculator.spec.ts
- tests/unit/timezone.spec.ts

### Database Migration

```sql
-- database/migrations/001_add_streak_tracking.sql

-- Add streak_data field to users table
ALTER TABLE users ADD COLUMN streak_data TEXT DEFAULT '{}';

-- Add last_streak_reset_date field to users table
ALTER TABLE users ADD COLUMN last_streak_reset_date DATE;

-- Create streak_history table
CREATE TABLE streak_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK(task_type IN ('brush', 'teach', 'exercise', 'chores', 'custom')),
  streak_count INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL CHECK(reason IN ('new_day_break', 'manual_reset', 'task_plan_disabled', 'max_cap_reached')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Create indexes
CREATE INDEX idx_streak_history_child_task ON streak_history(child_id, task_type);
CREATE INDEX idx_streak_history_dates ON streak_history(start_date DESC, end_date DESC);
CREATE INDEX idx_streak_history_created ON streak_history(created_at DESC);
CREATE INDEX idx_users_streak_reset ON users(last_streak_reset_date) WHERE role = 'child';

-- Rollback:
-- DROP INDEX IF EXISTS idx_users_streak_reset;
-- DROP INDEX IF EXISTS idx_streak_history_created;
-- DROP INDEX IF EXISTS idx_streak_history_dates;
-- DROP INDEX IF EXISTS idx_streak_history_child_task;
-- DROP TABLE IF EXISTS streak_history;
-- ALTER TABLE users DROP COLUMN last_streak_reset_date;
-- ALTER TABLE users DROP COLUMN streak_data;
```
