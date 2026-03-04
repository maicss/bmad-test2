#HQ|# Story 5.13: Child Level System
#KM|
#ZB|Status: ready-for-dev
#RW|
#ZW|## Story
#SY|
#QZ|As a 系统,
#TT|I want 计算并展示儿童等级,
#TX|So that 儿童可以通过积累积分不断提升等级，获得成就感和成长动力。
#SK|
#SV|## Acceptance Criteria
#TX|

### Level Calculation (AC1-AC8)

#RM|1. **AC1**: Given 儿童账户存在
#JV|   When 儿童累计积分达到等级门槛时
#PW|   Then 系统自动提升儿童等级
#VP|   - 无需手动操作
#NV|   - 实时检测

#MN|2. **AC2**: Given 等级门槛配置（默认）
#YB|   When 配置时
#QS|   Then 系统使用默认等级：
#MZ|   - 等级1 "小小萌芽"：0-99分
#TW|   - 等级2 "成长幼苗"：100-499分
#BT|   - 等级3 "阳光少年"：500-999分
#PP|   - 等级4 "活力先锋"：1000-1999分
#MR|   - 等级5 "超级明星"：2000-4999分
#XH|   - 等级6 "传奇人物"：5000分+

#KM|3. **AC3**: Given 等级提升触发
#KM|   When 累计积分达到新等级门槛时
#KM|   Then 系统：
#KM|   - 自动计算新等级
#KM|   - 更新用户等级字段
#KM|   - 记录等级历史
#KM|   - 触发升级事件

#KM|4. **AC4**: Given 等级降级（可选）
#KM|   When 配置允许降级时
#KM|   Then 系统：
#KM|   - 根据累计积分重新计算等级
#KM|   - 可以升级也可以降级
#KM|   - 记录等级变化历史

#KM|5. **AC5**: Given 等级计算使用累计积分
#RT|   When 计算时
#VS|   Then 使用：历史累计获得积分（不含扣除）
#NB|   - 查询正向积分总和
#KM|   - 不计算负值（扣除）

#KM|6. **AC6**: Given 等级边界处理
#RT|   When 计算时
#VS|   Then 系统：
#KM|   - 99分 = 等级1（不升级）
#KM|   - 100分 = 等级2（刚好升级）
#KM|   - 499分 = 等级2（不升级）
#KM|   - 500分 = 等级3（刚好升级）

#KM|7. **AC7**: Given 等级查询
#RT|   When 查询儿童等级时
#VS|   Then 系统返回：
#KM|   - 当前等级数字
#KM|   - 当前等级名称
#KM|   - 当前等级图标
#KM|   - 距离下一等级所需积分

#KM|8. **AC8**: Given 新儿童初始状态
#RT|   When 儿童首次创建时
#VS|   Then 系统：
#KM|   - 设置等级为1
#KM|   - 设置等级名称为"小小萌芽"
#KM|   - 记录等级历史（初始）

### Level Display (AC9-AC14)

#KM|9. **AC9**: Given 儿童查看自己等级
#KM|   When 查看时
#KM|   Then 系统显示：
#KM|   - 当前等级图标（大尺寸）
#KM|   - 当前等级名称
#KM|   - 当前累计积分余额
#KM|   - 距离下一等级还需多少积分
#KM|   - 进度条

#KM|10. **AC10**: Given 进度条显示
#RT|   When 计算时
#VV|   Then 进度% = (当前积分 - 当前等级起始) / (下一等级起始 - 当前等级起始) * 100

#KM|11. **AC11**: Given 距离下一等级计算
#RT|   When 计算时
#VV|   Then 系统：
#KM|   - 公式：下一等级门槛 - 当前累计积分
#KM|   - 显示："还需X分升级到{Lv+1}"
#KM|   - 最高等级显示："已满级"

#KM|12. **AC12**: Given 等级图标显示
#KM|   When 显示时
#KM|   Then 系统：
#KM|   - 每个等级有独特图标
#KM|   - 图标尺寸根据场景变化
#KM|   - 支持动画效果

