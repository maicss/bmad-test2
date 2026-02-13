# Story 6.3: Admin Creates Combo Rules Template

Status: ready-for-dev

## Story

As a **管理员**,
I want **为系统创建Combo激励规则模板**,
So that **家长可以配置不同的Combo奖励机制，激励孩子持续参与**。

## Acceptance Criteria

**Given** 我已登录Family Reward系统并有管理员权限
**When** 我进入管理员"Combo规则"管理页面并点击"创建新模板"按钮
**Then** 系统显示Combo规则创建表单，包含：
  - 模板名称（必填，最多50字）
  - 适用年龄段选择器（6-8岁 / 9-12岁）
  - Combo类型选择器：
     - 线性Combo：连续N次固定奖励（如连续7天=+30分）
     - 阶梯Combo：连续次数越多奖励越高（如7天=30分，14天=70分，30天=150分）
  - 每个任务类型的Combo规则配置：
     - 连续完成次数阈值（触发Combo奖励）
     - 奖励积分值
  - 中断预警设置：
     - 预警时间（如任务完成截止前2小时）
     - 预警消息模板（可自定义）
  - "保存为草稿"和"发布"按钮
**And** 模板保存为草稿后，仅管理员可见
**And** 点击"发布"按钮时，显示确认对话框："发布后，所有家长都能看到此模板"
**And** 发布成功后，模板状态变为"已发布"，对所有家长可见
**And** 家长在Combo规则配置页面可以看到并应用管理员模板
**And** 创建成功后，显示成功提示："Combo规则模板创建成功"
**And** 操作记录到审计日志（NFR14）
**And** API响应时间<500ms（NFR3: P95）
**And** 参考Architecture: Combo规则存储在`admin_templates`表中，家庭通过`combo_rule_template_id`外键引用

## Tasks / Subtasks

- [ ] Task 1: Create database migration for combo rules storage (AC: Given/Then)
  - [ ] Subtask 1.1: Verify admin_templates table supports combo data structure
  - [ ] Subtask 1.2: Add migration for family combo_rule_template_id reference (future story)
  - [ ] Subtask 1.3: Run migration
  - [ ] Subtask 1.4: Add audit log entry (NFR14)

- [ ] Task 2: Create database query functions for combo templates (AC: Then)
  - [ ] Subtask 2.1: Extend lib/db/queries/admin-templates.ts
  - [ ] Subtask 2.2: Implement createComboTemplate() function
  - [ ] Subtask 2.3: Implement listComboTemplates() function (filter by type)
  - [ ] Subtask 2.4: Implement getTemplateById() function

- [ ] Task 3: Extend API endpoints for combo templates (AC: When/Then)
  - [ ] Subtask 3.1: Extend POST /api/admin/templates endpoint (support template_type=combo)
  - [ ] Subtask 3.2: Extend GET /api/admin/templates endpoint (filter by type=combo)
  - [ ] Subtask 3.3: Validate combo template data (Zod schemas)
  - [ ] Subtask 3.4: Add admin authentication middleware

- [ ] Task 4: Create admin combo template page (AC: When)
  - [ ] Subtask 4.1: Create app/admin/combo-templates/page.tsx (list view)
  - [ ] Subtask 4.2: Create app/admin/combo-templates/create/page.tsx (create form)
  - [ ] Subtask 4.3: Create components/forms/combo-template-form.tsx
  - [ ] Subtask 4.4: Create components/features/combo-rule-editor.tsx

- [ ] Task 5: Implement combo template creation form UI (AC: When/Then)
  - [ ] Subtask 5.1: Add template name input (required, max 50 chars)
  - [ ] Subtask 5.2: Add age group selector (6-8 / 9-12)
  - [ ] Subtask 5.3: Add Combo type selector (linear / tiered)
  - [ ] Subtask 5.4: Add combo rules editor (threshold, reward values per task type)
  - [ ] Subtask 5.5: Add interruption warning settings (time, message template)

