#NM|# Story 5.10: Badge Earned Notification
#KM|
#ZB|Status: ready-for-dev
#RW|
#ZW|## Story
#SY|
#QZ|As a 系统,
#TZ|I want 在儿童获得徽章时发送通知,
#JR|So that 家长可以知道孩子的成就，增强亲子互动和鼓励。
#SK|
#SV|## Acceptance Criteria
#TX|

### Trigger Conditions (AC1-AC4)

#MY|1. **AC1**: Given 儿童满足徽章获得条件
#XQ|   When 系统检测到徽章条件达成时
#WW|   Then 系统发送通知到家长设备
#YX|   And 通知标题："恭喜！{孩子姓名}获得了新徽章"
#YV|   And 通知内容："{徽章名称} - {获得原因}"
#KS|

#VS|2. **AC2**: Given 通知内容生成时
#WJ|   When 生成获得原因时
#XS|   Then 系统根据徽章类型生成：
#VB|   - 任务类徽章："连续{天数}天完成任务"
#JP|   - 积分类徽章："累计获得{积分}分"
#RP|   - 签到类徽章："连续签到{天数}天"
#XW|   - 里程碑徽章："恭喜达到{里程碑}！"

#MY|3. **AC3**: Given 同时获得多个徽章
#QP|   When 多个徽章同时达成时
#ZZ|   Then 合并为一条通知：
#JZ|   - 标题："恭喜！{孩子姓名}获得了{数量}个新徽章"
#QS|   - 内容：显示前3个徽章名称 + "等"
#SZ|   - 徽章图标：显示前2个徽章的图标

#MY|4. **AC4**: Given 徽章获得发生在儿童端
#QP|   When 儿童主动操作导致徽章获得时
#ZZ|   Then 同时发送通知到家长设备和儿童设备
#QS|   - 家长通知侧重："孩子的成就"
#SZ|   - 儿童通知侧重："获得新徽章，鼓励继续努力"

### Content Generation (AC5-AC8)

#VS|5. **AC5**: Given 徽章定义存在
#WJ|   When 查询徽章详情时
#XS|   Then 系统获取徽章：
#VB|   - name：徽章中文名称
#NK|   - description：徽章描述
#RP|   - icon：徽章图标URL
#XW|   - category：徽章类别（task/points/checkin/milestone）

#VS|6. **AC6**: Given 获得原因需要具体数值
#WJ|   When 徽章条件有具体数值时
#XS|   Then 系统从徽章条件中提取：
#VB|   - condition_value：条件数值（如7天、100分）
#RP|   - 并格式化显示（如"连续7天"）

#MY|7. **AC7**: Given 徽章获得通知内容
#QP|   When 生成内容时
#ZZ|   Then 系统确保内容：
#JZ|   - 总长度不超过100字符（通知限制）
#QS|   - 使用友好的中文表达
#SZ|   - 避免技术术语

#MY|8. **AC8**: Given 徽章为首次获得
#QP|   When 判断时
#ZZ|   Then 系统标记为"新徽章"：
#JZ|   - 在通知中强调"新"徽章
#QS|   - 儿童可以查看完整徽章收藏

### Notification Delivery (AC9-AC13)

#JY|9. **AC9**: Given 通知发送时间要求
#HW|   When 徽章获得时
#BJ|   Then 通知在3秒内送达（NFR4）

#MB|10. **AC10**: Given 通知发送设备
#VW|   When 确定接收设备时
#PB|   Then 系统发送到：
#BN|   - 家长账户绑定的所有设备
#XP|   - 儿童账户绑定的所有设备（如果是儿童触发的徽章）

#JY|11. **AC11**: Given 家长接收设置
#HW|   When 家长配置通知偏好时
#BJ|   Then 系统支持：
#XP|   - 开启/关闭徽章通知
#VB|   - 只接收儿童徽章通知
#RP|   - 只接收自己创建/审批的徽章通知