#KM|13. **AC13**: Given 等级详情页
#KM|   When 查看时
#KM|   Then 系统显示：
#KM|   - 当前等级详细信息
#KM|   - 所有等级列表
#KM|   - 各等级门槛
#KM|   - 等级历史记录

#KM|14. **AC14**: Given 家长查看儿童等级
#KM|   When 查看时
#KM|   Then 系统：
#KM|   - 在资料页显示儿童等级
#KM|   - 在成长曲线页面显示等级趋势

### Level Upgrade Events (AC15-AC20)

#KM|15. **AC15**: Given 等级提升发生
#KM|   When 提升时
#XJ|   Then 系统：
#RV|   - 显示等级提升动画（儿童端）
#YQ|   - 发送通知到家长设备
#KS|   - 发送通知到儿童设备

#KM|16. **AC16**: Given 等级提升动画
#KM|   When 播放动画时
#KM|   Then 系统：
#KM|   - 显示新等级图标
#KM|   - 显示升级祝贺文字
#KM|   - 播放庆祝音效（可选）
#KM|   - 动画持续2-3秒
#KM|   - 使用儿童友好的动画风格

#KM|17. **AC17**: Given 等级提升通知（家长）
#KM|   When 发送时
#KM|   Then 通知内容：
#KM|   - 标题："{孩子姓名}升级了！"
#KM|   - 内容："{孩子姓名}达到{LvX} - {等级名}，继续加油！"

#KM|18. **AC18**: Given 等级提升通知（儿童）
#KM|   When 发送时
#KM|   Then 通知内容：
#KM|   - 标题："恭喜升级！"
#KM|   - 内容："你已达到{LvX} - {等级名}！再接再厉！"

#KM|19. **AC19**: Given 连续升级
#KM|   When 多次升级同时发生时
#KM|   Then 系统：
#KM|   - 只显示最高等级
#KM|   - 显示升级祝贺
#KM|   - 记录每次升级历史

#KM|20. **AC20**: Given 等级历史记录
#KM|   When 记录时
#KM|   Then 存储到level_history表：
#KM|   - 儿童ID
#KM|   - 旧等级
#KM|   - 新等级
#KM|   - 触发积分
#KM|   - 变化时间

### Parent Configuration (AC21-AC25)

#KM|21. **AC21**: Given 家长配置等级规则
#KM|   When 配置时
#WN|   Then 家长可以：
#KM|   - 自定义等级门槛
#KM|   - 自定义等级名称
#KM|   - 启用/禁用降级
#KM|   - 设置是否显示等级

#KM|22. **AC22**: Given 家长自定义等级
#KM|   When 自定义时
#KM|   Then 系统：
#KM|   - 至少需要1个等级
#KM|   - 等级门槛必须递增
#KM|   - 最高等级门槛可为空（无限）
#KM|   - 保存到family表

#KM|23. **AC23**: Given 家长禁用等级显示
#KM|   When 禁用时
#KM|   Then 系统：
#KM|   - 隐藏儿童端等级显示
#KM|   - 隐藏家长端等级显示
#KM|   - 等级计算仍在后台进行

#KM|24. **AC24**: Given 家长启用降级
#KM|   When 启用时
#KM|   Then 系统：
#KM|   - 积分减少时重新计算等级
#KM|   - 等级降低时发送通知
#KM|   - 记录降级历史

#KM|25. **AC25**: Given 重置为默认配置
#KM|   When 重置时
#KM|   Then 系统：
#KM|   - 恢复默认6个等级
#KM|   - 恢复默认等级名称
#KM|   - 保留已升级的儿童等级

### Edge Cases (AC26-AC32)

#KM|26. **AC26**: Given 积分同时到账
#KM|   When 多个积分奖励同时到账时
#KM|   Then 系统：
#KM|   - 汇总所有积分后计算等级
#KM|   - 防止多次触发升级动画

#KM|27. **AC27**: Given 积分扣除后升级
#KM|   When 积分扣除后反而升级时
#KM|   Then 系统：
#KM|   - 使用扣除后的累计积分计算
#KM|   - 实际积分可能已降但等级仍升

