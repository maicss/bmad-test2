/**
 * Unit tests for user query functions
 *
 * BDD Testing Requirement: Given-When-Then format with business language
 * Source: AGENTS.md - Use Bun Test for unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import db from '@/lib/db';
import { getUserByPhone, getUserByPhonePlain, createUser, updateUser } from '@/lib/db/queries/users';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('User Query Functions', () => {
  let testUserId: string | null = null;
  let testPhone: string;
  let testPassword: string;

  beforeEach(async () => {
    // Clean up test user from previous test
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
      testUserId = null; // Reset after cleanup
    }
    testPhone = `13800000${Math.floor(Math.random() * 9000 + 1000)}`;
    testPassword = 'Test1234';
  });

  describe('given 家长已注册，when 使用手机号哈希查询用户，then 返回用户信息', () => {
    it('should return user by phone hash', async () => {
      // Given: 已创建用户
      const user = await createUser(testPhone, 'parent', testPassword);

      // When: 使用手机号哈希查询
      const foundUser = await getUserByPhone(testPhone);

      // Then: 应该返回用户信息
      expect(foundUser).not.toBeNull();
      expect(foundUser?.phone).toBe(testPhone);
    });

    it('should return null when phone not exists', async () => {
      // Given: 用户不存在
      // When: 查询不存在的手机号
      const foundUser = await getUserByPhone('13800009999');

      // Then: 应该返回 null
      expect(foundUser).toBeNull();
    });
  });

  describe('given 发送 SMS 需要明文手机号，when 使用明文手机号查询用户，then 返回用户信息', () => {
    it('should return user by plain phone', async () => {
      // Given: 已创建用户
      const user = await createUser(testPhone, 'parent', testPassword);

      // When: 使用明文手机号查询
      const foundUser = await getUserByPhonePlain(testPhone);

      // Then: 应该返回用户信息
      expect(foundUser).not.toBeNull();
      expect(foundUser?.phone).toBe(testPhone);
    });

    it('should return null when phone not exists', async () => {
      // Given: 用户不存在
      // When: 查询不存在的明文手机号
      const foundUser = await getUserByPhonePlain('13800009999');

      // Then: 应该返回 null
      expect(foundUser).toBeNull();
    });
  });

  describe('given 家长使用手机号注册，when 创建用户账户，then 实现双重存储和密码哈希', () => {
    it('should store phone in plain text and phone in hashed format', async () => {
      // Given: 提供手机号和密码
      // When: 创建用户
      const user = await createUser(testPhone, 'parent', testPassword);

      // Then: 手机号应该双重存储（明文 + 哈希）
      expect(user?.phone).toBe(testPhone);
      expect(user?.phone_hash).toBeDefined();
      expect(user?.password_hash).toBeDefined();
      expect(user?.password_hash).not.toBe(testPassword); // 应该是哈希值
      expect(user?.password_hash).toHaveLength(60); // bcrypt 哈希通常是 60 字符
      expect(user?.role).toBe('parent');
    });

    it('should hash phone using Bun.password.hash() with bcrypt', async () => {
      // Given: 创建用户
      const user = await createUser(testPhone, 'parent', testPassword);

      // When: 创建后查询用户
      const foundUser = await getUserByPhone(testPhone);

      // Then: phone_hash 应该是 bcrypt 哈希
      expect(foundUser?.phone_hash).toHaveLength(60);
      expect(foundUser?.phone_hash).toMatch(/^\$2[aby]\$/); // bcrypt 哈希格式
    });

    it('should hash password using Bun.password.hash() with bcrypt', async () => {
      // Given: 创建用户带密码
      const user = await createUser(testPhone, 'parent', testPassword);

      // When: 创建后查询用户
      const foundUser = await getUserByPhone(testPhone);

      // Then: password_hash 应该是 bcrypt 哈希
      expect(foundUser?.password_hash).toBeDefined();
      expect(foundUser?.password_hash).toHaveLength(60);
      expect(foundUser?.password_hash).toMatch(/^\$2[aby]\$/); // bcrypt 哈希格式
      expect(foundUser?.password_hash).not.toBe(testPassword); // 不应该是明文密码
    });

    it('should create user without family_id initially', async () => {
      // Given: 创建新用户
      // When: 不提供 family_id
      const user = await createUser(testPhone, 'parent', testPassword);

      // Then: family_id 应该为 null
      expect(user?.family_id).toBeNull();
    });
  });

  describe('given 家长需要更新用户信息，when 更新手机号或密码，then 重新哈希存储', () => {
    it('should update phone hash when phone changes', async () => {
      // Given: 已创建用户
      const user = await createUser(testPhone, 'parent', testPassword);
      const newPhone = '13800008888';

      // When: 更新手机号
      await updateUser(user.id, { phone: newPhone });

      // Then: phone_hash 应该重新计算
      const updatedUser = await getUserByPhone(newPhone);
      expect(updatedUser?.phone).toBe(newPhone);
      expect(updatedUser?.phone_hash).not.toBe(user?.phone_hash); // 哈希值不同
    });

    it('should update password hash when password changes', async () => {
      // Given: 已创建用户
      const user = await createUser(testPhone, 'parent', testPassword);
      const newPassword = 'NewPass5678';

      // When: 更新密码
      await updateUser(user.id, { password_hash: newPassword });

      // Then: password_hash 应该是新值
      const updatedUser = await getUserByPhone(testPhone);
      expect(updatedUser?.password_hash).toBe(newPassword);
    });
  });

  describe('given 用户使用 OTP 注册，when 不提供密码，then 不创建密码哈希', () => {
    it('should create user with null password_hash for OTP-only users', async () => {
      // Given: OTP 用户（无密码）
      // When: 创建用户不提供密码
      const user = await createUser(testPhone, 'parent');

      // Then: password_hash 应该为 null
      expect(user?.password_hash).toBeNull();
    });
  });
});
