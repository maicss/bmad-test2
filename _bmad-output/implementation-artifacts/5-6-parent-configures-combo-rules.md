# Story 5.6: Parent Configures Combo Rules
# Status: ready-for-dev

## Story

As a 家长,
I want 配置Combo激励规则,
So that 我可以根据孩子的特点设置合适的连续完成奖励机制，激励孩子持续完成任务。

## Acceptance Criteria

### Rule List Display (AC1-AC3)

1. Given 我已登录系统并有家长权限
   When 我进入"Combo规则"配置页面
   Then 系统显示当前的Combo规则列表
   And 显示每个规则的：
   - 类型（线性/阶梯）图标
   - 任务类型标签（刷牙、学习、运动等）
   - 阈值或阶梯预览
   - 奖励积分
   - 启用状态（已启用/已禁用）
   And 列表按创建时间降序排列

2. Given 我有多个Combo规则
   When 查看规则列表时
   Then 系统显示规则数量："共N条规则"
   And 每个规则有编辑和删除按钮
   And 规则有启用/禁用切换开关

3. Given 规则列表为空
   When 查看规则列表时
   Then 系统显示空状态：
   - 插图（家庭 illustration）
   - "还没有配置Combo规则"
   - "创建你的第一条规则，激励孩子持续完成任务！"
   - "创建规则"按钮（大号，prominent）

### Template Selection (AC4-AC6)

4. Given 我首次配置Combo规则
   When 进入配置页面时
   Then 系统显示预设模板供选择：
   - "基础线性版"（📈 图标）：连续7天奖励30分
   - "进阶阶梯版"（🏆 图标）：阶梯奖励（7天30分，14天70分，30天150分）
   - "自定义"（✏️ 图标）：手动配置所有参数
   And 每个模板有预览卡片

5. Given 查看模板预览
   When 悬停或点击模板卡片
   Then 系统显示模板详情：
   - 模板名称和描述
   - 配置预览（阈值、奖励）
   - 适用场景提示
   And 鼓励性文案："推荐给刚开始Combo的孩子"等

6. Given 选择模板
   When 点击模板卡片
   Then 系统自动填充表单
   And 跳转到规则编辑页面
   And 标记为"基于模板：模板名称"

### Combo Rule Form (AC7-AC16)

7. Given 我选择"自定义"配置
   When 点击自定义时
   Then 系统显示Combo规则创建表单
   And 表单分为多个section：
   - 基本信息
   - 任务类型筛选
   - 奖励配置（线性/阶梯）
   - 中断预警设置
   And 每个section有清晰的标题和说明

8. Given 填写基本信息
   When 输入时
   Then 系统显示：
   - Combo类型选择：线性 / 阶梯（单选按钮）
   - 规则名称（可选，默认自动生成）
   - 启用开关（默认开启）
   And 类型选择后切换奖励配置section

9. Given 选择任务类型筛选
   When 选择任务类型时
   Then 系统显示多选组件：
   - 刷牙（🦷）
   - 学习（📚）
   - 运动（🏃）
   - 家务（🧹）
   - 自定义（⭐）
   And 不选择任何类型表示"所有任务类型"
   And 最多可选择5种类型

10. Given 选择线性Combo类型
    When 填写线性配置时
    Then 系统显示：
    - 连续次数阈值（数字输入框，范围1-365，默认7）
    - 奖励积分值（数字输入框，范围1-1000，默认30）
    - 实时预览："每连续{阈值}天奖励{积分}分"
    And 输入变化时实时更新预览

11. Given 选择阶梯Combo类型
    When 填写阶梯配置时
    Then 系统显示阶梯列表编辑器：
    - 已添加的阶梯列表（卡片式）
    - "添加阶梯"按钮
    And 每个阶梯卡片显示：
    - 连续次数（数字输入，必填）
    - 奖励积分（数字输入，必填）
    - 删除按钮（红色图标）
    And 列表按阈值自动排序（从小到大）

