# Story 5.3: Tiered Combo Reward System
# Status: ready-for-dev

## Story

As a 系统,
I want 支持阶梯Combo奖励,
So that 儿童连续完成任务的次数越多，获得的奖励越高，激励持续努力。

## Acceptance Criteria

### Rule Configuration (AC#1-#3)

1. Given 家长在Combo规则配置中选择了"阶梯Combo"类型
   When 家长保存配置时
   Then 系统保存阶梯Combo参数到combo_rules表：
   - type: 'tiered'
   - task_types: 适用的任务类型（JSON数组，如["brush", "teach"]或null表示全部）
   - tiered_config: 阶梯配置JSON数组
   - enabled: 是否启用（1=启用，0=禁用）
   And tiered_config格式：[{threshold: 7, reward: 30}, {threshold: 14, reward: 70}, {threshold: 30, reward: 150}]
   And 系统验证tiered_config中每个threshold >= 1
   And 系统验证tiered_config中每个reward >= 0
   And 系统验证tiered_config中的threshold按升序排列
   And 系统设置created_at和updated_at时间戳

2. Given 家长配置阶梯Combo时
   When tiered_config为空数组或未提供
   Then 系统拒绝保存并返回错误
   And 错误信息："阶梯配置不能为空"

3. Given 家长配置阶梯Combo时
   When tiered_config中有重复的threshold值
   Then 系统拒绝保存并返回错误
   And 错误信息："阶梯阈值不能重复"
   And 示例：[{threshold: 7, reward: 30}, {threshold: 7, reward: 40}] 无效

### Tiered Reward Triggering (AC#4-#9)

4. Given 阶梯Combo规则已配置并启用（enabled=1）
   When 儿童连续计数达到不同阶梯阈值时
   Then 系统按当前阶梯发放对应的奖励积分
   And 阶梯越高，奖励积分越高
   And 奖励积分立即添加到儿童账户
   And 奖励发放时间 < 1秒

5. Given 阶梯Combo配置如下：
   - 阶梯1：7天阈值，30分奖励
   - 阶梯2：14天阈值，70分奖励
   - 阶梯3：30天阈值，150分奖励

   When 儿童连续完成计数从6变为7
   Then 系统发放7天阶梯奖励30分
   And 记录已触发阶梯：7天阶梯已触发
   And 在combo_rule_child_states表中更新triggered_tiers为[7]

6. Given 儿童已获得7天阶梯奖励，连续计数为8-13
   When 儿童继续完成任务，计数从8增加到13
   Then 不发放任何阶梯奖励（还未达到下一个阈值14）
   And 触发的阶梯记录保持为[7]

7. Given 儿童连续完成计数从13变为14
   When 达到14天阈值时
   Then 系统发放14天阶梯奖励70分
   And 记录已触发阶梯：7天和14天阶梯已触发
   And 在combo_rule_child_states表中更新triggered_tiers为[7, 14]
   And 不重复发放7天奖励

8. Given 儿童已获得14天阶梯奖励，连续计数从14增加到30
   When 达到30天阈值时
   Then 系统发放30天阶梯奖励150分
   And 记录已触发阶梯：7天、14天、30天阶梯都已触发
   And 在combo_rule_child_states表中更新triggered_tiers为[7, 14, 30]

9. Given 阶梯Combo的"每个阶梯只触发一次"规则
   When 连续计数继续增加（如31, 32, 35...）
   Then 不再发放任何阶梯奖励（所有阶梯已触发）
   And triggered_tiers保持为[7, 14, 30]
   And 即使streak达到100，也不发放额外奖励

### Tier Tracking State Management (AC#10-#12)

10. Given 系统需要跟踪每个儿童对每个规则的已触发阶梯
    When 儿童第一次触发某个阶梯时
    Then 系统在combo_rule_child_states表中创建记录
    And 存储combo_rule_id、child_id、triggered_tiers
    And triggered_tiers为JSON数组，包含已触发的阈值

11. Given 儿童已触发部分阶梯（如7天）
    When 达到下一个阶梯（14天）时
    Then 系统更新combo_rule_child_states记录
    And 在triggered_tiers数组中添加新阈值（变为[7, 14]）
    And 更新last_streak_count为当前streak值
    And 更新updated_at时间戳

12. Given 儿童在不同规则下有不同的阶梯进度
    When 查询儿童阶梯状态时
    Then 系统按(combo_rule_id, child_id)返回唯一记录
    And 每个规则独立跟踪已触发阶梯
    And 不同规则的triggered_tiers互不影响

