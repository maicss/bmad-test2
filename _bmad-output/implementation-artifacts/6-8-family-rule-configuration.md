# Story 6.8: Family Rule Configuration Interface

Status: ready-for-dev

## Story

As a **家长**,
I want **配置家庭全局规则（积分规则、Combo规则、愿望策略）**,
So that **我可以为整个家庭设置一致的行为管理标准**。

## Acceptance Criteria

**Given** 我已登录Family Reward系统并有主要家长权限
**When** 我进入"家庭设置"页面（已从Epic 6迁移）
**Then** 系统显示家庭规则配置界面，包含：
  - 配置区域分组：
     - 积分规则配置
     - Combo规则配置
     - 愿望策略配置
     - 系统通知偏好设置
  - 积分规则配置选项：
     - 日积分上限（默认200分，可调500-2000分）
     - 负分下限（默认-999分，可调-999到-50分）
     - 积分有效期（默认永久，可设置有效期）
     - 单个任务最大积分（默认100分，可调1-200分）
     - 是否允许负分（默认允许）
     - 积分调整频率限制（默认无限制）
  - Combo规则配置选项：
     - 线性Combo开关（开/关）
     - 线性Combo奖励积分（可配置）
     - 阶梯Combo奖励规则（可配置多段阈值）
     - Combo中断预警开关（开/关）
     - Combo宽限次数（默认1次，可调1-3次）
  - 愿望策略配置选项：
     - 单个儿童最大愿望数（默认5个，可调1-20个）
     - 单个愿望积分门槛下限（默认50分，可调10-500分）
     - 家长审核必填开关（开/关，默认开）
     - 愿望有效期（默认永久，可设置有效期）
  - 系统通知偏好设置：
     - 任务提醒开关
     - 积分变动通知开关
     - 愿望审核通知开关
     - Combo预警通知开关
     - 系统公告通知开关
     - 通知推送时段（如8:00-22:00，防止深夜打扰）
  - "保存规则"按钮：保存所有配置项
  - "重置为默认"按钮：恢复所有配置项到系统默认值
**And** 当我修改配置项时，显示即时预览（或确认对话框，对于重要规则）
**Then** 点击"保存规则"按钮后，所有配置项保存到`family_settings`表
**Then** 配置生效时间：立即生效（部分规则如新任务）或次日生效（如积分上限）
**Then** 保存成功后，显示成功提示："家庭规则已保存"
**And** 如果修改了重要规则（如关闭负分），显示二次确认对话框："确认要关闭负分功能吗？关闭后儿童无法获得负分"
**And** 如果家庭有多个儿童，配置项可针对特定儿童设置（次要家长可能只读）
**And** 所有家长查看相同的家庭规则（主要家长设置全局，次要家长只读）
**And** 操作记录到审计日志（NFR14）
**And** API响应时间<500ms（NFR3: P95）
**And** 参考Architecture: 家庭规则存储在`family_settings`表中，Epic 6保留配置功能
**And** 参考FR60: 家长可以配置家庭全局规则

## Tasks / Subtasks

- [ ] Task 1: Create database schema for family_settings (AC: Then)
  - [ ] Subtask 1.1: Design family_settings table schema in database/schema/
  - [ ] Subtask 1.2: Create Drizzle migration file in database/migrations/
  - [ ] Subtask 1.3: Run migration to create family_settings table
  - [ ] Subtask 1.4: Add audit log entry (NFR14)

- [ ] Task 2: Create database query functions for family settings (AC: Then)
  - [ ] Subtask 2.1: Create lib/db/queries/family-settings.ts
  - [ ] Subtask 2.2: Implement getFamilySettings() function
  - [ ] Subtask 2.3: Implement updateFamilySettings() function
  - [ ] Subtask 2.4: Implement resetToDefaults() function
  - [ ] Subtask 2.5: Implement getDefaultSettings() function (system defaults)