12. Given 阶梯列表为空
    When 查看阶梯配置时
    Then 系统显示提示："请至少添加一个阶梯"
    And "添加阶梯"按钮高亮显示

13. Given 添加阶梯
    When 点击"添加阶梯"按钮时
    Then 系统添加一行新的阶梯配置
    And 自动填充默认值（阈值10，奖励50）
    And 聚焦到阈值输入框
    And 自动按阈值排序

14. Given 删除阶梯
    When 点击删除按钮时
    Then 系统显示确认对话框："确定删除此阶梯吗？"
    And 确认后移除该阶梯
    And 如果只剩一个阶梯，禁用删除按钮

15. Given 填写中断预警设置
    When 配置预警时
    Then 系统显示：
    - 启用/禁用开关（默认启用）
    - 预警时间选择：1小时 / 2小时 / 3小时（默认2小时）
    - 自定义预警时间输入（数字，1-24小时）
    - 自定义预警消息（可选文本域，支持变量：{days}, {task_type}, {threshold}）
    - "发送测试预警"按钮

16. Given 点击"发送测试预警"
    When 测试预警时
    Then 系统使用当前配置生成测试通知
    And 发送到家长设备
    And 显示"测试预警已发送"Toast提示
    And 不影响实际Combo计算

### Form Validation and Saving (AC17-AC22)

17. Given 我填写完配置并点击保存
    When 保存时
    Then 系统验证：
    - 必填字段已填写
    - 阈值 > 0 且 <= 365
    - 奖励 > 0 且 <= 1000
    - 阶梯配置按顺序排列
    - 阶梯阈值不重复
    - 阶梯数量 >= 1
    - 预警时间 1-24小时
    And 验证通过后保存到combo_rules表

18. Given 表单有验证错误
    When 点击保存时
    Then 系统在错误字段下方显示错误消息
    - "连续次数必须大于0"
    - "奖励积分必须大于0"
    - "阶梯阈值不能重复"
    - "请至少添加一个阶梯"
    And 禁用保存按钮
    And 错误字段高亮红色

19. Given 配置保存成功
    When 保存后
    Then 系统显示成功提示Toast："Combo规则已保存"
    And 关闭表单
    And 返回规则列表
    And 规则立即生效（无需发布）

20. Given 点击取消按钮
    When 取消时
    Then 系统显示确认对话框："确定放弃未保存的更改吗？"
    And 确认后关闭表单
    And 不保存任何更改

21. Given 表单有未保存更改
    When 尝试关闭或导航离开时
    Then 系统显示提示："有未保存的更改，确定离开吗？"
    And 提供"保存"、"离开"、"取消"选项

22. Given 编辑现有规则
    When 进入编辑页面时
    Then 系统显示预填的当前配置
    And 显示"最后更新：YYYY-MM-DD HH:MM"
    And 修改后保存时更新现有记录
    And 重置该规则的已触发阶梯（Story 5.3 AC#13）

### Rule Actions (AC23-AC26)

23. Given 我想删除Combo规则
    When 点击删除时
    Then 系统显示确认对话框：
    - 标题："确定删除此Combo规则吗？"
    - 内容："删除后已触发的奖励不会取消，但未来不会再触发奖励。"
    - 按钮："取消"（灰色）、"确定删除"（红色）
    And 确认后软删除规则（设置deleted_at）
    And 显示"规则已删除"Toast

24. Given 我想禁用规则（临时停用）
    When 切换启用开关
    Then 系统立即更新规则状态
    And 不触发新的Combo奖励
    And 已触发的奖励保留
    And 可以随时重新启用

25. Given 想要复制现有规则
    When 点击复制按钮
    Then 系统创建规则副本
    And 名称后添加"（副本）"
    And 禁用原规则，启用副本
    And 跳转到副本编辑页面

26. Given 想要查看规则使用情况
    When 点击"统计"按钮
    Then 系统显示规则统计面板：
    - 总触发次数
    - 总发放积分
    - 最近触发时间
    - 受影响儿童数量
    And 图表：触发趋势（最近30天）

