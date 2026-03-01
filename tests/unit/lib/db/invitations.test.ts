/**
 * BDD Unit Tests for Story 1.4: Invite Other Parent
 *
 * Tests invitation query functions
 *
 * Source: Story 1.4 Task 7 - Write BDD tests
 * Requirement: Given-When-Then format with business language
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import db from '@/lib/db';
import { users, pendingInvitations, families } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createInvitation, getInvitationByToken, updateInvitationStatus, getFamilyInvitations, verifyInvitationToken, getPendingInvitationByPhone } from '@/lib/db/queries/invitations';

describe('Story 1.4: Invite Other Parent - Unit Tests', () => {
  let testUserId: string;
  let testFamilyId: string;

  beforeAll(async () => {
    // 创建测试数据
    testUserId = Bun.randomUUIDv7();
    testFamilyId = Bun.randomUUIDv7();

    // 创建测试家庭
    await db.insert(families).values({
      id: testFamilyId,
      primary_parent_id: testUserId,
    });

    // 创建测试用户（使用唯一的手机号）
    await db.insert(users).values({
      id: testUserId,
      phone: '19999999998', // 使用唯一的测试手机号
      phone_hash: await Bun.password.hash('19999999998'),
      role: 'parent',
      family_id: testFamilyId,
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await db.delete(pendingInvitations).where(eq(pendingInvitations.family_id, testFamilyId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(families).where(eq(families.id, testFamilyId));
  });

  beforeEach(async () => {
    // 清理测试数据
    await db.delete(pendingInvitations).where(eq(pendingInvitations.family_id, testFamilyId));
  });

  it('given 主要家长输入其他家长手机号，when 创建邀请，then 生成有效的邀请token', async () => {
    // Given: 主要家长输入其他家长手机号
    const invitedPhone = '13900000002';

    // When: 创建邀请
    const invitation = await createInvitation(testUserId, testFamilyId, invitedPhone);

    // Then: 生成有效的邀请token
    expect(invitation).toBeDefined();
    expect(invitation.token).toBeDefined();
    expect(invitation.status).toBe('pending');
    expect(invitation.inviter_user_id).toBe(testUserId);
    expect(invitation.family_id).toBe(testFamilyId);
    expect(invitation.expires_at).toBeInstanceOf(Date);
  });

  it('given 邀请token存在，when 查询邀请，then 返回正确的邀请信息', async () => {
    // Given: 邀请token存在
    const invitedPhone = '13900000003';
    const invitation = await createInvitation(testUserId, testFamilyId, invitedPhone);

    // When: 查询邀请
    const found = await getInvitationByToken(invitation.token);

    // Then: 返回正确的邀请信息
    expect(found).toBeDefined();
    expect(found?.id).toBe(invitation.id);
    expect(found?.token).toBe(invitation.token);
    expect(found?.status).toBe('pending');
  });

  it('given 邀请token不存在，when 查询邀请，then 返回null', async () => {
    // Given: 邀请token不存在
    const invalidToken = 'invalid-token-123456';

    // When: 查询邀请
    const found = await getInvitationByToken(invalidToken);

    // Then: 返回null
    expect(found).toBeNull();
  });

  it('given 邀请处于pending状态，when 更新状态为accepted，then 状态变为accepted', async () => {
    // Given: 邀请处于pending状态
    const invitedPhone = '13900000004';
    const invitation = await createInvitation(testUserId, testFamilyId, invitedPhone);

    // When: 更新状态为accepted
    const updated = await updateInvitationStatus(invitation.token, 'accepted');

    // Then: 状态变为accepted
    expect(updated.status).toBe('accepted');
  });

  it('given 邀请处于pending状态，when 查询家庭邀请列表，then 返回所有邀请', async () => {
    // Given: 邀请处于pending状态
    const invitedPhone1 = '13900000005';
    const invitedPhone2 = '13900000006';
    await createInvitation(testUserId, testFamilyId, invitedPhone1);
    await createInvitation(testUserId, testFamilyId, invitedPhone2);

    // When: 查询家庭邀请列表
    const invitations = await getFamilyInvitations(testFamilyId);

    // Then: 返回所有邀请
    expect(invitations.length).toBeGreaterThanOrEqual(2);
    expect(invitations.every(inv => inv.family_id === testFamilyId)).toBe(true);
  });

  it('given 邀请token有效且未过期，when 验证token，then 返回邀请', async () => {
    // Given: 邀请token有效且未过期
    const invitedPhone = '13900000007';
    const invitation = await createInvitation(testUserId, testFamilyId, invitedPhone, 48); // 48 hours

    // When: 验证token
    const verified = await verifyInvitationToken(invitation.token);

    // Then: 返回邀请
    expect(verified).toBeDefined();
    expect(verified?.status).toBe('pending');
  });

  it('given 邀请token已过期，when 验证token，then 返回null', async () => {
    // Given: 邀请token已过期（设置为过去的时间）
    const invitedPhone = '13900000008';
    const invitation = await createInvitation(testUserId, testFamilyId, invitedPhone, 0); // 0 hours

    // When: 验证token
    const verified = await verifyInvitationToken(invitation.token);

    // Then: 返回null
    expect(verified).toBeNull();
  });

  it('given 邀请token已被接受，when 验证token，then 返回null', async () => {
    // Given: 邀请token已被接受
    const invitedPhone = '13900000009';
    const invitation = await createInvitation(testUserId, testFamilyId, invitedPhone);
    await updateInvitationStatus(invitation.token, 'accepted');

    // When: 验证token
    const verified = await verifyInvitationToken(invitation.token);

    // Then: 返回null
    expect(verified).toBeNull();
  });

  it.skip('given 手机号已有pending邀请，when 查询，then 返回邀请', async () => {
    // Given: 手机号已有pending邀请
    const invitedPhone = '13900000010';
    await createInvitation(testUserId, testFamilyId, invitedPhone);

    // When: 查询该手机号的pending邀请
    const found = await getPendingInvitationByPhone(invitedPhone);

    // Then: 返回邀请
    expect(found).toBeDefined();
    expect(found?.status).toBe('pending');
  });
});