### Configuration Change Handling (AC#13-#14)

13. Given 阶梯Combo配置后家长修改了配置
    When 配置变更时（修改threshold或reward）
    Then 系统重置已触发阶梯记录
    And 删除或重置combo_rule_child_states中该规则的记录
    And 儿童需要重新达成各阶梯才能获得奖励
    And 已发放的历史奖励保留不变

14. Given 阶梯Combo规则被禁用（enabled=0）
    When 儿童达到阈值
    Then 系统不发放奖励
    And 不记录已触发阶梯
    And 重新启用规则后，按新配置重新开始计算

### Combination with Linear Combo (AC#15-#17)

15. Given 阶梯Combo与线性Combo同时存在
    When 触发条件同时满足时
    Then 阶梯Combo与线性Combo可叠加发放
    And 儿童同时获得两种奖励
    And 总奖励 = 阶梯奖励 + 线性奖励

16. Given 家庭配置了阶梯Combo（7d=30, 14d=70）和线性Combo（每7d=20）
    When 儿童streak达到7天
    Then 系统发放阶梯奖励30分
    And 系统发放线性奖励20分
    And 总共获得50分
    When 儿童streak达到14天
    Then 系统发放阶梯奖励70分（第二阶梯）
    And 系统发放线性奖励20分（线性可重复）
    And 总共获得90分

17. Given 儿童同时触发多个Combo规则（包括阶梯和线性）
    When 系统计算奖励时
    Then 返回所有满足条件的奖励列表
    And 一次性发放所有奖励
    And 一次性记录所有奖励到points_history

### Task Type Filtering (AC#18-#20)

18. Given 阶梯Combo配置中设置了task_types为["brush", "teach"]
    When 系统检查奖励触发时
    Then 只在brush或teach任务类型上触发奖励
    And exercise、chores、custom任务类型不触发
    And 即使达到阈值也不发放奖励

19. Given 阶梯Combo配置中设置了task_types为null（所有类型）
    When 儿童完成任何类型的任务并达到阈值
    Then 系统触发奖励
    And 奖励适用于所有任务类型的streak
    And 系统为每个匹配的task_type独立计算阶梯奖励

20. Given 家庭有多个阶梯Combo规则，每个规则针对不同task_types
    When 儿童完成任务
    Then 系统独立检查每个规则
    And 触发所有满足条件的规则
    And 每个规则独立计算和发放奖励

### Edge Cases and Validation (AC#21-#24)

21. Given 阶梯Combo配置的tiered_config中有超过10个阶梯
    When 保存规则时
    Then 系统允许保存（无硬性限制）
    And UI可能建议简化配置
    And 性能测试确保响应时间可接受

22. Given 阶梯Combo配置的threshold值很大（如1000天）
    When 儿童streak正常增长
    Then 系统正常跟踪和计算
    And 不影响日常性能
    And 数据库存储正常

23. Given 同一家庭针对同一task_type配置了多个阶梯Combo规则
    When 保存第二个规则时
    Then 系统允许保存
    And 当触发时两个规则都会触发
    And UI显示警告："检测到重复规则类型"

24. Given 阶梯Combo配置中有奖励为0的阶梯
    When 达到该阶梯时
    Then 系统记录已触发该阶梯
    And 不发放积分（奖励为0）
    And 记录到points_history（points=0）

### Points History Recording (AC#25)

25. Given 阶梯Combo奖励已发放
    When 奖励发放时
    Then 系统记录积分历史到points_history表：
    - type: "combo_reward_tiered"
    - user_id: 儿童ID
    - family_id: 家庭ID
    - points: 奖励积分值（正数）
    - balance_after: 发放后的积分余额
    - reference_id: combo_rule_id
    - metadata: JSON对象包含：
      - streak_count: 触发时的streak计数
      - task_type: 触发的任务类型
      - tier_threshold: 触发的阶梯阈值
      - tier_reward: 阶梯奖励积分
      - tier_index: 阶梯索引（0, 1, 2...）
      - all_triggered_tiers: 已触发的所有阶梯
    - created_at: 发放时间戳

### Performance Requirements (AC#26)

26. Given 系统有大量阶梯规则和儿童状态数据
    When 执行奖励计算
    Then 单次计算响应时间 < 500ms
    And 数据库查询使用索引优化
    And 使用缓存避免重复查询
    And tiered_config解析时间 < 10ms

