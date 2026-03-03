# Story 2.4: System Auto-Generates Task Instances

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统,
I want 根据日期策略自动生成任务实例,
So that 家长不需要手动创建每天的任务，任务能自动出现在儿童的任务列表中。

## Acceptance Criteria

**Given** 任务模板已发布且包含日期规则
**When** 系统时钟到达每日0点（北京时间0:00）
**Then** 系统根据所有已发布模板的规则生成当天的任务实例
**And** 任务实例生成规则：
  - 如果规则匹配当天日期，则生成实例
  - 如果当天在排除日期列表中，则不生成
  - 每个儿童根据其关联的模板生成独立的任务实例
**And** 任务实例状态默认为"待完成"
**And** 生成的任务实例存储在`tasks`表中，关联到`task_plan_id`
**And** 如果模板关联多个儿童，为每个儿童生成独立任务实例

## Tasks / Subtasks

- [ ] Task 1: 设计和创建tasks表 (AC: 生成的任务实例存储在tasks表中)
  - [ ] 1.1 设计tasks表schema（id, task_plan_id, child_id, title, points, status, date, created_at）
  - [ ] 1.2 创建数据库迁移文件
  - [ ] 1.3 执行迁移创建tasks表
  - [ ] 1.4 创建lib/db/queries/tasks.ts查询函数

- [ ] Task 2: 实现每日任务生成调度器 (AC: 系统时钟到达每日0点生成任务)
  - [ ] 2.1 创建任务生成调度器（lib/schedulers/task-generation-scheduler.ts）
  - [ ] 2.2 实现基于cron的每日0点触发（北京时间UTC+8）
  - [ ] 2.3 实现任务生成主流程（获取模板→解析规则→生成实例）
  - [ ] 2.4 集成到Bun运行时（Bun.serve background jobs）
  - [ ] 2.5 添加错误处理和重试逻辑

- [ ] Task 3: 实现任务实例生成逻辑 (AC: 根据规则生成任务实例)
  - [ ] 3.1 创建任务生成服务（lib/services/task-engine.ts/task-generator.ts）
  - [ ] 3.2 实现获取所有已发布模板逻辑
  - [ ] 3.3 实现模板到任务实例的转换（复制title, points等）
  - [ ] 3.4 实现日期规则解析（使用Story 2.3的DateRuleParser）
  - [ ] 3.5 实现排除日期过滤逻辑
  - [ ] 3.6 实现多儿童任务实例生成（每个儿童独立实例）

- [ ] Task 4: 实现任务实例批量插入优化 (AC: 高性能生成)
  - [ ] 4.1 使用Drizzle ORM批量插入
  - [ ] 4.2 实现事务保证（要么全部成功，要么全部失败）
  - [ ] 4.3 添加生成性能监控
  - [ ] 4.4 实现幂等性（避免重复生成同一天的任务）

- [ ] Task 5: 实现幂等性保证 (AC: 避免重复生成)
  - [ ] 5.1 检查任务是否已存在（tasks表unique约束）
  - [ ] 5.2 添加唯一索引（task_plan_id + child_id + date）
  - [ ] 5.3 实现生成前检查逻辑
  - [ ] 5.4 处理重复生成冲突（忽略已存在的任务）

- [ ] Task 6: 实现多儿童独立任务生成 (AC: 每个儿童独立任务实例)
  - [ ] 6.1 查询模板关联的所有儿童
  - [ ] 6.2 为每个儿童生成独立任务实例
  - [ ] 6.3 验证任务实例正确关联child_id
  - [ ] 6.4 确保儿童间任务实例完全独立

- [ ] Task 7: 编写BDD测试 (AC: 所有验收条件)
  - [ ] 7.1 Given-When-Then格式：每日任务生成集成测试
  - [ ] 7.2 测试每日规则生成逻辑
  - [ ] 7.3 测试每周规则生成逻辑
  - [ ] 7.4 测试排除日期过滤
  - [ ] 7.5 测试多儿童独立任务生成
  - [ ] 7.6 测试幂等性（避免重复生成）
  - [ ] 7.7 性能测试（批量插入性能）

