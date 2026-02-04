# 计划任务创建表单修改

## TL;DR

> 修改计划任务创建页面，满足新的业务需求：条件必填、连击开关、任务对象选择、日期策略分组逻辑、日期范围验证等

## Context

### Original Request

用户要求修改 `http://localhost:3344/admin/task-templates/new` 页面，实现以下功能：

1. 如果勾选了模板，则开始时间和结束时间变为非必填
2. 添加"是否开启连击"表单项
3. 连击策略只在开启连击时才必填
4. 添加"任务对象"选择，如果勾选模板则禁用并清空值
5. 文本修改（模板→计划任务）
6. 日期策略下拉选项逻辑修改
7. **新增**：开始/结束时间合并为单个"日期范围"输入框
8. **新增**：非模板时校验日期范围和日期策略是否有重叠，无重叠则弹窗确认

### Interview Summary

**Key Discussions**:

- 任务对象需要获取当前家庭的所有成员
- 成员排序：先儿童，后家长
- 日期策略分组：模板显示公开策略，非模板显示家庭策略
- 日期范围验证：需要检查日期范围与日期策略是否有重叠

**Research Findings**:

- `lib/db/schema.ts` 中有 `familyMembers` 表结构
- `lib/db/queries.ts` 中有 `getMembersByFamilyId` 函数
- `AlertDialog` 组件可用于确认弹窗
- 日期策略的 `dates` 字段存储逗号分隔的日期字符串 (YYYY-MM-DD)

## Work Objectives

### Core Objective

修改计划任务创建表单，增强用户体验和业务逻辑

### Concrete Deliverables

- 修改后的 `app/admin/task-templates/new/page.tsx`
- 修改后的 `components/task-template-form.tsx`
- 新增 `app/api/family/members/route.ts` API 端点

### Definition of Done

- [x] 页面文本正确修改
- [x] 日期范围输入框（合并开始/结束时间）
- [x] 模板勾选时日期范围变为可选
- [x] 开启连击复选框正常工作
- [x] 连击策略条件必填
- [x] 任务对象选择器正常工作
- [x] 任务对象在模板模式下禁用并清空
- [x] 日期策略按条件显示（公开/家庭）
- [x] 非模板时日期范围与日期策略重叠校验
- [x] 无重叠时弹窗确认

## Verification Strategy

**Test Decision**: 手动测试验证

### Manual Verification Steps

1. 访问 `http://localhost:3344/admin/task-templates/new`
2. 验证页面标题显示"新建计划任务"
3. 验证表单标题显示"计划任务信息"
4. 验证日期范围输入框显示（两个日期输入框并排）
5. 勾选"设为模板"复选框
6. 验证日期范围变为可选
7. 验证日期策略只显示公开策略
8. 验证任务对象下拉框禁用
9. 不勾选模板
10. 验证日期范围恢复必填
11. 验证日期策略显示家庭策略
12. 验证任务对象可选
13. 勾选"开启连击"
14. 验证连击策略变为必填
15. 不勾选"开启连击"
16. 验证连击策略变为可选
17. 测试日期重叠校验（选择与日期策略无重叠的日期范围）
18. 验证弹窗确认显示

## TODOs

### 1. Update page text

- 修改 `app/admin/task-templates/new/page.tsx`
- "新建计划任务模板" → "新建计划任务"
- "创建新的任务模板" → "创建新的计划任务"
- "模板信息" → "计划任务信息"

**References**:

- `app/admin/task-templates/new/page.tsx` - 当前页面文件

### 2. Add API endpoints (Using Drizzle ORM)

#### 2.1 Add queries to lib/db/queries.ts

Add the following query functions:

```typescript
/**
 * Get family members by family ID with user info
 */
export async function getFamilyMembersByFamilyId(familyId: string) {
  const db = getDb();
  const members = await db.query.familyMembers.findMany({
    where: eq(schema.familyMembers.familyId, familyId),
    with: {
      user: true,
    },
    orderBy: [asc(schema.familyMembers.role)],
  });
  return members;
}

/**
 * Get date strategies created by family members (non-public)
 */
export async function getFamilyDateStrategies(userIds: string[]) {
  const db = getDb();
  const strategies = await db.query.dateStrategies.findMany({
    where: and(
      inArray(schema.dateStrategies.createdBy, userIds),
      eq(schema.dateStrategies.isPublic, false),
    ),
    orderBy: [desc(schema.dateStrategies.createdAt)],
  });
  return strategies;
}
```

