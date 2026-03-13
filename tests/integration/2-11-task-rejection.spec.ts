/**
 * Integration Tests: Story 2.11 - Parent Rejects Task Completion
 *
 * BDD Style Tests for task rejection API endpoints
 *
 * Source: Story 2.11 AC
 * - AC1: Given 孩子标记了任务完成，等待我审批
 *        When 我点击"驳回"按钮
 *        Then 系统显示驳回原因输入框（必填，最多200字）
 *        And 我可以选择预设原因或自定义输入
 *        And 驳回确认后：任务状态变回"待完成"、驳回原因显示在任务卡片上、孩子收到通知
 *        And 驳回操作记录到审计日志
 * - AC2: 驳回操作后，任务不发放积分且任务返回孩子"待完成"列表
 * - AC3: 驳回通知在3秒内推送到孩子设备（NFR4: 实时）
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import db from '@/lib/db';
import { users, tasks, families, sessions, pointBalances, notifications, auditLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// API base URL
const API_BASE = `http://localhost:${process.env.PORT || 3344}`;

// Test fixtures
async function createTestParent(overrides = {}) {
  const id = Bun.randomUUIDv7();
  const familyId = Bun.randomUUIDv7();

  // Create family
  await db.insert(families).values({
    id: familyId,
    primary_parent_id: id,
  });

  // Create parent user
  const hashedPassword = await Bun.password.hash('password123', 'bcrypt');

  await db.insert(users).values({
    id,
    phone: `138${Math.random().toString().slice(2, 10)}`,
    phone_hash: `hash${id}`,
    password_hash: hashedPassword,
    role: 'parent',
    family_id: familyId,
    name: 'Test Parent',
    is_suspended: false,
  });

  // Create session
  const sessionId = Bun.randomUUIDv7();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    user_id: id,
    token: `session_${id}`,
    device_id: `device_${id}`,
    device_type: 'mobile',
    last_activity_at: new Date(),
    expires_at: expiresAt,
    is_active: true,
  });

  return {
    id,
    familyId,
    session: `session_${id}`,
  };
}

async function createTestChild(familyId: string, overrides = {}) {
  const id = Bun.randomUUIDv7();
  const hashedPin = await Bun.password.hash('1234', 'bcrypt');

  await db.insert(users).values({
    id,
    phone: `138${Math.random().toString().slice(2, 10)}`,
    phone_hash: `hash${id}`,
    password_hash: hashedPin,
    role: 'child',
    family_id: familyId,
    name: 'Test Child',
    is_suspended: false,
  });

  // Create points balance
  await db.insert(pointBalances).values({
    id: Bun.randomUUIDv7(),
    child_id: id,
    balance: 0,
  });

  return id;
}

async function createCompletedTask(familyId: string, childId: string, overrides = {}) {
  const taskId = Bun.randomUUIDv7();

  await db.insert(tasks).values({
    id: taskId,
    family_id: familyId,
    assigned_child_id: childId,
    title: overrides.title || 'Test Task',
    task_type: overrides.task_type || '刷牙',
    points: overrides.points || 10,
    scheduled_date: new Date().toISOString().split('T')[0],
    status: 'completed',
    completed_at: new Date(),
    proof_image: overrides.proof_image || null,
  });

  return taskId;
}

async function cleanupTestData() {
  await db.delete(notifications);
  await db.delete(auditLogs);
  await db.delete(tasks);
  await db.delete(pointBalances);
  await db.delete(sessions);
  await db.delete(users);
  await db.delete(families);
}

describe('Story 2.11: Parent Rejects Task Completion', () => {
  let parent: Awaited<ReturnType<typeof createTestParent>>;
  let child: string;
  let task: string;

  beforeEach(async () => {
    await cleanupTestData();
    parent = await createTestParent();
    child = await createTestChild(parent.familyId);
    task = await createCompletedTask(parent.familyId, child);
  });

  describe('Task 1: Create task rejection API endpoint', () => {
    it('given 家长已登录且有等待审批的任务, when 家长点击驳回并填写原因, then 任务状态变回待完成且孩子收到驳回通知', async () => {
      // Given: 家长已登录且有等待审批的任务 (status: completed)
      const originalTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, task),
      });
      expect(originalTask?.status).toBe('completed');

      // When: 家长驳回任务并填写原因
      const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '任务没有完成' }),
      });

      // Then: 驳回成功
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task);
      expect(result.rejectionReason).toBe('任务没有完成');

      // Then: 任务状态变回"待完成" (pending)
      const rejectedTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, task),
      });
      expect(rejectedTask?.status).toBe('pending');
      expect(rejectedTask?.rejection_reason).toBe('任务没有完成');

      // And: 孩子收到通知
      const childNotifications = await db.query.notifications.findMany({
        where: eq(notifications.user_id, child),
      });
      expect(childNotifications).toHaveLength(1);
      expect(childNotifications[0].type).toBe('task_rejected');
      expect(childNotifications[0].title).toBe('任务被驳回');
      expect(childNotifications[0].message).toContain('任务没有完成');
    });

    it('given 家长已登录且有等待审批的任务, when 家长点击驳回但未填写原因, then 返回错误提示必须填写原因', async () => {
      // Given: 家长已登录且有等待审批的任务

      // When: 家长驳回任务但未填写原因
      const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '' }),
      });

      // Then: 驳回失败
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('原因');
    });

    it('given 家长已登录且有等待审批的任务, when 驳回原因超过200字符, then 返回错误提示原因过长', async () => {
      // Given: 家长已登录且有等待审批的任务

      // When: 驳回原因超过200字符
      const longReason = 'a'.repeat(201);
      const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: longReason }),
      });

      // Then: 驳回失败
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('200');
    });

    it('given 家长已登录且有等待审批的任务, when 家长选择预设原因, then 使用预设原因进行驳回', async () => {
      // Given: 家长已登录且有等待审批的任务

      // When: 家长选择预设原因"任务没有完成"
      const presetReasons = [
        '任务没有完成',
        '完成质量不达标',
        '时间不符合要求',
      ];

      for (const reason of presetReasons) {
        const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
          method: 'POST',
          headers: {
            'Cookie': `better-auth.session_token=${parent.session}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        });

        // Then: 驳回成功
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.success).toBe(true);
        expect(result.rejectionReason).toBe(reason);

        // Reset task for next iteration
        await db.update(tasks).set({ status: 'completed' }).where(eq(tasks.id, task));
      }
    });

    it('given 家长已登录, when 驳回不存在的任务, then 返回404错误', async () => {
      // Given: 家长已登录
      const nonExistentTaskId = Bun.randomUUIDv7();

      // When: 驳回不存在的任务
      const response = await fetch(`${API_BASE}/api/tasks/${nonExistentTaskId}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '测试驳回' }),
      });

      // Then: 返回404错误
      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error).toContain('任务不存在');
    });

    it('given 家长已登录, when 驳回其他家庭的任务, then 返回403权限错误', async () => {
      // Given: 创建其他家庭的任务
      const otherFamily = await createTestParent();
      const otherChild = await createTestChild(otherFamily.familyId);
      const otherTask = await createCompletedTask(otherFamily.familyId, otherChild);

      // When: 尝试驳回其他家庭的任务
      const response = await fetch(`${API_BASE}/api/tasks/${otherTask}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '测试驳回' }),
      });

      // Then: 返回403权限错误
      expect(response.status).toBe(403);
      const result = await response.json();
      expect(result.error).toContain('无权');
    });
  });

  describe('Task 2: Rejection prevents point award (AC2)', () => {
    it('given 家长已登录且有等待审批的任务, when 驳回任务, then 任务不发放积分且任务返回孩子待完成列表', async () => {
      // Given: 家长已登录且有等待审批的任务

      // When: 驳回任务
      const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '质量不达标' }),
      });

      // Then: 驳回成功
      expect(response.status).toBe(200);

      // And: 孩子积分没有变化 (AC2: 驳回操作后，任务不发放积分)
      const balance = await db.query.pointBalances.findFirst({
        where: eq(pointBalances.child_id, child),
      });
      expect(balance?.balance).toBe(0);

      // And: 任务返回孩子"待完成"列表 (status: pending)
      const rejectedTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, task),
      });
      expect(rejectedTask?.status).toBe('pending');
    });
  });

  describe('Task 3: Rejection notification delivery (AC3)', () => {
    it('given 家长已登录且有等待审批的任务, when 驳回任务, then 孩子收到驳回通知', async () => {
      // Given: 家长已登录且有等待审批的任务

      // When: 驳回任务
      const startTime = Date.now();
      const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '时间不符合要求' }),
      });
      const endTime = Date.now();

      // Then: 驳回成功
      expect(response.status).toBe(200);

      // And: 孩子收到驳回通知
      const childNotifications = await db.query.notifications.findMany({
        where: eq(notifications.user_id, child),
      });
      expect(childNotifications).toHaveLength(1);
      expect(childNotifications[0].type).toBe('task_rejected');
      expect(childNotifications[0].title).toBe('任务被驳回');
      expect(childNotifications[0].message).toContain('时间不符合要求');

      // And: 通知在3秒内创建 (AC3: 驳回通知在3秒内推送到孩子设备)
      // Note: This is a basic timing check; in production, actual push delivery timing
      // would depend on the notification infrastructure
      expect(endTime - startTime).toBeLessThan(3000);
    });
  });

  describe('Task 4: Rejection audit logging (AC1)', () => {
    it('given 家长已登录且有等待审批的任务, when 驳回任务, then 驳回操作记录到审计日志', async () => {
      // Given: 家长已登录且有等待审批的任务

      // When: 驳回任务
      const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '测试驳回原因' }),
      });

      // Then: 驳回成功
      expect(response.status).toBe(200);

      // And: 驳回操作记录到审计日志 (AC1: 驳回操作记录到审计日志)
      const auditLogsList = await db.query.auditLogs.findMany({
        where: eq(auditLogs.user_id, parent.id),
      });
      const rejectLog = auditLogsList.find(log => log.action_type === 'reject_task');

      expect(rejectLog).toBeDefined();
      const metadata = JSON.parse(rejectLog!.metadata || '{}');
      expect(metadata.taskId).toBe(task);
      expect(metadata.reason).toBe('测试驳回原因');
    });
  });

  describe('Task 5: Integration with approval system (AC2)', () => {
    it('given 孩子有被驳回的任务, when 重新标记完成, then 家长可以再次审批', async () => {
      // Given: 孩子有被驳回的任务
      await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '重新完成' }),
      });

      // When: 孩子重新标记完成
      await db.update(tasks).set({ status: 'completed' }).where(eq(tasks.id, task));

      // Then: 家长可以再次审批 (任务仍在pending_approval/completed状态)
      const taskAfter = await db.query.tasks.findFirst({
        where: eq(tasks.id, task),
      });
      expect(taskAfter?.status).toBe('completed');
      expect(taskAfter?.rejection_reason).toBe('重新完成');
    });

    it('given 孩子有被驳回的任务, when 查询任务列表, then 驳回原因可见', async () => {
      // Given: 孩子有被驳回的任务
      const reason = '完成质量不达标';
      await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      // When: 查询任务列表
      const taskList = await db.query.tasks.findMany({
        where: eq(tasks.assigned_child_id, child),
      });

      // Then: 驳回原因可见在任务卡片上 (AC1: 驳回原因显示在任务卡片上)
      const rejectedTask = taskList.find(t => t.id === task);
      expect(rejectedTask?.rejection_reason).toBe(reason);
    });
  });

  describe('Error handling and edge cases', () => {
    it('given 未登录用户, when 尝试驳回任务, then 返回401未授权错误', async () => {
      // Given: 未登录用户

      // When: 尝试驳回任务
      const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '测试驳回' }),
      });

      // Then: 返回401错误
      expect(response.status).toBe(401);
    });

    it('given 孩子尝试驳回任务, when 发送驳回请求, then 返回403权限错误', async () => {
      // Given: 创建孩子用户和会话
      const childSessionId = Bun.randomUUIDv7();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.insert(sessions).values({
        id: childSessionId,
        user_id: child,
        token: `child_session_${child}`,
        device_id: `child_device_${child}`,
        device_type: 'tablet',
        last_activity_at: new Date(),
        expires_at: expiresAt,
        is_active: true,
      });

      // When: 孩子尝试驳回任务
      const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=child_session_${child}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '测试驳回' }),
      });

      // Then: 返回403权限错误
      expect(response.status).toBe(403);
      const result = await response.json();
      expect(result.error).toContain('家长');
    });

    it('given 任务状态为pending, when 尝试驳回, then 返回400状态错误', async () => {
      // Given: 创建pending状态的任务
      const pendingTaskId = Bun.randomUUIDv7();
      await db.insert(tasks).values({
        id: pendingTaskId,
        family_id: parent.familyId,
        assigned_child_id: child,
        title: 'Pending Task',
        task_type: '学习',
        points: 20,
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'pending',
      });

      // When: 尝试驳回pending任务
      const response = await fetch(`${API_BASE}/api/tasks/${pendingTaskId}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '测试驳回' }),
      });

      // Then: 返回400状态错误
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('状态');
    });

    it('given 驳回原因仅为空格, when 发送驳回请求, then 返回400错误', async () => {
      // Given: 家长已登录且有等待审批的任务

      // When: 驳回原因仅为空格
      const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '   ' }),
      });

      // Then: 返回400错误
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('原因');
    });
  });
});
