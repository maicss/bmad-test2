/**
 * Integration Tests for Task Plans Query Functions
 *
 * Story 2.1: Parent Creates Task Plan Template
 * Story 2.3: Parent Sets Task Date Rules
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import db from '@/lib/db';
import { taskPlans, tasks, taskPlanChildren, users, families } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  createTaskPlan,
  getTaskPlanById,
  getTaskPlanWithChildren,
  getTaskPlansByFamily,
  updateTaskPlan,
  pauseTaskPlan,
  resumeTaskPlan,
  deleteTaskPlan,
  addChildrenToTaskPlan,
  removeChildrenFromTaskPlan,
  getTaskPlanChildren,
  getPublishedTaskPlansForGeneration,
  getActiveTaskPlans,
  type CreateTaskPlanDTO,
} from '@/lib/db/queries/task-plans';

describe('Task Plans Query Integration Tests', () => {
  let testFamilyId: string;
  let testParentId: string;
  let testChildId1: string;
  let testChildId2: string;
  let uniqueId: string;

  beforeAll(async () => {
    uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    testFamilyId = `test-family-taskplans-${uniqueId}`;
    testParentId = `test-parent-taskplans-${uniqueId}`;
    testChildId1 = `test-child-taskplans-1-${uniqueId}`;
    testChildId2 = `test-child-taskplans-2-${uniqueId}`;

    await db.insert(families).values({
      id: testFamilyId,
      primary_parent_id: testParentId,
    });

    await db.insert(users).values([
      {
        id: testParentId,
        phone: `13800501${uniqueId.slice(-6)}`,
        phone_hash: `hash-parent-${uniqueId}`,
        role: 'parent',
        family_id: testFamilyId,
      },
      {
        id: testChildId1,
        phone: `13800511${uniqueId.slice(-6)}`,
        phone_hash: `hash-child1-${uniqueId}`,
        role: 'child',
        family_id: testFamilyId,
      },
      {
        id: testChildId2,
        phone: `13800512${uniqueId.slice(-6)}`,
        phone_hash: `hash-child2-${uniqueId}`,
        role: 'child',
        family_id: testFamilyId,
      },
    ]);
  });

  beforeEach(async () => {
    // Clean up task plans before each test
    await db.delete(taskPlanChildren).where(eq(taskPlanChildren.task_plan_id, `test-plan-${uniqueId}`));
    await db.delete(tasks).where(eq(tasks.family_id, testFamilyId));
    await db.delete(taskPlans).where(eq(taskPlans.family_id, testFamilyId));
  });

  afterAll(async () => {
    await db.delete(taskPlanChildren).where(eq(taskPlanChildren.task_plan_id, `test-plan-${uniqueId}`));
    await db.delete(tasks).where(eq(tasks.family_id, testFamilyId));
    await db.delete(taskPlans).where(eq(taskPlans.family_id, testFamilyId));
    await db.delete(users).where(eq(users.family_id, testFamilyId));
    await db.delete(families).where(eq(families.id, testFamilyId));
  });

  describe('Task Plan CRUD Operations', () => {
    describe('given 创建任务计划，when 提供完整数据，then 创建计划成功', () => {
      it('should create task plan successfully', async () => {
        // Given: 任务计划数据
        const planData: CreateTaskPlanDTO = {
          family_id: testFamilyId,
          title: '每日刷牙任务',
          task_type: '刷牙',
          points: 5,
          rule: JSON.stringify({ frequency: 'daily', excludedDates: { dates: [], scope: 'permanent' } }),
          excluded_dates: null,
          reminder_time: null,
          status: 'draft',
          created_by: testParentId,
          assigned_children: [testChildId1],
        };

        // When: 创建任务计划
        const taskPlan = await createTaskPlan(planData);

        // Then: 创建成功
        expect(taskPlan).toBeDefined();
        expect(taskPlan.id).toBeDefined();
        expect(taskPlan.title).toBe('每日刷牙任务');
        expect(taskPlan.task_type).toBe('刷牙');
        expect(taskPlan.points).toBe(5);
        expect(taskPlan.status).toBe('draft');
      });
    });

    describe('given 查询任务计划，when 使用ID查询，then 返回计划详情', () => {
      it('should get task plan by ID', async () => {
        // Given: 创建任务计划
        const planData: CreateTaskPlanDTO = {
          family_id: testFamilyId,
          title: '测试计划',
          task_type: '学习',
          points: 10,
          rule: JSON.stringify({ frequency: 'daily' }),
          status: 'published',
          created_by: testParentId,
        };
        const created = await createTaskPlan(planData);

        // When: 查询任务计划
        const taskPlan = await getTaskPlanById(created.id);

        // Then: 返回计划详情
        expect(taskPlan).toBeDefined();
        expect(taskPlan?.id).toBe(created.id);
        expect(taskPlan?.title).toBe('测试计划');
      });
    });

    describe('given 查询任务计划及关联儿童，when 使用ID查询，then 返回计划及儿童列表', () => {
      it('should get task plan with assigned children', async () => {
        // Given: 创建带关联儿童的任务计划
        const planData: CreateTaskPlanDTO = {
          family_id: testFamilyId,
          title: '多儿童任务',
          task_type: '运动',
          points: 15,
          rule: JSON.stringify({ frequency: 'weekly', daysOfWeek: [1, 3, 5] }),
          status: 'published',
          created_by: testParentId,
          assigned_children: [testChildId1, testChildId2],
        };
        const created = await createTaskPlan(planData);

        // When: 查询计划及儿童
        const taskPlan = await getTaskPlanWithChildren(created.id);

        // Then: 返回计划及儿童列表
        expect(taskPlan).toBeDefined();
        expect(taskPlan?.id).toBe(created.id);
        expect(taskPlan?.assigned_children).toBeDefined();
        expect(taskPlan?.assigned_children.length).toBe(2);
      });
    });

    describe('given 查询家庭任务计划，when 不指定状态，then 返回所有计划', () => {
      it('should get all task plans for family', async () => {
        // Given: 家庭有多个任务计划
        await createTaskPlan({
          family_id: testFamilyId,
          title: '计划1',
          task_type: '刷牙',
          points: 5,
          rule: JSON.stringify({ frequency: 'daily' }),
          status: 'draft',
          created_by: testParentId,
        });
        await createTaskPlan({
          family_id: testFamilyId,
          title: '计划2',
          task_type: '学习',
          points: 10,
          rule: JSON.stringify({ frequency: 'weekly' }),
          status: 'published',
          created_by: testParentId,
        });

        // When: 查询家庭任务计划
        const plans = await getTaskPlansByFamily(testFamilyId);

        // Then: 返回所有计划
        expect(plans.length).toBeGreaterThanOrEqual(2);
        expect(plans.every(p => p.family_id === testFamilyId)).toBe(true);
      });
    });

    describe('given 查询已发布计划，when 指定published状态，then 只返回已发布计划', () => {
      it('should get task plans by status', async () => {
        // Given: 家庭有不同状态的任务计划
        await createTaskPlan({
          family_id: testFamilyId,
          title: '草稿计划',
          task_type: '刷牙',
          points: 5,
          rule: JSON.stringify({ frequency: 'daily' }),
          status: 'draft',
          created_by: testParentId,
        });
        await createTaskPlan({
          family_id: testFamilyId,
          title: '已发布计划',
          task_type: '学习',
          points: 10,
          rule: JSON.stringify({ frequency: 'weekly' }),
          status: 'published',
          created_by: testParentId,
        });

        // When: 查询已发布计划
        const publishedPlans = await getTaskPlansByFamily(testFamilyId, 'published');

        // Then: 只返回已发布计划
        expect(publishedPlans.length).toBeGreaterThanOrEqual(1);
        expect(publishedPlans.every(p => p.status === 'published')).toBe(true);
      });
    });

    describe('given 更新任务计划，when 修改标题和积分，then 更新成功', () => {
      it('should update task plan', async () => {
        // Given: 创建任务计划
        const planData: CreateTaskPlanDTO = {
          family_id: testFamilyId,
          title: '原标题',
          task_type: '刷牙',
          points: 5,
          rule: JSON.stringify({ frequency: 'daily' }),
          status: 'draft',
          created_by: testParentId,
        };
        const created = await createTaskPlan(planData);

        // When: 更新任务计划
        const updated = await updateTaskPlan(created.id, {
          title: '新标题',
          points: 15,
        });

        // Then: 更新成功
        expect(updated).toBeDefined();
        expect(updated?.title).toBe('新标题');
        expect(updated?.points).toBe(15);
      });
    });

    describe('given 更新关联儿童，when 设置新的儿童列表，then 替换原有关联', () => {
      it('should update assigned children', async () => {
        // Given: 创建任务计划关联儿童1
        const planData: CreateTaskPlanDTO = {
          family_id: testFamilyId,
          title: '更新儿童测试',
          task_type: '运动',
          points: 10,
          rule: JSON.stringify({ frequency: 'daily' }),
          status: 'published',
          created_by: testParentId,
          assigned_children: [testChildId1],
        };
        const created = await createTaskPlan(planData);

        // When: 更新关联儿童为儿童2
        const updated = await updateTaskPlan(created.id, {
          assigned_children: [testChildId2],
        });

        // Then: 关联已更新
        const planWithChildren = await getTaskPlanWithChildren(created.id);
        expect(planWithChildren?.assigned_children.length).toBe(1);
        expect(planWithChildren?.assigned_children[0]?.id).toBe(testChildId2);
      });
    });
  });

  describe('Task Plan Status Management', () => {
    describe('given 暂停任务计划，when 调用暂停函数，then 状态变为paused', () => {
      it('should pause task plan', async () => {
        // Given: 已发布的任务计划
        const planData: CreateTaskPlanDTO = {
          family_id: testFamilyId,
          title: '要暂停的计划',
          task_type: '学习',
          points: 10,
          rule: JSON.stringify({ frequency: 'daily' }),
          status: 'published',
          created_by: testParentId,
        };
        const created = await createTaskPlan(planData);
        expect(created.status).toBe('published');

        // When: 暂停任务计划
        const paused = await pauseTaskPlan(created.id);

        // Then: 状态变为paused
        expect(paused).toBeDefined();
        expect(paused?.status).toBe('paused');
      });
    });

    describe('given 恢复暂停的计划，when 调用恢复函数，then 状态变为published', () => {
      it('should resume paused task plan', async () => {
        // Given: 暂停的任务计划
        const planData: CreateTaskPlanDTO = {
          family_id: testFamilyId,
          title: '要恢复的计划',
          task_type: '运动',
          points: 15,
          rule: JSON.stringify({ frequency: 'weekly' }),
          status: 'paused',
          created_by: testParentId,
        };
        const created = await createTaskPlan(planData);

        // When: 恢复任务计划
        const resumed = await resumeTaskPlan(created.id);

        // Then: 状态变为published
        expect(resumed).toBeDefined();
        expect(resumed?.status).toBe('published');
      });
    });

    describe('given 发布草稿计划，when 更新状态为published，then 状态变为published', () => {
      it('should publish draft task plan by updating status', async () => {
        // Given: 草稿状态的任务计划
        const planData: CreateTaskPlanDTO = {
          family_id: testFamilyId,
          title: '要发布的草稿',
          task_type: '家务',
          points: 20,
          rule: JSON.stringify({ frequency: 'weekends' }),
          status: 'draft',
          created_by: testParentId,
        };
        const created = await createTaskPlan(planData);

        // When: 发布任务计划（通过更新状态）
        const published = await updateTaskPlan(created.id, { status: 'published' });

        // Then: 状态变为published
        expect(published).toBeDefined();
        expect(published?.status).toBe('published');
      });
    });

    describe('given 获取已发布计划，when 查询活动计划，then 只返回未删除的计划', () => {
      it('should get active task plans', async () => {
        // Given: 家庭有多种状态的任务计划
        await createTaskPlan({
          family_id: testFamilyId,
          title: '暂停的计划',
          task_type: '刷牙',
          points: 5,
          rule: JSON.stringify({ frequency: 'daily' }),
          status: 'paused',
          created_by: testParentId,
        });
        await createTaskPlan({
          family_id: testFamilyId,
          title: '已发布计划',
          task_type: '学习',
          points: 10,
          rule: JSON.stringify({ frequency: 'weekly' }),
          status: 'published',
          created_by: testParentId,
        });

        // When: 获取活动计划（未删除的计划）
        const activePlans = await getActiveTaskPlans(testFamilyId);

        // Then: 返回所有未删除的计划
        expect(activePlans.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Task Plan Deletion', () => {
    describe('given 删除任务计划，when 调用删除函数，then 硬删除计划', () => {
      it('should hard delete task plan', async () => {
        // Given: 任务计划
        const planData: CreateTaskPlanDTO = {
          family_id: testFamilyId,
          title: '要删除的计划',
          task_type: '自定义',
          points: 10,
          rule: JSON.stringify({ frequency: 'daily' }),
          status: 'draft',
          created_by: testParentId,
        };
        const created = await createTaskPlan(planData);

        // When: 删除任务计划
        const deleted = await deleteTaskPlan(created.id);

        // Then: 计划被删除
        expect(deleted).toBe(true);

        // And: 数据库中不再存在该计划
        const deletedPlan = await getTaskPlanById(created.id);
        expect(deletedPlan).toBeNull();

        // 查询数据库确认记录已删除
        const rawPlan = await db.query.taskPlans.findFirst({
          where: eq(taskPlans.id, created.id),
        });
        expect(rawPlan).toBeUndefined();
      });
    });

    describe('given 查询计划列表，when 包含已删除计划，then 不返回已删除计划', () => {
      it('should not include deleted plans in family query', async () => {
        // Given: 家庭有正常和已删除的计划
        await createTaskPlan({
          family_id: testFamilyId,
          title: '正常计划',
          task_type: '刷牙',
          points: 5,
          rule: JSON.stringify({ frequency: 'daily' }),
          status: 'published',
          created_by: testParentId,
        });
        const toDelete = await createTaskPlan({
          family_id: testFamilyId,
          title: '要删除的计划',
          task_type: '学习',
          points: 10,
          rule: JSON.stringify({ frequency: 'weekly' }),
          status: 'published',
          created_by: testParentId,
        });
        await deleteTaskPlan(toDelete.id);

        // When: 查询家庭计划
        const plans = await getTaskPlansByFamily(testFamilyId);

        // Then: 不包含已删除的计划
        expect(plans.length).toBeGreaterThanOrEqual(1);
        expect(plans.every(p => p.id !== toDelete.id)).toBe(true);
      });
    });
  });

  describe('Task Plan Children Management', () => {
    describe('given 添加儿童到计划，when 调用添加函数，then 儿童被关联', () => {
      it('should add children to task plan', async () => {
        // Given: 任务计划
        const planData: CreateTaskPlanDTO = {
          family_id: testFamilyId,
          title: '添加儿童测试',
          task_type: '运动',
          points: 10,
          rule: JSON.stringify({ frequency: 'daily' }),
          status: 'published',
          created_by: testParentId,
        };
        const created = await createTaskPlan(planData);

        // When: 添加儿童
        await addChildrenToTaskPlan(created.id, [testChildId1, testChildId2]);

        // Then: 儿童被关联
        const children = await getTaskPlanChildren(created.id);
        expect(children.length).toBe(2);
      });
    });

    describe('given 移除计划儿童，when 调用移除函数，then 所有关联被删除', () => {
      it('should remove all children from task plan', async () => {
        // Given: 有关联儿童的任务计划
        const planData: CreateTaskPlanDTO = {
          family_id: testFamilyId,
          title: '移除儿童测试',
          task_type: '学习',
          points: 10,
          rule: JSON.stringify({ frequency: 'daily' }),
          status: 'published',
          created_by: testParentId,
          assigned_children: [testChildId1, testChildId2],
        };
        const created = await createTaskPlan(planData);
        expect((await getTaskPlanChildren(created.id)).length).toBe(2);

        // When: 移除所有儿童
        await removeChildrenFromTaskPlan(created.id);

        // Then: 所有关联被删除
        const children = await getTaskPlanChildren(created.id);
        expect(children.length).toBe(0);
      });
    });

    describe('given 查询计划儿童，when 获取关联儿童，then 返回儿童列表', () => {
      it('should get task plan children', async () => {
        // Given: 有关联儿童的任务计划
        const planData: CreateTaskPlanDTO = {
          family_id: testFamilyId,
          title: '查询儿童测试',
          task_type: '家务',
          points: 15,
          rule: JSON.stringify({ frequency: 'weekly' }),
          status: 'published',
          created_by: testParentId,
          assigned_children: [testChildId1],
        };
        const created = await createTaskPlan(planData);

        // When: 获取关联儿童
        const children = await getTaskPlanChildren(created.id);

        // Then: 返回儿童列表
        expect(children.length).toBe(1);
        expect(children[0]?.id).toBe(testChildId1);
      });
    });
  });
});
