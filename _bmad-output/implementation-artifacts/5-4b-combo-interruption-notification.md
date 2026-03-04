#KH|# Story 5.4b: Combo Interruption Notification
#KM|
#ZB|Status: ready-for-dev
#RW|
#ZW|## Story
#SY|
#QZ|As a 系统,
#PR|I want 在Combo中断后发送正向鼓励通知,
#QS|So that 儿童即使中断也能获得安慰，保持积极心态。
#SK|
#SV|## Acceptance Criteria
#TX|

### Interruption Trigger (AC1-AC8)

#SB|1. **AC1**: Given 儿童连续计数被重置（从>0变为1）
#RK|   When 计数重置时
#SK|   Then 系统发送中断提醒通知

#VK|2. **AC2**: Given 中断通知内容
#TY|   When 生成时
#MY|   Then 标题："新开始！"
#TK|   And 内容："没关系，今天就是新的开始！昨天你完成了{天数}天"

#JN|3. **AC3**: Given 首次连续用户
#RJ|   When 计数变为1时
#RS|   Then 不发送中断通知（不是真正的中断）

#ZQ|4. **AC4**: Given 家长接收设置
#YB|   When 配置时
#WK|   Then 可开启/关闭家长通知

#KM|5. **AC5**: Given 通知鼓励性
#KM|   When 生成时
#KM|   Then 系统：
#KM|   - 使用积极语言和表情符号
#   - 避免负面词汇（"中断"、"失败"等）

#KM|6. **AC6**: Given 连续天数分段
#KM|   When 选择模板时
#KM|   Then 系统：
#KM|   - 1-3天："没关系，今天就是新的开始！😊"
#KM|   - 4-7天："昨天你表现很棒！我们一起重新开始吧！🌟"
#KM|   - 8-14天："你之前连续完成了{天数}天，太厉害了！今天继续加油！💪"
#   - 15+天："你之前连续完成了{天数}天，真是太棒了！相信你一定能再次挑战！🏆"

### Notification Recording (AC7-AC16)

#PY|7. **AC7**: Given 中断通知记录
#VW|   When 记录时
#BK|   Then 存储到combo_notifications表：
#RB|   - type: "combo_interruption"
#RB|   - child_id: 儿童ID
#RB|   - previous_streak: 中断前连续天数
#RB|   - message: 通知内容

#KM|8. **AC8**: Given 同一天多次中断
#XB|   When 发生时
#PJ|   Then 每天最多发送1次中断通知

#PY|9. **AC9**: Given 频率控制
#HM|   When 检查时
#KM|   Then 系统：
#KM|   - 每天最多1条中断通知
#   - 每周最多3条中断通知
#   - 24小时内不再发送（冷静期）

#KM|10. **AC10**: Given 冷静期检查
#SP|   When 检查频率时
#   Then 系统：
#KM|   - 查询最后一次中断通知发送时间
#KM|   - 超过24小时不发送

#KM|11. **AC11**: Given 手动重置
#XB|   When 发生时
#MM|   Then 不发送通知
#KT|

#KM|12. **AC12**: Given 重置原因记录
#BN|   When 重置时
#PB|   Then 记录：
#BN|   - reset_reason: 'manual' | 'missed' | 'system'
#RB|   - 通知家长："{child.name}手动重置了连续计数"

### Notification Delivery (AC13-AC18)

#KM|13. **AC13**: Given 通知发送渠道
#KM|   When 发送时
#   Then 系统：
#KM|   - 发送到儿童设备
#   - 可选发送到家长设备（如果开启）

#KM|14. **AC14**: Given 通知优先级
#KM|   When 设置时
#   Then 系统：
#   - 设置为NORMAL（低于徽章通知）
#   - 不使用HIGH优先级

#KM|15. **AC15**: Given 通知发送时间
#KM|   When 检测到中断时
#KM|   Then 系统：
#   - 在检测到中断后5分钟内发送
#   - 在8点-20点之间发送
#   - 超过这个时段不发送

#KM|16. **AC16**: Given 通知到达时间
#KM|   When 送达时
#   Then 系统在3秒内送达（NFR4）

#KM|17. **AC17**: Given 儿童端显示
#   When 中断通知到达儿童端时
#KM|   Then 系统：
#KM|   - 显示鼓励消息
#   - 不显示"中断"等负面词汇
#   - 提供"重新开始"快捷按钮

#KM|18. **AC18**: Given 家长端显示
#   When 中断通知到达家长端时
#KM|   Then 系统：
#KM|   - 显示儿童连续天数
#   - 显示鼓励性内容
#   - 提供鼓励孩子的快捷回复