### Multi-Child Support (AC27-AC28)

27. Given 家庭有多个儿童
    When 配置Combo规则时
    Then 规则对家庭内所有儿童生效
    And 每个儿童的Combo独立计算
    And 显示"适用于：家庭内所有儿童"

28. Given 配置任务类型筛选
    When 选择特定任务类型时
    Then 只对匹配任务类型的Combo生效
    And 其他任务类型不受影响
    And 可以为不同任务类型创建不同规则

### Rule Limits and Warnings (AC29-AC32)

29. Given 尝试创建第11条规则（超过限制）
    When 保存时
    Then 系统显示错误："每个家庭最多创建10条Combo规则"
    And 禁用保存按钮
    And 显示当前规则数量（10/10）

30. Given 配置多个针对同一任务类型的规则
    When 保存时
    Then 系统显示警告："检测到重复的任务类型，所有规则都会触发"
    And 提供"继续保存"和"取消"选项
    And 不阻止保存（允许冲突规则共存）

31. Given 配置阶梯数量超过10个
    When 查看阶梯列表时
    Then 系统显示提示："阶梯数量较多，建议精简以提升体验"
    And 不阻止保存

32. Given 配置很高的阈值（如100天）
    When 保存时
    Then 系统显示提示："此阈值较高，儿童可能难以达成，建议设置中等阈值（7-30天）"
    And 提供"继续保存"选项

## Tasks / Subtasks

