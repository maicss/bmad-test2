# Story 5.4a: Combo Warning Notification
# Status: ready-for-dev

## Story

As a 系统,
I want 在Combo即将中断时发送预警通知,
So that 儿童可以及时完成当天任务，保持连续完成记录，增强成就感。

## Acceptance Criteria

### Warning Trigger Conditions (AC1-AC8)

1. **AC1**: Given 儿童有进行中的Combo（任一任务类型连续计数>0）且预警功能启用
   When 系统检测到距离当天任务结束时间不足warning_hours_before（默认2小时）
   And 儿童尚未完成当天的该类型任务
   Then 系统推送预警通知到儿童设备
   And 通知类型标记为"combo_warning"
   And 通知优先级为"normal"（非紧急）

2. **AC2**: Given 预警通知发送时
   When 生成通知内容
   Then 通知标题为"🎯 加油！别断掉Combo！"
   And 通知正文为"你已经连续完成了{天数}天，再完成1个{任务类型}任务就能保持Combo啦！💪"
   And 通知包含emoji图标增加亲和力

3. **AC3**: Given 预警功能配置了自定义消息模板
   When 发送预警通知
   Then 系统使用自定义模板替换变量：
   - {days} → 当前连续天数
   - {task_type} → 任务类型名称（中文）
   - {threshold} → 下一阈值（如果是阶梯Combo）
   And 模板变量不存在时使用默认值

4. **AC4**: Given 儿童当天已完成该类型任务
   When 系统检查预警条件
   Then 不发送预警通知（任务已完成，无需提醒）
   And 记录检查日志："[childId][taskType] 已完成今日任务，跳过预警"

5. **AC5**: Given Combo已中断（连续计数=0或跨天重置后未开始新计数）
   When 检查预警条件
   Then 不发送预警通知（无Combo可中断）
   And 记录检查日志："[childId][taskType] 无进行中Combo，跳过预警"

6. **AC6**: Given 预警功能被禁用（warning_enabled=0）
   When 检查预警条件
   Then 不发送预警通知
   And 跳过预警检查逻辑

7. **AC7**: Given 当前时间不在预警时间窗口内
   When 系统检查预警条件
   Then 不发送预警通知
   And 预警窗口：从(截止时间 - warning_hours_before)到截止时间
   And 示例：截止时间18:00，预警2小时 → 窗口为16:00-18:00

8. **AC8**: Given 儿童账户被禁用或冻结
   When 检查预警条件
   Then 不发送预警通知
   And 跳过该儿童的处理

### Warning Scheduling and Deduplication (AC9-AC13)

9. **AC9**: Given 预警检查需要定时执行
   When 系统定时任务运行（每小时）
   Then 检查所有有进行中Combo的儿童
   And 对满足预警条件的儿童发送通知
   And 执行时间为每小时的第5分钟（避免整点高峰）

10. **AC10**: Given 同一天已发送过预警
    When 再次检查时
    Then 不重复发送（每天每任务类型最多1次预警）
    And 通过combo_notifications表检查当天是否已发送

11. **AC11**: Given 预警发送记录需要追踪
    When 预警发送时
    Then 记录到combo_notifications表
    And 类型为"warning"
    And 记录发送日期（DATE(sent_at)）
    And 记录streak_count、task_type、message

12. **AC12**: Given 多个任务类型都有进行中Combo
    When 预警检查运行时
    Then 每个任务类型独立检查和发送预警
    And 每个类型每天最多1次预警
    And 示例：儿童有刷牙和学习Combo，两个都可能收到预警

13. **AC13**: Given 预警检查任务执行
    When 处理批量儿童
    Then 每批最多处理100个儿童
    And 使用分页查询避免内存溢出
    And 处理完成后记录执行日志

### Notification Delivery and Error Handling (AC14-AC18)

14. **AC14**: Given 预警通知已生成
    When 推送服务可用
    Then 通知在3秒内送达（NFR4: 实时<3秒）
    And 使用WebSocket或APNs/Firebase推送