### Parent Interaction (AC19-AC22)

#KM|19. **AC19**: Given 家长点击鼓励孩子
#KM|   When 点击鼓励时
#   Then 系统：
#KM|   - 发送鼓励消息给孩子
#   - 孩子收到正向反馈
#   - 记录鼓励行为
#KM|   - 家长可以自定义鼓励模板

#KM|20. **AC20**: Given 鼓励消息发送
#KM|   When 发送时
#     Then 系统：
#KM|   - 使用家长自定义模板或默认模板
#   - 发送到儿童设备
#   - 显示在消息中心

#KM|21. **AC21**: Given 鼓励消息模板
#KM|   When 家长选择模板时
#   Then 系统：
#   - 支持自定义消息
#   - 提供默认模板

#KM|22. **AC22**: Given 鼓励历史记录
#   When 记录时
#     Then 系统：
#   - 存储到messages表
#   - type: "encouragement"
#KM|   - sender_id: 家长ID
#   - receiver_id: 儿童ID

### Frequency Control (AC23-AC32)

#KM|23. **AC23**: Given 中断通知频率
#KM|   When 发送时
#   Then 系统限制：
#KM|   - 每天最多1条
#   - 每周最多3条
#   - 24小时冷静期

#KM|24. **AC24**: Given 冷静期检查
#   When 检查时
#   Then 系统：
#   - 查询上次发送时间
#   - 计算24小时窗口

#KM|25. **AC25**: Given 豁免情况
#KM|   When 满足豁免条件时
#   Then 不发送通知：
#   - 儿童主动暂停挑战
#   - 系统维护期间中断
#   - 家庭休假模式

#KM|26. **AC26**: Given 通知渠道选择
#KM|   When 发送时
#   Then 系统：
#   - 优先使用App推送
#   - 次选Web推送
#   - 最后选站内消息

#KM|27. **AC27**: Given 设备离线
#KM|   When 设备离线时
#   Then 系统：
#   - 存储待发送通知
#   - 设备上线后推送

#KM|28. **AC28**: Given 同一儿童多次中断
#KM|   When 多个任务类型同一天中断
#KM|   Then 系统：
#   - 每个任务类型独立判断
#   - 发送每条中断通知（每天各类型最多1次）

#KM|29. **AC29**: Given 通知推送失败
#KM|   When 首次推送失败时
#KM|   Then 系统：
#   - 记录失败原因
#   - 最多重试2次
#   - 超过2次标记为失败

#KM|30. **AC30**: Given 通知存储失败
#KM|   When 存储失败时
#   Then 系统：
#   - 显示错误日志
#   - 不影响中断记录

#KM|31. **AC31**: Given 时区判断
#   When 检查一天边界时
#   Then 系统：
#   - 使用家庭所在时区
#   - 计算冷静期按时区

#KM|32. **AC32**: Given 跨天中断判断
#   When 判断时
#   Then 系统：
#   - 使用家庭所在时区
#   - 同一天不重复发送

#HQ|## Tasks / Subtasks
#VJ|

#TN|- [ ] Task 1: Interruption Detection (AC: #1-#4, #11, #28, #31-#32)
#JJ|  - [ ] Create lib/services/combo-interruption.ts:
#QW|    - detectInterruption(userId, previousStreak, resetReason): boolean
#QW|    - shouldSendNotification(userId, childId): boolean
#QW|    - isNewDay(streakData: string): boolean
#QW|    - Check timezone settings

#YY|- [ ] Task 2: Message Generation (AC: #2, #5-#6)
#MR|  - [ ] Generate interruption message based on previous streak
#NB|  - Support template variables: {天数}, {儿童昵称}
#NB|  - Add emoji: 😊 🌟 💪 🏆

#MK|- [ ] Task 3: Parent Notification (AC: #4, #19-#22)
#JX|  - [ ] Send to parent if enabled
#XN|  - [ ] Send encouragement message (default or custom)
#XN|  - Record encouragement behavior

#WY|- [ ] Task 4: Integration (AC: #11, #28)
#HR|  - [ ] Call from Story 5.1 streak reset
#QH|  - [ ] Pass reset reason
#QH|  - Check for each task type interruptuption

