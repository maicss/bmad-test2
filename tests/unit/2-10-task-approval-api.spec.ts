/**
 * Unit Tests for Story 2.10: Task Approval Query Layer
 *
 * Tests the query layer functions directly without needing API routes
 * This validates the implementation logic is correct per RED LIST rules
 *
 * Source: Story 2.10 AC - API endpoints for single task approval/rejection
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import {
  createTask,
  getTaskById,
  approveTask,
  rejectTask,
  getPendingApprovalTasks,
} from '../../lib/db/queries/tasks';
import { createUser } from '../../lib/db/queries/users';
import { createFamily } from '../../lib/db/queries/families';
import db from '../../lib/db';
import { tasks, users, families } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';

// Test data storage for cleanup
const testRecords: { tasks: string[]; users: string[]; families: string[] } = {
  tasks: [],
  users: [],
  families: [],
};

describe('Story 2.10: Task Approval Query Layer - Unit Tests', () => {
  let parentUserId: string;
  let childUserId: string;
  let familyId: string;

  beforeAll(async () => {
    // Create test parent first (createFamily needs parent ID)
    const parent = await createUser('19999999001', 'parent', 'test123');
    parentUserId = parent.id;
    testRecords.users.push(parentUserId);

    // Create test family with parent as primary
    const family = await createFamily(parentUserId);
    familyId = family.id;
    testRecords.families.push(familyId);

    // Update parent with family_id
    await db.update(users)
      .set({ family_id: familyId })
      .where(eq(users.id, parentUserId));

    // Create test child with family
    const child = await createUser('19999999002', 'child', undefined, familyId);
    childUserId = child.id;
    testRecords.users.push(childUserId);
  });

  afterAll(async () => {
    // Cleanup test data in correct order (tasks -> users -> families)
    for (const taskId of testRecords.tasks) {
      await db.delete(tasks).where(eq(tasks.id, taskId));
    }
    for (const userId of testRecords.users) {
      await db.delete(users).where(eq(users.id, userId));
    }
    for (const familyId of testRecords.families) {
      await db.delete(families).where(eq(families.id, familyId));
    }
  });

  describe('approveTask query function', () => {
    it('given 存在已完成的任务, when 调用审批函数, then 任务状态变更为approved并记录审批人', async () => {
      // Given: 创建一个已完成的任务
      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childUserId,
        title: '测试任务',
        task_type: '学习',
        points: 10,
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'completed',
      });
      testRecords.tasks.push(task.id);

      // When: 家长审批任务
      const approvedTask = await approveTask(task.id, parentUserId);

      // Then: 任务状态变更为approved
      expect(approvedTask).not.toBeNull();
      expect(approvedTask?.status).toBe('approved');
      expect(approvedTask?.approved_by).toBe(parentUserId);
      expect(approvedTask?.approved_at).toBeInstanceOf(Date);
    });

    it('given 不存在的任务ID, when 调用审批函数, then 返回null', async () => {
      // When: 审批不存在的任务
      const result = await approveTask('non-existent-task-id', parentUserId);

      // Then: 返回null
      expect(result).toBeNull();
    });
  });

  describe('rejectTask query function', () => {
    it('given 存在已完成的任务, when 调用驳回函数, then 任务状态变更为rejected并记录驳回原因', async () => {
      // Given: 创建一个已完成的任务
      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childUserId,
        title: '测试驳回任务',
        task_type: '学习',
        points: 10,
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'completed',
      });
      testRecords.tasks.push(task.id);

      // When: 家长驳回任务
      const rejectionReason = '任务没有完成';
      const rejectedTask = await rejectTask(task.id, rejectionReason);

      // Then: 任务状态变更为rejected
      expect(rejectedTask).not.toBeNull();
      expect(rejectedTask?.status).toBe('rejected');
      expect(rejectedTask?.rejection_reason).toBe(rejectionReason);
    });

    it('given 不存在的任务ID, when 调用驳回函数, then 返回null', async () => {
      // When: 驳回不存在的任务
      const result = await rejectTask('non-existent-task-id', '测试原因');

      // Then: 返回null
      expect(result).toBeNull();
    });
  });

  describe('getPendingApprovalTasks query function', () => {
    it('given 家庭有待审批任务, when 查询待审批列表, then 返回所有completed状态的任务', async () => {
      // Given: 创建多个待审批任务
      const task1 = await createTask({
        family_id: familyId,
        assigned_child_id: childUserId,
        title: '待审批任务1',
        task_type: '学习',
        points: 5,
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'completed',
      });
      testRecords.tasks.push(task1.id);

      const task2 = await createTask({
        family_id: familyId,
        assigned_child_id: childUserId,
        title: '待审批任务2',
        task_type: '运动',
        points: 8,
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'completed',
      });
      testRecords.tasks.push(task2.id);

      // When: 查询待审批任务
      const pendingTasks = await getPendingApprovalTasks(familyId);

      // Then: 返回包含新创建的任务
      const taskIds = pendingTasks.map(t => t.id);
      expect(taskIds).toContain(task1.id);
      expect(taskIds).toContain(task2.id);
    });

    it('given 按孩子ID筛选, when 查询待审批列表, then 只返回该孩子的任务', async () => {
      // Given: 创建另一个孩子的任务
      const anotherChild = await createUser('19999999003', 'child', undefined, familyId);
      testRecords.users.push(anotherChild.id);

      const taskForAnotherChild = await createTask({
        family_id: familyId,
        assigned_child_id: anotherChild.id,
        title: '其他孩子的任务',
        task_type: '学习',
        points: 5,
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'completed',
      });
      testRecords.tasks.push(taskForAnotherChild.id);

      // When: 按原孩子ID查询
      const pendingTasks = await getPendingApprovalTasks(familyId, childUserId);

      // Then: 不包含其他孩子的任务
      const taskIds = pendingTasks.map(t => t.id);
      expect(taskIds).not.toContain(taskForAnotherChild.id);
    });
  });

  describe('getTaskById query function', () => {
    it('given 存在任务, when 按ID查询, then 返回任务详情', async () => {
      // Given: 创建任务
      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childUserId,
        title: '查询测试任务',
        task_type: '学习',
        points: 15,
        scheduled_date: new Date().toISOString().split('T')[0],
      });
      testRecords.tasks.push(task.id);

      // When: 按ID查询
      const foundTask = await getTaskById(task.id);

      // Then: 返回正确任务
      expect(foundTask).not.toBeNull();
      expect(foundTask?.id).toBe(task.id);
      expect(foundTask?.title).toBe('查询测试任务');
    });

    it('given 不存在的任务ID, when 按ID查询, then 返回null', async () => {
      // When: 查询不存在的任务
      const foundTask = await getTaskById('non-existent-task-id');

      // Then: 返回null
      expect(foundTask).toBeNull();
    });
  });
});