- [ ] Task 8: 实现错误处理和监控 (AC: 用户体验要求)
  - [ ] 8.1 捕获并记录生成错误（日志）
  - [ ] 8.2 实现生成失败重试机制
  - [ ] 8.3 添加生成统计（成功/失败数量）
  - [ ] 8.4 实现监控告警（连续失败通知）
  - [ ] 8.5 使用Shadcn Toast显示管理员通知

- [ ] Task 9: 实现手动触发任务生成接口 (AC: 管理员手动触发)
  - [ ] 9.1 创建API端点app/api/admin/generate-tasks/route.ts
  - [ ] 9.2 实现手动生成指定日期的任务
  - [ ] 9.3 添加管理员权限验证
  - [ ] 9.4 实现生成结果报告

## Dev Notes

### Technical Requirements

**Technology Stack (MUST USE):**
- Runtime: Bun 1.3.x+ (NO Node.js compatibility layer)
- Framework: Next.js 16.x + React 19.x
- Database: bun:sqlite + Drizzle ORM 0.45.1+ (NO native SQL)
- Auth: Better-Auth 1.4.x+ with phone plugin
- UI: Tailwind CSS 4 + Shadcn UI 3.7.0+
- Testing: Bun Test + Playwright (BDD style)
- Types: TypeScript 5 strict mode (NO `any`, NO `@ts-ignore`)

**RED LIST Rules (CRITICAL - DO NOT VIOLATE):**
1. ❌ NO native SQL - MUST use Drizzle ORM
2. ❌ NO string concatenation for SQL - use Drizzle query builder
3. ❌ NO SQL in components/routes - encapsulate in lib/db/queries/
4. ❌ NO `any` type - use `unknown` + type guards
5. ❌ NO `@ts-ignore` - fix type errors
6. ❌ NO Node.js compatibility layer - use Bun built-ins
7. ❌ NO process.env - use Bun.env
8. ❌ NO alert() - use Shadcn Dialog/Toast
9. ❌ NO new dependencies without explicit approval

**Database Schema:**
```typescript
// database/schema/tasks.ts
import { sqliteTable, text, integer, timestamp } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { taskPlans } from './task-plans';
import { children } from './children';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  taskPlanId: text('task_plan_id').references(() => taskPlans.id),
  childId: text('child_id').references(() => children.id),
  title: text('title').notNull(),
  taskType: text('task_type').notNull(), // 刷牙/学习/运动/家务/自定义
  points: integer('points').notNull(),
  status: text('status').notNull().default('pending'), // pending/pending_approval/completed/rejected
  date: text('date').notNull(), // YYYY-MM-DD
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

// Unique constraint to prevent duplicate tasks
export const tasksUniqueIndex = sqliteTable('tasks_unique', {
  taskPlanId: text('task_plan_id').notNull(),
  childId: text('child_id').notNull(),
  date: text('date').notNull()
});
```

**Table Relationships:**
- `tasks.task_plan_id` → `task_plans.id` (Foreign Key, nullable)
  - 当`task_plan_id`不为NULL时，表示任务由计划模板生成
  - 当`task_plan_id`为NULL时，表示一次性手动任务（Story 2.12）
- `tasks.child_id` → `children.id` (Foreign Key, not null)
  - 每个任务实例必须关联一个儿童
  - 同一模板生成的多个任务，每个儿童有独立实例（不同child_id）

**Query Implications:**
- 查询计划任务时：`WHERE tasks.task_plan_id IS NOT NULL`
- 查询一次性任务时：`WHERE tasks.task_plan_id IS NULL`
- JOIN查询时需要处理NULL值：使用`LEFT JOIN task_plans`
```

**Task Generation Architecture:**
```typescript
// lib/schedulers/task-generation-scheduler.ts
import { Bun } from 'bun';

