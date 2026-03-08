/**
 * Task Plan Lifecycle Integration Tests
 *
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 *
 * BDD Format: Given-When-Then
 * Business language, no technical terms in test descriptions
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import db from '@/lib/db';
import { taskPlans, tasks, users, families } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  pauseTaskPlan,
  resumeTaskPlan,
  softDeleteTaskPlan,
  getActiveTaskPlans,
  getPublishedTaskPlansForGeneration,
  autoResumeExpiredPlans,
  createTaskPlan,
} from '@/lib/db/queries/task-plans';
import { createUser } from '@/lib/db/queries/users';

describe('Task Plan Lifecycle', () => {
  let testFamily: any;
  let testParent: any;
  let testTaskPlan: any;

  beforeEach(async () => {
    // Clean up test data
    await db.delete(tasks);
    await db.delete(taskPlans);
    await db.delete(users);
    await db.delete(families);

    // Create test family
    testFamily = await db.insert(families).values({
      id: Bun.randomUUIDv7(),
      primary_parent_id: 'test-parent',
    }).returning();

    testFamily = testFamily[0];

    // Create test parent
    testParent = await createUser('13800009999', 'parent');
    await db.update(users).set({ family_id: testFamily.id }).where(eq(users.id, testParent.id));

    // Create test task plan
    testTaskPlan = await createTaskPlan({
      family_id: testFamily.id,
      title: '测试任务计划',
      task_type: '刷牙',
      points: 10,
      rule: JSON.stringify({ frequency: 'daily', excludedDates: { dates: [], scope: 'permanent' } }),
      status: 'published',
      created_by: testParent.id,
    });
  });

  it('given 家长有已发布任务计划，when 暂停7天，then 模板状态变更为已暂停，7天后不生成任务', async () => {
    // Given: 家长已创建并发布任务计划
    const initialPlan = await db.query.taskPlans.findFirst({
      where: eq(taskPlans.id, testTaskPlan.id),
    });
    expect(initialPlan?.status).toBe('published');

    // When: 暂停7天
    const pausedPlan = await pauseTaskPlan(testTaskPlan.id, 7);

    // Then: 模板状态变更为已暂停
    expect(pausedPlan?.status).toBe('paused');

    // And: 设置paused_until时间戳
    const updatedPlan = await db.query.taskPlans.findFirst({
      where: eq(taskPlans.id, testTaskPlan.id),
    });
    expect(updatedPlan?.paused_until).not.toBeNull();

    const pausedUntil = new Date(updatedPlan!.paused_until!);
    const expectedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    expect(Math.abs(pausedUntil.getTime() - expectedDate.getTime())).toBeLessThan(1000);

    // And: 暂停期间不生成任务
    const publishedPlans = await getPublishedTaskPlansForGeneration();
    expect(publishedPlans.filter(p => p.id === testTaskPlan.id)).toHaveLength(0);
  });

  it('given 任务计划已暂停，when 恢复，then 模板状态立即变更为已发布', async () => {
    // Given: 任务计划已暂停
    await pauseTaskPlan(testTaskPlan.id, 7);
    const pausedPlan = await db.query.taskPlans.findFirst({
      where: eq(taskPlans.id, testTaskPlan.id),
    });
    expect(pausedPlan?.status).toBe('paused');

    // When: 恢复任务计划
    const resumedPlan = await resumeTaskPlan(testTaskPlan.id);

    // Then: 模板状态立即变更为已发布
    expect(resumedPlan?.status).toBe('published');

    // And: 清除paused_until时间戳
    const updatedPlan = await db.query.taskPlans.findFirst({
      where: eq(taskPlans.id, testTaskPlan.id),
    });
    expect(updatedPlan?.paused_until).toBeNull();

    // And: 可以再次生成任务
    const publishedPlans = await getPublishedTaskPlansForGeneration();
    expect(publishedPlans.filter(p => p.id === testTaskPlan.id)).toHaveLength(1);
  });

  it('given 任务计划已生成任务实例，when 删除，then 已生成的任务实例保留', async () => {
    // Given: 任务计划已生成任务实例
    const testChild = await createUser('13800009998', 'child');
    await db.update(users).set({ family_id: testFamily.id }).where(eq(users.id, testChild.id));

    const testTask = await db.insert(tasks).values({
      id: Bun.randomUUIDv7(),
      family_id: testFamily.id,
      task_plan_id: testTaskPlan.id,
      assigned_child_id: testChild.id,
      title: '测试任务',
      task_type: '刷牙',
      points: 10,
      scheduled_date: '2026-03-08',
      status: 'pending',
    }).returning();

    const tasksBefore = await db.query.tasks.findMany({
      where: eq(tasks.task_plan_id, testTaskPlan.id),
    });
    expect(tasksBefore).toHaveLength(1);

    // When: 删除任务计划（软删除）
    const deletedPlan = await softDeleteTaskPlan(testTaskPlan.id);

    // Then: 任务计划被软删除
    expect(deletedPlan?.deleted_at).not.toBeNull();

    // And: 已生成的任务实例保留
    const tasksAfter = await db.query.tasks.findMany({
      where: eq(tasks.task_plan_id, testTaskPlan.id),
    });
    expect(tasksAfter).toHaveLength(1);
    expect(tasksAfter[0].id).toBe(tasksBefore[0].id);
  });

  it('given 任务计划永久暂停，when 系统生成任务，then 不生成任务实例', async () => {
    // Given: 任务计划永久暂停
    await pauseTaskPlan(testTaskPlan.id, null);

    // When: 系统生成任务
    const publishedPlans = await getPublishedTaskPlansForGeneration();

    // Then: 不生成任务实例
    expect(publishedPlans.filter(p => p.id === testTaskPlan.id)).toHaveLength(0);
  });

  it('given 任务计划暂停，when 暂停时间到期，then 自动恢复并开始生成任务', async () => {
    // Given: 任务计划暂停（设置为过去的时间以便立即测试）
    const pastTime = new Date(Date.now() - 60 * 1000); // 1 minute ago
    await db.update(taskPlans)
      .set({
        status: 'paused',
        paused_until: pastTime,
      })
      .where(eq(taskPlans.id, testTaskPlan.id));

    // When: 自动恢复检查
    const resumedCount = await autoResumeExpiredPlans();

    // Then: 任务计划自动恢复
    expect(resumedCount).toBeGreaterThan(0);

    const updatedPlan = await db.query.taskPlans.findFirst({
      where: eq(taskPlans.id, testTaskPlan.id),
    });
    expect(updatedPlan?.status).toBe('published');
    expect(updatedPlan?.paused_until).toBeNull();
  });

  it('given 家长查询任务计划列表，when 包含已删除计划，then 不显示已删除计划', async () => {
    // Given: 有已发布和已删除的任务计划
    const deletedPlan = await createTaskPlan({
      family_id: testFamily.id,
      title: '要删除的任务计划',
      task_type: '学习',
      points: 20,
      rule: JSON.stringify({ frequency: 'daily', excludedDates: { dates: [], scope: 'permanent' } }),
      status: 'published',
      created_by: testParent.id,
    });

    await softDeleteTaskPlan(deletedPlan.id);

    // When: 查询活跃任务计划
    const activePlans = await getActiveTaskPlans(testFamily.id);

    // Then: 不显示已删除计划
    expect(activePlans.filter(p => p.id === deletedPlan.id)).toHaveLength(0);
    expect(activePlans.filter(p => p.id === testTaskPlan.id)).toHaveLength(1);
  });
});
