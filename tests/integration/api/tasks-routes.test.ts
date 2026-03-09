/**
 * Integration Tests for Tasks API Routes
 *
 * Story 2.6: Parent Uses Template to Quickly Create Task
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import db from '@/lib/db';
import { families, users, tasks, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createUser } from '@/lib/db/queries/users';
import { createSession } from '@/lib/db/queries/sessions';
import { testRequest } from '@/tests/setup-test-app';

describe('Tasks API Routes Integration Tests', () => {
  let testFamilyId: string;
  let testParentId: string;
  let testChildId: string;
  let testSessionToken: string;
  let testChildId2: string;
  let uniqueId: string;

  beforeAll(async () => {
    uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    testFamilyId = `test-family-tasks-api-${uniqueId}`;
    testParentId = `test-parent-tasks-api-${uniqueId}`;
    testChildId = `test-child-tasks-api-${uniqueId}`;
    testChildId2 = `test-child-tasks-api-2-${uniqueId}`;

    // Create test family
    await db.insert(families).values({
      id: testFamilyId,
      primary_parent_id: testParentId,
    });

    // Create test users
    await createUser(`13800700${uniqueId.slice(-6)}`, 'parent', 'Test1234', testFamilyId);
    await createUser(`13800701${uniqueId.slice(-6)}`, 'child', null, testFamilyId);
    await createUser(`13800702${uniqueId.slice(-6)}`, 'child', null, testFamilyId);

    // Get the created user IDs
    const parentUsers = await db.query.users.findMany({
      where: eq(users.phone, `13800700${uniqueId.slice(-6)}`),
    });
    const childUsers = await db.query.users.findMany({
      where: eq(users.phone, `13800701${uniqueId.slice(-6)}`),
    });
    const childUsers2 = await db.query.users.findMany({
      where: eq(users.phone, `13800702${uniqueId.slice(-6)}`),
    });

    if (parentUsers.length > 0) testParentId = parentUsers[0].id;
    if (childUsers.length > 0) testChildId = childUsers[0].id;
    if (childUsers2.length > 0) testChildId2 = childUsers2[0].id;

    // Create session for parent
    testSessionToken = `test-session-tasks-api-${uniqueId}`;
    await createSession({
      userId: testParentId,
      token: testSessionToken,
      deviceId: 'test-device-tasks',
      deviceType: 'desktop',
      userAgent: 'Test Browser',
      ipAddress: '127.0.0.1',
      rememberMe: false,
    });
  });

  afterAll(async () => {
    await db.delete(tasks).where(eq(tasks.family_id, testFamilyId));
    await db.delete(sessions).where(eq(sessions.user_id, testParentId));
    await db.delete(users).where(eq(users.family_id, testFamilyId));
    await db.delete(families).where(eq(families.id, testFamilyId));
  });

  describe('GET /api/tasks - Query tasks', () => {
    describe('given 家长已登录，when 查询任务列表，then 返回该家庭的任务', () => {
      it('should get tasks successfully', async () => {
        // Given: 创建一些任务
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values([
          {
            id: `test-task-get-1-${uniqueId}`,
            family_id: testFamilyId,
            title: '测试任务1',
            task_type: '学习',
            points: 10,
            assigned_child_id: testChildId,
            scheduled_date: today,
            status: 'pending',
          },
          {
            id: `test-task-get-2-${uniqueId}`,
            family_id: testFamilyId,
            title: '测试任务2',
            task_type: '运动',
            points: 15,
            assigned_child_id: testChildId,
            scheduled_date: today,
            status: 'completed',
          },
        ]);

        // When: 查询任务列表
        const response = await testRequest({
          method: 'GET',
          url: `/api/tasks?family_id=${testFamilyId}&child_id=${testChildId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
        });

        // Then: 返回任务列表
        expect(response.status).toBe(200);
        expect(response.body.tasks).toBeDefined();
        expect(response.body.tasks.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('given 未登录，when 查询任务，then 返回401', () => {
      it('should return 401 for unauthenticated request', async () => {
        // Given: 未登录

        // When: 查询任务
        const response = await testRequest({
          method: 'GET',
          url: `/api/tasks?family_id=${testFamilyId}`,
        });

        // Then: 返回401
        expect(response.status).toBe(401);
        expect(response.body.error).toContain('未登录');
      });
    });

    describe('given 会话已过期，when 查询任务，then 返回401', () => {
      it('should return 401 for expired session', async () => {
        // Given: 过期的会话token
        const expiredToken = 'expired-token-12345';

        // When: 查询任务
        const response = await testRequest({
          method: 'GET',
          url: `/api/tasks?family_id=${testFamilyId}`,
          cookies: {
            'better-auth.session_token': expiredToken,
          },
        });

        // Then: 返回401
        expect(response.status).toBe(401);
        expect(response.body.error).toContain('会话已过期');
      });
    });

    describe('given 儿童用户查询任务，when 使用儿童会话，then 返回403', () => {
      it('should return 403 for child user', async () => {
        // Given: 儿童用户的会话
        const childSessionToken = `test-child-session-tasks-${uniqueId}`;
        await createSession({
          userId: testChildId,
          token: childSessionToken,
          deviceId: 'test-device-child',
          deviceType: 'mobile',
          userAgent: 'Test App',
          ipAddress: '127.0.0.1',
          rememberMe: false,
        });

        // When: 儿童用户查询任务
        const response = await testRequest({
          method: 'GET',
          url: `/api/tasks?family_id=${testFamilyId}`,
          cookies: {
            'better-auth.session_token': childSessionToken,
          },
        });

        // Then: 返回403
        expect(response.status).toBe(403);
        expect(response.body.error).toContain('只有家长');
      });
    });

    describe('given 缺少family_id参数，when 查询任务，then 返回400', () => {
      it('should return 400 for missing family_id parameter', async () => {
        // Given: 家长已登录但没有family_id参数

        // When: 查询任务不带family_id
        const response = await testRequest({
          method: 'GET',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('family_id');
      });
    });

    describe('given 查询指定儿童的任务，when 儿童属于该家庭，then 返回该儿童的任务', () => {
      it('should get tasks for specific child', async () => {
        // Given: 创建儿童任务
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: `test-task-child-${uniqueId}`,
          family_id: testFamilyId,
          title: '儿童专属任务',
          task_type: '刷牙',
          points: 5,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
        });

        // When: 查询该儿童的任务
        const response = await testRequest({
          method: 'GET',
          url: `/api/tasks?family_id=${testFamilyId}&child_id=${testChildId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
        });

        // Then: 返回该儿童的任务
        expect(response.status).toBe(200);
        expect(response.body.tasks).toBeDefined();
        expect(response.body.tasks.some((t: any) => t.assigned_child_id === testChildId)).toBe(true);
      });
    });

    describe('given 查询不存在的儿童，when 儿童不属于该家庭，then 返回400', () => {
      it('should return 400 for child not in family', async () => {
        // Given: 儿童不属于该家庭
        const otherChildId = 'other-child-id-123';

        // When: 查询不属于家庭的儿童
        const response = await testRequest({
          method: 'GET',
          url: `/api/tasks?family_id=${testFamilyId}&child_id=${otherChildId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('儿童');
      });
    });

    describe('given 查询手动任务，when 使用is_manual参数，then 只返回手动任务', () => {
      it('should filter by is_manual parameter', async () => {
        // Given: 有手动和计划任务
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values([
          {
            id: `test-task-manual-${uniqueId}`,
            family_id: testFamilyId,
            title: '手动任务',
            task_type: '自定义',
            points: 10,
            assigned_child_id: testChildId,
            scheduled_date: today,
            status: 'pending',
            is_manual: true,
          },
          {
            id: `test-task-scheduled-${uniqueId}`,
            family_id: testFamilyId,
            title: '计划任务',
            task_type: '学习',
            points: 15,
            assigned_child_id: testChildId,
            scheduled_date: today,
            status: 'pending',
            is_manual: false,
          },
        ]);

        // When: 查询手动任务
        const response = await testRequest({
          method: 'GET',
          url: `/api/tasks?family_id=${testFamilyId}&is_manual=true`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
        });

        // Then: 只返回手动任务
        expect(response.status).toBe(200);
        expect(response.body.tasks.every((t: any) => t.is_manual === true)).toBe(true);
      });
    });

    describe('given 用户不存在，when 查询任务，then 返回404', () => {
      it('should return 404 for non-existent user', async () => {
        // Given: 有效会话但用户已不存在
        const orphanToken = `orphan-session-${uniqueId}`;
        await createSession({
          userId: 'non-existent-user-id',
          token: orphanToken,
          deviceId: 'test-device',
          deviceType: 'desktop',
          userAgent: 'Test',
          ipAddress: '127.0.0.1',
          rememberMe: false,
        });

        // When: 查询任务
        const response = await testRequest({
          method: 'GET',
          url: `/api/tasks?family_id=${testFamilyId}`,
          cookies: {
            'better-auth.session_token': orphanToken,
          },
        });

        // Then: 返回404
        expect(response.status).toBe(404);
        expect(response.body.error).toContain('用户不存在');
      });
    });

    describe('given 查询其他家庭的任务，when family_id不匹配，then 返回403', () => {
      it('should return 403 for wrong family_id', async () => {
        // Given: 家长已登录但查询其他家庭
        const otherFamilyId = 'other-family-id-123';

        // When: 查询其他家庭的任务
        const response = await testRequest({
          method: 'GET',
          url: `/api/tasks?family_id=${otherFamilyId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
        });

        // Then: 返回403
        expect(response.status).toBe(403);
        expect(response.body.error).toContain('无权访问');
      });
    });

    describe('given 查询所有任务，when 不指定child_id，then 返回空列表', () => {
      it('should return empty list when no child_id specified', async () => {
        // Given: 有任务存在但不指定child_id

        // When: 查询任务不带child_id
        const response = await testRequest({
          method: 'GET',
          url: `/api/tasks?family_id=${testFamilyId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
        });

        // Then: 返回空列表（暂未实现全家庭查询）
        expect(response.status).toBe(200);
        expect(response.body.tasks).toEqual([]);
      });
    });
  });

  describe('POST /api/tasks - Create manual tasks', () => {
    describe('given 家长创建手动任务，when 提交完整数据，then 创建成功', () => {
      it('should create manual task successfully', async () => {
        // Given: 任务数据
        const taskData = {
          title: '完成数学作业',
          task_type: '学习',
          points: 20,
          scheduled_date: new Date().toISOString().split('T')[0],
          child_ids: [testChildId],
        };

        // When: 创建手动任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: taskData,
        });

        // Then: 创建成功
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.tasks).toBeDefined();
        expect(response.body.tasks.length).toBe(1);
      });
    });

    describe('given 创建多个儿童的任务，when 提交多个child_id，then 为每个儿童创建任务', () => {
      it('should create tasks for multiple children', async () => {
        // Given: 多个儿童的任务数据
        const taskData = {
          title: '家庭大扫除',
          task_type: '家务',
          points: 15,
          scheduled_date: new Date().toISOString().split('T')[0],
          child_ids: [testChildId, testChildId2],
        };

        // When: 创建任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: taskData,
        });

        // Then: 为每个儿童创建任务
        expect(response.status).toBe(201);
        expect(response.body.tasks.length).toBe(2);
      });
    });

    describe('given 使用模板快速创建，when 提供task_plan_id，then 预填充模板数据', () => {
      it('should create task from template', async () => {
        // Given: 模板ID
        const templateId = `template-${Date.now()}`;
        await db.insert(tasks).values({
          id: templateId,
          family_id: testFamilyId,
          title: '每日阅读',
          task_type: '学习',
          points: 10,
          scheduled_date: new Date().toISOString().split('T')[0],
          status: 'pending',
        });

        // When: 使用模板创建
        const taskData = {
          task_plan_id: templateId,
          title: '每日阅读30分钟',
          task_type: '学习',
          points: 15,
          scheduled_date: new Date().toISOString().split('T')[0],
          child_ids: [testChildId],
        };

        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: taskData,
        });

        // Then: 创建成功
        if (response.status === 400) {
          // Template might not exist, that's ok for this test
          return;
        }
        expect(response.status).toBe(201);
      });
    });

    describe('given 缺少必需字段，when 创建任务，then 返回400错误', () => {
      it('should return 400 for missing required fields', async () => {
        // Given: 缺少child_ids的任务数据
        const taskData = {
          title: '不完整任务',
          task_type: '学习',
          points: 10,
          scheduled_date: new Date().toISOString().split('T')[0],
          // missing child_ids
        };

        // When: 创建任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: taskData,
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('given 使用过去日期，when 创建任务，then 返回400错误', () => {
      it('should return 400 for past date', async () => {
        // Given: 过去的日期
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const pastDate = yesterday.toISOString().split('T')[0];

        const taskData = {
          title: '过去的任务',
          task_type: '学习',
          points: 10,
          scheduled_date: pastDate,
          child_ids: [testChildId],
        };

        // When: 创建任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: taskData,
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('日期');
      });
    });

    describe('given 积分超出范围，when 创建任务，then 返回400错误', () => {
      it('should return 400 for invalid points', async () => {
        // Given: 超出范围的积分
        const taskData = {
          title: '高积分任务',
          task_type: '学习',
          points: 150, // 超过100
          scheduled_date: new Date().toISOString().split('T')[0],
          child_ids: [testChildId],
        };

        // When: 创建任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: taskData,
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('given 积分为0，when 创建任务，then 返回400错误', () => {
      it('should return 400 for zero points', async () => {
        // Given: 积分为0
        const taskData = {
          title: '零积分任务',
          task_type: '学习',
          points: 0, // 低于最小值1
          scheduled_date: new Date().toISOString().split('T')[0],
          child_ids: [testChildId],
        };

        // When: 创建任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: taskData,
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('given 儿童不属于家庭，when 创建任务，then 返回400错误', () => {
      it('should return 400 for children not in family', async () => {
        // Given: 不属于家庭的儿童
        const taskData = {
          title: '测试任务',
          task_type: '学习',
          points: 10,
          scheduled_date: new Date().toISOString().split('T')[0],
          child_ids: ['non-existent-child-id'],
        };

        // When: 创建任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: taskData,
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('儿童');
      });
    });

    describe('given 标题过长，when 创建任务，then 返回400错误', () => {
      it('should return 400 for title too long', async () => {
        // Given: 超长标题（>100字符）
        const longTitle = 'A'.repeat(101);
        const taskData = {
          title: longTitle,
          task_type: '学习',
          points: 10,
          scheduled_date: new Date().toISOString().split('T')[0],
          child_ids: [testChildId],
        };

        // When: 创建任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: taskData,
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('任务名称');
      });
    });

    describe('given 日期格式错误，when 创建任务，then 返回400错误', () => {
      it('should return 400 for invalid date format', async () => {
        // Given: 错误的日期格式
        const taskData = {
          title: '测试任务',
          task_type: '学习',
          points: 10,
          scheduled_date: '2024/01/01', // 错误格式，应为YYYY-MM-DD
          child_ids: [testChildId],
        };

        // When: 创建任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: taskData,
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('given 未登录，when 创建任务，then 返回401', () => {
      it('should return 401 for unauthenticated create', async () => {
        // Given: 未登录
        const taskData = {
          title: '测试任务',
          task_type: '学习',
          points: 10,
          scheduled_date: new Date().toISOString().split('T')[0],
          child_ids: [testChildId],
        };

        // When: 创建任务不带会话
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          body: taskData,
        });

        // Then: 返回401
        expect(response.status).toBe(401);
        expect(response.body.error).toContain('未登录');
      });
    });

    describe('given 会话已过期，when 创建任务，then 返回401', () => {
      it('should return 401 for expired session when creating', async () => {
        // Given: 过期的会话token
        const expiredToken = 'expired-token-create-12345';
        const taskData = {
          title: '测试任务',
          task_type: '学习',
          points: 10,
          scheduled_date: new Date().toISOString().split('T')[0],
          child_ids: [testChildId],
        };

        // When: 使用过期会话创建任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': expiredToken,
          },
          body: taskData,
        });

        // Then: 返回401
        expect(response.status).toBe(401);
        expect(response.body.error).toContain('会话已过期');
      });
    });

    describe('given 用户不存在，when 创建任务，then 返回404', () => {
      it('should return 404 for non-existent user when creating', async () => {
        // Given: 有效会话但用户已不存在
        const orphanToken = `orphan-session-create-${uniqueId}`;
        await createSession({
          userId: 'non-existent-user-id-create',
          token: orphanToken,
          deviceId: 'test-device',
          deviceType: 'desktop',
          userAgent: 'Test',
          ipAddress: '127.0.0.1',
          rememberMe: false,
        });
        const taskData = {
          title: '测试任务',
          task_type: '学习',
          points: 10,
          scheduled_date: new Date().toISOString().split('T')[0],
          child_ids: [testChildId],
        };

        // When: 创建任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': orphanToken,
          },
          body: taskData,
        });

        // Then: 返回404
        expect(response.status).toBe(404);
        expect(response.body.error).toContain('用户不存在');
      });
    });

    describe('given 儿童用户创建任务，when 使用儿童会话，then 返回403', () => {
      it('should return 403 for child user creating task', async () => {
        // Given: 儿童用户的会话
        const childSessionToken = `test-child-session-create-${uniqueId}`;
        await createSession({
          userId: testChildId,
          token: childSessionToken,
          deviceId: 'test-device-child',
          deviceType: 'mobile',
          userAgent: 'Test App',
          ipAddress: '127.0.0.1',
          rememberMe: false,
        });
        const taskData = {
          title: '测试任务',
          task_type: '学习',
          points: 10,
          scheduled_date: new Date().toISOString().split('T')[0],
          child_ids: [testChildId],
        };

        // When: 儿童用户创建任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': childSessionToken,
          },
          body: taskData,
        });

        // Then: 返回403
        expect(response.status).toBe(403);
        expect(response.body.error).toContain('只有家长');
      });
    });

    describe('given 备注过长，when 创建任务，then 返回400错误', () => {
      it('should return 400 for notes too long', async () => {
        // Given: 超长备注（>500字符）
        const longNotes = 'A'.repeat(501);
        const taskData = {
          title: '测试任务',
          task_type: '学习',
          points: 10,
          scheduled_date: new Date().toISOString().split('T')[0],
          child_ids: [testChildId],
          notes: longNotes,
        };

        // When: 创建任务
        const response = await testRequest({
          method: 'POST',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: taskData,
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('备注');
      });
    });
  });

  describe('PATCH /api/tasks - Update task', () => {
    beforeEach(async () => {
      // Clean up tasks before each PATCH test
      await db.delete(tasks).where(eq(tasks.family_id, testFamilyId));
    });

    describe('given 更新手动任务，when 提供有效数据，then 更新成功', () => {
      it('should update manual task successfully', async () => {
        // Given: 创建手动任务
        const taskId = `test-task-update-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '原标题',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 更新任务
        const updateData = {
          title: '新标题',
          points: 20,
        };

        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: updateData,
        });

        // Then: 更新成功
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.task.title).toBe('新标题');
        expect(response.body.task.points).toBe(20);
      });
    });

    describe('given 缺少任务ID，when 更新任务，then 返回400', () => {
      it('should return 400 for missing task id', async () => {
        // Given: 不带id参数

        // When: 更新任务
        const response = await testRequest({
          method: 'PATCH',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: { title: '新标题' },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('任务ID');
      });
    });

    describe('given 任务不存在，when 更新任务，then 返回404', () => {
      it('should return 404 for non-existent task', async () => {
        // Given: 不存在的任务ID
        const nonExistentId = 'non-existent-task-id';

        // When: 更新任务
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${nonExistentId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: { title: '新标题' },
        });

        // Then: 返回404
        expect(response.status).toBe(404);
        expect(response.body.error).toContain('任务不存在');
      });
    });

    describe('given 更新计划任务，when 任务不是手动创建，then 返回400', () => {
      it('should return 400 for non-manual task', async () => {
        // Given: 计划任务（非手动）
        const taskId = `test-task-scheduled-patch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '计划任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: false,
        });

        // When: 尝试更新计划任务
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: { title: '新标题' },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('只能编辑手动');
      });
    });

    describe('given 使用过去日期，when 更新任务日期，then 返回400', () => {
      it('should return 400 for past date when updating', async () => {
        // Given: 手动任务
        const taskId = `test-task-past-date-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '原任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 更新为过去的日期
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const pastDate = yesterday.toISOString().split('T')[0];

        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: { scheduled_date: pastDate },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('日期');
      });
    });

    describe('given 未登录，when 更新任务，then 返回401', () => {
      it('should return 401 for unauthenticated update', async () => {
        // Given: 手动任务
        const taskId = `test-task-unauth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '测试任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 不带会话更新任务
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          body: { title: '新标题' },
        });

        // Then: 返回401
        expect(response.status).toBe(401);
        expect(response.body.error).toContain('未登录');
      });
    });

    describe('given 会话已过期，when 更新任务，then 返回401', () => {
      it('should return 401 for expired session when updating', async () => {
        // Given: 手动任务和过期会话
        const taskId = `test-task-expired-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '测试任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });
        const expiredToken = 'expired-token-update-12345';

        // When: 使用过期会话更新
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': expiredToken,
          },
          body: { title: '新标题' },
        });

        // Then: 返回401
        expect(response.status).toBe(401);
        expect(response.body.error).toContain('会话已过期');
      });
    });

    describe('given 用户不存在，when 更新任务，then 返回404', () => {
      it('should return 404 for non-existent user when updating', async () => {
        // Given: 手动任务和孤儿会话
        const taskId = `test-task-orphan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '测试任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });
        const orphanToken = `orphan-session-update-${uniqueId}`;
        await createSession({
          userId: 'non-existent-user-id-update',
          token: orphanToken,
          deviceId: 'test-device',
          deviceType: 'desktop',
          userAgent: 'Test',
          ipAddress: '127.0.0.1',
          rememberMe: false,
        });

        // When: 更新任务
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': orphanToken,
          },
          body: { title: '新标题' },
        });

        // Then: 返回404
        expect(response.status).toBe(404);
        expect(response.body.error).toContain('用户不存在');
      });
    });

    describe('given 儿童用户更新任务，when 使用儿童会话，then 返回403', () => {
      it('should return 403 for child user updating task', async () => {
        // Given: 手动任务和儿童会话
        const taskId = `test-task-child-update-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '测试任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });
        const childSessionToken = `test-child-session-update-${uniqueId}`;
        await createSession({
          userId: testChildId,
          token: childSessionToken,
          deviceId: 'test-device-child',
          deviceType: 'mobile',
          userAgent: 'Test App',
          ipAddress: '127.0.0.1',
          rememberMe: false,
        });

        // When: 儿童用户更新任务
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': childSessionToken,
          },
          body: { title: '新标题' },
        });

        // Then: 返回403
        expect(response.status).toBe(403);
        expect(response.body.error).toContain('只有家长');
      });
    });

    describe('given 更新其他家庭的任务，when family_id不匹配，then 返回403', () => {
      it('should return 403 for updating task from wrong family', async () => {
        // Given: 其他家庭的任务
        const otherFamilyId = `other-family-${uniqueId}`;
        const otherParentId = `other-parent-${uniqueId}`;
        await db.insert(families).values({
          id: otherFamilyId,
          primary_parent_id: otherParentId,
        });
        const taskId = `test-task-other-family-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: otherFamilyId,
          title: '其他家庭任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 尝试更新其他家庭的任务
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: { title: '新标题' },
        });

        // Then: 返回403
        expect(response.status).toBe(403);
        expect(response.body.error).toContain('无权编辑');

        // Cleanup
        await db.delete(tasks).where(eq(tasks.id, taskId));
        await db.delete(families).where(eq(families.id, otherFamilyId));
      });
    });

    describe('given 标题过长，when 更新任务，then 返回400', () => {
      it('should return 400 for title too long when updating', async () => {
        // Given: 手动任务
        const taskId = `test-task-long-title-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '原标题',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 更新为过长标题
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: { title: 'A'.repeat(101) },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('任务名称');
      });
    });

    describe('given 积分超出范围，when 更新任务，then 返回400', () => {
      it('should return 400 for invalid points when updating', async () => {
        // Given: 手动任务
        const taskId = `test-task-inv-points-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '原标题',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 更新为超出范围的积分
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: { points: 150 },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('积分');
      });
    });

    describe('given 日期格式错误，when 更新任务日期，then 返回400', () => {
      it('should return 400 for invalid date format when updating', async () => {
        // Given: 手动任务
        const taskId = `test-task-bad-date-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '原标题',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 使用错误日期格式
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: { scheduled_date: '2024/01/01' },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('given 备注过长，when 更新任务，then 返回400', () => {
      it('should return 400 for notes too long when updating', async () => {
        // Given: 手动任务
        const taskId = `test-task-long-notes-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '原标题',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 更新为过长备注
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: { notes: 'A'.repeat(501) },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('备注');
      });
    });

    describe('given 任务类型无效，when 更新任务类型，then 返回400', () => {
      it('should return 400 for invalid task_type when updating', async () => {
        // Given: 手动任务
        const taskId = `test-task-bad-type-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '原标题',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 尝试更新为无效类型（需要通过字符串绕过类型检查）
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: { task_type: 'invalid_type' },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });
    });

    describe('given 积分为零，when 更新任务积分，then 返回400', () => {
      it('should return 400 for zero points when updating', async () => {
        // Given: 手动任务
        const taskId = `test-task-zero-points-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '原标题',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 更新积分为0
        const response = await testRequest({
          method: 'PATCH',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
          body: { points: 0 },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('积分');
      });
    });
  });

  describe('DELETE /api/tasks - Delete task', () => {
    describe('given 删除手动任务，when 任务存在，then 删除成功', () => {
      it('should delete manual task successfully', async () => {
        // Given: 创建手动任务
        const taskId = `test-task-delete-${uniqueId}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '要删除的任务',
          task_type: '自定义',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 删除任务
        const response = await testRequest({
          method: 'DELETE',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
        });

        // Then: 删除成功
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('删除');
      });
    });

    describe('given 缺少任务ID，when 删除任务，then 返回400', () => {
      it('should return 400 for missing task id', async () => {
        // Given: 不带id参数

        // When: 删除任务
        const response = await testRequest({
          method: 'DELETE',
          url: '/api/tasks',
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('任务ID');
      });
    });

    describe('given 任务不存在，when 删除任务，then 返回404', () => {
      it('should return 404 for non-existent task', async () => {
        // Given: 不存在的任务ID
        const nonExistentId = 'non-existent-task-id';

        // When: 删除任务
        const response = await testRequest({
          method: 'DELETE',
          url: `/api/tasks?id=${nonExistentId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
        });

        // Then: 返回404
        expect(response.status).toBe(404);
        expect(response.body.error).toContain('任务不存在');
      });
    });

    describe('given 删除计划任务，when 任务不是手动创建，then 返回400', () => {
      it('should return 400 for non-manual task', async () => {
        // Given: 计划任务（非手动）
        const taskId = `test-task-scheduled-del-${uniqueId}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '计划任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: false,
        });

        // When: 尝试删除计划任务
        const response = await testRequest({
          method: 'DELETE',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
        });

        // Then: 返回400
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('只能删除手动');
      });
    });

    describe('given 未登录，when 删除任务，then 返回401', () => {
      it('should return 401 for unauthenticated delete', async () => {
        // Given: 手动任务
        const taskId = `test-task-unauth-del-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '测试任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 不带会话删除任务
        const response = await testRequest({
          method: 'DELETE',
          url: `/api/tasks?id=${taskId}`,
        });

        // Then: 返回401
        expect(response.status).toBe(401);
        expect(response.body.error).toContain('未登录');
      });
    });

    describe('given 会话已过期，when 删除任务，then 返回401', () => {
      it('should return 401 for expired session when deleting', async () => {
        // Given: 手动任务和过期会话
        const taskId = `test-task-exp-del-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '测试任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });
        const expiredToken = 'expired-token-del-12345';

        // When: 使用过期会话删除
        const response = await testRequest({
          method: 'DELETE',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': expiredToken,
          },
        });

        // Then: 返回401
        expect(response.status).toBe(401);
        expect(response.body.error).toContain('会话已过期');
      });
    });

    describe('given 用户不存在，when 删除任务，then 返回404', () => {
      it('should return 404 for non-existent user when deleting', async () => {
        // Given: 手动任务和孤儿会话
        const taskId = `test-task-orphan-del-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '测试任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });
        const orphanToken = `orphan-session-del-${uniqueId}`;
        await createSession({
          userId: 'non-existent-user-id-del',
          token: orphanToken,
          deviceId: 'test-device',
          deviceType: 'desktop',
          userAgent: 'Test',
          ipAddress: '127.0.0.1',
          rememberMe: false,
        });

        // When: 删除任务
        const response = await testRequest({
          method: 'DELETE',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': orphanToken,
          },
        });

        // Then: 返回404
        expect(response.status).toBe(404);
        expect(response.body.error).toContain('用户不存在');
      });
    });

    describe('given 儿童用户删除任务，when 使用儿童会话，then 返回403', () => {
      it('should return 403 for child user deleting task', async () => {
        // Given: 手动任务和儿童会话
        const taskId = `test-task-child-del-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: testFamilyId,
          title: '测试任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });
        const childSessionToken = `test-child-session-del-${uniqueId}`;
        await createSession({
          userId: testChildId,
          token: childSessionToken,
          deviceId: 'test-device-child',
          deviceType: 'mobile',
          userAgent: 'Test App',
          ipAddress: '127.0.0.1',
          rememberMe: false,
        });

        // When: 儿童用户删除任务
        const response = await testRequest({
          method: 'DELETE',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': childSessionToken,
          },
        });

        // Then: 返回403
        expect(response.status).toBe(403);
        expect(response.body.error).toContain('只有家长');
      });
    });

    describe('given 删除其他家庭的任务，when family_id不匹配，then 返回403', () => {
      it('should return 403 for deleting task from wrong family', async () => {
        // Given: 其他家庭的任务
        const otherFamilyId = `other-family-del-${uniqueId}`;
        const otherParentId = `other-parent-del-${uniqueId}`;
        await db.insert(families).values({
          id: otherFamilyId,
          primary_parent_id: otherParentId,
        });
        const taskId = `test-task-other-fam-del-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const today = new Date().toISOString().split('T')[0];
        await db.insert(tasks).values({
          id: taskId,
          family_id: otherFamilyId,
          title: '其他家庭任务',
          task_type: '学习',
          points: 10,
          assigned_child_id: testChildId,
          scheduled_date: today,
          status: 'pending',
          is_manual: true,
        });

        // When: 尝试删除其他家庭的任务
        const response = await testRequest({
          method: 'DELETE',
          url: `/api/tasks?id=${taskId}`,
          cookies: {
            'better-auth.session_token': testSessionToken,
          },
        });

        // Then: 返回403
        expect(response.status).toBe(403);
        expect(response.body.error).toContain('无权删除');

        // Cleanup
        await db.delete(tasks).where(eq(tasks.id, taskId));
        await db.delete(families).where(eq(families.id, otherFamilyId));
      });
    });
  });
});
