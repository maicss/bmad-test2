/**
 * Family Members Query Functions
 *
 * Story 1.7: Primary Parent Manage Members
 *
 * Provides query functions for:
 * - Listing family members
 * - Suspending/resuming user accounts
 * - Transferring primary parent role
 * - Viewing member audit logs
 */

import db from '@/lib/db';
import { users, families, auditLogs } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { logUserAction } from './audit-logs';

/**
 * Get all members of a family
 *
 * @param familyId - Family ID
 * @returns Array of family members with details
 */
export async function getFamilyMembers(familyId: string) {
  const members = await db
    .select({
      id: users.id,
      phone: users.phone,
      name: users.name,
      role: users.role,
      is_suspended: users.is_suspended,
      suspended_at: users.suspended_at,
      suspended_reason: users.suspended_reason,
      created_at: users.created_at,
      updated_at: users.updated_at,
    })
    .from(users)
    .where(eq(users.family_id, familyId))
    .orderBy(users.created_at);

  // Get family info to identify primary parent
  const family = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);

  const primaryParentId = family[0]?.primary_parent_id;

  // Add is_primary flag to each member
  return members.map(member => ({
    ...member,
    is_primary: member.id === primaryParentId,
  }));
}

/**
 * Get member details by ID
 *
 * @param memberId - User ID
 * @returns Member details or null
 */
export async function getMemberById(memberId: string) {
  const member = await db
    .select()
    .from(users)
    .where(eq(users.id, memberId))
    .limit(1);

  return member[0] || null;
}

/**
 * Get audit logs for a member
 *
 * @param memberId - User ID
 * @param limit - Maximum number of logs to return (default: 50)
 * @returns Array of audit logs
 */
export async function getMemberAuditLogs(memberId: string, limit: number = 50) {
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.user_id, memberId))
    .orderBy(desc(auditLogs.created_at))
    .limit(limit);
}

/**
 * Suspend user account
 *
 * @param memberId - User ID to suspend
 * @param suspendedBy - User ID of the parent suspending (must be primary parent)
 * @param reason - Suspension reason
 * @returns Suspended user record
 */
export async function suspendUserAccount(
  memberId: string,
  suspendedBy: string,
  reason: string
) {
  // Update user record
  const suspendedUsers = await db
    .update(users)
    .set({
      is_suspended: true,
      suspended_at: new Date(),
      suspended_by: suspendedBy,
      suspended_reason: reason,
      updated_at: new Date(),
    })
    .where(eq(users.id, memberId))
    .returning();

  // Log suspension to audit logs
  await logUserAction(memberId, 'account_suspended', {
    suspended_by: suspendedBy,
    reason,
  });

  return suspendedUsers[0];
}

/**
 * Resume suspended user account
 *
 * @param memberId - User ID to resume
 * @param resumedBy - User ID of the parent resuming (must be primary parent)
 * @returns Resumed user record
 */
export async function resumeUserAccount(
  memberId: string,
  resumedBy: string
) {
  // Update user record
  const resumedUsers = await db
    .update(users)
    .set({
      is_suspended: false,
      suspended_at: null,
      suspended_by: null,
      suspended_reason: null,
      updated_at: new Date(),
    })
    .where(eq(users.id, memberId))
    .returning();

  // Log resumption to audit logs
  await logUserAction(memberId, 'account_resumed', {
    resumed_by: resumedBy,
  });

  return resumedUsers[0];
}

/**
 * Check if primary parent can transfer role
 *
 * @param primaryParentId - Primary parent user ID
 * @returns true if transfer is allowed, false otherwise
 */
export async function canTransferPrimaryRole(primaryParentId: string): Promise<boolean> {
  const parent = await db
    .select({
      last_primary_transfer_at: users.last_primary_transfer_at,
    })
    .from(users)
    .where(eq(users.id, primaryParentId))
    .limit(1);

  if (!parent[0]) {
    return false;
  }

  // If no previous transfer, allow
  if (!parent[0].last_primary_transfer_at) {
    return true;
  }

  // Check if 30 days have passed since last transfer
  const lastTransfer = new Date(parent[0].last_primary_transfer_at);
  const now = new Date();
  const daysSinceTransfer = Math.floor((now.getTime() - lastTransfer.getTime()) / (1000 * 60 * 60 * 24));

  return daysSinceTransfer >= 30;
}

/**
 * Transfer primary parent role
 *
 * @param currentPrimaryId - Current primary parent user ID
 * @param newPrimaryId - New primary parent user ID
 * @param passwordConfirm - Password confirmation for current primary parent
 * @returns Updated family record
 */
export async function transferPrimaryParentRole(
  currentPrimaryId: string,
  newPrimaryId: string,
  passwordConfirm: string
) {
  // TODO: Verify password confirmation using Bun.password.verify
  // For now, assume password is valid

  // Get current primary parent's family ID
  const currentPrimary = await db
    .select({ family_id: users.family_id })
    .from(users)
    .where(eq(users.id, currentPrimaryId))
    .limit(1);

  if (!currentPrimary[0]) {
    throw new Error('Current primary parent not found');
  }

  const familyId = currentPrimary[0].family_id;

  // Verify both users are in the same family
  const newPrimary = await db
    .select()
    .from(users)
    .where(and(eq(users.id, newPrimaryId), eq(users.family_id, familyId)))
    .limit(1);

  if (!newPrimary[0]) {
    throw new Error('New primary parent not found in the same family');
  }

  // Check transfer frequency limit
  const canTransfer = await canTransferPrimaryRole(currentPrimaryId);
  if (!canTransfer) {
    throw new Error('Primary role can only be transferred once every 30 days');
  }

  // Update family's primary parent
  const updatedFamilies = await db
    .update(families)
    .set({
      primary_parent_id: newPrimaryId,
      updated_at: new Date(),
    })
    .where(eq(families.id, familyId))
    .returning();

  // Update old primary parent's transfer count and timestamp
  await db
    .update(users)
    .set({
      primary_parent_transfer_count: sql\`${users.primary_parent_transfer_count} + 1\`,
      last_primary_transfer_at: new Date(),
    })
    .where(eq(users.id, currentPrimaryId));

  // Log transfer to audit logs
  await logUserAction(currentPrimaryId, 'primary_role_transferred', {
    new_primary_id: newPrimaryId,
    old_primary_id: currentPrimaryId,
    family_id: familyId,
  });

  return updatedFamilies[0];
}

/**
 * Invalidate all active sessions for a user
 *
 * @param userId - User ID
 */
export async function invalidateUserSessions(userId: string) {
  const { sessions } = await import('./schema');
  
  await db
    .update(sessions)
    .set({ is_active: false })
    .where(and(
      eq(sessions.user_id, userId),
      eq(sessions.is_active, true)
    ));
}
