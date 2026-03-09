/**
 * Integration Tests for Task Plans Quick Create API
 *
 * Story 2.6: Parent Uses Template to Quickly Create Task
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import db from '@/lib/db';
import { families, users, taskPlans, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createUser } from '@/lib/db/queries/users';
import { createSession } from '@/lib/db/queries/sessions';
import { testRequest, createMockRequest } from '@/tests/setup-test-app';

describe('Task Plans Quick Create API Integration Tests', () => {
  let testFamilyId: string;
  let testParentId: string;
  let testChildId: string;
  let testSessionToken: string;
  let uniqueId: string;

  beforeAll(async () => {
    uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    testFamilyId = `test-family-quick-create-${uniqueId}`;
    testParentId = `test-parent-quick-create-${uniqueId}`;
    testChildId = `test-child-quick-create-${uniqueId}`;

    // Create test family
    await db.insert(families).values({
      id: testFamilyId,
      primary_parent_id: testParentId,
    });

    // Create test parent with password using createUser helper
    await createUser(`13800600${uniqueId.slice(-6)}`, 'parent', 'Test1234', testFamilyId);

    // Get the created parent to get the ID
    const parentUsers = await db.query.users.findMany({
      where: eq(users.phone, `13800600${uniqueId.slice(-6)}`),
    });
    if (parentUsers.length > 0) {
      // Update the user ID to match our expected ID
      testParentId = parentUsers[0].id;
    }

    // Create test child
    await createUser(`13800601${uniqueId.slice(-6)}`, 'child', null, testFamilyId);
    const childUsers = await db.query.users.findMany({
      where: eq(users.phone, `13800601${uniqueId.slice(-6)}`),
    });
    if (childUsers.length > 0) {
      testChildId = childUsers[0].id;
    }

    // Create session for parent
    testSessionToken = `test-session-${uniqueId}`;
    await createSession({
      userId: testParentId,
      token: testSessionToken,
      deviceId: 'test-device',
      deviceType: 'desktop',
      userAgent: 'Test Browser',
      ipAddress: '127.0.0.1',
      rememberMe: false,
    });

    // Create some test task plan templates
    await db.insert(taskPlans).values([
      {
        id: `plan-template-1-${uniqueId}`,
        family_id: testFamilyId,
        title: '每日刷牙',
        task_type: '刷牙',
        points: 5,
        rule: JSON.stringify({ frequency: 'daily', excludedDates: { dates: [], scope: 'permanent' } }),
        status: 'published',
        created_by: testParentId,
      },
      {
        id: `plan-template-2-${uniqueId}`,
        family_id: testFamilyId,
        title: '完成作业',
        task_type: '学习',
        points: 15,
        rule: JSON.stringify({ frequency: 'weekdays', excludedDates: { dates: [], scope: 'permanent' } }),
        status: 'published',
        created_by: testParentId,
      },
      {
        id: `plan-template-3-${uniqueId}`,
        family_id: testFamilyId,
        title: '周末大扫除',
        task_type: '家务',
        points: 20,
        rule: JSON.stringify({ frequency: 'weekends', excludedDates: { dates: [], scope: 'permanent' } }),
        status: 'draft', // Draft should not appear in quick create
        created_by: testParentId,
      },
    ]);
  });

  afterAll(async () => {
    await db.delete(taskPlans).where(eq(taskPlans.family_id, testFamilyId));
    await db.delete(sessions).where(eq(sessions.user_id, testParentId));
    await db.delete(users).where(eq(users.family_id, testFamilyId));
    await db.delete(families).where(eq(families.id, testFamilyId));
  });

  describe('given 家长已登录，when 查询快速创建模板，then 返回已发布的模板', () => {
    it('should get templates for quick create successfully', async () => {
      // Given: 家长已登录且有已发布的模板

      // When: 查询快速创建模板
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create',
        cookies: {
          'better-auth.session_token': testSessionToken,
        },
      });

      // Then: 返回成功
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.parentTemplates).toBeDefined();
      expect(response.body.adminTemplates).toBeDefined();

      // And: 只返回已发布的模板（不包括草稿）
      const draftTemplates = response.body.parentTemplates.filter((t: any) => t.status === 'draft');
      expect(draftTemplates.length).toBe(0);
    });
  });

  describe('given 未登录用户，when 查询模板，then 返回401未授权', () => {
    it('should return 401 for unauthenticated user', async () => {
      // Given: 未登录用户

      // When: 查询模板
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create',
      });

      // Then: 返回401
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('未登录');
    });
  });

  describe('given 会话已过期，when 查询模板，then 返回401会话过期', () => {
    it('should return 401 for expired session', async () => {
      // Given: 过期的会话token
      const expiredToken = 'expired-session-token-12345';

      // When: 查询模板
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create',
        cookies: {
          'better-auth.session_token': expiredToken,
        },
      });

      // Then: 返回401会话过期
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('会话已过期');
    });
  });

  describe('given 儿童用户登录，when 查询模板，then 返回403禁止', () => {
    it('should return 403 for non-parent user', async () => {
      // Given: 儿童用户的会话
      const childSessionToken = `test-child-session-${uniqueId}`;
      await createSession({
        userId: testChildId,
        token: childSessionToken,
        deviceId: 'test-device-child',
        deviceType: 'mobile',
        userAgent: 'Test App',
        ipAddress: '127.0.0.1',
        rememberMe: false,
      });

      // When: 儿童用户查询模板
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create',
        cookies: {
          'better-auth.session_token': childSessionToken,
        },
      });

      // Then: 返回403
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('只有家长');
    });
  });

  describe('given 使用搜索关键词，when 搜索模板，then 返回匹配的模板', () => {
    it('should filter templates by search term', async () => {
      // Given: 有多个模板

      // When: 使用搜索关键词"刷牙"
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create?search=刷牙',
        cookies: {
          'better-auth.session_token': testSessionToken,
        },
      });

      // Then: 返回匹配的模板
      expect(response.status).toBe(200);
      expect(response.body.parentTemplates).toBeDefined();

      // 验证搜索结果
      const allMatch = response.body.parentTemplates.every((t: any) =>
        t.title.toLowerCase().includes('刷牙')
      );
      expect(allMatch).toBe(true);
    });
  });

  describe('given 只查看我的模板，when 使用type=mine，then 只返回家长模板', () => {
    it('should return only parent templates when type=mine', async () => {
      // Given: 有家长和管理员模板

      // When: 使用type=mine过滤
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create?type=mine',
        cookies: {
          'better-auth.session_token': testSessionToken,
        },
      });

      // Then: 只返回家长模板
      expect(response.status).toBe(200);
      expect(response.body.parentTemplates).toBeDefined();
      expect(response.body.adminTemplates).toBeDefined();
      expect(response.body.adminTemplates).toEqual([]);
    });
  });

  describe('given 只查看管理员模板，when 使用type=admin，then 只返回管理员模板', () => {
    it('should return only admin templates when type=admin', async () => {
      // Given: 有家长和管理员模板

      // When: 使用type=admin过滤
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create?type=admin',
        cookies: {
          'better-auth.session_token': testSessionToken,
        },
      });

      // Then: 只返回管理员模板
      expect(response.status).toBe(200);
      expect(response.body.parentTemplates).toEqual([]);
      expect(response.body.adminTemplates).toBeDefined();
    });
  });

  describe('given 查看所有模板，when 使用type=all或不指定，then 返回所有模板', () => {
    it('should return all templates when type=all', async () => {
      // Given: 有家长和管理员模板

      // When: 使用type=all或不指定type
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create?type=all',
        cookies: {
          'better-auth.session_token': testSessionToken,
        },
      });

      // Then: 返回所有类型的模板
      expect(response.status).toBe(200);
      expect(response.body.parentTemplates).toBeDefined();
      expect(response.body.adminTemplates).toBeDefined();
    });
  });

  describe('given 搜索不存在的关键词，when 搜索模板，then 返回空列表', () => {
    it('should return empty list for non-existent search term', async () => {
      // Given: 有模板但都不匹配搜索词

      // When: 搜索不存在的关键词"xyzabc123"
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create?search=xyzabc123',
        cookies: {
          'better-auth.session_token': testSessionToken,
        },
      });

      // Then: 返回空列表
      expect(response.status).toBe(200);
      expect(response.body.parentTemplates).toEqual([]);
      expect(response.body.adminTemplates).toEqual([]);
    });
  });

  describe('given 搜索组合过滤，when 同时使用search和type，then 应用两个过滤条件', () => {
    it('should apply both search and type filters', async () => {
      // Given: 有多个模板

      // When: 同时使用search="刷"和type="mine"
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create?search=刷&type=mine',
        cookies: {
          'better-auth.session_token': testSessionToken,
        },
      });

      // Then: 返回匹配搜索词的家长模板
      expect(response.status).toBe(200);
      expect(response.body.parentTemplates).toBeDefined();
      expect(response.body.adminTemplates).toEqual([]);

      // 验证所有结果都包含搜索词
      const allMatchSearch = response.body.parentTemplates.every((t: any) =>
        t.title.toLowerCase().includes('刷')
      );
      expect(allMatchSearch).toBe(true);
    });
  });

  describe('given 大写搜索关键词，when 搜索模板，then 不区分大小写匹配', () => {
    it('should handle case-insensitive search', async () => {
      // Given: 有模板

      // When: 使用大写搜索关键词"刷牙"
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create?search=刷牙',
        cookies: {
          'better-auth.session_token': testSessionToken,
        },
      });

      // Then: 正确匹配模板
      expect(response.status).toBe(200);
      expect(response.body.parentTemplates).toBeDefined();
    });
  });

  describe('given 用户不存在，when 查询模板，then 返回404错误', () => {
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

      // When: 查询模板
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create',
        cookies: {
          'better-auth.session_token': orphanToken,
        },
      });

      // Then: 返回404
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('用户不存在');
    });
  });

  describe('given 搜索结果包含多个匹配，when 使用搜索，then 返回所有匹配的模板', () => {
    it('should return all matching templates for search term', async () => {
      // Given: 有多个包含"作业"的模板

      // When: 搜索"作业"
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create?search=作业',
        cookies: {
          'better-auth.session_token': testSessionToken,
        },
      });

      // Then: 返回包含"作业"的模板
      expect(response.status).toBe(200);
      expect(response.body.parentTemplates).toBeDefined();
      expect(response.body.parentTemplates.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('given 使用部分关键词搜索，when 搜索词包含在标题中，then 返回匹配结果', () => {
    it('should find templates with partial search term', async () => {
      // Given: 有模板

      // When: 使用部分关键词"刷"
      const response = await testRequest({
        method: 'GET',
        url: '/api/task-plans/for-quick-create?search=刷',
        cookies: {
          'better-auth.session_token': testSessionToken,
        },
      });

      // Then: 返回匹配的模板
      expect(response.status).toBe(200);
      expect(response.body.parentTemplates.length).toBeGreaterThanOrEqual(1);
      expect(response.body.parentTemplates.every((t: any) =>
        t.title.includes('刷')
      )).toBe(true);
    });
  });
});