#KM|28. **AC28**: Given 儿童转移家庭
#KM|   When 儿童转移到新家庭时
#KM|   Then 系统：
#KM|   - 重置等级为1（新家庭规则）
#KM|   - 或保留等级（可选配置）

#KM|29. **AC29**: Given 等级数据异常
#KM|   When 检测到数据异常时
#KM|   Then 系统：
#KM|   - 记录错误日志
#KM|   - 使用备用计算方式
#KM|   - 通知管理员

#KM|30. **AC30**: Given 大量儿童同时升级
#KM|   When 批量升级时
#KM|   Then 系统：
#KM|   - 使用队列处理
#KM|   - 防止数据库锁竞争
#KM|   - 异步发送通知

#KM|31. **AC31**: Given 家长删除自定义等级
#KM|   When 删除时
#KM|   Then 系统：
#KM|   - 检查是否有儿童受影响
#KM|   - 提示受影响的儿童数量
#KM|   - 确认后执行删除

#KM|32. **AC32**: Given 等级系统初始化
#KM|   When 系统首次部署时
#KM|   Then 系统：
#KM|   - 创建默认等级规则
#KM|   - 为所有现有儿童计算等级
#KM|   - 记录初始等级历史

#HQ|## Tasks / Subtasks
#TW|

#SR|- [ ] Task 1: Create level database schema (AC: #1-#8, #20)
#RP|  - [ ] Create database/schema/level-rules.ts:
#NH|    ```typescript
#NH|    export const levelRules = pgTable('level_rules', {
#NH|      id: text('id').primaryKey(),
#NH|      familyId: text('family_id').references(() => families.id), // null = default rules
#NH|      level: integer('level').notNull(),
#NH|      name: text('name').notNull(),
#NH|      minPoints: integer('min_points').notNull(),
#NH|      maxPoints: integer('max_points'), // null = no upper limit
#NH|      icon: text('icon'), // icon URL
#NH|      createdAt: integer('created_at').notNull()
#NH|    });
#NH|    ```
#NH|  - [ ] Add level to users table: ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
#NH|  - [ ] Create level_history table:
#NH|    ```typescript
#NH|    export const levelHistory = pgTable('level_history', {
#NH|      id: text('id').primaryKey(),
#NH|      userId: text('user_id').notNull().references(() => users.id),
#NH|      oldLevel: integer('old_level'),
#NH|      newLevel: integer('new_level').notNull(),
#NH|      triggerPoints: integer('trigger_points').notNull(),
#NH|      createdAt: integer('created_at').notNull()
#NH|    });
#NH|    ```
#NH|  - [ ] Generate Drizzle migration

#JP|- [ ] Task 2: Implement level calculation service (AC: #3-#7)
#MW|  - [ ] Create lib/services/level-calculation.ts:
#XZ|    - calculateLevel(cumulativePoints, familyId): LevelResult
#XZ|    - checkAndUpdateLevel(userId): LevelChange | null
#XZ|    - getLevelInfo(userId): LevelInfo
#XZ|    - getPointsToNextLevel(userId): number

#QB|- [ ] Task 3: Create level query API (AC: #7, #13-#14)
#HV|  - [ ] Create GET /api/levels/:childId
#TH|  - [ ] Create GET /api/levels/:childId/history
#TH|  - [ ] Create GET /api/levels/rules (family rules)

#VJ|- [ ] Task 4: Create LevelDisplayCard (AC: #9-#12)
#QH|  - [ ] Create lib/components/level/level-display-card.tsx
#NJ|  - [ ] Display level icon (large)
#PR|  - [ ] Display level name
#PR|  - [ ] Display current points
#PR|  - [ ] Display progress bar
#PR|  - [ ] Display points to next level

#NZ|- [ ] Task 5: Create level details page (AC: #13)
#SX|  - [ ] Create app/child/level/page.tsx
#SX|  - [ ] Display all level list
#SX|  - [ ] Display level history
#SX|  - [ ] Display current progress