#MB|12. **AC12**: Given 通知优先级
#VW|   When 徽章获得时
#PB|   Then 系统设置通知优先级：
#BN|   - 积分类徽章：NORMAL
#XP|   - 里程碑徽章（如Lv5）：HIGH
#VB|   - 连续任务类徽章：NORMAL

#JY|13. **AC13**: Given 通知展示
#HW|   When 通知显示时
#BJ|   Then 系统显示：
#XP|   - 徽章图标（大图标模式）
#VB|   - 孩子姓名
#RP|   - 徽章名称和获得原因

### User Interaction (AC14-AC17)

#JZ|14. **AC14**: Given 家长点击通知
#JR|   When 点击时
#BH|   Then 系统：
#TX|   - 跳转到家长端徽章详情页
#XP|   - 显示徽章完整信息
#VB|   - 显示获得时间和获得原因

#JZ|15. **AC15**: Given 儿童点击通知
#JR|   When 点击时
#BH|   Then 系统：
#TX|   - 跳转到儿童端徽章墙页面
#XP|   - 高亮显示新获得的徽章
#VB|   - 显示庆祝动画（如果还未查看过）

#MY|16. **AC16**: Given 家长从通知进入详情页
#QP|   When 页面加载时
#ZZ|   Then 系统显示：
#JZ|   - 徽章详情（名称、图标、描述）
#QS|   - 获得原因和具体数值
#SZ|   - 获得时间
#XP|   - 孩子的徽章收藏进度

#MY|17. **AC17**: Given 通知已点击查看
#QP|   When 标记为已读时
#ZZ|   Then 系统：
#JZ|   - 记录通知已读时间
#QS|   - 更新徽章状态为"已通知家长"

### Recording & History (AC18-AC21)

#MB|18. **AC18**: Given 徽章获得通知记录
#VW|   When 记录时
#PB|   Then 存储到notifications表：
#BN|   - type: "badge_earned"
#XP|   - user_id: 接收通知的家长ID
#VB|   - child_id: 获得徽章的儿童ID
#RP|   - badge_ids: 获得的徽章ID数组
#XW|   - is_read: false

#JY|19. **AC19**: Given 通知历史查看
#HW|   When 家长查看通知历史时
#BJ|   Then 系统显示：
#XP|   - 所有徽章获得通知
#VB|   - 按时间倒序排列
#RP|   - 支持筛选（按儿童、按徽章类型）

#MB|20. **AC20**: Given 通知清理策略
#VW|   When 超过保留期限时
#PB|   Then 系统：
#BN|   - 超过90天的通知标记为已删除
#XP|   - 家长可以手动删除通知

#JY|21. **AC21**: Given 通知发送失败
#HW|   When 发送失败时
#BJ|   Then 系统：
#XP|   - 记录失败原因
#VB|   - 最多重试3次
#RP|   - 超过3次标记为发送失败

### Edge Cases (AC22-AC26)

#KM|22. **AC22**: Given 徽章获得时设备离线
#KM|   When 设备重新上线时
#KM|   Then 系统：
#KM|   - 推送离线期间累积的通知
#KM|   - 显示"你不在的时候，孩子获得了X个徽章"

#KM|23. **AC23**: Given 家长删除儿童账户
#KM|   When 儿童账户被删除时
#KM|   Then 系统：
#KM|   - 不再向该家长发送该儿童的通知
#KM|   - 历史通知保留30天后自动清理

#KM|24. **AC24**: Given 徽章定义被修改
#KM|   When 徽章名称/描述被家长修改时
#KM|   Then 系统：
#KM|   - 已发送的通知不受影响
#KM|   - 新通知使用修改后的内容

#KM|25. **AC25**: Given 通知发送频繁
#KM|   When 同一儿童在1小时内获得多个徽章时
#KM|   Then 系统：
#KM|   - 合并为批量通知（每10分钟最多1条）
#KM|   - 显示"孩子获得了X个新徽章"