15. **AC15**: Given 预警通知推送失败
    When 首次推送失败
    Then 不进行重试（预警非关键通知）
    And 记录失败日志
    And 继续处理下一个儿童

16. **AC16**: Given 儿童设备离线
    When 预警触发
    Then 通知存储到服务器
    And 待设备上线后通过推送服务同步
    And 标记通知为待推送状态

17. **AC17**: Given 预警通知存储
    When 记录时
    Then 存储到notifications表（来自Epic 6）
    And 类型为"combo_warning"
    And 包含metadata: { task_type, streak_count, message }
    And 设置priority="normal"

18. **AC18**: Given 推送服务暂时不可用
    When 预警触发
    Then 通知先存入数据库
    And 记录到待发送队列
    And 推送服务恢复后批量发送

### Task Deadline Configuration (AC19-AC21)

19. **AC19**: Given 任务计划模板配置了截止时间（reminder_time）
    When 计算预警窗口
    Then 使用该任务的截止时间
    And 预警窗口 = reminder_time - warning_hours_before

20. **AC20**: Given 任务计划模板未配置截止时间
    When 计算预警窗口
    Then 使用全局默认截止时间18:00
    And 预警窗口 = 18:00 - warning_hours_before（默认16:00-18:00）

21. **AC21**: Given warning_hours_before配置为0
    When 计算预警窗口
    Then 预警窗口为空（不发送预警）
    And 实际上相当于禁用预警功能

### Performance and Limits (AC22-AC25)

22. **AC22**: Given 预警检查任务执行
    When 处理批量儿童
    Then 单次执行时间 < 60秒（100个儿童）
    And 使用并行处理提高效率

23. **AC23**: Given 预警通知发送
    When 数据库操作
    Then 插入操作在100ms内完成
    And 使用批量插入优化性能

24. **AC24**: Given 系统有大量Combo数据
    When 执行预警检查
    Then 使用索引优化查询：
    - idx_combo_notifications_child_date
    - idx_users_streak_data
    And 响应时间保持稳定

25. **AC25**: Given 预警检查失败（如数据库错误）
    When 任务执行时
    Then 记录错误日志
    And 发送警报给开发团队
    And 不影响下次 scheduled execution

### Notification Content Variations (AC26-AC28)

26. **AC26**: Given 儿童连续天数达到下一个奖励阈值
    When 发送预警通知
    Then 通知内容额外提示："再坚持一下，马上就能获得{奖励}分啦！"
    And 激励儿童完成任务

27. **AC27**: Given 儿童连续天数为1（刚开始Combo）
    When 发送预警通知
    Then 通知内容为："今天坚持完成，就能保住第一天的Combo哦！"
    And 使用温和的鼓励语调

28. **AC28**: Given 儿童连续天数很高（如30天以上）
    When 发送预警通知
    Then 通知内容突出成就感："你已经坚持了{天数}天，别让努力白费！"
    And 强调失去Combo的可惜

## Tasks / Subtasks

- [ ] Task 1: Database Schema Setup (AC8, AC11)
  - [ ] Verify combo_notifications table exists with fields:
    - id (TEXT PRIMARY KEY)
    - child_id (TEXT NOT NULL REFERENCES users(id))
    - task_type (TEXT NOT NULL)
    - notification_type (TEXT NOT NULL CHECK(type IN ('warning', 'interruption')))
    - streak_count (INTEGER NOT NULL)
    - message (TEXT)
    - sent_at (INTEGER NOT NULL)
    - created_at (INTEGER NOT NULL)
  - [ ] Create migration file if not exists
  - [ ] Add index: idx_combo_notifications_child_date (child_id, DATE(sent_at))
  - [ ] Add index: idx_combo_notifications_type (notification_type)
  - [ ] Add index: idx_combo_notifications_sent_at (sent_at)