**References**:

- `lib/db/queries.ts` - Existing query functions
- `lib/db/schema.ts:107` - `familyMembers` table structure
- `lib/db/schema.ts:425` - `dateStrategies` table structure

#### 2.2 Family members API

- Create `app/api/family/members/route.ts`
- Use `getSession` from `lib/auth` to get current user
- Use `getFamilyMembersByFamilyId` from `lib/db/queries.ts`
- Returns members sorted by role (child first)

```typescript
// app/api/family/members/route.ts
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ErrorCodes,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/constant";
import { getUserByPhone } from "@/lib/db/queries";
import { getFamilyMembersByFamilyId } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request.headers);
    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 },
      );
    }

    // Get user's family_id
    const user = await getUserByPhone(session.user.phone || "");
    if (!user || !user.role) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Not in a family"),
        { status: 403 },
      );
    }

    // Get family_id from family_member table using raw db for simplicity
    const rawDb = await import("@/database/db").then((m) => m.getRawDb());
    const member = rawDb
      .query(
        `
      SELECT family_id FROM family_member WHERE user_id = ?
    `,
      )
      .get(user.id) as { family_id: string } | null;

    if (!member) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Not in a family"),
        { status: 403 },
      );
    }

    // Use Drizzle ORM to get members
    const members = await getFamilyMembersByFamilyId(member.family_id);

    return Response.json(createSuccessResponse({ members }));
  } catch (error) {
    console.error("GET /api/family/members error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 },
    );
  }
}
```

#### 2.3 Family date strategies API

- Create `app/api/family/date-strategies/route.ts`
- Use `getSession` from `lib/auth` to get current user
- Use `getFamilyDateStrategies` from `lib/db/queries.ts`
- Returns non-public date strategies (is_public = 0)

```typescript
// app/api/family/date-strategies/route.ts
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ErrorCodes,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/constant";
import { getUserByPhone } from "@/lib/db/queries";
import { getFamilyDateStrategies } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request.headers);
    if (!session?.user) {
      return Response.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized"),
        { status: 401 },
      );
    }

    // Get user's family_id and all user_ids in the family
    const rawDb = await import("@/database/db").then((m) => m.getRawDb());

    const user = await getUserByPhone(session.user.phone || "");
    if (!user) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Not found"),
        { status: 403 },
      );
    }

    const member = rawDb
      .query(
        `
      SELECT family_id FROM family_member WHERE user_id = ?
    `,
      )
      .get(user.id) as { family_id: string } | null;

    if (!member) {
      return Response.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Not in a family"),
        { status: 403 },
      );
    }

    const familyUsers = rawDb
      .query(
        `
      SELECT user_id FROM family_member WHERE family_id = ?
    `,
      )
      .all(member.family_id) as { user_id: string }[];

    if (familyUsers.length === 0) {
      return Response.json(createSuccessResponse({ strategies: [] }));
    }

    const userIds = familyUsers.map((u) => u.user_id);

    // Use Drizzle ORM to get family date strategies
    const strategies = await getFamilyDateStrategies(userIds);

    return Response.json(createSuccessResponse({ strategies }));
  } catch (error) {
    console.error("GET /api/family/date-strategies error:", error);
    return Response.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 },
    );
  }
}
```

### 3. Modify task-template-form.tsx

#### 3.1 Add new state variables

```typescript
const [enableCombo, setEnableCombo] = useState(false);
const [targetMemberId, setTargetMemberId] = useState("");
const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
const [showDateOverlapDialog, setShowDateOverlapDialog] = useState(false);
const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null);
```

#### 3.2 Add fetch for family members

```typescript
const fetchFamilyMembers = async () => {
  const response = await fetch("/api/family/members");
  const data = await response.json();
  if (data.success) {
    setFamilyMembers(data.data.members || []);
  }
};
```

#### 3.3 Add date overlap checking function

```typescript
const checkDateOverlap = (
  dateRangeStart: string,
  dateRangeEnd: string,
  dateStrategyDates: string,
): boolean => {
  if (!dateRangeStart || !dateRangeEnd || !dateStrategyDates) {
    return false;
  }

  const rangeStart = new Date(dateRangeStart);
  const rangeEnd = new Date(dateRangeEnd);
  const strategyDates = dateStrategyDates.split(",");

  for (const dateStr of strategyDates) {
    const strategyDate = new Date(dateStr.trim());
    if (strategyDate >= rangeStart && strategyDate <= rangeEnd) {
      return true; // 有重叠
    }
  }
  return false; // 无重叠
};
```

