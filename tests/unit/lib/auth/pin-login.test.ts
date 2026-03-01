/**
 * BDD Unit Tests for Story 1.3: Child PIN Login API
 *
 * Unit tests focus on logic without external dependencies
 * Source: Story 1.3 AC #1-#8
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createUser, getChildByPIN } from '@/lib/db/queries/users';
import { resetRateLimit, resetAllRateLimits } from '@/lib/auth/rate-limit';
import db from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Story 1.3: Child PIN Login - Unit Tests', () => {
  let childName: string;
  let childPin: string;
  let familyId: string;

  beforeEach(async () => {
    // 为每个测试创建独立的测试数据
    childPin = `${Math.floor(Math.random() * 9000 + 1000)}`;
    childName = `child_${Date.now()}_${Math.random()}`;
    familyId = `test-family-${Date.now()}`;
  });

  afterEach(async () => {
    // 清理测试数据
    resetAllRateLimits();
    await db.delete(users).where(eq(users.phone, childName));
  });

  describe('given PIN登录，when 查询儿童用户，then 使用 password_hash 验证PIN', () => {
    it('should return child user with matching PIN hash', async () => {
      // Given: 创建儿童用户
      await createUser(childName, 'child', childPin, familyId);

      // When: 查询儿童用户
      const foundUser = await getChildByPIN(childPin);

      // Then: 应该返回儿童用户
      expect(foundUser).toBeDefined();
      expect(foundUser?.role).toBe('child');
      expect(foundUser?.family_id).toBe(familyId);
    });

    it('should return null with non-matching PIN hash', async () => {
      // Given: 创建儿童用户
      await createUser(childName, 'child', childPin, familyId);

      // When: 使用错误PIN查询
      const foundUser = await getChildByPIN('9999');

      // Then: 应该返回null
      expect(foundUser).toBeNull();
    });
  });
});