- [ ] Task 2: Warning Check Service Implementation (AC1-AC8, AC19-AC21)
  - [ ] Create lib/services/combo-warning.ts
  - [ ] Implement checkWarningNeeded(childId, taskType) function
    ```typescript
    export async function checkWarningNeeded(
      childId: string,
      taskType: TaskType
    ): Promise<WarningCheckResult>
    ```
  - [ ] Implement getTaskDeadlineTime(taskType) function
    ```typescript
    async function getTaskDeadlineTime(
      taskType: TaskType
    ): Promise<string> // Returns "18:00" format
    ```
  - [ ] Implement isWithinWarningWindow(deadline, warningHours) check
    ```typescript
    function isWithinWarningWindow(
      deadline: Date,
      warningHours: number
    ): boolean
    ```
  - [ ] Implement hasCompletedToday(childId, taskType) check
    ```typescript
    async function hasCompletedToday(
      childId: string,
      taskType: TaskType
    ): Promise<boolean>
    ```
  - [ ] Implement hasActiveCombo(childId, taskType) check
    ```typescript
    async function hasActiveCombo(
      childId: string,
      taskType: TaskType
    ): Promise<boolean>
    ```
  - [ ] Get combo rules with warning_enabled=true
  - [ ] Filter by task type matching

- [ ] Task 3: Warning Message Generation (AC2-AC3, AC26-AC28)
  - [ ] Create lib/utils/combo-message-templates.ts
  - [ ] Implement generateWarningMessage(template, days, taskType, threshold) function
    ```typescript
    export function generateWarningMessage(
      template: string | null,
      days: number,
      taskType: string,
      threshold?: number
    ): string
    ```
  - [ ] Support template variables: {days}, {task_type}, {threshold}
  - [ ] Define default message templates:
    - Early stage (1-3 days): 温和鼓励
    - Medium stage (4-13 days): 正常提醒
    - Near threshold (14+ days): 强调即将达成
    - Long streak (30+ days): 强调成就感
  - [ ] Fallback to default message if no template
  - [ ] Add emoji to default messages

- [ ] Task 4: Warning Notification Sender (AC14-AC18)
  - [ ] Create sendWarningNotification(childId, taskType, streakCount, message) function
    ```typescript
    export async function sendWarningNotification(
      childId: string,
      taskType: TaskType,
      streakCount: number,
      message: string
    ): Promise<{ success: boolean; notificationId?: string }>
    ```
  - [ ] Use existing notification sender from Epic 6
  - [ ] Set priority="normal" (not critical)
  - [ ] Store in notifications table with type="combo_warning"
  - [ ] Store in combo_notifications table for tracking
  - [ ] Handle push service errors gracefully
  - [ ] Implement offline queue for delivery

- [ ] Task 5: Deduplication and Tracking (AC10-AC13)
  - [ ] Implement hasSentWarningToday(childId, taskType) check
    ```typescript
    async function hasSentWarningToday(
      childId: string,
      taskType: TaskType
    ): Promise<boolean>
    ```
  - [ ] Implement recordWarningSent(childId, taskType, streakCount, message) function
    ```typescript
    async function recordWarningSent(
      childId: string,
      taskType: TaskType,
      streakCount: number,
      message: string
    ): Promise<void>
    ```
  - [ ] Create database queries for combo_notifications
  - [ ] Implement batch processing with pagination (100 children per batch)

- [ ] Task 6: Cron Job Implementation (AC9, AC13, AC22-AC25)
  - [ ] Create scripts/check-combo-warnings.ts
  - [ ] Run every hour using bun-cron or similar
  - [ ] Implement main logic:
    ```typescript
    async function checkAllComboWarnings() {
      // Get all children with active combos
      // Batch process: 100 children per batch
      // For each child, check all task types
      // For each task type, check warning conditions
      // Send warning if needed
    }
    ```
  - [ ] Add error handling and logging
  - [ ] Add performance metrics
  - [ ] Implement timeout protection (max 60s execution)
  - [ ] Schedule cron: "5 * * * *" (every hour at minute 5)

- [ ] Task 7: Warning Settings Integration (AC1, AC6, AC19-AC21)
  - [ ] Read warning_enabled from combo_rules
  - [ ] Read warning_hours_before (default: 2)
  - [ ] Read warning_message_template
  - [ ] Read task_plan.reminder_time for deadline
  - [ ] Combine all settings to calculate warning window