export class TaskGenerationScheduler {
  /**
   * Start the daily task generation scheduler
   * Runs every day at 00:00 Beijing time (UTC+8)
   */
  async start() {
    // Run immediately on startup to catch any missed tasks
    await this.generateTasksForToday();

    // Schedule daily execution at 00:00 Beijing time (UTC+8 = UTC 16:00)
    const cronExpression = '0 16 * * *'; // 16:00 UTC = 00:00 Beijing

    Bun.serve({
      port: 0, // Internal service
      fetch: async (req) => {
        // Health check endpoint
        if (req.url === '/health') {
          return new Response('OK');
        }
        return new Response('Not Found', { status: 404 });
      }
    });

    // Use Bun's setTimeout for scheduling (simpler than full cron)
    setInterval(async () => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      const utcMinute = now.getUTCMinutes();

      // Check if it's 16:00 UTC (00:00 Beijing)
      if (utcHour === 16 && utcMinute === 0) {
        await this.generateTasksForToday();
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Generate tasks for today's date
   */
  async generateTasksForToday() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`Starting task generation for ${dateStr}`);

    try {
      const generator = new TaskGenerator();
      const result = await generator.generateForDate(dateStr);

      console.log(`Task generation completed: ${result.successCount} tasks created, ${result.errorCount} errors`);
    } catch (error) {
      console.error('Task generation failed:', error);
      // TODO: Send alert to admin
    }
  }
}

// Export singleton instance
export const scheduler = new TaskGenerationScheduler();
```

```typescript
// lib/services/task-engine.ts/task-generator.ts
import { db } from '@/lib/db';
import { taskPlans } from '@/lib/db/schema';
import { tasks } from '@/lib/db/schema';
import { getTaskPlansByFamily, getChildrenByFamily } from '@/lib/db/queries';
import { DateRuleParser } from './date-rule-parser';
import { eq } from 'drizzle-orm';

export class TaskGenerator {
  private dateRuleParser: DateRuleParser;

  constructor() {
    this.dateRuleParser = new DateRuleParser();
  }

  /**
   * Generate task instances for a specific date
   * @param dateStr - Date in YYYY-MM-DD format
   * @returns Generation result with success/error counts
   */
  async generateForDate(dateStr: string) {
    const targetDate = new Date(dateStr + 'T00:00:00Z');
    let successCount = 0;
    let errorCount = 0;

    // Get all published task plans
    const allPlans = await db.query.taskPlans.findMany({
      where: eq(taskPlans.status, 'published')
    });

    console.log(`Found ${allPlans.length} published task plans`);

    // Group plans by family to optimize queries
    const plansByFamily = this.groupPlansByFamily(allPlans);

    // Generate tasks for each family
    for (const [familyId, plans] of Object.entries(plansByFamily)) {
      try {
        const familyResult = await this.generateForFamily(familyId, plans, targetDate);
        successCount += familyResult.successCount;
        errorCount += familyResult.errorCount;
      } catch (error) {
        console.error(`Failed to generate tasks for family ${familyId}:`, error);
        errorCount++;
      }
    }

    return { successCount, errorCount };
  }

