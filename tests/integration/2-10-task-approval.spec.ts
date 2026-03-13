/**
 * Integration Tests: Story 2.10 - Parent Approves Task Completion
 *
 * BDD Style Tests for task approval API endpoints
 *
 * NOTE: These HTTP integration tests require a running dev server and may have
 * database isolation issues with SQLite. The core functionality is tested in:
 * - tests/unit/2-10-task-approval-api.spec.ts (query layer tests)
 * - tests/integration/2-10-direct-function-test.spec.ts (business logic tests)
 *
 * For full end-to-end testing, use the E2E tests in tests/e2e/
 *
 * Source: Story 2.10 AC
 * - AC1: 家长审批任务时显示任务详情
 * - AC2: 家长可选择通过或驳回任务
 * - AC3: 审批操作记录到审计日志
 * - AC4: 审批通过后积分变动通知立即推送给孩子
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import db from '@/lib/db';
import { users, tasks, families, sessions, pointBalances } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// API base URL - use PORT from env or default to 3344
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
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

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
    status: 'completed', // Child marked as completed, waiting for approval
    completed_at: new Date(),
    proof_image: overrides.proof_image || null,
  });

  return taskId;
}

async function cleanupTestData() {
  await db.delete(tasks);
  await db.delete(pointBalances);
  await db.delete(sessions);
  await db.delete(users);
  await db.delete(families);
}

describe('Story 2.10: Parent Approves Task Completion', () => {
  let parent: Awaited<ReturnType<typeof createTestParent>>;
  let child: string;
  let task: string;

  beforeEach(async () => {
    await cleanupTestData();
    parent = await createTestParent();
    child = await createTestChild(parent.familyId);
    task = await createCompletedTask(parent.familyId, child);
  });

  describe('Task 1: Single Task Approval API', () => {
    it('given 家长已登录且有等待审批的任务, when 家长点击通过单个任务, then 任务状态变更为approved且积分累加到孩子账户', async () => {
      // Given: 家长已登录且有任务
      // (由 beforeEach setup 完成)

      // When: 家长审批通过单个任务
      const url = `${API_BASE}/api/tasks/${task}/approve`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Then: 审批成功
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task);
      expect(result.pointsAdded).toBe(10);

      // Then: 任务状态已更新为approved
      const approvedTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, task),
      });
      expect(approvedTask?.status).toBe('approved');
      expect(approvedTask?.approved_by).toBe(parent.id);
      expect(approvedTask?.approved_at).not.toBeNull();

      // Then: 积分已累加到孩子账户
      const balance = await db.query.pointBalances.findFirst({
        where: eq(pointBalances.child_id, child),
      });
      expect(balance?.balance).toBe(10);
    });

    it('given 家长已登录, when 审批不存在的任务, then 返回404错误', async () => {
      // Given: 家长已登录
      const nonExistentTaskId = Bun.randomUUIDv7();

      // When: 审批不存在的任务
      const response = await fetch(`${API_BASE}/api/tasks/${nonExistentTaskId}/approve`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Then: 返回404错误
      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error).toContain('任务不存在');
    });

    it('given 家长已登录, when 审批其他家庭的任务, then 返回403权限错误', async () => {
      // Given: 创建其他家庭的任务
      const otherFamily = await createTestParent();
      const otherChild = await createTestChild(otherFamily.familyId);
      const otherTask = await createCompletedTask(otherFamily.familyId, otherChild);

      // When: 尝试审批其他家庭的任务
      const response = await fetch(`${API_BASE}/api/tasks/${otherTask}/approve`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Then: 返回403权限错误
      expect(response.status).toBe(403);
      const result = await response.json();
      expect(result.error).toContain('无权');
    });

    it('given 孩子尝试审批任务, when 发送审批请求, then 返回403权限错误', async () => {
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

      // When: 孩子尝试审批任务
      const response = await fetch(`${API_BASE}/api/tasks/${task}/approve`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=child_session_${child}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Then: 返回403权限错误
      expect(response.status).toBe(403);
      const result = await response.json();
      expect(result.error).toContain('家长');
    });

    it('given 任务状态为pending, when 尝试审批, then 返回400状态错误', async () => {
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

      // When: 尝试审批pending任务
      const response = await fetch(`${API_BASE}/api/tasks/${pendingTaskId}/approve`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Then: 返回400状态错误
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('状态');
    });

    it('given 未登录用户, when 尝试审批任务, then 返回401未授权错误', async () => {
      // Given: 无session cookie

      // When: 未登录用户尝试审批
      const response = await fetch(`${API_BASE}/api/tasks/${task}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Then: 返回401错误
      expect(response.status).toBe(401);
    });
  });

  describe('Task 2: Single Task Rejection API', () => {
    it('given 家长已登录且有等待审批的任务, when 家长填写驳回原因并点击驳回, then 任务状态返回pending且记录驳回原因', async () => {
      // Given: 家长已登录且有completed状态的任务

      // When: 填写驳回原因后驳回任务
      const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '任务没有完成好' }),
      });

      // Then: 驳回成功
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task);

      // Then: 任务状态返回pending
      const rejectedTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, task),
      });
      expect(rejectedTask?.status).toBe('pending');
      expect(rejectedTask?.rejection_reason).toBe('任务没有完成好');

      // Then: 积分没有变化
      const balance = await db.query.pointBalances.findFirst({
        where: eq(pointBalances.child_id, child),
      });
      expect(balance?.balance).toBe(0);
    });

    it('given 家长已登录, when 驳回时未填写原因, then 返回400错误要求填写原因', async () => {
      // Given: 家长已登录

      // When: 驳回时未填写原因
      const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: '' }),
      });

      // Then: 返回400错误
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('原因');
    });

    it('given 家长已登录, when 驳回原因超过200字符, then 返回400错误', async () => {
      // Given: 家长已登录
      const longReason = 'a'.repeat(201);

      // When: 驳回原因过长
      const response = await fetch(`${API_BASE}/api/tasks/${task}/reject`, {
        method: 'POST',
        headers: {
          'Cookie': `better-auth.session_token=${parent.session}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: longReason }),
      });

      // Then: 返回400错误
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('200');
    });
  });
});