- [ ] Task 8: Write BDD Tests (AC1-AC28)
  - [ ] Test: given 儿童有进行中的Combo，当天任务未完成，距离截止不足2小时，then 发送预警通知
  - [ ] Test: given 儿童当天已完成该任务，then 不发送预警
  - [ ] Test: given 同一天已发送过预警，then 不重复发送
  - [ ] Test: given Combo已中断，then 不发送预警
  - [ ] Test: given 自定义模板，then 使用模板变量替换
  - [ ] Test: given 预警功能禁用，then 不发送预警
  - [ ] Test: given 不在预警时间窗口，then 不发送预警
  - [ ] Test: given 多个任务类型都有Combo，then 每个类型独立检查
  - [ ] Test: given 推送失败，then 不重试但记录日志
  - [ ] Test: given 推送服务离线，then 存储到队列
  - [ ] Test: given 连续天数很高，then 使用成就感模板
  - [ ] Test: given 批量处理100个儿童，then 在60秒内完成
  - [ ] Test: given 数据库错误，then 记录日志并发送警报

- [ ] Task 9: Monitoring and Telemetry (AC22-AC25)
  - [ ] Track warning check execution time
  - [ ] Track warning notification sent count
  - [ ] Track push service success/failure rate
  - [ ] Create dashboard for warning effectiveness
  - [ ] Add alerts for execution failures

- [ ] Task 10: UI for Warning Configuration (Story 5.6)
  - [ ] Add warning_enabled toggle in combo rule configuration
  - [ ] Add warning_hours_before input (default: 2)
  - [ ] Add warning_message_template textarea
  - [ ] Show preview of warning message with template variables
  - [ ] Add test warning button

## Dev Notes

### Database Schema

**New Table: `combo_notifications`**
```sql
CREATE TABLE combo_notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK(task_type IN ('brush', 'teach', 'exercise', 'chores', 'custom')),
  notification_type TEXT NOT NULL CHECK(notification_type IN ('warning', 'interruption')),
  streak_count INTEGER NOT NULL,
  message TEXT NOT NULL,
  sent_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_combo_notifications_child_date ON combo_notifications(child_id, date(sent_at, 'unixepoch'));
CREATE INDEX idx_combo_notifications_type ON combo_notifications(notification_type);
CREATE INDEX idx_combo_notifications_sent_at ON combo_notifications(sent_at DESC);
CREATE INDEX idx_combo_notifications_child_task_type ON combo_notifications(child_id, task_type);
```

### Warning Time Calculation

```typescript
// lib/services/combo-warning.ts
interface WarningWindow {
  start: Date; // deadline - warning_hours_before
  end: Date;   // deadline
  now: Date;   // current time
}

function getTaskDeadline(taskType: TaskType): string {
  // Check task_plans.reminder_time first
  // If not set, use global default 18:00
}

function calculateWarningWindow(
  deadline: string, // "18:00"
  warningHoursBefore: number // 2
): WarningWindow {
  const [hours, minutes] = deadline.split(':').map(Number);
  const deadlineDate = new Date();
  deadlineDate.setHours(hours, minutes, 0, 0);

  const startDate = new Date(deadlineDate);
  startDate.setHours(startDate.getHours() - warningHoursBefore);

  return {
    start: startDate,
    end: deadlineDate,
    now: new Date()
  };
}

function isWithinWarningWindow(window: WarningWindow): boolean {
  return window.now >= window.start && window.now < window.end;
}
```

### Default Message Templates

