# Story 5.2: Linear Combo Reward System
# Status: ready-for-dev

## Story

As a 系统,
I want 支持线性Combo奖励,
So that 儿童在连续完成一定次数任务后可以获得固定积分奖励，激励持续参与。

## Acceptance Criteria

### Rule Configuration (AC#1-#2)

1. Given 家长在Combo规则配置中选择了"线性Combo"类型
   When 家长保存配置时
   Then 系统保存线性Combo参数到combo_rules表：
   - type: 'linear'
   - task_types: 适用的任务类型（JSON数组，如["brush", "teach"]或null表示全部）
   - threshold: 触发奖励的连续次数（如7天）
   - reward_points: 固定奖励积分值（如30分）
   - enabled: 是否启用（1=启用，0=禁用）
   And 系统验证threshold >= 1
   And 系统验证reward_points >= 0
   And 系统设置created_at和updated_at时间戳

2. Given 家长配置线性Combo规则时
   When task_types为空数组或null
   Then 系统理解为"所有任务类型都适用此规则"
   And 规则对所有任务类型的streak生效
   And JSON字段存储为null（表示全部）

3. Given 家长修改已存在的线性Combo规则
   When 规则正在使用中（已有儿童触发过）
   Then 系统允许修改threshold和reward_points
   And 系统记录修改到audit_log表
   And 不影响已发放的奖励
   And 新修改只影响未来的奖励计算

### Reward Triggering Logic (AC#4-#8)

4. Given 线性Combo规则已配置并启用（enabled=1）
   When 儿童连续完成任务的计数达到Combo阈值时
   Then 系统自动发放线性Combo奖励积分
   And 奖励积分 = 配置的固定值（不是乘数）
   And 奖励积分立即添加到儿童账户
   And 奖励发放时间 < 1秒

5. Given 儿童当前连续计数为threshold-1（如6，阈值为7）
   When 儿童完成第threshold个任务（7天）并通过审批
   Then 系统发放Combo奖励
   And 连续计数继续累积（变为threshold+1，即8）
   And 不重置连续计数
   And 记录奖励触发到combo_rewards_history表

6. Given 线性Combo配置的threshold为7
   When 儿童的streak计数为7、14、21、28...时
   Then 系统在每次达到7的倍数时都触发奖励
   And 每次触发都发放相同的固定奖励值
   And 不限制触发次数上限

7. Given 线性Combo配置的threshold为5
   When 儿童streak从4增加到5
   Then 系统触发一次奖励
   And 当streak从5增加到10时
   Then 系统再次触发奖励
   And 奖励累计逻辑：floor(streakCount / threshold) * reward_points

8. Given 儿童streak从4跳到8（同一天完成多个任务）
   When 系统计算奖励
   Then 系统只触发一次奖励（在达到threshold时）
   And 不因为越过多个阈值而多次触发
   And 触发逻辑：check是否从<threshold变为>=threshold

### Points History Recording (AC#9)

9. Given 线性Combo奖励已发放
   When 奖励发放时
   Then 系统记录积分历史到points_history表：
   - type: "combo_reward_linear"
   - user_id: 儿童ID
   - family_id: 家庭ID
   - points: 奖励积分值（正数）
   - balance_after: 发放后的积分余额
   - reference_id: combo_rule_id
   - metadata: JSON对象包含：
     - streak_count: 触发时的streak计数
     - task_type: 触发的任务类型
     - threshold: 阈值
     - reward_points: 奖励积分
   - created_at: 发放时间戳
   And 历史记录用于审计和统计

### Task Type Filtering (AC#10-#12)

10. Given 线性Combo配置中设置了task_types为["brush", "teach"]
    When 系统检查奖励触发时
    Then 只在brush或teach任务类型上触发奖励
    And exercise、chores、custom任务类型不触发

11. Given 线性Combo配置中设置了task_types为null（所有类型）
    When 儿童完成任何类型的任务并达到阈值
    Then 系统触发奖励
    And 奖励适用于所有任务类型的streak

12. Given 家庭有多个线性Combo规则，每个规则针对不同task_types
    When 儿童完成任务
    Then 系统独立检查每个规则
    And 触发所有满足条件的规则
    And 每个规则独立计算和发放奖励