#KM|26. **AC26**: Given 家长未绑定设备
#KM|   When 家长没有绑定设备时
#KM|   Then 系统：
#KM|   - 在Web端显示通知徽章
#KM|   - 登录时弹窗提醒

#HQ|## Tasks / Subtasks
#TJ|

#ZH|- [ ] Task 1: Create badge notification service (AC: #1-#8, #22-#25)
#PX|  - [ ] Create lib/services/badge-notifier.ts:
#BH|    - sendBadgeEarnedNotification(childId, badges[])
#QW|    - generateBadgeMessage(badge): string
#QW|    - batchNotifications(badges[]): NotificationPayload
#QW|    - mergeDuplicateNotifications(): void
#QW|
#QW|- [ ] Task 2: Create notification database schema (AC: #18-#20)
#RY|  - [ ] Add to notifications table:
#NB|    ```sql
#RT|    ALTER TABLE notifications ADD COLUMN badge_ids TEXT[]; -- JSON array of badge IDs
#RT|    ALTER TABLE notifications ADD COLUMN child_id TEXT REFERENCES users(id);
#RT|    ```
#QW|
#QY|- [ ] Task 3: Integrate with badge checker (AC: #1, #9)
#NY|  - [ ] After awarding badge, call notification service
#XN|  - [ ] Trigger: async after badge insertion
#QW|
#JQ|- [ ] Task 4: Handle multiple badges (AC: #3, #25)
#RJ|  - [ ] Collect all pending badges
#ZY|  - [ ] Batch into single notification
#QW|
#QK|- [ ] Task 5: Implement deep link (AC: #14-#17)
#RJ|  - [ ] Parent badge detail page: /parent/badges/[id]
#ZY|  - [ ] Child badge wall page: /child/badges (with highlight)
#QW|  - [ ] Handle notification click
#QW|
#QW|- [ ] Task 6: Implement notification preferences (AC: #11)
#RJ|  - [ ] Create notification preferences table:
#NB|    ```sql
#RT|    CREATE TABLE notification_preferences (
#RT|      id TEXT PRIMARY KEY,
#RT|      user_id TEXT NOT NULL REFERENCES users(id),
#RT|      badge_notifications_enabled BOOLEAN DEFAULT true,
#RT|      only_child_notifications BOOLEAN DEFAULT false,
#RT|      created_at INTEGER DEFAULT (strftime('%s', 'now')),
#RT|      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
#RT|    );
#RT|    ```
#QW|
#QW|- [ ] Task 7: Create notification history API (AC: #19)
#RJ|  - [ ] GET /api/notifications?type=badge_earned
#ZY|  - [ ] Support filtering by child_id
#QW|  - [ ] Support marking as read
#QW|
#QW|- [ ] Task 8: Handle offline notifications (AC: #22)
#RJ|  - [ ] Store pending notifications
#ZY|  - [ ] Push on device reconnection
#QW|
#QW|- [ ] Task 9: Implement frequency control (AC: #25)
#RJ|  - [ ] Track notifications sent per child per hour
#ZY|  - [ ] Implement 10-minute batching window
#QW|
#QW|- [ ] Task 10: Write BDD Tests (AC: #1-#26)
#RJ|  - [ ] **Given** 儿童获得单个徽章 **When** 徽章条件达成 **Then** 家长收到通知
#ZY|  - [ ] **Given** 获得多个徽章 **When** 同时达成 **Then** 合并为一条通知
#QW|  - [ ] **Given** 家长点击通知 **Then** 跳转到徽章详情页
#QW|  - [ ] **Given** 通知发送失败 **Then** 重试3次后标记失败
#QW|  - [ ] **Given** 1小时内多次徽章 **Then** 合并为批量通知
#QW|  - [ ] Use Bun Test for unit tests, Playwright for E2E
#QW|
#QW|- [ ] Task 11: Performance verification (AC: #9, #25)
#RJ|  - [ ] Verify notification delivery < 3 seconds (NFR4)
#ZY|  - [ ] Verify batching logic works correctly
#QW|

