/**
 * Direct function test for Story 2.10
 * Tests the route handler logic directly without HTTP
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { approveTask, rejectTask, getTaskById, createTask } from '@/lib/db/queries/tasks';
import { createUser } from '@/lib/db/queries/users';
import { createFamily } from '@/lib/db/queries/families';
import db from '@/lib/db';
import { tasks, users, families } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const testRecords: { tasks: string[]; users: string[]; families: string[] } = {
  tasks: [],
  users: [],
  families: [],
};

describe('Story 2.10: Direct Function Tests (Story 2.10 Core Logic)', () => {
  let parentUserId: string;
  let childUserId: string;
  let familyId: string;

  beforeAll(async () => {
    // Create test data
    const parent = await createUser('19999999991', 'parent', 'test123');
    parentUserId = parent.id;
    testRecords.users.push(parentUserId);

    const family = await createFamily(parentUserId);
    familyId = family.id;
    testRecords.families.push(familyId);

    // Update parent with family_id
    await db.update(users)
      .set({ family_id: familyId })
      .where(eq(users.id, parentUserId));

    const child = await createUser('19999999992', 'child', undefined, familyId);
    childUserId = child.id;
    testRecords.users.push(childUserId);
  });

  afterAll(async () => {
    // Cleanup
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

  describe('Core Query Functions', () => {
    it('given 存在等待审批的任务, when 调用审批函数, then 任务状态变更为completed且记录审批人', async () => {
      // CODE REVIEW FIX: Updated test to reflect correct status flow
      // Schema defines: pending -> pending_approval (child marked) -> completed (parent approved)
      // Given: 创建等待审批的任务 (使用pending_approval状态)
      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childUserId,
        title: '测试任务',
        task_type: '学习',
        points: 10,
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'pending_approval', // Child marked complete, waiting parent approval
      });
      testRecords.tasks.push(task.id);

      // When: 审批任务
      const result = await approveTask(task.id, parentUserId);

      // Then: 任务状态为completed (parent approved)
      expect(result).not.toBeNull();
      expect(result?.status).toBe('completed');
      expect(result?.approved_by).toBe(parentUserId);
    });

    it('given 存在等待审批的任务, when 调用驳回函数, then 任务状态返回pending且记录驳回原因', async () => {
      // CODE REVIEW FIX: Updated test to reflect correct rejection behavior
      // Story 2.11: Rejection returns task to 'pending' so child can retry
      // Given: 创建等待审批的任务
      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childUserId,
        title: '测试驳回',
        task_type: '学习',
        points: 10,
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'pending_approval',
      });
      testRecords.tasks.push(task.id);

      // When: 驳回任务
      const result = await rejectTask(task.id, '测试驳回原因');

      // Then: 任务状态返回pending (to-do, child can retry)
      expect(result).not.toBeNull();
      expect(result?.status).toBe('pending');
      expect(result?.rejection_reason).toBe('测试驳回原因');
      // CODE REVIEW FIX CRITICAL-2: Approval fields should be cleared on rejection
      expect(result?.approved_by).toBeNull();
      expect(result?.approved_at).toBeNull();
    });

    it('given 存在任务, when 按ID查询, then 返回任务详情', async () => {
      // Given: 创建任务
      const task = await createTask({
        family_id: familyId,
        assigned_child_id: childUserId,
        title: '查询测试',
        task_type: '运动',
        points: 15,
        scheduled_date: new Date().toISOString().split('T')[0],
      });
      testRecords.tasks.push(task.id);

      // When: 查询任务
      const found = await getTaskById(task.id);

      // Then: 返回正确任务
      expect(found).not.toBeNull();
      expect(found?.id).toBe(task.id);
      expect(found?.title).toBe('查询测试');
    });
  });
});