### Multiple Rules Combination (AC#13-#14)

13. Given 家庭同时配置了多个线性Combo规则
    When 触发条件满足时
    Then 系统同时发放所有满足条件的线性Combo奖励
    And 每个规则独立计算和发放
    And 总奖励 = 所有触发规则奖励之和

14. Given 家庭配置了规则A（brush类型，7天=30分）和规则B（teach类型，5天=20分）
    When 儿童刷牙streak达到7天
    Then 系统发放规则A的30分
    And 不触发规则B（teach未达到阈值）
    When 儿童学习streak达到5天
    Then 系统发放规则B的20分
    And 两个奖励相互独立

### Rule State Management (AC#15-#17)

15. Given 线性Combo规则被禁用（enabled=0）
    When 儿童达到阈值
    Then 系统不发放奖励
    And 不记录奖励历史
    And 重新启用规则后，按新规则计算

16. Given 线性Combo规则被删除
    When 儿童达到阈值
    Then 系统不发放奖励
    And 已发放的历史奖励保留
    And 不影响其他规则

17. Given 线性Combo规则的threshold被修改
    When 修改前streak已达到旧阈值
    Then 已发放的奖励不追溯调整
    And 新阈值只影响未来触发
    And 奖励历史中的threshold值保持不变

### Edge Cases and Constraints (AC#18-#20)

18. Given 线性Combo配置的threshold为0或负数
    When 保存规则时
    Then 系统拒绝保存并返回错误
    And 错误信息："阈值必须大于等于1"

19. Given 线性Combo配置的reward_points为负数
    When 保存规则时
    Then 系统拒绝保存并返回错误
    And 错误信息："奖励积分必须大于等于0"

20. Given 同一家庭针对同一task_type配置了多个线性Combo规则
    When 保存第二个规则时
    Then 系统允许保存（允许冲突规则共存）
    And 当触发时两个规则都会触发
    And UI显示警告："检测到重复规则类型"

### Performance Requirements (AC#21)

21. Given 系统有大量Combo规则和儿童streak数据
    When 执行奖励计算
    Then 单次计算响应时间 < 500ms
    And 数据库查询使用索引优化
    And 使用缓存避免重复查询

### Validation and Error Handling (AC#22-#23)

22. Given 儿童账户不存在或被禁用
    When 系统尝试发放奖励
    Then 系统记录错误日志
    And 不发放奖励
    And 不影响streak计数

23. Given 积分服务调用失败（如数据库连接错误）
    When 系统尝试发放奖励
    Then 系统记录错误日志
    And 重试最多3次
    And 如果重试失败，发送警报给开发团队

## Tasks / Subtasks