#QP|- [ ] Task 5: Create notification record schema (AC: #7-#8, #9, #12, #24, #25)
#VT|  - [ ] Extend combo_notifications table:
#VZ|    ```sql
#BN|    ALTER TABLE combo_notifications ADD COLUMN reset_reason TEXT CHECK(reset_reason IN ('manual', 'missed', 'system'));
#BN|    CREATE INDEX idx_combo_notifications_type_date ON combo_notifications(notification_type, DATE(created_at));
#BN|    ```
#BV|  - [ ] Create notification_frequency table for tracking:
#BN|    ```sql
#BN|    CREATE TABLE notification_frequency (
#BN|      id TEXT PRIMARY KEY,
#BN|      user_id TEXT NOT NULL REFERENCES users(id),
#BN|      notification_type TEXT NOT NULL,
#BN|      sent_at INTEGER NOT NULL,
#BN|      date TEXT NOT NULL -- YYYY-MM-DD
#BN|    );
#    CREATE UNIQUE(user_id, notification_type, date);
#BN|    ```

#QP|- [ ] Task 6: Frequency Control (AC: #9, #10, #23-#29)
#VT|  - [ ] Check daily limit: 1 per day
#ZT|  - [ ] Check weekly limit: 3 per week
#YJ|  - Check cooldown: 24 hours

#QP|- [ ] Task 7: Device Offline Handling (AC: #27)
#VT|  - [ ] Store notification for offline devices
#BN|  - [ ] Push when device comes back online

#QT|- [ ] Task 8: Write BDD Tests (All ACs)
#VT|  - [ ] **Given** 儿童连续计数从5天重置为1 **When** 检测到中断 **Then** 发送中断通知
#VT|  - [ ] **Given** 首次连续用户 **When** 计数变为1时 **Then** 不发送通知
#VT|  - [ ] **Given** 手动重置 **When** 发生时 **Then** 不发送通知
#VT|  - [ ] **Given** 同一天多次中断 **When** 发生时 **Then** 每天最多1条
#VT|  - [ ] **Given** 24小时内已发送 **When** 再次中断 **Then** 不重复发送
#VT|  - [ ] **Given** 家长点击鼓励孩子 **When** 点击 **Then** 发送鼓励消息
#VT|  - [ ] Use Bun Test for unit tests, Playwright for E2E

#VZ|- [ ] Task 9: Performance verification (AC: #16, #29)
#BN|  - [ ] Verify notification delivery < 3 seconds (NFR4)
#JN|  - [ ] Verify failure handling works correctly

#VZ|## Dev Notes
#BN|

#SH|### Database Schema
#NN|

#SH|```sql
#SH|-- Combo notifications table extension
#SH|ALTER TABLE combo_notifications ADD COLUMN reset_reason TEXT CHECK(reset_reason IN ('manual', 'missed', 'system'));
#SH|
#SH|-- Notification frequency tracking
#SH|CREATE TABLE notification_frequency (
#SH|  id TEXT PRIMARY KEY,
#SH|  user_id TEXT NOT NULL REFERENCES users(id),
#SH|  notification_type TEXT NOT NULL, -- 'combo_interruption', 'combo_warning', 'badge_earned'
#SH|  sent_at INTEGER NOT NULL,
#SH|  date TEXT NOT NULL, -- YYYY-MM-DD
#SH|  UNIQUE(user_id, notification_type, date)
#SH|);
#SH|
#SH|-- Index for frequency queries
#SH|CREATE INDEX idx_notification_frequency_user_type_date ON notification_frequency(user_id, notification_type, date);
#SH|CREATE INDEX idx_notification_frequency_date ON notification_frequency(date);
#SH|```

#SH|### Notification Payload
#NN|

#SH|```typescript
#SH|// Interruption notification to child
#SH|{
#SH|  "type": "combo_interruption",
#SH|  "title": "新开始！",
#SH|  "body": "没关系，今天就是新的开始！昨天你完成了5天",
#SH|  "data": {
#SH|    "childId": "child-123",
#SH|    "previousStreak": 5,
#SH|    "resetReason": "missed"
#SH|  },
#SH|  "priority": "normal",
#SH|  "channels": ["push", "webpush"]
#SH|}```
#SH|
#SH|// Encouragement message to child (from parent)
#SH|{
#SH|  "type": "encouragement",
#SH|  "title": "收到鼓励！",
#SH|  "body": "继续加油！爸爸为你加油！",
#SH|  "data": {
#SH|    "senderId": "parent-123",
#SH|    "childId": "child-123",
#SH|  }
#SH|}
#SH|```

#SH|### Interruption Message Templates
#NN|

#SH|| Range | Message | Emoji |
#SH||-------|---------|-------|
#SH|| 1-3 days | "没关系，今天就是新的开始！😊" | 😊 |
#SH|| 4-7 days | "昨天你表现很棒！我们一起重新开始吧！🌟" | 🌟 |
#SH|| 8-14 days | "你之前连续完成了{天数}天，太厉害了！今天继续加油！💪" | 💪 |
#SH|| 15+ days | "你之前连续完成了{天数}天，真是太棒了！相信你一定能再次挑战！🏆" | 🏆 |