- [ ] Task 3: Create API endpoints for family settings (AC: When/Then)
  - [ ] Subtask 3.1: Create GET /api/family/settings endpoint (get settings)
  - [ ] Subtask 3.2: Create PUT /api/family/settings endpoint (update settings)
  - [ ] Subtask 3.3: Create PUT /api/family/settings/reset endpoint (reset to defaults)
  - [ ] Subtask 3.4: Add parent authentication middleware (primary parent only for updates)
  - [ ] Subtask 3.5: Validate request data (Zod schemas)
  - [ ] Subtask 3.6: Add secondary parent read-only permission check

- [ ] Task 4: Create family settings page (AC: When)
  - [ ] Subtask 4.1: Create app/(parent)/settings/page.tsx (main page)
  - [ ] Subtask 4.2: Create components/forms/family-settings-form.tsx (main form)
  - [ ] Subtask 4.3: Create components/forms/points-rules-section.tsx (points configuration)
  - [ ] Subtask 4.4: Create components/forms/combo-rules-section.tsx (combo configuration)
  - [ ] Subtask 4.5: Create components/forms/wish-policy-section.tsx (wish policy)

- [ ] Task 5: Implement points rules configuration UI (AC: Then)
  - [ ] Subtask 5.1: Add daily points上限 input (default 200, range 500-2000)
  - [ ] Subtask 5.2: Add 负分下限 input (default -999, range -999 to -50)
  - [ ] Subtask 5.3: Add points有效期 selector (default permanent, optional expiry date)
  - [ ] Subtask 5.4: Add single task max points input (default 100, range 1-200)
  - [ ] Subtask 5.5: Add allow negative points toggle (default true)
  - [ ] Subtask 5.6: Add points adjustment frequency limit input

- [ ] Task 6: Implement combo rules configuration UI (AC: Then)
  - [ ] Subtask 6.1: Add linear combo toggle switch
  - [ ] Subtask 6.2: Add linear combo reward points input
  - [ ] Subtask 6.3: Add tiered combo rules editor (thresholds + rewards)
  - [ ] Subtask 6.4: Add combo interruption warning toggle switch
  - [ ] Subtask 6.5: Add combo宽限次数 selector (default 1, range 1-3)

- [ ] Task 7: Implement wish policy configuration UI (AC: Then)
  - [ ] Subtask 7.1: Add max wishes per child input (default 5, range 1-20)
  - [ ] Subtask 7.2: Add min wish points threshold input (default 50, range 10-500)
  - [ ] Subtask 7.3: Add parent approval required toggle (default true)
  - [ ] Subtask 7.4: Add wish validity selector (default permanent, optional expiry date)

- [ ] Task 8: Implement notification preferences UI (AC: Then)
  - [ ] Subtask 8.1: Add task reminder notification toggle
  - [ ] Subtask 8.2: Add points change notification toggle
  - [ ] Subtask 8.3: Add wish review notification toggle
  - [ ] Subtask 8.4: Add combo warning notification toggle
  - [ ] Subtask 8.5: Add system announcement notification toggle
  - [ ] Subtask 8.6: Add notification time range picker (default 8:00-22:00)

- [ ] Task 9: Implement save and reset functionality (AC: Then)
  - [ ] Subtask 9.1: Add "保存规则" button (save all settings)
  - [ ] Subtask 9.2: Add "重置为默认" button (reset to defaults)
  - [ ] Subtask 9.3: Implement immediate effect for most settings
  - [ ] Subtask 9.4: Implement next-day effect for some settings (points limits)
  - [ ] Subtask 9.5: Add confirmation dialogs for critical changes (e.g., disable negative points)

- [ ] Task 10: Add permission handling for multiple children (AC: Then)
  - [ ] Subtask 10.1: Detect if family has multiple children
  - [ ] Subtask 10.2: Add child selector for per-child settings
  - [ ] Subtask 10.3: Implement secondary parent read-only mode
  - [ ] Subtask 10.4: Disable settings inputs for secondary parents
  - [ ] Subtask 10.5: Add "主要家长设置全局，次要家长只读" note

- [ ] Task 11: Add validation and error handling (AC: NFR14, NFR3)
  - [ ] Subtask 11.1: Validate settings values (ranges, constraints)
  - [ ] Subtask 11.2: Add error messages for validation failures
  - [ ] Subtask 11.3: Add Shadcn Toast notifications for success/error
  - [ ] Subtask 11.4: Log audit trail for all settings changes

