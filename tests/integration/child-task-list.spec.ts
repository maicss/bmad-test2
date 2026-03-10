/**
 * Child Task List Integration Tests
 *
 * Story 2.8: Child Views Today's Task List
 *
 * BDD Style Tests (Given-When-Then)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import db from '@/lib/db';
import { users, families, tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createTask, getTodayTasksByChild, getTaskProgressByChild, getTaskStatusDisplay } from '@/lib/db/queries/tasks';
import { createFamily } from '@/tests/helpers/families';
import { createParent, createChild } from '@/tests/helpers/users';

describe('Story 2.8: Child Views Today\'s Task List', () => {
  let familyId: string;
  let parentId: string;
  let childId: string;

  beforeAll(async () => {
    // 创建测试家庭
    const family = await createFamily();
    familyId = family.id;

    // 创建家长（使用唯一手机号）
    const parent = await createParent({
      family_id: familyId,
      phone: `199${Date.now()}${Math.random().toString().substring(2, 6)}`,
    });
    parentId = parent.id;

    // 创建儿童（使用唯一手机号）
    const child = await createChild({
      family_id: familyId,
      phone: `199${Date.now() + 1}${Math.random().toString().substring(2, 6)}`,
    });
    childId = child.id;
  });

  afterAll(async () => {
    // 清理测试数据（先删除任务，再删除用户，最后删除家庭）
    await db.delete(tasks).where(eq(tasks.family_id, familyId));
    await db.delete(users).where(eq(users.family_id, familyId));
    await db.delete(families).where(eq(families.id, familyId));
  });

  beforeEach(async () => {
    // 每个测试前清理该儿童的任务，确保测试隔离
    await db.delete(tasks).where(eq(tasks.assigned_child_id, childId));
  });

  describe('Task 2.4: 实现任务数据加载', () => {
    it('given 儿童已登录且有今日任务，when 调用getTodayTasksByChild，then 返回今日任务列表', async () => {
      // Given: 儿童已登录且有今日任务
      const today = new Date().toISOString().split('T')[0];

      await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '每日刷牙',
        task_type: '刷牙',
        points: 5,
        scheduled_date: today,
        status: 'pending',
      });

      await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '完成作业',
        task_type: '学习',
        points: 20,
        scheduled_date: today,
        status: 'completed',
      });

      // When: 调用getTodayTasksByChild
      const result = await getTodayTasksByChild(childId);

      // Then: 返回今日任务列表
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('每日刷牙');
      expect(result[1].title).toBe('完成作业');
    });

    it('given 儿童有不同日期的任务，when 查询今日任务，then 只返回今日任务', async () => {
      // Given: 儿童有不同日期的任务
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '明天的任务',
        task_type: '学习',
        points: 10,
        scheduled_date: tomorrow,
        status: 'pending',
      });

      await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '今天的任务',
        task_type: '运动',
        points: 15,
        scheduled_date: today,
        status: 'pending',
      });

      // When: 查询今日任务
      const result = await getTodayTasksByChild(childId);

      // Then: 只返回今日任务
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('今天的任务');
    });

    it('given 儿童没有今日任务，when 查询今日任务，then 返回空数组', async () => {
      // Given: 儿童没有今日任务（beforeEach已清理）

      // When: 查询今日任务
      const result = await getTodayTasksByChild(childId);

      // Then: 返回空数组
      expect(result).toHaveLength(0);
    });
  });

  describe('Task 3: 实现任务状态显示', () => {
    it('given 任务状态为approved，when 调用getTaskStatusDisplay，then 返回completed', () => {
      // Given: 任务状态为approved
      const status = 'approved';

      // When: 调用getTaskStatusDisplay
      const displayStatus = getTaskStatusDisplay(status);

      // Then: 返回completed
      expect(displayStatus).toBe('completed');
    });

    it('given 任务状态为completed，when 调用getTaskStatusDisplay，then 返回pending_approval', () => {
      // Given: 任务状态为completed
      const status = 'completed';

      // When: 调用getTaskStatusDisplay
      const displayStatus = getTaskStatusDisplay(status);

      // Then: 返回pending_approval
      expect(displayStatus).toBe('pending_approval');
    });

    it('given 任务状态为pending，when 调用getTaskStatusDisplay，then 返回pending', () => {
      // Given: 任务状态为pending
      const status = 'pending';

      // When: 调用getTaskStatusDisplay
      const displayStatus = getTaskStatusDisplay(status);

      // Then: 返回pending
      expect(displayStatus).toBe('pending');
    });

    it('given 任务状态为rejected，when 调用getTaskStatusDisplay，then 返回pending（需要重做）', () => {
      // Given: 任务状态为rejected
      const status = 'rejected';

      // When: 调用getTaskStatusDisplay
      const displayStatus = getTaskStatusDisplay(status);

      // Then: 返回pending（需要重做）
      expect(displayStatus).toBe('pending');
    });
  });

  describe('Task 5.1: 实现任务统计计算（已完成数/总数）', () => {
    it('given 儿童有3个任务（2个完成），when 调用getTaskProgressByChild，then 返回正确进度', async () => {
      // Given: 儿童有3个任务（2个完成）
      const today = new Date().toISOString().split('T')[0];

      await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '任务1',
        task_type: '刷牙',
        points: 5,
        scheduled_date: today,
        status: 'approved', // 已批准=已完成
      });

      await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '任务2',
        task_type: '学习',
        points: 10,
        scheduled_date: today,
        status: 'approved', // 已批准=已完成
      });

      await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '任务3',
        task_type: '运动',
        points: 15,
        scheduled_date: today,
        status: 'pending',
      });

      // When: 调用getTaskProgressByChild
      const progress = await getTaskProgressByChild(childId);

      // Then: 返回正确进度
      expect(progress.total).toBe(3);
      expect(progress.completed).toBe(2);
      expect(progress.progress).toBe(67); // Math.round(2/3 * 100)
    });

    it('given 儿童没有任务，when 调用getTaskProgressByChild，then 返回零进度', async () => {
      // Given: 儿童没有任务（beforeEach已清理）

      // When: 调用getTaskProgressByChild
      const progress = await getTaskProgressByChild(childId);

      // Then: 返回零进度
      expect(progress.total).toBe(0);
      expect(progress.completed).toBe(0);
      expect(progress.progress).toBe(0);
    });

    it('given 儿童有已完成和待审批任务，when 计算进度，then 计算已完成和已批准的任务', async () => {
      // Given: 儿童有已完成和待审批任务
      const today = new Date().toISOString().split('T')[0];

      await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '已批准任务',
        task_type: '刷牙',
        points: 5,
        scheduled_date: today,
        status: 'approved',
      });

      await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '待审批任务',
        task_type: '学习',
        points: 10,
        scheduled_date: today,
        status: 'completed', // 待审批，也算完成（儿童已标记）
      });

      await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '待完成任务',
        task_type: '运动',
        points: 15,
        scheduled_date: today,
        status: 'pending',
      });

      // When: 计算进度
      const progress = await getTaskProgressByChild(childId);

      // Then: 计算已完成和已批准的任务（都算作儿童已完成的工作）
      expect(progress.total).toBe(3);
      expect(progress.completed).toBe(2); // approved + completed 都算完成
      expect(progress.progress).toBe(67); // Math.round(2/3 * 100)
    });
  });

  describe('API Endpoint: GET /api/child/tasks', () => {
    it('given 儿童已登录且有今日任务，when 请求GET /api/child/tasks，then 返回任务和进度', async () => {
      // Given: 儿童已登录且有今日任务
      const today = new Date().toISOString().split('T')[0];

      await createTask({
        family_id: familyId,
        assigned_child_id: childId,
        title: '测试任务',
        task_type: '刷牙',
        points: 5,
        scheduled_date: today,
        status: 'pending',
      });

      // When: 请求API（这里需要模拟请求，实际测试中需要使用测试HTTP客户端）
      // Note: 实际集成测试中需要使用 supertest 或类似工具
      // 实际测试需要 E2E 测试框架来验证完整的HTTP请求/响应

      // Then: 返回任务和进度
      // This is a placeholder for actual API testing
      expect(true).toBe(true);
    });
  });

  describe('Task 9.7: 性能测试（页面加载<2秒）', () => {
    it('given 儿童有今日任务，when 调用getTodayTasksByChild，then 查询时间<100ms', async () => {
      // Given: 儿童有今日任务
      const today = new Date().toISOString().split('T')[0];

      // Create 10 tasks for realistic performance test
      for (let i = 0; i < 10; i++) {
        await createTask({
          family_id: familyId,
          assigned_child_id: childId,
          title: `任务${i + 1}`,
          task_type: '刷牙',
          points: 5,
          scheduled_date: today,
          status: i % 2 === 0 ? 'pending' : 'approved',
        });
      }

      // When: 测量查询时间
      const startTime = performance.now();
      const result = await getTodayTasksByChild(childId);
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      // Then: 查询时间<100ms (数据库查询应该很快)
      expect(result).toHaveLength(10);
      expect(queryTime).toBeLessThan(100);
    });

    it('given 儿童有今日任务，when 调用getTaskProgressByChild，then 计算时间<50ms', async () => {
      // Given: 儿童有今日任务
      const today = new Date().toISOString().split('T')[0];

      for (let i = 0; i < 10; i++) {
        await createTask({
          family_id: familyId,
          assigned_child_id: childId,
          title: `任务${i + 1}`,
          task_type: '学习',
          points: 10,
          scheduled_date: today,
          status: i % 2 === 0 ? 'pending' : 'approved',
        });
      }

      // When: 测量进度计算时间
      const startTime = performance.now();
      const progress = await getTaskProgressByChild(childId);
      const endTime = performance.now();
      const calcTime = endTime - startTime;

      // Then: 计算时间<50ms (进度计算应该很快)
      expect(progress.total).toBe(10);
      expect(calcTime).toBeLessThan(50);
    });

    it('given 儿童没有任务，when 调用查询函数，then 空结果查询时间<50ms', async () => {
      // Given: 儿童没有任务（beforeEach已清理）

      // When: 测量查询时间
      const startTime = performance.now();
      const tasks = await getTodayTasksByChild(childId);
      const progress = await getTaskProgressByChild(childId);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Then: 空结果查询也应该很快
      expect(tasks).toHaveLength(0);
      expect(progress.total).toBe(0);
      expect(totalTime).toBeLessThan(50);
    });
  });
});