```typescript
// lib/utils/combo-message-templates.ts
const WARNING_TEMPLATES = {
  early: (days: number, taskType: string) =>
    `🎯 今天坚持完成，就能保住第${days}天的Combo哦！`,

  normal: (days: number, taskType: string) =>
    `🎯 加油！别断掉Combo！你已经连续完成了${days}天，再完成1个${taskType}任务就能保持啦！💪`,

  nearThreshold: (days: number, taskType: string, threshold: number) =>
    `🎉 太棒了！再坚持${threshold - days}天，就能获得${threshold}天奖励啦！别让努力白费！💪`,

  longStreak: (days: number, taskType: string) =>
    `🌟 你已经坚持了${days}天，真的太厉害了！别让这${days}天的努力白费，坚持完成今天的任务！`
};

export function getWarningTemplate(
  days: number,
  taskType: string,
  threshold?: number
): string {
  if (threshold && days >= threshold - 3) {
    return WARNING_TEMPLATES.nearThreshold(days, taskType, threshold);
  }
  if (days >= 30) {
    return WARNING_TEMPLATES.longStreak(days, taskType);
  }
  if (days <= 3) {
    return WARNING_TEMPLATES.early(days, taskType);
  }
  return WARNING_TEMPLATES.normal(days, taskType);
}
```

### Cron Job Schedule

```typescript
// scripts/check-combo-warnings.ts
import { cron } from 'bun-cron';

cron('5 * * * *', async () => {
  console.log('[Combo Warning] Starting check...');
  const startTime = Date.now();

  try {
    await checkAllComboWarnings();
    const duration = Date.now() - startTime;
    console.log(`[Combo Warning] Completed in ${duration}ms`);
  } catch (error) {
    console.error('[Combo Warning] Failed:', error);
    await sendAlert('Combo warning check failed', error);
  }
});
```

### API Integration Points

```typescript
// GET /api/combo/rules (from Story 5.6)
// Returns: {
//   rules: [{
//     id, type, taskTypes, threshold,
//     warning_enabled,
//     warning_hours_before,
//     warning_message_template
//   }]
// }

// POST /api/notifications (reuse Epic 6)
// Request: {
//   type: 'combo_warning',
//   userId: childId,
//   message: '...',
//   priority: 'normal',
//   metadata: { task_type, streak_count }
// }
```

### BDD Test Scenarios

```typescript
describe('Story 5.4a: Combo Warning Notification', () => {
  it('given 儿童有进行中的Combo，当天任务未完成，距离截止不足2小时，then 发送预警通知', async () => {
    // Given: 儿童有连续5天的刷牙Combo，预警配置启用
    const child = await createChildWithStreak('brush', 5);
    const comboRule = await createComboRule({
      warning_enabled: true,
      warning_hours_before: 2,
      taskTypes: ['brush']
    });

    // When: 系统时钟到达16:30（任务18:00截止前1.5小时）
    await travelTo('16:30');
    await checkAllComboWarnings();

    // Then: 预警通知已发送
    const notifications = await getComboWarnings(child.id);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].task_type).toBe('brush');
    expect(notifications[0].message).toContain('5天');
    expect(notifications[0].notification_type).toBe('warning');

    const pushNotifications = await getPushNotifications(child.id);
    expect(pushNotifications).toHaveLength(1);
    expect(pushNotifications[0].type).toBe('combo_warning');
  });

  it('given 儿童当天已完成该任务，then 不发送预警', async () => {
    // Given: 儿童已完成今天刷牙任务
    const child = await createChildWithStreak('brush', 5);
    await completeTask(child.id, 'brush', 'today');

    // When: 预警检查运行
    await checkAllComboWarnings();

    // Then: 无预警发送
    const notifications = await getComboWarnings(child.id);
    expect(notifications).toHaveLength(0);
  });

  it('given 同一天已发送过预警，then 不重复发送', async () => {
    // Given: 已发送过预警
    const child = await createChildWithStreak('brush', 5);
    await sendWarningNotification(child.id, 'brush', 5, 'message');
    await travelTo('16:00');
    await checkAllComboWarnings(); // First warning
    const firstNotifications = await getComboWarnings(child.id);
    expect(firstNotifications).toHaveLength(1);

    // When: 一小时后再次检查
    await travelTo('17:00');
    await checkAllComboWarnings(); // Second check

    // Then: 无新预警发送
    const secondNotifications = await getComboWarnings(child.id);
    expect(secondNotifications).toHaveLength(1); // Still 1, not 2
  });

  it('given Combo已中断，then 不发送预警', async () => {
    // Given: Combo中断（连续计数为0）
    const child = await createChild();
    const comboRule = await createComboRule({ warning_enabled: true });

    // When: 预警检查运行
    await checkAllComboWarnings();

    // Then: 无预警发送
    const notifications = await getComboWarnings(child.id);
    expect(notifications).toHaveLength(0);
  });

  it('given 自定义模板，then 使用模板变量替换', async () => {
    // Given: 配置自定义模板
    const child = await createChildWithStreak('brush', 7);
    const comboRule = await createComboRule({
      warning_enabled: true,
      warning_message_template: '宝贝，你已经坚持了{days}天，加油！再完成{task_type}任务！'
    });

    // When: 预警触发
    await travelTo('16:00');
    await checkAllComboWarnings();

    // Then: 使用自定义模板
    const notifications = await getComboWarnings(child.id);
    expect(notifications[0].message).toContain('坚持了7天');
    expect(notifications[0].message).toContain('刷牙任务');
  });

  it('given 批量处理100个儿童，then 在60秒内完成', async () => {
    // Given: 创建100个有进行中Combo的儿童
    const children = await createChildrenWithStreak(100, 'brush', 5);

    // When: 执行预警检查
    const startTime = Date.now();
    await checkAllComboWarnings();
    const duration = Date.now() - startTime;

    // Then: 在60秒内完成
    expect(duration).toBeLessThan(60000);
    const totalNotifications = await getComboWarningsCount();
    expect(totalNotifications).toBe(100); // All 100 children should receive warning
  });
});
```