#VZ|## Dev Notes
#RJ|

#SH|### Project Structure Notes
#NN|
#XZ|**Alignment with unified project structure:**
#XZ|- Schema: Extend `database/schema/notifications.ts`
#XZ|- Queries: `lib/db/queries/notifications.ts` (extend)
#XZ|- Service: `lib/services/badge-notifier.ts` (new)
#XZ|- API: `app/api/notifications/badge/route.ts` (new)
#XZ|- Types: `types/badge.ts` (extend)
#XZ|- Components: Reuse existing notification components

#SH|### Database Schema
#NN|

#SH|```sql
#SH|-- notifications table extension for badge notifications
#SH|CREATE TABLE IF NOT EXISTS notifications (
#SH|  id TEXT PRIMARY KEY,
#SH|  user_id TEXT NOT NULL REFERENCES users(id),
#SH|  type TEXT NOT NULL, -- 'badge_earned', 'badge_batch'
#SH|  title TEXT NOT NULL,
#SH|  body TEXT NOT NULL,
#SH|  data JSONB, -- { badgeIds: string[], childId: string }
#SH|  is_read BOOLEAN DEFAULT false,
#SH|  created_at INTEGER DEFAULT (strftime('%s', 'now'))
#SH|);
#SH|
#SH|CREATE INDEX idx_notifications_user ON notifications(user_id);
#SH|CREATE INDEX idx_notifications_type ON notifications(type);
#SH|CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
#SH|```

#SH|### Notification Payload
#NN|

#SH|```typescript
#SH|// Single badge notification
#SH|{
#SH|  "type": "badge_earned",
#SH|  "title": "恭喜！小明获得了新徽章",
#SH|  "body": "持之以恒 - 连续7天完成任务",
#SH|  "data": {
#SH|    "badgeIds": ["badge-task-7"],
#SH|    "childId": "child-123"
#SH|  },
#SH|  "priority": "normal"
#SH|}
#SH|
#SH|// Multiple badges notification
#SH|{
#SH|  "type": "badge_batch",
#SH|  "title": "恭喜！小明获得了3个新徽章",
#SH|  "body": "持之以恒、小小起步、签到新人 等",
#SH|  "data": {
#SH|    "badgeIds": ["badge-task-7", "badge-first", "badge-checkin-3"],
#SH|    "childId": "child-123"
#SH|  },
#SH|  "priority": "high"
#SH|}
#SH|```

#SH|### Badge Reason Generation
#NN|

#SH|```typescript
#SH|// lib/services/badge-notifier.ts
#SH|function generateBadgeMessage(badge: Badge): string {
#SH|  const { category, condition_value, name } = badge;
#SH|  
#SH|  switch (category) {
#SH|    case 'task':
#SH|      return `${name} - 连续${condition_value}天完成任务`;
#SH|    case 'points':
#SH|      return `${name} - 累计获得${condition_value}分`;
#SH|    case 'checkin':
#SH|      return `${name} - 连续签到${condition_value}天`;
#SH|    case 'milestone':
#SH|      return `${name} - 恭喜达到${condition_value}！`;
#SH|    default:
#SH|      return `${name}`;
#SH|  }
#SH|}
#SH|```

#SH|### Notification Service Flow
#NN|

