import { db } from '@/lib/db';
import { users, sessions } from '@/lib/db/schema';
import { logUserAction } from '@/lib/db/queries/audit-logs';
import { eq, and } from 'drizzle-orm';

/**
 * Account management service
 *
 * Story 1.7: Primary Parent Manage Members - Task 4
 *
 * Handles account suspension and resumption logic
 */

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

  // Prevent self-suspension
  if (targetUserId === suspenderId) {
    throw new Error('不能挂起自己的账户');
  }

  // Update user suspension status
  const [updatedUser] = await db
    .update(users)
    .set({
      is_suspended: 1,
      suspended_at: new Date(now * 1000),
      suspended_by: suspenderId,
      suspended_reason: reason,
    })
    .where(eq(users.id, targetUserId))
    .returning();

  if (!updatedUser) {
    return null;
  }

  // Invalidate all active sessions for suspended user (AC #7)
  await db
    .update(sessions)
    .set({ is_active: false })
    .where(
      and(
        eq(sessions.user_id, targetUserId),
        eq(sessions.is_active, 1)
      )
    );

  // Log suspension to audit logs (NFR14)
  await logUserAction(suspenderId, 'suspend_user', {
    target_user_id: targetUserId,
    reason,
    suspended_at: new Date(now * 1000),
  });

  return updatedUser;
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
  // Verify resumer is primary parent
  const [resumer] = await db
    .select()
    .from(users)
    .where(eq(users.id, resumerId));

  if (!resumer || resumer.role !== 'parent') {
    throw new Error('只有主要家长可以恢复成员');
  }

  // Update user suspension status
  const [updatedUser] = await db
    .update(users)
    .set({
      is_suspended: 0,
      suspended_at: null,
      suspended_by: null,
      suspended_reason: null,
    })
    .where(eq(users.id, targetUserId))
    .returning();

  if (!updatedUser) {
    return null;
  }

  // Log resumption to audit logs (NFR14)
  await logUserAction(resumerId, 'resume_user', {
    target_user_id: targetUserId,
    resumed_at: new Date(Date.now()),
  });

  return updatedUser;
}

/**
 * Check if user account is suspended
 *
 * @param userId - User ID
 * @returns True if suspended
 */
export async function isUserSuspended(userId: string): Promise<boolean> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return false;
  }

  return user.is_suspended === 1 || user.is_suspended === true;
}

/**
 * Get user suspension details
 *
 * @param userId - User ID
 * @returns Suspension info or null
 */
export async function getUserSuspensionInfo(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      is_suspended: users.is_suspended,
      suspended_at: users.suspended_at,
      suspended_by: users.suspended_by,
      suspended_reason: users.suspended_reason,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user || !user.is_suspended) {
    return null;
  }

  return user;
}