### Error Handling (AC#27-#28)

27. Given combo_rule_child_states表不存在或读取失败
    When 系统尝试获取已触发阶梯
    Then 系统记录错误日志
    And 初始化为空triggered_tiers数组
    And 继续正常发放奖励
    And 在后台修复表结构

28. Given tiered_config JSON格式错误或损坏
    When 系统尝试解析配置
    Then 系统记录错误日志
    And 跳过该规则不发放奖励
    And 通知开发团队配置错误
    And 不影响其他规则

## Tasks / Subtasks

- [ ] Task 1: Extend combo_rules schema for tiered config (AC: #1-#3)
  - [ ] Verify tiered_config JSON field exists in combo_rules table
  - [ ] Add tiered_config validation (must be sorted by threshold ascending)
  - [ ] Add validation for empty array and duplicate thresholds
  - [ ] Add validation for threshold >= 1 and reward >= 0
  - [ ] Add database constraint check for tiered_config format

- [ ] Task 2: Create combo_rule_child_states table (AC: #10-#12)
  - [ ] Create combo_rule_child_states table:
    - id (TEXT, PRIMARY KEY)
    - combo_rule_id (TEXT, NOT NULL, REFERENCES combo_rules(id))
    - child_id (TEXT, NOT NULL, REFERENCES users(id))
    - triggered_tiers (JSON, NOT NULL, default '[]')
    - last_streak_count (INTEGER, DEFAULT 0)
    - created_at (INTEGER, NOT NULL)
    - updated_at (INTEGER, NOT NULL)
  - [ ] Add unique constraint on (combo_rule_id, child_id)
  - [ ] Add indexes: idx_combo_rule_child_states_rule, idx_combo_rule_child_states_child
  - [ ] Create migration file: database/migrations/XXX_add_combo_rule_child_states.sql
  - [ ] Add trigger for updated_at

- [ ] Task 3: Implement tiered combo calculation logic (AC: #4-#9, #18-#20)
  - [ ] Extend lib/services/combo-calculator.ts with tiered functions
  - [ ] Implement checkTieredCombo(childId, taskType, newStreakCount) function
    ```typescript
    export async function checkTieredCombo(
      childId: string,
      taskType: TaskType,
      newStreakCount: number
    ): Promise<ComboReward[]>
    ```
  - [ ] Implement calculateTieredRewards(rule, currentCount, triggeredTiers) function
    ```typescript
    function calculateTieredRewards(
      rule: ComboRule,
      currentCount: number,
      triggeredTiers: number[]
    ): TieredReward[]
    ```
  - [ ] Implement getUntriggeredTiers(tieredConfig, triggeredTiers) helper
    ```typescript
    function getUntriggeredTiers(
      tieredConfig: TieredConfig[],
      triggeredTiers: number[]
    ): TieredConfig[]
    ```
  - [ ] Implement getTiersEligibleForReward(tieredConfig, currentCount) helper
    ```typescript
    function getTiersEligibleForReward(
      tieredConfig: TieredConfig[],
      currentCount: number
    ): TieredConfig[]
    ```
  - [ ] Implement sortTiersByThreshold(tieredConfig) helper
  - [ ] Add unit tests for all tiered calculation functions

- [ ] Task 4: Implement tier state tracking storage (AC: #10-#12)
  - [ ] Create lib/db/queries/combo-rule-states.ts
  - [ ] Implement getOrCreateRuleState(ruleId, childId) function
    ```typescript
    export async function getOrCreateRuleState(
      ruleId: string,
      childId: string
    ): Promise<ComboRuleChildState>
    ```
  - [ ] Implement updateTriggeredTiers(ruleId, childId, newTiers, streakCount) function
    ```typescript
    export async function updateTriggeredTiers(
      ruleId: string,
      childId: string,
      newTiers: number[],
      streakCount: number
    ): Promise<void>
    ```
  - [ ] Implement getTriggeredTiers(ruleId, childId) function
  - [ ] Implement resetRuleState(ruleId, childId?) function
  - [ ] Implement resetRuleStatesByRuleId(ruleId) for config changes

- [ ] Task 5: Implement configuration change handling (AC: #13-#14)
  - [ ] Modify combo rules PUT endpoint
  - [ ] On rule config change: call resetRuleStatesByRuleId(ruleId)
  - [ ] Delete or reset all child states for the rule
  - [ ] Log config change event
  - [ ] Add telemetry for reset events

- [ ] Task 6: Combine tiered and linear rewards (AC: #15-#17)
  - [ ] Modify combo calculator to return combined results
  - [ ] Process both linear and tiered rules in same flow
  - [ ] Combine rewards into single list
  - [ ] Maintain order: linear rewards first, then tiered rewards
  - [ ] Award all rewards in single transaction

- [ ] Task 7: Implement points history recording (AC: #25)
  - [ ] Extend awardComboPoints to support tiered metadata
  - [ ] Build metadata for tiered rewards:
    ```typescript
    {
      streak_count,
      task_type,
      tier_threshold,
      tier_reward,
      tier_index,
      all_triggered_tiers: [...]
    }
    ```
  - [ ] Record with type 'combo_reward_tiered'

- [ ] Task 8: Write BDD tests (AC: #4-#28)
  - [ ] Test tiered reward triggers at each threshold
  - [ ] Test each tier only triggers once
  - [ ] Test no duplicate rewards for passed tiers
  - [ ] Test config change resets triggered tiers
  - [ ] Test tiered + linear combined
  - [ ] Test task type filtering
  - [ ] Test multiple tiered rules
  - [ ] Test zero-reward tiers
  - [ ] Test large threshold values
  - [ ] Test performance with 100+ rules and states

- [ ] Task 9: Add telemetry and monitoring (AC: #26-#28)
  - [ ] Track tiered combo triggering events
  - [ ] Monitor tier calculation performance
  - [ ] Alert on JSON parsing errors
  - [ ] Track rule state reset events
  - [ ] Create dashboard for tiered combo effectiveness

- [ ] Task 10: Implement UI for tiered configuration (Story 5.6)
  - [ ] Create tier configuration editor component
  - [ ] Support add/remove tiers
  - [ ] Validate tier thresholds are ascending
  - [ ] Show preview of reward structure
  - [ ] Support drag-and-drop tier reordering

## Dev Notes

### Database Schema

**Existing: combo_rules table** (from Story 5.2, already has tiered_config field)

**New Table: `combo_rule_child_states`**
```sql
CREATE TABLE combo_rule_child_states (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  combo_rule_id TEXT NOT NULL REFERENCES combo_rules(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  triggered_tiers JSON NOT NULL DEFAULT '[]',
  last_streak_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (combo_rule_id) REFERENCES combo_rules(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(combo_rule_id, child_id)
);

-- Indexes
CREATE INDEX idx_combo_rule_child_states_rule ON combo_rule_child_states(combo_rule_id);
CREATE INDEX idx_combo_rule_child_states_child ON combo_rule_child_states(child_id);

-- Trigger for updated_at
CREATE TRIGGER update_combo_rule_child_states_timestamp
AFTER UPDATE ON combo_rule_child_states
BEGIN
  UPDATE combo_rule_child_states SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;
```

**Tiered Config JSON Structure:**
```json
[
  { "threshold": 7, "reward": 30 },
  { "threshold": 14, "reward": 70 },
  { "threshold": 30, "reward": 150 }
]
```

**Validation:**
```sql
-- Check that tiered_config is valid JSON array
CHECK(
  tiered_config IS NULL OR
  json_valid(tiered_config) AND
  json_array_length(tiered_config) > 0
)

-- Check thresholds are ascending and unique (application-level validation)
```

### API Integration Points

**1. Internal: Called from combo calculator (Story 5.2)**
```typescript
// lib/services/combo-calculator.ts
export async function checkAllCombos(
  childId: string,
  taskType: TaskType,
  newStreakCount: number
): Promise<ComboReward[]> {
  const rewards: ComboReward[] = [];

  // Check linear combos
  const linearRewards = await checkLinearCombo(childId, taskType, newStreakCount);
  rewards.push(...linearRewards);

  // Check tiered combos
  const tieredRewards = await checkTieredCombo(childId, taskType, newStreakCount);
  rewards.push(...tieredRewards);

  return rewards;
}
```

**2. Reset triggered tiers when rule changes:**
```typescript
// PUT /api/combo/rules/[id]
export async function updateComboRule(ruleId: string, updates: ComboRuleUpdate) {
  // ... update rule ...

  // If tiered_config changed, reset all child states
  if (updates.tiered_config) {
    await resetRuleStatesByRuleId(ruleId);
  }
}
```

### Logic Flow

```
Streak Incremented (from Story 5.1)
  ↓
Get family_id from child
  ↓
Get all enabled combo rules for family (both linear and tiered)
  ↓
For each tiered rule:
  ↓
  Check if task_type matches
    - If task_types is null: match all
    - If task_types is array: check inclusion
  ↓
  If matches:
    ↓
    Get or create rule state from combo_rule_child_states
    ↓
    Parse triggered_tiers JSON array
    ↓
    Parse tiered_config JSON array
    ↓
    Filter to untriggered tiers:
      - tiered_config where threshold NOT IN triggered_tiers
    ↓
    Filter to eligible tiers:
      - untriggered tiers where threshold <= currentStreak
    ↓
    For each eligible tier:
      ↓
      Calculate reward = tier.reward
      Add to rewards list
      Add to new_triggered_tiers
  ↓
    If rewards found:
      ↓
      Update triggered_tiers in storage
      Update last_streak_count
  ↓
After checking all tiered rules:
  ↓
  Combine with linear rewards
  ↓
  If rewards list not empty:
    ↓
    For each reward in rewards:
      ↓
      Award points (same as Story 5.2)
      Record to points_history with tiered metadata
  ↓
Return rewards list
```

### Calculation Examples

**Example 1: Single tiered rule**
```
Config: [{threshold: 7, reward: 30}, {threshold: 14, reward: 70}]

Streak 6 → 7: +30 pts, triggered: [7]
Streak 8-13: 0 pts, triggered: [7]
Streak 13 → 14: +70 pts, triggered: [7, 14]
Streak 15+: 0 pts, triggered: [7, 14]
```

**Example 2: Tiered + Linear combined**
```
Linear: [{threshold: 7, reward: 20}]
Tiered: [{threshold: 7, reward: 30}, {threshold: 14, reward: 70}]

Streak 6 → 7:
  - Linear: +20 pts
  - Tiered: +30 pts
  - Total: +50 pts

Streak 13 → 14:
  - Linear: +20 pts
  - Tiered: +70 pts
  - Total: +90 pts
```

**Example 3: Multiple task types**
```
Rule 1: task_types=["brush"], tiers=[{7:30}]
Rule 2: task_types=["teach"], tiers=[{5:20}]

Streak brush: 6 → 7: +30 pts (Rule 1)
Streak teach: 4 → 5: +20 pts (Rule 2)
```

### Testing Strategy

**Unit Tests:**
```typescript
describe('Tiered Combo Calculator', () => {
  it('should trigger first tier at threshold', () => {
    const config = [{threshold: 7, reward: 30}];
    const triggeredTiers = [];
    const eligible = getTiersEligibleForReward(config, 7);
    expect(eligible).toEqual([{threshold: 7, reward: 30}]);
  });

  it('should trigger each tier only once', () => {
    const config = [{threshold: 7, reward: 30}, {threshold: 14, reward: 70}];
    expect(getTiersEligibleForReward(config, 7, [])).toHaveLength(1);
    expect(getTiersEligibleForReward(config, 14, [7])).toHaveLength(1);
    expect(getTiersEligibleForReward(config, 15, [7, 14])).toHaveLength(0);
  });

  it('should not trigger already triggered tiers', () => {
    const config = [{threshold: 7, reward: 30}, {threshold: 14, reward: 70}];
    const triggeredTiers = [7];
    const untriggered = getUntriggeredTiers(config, triggeredTiers);
    expect(untriggered).toEqual([{threshold: 14, reward: 70}]);
  });
});
```

**Integration Tests:**
```typescript
describe('Story 5.3: Tiered Combo Integration', () => {
  it('should trigger tiers in sequence', async () => {
    // Given
    const family = await createFamily();
    const child = await createChild({ familyId: family.id });
    const rule = await createComboRule({
      type: 'tiered',
      taskTypes: ['brush'],
      tieredConfig: [{threshold: 7, reward: 30}, {threshold: 14, reward: 70}]
    });

    // When - Reach first tier
    for (let i = 0; i < 7; i++) {
      await completeAndApproveTask({ childId: child.id, taskType: 'brush' });
    }

    // Then - First tier triggered
    const state1 = await getComboRuleState(rule.id, child.id);
    expect(state1.triggered_tiers).toEqual([7]);
    const history1 = await getPointsHistory(child.id);
    const tieredRewards1 = history1.filter(h => h.type === 'combo_reward_tiered');
    expect(tieredRewards1).toHaveLength(1);
    expect(tieredRewards1[0].points).toBe(30);

    // When - Reach second tier
    for (let i = 0; i < 7; i++) {
      await completeAndApproveTask({ childId: child.id, taskType: 'brush' });
    }

    // Then - Second tier triggered
    const state2 = await getComboRuleState(rule.id, child.id);
    expect(state2.triggered_tiers).toEqual([7, 14]);
    const history2 = await getPointsHistory(child.id);
    const tieredRewards2 = history2.filter(h => h.type === 'combo_reward_tiered');
    expect(tieredRewards2).toHaveLength(2);
    expect(tieredRewards2[1].points).toBe(70);
  });

  it('should reset triggered tiers on config change', async () => {
    // Given
    const family = await createFamily();
    const child = await createChild({ familyId: family.id });
    const rule = await createComboRule({
      type: 'tiered',
      taskTypes: ['brush'],
      tieredConfig: [{threshold: 7, reward: 30}]
    });

    // When - Trigger first tier
    for (let i = 0; i < 7; i++) {
      await completeAndApproveTask({ childId: child.id, taskType: 'brush' });
    }
    const state1 = await getComboRuleState(rule.id, child.id);
    expect(state1.triggered_tiers).toEqual([7]);

    // When - Update config
    await updateComboRule(rule.id, {
      tieredConfig: [{threshold: 5, reward: 20}, {threshold: 10, reward: 50}]
    });

    // Then - State reset
    const state2 = await getComboRuleState(rule.id, child.id);
    expect(state2.triggered_tiers).toEqual([]);
  });
});
```

### Performance Optimization

- Cache combo_rule_child_states for 5 minutes
- Use database indexes on (combo_rule_id, child_id)
- Batch state queries when processing multiple rules
- Implement JSON parsing validation on rule creation (not at runtime)

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] Each tier triggers only once
4. [ ] Rewards increase with higher tiers
5. [ ] Config change resets triggered tiers
6. [ ] Combined with linear combo works
7. [ ] Points history recorded with full metadata
8. [ ] Task type filtering works
9. [ ] Edge cases handled (zero rewards, large thresholds)
10. [ ] Error handling robust
11. [ ] Performance requirements met (< 500ms)
12. [ ] Code review passed

## Dependencies

- Epic 5: Story 5.1 (System Tracks Task Completion Streak) - Provides streak count
- Epic 5: Story 5.2 (Linear Combo Reward System) - Combined calculation, same table
- Epic 5: Story 5.6 (Parent Configures Combo Rules) - UI for rule management
- Epic 3: Story 3.1 (System Calculates Points) - Points award mechanism

## Dev Agent Record

### File List

**Files to Create:**
- database/migrations/XXX_add_combo_rule_child_states.sql
- lib/db/queries/combo-rule-states.ts

**Files to Modify:**
- lib/services/combo-calculator.ts (add tiered functions)
- lib/db/queries/combo-rules.ts (add state queries)
- app/api/combo/rules/[id]/route.ts (reset states on update)
- lib/db/queries/index.ts (export state queries)

**Test Files:**
- tests/integration/combo-tiered.spec.ts
- tests/unit/tiered-calculator.spec.ts

### Database Migration

```sql
-- database/migrations/002_add_combo_rule_child_states.sql

-- Create combo_rule_child_states table
CREATE TABLE combo_rule_child_states (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  combo_rule_id TEXT NOT NULL REFERENCES combo_rules(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  triggered_tiers JSON NOT NULL DEFAULT '[]',
  last_streak_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (combo_rule_id) REFERENCES combo_rules(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(combo_rule_id, child_id)
);

-- Create indexes
CREATE INDEX idx_combo_rule_child_states_rule ON combo_rule_child_states(combo_rule_id);
CREATE INDEX idx_combo_rule_child_states_child ON combo_rule_child_states(child_id);

-- Create trigger for updated_at
CREATE TRIGGER update_combo_rule_child_states_timestamp
AFTER UPDATE ON combo_rule_child_states
BEGIN
  UPDATE combo_rule_child_states SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

-- Rollback:
DROP TRIGGER IF EXISTS update_combo_rule_child_states_timestamp;
DROP INDEX IF EXISTS idx_combo_rule_child_states_child;
DROP INDEX IF EXISTS idx_combo_rule_child_states_rule;
DROP TABLE IF EXISTS combo_rule_child_states;
```