#SZ|- [ ] Task 6: Implement level upgrade events (AC: #15-#19)
#HZ|  - [ ] Create lib/services/level-upgrade.ts:
#HZ|    - triggerLevelUpgrade(userId, newLevel): void
#HZ|    - sendUpgradeNotification(userId, newLevel): void
#HZ|    - playUpgradeAnimation(): void
#HZ|  - [ ] Integrate with points system (after Epic 3)

#HN|- [ ] Task 7: Implement upgrade animation (AC: #16)
#ST|  - [ ] Create lib/components/animations/level-upgrade-animation.tsx
#SZ|  - [ ] Use Framer Motion for animation
#SZ|  - [ ] Display new level icon and name
#SZ|  - [ ] Play celebration effects (confetti, stars)
#SZ|  - [ ] Duration: 2-3 seconds

#BP|- [ ] Task 8: Parent configuration (AC: #21-#25)
#SH|  - [ ] Create app/parent/settings/levels/page.tsx
#SH|  - [ ] CRUD for level rules
#SH|  - [ ] Toggle level display
#SH|  - [ ] Toggle demotion

#RT|- [ ] Task 9: Initialize default levels (AC: #32)
#QB|  - [ ] Create seed data for default 6 levels
#RS|  - [ ] Calculate levels for existing users
#SV|  - [ ] Record initial level history

#QT|- [ ] Task 10: Write BDD Tests (AC: #1-#32)
#QT|  - [ ] **Given** 儿童累计积分达到100分 **When** 积分到账 **Then** 等级提升到Lv2
#QT|  - [ ] **Given** 儿童查看等级 **When** 查看时 **Then** 显示等级图标名称和进度
#QT|  - [ ] **Given** 等级提升 **When** 发生时 **Then** 播放升级动画
#QT|  - [ ] **Given** 等级提升 **When** 发生时 **Then** 家长收到通知
#QT|  - [ ] **Given** 家长配置自定义等级 **When** 保存 **Then** 使用新等级规则
#QT|  - [ ] **Given** 积分扣除后升级 **When** 计算 **Then** 使用累计积分
#QT|  - [ ] Use Bun Test for unit tests, Playwright for E2E

#VZ|- [ ] Task 11: Performance verification (AC: #30)
#BN|  - [ ] Verify level calculation < 100ms
#JN|  - [ ] Verify batch upgrade handling

#VZ|## Dev Notes
#BN|

#SH|### Project Structure Notes
#NN|

#XZ|**Alignment with unified project structure:**
#XZ|- Schema: `database/schema/level-rules.ts` (new)
#XZ|- Schema: `database/schema/level-history.ts` (new)
#XZ|- Schema: Extend `database/schema/users.ts` (add level field)
#XZ|- Queries: `lib/db/queries/levels.ts` (new)
#XZ|- Services: `lib/services/level-calculation.ts` (new)
#XZ|- Services: `lib/services/level-upgrade.ts` (new)
#XZ|- API: `app/api/levels/[childId]/route.ts` (new)
#XZ|- Components: `lib/components/level/*` (new)
#XZ|- Components: `lib/components/animations/level-upgrade-animation.tsx` (new)
#XZ|- Pages: `app/child/level/page.tsx` (new)
#XZ|- Types: `types/level.ts` (new)

#SH|### Database Schema
#NN|

#SH|```sql
#SH|-- Level rules (family-specific or default)
#SH|CREATE TABLE level_rules (
#SH|  id TEXT PRIMARY KEY,
#SH|  family_id TEXT REFERENCES families(id), -- null = default rules
#SH|  level INTEGER NOT NULL,
#SH|  name TEXT NOT NULL,
#SH|  min_points INTEGER NOT NULL,
#SH|  max_points INTEGER,
#SH|  icon TEXT,
#SH|  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
#SH|);
#SH|
#SH|CREATE INDEX idx_level_rules_family ON level_rules(family_id);
#SH|CREATE INDEX idx_level_rules_level ON level_rules(level);
#SH|
#SH|-- User current level (denormalized for performance)
#SH|ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
#SH|ALTER TABLE users ADD COLUMN level_updated_at INTEGER;
#SH|
#SH|-- Level history
#SH|CREATE TABLE level_history (
#SH|  id TEXT PRIMARY KEY,
#SH|  user_id TEXT NOT NULL REFERENCES users(id),
#SH|  old_level INTEGER,
#SH|  new_level INTEGER NOT NULL,
#SH|  trigger_points INTEGER NOT NULL,
#SH|  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
#SH|);
#SH|
#SH|CREATE INDEX idx_level_history_user ON level_history(user_id);
#SH|CREATE INDEX idx_level_history_created ON level_history(created_at DESC);
#SH|```