#SH|```typescript
#SH|// lib/services/badge-notifier.ts
#SH|async function sendBadgeEarnedNotification(
#SH|  childId: string,
#SH|  badges: Badge[]
#SH|): Promise<void> {
#SH|  // 1. Get child's family
#SH|  const child = await getUserById(childId);
#SH|  const familyId = child.familyId;
#SH|  
#SH|  // 2. Get parents in family
#SH|  const parents = await getFamilyParents(familyId);
#SH|  
#SH|  // 3. Check notification preferences
#SH|  for (const parent of parents) {
#SH|    const prefs = await getNotificationPreferences(parent.id);
#SH|    if (!prefs.badgeNotificationsEnabled) continue;
#SH|    
#SH|    // 4. Build notification
#SH|    const notification = buildBadgeNotification(child, badges);
#SH|    
#SH|    // 5. Send to parent's devices
#SH|    await sendPushNotification(parent.id, notification);
#SH|    
#SH|    // 6. Store in database
#SH|    await createNotificationRecord({
#SH|      userId: parent.id,
#SH|      type: badges.length === 1 ? 'badge_earned' : 'badge_batch',
#SH|      ...notification,
#SH|      childId
#SH|    });
#SH|  }
#SH|}
#SH|```

#SH|### API Endpoints
#NN|

#SH|```typescript
#SH|// GET /api/notifications?type=badge_earned&childId=xxx
#SH|{
#SH|  "notifications": [
#SH|    {
#SH|      "id": "notif-123",
#SH|      "type": "badge_earned",
#SH|      "title": "恭喜！小明获得了新徽章",
#SH|      "body": "持之以恒 - 连续7天完成任务",
#SH|      "isRead": false,
#SH|      "createdAt": "2024-01-15T10:30:00Z"
#SH|    }
#SH|  ]
#SH|}
#SH|
#SH|// POST /api/notifications/:id/read
#SH|{
#SH|  "success": true
#SH|}
#SH|```

#SH|### Testing Strategy
#NN|

#HT|**BDD Tests (Given-When-Then):**
#KH|1. **Given** 儿童获得单个徽章 **When** 徽章条件达成 **Then** 家长收到通知
#KH|2. **Given** 通知内容生成 **When** 徽章类型不同 **Then** 生成对应获得原因
#KH|3. **Given** 同时获得多个徽章 **When** 徽章同时达成 **Then** 合并为一条通知
#KH|4. **Given** 家长点击通知 **When** 点击时 **Then** 跳转到徽章详情页
#KH|5. **Given** 通知发送时间 **When** 徽章获得时 **Then** 3秒内送达
#KH|6. **Given** 家长设置关闭通知 **When** 设置后 **Then** 不再收到徽章通知
#KH|7. **Given** 同一儿童1小时内多次徽章 **When** 获得时 **Then** 合并为批量通知
#KH|8. **Given** 设备离线 **When** 重新上线时 **Then** 推送离线期间通知
#KH|9. **Given** 家长查看通知历史 **When** 查看时 **Then** 按时间倒序显示
#KH|10. **Given** 徽章获得通知 **When** 标记已读 **Then** 更新为已读状态

#SH|### Performance Requirements
#NN|

#SH|- Notification delivery: < 3 seconds (NFR4)
#SH|- Batch notification window: 10 minutes
#SH|- API response time: < 500ms (NFR3)

#SH|### Dependencies
#NN|

#SH|- Epic 5: Story 5.8 - Badge definitions and storage
#SH|- Epic 5: Story 5.9 - Badge earned triggers
#SH|- Epic 6: Story 6.7 - Notification infrastructure
#SH|- Epic 2: Story 2.x - User/family relationships

#SH|### Open Questions
#NN|

#SH|1. **Frequency limit**: 10分钟1条是否合理？
#SH|2. **Offline storage**: 需要存储多少条离线通知？
#SH|3. **Notification icons**: 是否需要为每种徽章类型准备不同图标？

#SH|### Success Criteria
#NN|

#BB|1. [ ] All tasks completed
#QQ|2. [ ] All BDD tests passing
#HQ|3. [ ] Notification delivery < 3 seconds
#KW|4. [ ] Multiple badge batching works correctly
#NV|5. [ ] Deep links work correctly

#XZ|## Dependencies
#QT|

#PX|- Epic 5: Story 5.8 - Badge definitions
#NK|- Epic 5: Story 5.9 - Triggers notification
#NH|- Epic 6: Story 6.7 - Notification infrastructure