### Performance Optimization

- Use database indexes for efficient queries
- Implement batch processing (100 children per batch)
- Cache combo rules for 5 minutes
- Use parallel processing for independent children
- Implement query result pagination

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] Warning sent correctly when conditions met
4. [ ] No duplicate warnings per day
5. [ ] Custom templates work correctly
6. [ ] Push notifications delivered within 3s
7. [ ] Batch processing completes in < 60s
8. [ ] Database operations complete in < 100ms
9. [ ] Error handling robust (logging, alerts)
10. [ ] Code review passed

## Dependencies

- Epic 5: Story 5.1 (Streak Tracking) - Provides streak count
- Epic 5: Story 5.2, 5.3 (Combo Rules) - Warning configuration
- Epic 6: Story 6.7 (Global Notification Center) - Notification infrastructure
- Epic 2: Story 2.1 (Task Plan Template) - reminder_time configuration

## Dev Agent Record

### File List

**Files to Create:**
- database/migrations/XXX_add_combo_notifications.sql
- lib/services/combo-warning.ts
- lib/utils/combo-message-templates.ts
- scripts/check-combo-warnings.ts
- lib/db/queries/combo-notifications.ts

**Files to Modify:**
- lib/services/streak-calculator.ts (no changes needed)
- lib/db/queries/notifications.ts (add combo_warning type)
- lib/db/queries/index.ts (export new queries)

**Test Files:**
- tests/integration/combo-warning.spec.ts
- tests/unit/combo-message-templates.spec.ts

### Database Migration

```sql
-- database/migrations/003_add_combo_notifications.sql

-- Create combo_notifications table
CREATE TABLE combo_notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK(task_type IN ('brush', 'teach', 'exercise', 'chores', 'custom')),
  notification_type TEXT NOT NULL CHECK(notification_type IN ('warning', 'interruption')),
  streak_count INTEGER NOT NULL,
  message TEXT NOT NULL,
  sent_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_combo_notifications_child_date ON combo_notifications(child_id, date(sent_at, 'unixepoch'));
CREATE INDEX idx_combo_notifications_type ON combo_notifications(notification_type);
CREATE INDEX idx_combo_notifications_sent_at ON combo_notifications(sent_at DESC);
CREATE INDEX idx_combo_notifications_child_task_type ON combo_notifications(child_id, task_type);

-- Rollback:
DROP INDEX IF EXISTS idx_combo_notifications_child_task_type;
DROP INDEX IF EXISTS idx_combo_notifications_sent_at;
DROP INDEX IF EXISTS idx_combo_notifications_type;
DROP INDEX IF EXISTS idx_combo_notifications_child_date;
DROP TABLE IF EXISTS combo_notifications;
```