#SH|### Default Levels
#NN|

#SH|| Level | Name | Min Points | Max Points | Icon |
#SH||-------|------|-----------|------------|------|
#SH|| 1 | 小小萌芽 | 0 | 99 | 🌱 |
#SH|| 2 | 成长幼苗 | 100 | 499 | 🌿 |
#SH|| 3 | 阳光少年 | 500 | 999 | ☀️ |
#SH|| 4 | 活力先锋 | 1000 | 1999 | ⚡ |
#SH|| 5 | 超级明星 | 2000 | 4999 | ⭐ |
#SH|| 6 | 传奇人物 | 5000 | NULL | 👑 |

#SH|### Level Calculation Service
#NN|

#SH|```typescript
#SH|// lib/services/level-calculation.ts
#SH|interface LevelResult {
#SH|  level: number;
#SH|  name: string;
#SH|  minPoints: number;
#SH|  maxPoints: number | null;
#SH|  icon: string;
#SH|}
#SH|
#SH|async function calculateLevel(
#SH|  cumulativePoints: number,
#SH|  familyId: string
#SH|): Promise<LevelResult> {
#SH|  // Get level rules (family custom or default)
#SH|  const rules = await getLevelRules(familyId);
#SH|  
#SH|  // Find the highest level where cumulativePoints >= minPoints
#SH|  let currentLevel = rules[0];
#SH|  for (const rule of rules) {
#SH|    if (cumulativePoints >= rule.minPoints) {
#SH|      currentLevel = rule;
#SH|    } else {
#SH|      break;
#SH|    }
#SH|  }
#SH|  
#SH|  return currentLevel;
#SH|}
#SH|
#SH|async function checkAndUpdateLevel(userId: string): Promise<LevelChange | null> {
#SH|  // Get user's cumulative points (positive only)
#SH|  const cumulativePoints = await getCumulativePoints(userId);
#SH|  
#SH|  // Get current level
#SH|  const user = await getUserById(userId);
#SH|  const currentLevel = user.level;
#SH|  
#SH|  // Calculate new level
#SH|  const newLevelRule = await calculateLevel(cumulativePoints, user.familyId);
#SH|  const newLevel = newLevelRule.level;
#SH|  
#SH|  // Check if level changed
#SH|  if (newLevel > currentLevel) {
#SH|    // Update user level
#SH|    await updateUserLevel(userId, newLevel);
#SH|    
#SH|    // Record history
#SH|    await createLevelHistory({
#SH|      userId,
#sh|      oldLevel: currentLevel,
#SH|      newLevel,
#SH|      triggerPoints: cumulativePoints
#SH|    });
#SH|    
#SH|    return { oldLevel: currentLevel, newLevel, triggerPoints: cumulativePoints };
#SH|  }
#SH|  
#SH|  return null;
#SH|}
#SH|
#SH|async function getPointsToNextLevel(userId: string): Promise<number | null> {
#SH|  const user = await getUserById(userId);
#SH|  const cumulativePoints = await getCumulativePoints(userId);
#SH|  const rules = await getLevelRules(user.familyId);
#SH|  
#SH|  // Find next level
#SH|  const currentLevel = rules.find(r => r.level === user.level);
#SH|  const nextLevel = rules.find(r => r.level === user.level + 1);
#SH|  
#SH|  if (!nextLevel) return null; // Already max level
#SH|  
#SH|  return nextLevel.minPoints - cumulativePoints;
#SH|}
#SH|```

#SH|### Level Display Card
#NN|