- [ ] Task 12: Write BDD tests (AC: NFR14, NFR3)
  - [ ] Subtask 12.1: Write integration tests for API endpoints
  - [ ] Subtask 12.2: Write unit tests for query functions
  - [ ] Subtask 12.3: Write E2E tests with Playwright (save settings, reset settings)
  - [ ] Subtask 12.4: Verify API response time < 500ms
  - [ ] Subtask 12.5: Verify permission checks (primary vs secondary parent)

## Dev Notes

### Technical Stack & Requirements

**Core Technologies:**
- Bun 1.3.x+ (runtime)
- Next.js 16.1.6 + React 19.2.3
- Drizzle ORM 0.45.1+ (database queries)
- TypeScript 5 strict mode
- Shadcn UI 3.7.0+ (UI components)
- Tailwind CSS 4 (styling)

### Database Schema

**New family_settings table:**
```typescript
// database/schema/family-settings.ts
import { sqliteTable, text, integer, timestamp, boolean } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const familySettings = sqliteTable('family_settings', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull(),
  childId: text('child_id'), // NULL for global settings, child ID for per-child settings
  settingCategory: text('setting_category', { enum: ['points', 'combo', 'wish', 'notifications'] }).notNull(),
  settingKey: text('setting_key').notNull(), // e.g., "daily_points_max", "negative_points_min"
  settingValue: text('setting_value').notNull(), // JSON string for complex values
  isGlobal: integer('is_global', { mode: 'boolean' }).default(true).notNull(), // true = global, false = per-child
  updatedBy: text('updated_by').notNull(), // parent user ID
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  familyIdx: index('family_idx').on(table.familyId),
  childIdx: index('child_idx').on(table.childId),
  categoryKeyIdx: index('category_key_idx').on(table.settingCategory, table.settingKey),
}));

export type FamilySetting = typeof familySettings.$inferSelect;
export type NewFamilySetting = typeof familySettings.$inferInsert;
```

**Default Settings Values:**
```typescript
const DEFAULT_SETTINGS = {
  // Points Rules
  dailyPointsMax: 200,
  negativePointsMin: -999,
  pointsExpiry: null, // NULL = permanent
  taskMaxPoints: 100,
  allowNegativePoints: true,
  pointsAdjustFrequencyLimit: null, // NULL = no limit

  // Combo Rules
  linearComboEnabled: true,
  linearComboRewardPoints: 30, // per 7 days
  tieredComboRules: [
    { days: 7, reward: 30 },
    { days: 14, reward: 70 },
    { days: 30, reward: 150 }
  ],
  comboInterruptionWarningEnabled: true,
  comboGracePeriod: 1,

  // Wish Policy
  maxWishesPerChild: 5,
  minWishPointsThreshold: 50,
  parentApprovalRequired: true,
  wishExpiry: null, // NULL = permanent

  // Notification Preferences
  taskReminderEnabled: true,
  pointsChangeEnabled: true,
  wishReviewEnabled: true,
  comboWarningEnabled: true,
  systemAnnouncementEnabled: true,
  notificationTimeRange: '08:00-22:00',
};
```

### API Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/family/settings` | Get family settings | Parent |
| PUT | `/api/family/settings` | Update settings | Primary Parent |
| PUT | `/api/family/settings/reset` | Reset to defaults | Primary Parent |

**Request/Response DTOs:**

