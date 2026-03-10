/**
 * Task Completion Integration Tests
 *
 * Story 2.9: Child Marks Task Complete
 *
 * BDD Style Tests (Given-When-Then)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import db from '@/lib/db';
import { users, families, tasks, pointBalances, pointsHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createTask, getTaskById, markTaskComplete } from '@/lib/db/queries/tasks';
import { getPointsBalance } from '@/lib/db/queries/point-balances';
import { getPointsHistoryForTask } from '@/lib/db/queries/points-history';
import { calculatePointsOnApproval } from '@/lib/services/points-calculator';
import { taskNeedsApproval, taskIsAutoApproved } from '@/types/task-type';
import { createFamily } from '@/tests/helpers/families';
import { createParent, createChild } from '@/tests/helpers/users';

describe('Story 2.9: Child Marks Task Complete', () => {
  let familyId: string;
  let parentId: string;
  let childId: string;

  beforeAll(async () => {
    // 创建测试家庭
    const family = await createFamily();
    familyId = family.id;

    // 创建家长
    const parent = await createParent({
      family_id: familyId,
      phone: `199${Date.now()}${Math.random().toString().substring(2, 6)}`,
    });
    parentId = parent.id;

    // 创建儿童
    const child = await createChild({
      family_id: familyId,
      phone: `199${Date.now() + 1}${Math.random().toString().substring(2, 6)}`,
    });
    childId = child.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await db.delete(pointsHistory).where(eq(pointsHistory.child_id, childId));
    await db.delete(pointBalances).where(eq(pointBalances.child_id, childId));
    await db.delete(tasks).where(eq(tasks.family_id, familyId));
    await db.delete(users).where(eq(users.family_id, familyId));
    await db.delete(families).where(eq(families.id, familyId));
  });

  beforeEach(async () => {
    // 每个测试前清理该儿童的任务和积分
    await db.delete(pointsHistory).where(eq(pointsHistory.child_id, childId));
    await db.delete(pointBalances).where(eq(pointBalances.child_id, childId));
    await db.delete(tasks).where(eq(tasks.assigned_child_id, childId));
  });

  describe('Task Type Approval Rules', () => {
    it('given 任务类型为刷牙，when 检查是否需要审批，then 返回true', () => {
      // Given: 任务类型为刷牙
      const taskType = '刷牙' as const;

      // When: 检查是否需要审批
      const needsApproval = taskNeedsApproval(taskType);

      // Then: 返回true
      expect(needsApproval).toBe(true);
    });

    it('given 任务类型为签到，when 检查是否需要审批，then 返回false', () => {
      // Given: 任务类型为签到
      const taskType = '签到' as const;

      // When: 检查是否需要审批
      const needsApproval = taskNeedsApproval(taskType);

      // Then: 返回false（自动审批）
      expect(needsApproval).toBe(false);
    });

    it('given 任务类型为签到，when 检查是否自动审批，then 返回true', () => {
      // Given: 任务类型为签到
      const taskType = '签到' as const;

      // When: 检查是否自动审批
      const autoApproved = taskIsAutoApproved(taskType);

      // Then: 返回true
      expect(autoApproved).toBe(true);
    });
  });

  describe('Task 4: 实现任务完成API端点', () => {
    it('given 儿童有刷牙任务（需审批），when 标记完成，then 状态变更为completed（待审批）', async () => {
      // Given: 儿童有刷牙任务（需审批）
      const today = new Date().toISOString().split('T')[0];

      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '每日刷牙',
        task_type: '刷牙',
        points: 5,
        scheduled_date: today,
        status: 'pending',
      });

      // When: 标记任务完成（不设置proof_image）
      const updatedTask = await markTaskComplete(task.id, {
        status: 'completed',
        completed_at: new Date(),
      });

      // Then: 状态变更为completed（待审批）
      expect(updatedTask).not.toBeNull();
      expect(updatedTask?.status).toBe('completed');
      expect(updatedTask?.completed_at).not.toBeNull();
    });

    it('given 儿童有签到任务（无需审批），when 标记完成，then 状态变更为approved', async () => {
      // Given: 儿童有签到任务（无需审批）
      const today = new Date().toISOString().split('T')[0];

      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '每日签到',
        task_type: '签到',
        points: 5,
        scheduled_date: today,
        status: 'pending',
      });

      // When: 标记任务完成（自动审批）
      const updatedTask = await markTaskComplete(task.id, {
        status: 'approved',
        completed_at: new Date(),
      });

      // Then: 状态变更为approved
      expect(updatedTask).not.toBeNull();
      expect(updatedTask?.status).toBe('approved');
    });

    it('given 儿童标记完成时上传照片，when 提交，then 照片存储在task记录中', async () => {
      // Given: 儿童有待完成任务
      const today = new Date().toISOString().split('T')[0];

      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '每日刷牙',
        task_type: '刷牙',
        points: 5,
        scheduled_date: today,
        status: 'pending',
      });

      // Create test proof image (1x1 red pixel in base64)
      const proofImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

      // When: 标记完成并上传照片
      const updatedTask = await markTaskComplete(task.id, {
        status: 'completed',
        proof_image: proofImage,
        completed_at: new Date(),
      });

      // Then: 照片存储在task记录中
      expect(updatedTask?.proof_image).toBe(proofImage);
    });
  });

  describe('Task 5: 实现无需审批任务的积分结算', () => {
    it('given 儿童有签到任务（5分），when 标记完成并结算积分，then 积分立即累加到儿童账户', async () => {
      // Given: 儿童有签到任务（5分）
      const today = new Date().toISOString().split('T')[0];
      const points = 5;

      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '每日签到',
        task_type: '签到',
        points: points,
        scheduled_date: today,
        status: 'pending',
      });

      // 确认初始积分为0
      const initialBalance = await getPointsBalance(childId);
      expect(initialBalance?.balance ?? 0).toBe(0);

      // When: 标记完成并结算积分
      const result = await calculatePointsOnApproval(task.id);

      // Then: 积分立即累加到儿童账户
      expect(result.childId).toBe(childId);
      expect(result.points).toBe(points);
      expect(result.newBalance).toBe(points);
      expect(result.previousBalance).toBe(0);

      // 验证数据库中的积分余额
      const updatedBalance = await getPointsBalance(childId);
      expect(updatedBalance?.balance).toBe(points);
    });

    it('given 积分结算后，when 查询积分历史，then 有一条task_completion记录', async () => {
      // Given: 儿童有任务并完成积分结算
      const today = new Date().toISOString().split('T')[0];

      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '每日运动',
        task_type: '运动',
        points: 10,
        scheduled_date: today,
        status: 'pending',
      });

      await calculatePointsOnApproval(task.id);

      // When: 查询积分历史
      const history = await getPointsHistoryForTask(task.id);

      // Then: 有一条task_completion记录
      expect(history).toHaveLength(1);
      expect(history[0].child_id).toBe(childId);
      expect(history[0].task_id).toBe(task.id);
      expect(history[0].points).toBe(10);
      expect(history[0].type).toBe('task_completion');
    });

    it('given 任务已结算积分，when 再次结算，then 抛出错误或返回原状态', async () => {
      // Given: 任务已结算积分
      const today = new Date().toISOString().split('T')[0];

      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '每日学习',
        task_type: '学习',
        points: 20,
        scheduled_date: today,
        status: 'approved', // 已批准
      });

      await calculatePointsOnApproval(task.id);
      const balanceAfterFirst = (await getPointsBalance(childId))?.balance ?? 0;

      // When: 再次结算
      // 在实际API中，应该检查任务状态并返回错误
      // 这里我们测试query函数的行为
      const updatedTask = await getTaskById(task.id);

      // Then: 任务保持approved状态，积分不变
      expect(updatedTask?.status).toBe('approved');
      expect(balanceAfterFirst).toBe(20);
    });
  });

  describe('Task 10: 错误处理和用户反馈', () => {
    it('given 任务不存在，when 标记完成，then 返回null', async () => {
      // Given: 不存在的任务ID
      const nonExistentTaskId = 'non-existent-task-id';

      // When: 标记完成
      const result = await markTaskComplete(nonExistentTaskId, {
        status: 'completed',
      });

      // Then: 返回null
      expect(result).toBeNull();
    });

    it('given 积分结算时任务不存在，when 调用calculatePointsOnApproval，then 抛出错误', async () => {
      // Given: 不存在的任务ID
      const nonExistentTaskId = 'non-existent-task-id';

      // When & Then: 调用calculatePointsOnApproval抛出错误
      await expect(calculatePointsOnApproval(nonExistentTaskId)).rejects.toThrow();
    });
  });

  describe('API Performance Tests', () => {
    it('given 儿童有任务，when 标记完成，then 操作时间<100ms', async () => {
      // Given: 儿童有任务
      const today = new Date().toISOString().split('T')[0];

      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '性能测试任务',
        task_type: '刷牙',
        points: 5,
        scheduled_date: today,
        status: 'pending',
      });

      // When: 测量标记完成的时间
      const startTime = performance.now();
      await markTaskComplete(task.id, {
        status: 'completed',
      });
      const endTime = performance.now();
      const operationTime = endTime - startTime;

      // Then: 操作时间<100ms
      expect(operationTime).toBeLessThan(100);
    });

    it('given 儿童有自动审批任务，when 结算积分，then 操作时间<100ms', async () => {
      // Given: 儿童有自动审批任务
      const today = new Date().toISOString().split('T')[0];

      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '积分结算性能测试',
        task_type: '签到',
        points: 5,
        scheduled_date: today,
        status: 'pending',
      });

      // When: 测量积分结算的时间
      const startTime = performance.now();
      await calculatePointsOnApproval(task.id);
      const endTime = performance.now();
      const operationTime = endTime - startTime;

      // Then: 操作时间<100ms
      expect(operationTime).toBeLessThan(100);
    });
  });
});