- [ ] Task 6: Implement draft → publish workflow (AC: Then)
  - [ ] Subtask 6.1: Add "Save as Draft" button (stores template with is_published=false, type='combo')
  - [ ] Subtask 6.2: Add "Publish" button with confirmation dialog
  - [ ] Subtask 6.3: Implement publish confirmation: "发布后，所有家长都能看到此模板"
  - [ ] Subtask 6.4: Update template status to is_published=true on publish

- [ ] Task 7: Add validation and error handling (AC: NFR14, NFR3)
  - [ ] Subtask 7.1: Validate required fields (Zod schemas)
  - [ ] Subtask 7.2: Validate combo rules consistency (e.g., tiered combo must have ascending thresholds)
  - [ ] Subtask 7.3: Add Shadcn Toast notifications for success/error
  - [ ] Subtask 7.4: Log audit trail for all operations

- [ ] Task 8: Write BDD tests (AC: NFR14, NFR3)
  - [ ] Subtask 8.1: Write integration tests for API endpoints
  - [ ] Subtask 8.2: Write unit tests for query functions
  - [ ] Subtask 8.3: Write E2E tests with Playwright (create draft → publish)
  - [ ] Subtask 8.4: Verify API response time < 500ms

## Dev Notes

### Technical Stack & Requirements

**Core Technologies:**
- Bun 1.3.x+ (runtime)
- Next.js 16.1.6 + React 19.2.3
- Drizzle ORM 0.45.1+ (database queries)
- TypeScript 5 strict mode
- Shadcn UI 3.7.0+ (UI components)
- Tailwind CSS 4 (styling)

### Combo Template Data Structure

**Combo template data structure for dataJson field when template_type = 'combo':**
```typescript
{
  name: string;
  ageGroup: '6-8' | '9-12';
  comboType: 'linear' | 'tiered';

  // Linear Combo Rules
  linearRules?: {
    consecutiveDays: number; // Threshold (e.g., 7 days)
    rewardPoints: number; // Fixed reward (e.g., +30 points)
    taskTypes: Array<{
      taskType: 'brushing' | 'studying' | 'exercise' | 'housework';
      threshold: number;
      reward: number;
    }>;
  };

  // Tiered Combo Rules
  tieredRules?: {
    tiers: Array<{
      consecutiveDays: number; // Threshold (e.g., 7, 14, 30)
      rewardPoints: number; // Ascending rewards (30, 70, 150)
    }>;
  };

  // Interruption Warning Settings
  warningSettings: {
    warningHoursBefore: number; // Hours before cutoff (e.g., 2)
    messageTemplate: string; // Customizable warning message
  };

  description?: string;
  iconUrl?: string;
}
```

**API Request/Response DTOs:**

```typescript
// Create Combo Template Request
{
  templateType: 'combo';
  name: string; // max 50 chars
  ageGroup: '6-8' | '9-12';

  // Linear Combo
  linearRules?: {
    consecutiveDays: number;
    rewardPoints: number;
    taskTypes: Array<{
      taskType: string;
      threshold: number;
      reward: number;
    }>;
  };

  // Tiered Combo
  tieredRules?: {
    tiers: Array<{
      consecutiveDays: number;
      rewardPoints: number;
    }>;
  };

  // Common
  warningSettings: {
    warningHoursBefore: number;
    messageTemplate: string;
  };

  description?: string;
  iconUrl?: string;
}

// Publish Template Request
{
  isPublished: true;
}

// Template Response
{
  id: string;
  name: string;
  templateType: 'task' | 'wish' | 'combo';
  ageGroup: string;
  data: object; // type-specific data structure
  description?: string;
  iconUrl?: string;
  isPublished: boolean;
  referenceCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Project Structure Notes

**Files to Create/Modify:**

```
database/schema/
├── admin-templates.ts      # Already supports template_type field (Story 6.2)

database/migrations/
├── xxx_add_family_combo_template_reference.sql  # NEW: Future migration for family templates

lib/db/queries/
├── admin-templates.ts      # EXTEND: Add combo template functions

app/admin/combo-templates/
├── page.tsx               # NEW: Combo template list
└── create/
    └── page.tsx           # NEW: Create form

components/forms/
├── combo-template-form.tsx   # NEW: Combo template creation/edit form

