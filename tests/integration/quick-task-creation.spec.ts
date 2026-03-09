/**
 * Integration Tests for Quick Task Creation (Story 2.6)
 *
 * Story 2.6: Parent Uses Template to Quickly Create Task
 *
 * Source: Story 2.6 Task 7
 * Source: _bmad-output/project-context.md - BDD testing guidelines
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import request from 'supertest';
import { promises as fs } from 'fs';
import db from '@/lib/db';
import { users, taskPlans, tasks, families, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { createManualTask } from '@/lib/db/queries/tasks';
import { getFamilyChildren } from '@/lib/db/queries/users';
import { createTaskPlan } from '@/lib/db/queries/task-plans';

const TEST_DB_PATH = 'database/test-db.sqlite';

describe('Quick Task Creation - Story 2.6', () => {
  let testFamily: any;
  let testParent: any;
  let testChild1: any;
  let testChild2: any;
  let testTaskPlan: any;
  let sessionToken: string;

  beforeAll(async () => {
    // Clean up test database
    try {
      await fs.unlink(TEST_DB_PATH);
    } catch {}

    // Create test family
    const familyId = Bun.randomUUIDv7();
    const familyResult = await db.insert(families).values({
      id: familyId,
      primary_parent_id: null,
    }).returning() as any[];
    testFamily = familyResult[0];

    // Create test parent
    const parentId = Bun.randomUUIDv7();
    const phoneHash = await Bun.password.hash('13800000100', 'bcrypt');
    const passwordHash = await Bun.password.hash('1111', 'bcrypt');
    const parentResult = await db.insert(users).values({
      id: parentId,
      phone: '13800000100',
      phone_hash: phoneHash,
      password_hash: passwordHash,
      role: 'parent',
      family_id: familyId,
      name: '测试家长',
    }).returning() as any[];
    testParent = parentResult[0];

    // Create test children
    const child1Id = Bun.randomUUIDv7();
    const child1PinHash = await Bun.password.hash('1111', 'bcrypt');
    const child1Result = await db.insert(users).values({
      id: child1Id,
      phone: '13800000101',
      phone_hash: await Bun.password.hash('13800000101', 'bcrypt'),
      password_hash: child1PinHash,
      role: 'child',
      family_id: familyId,
      name: '测试儿童1',
    }).returning() as any[];
    testChild1 = child1Result[0];

    const child2Id = Bun.randomUUIDv7();
    const child2PinHash = await Bun.password.hash('2222', 'bcrypt');
    const child2Result = await db.insert(users).values({
      id: child2Id,
      phone: '13800000102',
      phone_hash: await Bun.password.hash('13800000102', 'bcrypt'),
      password_hash: child2PinHash,
      role: 'child',
      family_id: familyId,
      name: '测试儿童2',
    }).returning() as any[];
    testChild2 = child2Result[0];

    // Create test task plan (template)
    const taskPlanId = Bun.randomUUIDv7();
    const taskPlanResult = await db.insert(taskPlans).values({
      id: taskPlanId,
      family_id: familyId,
      title: '每日刷牙',
      task_type: '刷牙',
      points: 5,
      rule: JSON.stringify({ type: 'daily' }),
      status: 'published',
      created_by: parentId,
    }).returning() as any[];
    testTaskPlan = taskPlanResult[0];

    // Create session token for authentication
    const token = Bun.randomUUIDv7();
    sessionToken = token;
    const now = Math.floor(Date.now() / 1000);
    await db.insert(sessions).values({
      id: Bun.randomUUIDv7(),
      user_id: parentId,
      token,
      device_id: 'test-device',
      device_type: 'desktop',
      user_agent: 'test-agent',
      ip_address: '127.0.0.1',
      last_activity_at: new Date(now * 1000),
      expires_at: new Date((now + 3600) * 1000),
      is_active: true,
      remember_me: false,
      created_at: new Date(now * 1000),
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(tasks).where(eq(tasks.family_id, testFamily.id));
    await db.delete(taskPlans).where(eq(taskPlans.family_id, testFamily.id));
    await db.delete(sessions).where(eq(sessions.user_id, testParent.id));
    await db.delete(users).where(eq(users.family_id, testFamily.id));
    await db.delete(families).where(eq(families.id, testFamily.id));
  });

  beforeEach(async () => {
    // Clean up tasks before each test
    await db.delete(tasks).where(eq(tasks.family_id, testFamily.id));
  });

  describe('Task 7.1-7.3: Given 家长有已发布任务模板，when 获取模板列表，then 显示模板列表', () => {
    it('given 家长已登录并有已发布任务模板，when 调用获取模板列表API，then 返回该家长的模板', async () => {
      // Given: 家长已登录并有已发布任务模板
      const session = await getSessionByToken(sessionToken);
      expect(session).not.toBeNull();
      expect(session?.user_id).toBe(testParent.id);

      // When: 获取模板列表
      const response = await request('http://localhost:3000')
        .get('/api/task-plans/for-quick-create')
        .set('Cookie', `better-auth.session_token=${sessionToken}`);

      // Then: 返回该家长的模板
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.parentTemplates).toBeDefined();
      expect(response.body.parentTemplates.length).toBeGreaterThan(0);

      const template = response.body.parentTemplates.find((t: any) => t.id === testTaskPlan.id);
      expect(template).toBeDefined();
      expect(template.title).toBe('每日刷牙');
    });

    it('given 家长有多个已发布模板，when 搜索模板，then 返回匹配的模板', async () => {
      // Given: 家长有多个已发布模板
      const taskPlan2 = await createTaskPlan({
        family_id: testFamily.id,
        title: '每日学习',
        task_type: '学习',
        points: 10,
        rule: JSON.stringify({ type: 'daily' }),
        status: 'published',
        created_by: testParent.id,
      });

      // When: 搜索包含"刷牙"的模板
      const response = await request('http://localhost:3000')
        .get('/api/task-plans/for-quick-create?search=刷牙')
        .set('Cookie', `better-auth.session_token=${sessionToken}`);

      // Then: 只返回匹配的模板
      expect(response.status).toBe(200);
      expect(response.body.parentTemplates.length).toBe(1);
      expect(response.body.parentTemplates[0].title).toContain('刷牙');
    });
  });

  describe('Task 7.4-7.5: Given 家长选择模板并填写信息，when 创建手动任务，then 任务实例立即生成并标记为手动创建', () => {
    it('given 家长选择模板并修改任务名称和积分，when 创建手动任务，then 任务实例立即生成并使用修改后的值', async () => {
      // Given: 家长选择模板并修改信息
      const today = new Date().toISOString().split('T')[0];

      // When: 使用模板创建手动任务并修改值
      const response = await request('http://localhost:3000')
        .post('/api/tasks')
        .set('Cookie', `better-auth.session_token=${sessionToken}`)
        .send({
          task_plan_id: testTaskPlan.id,
          title: '临时刷牙任务', // 修改标题
          task_type: '刷牙',
          points: 10, // 修改积分（模板是5）
          scheduled_date: today,
          child_ids: [testChild1.id],
          notes: '这是手动创建的任务',
        });

      // Then: 任务实例立即生成
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.tasks).toHaveLength(1);

      const task = response.body.tasks[0];
      expect(task.title).toBe('临时刷牙任务'); // 使用修改后的标题
      expect(task.points).toBe(10); // 使用修改后的积分
      expect(task.is_manual).toBe(true); // 标记为手动创建
      expect(task.task_plan_id).toBeNull(); // 手动任务没有模板关联
      expect(task.notes).toBe('这是手动创建的任务');
    });

    it('given 家长为多个儿童创建任务，when 提交，then 为每个儿童生成独立任务', async () => {
      // Given: 家庭有2个儿童
      const children = await getFamilyChildren(testFamily.id);
      expect(children.length).toBe(2);

      const today = new Date().toISOString().split('T')[0];

      // When: 为2个儿童批量创建任务
      const response = await request('http://localhost:3000')
        .post('/api/tasks')
        .set('Cookie', `better-auth.session_token=${sessionToken}`)
        .send({
          title: '临时任务',
          task_type: '运动',
          points: 5,
          scheduled_date: today,
          child_ids: [testChild1.id, testChild2.id],
        });

      // Then: 为每个儿童生成独立任务
      expect(response.status).toBe(201);
      expect(response.body.tasks).toHaveLength(2);

      const task1 = response.body.tasks[0];
      const task2 = response.body.tasks[1];

      expect(task1.assigned_child_id).toBe(testChild1.id);
      expect(task2.assigned_child_id).toBe(testChild2.id);
      expect(task1.id).not.toBe(task2.id); // 两个任务实例完全独立

      // And: 都标记为手动创建
      expect(task1.is_manual).toBe(true);
      expect(task2.is_manual).toBe(true);
    });
  });

  describe('Task 7.6: Given 手动任务已创建，when 查询任务列表，then 可以通过is_manual字段筛选', () => {
    it('given 已创建手动任务和计划任务，when 筛选is_manual=true，then 只返回手动任务', async () => {
      // Given: 已创建手动任务和计划任务
      const today = new Date().toISOString().split('T')[0];

      // 创建手动任务
      await createManualTask({
        family_id: testFamily.id,
        title: '手动任务',
        task_type: '学习',
        points: 5,
        scheduled_date: today,
        child_ids: [testChild1.id],
        is_manual: true,
      });

      // 创建计划任务
      const scheduledTaskId = Bun.randomUUIDv7();
      await db.insert(tasks).values({
        id: scheduledTaskId,
        family_id: testFamily.id,
        task_plan_id: testTaskPlan.id,
        assigned_child_id: testChild1.id,
        title: '计划任务',
        task_type: '刷牙',
        points: 5,
        scheduled_date: today,
        status: 'pending',
        is_manual: false,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // When: 筛选is_manual=true的任务
      const response = await request('http://localhost:3000')
        .get(`/api/tasks?family_id=${testFamily.id}&child_id=${testChild1.id}&is_manual=true`)
        .set('Cookie', `better-auth.session_token=${sessionToken}`);

      // Then: 只返回手动任务
      expect(response.status).toBe(200);
      const taskList = response.body.tasks;
      expect(taskList.length).toBe(1);
      expect(taskList[0].is_manual).toBe(true);
      expect(taskList[0].title).toBe('手动任务');
    });
  });

  describe('Task 8: Error handling and validation', () => {
    it('given 家长尝试为不存在的儿童创建任务，when 提交，then 返回400错误', async () => {
      // Given: 家长尝试为不存在的儿童创建任务
      const today = new Date().toISOString().split('T')[0];

      // When: 提交请求
      const response = await request('http://localhost:3000')
        .post('/api/tasks')
        .set('Cookie', `better-auth.session_token=${sessionToken}`)
        .send({
          title: '测试任务',
          task_type: '学习',
          points: 5,
          scheduled_date: today,
          child_ids: ['non-existent-child-id'],
        });

      // Then: 返回400错误
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('儿童');
    });

    it('given 家长使用过去的日期创建任务，when 提交，then 返回400错误', async () => {
      // Given: 家长使用过去的日期
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDate = yesterday.toISOString().split('T')[0];

      // When: 提交请求
      const response = await request('http://localhost:3000')
        .post('/api/tasks')
        .set('Cookie', `better-auth.session_token=${sessionToken}`)
        .send({
          title: '测试任务',
          task_type: '学习',
          points: 5,
          scheduled_date: pastDate,
          child_ids: [testChild1.id],
        });

      // Then: 返回400错误
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('日期');
    });

    it('given 家长不选择任何儿童，when 提交，then 返回400错误', async () => {
      // Given: 家长不选择任何儿童
      const today = new Date().toISOString().split('T')[0];

      // When: 提交请求
      const response = await request('http://localhost:3000')
        .post('/api/tasks')
        .set('Cookie', `better-auth.session_token=${sessionToken}`)
        .send({
          title: '测试任务',
          task_type: '学习',
          points: 5,
          scheduled_date: today,
          child_ids: [],
        });

      // Then: 返回400错误
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('儿童');
    });
  });
});