#### 3.4 Update isTemplate change handler

```typescript
const handleIsTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const checked = e.target.checked;
  setIsTemplate(checked);
  if (checked) {
    setTargetMemberId(""); // 清空任务对象
  }
};
```

#### 3.5 Update date strategy fetch and filtering

- 根据 `isTemplate` 决定获取公开策略还是家庭策略
- 移除分组显示，直接显示列表

```typescript
const fetchDateStrategies = async () => {
  const endpoint = isTemplate
    ? "/api/admin/date-strategy-templates?is_public=true"
    : "/api/family/date-strategies";
  const response = await fetch(endpoint);
  const data = await response.json();
  if (data.success) {
    const strategies = data.data.templates.map((t: any) => ({
      ...t,
      group: t.is_public === 1 ? "public" : "family",
    }));
    setDateStrategies(strategies);
  }
};
```

#### 3.6 Update submit handling with overlap check

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // 验证表单
  if (!validateForm()) return;

  // 非模板时检查日期重叠
  if (!isTemplate && dateStrategyId) {
    const strategy = dateStrategies.find((s) => s.id === dateStrategyId);
    if (strategy && !checkDateOverlap(startDate, endDate, strategy.dates)) {
      // 无重叠，显示确认弹窗
      setShowDateOverlapDialog(true);
      return;
    }
  }

  // 执行提交
  await submitForm();
};

const submitForm = async () => {
  setIsSubmitting(true);
  setError("");

  const comboConfig = enableCombo
    ? comboType === "linear"
      ? {
          min: Number(linearMin),
          max: Number(linearMax),
          points: Number(linearPoints),
        }
      : stairRows.map((row) => ({
          min: Number(row.minCount),
          max: Number(row.maxCount),
          points: Number(row.points),
        }))
    : null;

  const payload = {
    templateName,
    taskName,
    basePoints: Number(basePoints),
    startDate,
    endDate,
    dateStrategyId,
    comboStrategyType: enableCombo ? comboType : null,
    comboStrategyConfig: enableCombo ? JSON.stringify(comboConfig) : null,
    badgeId: badgeId || null,
    ageRangeMin: ageMin ? Number(ageMin) : null,
    ageRangeMax: ageMax ? Number(ageMax) : null,
    taskType,
    isTemplate: isTemplate ? 1 : 0,
    category: "custom",
    points: Number(basePoints),
    name: taskName,
    targetMemberId: targetMemberId || null,
  };

  try {
    const response = await fetch("/api/admin/task-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      onSuccess?.();
    } else {
      setError(data.error?.message || "创建失败");
    }
  } catch (error) {
    setError("创建失败，请重试");
  } finally {
    setIsSubmitting(false);
    setShowDateOverlapDialog(false);
  }
};
```

#### 3.7 Update validation logic

```typescript
const validateForm = () => {
  if (!templateName || templateName.length < 2 || templateName.length > 20) {
    setError("模板名称需2-20个字符");
    return false;
  }
  if (!taskName || taskName.length < 2 || taskName.length > 20) {
    setError("任务名称需2-20个字符");
    return false;
  }
  if (!basePoints || isNaN(Number(basePoints))) {
    setError("基础奖励必填且需为数字");
    return false;
  }
  // 日期：模板时可选
  if (!isTemplate && (!startDate || !endDate)) {
    setError("开始和结束时间必填");
    return false;
  }
  // 模板时日期策略可选
  if (!dateStrategyId) {
    setError("日期策略必填");
    return false;
  }
  // 连击：开启时才必填
  if (enableCombo) {
    if (comboType === "linear") {
      if (!linearMin || !linearMax || !linearPoints) {
        setError("线性连击策略参数必填");
        return false;
      }
    } else {
      const hasEmpty = stairRows.some(
        (row) => !row.minCount || !row.maxCount || !row.points,
      );
      if (hasEmpty) {
        setError("阶梯连击策略所有行必填");
        return false;
      }
    }
  }
  return true;
};
```

#### 3.8 Add form fields

**日期范围输入框**（替代原来的开始时间和结束时间分开显示）：

```tsx
<div className="space-y-2">
  <Label htmlFor="dateRange">日期范围 {!isTemplate && "*"}</Label>
  <div className="flex items-center gap-2">
    <Input
      id="startDate"
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      required={!isTemplate}
      className="flex-1"
      placeholder="开始日期"
    />
    <span className="text-muted-foreground">至</span>
    <Input
      id="endDate"
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      required={!isTemplate}
      className="flex-1"
      placeholder="结束日期"
    />
  </div>
  {isTemplate && (
    <p className="text-xs text-muted-foreground">
      模板模式下日期可选，创建具体任务时再设置
    </p>
  )}
