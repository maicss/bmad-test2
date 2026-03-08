/**
 * Integration Tests for Story 2.4: System Auto-Generates Task Instances
 *
 * BDD-style tests for task generation functionality
 *
 * Source: Story 2.4 AC #1-#7
 */

import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import db from '@/lib/db';
import { taskPlans, tasks, users, families, taskPlanChildren } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { TaskGenerator } from '@/lib/services/task-engine/task-generator';
import { getTasksForChild } from '@/lib/db/queries/tasks';

describe('Story 2.4: System Auto-Generates Task Instances', () => {
  let familyId: string;
  let parentId: string;
  let childId: string;
  let child2Id: string;
  let uniqueId: string;

  beforeAll(async () => {
    // Generate unique ID for this test run
    uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Setup test family
    const familyResult = await db.insert(families).values({
      id: `test-family-2-4-${uniqueId}`,
      primary_parent_id: `test-parent-2-4-${uniqueId}`,
    }).returning();
    familyId = familyResult[0]!.id;

    const parentResult = await db.insert(users).values({
      id: `test-parent-2-4-${uniqueId}`,
      phone: `13800240${Math.floor(100 + Math.random() * 900)}`,
      phone_hash: `hash-2-4-${uniqueId}`,
      role: 'parent',
      family_id: familyId,
    }).returning();
    parentId = parentResult[0]!.id;

    const childResult = await db.insert(users).values({
      id: `test-child-2-4-${uniqueId}`,
      phone: `13800241${Math.floor(100 + Math.random() * 900)}`,
      phone_hash: `hash-2-4-1-${uniqueId}`,
      role: 'child',
      family_id: familyId,
    }).returning();
    childId = childResult[0]!.id;

    const child2Result = await db.insert(users).values({
      id: `test-child-2-4-2-${uniqueId}`,
      phone: `13800242${Math.floor(100 + Math.random() * 900)}`,
      phone_hash: `hash-2-4-2-${uniqueId}`,
      role: 'child',
      family_id: familyId,
    }).returning();
    child2Id = child2Result[0]!.id;
  });

  beforeEach(async () => {
    // Clean up tasks and task plans before each test
    await db.delete(tasks).where(eq(tasks.family_id, familyId));
    await db.delete(taskPlanChildren).where(eq(taskPlanChildren.task_plan_id, `test-plan-2-4-${uniqueId}`));
    await db.delete(taskPlans).where(eq(taskPlans.family_id, familyId));
  });

  it('given 已发布每日任务模板，when 系统时钟到达0点，then 生成当天的任务实例', async () => {
    // Given: 家长已创建并发布每日任务模板
    const today = new Date().toISOString().split('T')[0];

    const planResult = await db.insert(taskPlans).values({
      id: `test-plan-2-4-${uniqueId}`,
      family_id: familyId,
      title: '每日刷牙',
      task_type: '刷牙',
      points: 5,
      rule: JSON.stringify({
        frequency: 'daily',
        excludedDates: { dates: [], scope: 'permanent' }
      }),
      status: 'published',
      created_by: parentId,
    }).returning();

    const planId = planResult[0]!.id;

    // Assign child to the task plan
    await db.insert(taskPlanChildren).values({
      id: `test-tpc-2-4-${uniqueId}`,
      task_plan_id: planId,
      child_id: childId,
    });

    // When: 系统执行每日任务生成
    const generator = new TaskGenerator();
    const result = await generator.generateForDate(today);

    // Then: 生成当天的任务实例
    expect(result.successCount).toBeGreaterThan(0);

    // And: 任务实例状态为"待完成"
    const childTasks = await getTasksForChild(familyId, childId, today);
    expect(childTasks).toHaveLength(1);
    expect(childTasks[0]!.status).toBe('pending');
    expect(childTasks[0]!.title).toBe('每日刷牙');
    expect(childTasks[0]!.points).toBe(5);
  });

  it('given 已发布每周任务模板（周一、三、五），when 周一生成，then 生成任务；when 周二生成，then 不生成', async () => {
    // Given: 家长已创建并发布每周任务模板
    const planResult = await db.insert(taskPlans).values({
      id: `test-plan-2-4-weekly-${uniqueId}`,
      family_id: familyId,
      title: '每周运动',
      task_type: '运动',
      points: 10,
      rule: JSON.stringify({
        frequency: 'weekly',
        daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
        excludedDates: { dates: [], scope: 'permanent' }
      }),
      status: 'published',
      created_by: parentId,
    }).returning();

    const planId = planResult[0]!.id;

    await db.insert(taskPlanChildren).values({
      id: `test-tpc-2-4-weekly-${uniqueId}`,
      task_plan_id: planId,
      child_id: childId,
    });

    // When: 系统在周一生成任务
    const generator = new TaskGenerator();

    // Find next Monday (getDay() = 1)
    const now = new Date();
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() + daysUntilMonday);
    const mondayStr = monday.toISOString().split('T')[0];

    await generator.generateForDate(mondayStr);

    // Then: 周一应该生成任务
    const mondayTasks = await getTasksForChild(familyId, childId, mondayStr);
    expect(mondayTasks).toHaveLength(1);
    expect(mondayTasks[0]!.title).toBe('每周运动');

    // When: 系统在周二生成任务
    const tuesday = new Date(monday);
    tuesday.setDate(monday.getDate() + 1);
    const tuesdayStr = tuesday.toISOString().split('T')[0];

    await generator.generateForDate(tuesdayStr);

    // Then: 周二不应该生成任务
    const tuesdayTasks = await getTasksForChild(familyId, childId, tuesdayStr);
    expect(tuesdayTasks).toHaveLength(0);
  });

  it('given 已设置排除日期，when 生成任务时，then 排除日期不生成任务', async () => {
    // Given: 家长已创建每日任务模板并设置排除日期
    const today = new Date().toISOString().split('T')[0];

    const planResult = await db.insert(taskPlans).values({
      id: `test-plan-2-4-exclude-${uniqueId}`,
      family_id: familyId,
      title: '每日刷牙',
      task_type: '刷牙',
      points: 5,
      rule: JSON.stringify({
        frequency: 'daily',
        excludedDates: {
          dates: [today], // Exclude today
          scope: 'permanent'
        }
      }),
      status: 'published',
      created_by: parentId,
    }).returning();

    const planId = planResult[0]!.id;

    await db.insert(taskPlanChildren).values({
      id: `test-tpc-2-4-exclude-${uniqueId}`,
      task_plan_id: planId,
      child_id: childId,
    });

    // When: 系统生成今天的任务
    const generator = new TaskGenerator();
    await generator.generateForDate(today);

    // Then: 今天不应该生成任务（被排除）
    const childTasks = await getTasksForChild(familyId, childId, today);
    expect(childTasks).toHaveLength(0);
  });

  it('given 模板关联多个儿童，when 生成任务时，then 为每个儿童生成独立任务实例', async () => {
    // Given: 家庭有2个儿童，家长已发布任务模板
    const today = new Date().toISOString().split('T')[0];

    const planResult = await db.insert(taskPlans).values({
      id: `test-plan-2-4-multi-${uniqueId}`,
      family_id: familyId,
      title: '每日刷牙',
      task_type: '刷牙',
      points: 5,
      rule: JSON.stringify({
        frequency: 'daily',
        excludedDates: { dates: [], scope: 'permanent' }
      }),
      status: 'published',
      created_by: parentId,
    }).returning();

    const planId = planResult[0]!.id;

    // Assign both children
    await db.insert(taskPlanChildren).values([
      {
        id: `test-tpc-2-4-multi-1-${uniqueId}`,
        task_plan_id: planId,
        child_id: childId,
      },
      {
        id: `test-tpc-2-4-multi-2-${uniqueId}`,
        task_plan_id: planId,
        child_id: child2Id,
      },
    ]);

    // When: 系统生成今天的任务
    const generator = new TaskGenerator();
    await generator.generateForDate(today);

    // Then: 为每个儿童生成独立的任务实例
    const child1Tasks = await getTasksForChild(familyId, childId, today);
    const child2Tasks = await getTasksForChild(familyId, child2Id, today);

    expect(child1Tasks).toHaveLength(1);
    expect(child2Tasks).toHaveLength(1);

    // And: 两个任务实例完全独立
    expect(child1Tasks[0]!.id).not.toBe(child2Tasks[0]!.id);
    expect(child1Tasks[0]!.assigned_child_id).toBe(childId);
    expect(child2Tasks[0]!.assigned_child_id).toBe(child2Id);
  });

  it('given 任务已生成，when 再次生成同一天的任务，then 不重复生成（幂等性）', async () => {
    // Given: 家长已发布任务模板，任务已生成
    const today = new Date().toISOString().split('T')[0];

    const planResult = await db.insert(taskPlans).values({
      id: `test-plan-2-4-idempotent-${uniqueId}`,
      family_id: familyId,
      title: '每日刷牙',
      task_type: '刷牙',
      points: 5,
      rule: JSON.stringify({
        frequency: 'daily',
        excludedDates: { dates: [], scope: 'permanent' }
      }),
      status: 'published',
      created_by: parentId,
    }).returning();

    const planId = planResult[0]!.id;

    await db.insert(taskPlanChildren).values({
      id: `test-tpc-2-4-idempotent-${uniqueId}`,
      task_plan_id: planId,
      child_id: childId,
    });

    // First generation
    const generator1 = new TaskGenerator();
    await generator1.generateForDate(today);
    const tasksAfterFirst = await getTasksForChild(familyId, childId, today);
    expect(tasksAfterFirst).toHaveLength(1);
    const firstTaskId = tasksAfterFirst[0]!.id;

    // When: 再次生成同一天的任务
    const generator2 = new TaskGenerator();
    await generator2.generateForDate(today);

    // Then: 不重复生成任务
    const tasksAfterSecond = await getTasksForChild(familyId, childId, today);
    expect(tasksAfterSecond).toHaveLength(1);
    expect(tasksAfterSecond[0]!.id).toBe(firstTaskId);
  });

  it('given 工作日规则，when 周六周日生成，then 不生成任务', async () => {
    // Given: 家长已创建工作日任务模板
    const planResult = await db.insert(taskPlans).values({
      id: `test-plan-2-4-weekdays-${uniqueId}`,
      family_id: familyId,
      title: '工作日学习',
      task_type: '学习',
      points: 8,
      rule: JSON.stringify({
        frequency: 'weekdays',
        excludedDates: { dates: [], scope: 'permanent' }
      }),
      status: 'published',
      created_by: parentId,
    }).returning();

    const planId = planResult[0]!.id;

    await db.insert(taskPlanChildren).values({
      id: `test-tpc-2-4-weekdays-${uniqueId}`,
      task_plan_id: planId,
      child_id: childId,
    });

    // When: 系统在周六生成任务
    const generator = new TaskGenerator();
    const now = new Date();
    const daysUntilSaturday = (6 - now.getDay()) % 7 || 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);
    const saturdayStr = saturday.toISOString().split('T')[0];

    await generator.generateForDate(saturdayStr);

    // Then: 周六不应该生成任务
    const saturdayTasks = await getTasksForChild(familyId, childId, saturdayStr);
    expect(saturdayTasks).toHaveLength(0);
  });

  it('given 周末规则，when 周一周五生成，then 不生成任务', async () => {
    // Given: 家长已创建周末任务模板
    const planResult = await db.insert(taskPlans).values({
      id: `test-plan-2-4-weekends-${uniqueId}`,
      family_id: familyId,
      title: '周末大扫除',
      task_type: '家务',
      points: 15,
      rule: JSON.stringify({
        frequency: 'weekends',
        excludedDates: { dates: [], scope: 'permanent' }
      }),
      status: 'published',
      created_by: parentId,
    }).returning();

    const planId = planResult[0]!.id;

    await db.insert(taskPlanChildren).values({
      id: `test-tpc-2-4-weekends-${uniqueId}`,
      task_plan_id: planId,
      child_id: childId,
    });

    // When: 系统在周一生成任务
    const generator = new TaskGenerator();
    const now = new Date();
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() + daysUntilMonday);
    const mondayStr = monday.toISOString().split('T')[0];

    await generator.generateForDate(mondayStr);

    // Then: 周一不应该生成任务
    const mondayTasks = await getTasksForChild(familyId, childId, mondayStr);
    expect(mondayTasks).toHaveLength(0);
  });

  it('given 自定义间隔规则（每3天），when 按规则生成，then 每3天生成一次任务', async () => {
    // Given: 家长已创建自定义间隔任务模板
    const planResult = await db.insert(taskPlans).values({
      id: `test-plan-2-4-interval-${uniqueId}`,
      family_id: familyId,
      title: '每3天大扫除',
      task_type: '家务',
      points: 20,
      rule: JSON.stringify({
        frequency: 'interval',
        intervalDays: 3,
        excludedDates: { dates: [], scope: 'permanent' }
      }),
      status: 'published',
      created_by: parentId,
    }).returning();

    const planId = planResult[0]!.id;

    await db.insert(taskPlanChildren).values({
      id: `test-tpc-2-4-interval-${uniqueId}`,
      task_plan_id: planId,
      child_id: childId,
    });

    // When: 系统从开始日期生成任务
    const generator = new TaskGenerator();
    const startDate = new Date().toISOString().split('T')[0];

    await generator.generateForDate(startDate);

    // Then: 第0天应该生成任务
    const day0Tasks = await getTasksForChild(familyId, childId, startDate);
    expect(day0Tasks).toHaveLength(1);

    // And: 第1天不应该生成任务
    const day1 = new Date(startDate);
    day1.setDate(day1.getDate() + 1);
    const day1Str = day1.toISOString().split('T')[0];
    await generator.generateForDate(day1Str);
    const day1Tasks = await getTasksForChild(familyId, childId, day1Str);
    expect(day1Tasks).toHaveLength(0);

    // And: 第3天应该生成任务
    const day3 = new Date(startDate);
    day3.setDate(day3.getDate() + 3);
    const day3Str = day3.toISOString().split('T')[0];
    await generator.generateForDate(day3Str);
    const day3Tasks = await getTasksForChild(familyId, childId, day3Str);
    expect(day3Tasks).toHaveLength(1);
  });
});