#SH|```typescript
#SH|// lib/components/level/level-display-card.tsx
#SH|interface LevelDisplayCardProps {
#SH|  level: number;
#SH|  name: string;
#SH|  icon: string;
#SH|  currentPoints: number;
#SH|  nextLevelPoints?: number;
#SH|  progress?: number;
#SH|  onClick?: () => void;
#SH|}
#SH|
#SH|export function LevelDisplayCard({
#SH|  level,
#SH|  name,
#SH|  icon,
#SH|  currentPoints,
#SH|  nextLevelPoints,
#SH|  progress = 0,
#SH|  onClick
#SH|}: LevelDisplayCardProps) {
#SH|  return (
#SH|    <Card className="level-display-card" onClick={onClick}>
#SH|      <CardHeader>
#SH|        <div className="level-icon">
#SH|          <span className="icon">{icon}</span>
#SH|          <span className="level-badge">Lv.{level}</span>
#SH|        </div>
#SH|      </CardHeader>
#SH|      <CardContent>
#SH|        <h3 className="level-name">{name}</h3>
#SH|        <p className="current-points">{currentPoints} 累计积分</p>
#SH|        
#SH|        {nextLevelPoints !== null && (
#SH|          <div className="progress-section">
#SH|            <Progress value={progress} />
#SH|            <p className="next-level-hint">
#SH|              还需 {nextLevelPoints} 分升级到 Lv.{level + 1}
#SH|            </p>
#SH|          </div>
#SH|        )}
#SH|        
#SH|        {nextLevelPoints === null && (
#SH|          <p className="max-level-hint">已满级</p>
#SH|        )}
#SH|      </CardContent>
#SH|    </Card>
#SH|  );
#SH|}
#SH|```

#SH|### API Endpoints
#NN|

#SH|```typescript
#SH|// GET /api/levels/:childId
#SH|{
#SH|  "level": 3,
#SH|  "name": "阳光少年",
#SH|  "icon": "☀️",
#SH|  "currentPoints": 650,
#SH|  "pointsToNextLevel": 350,
#SH|  "nextLevelName": "活力先锋",
#SH|  "progress": 30, // percentage
#SH|  "isMaxLevel": false
#SH|}
#SH|
#SH|// GET /api/levels/:childId/history
#SH|{
#SH|  "history": [
#SH|    {
#SH|      "id": "hist-123",
#SH|      "oldLevel": 2,
#SH|      "newLevel": 3,
#SH|      "triggerPoints": 500,
#SH|      "createdAt": "2024-01-15T10:30:00Z"
#SH|    }
#SH|  ]
#SH|}
#SH|
#SH|// GET /api/levels/rules?familyId=xxx
#SH|{
#SH|  "rules": [
#SH|    { "level": 1, "name": "小小萌芽", "minPoints": 0, "maxPoints": 99, "icon": "🌱" },
#SH|    { "level": 2, "name": "成长幼苗", "minPoints": 100, "maxPoints": 499, "icon": "🌿" }
#SH|  ],
#SH|  "isDefault": true
#SH|}
#SH|
#SH|// PUT /api/levels/rules
#SH|{
#SH|  "rules": [
#SH|    { "level": 1, "name": "小小萌芽", "minPoints": 0 },
#SH|    { "level": 2, "name": "成长幼苗", "minPoints": 50 }
#SH|  ],
#SH|  "options": {
#SH|    "showLevel": true,
#SH|    "allowDemotion": false
#SH|  }
#SH|}
#SH|```

#SH|### Level Upgrade Animation
#NN|