#SH|### Frequency Control Logic
#NN|

#SH|```typescript
#SH|// lib/services/combo-interruption.ts
#SH|
#SH|async function shouldSendInterruption(
#SH|  userId: string,
#  childId: string
#SH|): Promise<boolean> {
#SH|  // 1. Check daily limit
#SH|  const today = new Date().toISOString().split('T')[0];
#SH|  const dailyCount = await getNotificationCountToday(userId, childId, 'combo_interruption');
#SH|  if (dailyCount >= 1) return false;
#SH|  
#SH|  // 2. Check weekly limit
#SH|  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
#SH|  const weekCount = await getNotificationCountWeek(userId, childId, 'combo_interruption', weekAgo);
#  if (weekCount >= 3) return false;
#SH|  
#  // 3. Check cooldown (24 hours)
#SH|  const lastSent = await getLastNotificationSent(userId, childId, 'combo_interruption');
#SH|  if (lastSent && Date.now() - lastSent < 24 * 60 * 60 * 1000) return false;
#SH|  
#  return true;
#SH|}
#SH|```

#SH|### BDD Test Scenarios
#NN|

#SH|```typescript
#SH|it('given 儿童连续计数从5天重置为1 when 检测到中断 then 发送中断通知', async () => {
#SH|  // Given: 儿童有连续5天的刷牙Combo，预警配置启用
#SH|  const child = await createChildWithStreak('brush', 5);
#SH|  
#  // When: 系统时钟到达16:30（任务18:00截止前1.5小时）
#SH|  await travelTo('16:30');
#  await travelTo('16:45'); // Missed task, streak reset to 1
#SH|  
#  // Then: 中断通知已发送
#SH|  const notifications = await getComboNotifications(child.id);
#SH|  expect(notifications).toHaveLength(1);
#SH|  expect(notifications[0].message).toContain('5天');
#SH|  expect(notifications[0].type).toBe('combo_interruption');
#SH|  expect(notifications[0].previousStreak).toBe(5);
#SH|});
#SH|
#SH|it('given 首次连续用户 when 计数变为1时 then 不发送中断通知', async () => {
#SH|  // Given: 儿童首次开始（连续计数1）
#SH|  const child = await createChildWithStreak('brush', 1);
#SH|  
#  // When: 检测到中断（但实际不是真正的中断）
#SH|  await resetStreak(child.id, 'missed');
#SH|  
#  // Then: 不发送中断通知
#  const notifications = await getComboNotifications(child.id);
#SH|  expect(notifications).toHaveLength(0);
#SH|});
#SH|
#it('given 手动重置 when 发生时 then 不发送通知', async () => {
#SH|  // Given: 儿童有连续5天的刷牙Combo
#SH|  const child = await createChildWithStreak('brush', 5);
#SH|  
#  // When: 家长手动重置连续计数
#  await resetStreak(child.id, 'manual');
#SH|  await sendResetNotification(child.familyId, child.id, 'manual');
#SH|  
#  // Then: 不发送中断通知
#  const notifications = await getComboNotifications(child.id);
#SH|  expect(notifications).toHaveLength(0);
#SH|});
#SH|
#it('given 同一天多次中断 when 发生时 then 每天最多发送1条中断通知', async () => {
#  // Given: 儿童有连续5天的刷牙Combo
#SH|  const child = await createChildWithStreak('brush', 5);
#SH|  await createTask(child.id, 'brush', 'yesterday');
#SH|  await resetStreak(child.id, 'missed');
#SH|  
#  // When: 再次中断（手动重置）
#SH|  await resetStreak(child.id, 'manual');
#SH|  
#  // Then: 第二次不发送通知
#  const notifications = await getComboNotifications(child.id);
#SH|  // 只会有第1条记录
#  expect(notifications).toHaveLength(1);
#SH|});
#```

#SH|### Performance Requirements
#NN|

#SH|- Notification delivery: < 3 seconds (NFR4)
#SH|- Check frequency: < 100ms
# - Index queries for all frequency checks

#SH|### Dependencies
#NN|

#SH|- Epic 5: Story 5.1 - Streak tracking
#SH|- Epic 5: Story 5.4a - Combo notifications table

#SH|### Success Criteria
#NN|

#BB|1. [ ] All tasks completed
#QQ|2. [ ] All BDD tests passing
#HQ|3. [ ] Interruption triggers correctly
#KW|4. [ ] Frequency control works correctly
#NV|5. [ ] Message generation works
#BN|  - [ ] Parent-child encouragement works