components/features/
├── combo-rule-editor.tsx     # NEW: Combo rules editor (linear/tiered)
```

**Alignment with Unified Project Structure:**

- ✅ Schema in `database/schema/admin-templates.ts` (per architecture)
- ✅ Queries in `lib/db/queries/admin-templates.ts` (per-table file pattern)
- ✅ API routes extended in `app/api/admin/templates/` (RESTful pattern)
- ✅ Components in `components/forms/` and `components/features/`
- ✅ No conflicts detected

### References

- **Architecture Decision:** ADR-2 (Database: SQLite → PostgreSQL upgrade path)
- **Database Pattern:** ADR-5 (Function-based queries, NOT Repository pattern)
- **API Pattern:** [Source: docs/TECH_SPEC_API.md#REST-endpoints]
- **Component System:** [Source: docs/TECH_SPEC_ARCHITECTURE.md#component-boundaries]
- **Testing Standard:** [Source: docs/TECH_SPEC_BDD.md#Given-When-Then]
- **Combo System:** [Source: _bmad-output/planning-artifacts/ux-design-specification.md#combo-system-requirements]

### Critical Implementation Constraints

**🔴 RED LIST - MUST OBEY:**

1. **Database Operations:**
   - ✅ MUST use Drizzle ORM query builder
   - ❌ NEVER use raw SQL
   - ❌ NEVER write SQL in components/routes
   - ✅ All queries MUST be in `lib/db/queries/admin-templates.ts`

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
  - Admin PC layout: ≥1024px width
  - Large buttons for easy clicking
  - Clear visual hierarchy

- **Form Design:**
  - "保存为草稿" and "发布" two-step workflow
  - Real-time validation feedback
  - Confirmation dialog before publishing

- **Combo Rule Editor:**
  - Combo type toggle: Linear / Tiered
  - Linear: Single threshold + fixed reward
  - Tiered: Multiple thresholds with ascending rewards
  - Visual representation of tiers (table or graph)

- **Feedback:**
  - Success toast: "Combo规则模板创建成功"
  - Error toast with clear message
  - Loading states during API calls

### Testing Standards Summary

**BDD Format (Given-When-Then):**

```typescript
// Example: Create linear combo template
it('given 管理员已登录，when 创建线性Combo模板，then 模板保存为草稿状态', async () => {
  // Given: 管理员已登录
  const admin = await createAdmin();

  // When: 创建线性Combo模板
  const res = await request(app)
    .post('/api/admin/templates')
    .set('Cookie', admin.session)
    .send({
      templateType: 'combo',
      name: '连续完成激励',
      ageGroup: '6-8',
      linearRules: {
        consecutiveDays: 7,
        rewardPoints: 30,
        taskTypes: [...]
      },
      warningSettings: {
        warningHoursBefore: 2,
        messageTemplate: 'Combo即将中断！'
      },
      isPublished: false
    });

  // Then: 模板保存为草稿状态
  expect(res.status).toBe(201);
  expect(res.body.template.templateType).toBe('combo');
  expect(res.body.template.data.comboType).toBe('linear');
});

// Example: Create tiered combo template
it('given 管理员已登录，when 创建阶梯Combo模板，then 阶梯奖励设置正确', async () => {
  // Given: 管理员已登录
  const admin = await createAdmin();

  // When: 创建阶梯Combo模板
  const res = await request(app)
    .post('/api/admin/templates')
    .send({
      templateType: 'combo',
      name: '阶梯Combo激励',
      tieredRules: {
        tiers: [
          { consecutiveDays: 7, rewardPoints: 30 },
          { consecutiveDays: 14, rewardPoints: 70 },
          { consecutiveDays: 30, rewardPoints: 150 }
        ]
      }
    });

  // Then: 阶梯奖励设置正确
  expect(res.status).toBe(201);
  expect(res.body.template.data.tieredRules.tiers).toHaveLength(3);
});
```

**Test Coverage Requirements:**
- API endpoints: 100% coverage
- Query functions: 95%+ coverage
- E2E tests: Main workflows (linear combo, tiered combo, publish)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