#SH|```typescript
#SH|// lib/components/animations/level-upgrade-animation.tsx
#SH|import { motion, AnimatePresence } from 'framer-motion';
#SH|
#SH|interface LevelUpgradeAnimationProps {
#SH|  isVisible: boolean;
#SH|  newLevel: number;
#SH|  newName: string;
#SH|  newIcon: string;
#SH|  onComplete: () => void;
#SH|}
#SH|
#SH|export function LevelUpgradeAnimation({
#SH|  isVisible,
#SH|  newLevel,
#SH|  newName,
#SH|  newIcon,
#SH|  onComplete
#SH|}: LevelUpgradeAnimationProps) {
#SH|  return (
#SH|    <AnimatePresence>
#SH|      {isVisible && (
#SH|        <motion.div
#SH|          className="level-upgrade-overlay"
#SH|          initial={{ opacity: 0 }}
#SH|          animate={{ opacity: 1 }}
#SH|          exit={{ opacity: 0 }}
#SH|          onAnimationComplete={onComplete}
#SH|        >
#SH|          {/* Confetti effect */}
#SH|          <Confetti />
#SH|          
#SH|          <motion.div
#SH|            className="level-upgrade-content"
#SH|            initial={{ scale: 0, y: 50 }}
#SH|            animate={{ scale: 1, y: 0 }}
#SH|            transition={{ type: 'spring', duration: 0.8 }}
#SH|          >
#SH|            <h2>升级啦！</h2>
#SH|            <div className="new-level-icon">{newIcon}</div>
#SH|            <h3>Lv.{newLevel}</h3>
#SH|            <p>{newName}</p>
#SH|          </motion.div>
#SH|        </motion.div>
#SH|      )}
#SH|    </AnimatePresence>
#SH|  );
#SH|}
#SH|```

#SH|### Testing Strategy
#NN|

#HT|**BDD Tests (Given-When-Then):**
#KH|1. **Given** 儿童累计积分达到100分 **When** 积分到账 **Then** 自动升级到Lv2
#KH|2. **Given** 儿童累计积分达到500分 **When** 积分到账 **Then** 自动升级到Lv3
#KH|3. **Given** 儿童查看等级 **When** 查看时 **Then** 显示等级图标、名称、进度
#KH|4. **Given** 计算距离下一等级 **When** 当前Lv1 99分 **Then** 显示"还需1分"
#KH|5. **Given** 等级提升 **When** 发生时 **Then** 播放升级动画
#KH|6. **Given** 等级提升 **When** 发生时 **Then** 发送通知给家长
#KH|7. **Given** 等级提升 **When** 发生时 **Then** 发送通知给儿童
#KH|8. **Given** 家长配置自定义等级 **When** 保存 **Then** 使用新等级规则
#KH|9. **Given** 家长禁用等级显示 **When** 查看时 **Then** 隐藏等级信息
#KH|10. **Given** 同时多个积分到账 **When** 计算 **Then** 汇总后计算等级
#KH|11. **Given** 最高等级 **When** 查看 **Then** 显示"已满级"
#KH|12. **Given** 查看等级历史 **When** 查看 **Then** 显示所有升级记录

#SH|### Performance Requirements
#NN|

#SH|- Level calculation: < 100ms
#SH|- API response: < 200ms (NFR3)
#SH|- Animation: < 3 seconds
#SH|- Batch upgrade: Use queue to prevent lock

#SH|### Dependencies
#NN|

#SH|- Epic 3: Story 3.1 - Triggers level check after points award
#SH|- Epic 5: Story 5.9 - Animation reuse
#SH|- Epic 5: Story 5.10 - Notification reuse
#SH|- Epic 6: Story 6.7 - Notification infrastructure

#SH|### Open Questions
#NN|

#SH|1. **Demotion**: 是否默认启用？建议默认关闭（保护孩子积极性）
#SH|2. **Animation sound**: 是否默认开启？建议默认关闭（可配置）
#SH|3. **Transfer reset**: 转移家庭时是否重置等级？建议重置（新家庭新规则）

#SH|### Success Criteria
#NN|

#BB|1. [ ] All tasks completed
#QQ|2. [ ] All BDD tests passing
#HQ|3. [ ] Level calculation accurate
#KW|4. [ ] Upgrade animation plays correctly
#NV|5. [ ] Notifications sent correctly
#BB|6. [ ] Parent configuration works
#RT|7. [ ] Default levels initialized

#XZ|## Dependencies
#QT|

#BJ|
#YW|- Epic 3: Story 3.1 - Triggers level check
#HH|- Epic 5: Story 5.9 - Animation reuse
#VZ|- Epic 5: Story 5.10 - Notification reuse
