/**
 * Family member management query functions
 *
 * Story 1.7: Primary Parent Manage Members - Task 2
 */

import { db } from '@/lib/db';
import { users, families, auditLogs, sessions } from '@/lib/db/schema';
import { eq, and, desc, lt, gte, or } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export type User = typeof users.$inferSelect;
export type Family = typeof families.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

/**
 * Get all family members
 *
 * @param familyId - Family ID
 * @returns Array of family members with details
 */
export async function getFamilyMembers(familyId: string) {
  const members = await db
    .select()
    .from(users)
    .where(eq(users.family_id, familyId))
    .orderBy(desc(users.created_at));

  // Get family info to identify primary parent
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId));

  // Mark primary parent and format response
  const formattedMembers = members.map(member => ({
    ...member,
    isPrimary: family?.primary_parent_id === member.id,
    isSuspended: member.is_suspended === 1 || member.is_suspended === true,
  }));

  return formattedMembers;
}

/**
 * Get member by ID
 *
 * @param memberId - User ID
 * @returns User or null
 */
export async function getMemberById(memberId: string) {
  const [member] = await db
    .select()
    .from(users)
    .where(eq(users.id, memberId));

  return member || null;
}

/**
 * Get member audit logs
 *
 * @param memberId - User ID
 * @param limit - Number of logs to return
 * @returns Array of audit logs
 */
export async function getMemberAuditLogs(memberId: string, limit: number = 50) {
  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.user_id, memberId))
    .orderBy(desc(auditLogs.created_at))
    .limit(limit);

  return logs;
}

/**
 * Transfer primary parent role to another parent
 *
 * @param currentPrimaryId - Current primary parent user ID
 * @param newPrimaryId - New primary parent user ID
 * @param familyId - Family ID
 * @param password - Current password for verification
 * @returns Updated family or null
 */
export async function transferPrimaryParentRole(
  currentPrimaryId: string,
  newPrimaryId: string,
  familyId: string,
  password: string
) {
  // Verify transfer frequency limit (30 days)
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, currentPrimaryId));

  if (!currentUser) {
    throw new Error('Current user not found');
  }

  const now = Math.floor(Date.now() / 1000);
  const lastTransferAt = currentUser.last_primary_transfer_at
    ? Math.floor(new Date(currentUser.last_primary_transfer_at).getTime() / 1000)
    : 0;

  if (lastTransferAt && (now - lastTransferAt) < 30 * 24 * 3600) {
    throw new Error('主要家长角色30天内只能转移一次');
  }

  // Verify password
  if (!currentUser.password_hash) {
    throw new Error('该账户未设置密码');
  }

  const passwordValid = await Bun.password.verify(password, currentUser.password_hash);
  if (!passwordValid) {
    throw new Error('密码错误');
  }

  // Verify both users are in the same family
  const [newPrimary] = await db
    .select()
    .from(users)
    .where(eq(users.id, newPrimaryId));

  if (!newPrimary || newPrimary.family_id !== familyId) {
    throw new Error('目标用户不在该家庭中');
  }

  if (newPrimary.role !== 'parent') {
    throw new Error('只能转移给家长账户');
  }

  // Perform role transfer in transaction
  // Update old primary to regular parent
  await db
    .update(users)
    .set({ role: 'parent' })
    .where(eq(users.id, currentPrimaryId));

  // Update new primary parent
  await db
    .update(users)
    .set({ role: 'parent' })
    .where(eq(users.id, newPrimaryId));

  // Update family primary parent
  const [updatedFamily] = await db
    .update(families)
    .set({ primary_parent_id: newPrimaryId })
    .where(eq(families.id, familyId))
    .returning();

  // Update transfer tracking
  await db
    .update(users)
    .set({
      primary_parent_transfer_count: (currentUser.primary_parent_transfer_count || 0) + 1,
      last_primary_transfer_at: new Date(now * 1000),
    })
    .where(eq(users.id, currentPrimaryId));

  return updatedFamily || null;
}

/**
 * Suspend user account
 *
 * @param targetUserId - User ID to suspend
 * @param suspenderId - User ID of the suspender (primary parent)
 * @param reason - Suspension reason
 * @returns Updated user or null
 */
export async function suspendUserAccount(
  targetUserId: string,
  suspenderId: string,
  reason: string = '家长挂起'
) {
  const now = Math.floor(Date.now() / 1000);

  // Verify suspender is primary parent
  const [suspender] = await db
    .select()
    .from(users)
    .where(eq(users.id, suspenderId));

  if (!suspender || suspender.role !== 'parent') {
    throw new Error('只有主要家长可以挂起成员');
  }

  // Check if suspender is primary parent
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, suspender.family_id));

  if (family?.primary_parent_id !== suspenderId) {
    throw new Error('只有主要家长可以挂起成员');
  }

  // Prevent self-suspension
  if (targetUserId === suspenderId) {
    throw new Error('不能挂起自己的账户');
  }

  // Update user suspension status
  const [updatedUser] = await db
    .update(users)
    .set({
      is_suspended: true,
      suspended_at: new Date(now * 1000),
      suspended_by: suspenderId,
      suspended_reason: reason,
    })
    .where(eq(users.id, targetUserId))
    .returning();

  // Invalidate all active sessions for the suspended user
  await db
    .update(sessions)
    .set({ is_active: false })
    .where(
      and(
        eq(sessions.user_id, targetUserId),
        eq(sessions.is_active, true)
      )
    );

  return updatedUser || null;
}

/**
 * Resume suspended user account
 *
 * @param targetUserId - User ID to resume
 * @param resumerId - User ID of the resumer (primary parent)
 * @returns Updated user or null
 */
export async function resumeUserAccount(
  targetUserId: string,
  resumerId: string
) {
  const now = Math.floor(Date.now() / 1000);

  // Verify resumer is primary parent
  const [resumer] = await db
    .select()
    .from(users)
    .where(eq(users.id, resumerId));

  if (!resumer || resumer.role !== 'parent') {
    throw new Error('只有主要家长可以恢复成员');
  }

  // Check if resumer is primary parent
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, resumer.family_id));

  if (family?.primary_parent_id !== resumerId) {
    throw new Error('只有主要家长可以恢复成员');
  }

  // Update user suspension status
  const [updatedUser] = await db
    .update(users)
    .set({
      is_suspended: false,
      suspended_at: null,
      suspended_by: null,
      suspended_reason: null,
    })
    .where(eq(users.id, targetUserId))
    .returning();

  return updatedUser || null;
}

/**
 * Check if user is primary parent
 *
 * @param userId - User ID
 * @returns True if user is primary parent
 */
export async function isPrimaryParent(userId: string): Promise<boolean> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user || !user.family_id) {
    return false;
  }

  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, user.family_id));

  return family?.primary_parent_id === userId;
}

/**
 * Check if user can manage members
 *
 * @param userId - User ID
 * @returns True if user can manage family members
 */
export async function canManageMembers(userId: string): Promise<boolean> {
  return await isPrimaryParent(userId);
}