</div>
```

**开启连击复选框**（在连击策略区域上方）：

```tsx
<div className="flex items-center gap-2 mb-3">
  <input
    type="checkbox"
    id="enableCombo"
    checked={enableCombo}
    onChange={(e) => setEnableCombo(e.target.checked)}
    className="h-4 w-4 rounded border-gray-300"
  />
  <Label htmlFor="enableCombo" className="font-medium">
    开启连击
  </Label>
</div>
```

**任务对象选择器**（在基础奖励区域）：

```tsx
<div className="space-y-2">
  <Label htmlFor="targetMember">任务对象 (可选)</Label>
  <select
    id="targetMember"
    value={targetMemberId}
    onChange={(e) => setTargetMemberId(e.target.value)}
    disabled={isTemplate}
    className="w-full h-10 px-3 py-2 border border-input rounded-md text-sm disabled:opacity-50"
  >
    <option value="">所有家庭成员</option>
    {familyMembers.map((member) => (
      <option key={member.id} value={member.id}>
        {member.displayName || member.user?.name} (
        {member.role === "child" ? "儿童" : "家长"})
      </option>
    ))}
  </select>
  {isTemplate && (
    <p className="text-xs text-muted-foreground">模板模式下不能指定任务对象</p>
  )}
</div>
```

#### 3.9 Wrap combo strategy section with conditional

```tsx
{
  enableCombo && (
    <div className="space-y-3 border rounded-md p-4">{/* 连击策略内容 */}</div>
  );
}
```

#### 3.10 Add AlertDialog for date overlap confirmation

```tsx
<AlertDialog
  open={showDateOverlapDialog}
  onOpenChange={setShowDateOverlapDialog}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认保存</AlertDialogTitle>
      <AlertDialogDescription>
        所选日期范围和日期策略没有重叠，将不会产生任务。 确定要保存吗？
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => setShowDateOverlapDialog(false)}>
        取消
      </AlertDialogCancel>
      <AlertDialogAction onClick={submitForm} disabled={isSubmitting}>
        {isSubmitting ? "保存中..." : "确定保存"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### 3.11 Update input required attributes

日期范围已经处理，不需要单独处理。

#### 3.12 Update payload

```typescript
const payload = {
  // ... existing fields
  enableCombo: enableCombo ? 1 : 0,
  targetMemberId: targetMemberId || null,
  // ... existing fields
};
```

### 4. Update page.tsx text

- "新建计划任务模板" → "新建计划任务"
- "创建新的任务模板" → "创建新的计划任务"
- "模板信息" → "计划任务信息"

### 5. Add AlertDialog import

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
```

## Execution Strategy

### Sequential Execution

所有任务按顺序执行，无并行依赖。

## Files to Modify

1. `app/admin/task-templates/new/page.tsx` - 文本修改
2. `components/task-template-form.tsx` - 主要逻辑修改
3. `lib/db/queries.ts` - 添加 Drizzle ORM 查询函数

## Files to Create

1. `app/api/family/members/route.ts` - 获取家庭成员API
2. `app/api/family/date-strategies/route.ts` - 获取家庭日期策略API

## New Dependencies

使用 Drizzle ORM 查询，与项目架构约束一致：

- `lib/db/queries.ts` 添加新的查询函数
- API 端点使用 `getDb()` 和 schema 进行类型安全查询

### Date Overlap Check Logic

```typescript
// 日期范围: [startDate, endDate]
// 日期策略: [date1, date2, date3, ...]

// 重叠条件: 存在 strategyDate 使得 startDate <= strategyDate <= endDate
const hasOverlap = strategyDates.some((dateStr) => {
  const strategyDate = new Date(dateStr.trim());
  return strategyDate >= rangeStart && strategyDate <= rangeEnd;
});
```

### Date Format

- 前端输入: YYYY-MM-DD (HTML date input)
- 存储格式: YYYY-MM-DD (逗号分隔)
- 比较时直接使用 Date 对象