```typescript
// Get Settings Response
{
  familyId: string;
  settings: {
    pointsRules: PointsRules;
    comboRules: ComboRules;
    wishPolicy: WishPolicy;
    notificationPreferences: NotificationPreferences;
  };
  hasMultipleChildren: boolean;
  isPrimaryParent: boolean;
}

// Update Settings Request
{
  pointsRules?: Partial<PointsRules>;
  comboRules?: Partial<ComboRules>;
  wishPolicy?: Partial<WishPolicy>;
  notificationPreferences?: Partial<NotificationPreferences>;
}

// Settings Objects
interface PointsRules {
  dailyPointsMax: number;      // 500-2000
  negativePointsMin: number;      // -999 to -50
  pointsExpiry: string | null;   // ISO date or NULL
  taskMaxPoints: number;        // 1-200
  allowNegativePoints: boolean;   // true/false
  pointsAdjustFrequencyLimit: number | null; // NULL = no limit
}

interface ComboRules {
  linearComboEnabled: boolean;
  linearComboRewardPoints: number;
  tieredComboRules: Array<{
    days: number;
    reward: number;
  }>;
  comboInterruptionWarningEnabled: boolean;
  comboGracePeriod: number; // 1-3
}

interface WishPolicy {
  maxWishesPerChild: number;     // 1-20
  minWishPointsThreshold: number;  // 10-500
  parentApprovalRequired: boolean; // true/false
  wishExpiry: string | null;      // ISO date or NULL
}

interface NotificationPreferences {
  taskReminderEnabled: boolean;
  pointsChangeEnabled: boolean;
  wishReviewEnabled: boolean;
  comboWarningEnabled: boolean;
  systemAnnouncementEnabled: boolean;
  notificationTimeRange: string; // "HH:MM-HH:MM"
}
```

### Project Structure Notes

**Files to Create/Modify:**

```
database/schema/
├── family-settings.ts      # NEW: Table schema

database/migrations/
├── xxx_create_family_settings.sql  # NEW: Migration

lib/db/queries/
├── family-settings.ts       # NEW: Query functions

app/(parent)/
├── settings/
│   └── page.tsx           # NEW: Family settings page

components/forms/
├── family-settings-form.tsx  # NEW: Main form with sections
├── points-rules-section.tsx   # NEW: Points configuration
├── combo-rules-section.tsx   # NEW: Combo configuration
├── wish-policy-section.tsx   # NEW: Wish policy

tests/integration/
├── family-settings.spec.ts  # NEW: API tests

tests/e2e/
├── family-settings.spec.ts  # NEW: E2E tests
```

**Alignment with Unified Project Structure:**

- ✅ Schema in `database/schema/family-settings.ts` (per architecture)
- ✅ Queries in `lib/db/queries/family-settings.ts` (per-table file pattern)
- ✅ API routes in `app/api/family/settings/` (RESTful pattern)
- ✅ Components in `components/forms/` (form-based)
- ✅ No conflicts detected

### References