- [ ] Task 1: Create combo_rules database schema (AC: #1, #18-#20)
  - [ ] Create combo_rules table with fields:
    - id (TEXT, PRIMARY KEY)
    - family_id (TEXT, NOT NULL, REFERENCES families(id))
    - type (TEXT, NOT NULL, CHECK(type IN ('linear', 'tiered')))
    - task_types (JSON, can be null)
    - threshold (INTEGER, NOT NULL, CHECK(threshold >= 1))
    - reward_points (INTEGER, NOT NULL, CHECK(reward_points >= 0))
    - tiered_config (JSON, nullable, for tiered type)
    - warning_enabled (INTEGER, DEFAULT 1)
    - warning_hours_before (INTEGER, DEFAULT 2)
    - warning_message_template (TEXT, nullable)
    - enabled (INTEGER, DEFAULT 1)
    - created_at (INTEGER, NOT NULL)
    - updated_at (INTEGER, NOT NULL)
    - created_by (TEXT, REFERENCES users(id))
  - [ ] Create database migration file: database/migrations/XXX_create_combo_rules.sql
  - [ ] Add indexes:
    - idx_combo_rules_family_enabled (family_id, enabled)
    - idx_combo_rules_type (type)
    - idx_combo_rules_family_type (family_id, type)
  - [ ] Test migration rollback capability
  - [ ] Add foreign key constraints with ON DELETE CASCADE

- [ ] Task 2: Implement linear combo calculation logic (AC: #4-#8, #13-#14)
  - [ ] Create lib/services/combo-calculator.ts
  - [ ] Implement checkLinearCombo(childId, taskType, newStreakCount) function
    ```typescript
    export async function checkLinearCombo(
      childId: string,
      taskType: TaskType,
      newStreakCount: number
    ): Promise<ComboReward[]>
    ```
  - [ ] Implement calculateLinearReward(rule, streakCount) function
    ```typescript
    function calculateLinearReward(rule: ComboRule, streakCount: number): number | null {
      if (streakCount < rule.threshold) return null;
      // Check if this is a new threshold milestone
      const previousThreshold = Math.floor((streakCount - 1) / rule.threshold);
      const currentThreshold = Math.floor(streakCount / rule.threshold);
      if (currentThreshold > previousThreshold) {
        return rule.reward_points;
      }
      return null;
    }
    ```
  - [ ] Implement isThresholdReached(currentCount, threshold) check
  - [ ] Implement isRepeatableTrigger(lastTriggeredCount, threshold, currentCount) check
  - [ ] Implement filterRulesByTaskType(rules, taskType) function
    ```typescript
    function filterRulesByTaskType(
      rules: ComboRule[],
      taskType: TaskType
    ): ComboRule[] {
      return rules.filter(rule => {
        if (rule.task_types === null) return true; // All types
        return rule.task_types.includes(taskType);
      });
    }
    ```
  - [ ] Implement getFamilyRules(familyId) with caching
  - [ ] Add unit tests for all calculation functions

- [ ] Task 3: Implement reward发放 logic (AC: #9, #22-#23)
  - [ ] Create awardComboPoints(childId, points, taskType, streakCount, ruleId) function
    ```typescript
    export async function awardComboPoints(
      childId: string,
      points: number,
      taskType: TaskType,
      streakCount: number,
      ruleId: string
    ): Promise<{ success: boolean; balanceAfter?: number; error?: string }>
    ```
  - [ ] Call points service to add points to child account
  - [ ] Record points history with type "combo_reward_linear"
  - [ ] Build metadata JSON object
  - [ ] Implement retry logic (max 3 attempts)
  - [ ] Add error logging and alerting
  - [ ] Validate user exists and is active

- [ ] Task 4: Integrate with streak update (AC: #4)
  - [ ] Modify Story 5.1's lib/services/streak-calculator.ts
  - [ ] After streak increment, call combo calculator
  - [ ] Pass childId, taskType, newStreakCount
  - [ ] Process all applicable linear combo rules
  - [ ] Handle combo calculator errors gracefully (log but don't fail streak)
  - [ ] Add telemetry for combo triggering events

- [ ] Task 5: Add combo rule query functions (AC: #10-#12, #15-#17)
  - [ ] Create getComboRulesByFamily(familyId, enabledOnly = true) query
    ```typescript
    export async function getComboRulesByFamily(
      familyId: string,
      enabledOnly: boolean = true
    ): Promise<ComboRule[]>
    ```
  - [ ] Create getActiveComboRulesByTaskType(familyId, taskType) query
    ```typescript
    export async function getActiveComboRulesByTaskType(
      familyId: string,
      taskType: TaskType
    ): Promise<ComboRule[]>
    ```
  - [ ] Create getComboRuleById(ruleId) query
  - [ ] Create getLinearRulesByFamily(familyId) helper
  - [ ] Create checkDuplicateRuleType(familyId, taskType, excludeRuleId) for validation

- [ ] Task 6: Implement combo rule CRUD API (for Story 5.6)
  - [ ] Create POST /api/combo/rules - Create new rule
  - [ ] Create PUT /api/combo/rules/[id] - Update rule
  - [ ] Create DELETE /api/combo/rules/[id] - Delete rule
  - [ ] Create GET /api/combo/rules - List all rules for family
  - [ ] Validate request body with Zod schemas
  - [ ] Verify parent authentication
  - [ ] Verify parent has access to family

- [ ] Task 7: Write BDD tests (AC: #1-#23)
  - [ ] Test linear combo triggers at threshold
  - [ ] Test same-day multiple completions don't trigger multiple rewards
  - [ ] Test repeatable trigger (every threshold multiple)
  - [ ] Test task type filtering (specific vs all types)
  - [ ] Test multiple rules combined
  - [ ] Test rule state changes (enable/disable/delete)
  - [ ] Test rule modification (threshold, reward_points)
  - [ ] Test validation (negative threshold, negative points)
  - [ ] Test duplicate rule types
  - [ ] Test error handling (user not found, points service failure)
  - [ ] Test performance with 100+ rules

- [ ] Task 8: Implement combo rewards history tracking (AC: #9)
  - [ ] Create combo_rewards_history table (optional, can use points_history)
  - [ ] Create getComboRewardHistory(childId, startDate, endDate) query
  - [ ] Create getComboRewardStats(familyId, childId) for analytics
  - [ ] Add UI to display reward history to parents

- [ ] Task 9: Add telemetry and analytics (AC: #21)
  - [ ] Track combo triggering events
  - [ ] Track reward distribution statistics
  - [ ] Monitor reward calculation performance
  - [ ] Create dashboard for combo effectiveness

## Dev Notes

### Database Schema

**New Table: `combo_rules`**
```sql
CREATE TABLE combo_rules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('linear', 'tiered')),
  task_types JSON CHECK(
    task_types IS NULL OR
    json_array_length(task_types) > 0
  ), -- JSON array: ["brush", "teach"] or null for all
  threshold INTEGER NOT NULL CHECK(threshold >= 1),
  reward_points INTEGER NOT NULL CHECK(reward_points >= 0),
  tiered_config JSON, -- Only for tiered type: [{threshold: 7, reward: 30}, ...]
  warning_enabled INTEGER DEFAULT 1 CHECK(warning_enabled IN (0, 1)),
  warning_hours_before INTEGER DEFAULT 2 CHECK(warning_hours_before >= 0),
  warning_message_template TEXT,
  enabled INTEGER DEFAULT 1 CHECK(enabled IN (0, 1)),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_combo_rules_family_enabled ON combo_rules(family_id, enabled);
CREATE INDEX idx_combo_rules_type ON combo_rules(type);
CREATE INDEX idx_combo_rules_family_type ON combo_rules(family_id, type);
CREATE INDEX idx_combo_rules_created ON combo_rules(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_combo_rules_timestamp
AFTER UPDATE ON combo_rules
BEGIN
  UPDATE combo_rules SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;
```

**Points History Extensions**
```sql
-- Add new type to points_history table
-- type: 'combo_reward_linear'
-- reference_id: combo_rule_id
-- metadata: { streak_count: 7, task_type: 'brush', threshold: 7, reward_points: 30 }
```

### API Integration Points

**1. Internal: Called from streak calculator**
```typescript
// lib/services/streak-calculator.ts
import { checkLinearCombo } from './combo-calculator';

export async function incrementStreak(...) {
  // ... existing streak logic ...

  // Check combo rewards
  const comboRewards = await checkLinearCombo(childId, taskType, newStreakCount);

  // Award all triggered rewards
  for (const reward of comboRewards) {
    await awardComboPoints(
      childId,
      reward.points,
      taskType,
      newStreakCount,
      reward.ruleId
    );
  }

  return { currentStreak: newStreakCount, comboRewards };
}
```

**2. GET /api/combo/rules** (Story 5.6)
- Returns all combo rules for family
- Query params: ?type=linear&enabled=true
- Response:
  ```json
  {
    "rules": [
      {
        "id": "xxx",
        "type": "linear",
        "taskTypes": ["brush", "teach"],
        "threshold": 7,
        "rewardPoints": 30,
        "enabled": true,
        "createdAt": "2026-03-01T00:00:00Z",
        "updatedAt": "2026-03-01T00:00:00Z"
      }
    ]
  }
  ```

**3. POST /api/combo/rules** (Story 5.6)
- Request body:
  ```json
  {
    "type": "linear",
    "taskTypes": ["brush", "teach"],
    "threshold": 7,
    "rewardPoints": 30,
    "enabled": true
  }
  ```
- Response:
  ```json
  {
    "id": "xxx",
    "success": true
  }
  ```

### Logic Flow

```
Streak Incremented (from Story 5.1)
  ↓
Get family_id from child
  ↓
Get all enabled linear combo rules for family
  ↓
For each rule:
  ↓
  Check if task_type matches
    - If task_types is null: match all
    - If task_types is array: check inclusion
  ↓
  If matches:
    ↓
    Calculate if threshold reached
    - Check if streakCount >= threshold
    - Check if this is a new milestone
      (e.g., 6->7 triggers, 7->8 doesn't, 13->14 triggers)
    ↓
    If new milestone reached:
      ↓
      Calculate reward = rule.reward_points
      Add to rewards list
  ↓
After checking all rules:
  ↓
  If rewards list not empty:
    ↓
    For each reward in rewards:
      ↓
      Call points service to add points
      ↓
      Record to points_history:
        - type: 'combo_reward_linear'
        - points: reward.points
        - reference_id: reward.ruleId
        - metadata: {
            streak_count,
            task_type,
            threshold,
            reward_points
          }
  ↓
Return rewards list to caller
```

### Linear vs Tiered Combo Comparison

| Feature | Linear Combo | Tiered Combo |
|---------|-------------|--------------|
| Reward per trigger | Fixed (e.g., 30pts) | Varies by tier |
| Repeatable | Yes (every threshold) | Yes (each tier once) |
| Config complexity | Simple | Medium |
| Example | "Every 7 days = +30pts" | "7d=30, 14d=70, 30d=150" |
| Best for | Consistent motivation | Progressive milestones |
| Math | `floor(streak/threshold) * reward` | Tier lookup based on streak |

### Testing Strategy

**Unit Tests:**
```typescript
describe('Linear Combo Calculator', () => {
  it('should trigger reward when streak reaches threshold', () => {
    const rule = { threshold: 7, reward_points: 30, task_types: null };
    const reward = calculateLinearReward(rule, 7);
    expect(reward).toBe(30);
  });

  it('should trigger at every threshold multiple', () => {
    const rule = { threshold: 7, reward_points: 30, task_types: null };
    expect(calculateLinearReward(rule, 7)).toBe(30);
    expect(calculateLinearReward(rule, 14)).toBe(30);
    expect(calculateLinearReward(rule, 21)).toBe(30);
  });

  it('should not trigger within threshold', () => {
    const rule = { threshold: 7, reward_points: 30, task_types: null };
    expect(calculateLinearReward(rule, 6)).toBeNull();
    expect(calculateLinearReward(rule, 1)).toBeNull();
  });

  it('should not trigger twice for same milestone', () => {
    const rule = { threshold: 7, reward_points: 30, task_types: null };
    expect(calculateLinearReward(rule, 7)).toBe(30);
    expect(calculateLinearReward(rule, 8)).toBeNull();
    expect(calculateLinearReward(rule, 9)).toBeNull();
  });

  it('should filter by task type', () => {
    const rule = { threshold: 5, reward_points: 20, task_types: ['brush'] };
    expect(filterRulesByTaskType([rule], 'brush')).toHaveLength(1);
    expect(filterRulesByTaskType([rule], 'teach')).toHaveLength(0);
  });
});
```

**Integration Tests:**
```typescript
describe('Story 5.2: Linear Combo Integration', () => {
  it('Given 儿童完成7天任务 When 达到阈值 Then 发放奖励', async () => {
    // Given
    const family = await createFamily();
    const child = await createChild({ familyId: family.id });
    const rule = await createComboRule({
      familyId: family.id,
      type: 'linear',
      taskTypes: ['brush'],
      threshold: 7,
      rewardPoints: 30
    });

    // When
    for (let i = 0; i < 7; i++) {
      await completeAndApproveTask({ childId: child.id, taskType: 'brush' });
    }

    // Then
    const balance = await getPointsBalance(child.id);
    const initialPoints = 0;
    const taskPoints = 7 * 10; // Assuming 10 points per task
    const comboReward = 30;
    expect(balance).toBe(initialPoints + taskPoints + comboReward);

    const history = await getPointsHistory(child.id);
    const comboRewardRecord = history.find(h => h.type === 'combo_reward_linear');
    expect(comboRewardRecord).toBeDefined();
    expect(comboRewardRecord.points).toBe(30);
    expect(comboRewardRecord.metadata.streak_count).toBe(7);
  });

  it('Given 两个规则同时满足 When 完成任务 Then 发放两次奖励', async () => {
    // Given
    const family = await createFamily();
    const child = await createChild({ familyId: family.id });
    const rule1 = await createComboRule({
      familyId: family.id,
      type: 'linear',
      taskTypes: ['brush'],
      threshold: 5,
      rewardPoints: 20
    });
    const rule2 = await createComboRule({
      familyId: family.id,
      type: 'linear',
      taskTypes: ['brush'],
      threshold: 5,
      rewardPoints: 15
    });

    // When
    for (let i = 0; i < 5; i++) {
      await completeAndApproveTask({ childId: child.id, taskType: 'brush' });
    }

    // Then
    const history = await getPointsHistory(child.id);
    const comboRewards = history.filter(h => h.type === 'combo_reward_linear');
    expect(comboRewards).toHaveLength(2);
    expect(comboRewards[0].points + comboRewards[1].points).toBe(35); // 20 + 15
  });
});
```

### Performance Optimization

- Cache family combo rules for 5 minutes
- Use database indexes on (family_id, enabled)
- Batch reward queries when processing multiple rules
- Implement query result pagination for history endpoints

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] Linear combo triggers correctly at threshold
4. [ ] Repeatable triggers work (every threshold multiple)
5. [ ] Task type filtering works correctly
6. [ ] Multiple rules combined correctly
7. [ ] Points history recorded with proper metadata
8. [ ] Rule validation prevents invalid configurations
9. [ ] Error handling robust (retry logic, logging)
10. [ ] Performance requirements met (< 500ms response)
11. [ ] Code review passed

## Dependencies

- Epic 5: Story 5.1 (System Tracks Task Completion Streak) - Provides streak count
- Epic 3: Story 3.1 (System Calculates Points) - Points award mechanism
- Epic 5: Story 5.6 (Parent Configures Combo Rules) - UI for rule management
- Epic 4: Points history system (from Epic 3)

## Dev Agent Record

### File List

**Files to Create:**
- database/migrations/XXX_create_combo_rules.sql
- lib/db/queries/combo-rules.ts
- lib/services/combo-calculator.ts
- app/api/combo/rules/route.ts
- app/api/combo/rules/[id]/route.ts

**Files to Modify:**
- lib/services/streak-calculator.ts (call combo calculator after increment)
- lib/db/queries/index.ts (export combo queries)
- database/schema/combos.ts (if using separate schema file)

**Test Files:**
- tests/integration/combo-linear.spec.ts
- tests/unit/combo-calculator.spec.ts

### Database Migration

```sql
-- database/migrations/001_create_combo_rules.sql

-- Create combo_rules table
CREATE TABLE combo_rules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('linear', 'tiered')),
  task_types JSON CHECK(
    task_types IS NULL OR
    json_array_length(task_types) > 0
  ),
  threshold INTEGER NOT NULL CHECK(threshold >= 1),
  reward_points INTEGER NOT NULL CHECK(reward_points >= 0),
  tiered_config JSON,
  warning_enabled INTEGER DEFAULT 1 CHECK(warning_enabled IN (0, 1)),
  warning_hours_before INTEGER DEFAULT 2 CHECK(warning_hours_before >= 0),
  warning_message_template TEXT,
  enabled INTEGER DEFAULT 1 CHECK(enabled IN (0, 1)),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_combo_rules_family_enabled ON combo_rules(family_id, enabled);
CREATE INDEX idx_combo_rules_type ON combo_rules(type);
CREATE INDEX idx_combo_rules_family_type ON combo_rules(family_id, type);
CREATE INDEX idx_combo_rules_created ON combo_rules(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_combo_rules_timestamp
AFTER UPDATE ON combo_rules
BEGIN
  UPDATE combo_rules SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

-- Rollback:
DROP TRIGGER IF EXISTS update_combo_rules_timestamp;
DROP INDEX IF EXISTS idx_combo_rules_created;
DROP INDEX IF EXISTS idx_combo_rules_family_type;
DROP INDEX IF EXISTS idx_combo_rules_type;
DROP INDEX IF EXISTS idx_combo_rules_family_enabled;
DROP TABLE IF EXISTS combo_rules;
```