- [ ] Task 1: Create combo rules CRUD API (AC: #1, #17-#22, #23-#24)
  - [ ] Create GET /api/combo/rules - List all rules for family
  - [ ] Create POST /api/combo/rules - Create new rule
  - [ ] Create PUT /api/combo/rules/[ruleId] - Update rule
  - [ ] Create DELETE /api/combo/rules/[ruleId] - Soft delete rule
  - [ ] Create PATCH /api/combo/rules/[ruleId]/toggle - Toggle enabled state
  - [ ] Create POST /api/combo/rules/[ruleId]/duplicate - Duplicate rule
  - [ ] Create GET /api/combo/rules/[ruleId]/stats - Get rule statistics
  - [ ] Add validation for request body (Zod schemas)
  - [ ] Implement rule limit check (max 10 per family)
  - [ ] Implement duplicate warning logic

- [ ] Task 2: Create ComboRuleForm component (AC: #7-#16, #17-#22)
  - [ ] Create components/features/combo/combo-rule-form.tsx
  - [ ] Implement type selector (linear/tiered)
  - [ ] Implement task type multi-select with icons
  - [ ] Implement linear config inputs with real-time preview
  - [ ] Implement tiered config editor (add/remove tiers)
  - [ ] Implement warning config section
  - [ ] Implement form validation (inline errors)
  - [ ] Implement save/cancel actions
  - [ ] Implement unsaved changes warning
  - [ ] Implement test warning button

- [ ] Task 3: Create TieredConfigEditor component (AC: #11-#14)
  - [ ] Create components/features/combo/tiered-config-editor.tsx
  - [ ] Implement tier list with cards
  - [ ] Implement add tier button with default values
  - [ ] Implement remove tier button with confirmation
  - [ ] Implement auto-sort by threshold
  - [ ] Validate tier config (no duplicates, >= 1 tier)
  - [ ] Disable delete button for last tier

- [ ] Task 4: Create ComboRulesPage (AC: #1-#3, #4-#6)
  - [ ] Create app/(parent)/combo/rules/page.tsx
  - [ ] Display existing rules list
  - [ ] Implement empty state with "创建规则" button
  - [ ] Implement template selector modal
  - [ ] Implement create/edit/delete actions
  - [ ] Implement rule statistics panel
  - [ ] Implement search/filter for rules

- [ ] Task 5: Create ComboRuleList component (AC: #1-#3)
  - [ ] Create components/features/combo/combo-rule-list.tsx
  - [ ] Display rules in card layout
  - [ ] Show rule type, task types, threshold/reward preview
  - [ ] Show enabled status toggle
  - [ ] Show edit/delete/duplicate buttons
  - [ ] Show stats button

- [ ] Task 6: Create ComboRuleCard component (AC: #1-#2)
  - [ ] Create components/features/combo/combo-rule-card.tsx
  - [ ] Display rule details with icons
  - [ ] Show task type tags
  - [ ] Show threshold/reward preview
  - [ ] Show enabled status indicator
  - [ ] Add hover effects

- [ ] Task 7: Create TemplateSelector component (AC: #4-#6)
  - [ ] Create components/features/combo/template-selector.tsx
  - [ ] Display preset templates with preview cards
  - [ ] Show template details on hover/click
  - [ ] Implement template selection
  - [ ] Pre-fill form when template selected

- [ ] Task 8: Create WarningConfig component (AC: #15-#16)
  - [ ] Create components/features/combo/warning-config.tsx
  - [ ] Implement enabled/disabled toggle
  - [ ] Implement warning time selector (preset + custom)
  - [ ] Implement custom message textarea with variable hints
  - [ ] Implement test warning button
  - [ ] Validate message template variables

- [ ] Task 9: Create RuleStatisticsPanel component (AC: #26)
  - [ ] Create components/features/combo/rule-statistics-panel.tsx
  - [ ] Display trigger count
  - [ ] Display total points awarded
  - [ ] Display last triggered at
  - [ ] Display affected children count
  - [ ] Implement trigger trend chart (last 30 days)

- [ ] Task 10: Implement rule state reset (AC: #22)
  - [ ] When rule updated, call resetTriggeredTiers()
  - [ ] Use existing function from Story 5.3
  - [ ] Log reset event

- [ ] Task 11: Write BDD tests (All ACs)
  - [ ] Test create linear combo rule
  - [ ] Test create tiered combo rule
  - [ ] Test tier auto-sort
  - [ ] Test edit existing rule
  - [ ] Test delete rule with confirmation
  - [ ] Test toggle rule enabled/disabled
  - [ ] Test duplicate rule
  - [ ] Test rule statistics display
  - [ ] Test template selection
  - [ ] Test validation errors
  - [ ] Test unsaved changes warning
  - [ ] Test rule limits (max 10)
  - [ ] Test duplicate task type warning
  - [ ] Test test warning button
  - [ ] Test multi-child support

- [ ] Task 12: Add navigation and layout (AC: #1)
  - [ ] Add "Combo规则" menu item to parent sidebar
  - [ ] Add breadcrumb navigation
  - [ ] Implement responsive layout

## Dev Notes

### API Endpoints

```
GET    /api/combo/rules
POST   /api/combo/rules
PUT    /api/combo/rules/[ruleId]
DELETE /api/combo/rules/[ruleId]
PATCH  /api/combo/rules/[ruleId]/toggle
POST   /api/combo/rules/[ruleId]/duplicate
GET    /api/combo/rules/[ruleId]/stats
POST   /api/combo/rules/test-warning
```

### Request/Response Formats

```typescript
// POST /api/combo/rules
interface CreateComboRuleRequest {
  type: 'linear' | 'tiered';
  ruleName?: string;
  taskTypes: TaskType[] | null; // null = all types
  enabled: boolean;
  // Linear only
  threshold?: number;
  rewardPoints?: number;
  // Tiered only
  tieredConfig?: TieredConfig[];
  // Warning config
  warningEnabled: boolean;
  warningHoursBefore: number;
  warningMessageTemplate: string | null;
}

interface TieredConfig {
  threshold: number;
  reward: number;
}

// Response
interface ComboRuleResponse {
  id: string;
  familyId: string;
  type: 'linear' | 'tiered';
  ruleName: string | null;
  taskTypes: TaskType[] | null;
  threshold: number | null;
  rewardPoints: number | null;
  tieredConfig: TieredConfig[] | null;
  warningEnabled: boolean;
  warningHoursBefore: number;
  warningMessageTemplate: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// GET /api/combo/rules
interface GetComboRulesResponse {
  rules: ComboRuleResponse[];
  total: number;
  limit: number; // max 10
}

// GET /api/combo/rules/[ruleId]/stats
interface RuleStatsResponse {
  triggerCount: number;
  totalPointsAwarded: number;
  lastTriggeredAt: string | null;
  affectedChildrenCount: number;
  triggerTrend: { date: string; count: number }[]; // last 30 days
}
```

### Preset Templates

```typescript
const PRESET_TEMPLATES = [
  {
    id: 'basic-linear',
    name: '基础线性版',
    description: '每完成一定天数奖励固定积分，简单直接',
    icon: '📈',
    recommended: '推荐给刚开始Combo的孩子',
    config: {
      type: 'linear' as const,
      taskTypes: null,
      threshold: 7,
      rewardPoints: 30,
      warningEnabled: true,
      warningHoursBefore: 2,
      warningMessageTemplate: null
    }
  },
  {
    id: 'advanced-tiered',
    name: '进阶阶梯版',
    description: '连续天数越多奖励越高，激励长期坚持',
    icon: '🏆',
    recommended: '推荐给已经养成习惯的孩子',
    config: {
      type: 'tiered' as const,
      taskTypes: null,
      tieredConfig: [
        { threshold: 7, reward: 30 },
        { threshold: 14, reward: 70 },
        { threshold: 30, reward: 150 }
      ],
      warningEnabled: true,
      warningHoursBefore: 2,
      warningMessageTemplate: null
    }
  }
];
```

### Form Validation Rules

```typescript
// lib/validations/combo-rule.ts
const createComboRuleSchema = z.object({
  type: z.enum(['linear', 'tiered']),
  ruleName: z.string().max(100).optional(),
  taskTypes: z.array(z.enum(['brush', 'teach', 'exercise', 'chores', 'custom'])).max(5).nullable(),
  enabled: z.boolean(),
  // Linear
  threshold: z.number().int().min(1).max(365).optional(),
  rewardPoints: z.number().int().min(1).max(1000).optional(),
  // Tiered
  tieredConfig: z.array(z.object({
    threshold: z.number().int().min(1).max(365),
    reward: z.number().int().min(1).max(1000)
  })).min(1).optional(),
  // Warning
  warningEnabled: z.boolean(),
  warningHoursBefore: z.number().int().min(1).max(24),
  warningMessageTemplate: z.string().max(500).nullable()
}).superRefine((data, ctx) => {
  if (data.type === 'linear') {
    if (!data.threshold) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['threshold'],
        message: '连续次数必须填写'
      });
    }
    if (!data.rewardPoints) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rewardPoints'],
        message: '奖励积分必须填写'
      });
    }
  }
  if (data.type === 'tiered') {
    if (!data.tieredConfig || data.tieredConfig.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tieredConfig'],
        message: '请至少添加一个阶梯'
      });
    }
    if (data.tieredConfig) {
      const thresholds = data.tieredConfig.map(t => t.threshold);
      const uniqueThresholds = new Set(thresholds);
      if (thresholds.length !== uniqueThresholds.size) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tieredConfig'],
          message: '阶梯阈值不能重复'
        });
      }
    }
  }
});
```

### Components Structure

```
components/features/combo/
├── combo-rules-page.tsx         # Main page
├── combo-rule-list.tsx          # List existing rules
├── combo-rule-card.tsx          # Single rule display
├── combo-rule-form.tsx          # Create/edit form
├── template-selector.tsx        # Template picker modal
├── tiered-config-editor.tsx     # Tier editor
├── warning-config.tsx           # Warning settings
├── rule-statistics-panel.tsx    # Stats display
├── empty-state.tsx              # No rules state
└── unsaved-changes-warning.tsx  # Navigation guard
```

### BDD Test Scenarios

```typescript
describe('Story 5.6: Parent Configures Combo Rules', () => {
  it('given 家长首次配置，then 显示模板选择器', async () => {
    // Given: 家长登录，无规则
    const parent = await createParent();
    await navigateToComboRulesPage(parent.id);

    // Then: 显示模板选择器
    expect(screen.getByText('还没有配置Combo规则')).toBeInTheDocument();
    expect(screen.getByText('基础线性版')).toBeInTheDocument();
    expect(screen.getByText('进阶阶梯版')).toBeInTheDocument();
    expect(screen.getByText('自定义')).toBeInTheDocument();
  });

  it('given 选择基础线性模板，then 预填表单', async () => {
    // Given: 显示模板选择器
    const parent = await createParent();
    await navigateToComboRulesPage(parent.id);

    // When: 选择"基础线性版"
    await userEvent.click(screen.getByText('基础线性版'));

    // Then: 表单预填充
    expect(screen.getByDisplayValue('7')).toBeInTheDocument(); // threshold
    expect(screen.getByDisplayValue('30')).toBeInTheDocument(); // reward
  });

  it('given 创建阶梯Combo规则，then 保存成功', async () => {
    // Given: 填写阶梯规则
    const parent = await createParent();
    await navigateToCreateRuleForm(parent.id);
    await selectComboType('tiered');
    await addTier({ threshold: 7, reward: 30 });
    await addTier({ threshold: 14, reward: 70 });

    // When: 保存
    await userEvent.click(screen.getByText('保存'));

    // Then: 保存成功
    await waitFor(() => {
      expect(screen.getByText('Combo规则已保存')).toBeInTheDocument();
    });
    const rules = await getComboRules(parent.familyId);
    expect(rules).toHaveLength(1);
    expect(rules[0].type).toBe('tiered');
  });

  it('given 阶梯阈值重复，then 显示验证错误', async () => {
    // Given: 填写阶梯规则
    await navigateToCreateRuleForm();
    await selectComboType('tiered');
    await addTier({ threshold: 7, reward: 30 });
    await addTier({ threshold: 7, reward: 40 }); // Duplicate!

    // When: 保存
    await userEvent.click(screen.getByText('保存'));

    // Then: 显示错误
    expect(screen.getByText('阶梯阈值不能重复')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeDisabled();
  });
});
```

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] Create/edit/delete work correctly
4. [ ] Template selector works
5. [ ] Tiered config auto-sorts
6. [ ] Validation shows appropriate errors
7. [ ] Warning config saves correctly
8. [ ] Test warning works
9. [ ] Rule statistics display correctly
10. [ ] Rule limits enforced (max 10)
11. [ ] Duplicate task type warning shows
12. [ ] Unsaved changes warning works
13. [ ] Code review passed

## Dependencies

- Epic 5: Story 5.2, 5.3 (Combo Rewards) - Rules data source
- Epic 5: Story 5.3 - Triggered tiers reset
- Epic 6: Story 6.3 (Admin Creates Combo Rules Template) - Optional admin templates

## Dev Agent Record

### File List

**Files to Create:**
- app/api/combo/rules/route.ts
- app/api/combo/rules/[ruleId]/route.ts
- app/(parent)/combo/rules/page.tsx
- components/features/combo/combo-rule-list.tsx
- components/features/combo/combo-rule-card.tsx
- components/features/combo/combo-rule-form.tsx
- components/features/combo/template-selector.tsx
- components/features/combo/tiered-config-editor.tsx
- components/features/combo/warning-config.tsx
- components/features/combo/rule-statistics-panel.tsx
- components/features/combo/empty-state.tsx
- components/features/combo/unsaved-changes-warning.tsx

**Files to Modify:**
- app/(parent)/layout.tsx (add combo rules nav)
- lib/db/queries/combo-rules.ts (add CRUD queries)

**Test Files:**
- tests/e2e/combo-rules.spec.ts
- tests/integration/combo-rules-api.spec.ts
- tests/components/combo-rule-form.spec.tsx