- **Architecture Decision:** ADR-5 (Function-based queries, NOT Repository pattern)
- **API Pattern:** [Source: docs/TECH_SPEC_API.md#REST-endpoints]
- **Component System:** [Source: docs/TECH_SPEC_ARCHITECTURE.md#component-boundaries]
- **Testing Standard:** [Source: docs/TECH_SPEC_BDD.md#Given-When-Then]
- **FR60:** [Source: _bmad-output/planning-artifacts/prd.md#FR60] 家长可以配置家庭全局规则
- **Permission Model:** [Source: _bmad-output/planning-artifacts/ux-design-specification.md#decision-5-secondary-vs-primary-parent-permissions]

### Critical Implementation Constraints

**🔴 RED LIST - MUST OBEY:**

1. **Database Operations:**
   - ✅ MUST use Drizzle ORM query builder
   - ❌ NEVER use raw SQL
   - ❌ NEVER write SQL in components/routes
   - ✅ All queries MUST be in `lib/db/queries/family-settings.ts`

2. **Type Safety:**
   - ❌ NEVER use `any` type
   - ✅ MUST use `unknown` + type guards
   - ✅ NO `@ts-ignore` or `@ts-expect-error`

3. **Bun Runtime:**
   - ✅ MUST use `Bun.file()`, `Bun.write()` for file ops
   - ✅ MUST use `Bun.env` for environment variables
   - ❌ NEVER use Node.js APIs (`fs/promises`, `process.env`)

4. **BDD Testing:**
   - ✅ MUST write tests BEFORE implementation
   - ✅ MUST use Given-When-Then format
   - ✅ MUST use business language, NOT technical terms

5. **File Length:**
   - ✅ All files MUST be ≤ 800 lines
   - ✅ Split large components if needed

### UX/UI Requirements

**From UX Design Specification:**

- **Responsive Design:**
  - Parent mini-program layout: <450px width (portrait optimization)
  - Large buttons for easy clicking
  - Clear visual hierarchy

- **Form Design:**
  - Section-based layout (Points Rules / Combo Rules / Wish Policy / Notifications)
  - Accordion or tabs for sections
  - Clear labeling and groupings
  - Range sliders for numeric inputs where appropriate

- **Permission Handling:**
  - Primary parent: All settings editable
  - Secondary parent: All settings read-only
  - Note: "主要家长设置全局，次要家长只读"

- **Confirmation Dialogs:**
  - Show confirmation for critical changes (disable negative points)
  - Confirm before reset to defaults
  - Preview effect before applying changes

- **Feedback:**
  - Success toast: "家庭规则已保存"
  - Success toast: "已重置为默认值"
  - Error toast with clear message
  - Loading states during save

### Testing Standards Summary

**BDD Format (Given-When-Then):**

```typescript
// Example: Get family settings
it('given 主要家长已登录，when 查询家庭设置，then 返回所有配置项', async () => {
  // Given: 主要家长已登录
  const primaryParent = await createParent({ role: 'primary' });

  // When: 查询家庭设置
  const res = await request(app)
    .get('/api/family/settings')
    .set('Cookie', primaryParent.session);

  // Then: 返回所有配置项
  expect(res.status).toBe(200);
  expect(res.body.settings).toHaveProperty('pointsRules');
  expect(res.body.settings).toHaveProperty('comboRules');
  expect(res.body.settings).toHaveProperty('wishPolicy');
  expect(res.body.settings).toHaveProperty('notificationPreferences');
  expect(res.body.isPrimaryParent).toBe(true);
});

// Example: Update settings
it('given 主要家长已登录，when 更新积分规则，then 设置保存并立即生效', async () => {
  // Given: 主要家长已登录
  const primaryParent = await createParent({ role: 'primary' });

  // When: 更新积分规则
  const res = await request(app)
    .put('/api/family/settings')
    .set('Cookie', primaryParent.session)
    .send({
      pointsRules: {
        dailyPointsMax: 500,
        taskMaxPoints: 150
      }
    });

  // Then: 设置保存并立即生效
  expect(res.status).toBe(200);
  expect(res.body.settings.pointsRules.dailyPointsMax).toBe(500);
  expect(res.body.settings.pointsRules.taskMaxPoints).toBe(150);
  // Verify saved in database
  const settings = await getFamilySettings(primaryParent.familyId);
  expect(settings.dailyPointsMax).toBe(500);
});

// Example: Secondary parent read-only
it('given 次要家长已登录，when 尝试更新设置，then 返回权限错误', async () => {
  // Given: 次要家长已登录
  const secondaryParent = await createParent({ role: 'secondary' });

  // When: 尝试更新设置
  const res = await request(app)
    .put('/api/family/settings')
    .set('Cookie', secondaryParent.session)
    .send({
      pointsRules: { dailyPointsMax: 500 }
    });

  // Then: 返回权限错误
  expect(res.status).toBe(403);
  expect(res.body.error).toContain('只有主要家长可以修改家庭规则');
});

// Example: Reset to defaults
it('given 主要家长已登录，when 重置为默认值，then 所有设置恢复为系统默认', async () => {
  // Given: 主要家长已登录
  const primaryParent = await createParent({ role: 'primary' });

  // When: 重置为默认值
  const res = await request(app)
    .put('/api/family/settings/reset')
    .set('Cookie', primaryParent.session);

  // Then: 所有设置恢复为系统默认
  expect(res.status).toBe(200);
  expect(res.body.settings.pointsRules.dailyPointsMax).toBe(200);
  expect(res.body.settings.comboRules.linearComboRewardPoints).toBe(30);
});
```

**Test Coverage Requirements:**
- API endpoints: 100% coverage
- Query functions: 95%+ coverage
- E2E tests: Main workflows (view settings, update settings, reset settings)
- Permission tests: Primary vs Secondary parent
- Performance tests: Verify API response time < 500ms

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
