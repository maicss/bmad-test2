/**
 * Batch Approval Integration Tests
 *
 * Story 2.7: Parent Batch Approves Tasks
 * Task 9: 编写BDD测试
 *
 * BDD Format (Given-When-Then):
 * - Test batch approval functionality
 * - Test batch rejection functionality
 * - Test points calculation and settlement
 * - Test state management (Zustand)
 *
 * Source: Story 2.7 AC - 所有验收条件
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { batchApproveTasks, batchRejectTasks } from '../../lib/services/points-calculator';
import { getTaskById } from '../../lib/db/queries/tasks';
import { getPointsBalance } from '../../lib/db/queries/point-balances';
import { getPointsHistoryForChild } from '../../lib/db/queries/points-history';
import { createTask } from '../../lib/db/queries/tasks';
import { createFamily, createParent, createChild, cleanupTestData } from '../../lib/db/test-utils';

describe('Story 2.7: Batch Approval Integration Tests', () => {
  let familyId: string;
  let parentId: string;
  let childId: string;

  beforeEach(async () => {
    // Setup test family, parent, and child
    const family = await createFamily();
    familyId = family.id;

    const parent = await createParent({ familyId });
    parentId = parent.id;

    const child = await createChild({ familyId });
    childId = child.id;
  });

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestData(familyId);
  });

  describe('Task 9.2-9.3: 批量通过功能', () => {
    it('given 有3个待审批任务，when 批量通过，then 任务状态变更为已完成，积分累加到儿童账户', async () => {
      // Given: 家长已登录，有3个待审批任务
      const task1 = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '完成数学作业',
        task_type: '学习',
        points: 5,
        scheduled_date: '2026-03-09',
        status: 'completed',
      });

      const task2 = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '阅读30分钟',
        task_type: '学习',
        points: 10,
        scheduled_date: '2026-03-09',
        status: 'completed',
      });

      const task3 = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '整理房间',
        task_type: '家务',
        points: 15,
        scheduled_date: '2026-03-09',
        status: 'completed',
      });

      // When: 批量通过3个任务
      const result = await batchApproveTasks(
        [task1.id, task2.id, task3.id],
        parentId
      );

      // Then: 任务状态变更为已完成
      expect(result.success).toBe(true);
      expect(result.approvedCount).toBe(3);

      const updatedTask1 = await getTaskById(task1.id);
      const updatedTask2 = await getTaskById(task2.id);
      const updatedTask3 = await getTaskById(task3.id);

      expect(updatedTask1?.status).toBe('approved');
      expect(updatedTask2?.status).toBe('approved');
      expect(updatedTask3?.status).toBe('approved');

      // And: 积分立即累加到儿童账户（30分）
      const balance = await getPointsBalance(childId);
      expect(balance?.balance).toBe(30);

      // And: 总积分正确
      expect(result.totalPoints).toBe(30);
    });

    it('given 有不同儿童的任务，when 批量通过，then 积分分别累加到对应儿童账户', async () => {
      // Given: 有2个儿童和各自的任务
      const child2 = await createChild({ familyId });

      const task1 = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '儿童1的任务',
        task_type: '学习',
        points: 10,
        scheduled_date: '2026-03-09',
        status: 'completed',
      });

      const task2 = await createTask({
        family_id: familyId,
        assigned_child_id: child2.id,
        title: '儿童2的任务',
        task_type: '学习',
        points: 20,
        scheduled_date: '2026-03-09',
        status: 'completed',
      });

      // When: 批量通过2个任务
      const result = await batchApproveTasks(
        [task1.id, task2.id],
        parentId
      );

      // Then: 积分分别累加到对应儿童账户
      const balance1 = await getPointsBalance(childId);
      const balance2 = await getPointsBalance(child2.id);

      expect(balance1?.balance).toBe(10);
      expect(balance2?.balance).toBe(20);

      expect(result.totalPoints).toBe(30);
    });
  });

  describe('Task 9.4: 批量驳回功能', () => {
    it('given 有2个待审批任务，when 批量驳回，then 任务状态返回待完成，记录驳回原因', async () => {
      // Given: 家长已登录，有2个待审批任务
      const task1 = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '未完成的作业',
        task_type: '学习',
        points: 5,
        scheduled_date: '2026-03-09',
        status: 'completed',
      });

      const task2 = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '质量不高的家务',
        task_type: '家务',
        points: 10,
        scheduled_date: '2026-03-09',
        status: 'completed',
      });

      // When: 批量驳回2个任务
      const result = await batchRejectTasks(
        [task1.id, task2.id],
        '任务没有完成',
        parentId
      );

      // Then: 任务状态返回待完成
      expect(result.success).toBe(true);
      expect(result.rejectedCount).toBe(2);

      const updatedTask1 = await getTaskById(task1.id);
      const updatedTask2 = await getTaskById(task2.id);

      expect(updatedTask1?.status).toBe('pending');
      expect(updatedTask2?.status).toBe('pending');

      // And: 记录驳回原因
      expect(updatedTask1?.rejection_reason).toBe('任务没有完成');
      expect(updatedTask2?.rejection_reason).toBe('任务没有完成');

      // And: 积分不变（拒绝时不累加）
      const balance = await getPointsBalance(childId);
      expect(balance?.balance).toBe(0);
    });

    it('given 驳回原因超过200字符，when 批量驳回，then 返回错误', async () => {
      // Given: 有1个待审批任务
      const task1 = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '测试任务',
        task_type: '学习',
        points: 5,
        scheduled_date: '2026-03-09',
        status: 'completed',
      });

      // When: 批量驳回时原因超过200字符
      const longReason = 'a'.repeat(201);
      const result = await batchRejectTasks(
        [task1.id],
        longReason,
        parentId
      );

      // Then: 返回错误
      expect(result.success).toBe(false);
      expect(result.error).toContain('200');
    });

    it('given 驳回原因为空，when 批量驳回，then 返回错误', async () => {
      // Given: 有1个待审批任务
      const task1 = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '测试任务',
        task_type: '学习',
        points: 5,
        scheduled_date: '2026-03-09',
        status: 'completed',
      });

      // When: 批量驳回时原因为空
      const result = await batchRejectTasks(
        [task1.id],
        '',
        parentId
      );

      // Then: 返回错误
      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('Task 9.6: 积分累加和结算逻辑', () => {
    it('given 任务被通过，when 积分结算，then 创建积分历史记录', async () => {
      // Given: 有1个待审批任务
      const task1 = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '测试任务',
        task_type: '学习',
        points: 15,
        scheduled_date: '2026-03-09',
        status: 'completed',
      });

      // When: 通过任务
      const result = await batchApproveTasks([task1.id], parentId);

      // Then: 创建积分历史记录
      expect(result.success).toBe(true);

      const history = await getPointsHistoryForChild(childId);
      expect(history).toHaveLength(1);
      expect(history[0].task_id).toBe(task1.id);
      expect(history[0].points).toBe(15);
      expect(history[0].type).toBe('task_completion');
    });

    it('given 多个任务被通过，when 积分结算，then 所有任务的积分总和正确', async () => {
      // Given: 有3个不同积分的任务
      const tasks = await Promise.all([
        createTask({
          family_id: familyId,
          assigned_child_id: childId,
          title: '任务1',
          task_type: '学习',
          points: 5,
          scheduled_date: '2026-03-09',
          status: 'completed',
        }),
        createTask({
          family_id: familyId,
          assigned_child_id: childId,
          title: '任务2',
          task_type: '学习',
          points: 10,
          scheduled_date: '2026-03-09',
          status: 'completed',
        }),
        createTask({
          family_id: familyId,
          assigned_child_id: childId,
          title: '任务3',
          task_type: '学习',
          points: 15,
          scheduled_date: '2026-03-09',
          status: 'completed',
        }),
      ]);

      // When: 批量通过
      const result = await batchApproveTasks(
        tasks.map(t => t.id),
        parentId
      );

      // Then: 积分总和正确 (5 + 10 + 15 = 30)
      expect(result.totalPoints).toBe(30);

      const balance = await getPointsBalance(childId);
      expect(balance?.balance).toBe(30);
    });
  });

  describe('Task 9.7: 操作结果显示', () => {
    it('given 批量操作成功，when 查看结果，then 返回正确的操作统计', async () => {
      // Given: 有3个任务
      const tasks = await Promise.all([
        createTask({
          family_id: familyId,
          assigned_child_id: childId,
          title: '任务1',
          task_type: '学习',
          points: 5,
          scheduled_date: '2026-03-09',
          status: 'completed',
        }),
        createTask({
          family_id: familyId,
          assigned_child_id: childId,
          title: '任务2',
          task_type: '学习',
          points: 10,
          scheduled_date: '2026-03-09',
          status: 'completed',
        }),
        createTask({
          family_id: familyId,
          assigned_child_id: childId,
          title: '任务3',
          task_type: '学习',
          points: 15,
          scheduled_date: '2026-03-09',
          status: 'completed',
        }),
      ]);

      // When: 批量通过
      const approveResult = await batchApproveTasks(
        tasks.map(t => t.id),
        parentId
      );

      // Then: 返回正确的操作统计
      expect(approveResult.approvedCount).toBe(3);
      expect(approveResult.totalPoints).toBe(30);
    });
  });
});