  /**
   * Generate tasks for a specific family
   */
  private async generateForFamily(
    familyId: string,
    plans: any[],
    targetDate: Date
  ) {
    let successCount = 0;
    let errorCount = 0;

    // Get all children in the family
    const children = await getChildrenByFamily(familyId);

    // For each plan and child combination
    for (const plan of plans) {
      const rule = JSON.parse(plan.rule);

      for (const child of children) {
        try {
          // Check if task should be generated for this child on this date
          const shouldGenerate = this.dateRuleParser.shouldGenerateTask(
            rule,
            targetDate,
            new Date(plan.createdAt)
          );

          if (shouldGenerate) {
            await this.createTaskInstance(plan, child, targetDate);
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to generate task for plan ${plan.id}, child ${child.id}:`, error);
          errorCount++;
        }
      }
    }

    return { successCount, errorCount };
  }

  /**
   * Create a single task instance
   */
  private async createTaskInstance(plan: any, child: any, date: Date) {
    const dateStr = date.toISOString().split('T')[0];

    // Check if task already exists (idempotency)
    const existingTask = await db.query.tasks.findFirst({
      where: eq(tasks.taskPlanId, plan.id)
    });

    if (existingTask) {
      console.log(`Task already exists for plan ${plan.id}, child ${child.id}, date ${dateStr}`);
      return; // Skip duplicate
    }

    // Create new task instance
    const taskId = crypto.randomUUID();
    const now = new Date();

    await db.insert(tasks).values({
      id: taskId,
      taskPlanId: plan.id,
      childId: child.id,
      title: plan.title,
      taskType: plan.taskType,
      points: plan.points,
      status: 'pending',
      date: dateStr,
      createdAt: now,
      updatedAt: now
    });

    console.log(`Created task ${taskId} for child ${child.id} from plan ${plan.id}`);
  }

  private groupPlansByFamily(plans: any[]): Record<string, any[]> {
    return plans.reduce((acc, plan) => {
      if (!acc[plan.familyId]) {
        acc[plan.familyId] = [];
      }
      acc[plan.familyId].push(plan);
      return acc;
    }, {} as Record<string, any[]>);
  }
}
```

**Query Pattern (MUST FOLLOW):**
```typescript
// lib/db/queries/tasks.ts
import { db } from '@/lib/db';
import { tasks, taskPlans } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getTasksByChild(childId: string, date?: string) {
  const conditions = [eq(tasks.childId, childId)];

  if (date) {
    conditions.push(eq(tasks.date, date));
  }

  return await db.query.tasks.findMany({
    where: and(...conditions),
    orderBy: [desc(tasks.createdAt)]
  });
}

export async function getTasksByFamilyAndDate(familyId: string, date: string) {
  return await db.query.tasks.findMany({
    where: and(
      eq(taskPlans.familyId, familyId),
      eq(tasks.date, date)
    ),
    with: {
      taskPlan: true,
      child: true
    }
  });
}

export async function createTaskInstance(data: CreateTaskDTO) {
  return await db.insert(tasks).values(data).returning();
}
```

### Architecture Compliance

**Component Location:**
- Scheduler: `lib/schedulers/task-generation-scheduler.ts`
- Task generator: `lib/services/task-engine.ts/task-generator.ts`
- Date rule parser: `lib/services/task-engine.ts/date-rule-parser.ts` (from Story 2.3)
- Database queries: `lib/db/queries/tasks.ts`
- Schema definition: `database/schema/tasks.ts`
- Admin API: `app/api/admin/generate-tasks/route.ts`

**Design System:**
- No UI components required (background service)
- Use Shadcn Toast for admin notifications
- Admin dashboard to view generation logs

**Performance Requirements:**
- Task generation: <5 seconds for 5000 families (NFR1, NFR3)
- Batch insert: Use Drizzle ORM batch insert for efficiency
- Database indexing: Add indexes on (task_plan_id, child_id, date)

### Testing Requirements

**BDD Format (GIVEN-WHEN-THEN):**
```typescript
// tests/integration/task-generation.spec.ts
import { TaskGenerator } from '@/lib/services/task-engine/task-generator';
import { DateRuleParser } from '@/lib/services/task-engine/date-rule-parser';

it('given 已发布每日任务模板，when 系统时钟到达0点，then 生成当天的任务实例', async () => {
  // Given: 家长已创建并发布每日任务模板
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child = await createChild({ familyId: family.id });

  const taskPlan = await createTaskPlan({
    familyId: family.id,
    title: '每日刷牙',
    taskType: '刷牙',
    points: 5,
    rule: JSON.stringify({
      frequency: 'daily',
      excludedDates: { dates: [], scope: 'permanent' }
    }),
    status: 'published'
  });

  // When: 系统执行每日任务生成
  const generator = new TaskGenerator();
  const today = new Date().toISOString().split('T')[0];
  const result = await generator.generateForDate(today);

  // Then: 生成当天的任务实例
  expect(result.successCount).toBeGreaterThan(0);

  // And: 任务实例状态为"待完成"
  const tasks = await getTasksByChild(child.id, today);
  expect(tasks).toHaveLength(1);
  expect(tasks[0].status).toBe('pending');
  expect(tasks[0].title).toBe('每日刷牙');
  expect(tasks[0].points).toBe(5);
});

it('given 已发布每周任务模板（周一、三、五），when 周一生成，then 生成任务；when 周二生成，then 不生成', async () => {
  // Given: 家长已创建并发布每周任务模板
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child = await createChild({ familyId: family.id });

  const taskPlan = await createTaskPlan({
    familyId: family.id,
    title: '每周运动',
    taskType: '运动',
    points: 10,
    rule: JSON.stringify({
      frequency: 'weekly',
      daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
      excludedDates: { dates: [], scope: 'permanent' }
    }),
    status: 'published'
  });

  // When: 系统在周一生成任务
  const generator = new TaskGenerator();
  const monday = getNextWeekday(new Date(), 1); // Next Monday
  const mondayStr = monday.toISOString().split('T')[0];

  await generator.generateForDate(mondayStr);

  // Then: 周一应该生成任务
  const mondayTasks = await getTasksByChild(child.id, mondayStr);
  expect(mondayTasks).toHaveLength(1);
  expect(mondayTasks[0].title).toBe('每周运动');

  // When: 系统在周二生成任务
  const tuesday = getNextWeekday(monday, 1); // Next Tuesday
  const tuesdayStr = tuesday.toISOString().split('T')[0];

  await generator.generateForDate(tuesdayStr);

  // Then: 周二不应该生成任务
  const tuesdayTasks = await getTasksByChild(child.id, tuesdayStr);
  expect(tuesdayTasks).toHaveLength(0);
});

it('given 已设置排除日期，when 生成任务时，then 排除日期不生成任务', async () => {
  // Given: 家长已创建每日任务模板并设置排除日期
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child = await createChild({ familyId: family.id });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const taskPlan = await createTaskPlan({
    familyId: family.id,
    title: '每日刷牙',
    taskType: '刷牙',
    points: 5,
    rule: JSON.stringify({
      frequency: 'daily',
      excludedDates: {
        dates: [todayStr], // Exclude today
        scope: 'permanent'
      }
    }),
    status: 'published'
  });

  // When: 系统生成今天的任务
  const generator = new TaskGenerator();
  const result = await generator.generateForDate(todayStr);

  // Then: 今天不应该生成任务（被排除）
  const tasks = await getTasksByChild(child.id, todayStr);
  expect(tasks).toHaveLength(0);
});

it('given 模板关联多个儿童，when 生成任务时，then 为每个儿童生成独立任务实例', async () => {
  // Given: 家庭有2个儿童，家长已发布任务模板
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child1 = await createChild({ familyId: family.id });
  const child2 = await createChild({ familyId: family.id });

  const taskPlan = await createTaskPlan({
    familyId: family.id,
    title: '每日刷牙',
    taskType: '刷牙',
    points: 5,
    rule: JSON.stringify({
      frequency: 'daily',
      excludedDates: { dates: [], scope: 'permanent' }
    }),
    status: 'published'
  });

  // When: 系统生成今天的任务
  const generator = new TaskGenerator();
  const today = new Date().toISOString().split('T')[0];
  const result = await generator.generateForDate(today);

  // Then: 为每个儿童生成独立的任务实例
  const child1Tasks = await getTasksByChild(child1.id, today);
  const child2Tasks = await getTasksByChild(child2.id, today);

  expect(child1Tasks).toHaveLength(1);
  expect(child2Tasks).toHaveLength(1);

  // And: 两个任务实例完全独立
  expect(child1Tasks[0].id).not.toBe(child2Tasks[0].id);
  expect(child1Tasks[0].childId).toBe(child1.id);
  expect(child2Tasks[0].childId).toBe(child2.id);
});

it('given 任务已生成，when 再次生成同一天的任务，then 不重复生成（幂等性）', async () => {
  // Given: 家长已发布任务模板，任务已生成
  const family = await createFamily();
  const parent = await createParent({ familyId: family.id });
  const child = await createChild({ familyId: family.id });

  const taskPlan = await createTaskPlan({
    familyId: family.id,
    title: '每日刷牙',
    taskType: '刷牙',
    points: 5,
    rule: JSON.stringify({
      frequency: 'daily',
      excludedDates: { dates: [], scope: 'permanent' }
    }),
    status: 'published'
  });

  const today = new Date().toISOString().split('T')[0];

  // First generation
  const generator1 = new TaskGenerator();
  await generator1.generateForDate(today);
  const tasksAfterFirst = await getTasksByChild(child.id, today);
  expect(tasksAfterFirst).toHaveLength(1);

  // When: 再次生成同一天的任务
  const generator2 = new TaskGenerator();
  const result = await generator2.generateForDate(today);

  // Then: 不重复生成任务
  const tasksAfterSecond = await getTasksByChild(child.id, today);
  expect(tasksAfterSecond).toHaveLength(1);
  expect(tasksAfterSecond[0].id).toBe(tasksAfterFirst[0].id);
});
```

**Test Coverage:**
- Unit tests for TaskGenerator class
- Unit tests for date rule parsing (from Story 2.3)
- Integration tests for scheduler
- Integration tests for task generation logic
- E2E tests for complete workflow
- Performance tests (generation <5s for 5000 families)
- Idempotency tests (no duplicate tasks)

### Security & Compliance

**COPPA/GDPR Compliance:**
- Task generation is transparent to children (no direct access)
- Parent controls all task plans
- Audit trail for all generated tasks

**RBAC:**
- Only system scheduler can auto-generate tasks
- Admin can manually trigger generation via API
- Parent cannot manually generate tasks (only create templates)

**Data Integrity:**
- Unique constraint prevents duplicate tasks
- Transaction ensures atomic generation
- Failed generations are logged and retried

### File Length Constraint

**MAX 800 lines per file** - If component exceeds limit, split into:
- task-generation-scheduler.ts (scheduling logic)
- task-generator.ts (generation logic)
- date-rule-parser.ts (from Story 2.3)

### Project Structure Notes

**Alignment:**
- Follows unified project structure (paths, modules, naming)
- Database queries in lib/db/queries/tasks.ts (per-table file)
- Service layer in lib/services/task-engine.ts/
- Function-based queries (NOT Repository pattern)
- BDD development (Given-When-Then, tests BEFORE implementation)

**Dependencies:**
- Depends on Story 2.1: Parent Creates Task Plan Template (task_plans table)
- Depends on Story 2.2: Parent Sets Task Points Value (points field)
- Depends on Story 2.3: Parent Sets Task Date Rules (rule JSON field, DateRuleParser)
- Prerequisite: Users table, Families table exist (Epic 1)

**Cross-Story Impact:**
- Story 2.5 (Parent Pauses/Resumes/Deletes Task Plan) - paused plans won't generate tasks
- Story 2.8 (Child Views Today's Task List) - displays generated tasks
- Story 2.9 (Child Marks Task Complete) - updates task status
- Story 2.10 (Parent Approves Task Completion) - approves generated tasks

### Previous Story Intelligence

**From Story 2.1 (Parent Creates Task Plan Template):**
- task_plans table created with rule JSON field
- TaskPlanForm component exists
- Learnings: Use Drizzle ORM queries, follow per-table query file pattern

**From Story 2.2 (Parent Sets Task Points Value):**
- task_plans table has points field
- Points calculation logic established
- Learnings: Implement validation and error handling

**From Story 2.3 (Parent Sets Task Date Rules):**
- DateRuleParser class created (lib/services/task-engine.ts/date-rule-parser.ts)
- TaskDateRule type defined
- Rule validation logic implemented
- Learnings: Date rule parsing is complex, use comprehensive unit tests

### References

- Source: docs/TECH_SPEC.md - Technical specifications
- Source: docs/TECH_SPEC_DATABASE.md - Database schema
- Source: docs/TECH_SPEC_BUN.md - Bun runtime requirements
- Source: docs/TECH_SPEC_BDD.md - BDD development guidelines
- Source: _bmad-output/planning-artifacts/epics.md#Story-2.4 - Story requirements
- Source: _bmad-output/planning-artifacts/architecture.md#ADR-5 - Database query layer architecture
- Source: _bmad-output/planning-artifacts/ux-design-specification.md - UI/UX specifications
- Source: _bmad-output/implementation-artifacts/2-1-parent-creates-task-plan-template.md - Story 2.1 context
- Source: _bmad-output/implementation-artifacts/2-2-parent-sets-task-points-value.md - Story 2.2 context
- Source: _bmad-output/implementation-artifacts/2-3-parent-sets-task-date-rules.md - Story 2.3 context

### Dev Agent Record

### Agent Model Used

glm-4.7

### Debug Log References

### Completion Notes List

### File List

- `database/schema/tasks.ts` - Tasks table schema
- `database/migrations/xxx_create_tasks.sql` - Migration file
- `lib/db/queries/tasks.ts` - Tasks queries
- `lib/schedulers/task-generation-scheduler.ts` - Daily task scheduler
- `lib/services/task-engine.ts/task-generator.ts` - Task generation service
- `lib/services/task-engine.ts/date-rule-parser.ts` - Date rule parser (from Story 2.3)
- `app/api/admin/generate-tasks/route.ts` - Admin manual trigger API
- `tests/integration/task-generation.spec.ts` - Integration tests
- `tests/unit/task-generator.spec.ts` - Unit tests for generator
- `tests/e2e/task-generation.spec.ts` - E2E tests
