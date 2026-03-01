/**
 * Unit tests for family query functions
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 * Source: AGENTS.md - Use Bun Test for unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import db from '@/lib/db';
import { createFamily, getFamilyById, getFamilyByPrimaryParent } from '@/lib/db/queries/families';
import { families } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

describe('Family Query Functions', () => {
  let testUserId: string;
  let testFamilyId: string;

  beforeEach(async () => {
    // Create test user
    testUserId = `test-user-${Date.now()}`;
    testFamilyId = `test-family-${Date.now()}`;

    // Clean all test data (parent-*) before each test to avoid conflicts
    await db.delete(families).where(sql`primary_parent_id LIKE 'parent-%'`);

    // Clean database before each test
    await db.delete(families).where(eq(families.id, testFamilyId));
  });

  afterEach(async () => {
    // Clean up after each test
    if (testFamilyId) {
      await db.delete(families).where(eq(families.id, testFamilyId));
    }
  });

  describe('given 创建新家庭时，when 指定主要家长，then 创建家庭记录', () => {
    it('should create family with primary parent', async () => {
      // Given: 主要家长 ID
      const primaryParentId = 'parent-123';

      // When: 创建家庭
      const family = await createFamily(primaryParentId);

      // Then: 应该返回家庭信息
      expect(family).toBeDefined();
      expect(family?.id).toBeDefined();
      expect(family?.primary_parent_id).toBe(primaryParentId);
      expect(family?.created_at).toBeInstanceOf(Date);
    });

    it('should generate unique family ID', async () => {
      // Given: 创建两个家庭
      const family1 = await createFamily('parent-1');
      const family2 = await createFamily('parent-2');

      // When: 比较家庭 ID
      // Then: ID 应该唯一
      expect(family1.id).not.toBe(family2.id);
    });

    it('should set created_at timestamp', async () => {
      // Given: 创建家庭
      const beforeCreate = Date.now();
      const family = await createFamily('parent-1');

      // When: 检查创建时间
      // Then: created_at 应该接近当前时间
      expect(family?.created_at).toBeInstanceOf(Date);
      expect(Math.abs((family?.created_at?.getTime() || 0) - beforeCreate)).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('given 查询家庭信息时，when 使用家庭 ID 或主要家长 ID，then 返回家庭记录', () => {
    it('should return family by ID', async () => {
      // Given: 已创建家庭
      const createdFamily = await createFamily('parent-1');

      // When: 使用 ID 查询
      const foundFamily = await getFamilyById(createdFamily.id);

      // Then: 应该返回相同家庭
      expect(foundFamily).toBeDefined();
      expect(foundFamily?.id).toBe(createdFamily.id);
      expect(foundFamily?.primary_parent_id).toBe('parent-1');
    });

    it('should return null when family ID not exists', async () => {
      // Given: 家庭不存在
      // When: 查询不存在的 ID
      const foundFamily = await getFamilyById('family-not-exists');

      // Then: 应该返回 null
      expect(foundFamily).toBeNull();
    });

    it('should return family by primary parent', async () => {
      // Given: 已创建家庭（先清理旧数据）
      await db.delete(families).where(sql`primary_parent_id = 'parent-1'`);
      const createdFamily = await createFamily('parent-1');

      // When: 使用主要家长 ID 查询
      const foundFamily = await getFamilyByPrimaryParent('parent-1');

      // Then: 应该返回相同家庭
      expect(foundFamily).toBeDefined();
      expect(foundFamily?.id).toBe(createdFamily.id);
      expect(foundFamily?.primary_parent_id).toBe('parent-1');
    });

    it('should return null when primary parent not found', async () => {
      // Given: 主要家长不存在
      // When: 查询不存在的家长
      const foundFamily = await getFamilyByPrimaryParent('parent-not-exists');

      // Then: 应该返回 null
      expect(foundFamily).toBeNull();
    });
  });
});
