/**
 * Invitation Cleanup Service
 *
 * Marks expired invitations as 'expired'
 * Runs daily via cron job
 *
 * Source: Story 1.4 Task 6 - Implement invitation status cleanup
 */

import { updateInvitationStatus, getFamilyInvitations } from '@/lib/db/queries/invitations';
import { logUserAction } from '@/lib/db/queries/audit-logs';

/**
 * Expire pending invitations
 *
 * Marks invitations as 'expired' if they have been pending for more than 24 hours
 *
 * @param familyId - Family ID to clean up (optional, if not provided, cleans all)
 * @returns Number of expired invitations
 */
export async function expirePendingInvitations(familyId?: string): Promise<number> {
  try {
    // Get pending invitations
    const invitations = familyId
      ? await getFamilyInvitations(familyId)
      : []; // TODO: Get all pending invitations if no familyId provided

    let expiredCount = 0;

    for (const invitation of invitations) {
      // Check if invitation is pending
      if (invitation.status !== 'pending') {
        continue;
      }

      // Check if invitation has expired (24 hours)
      const expirationTime = new Date(invitation.expires_at);
      const now = new Date();

      if (now > expirationTime) {
        // Mark as expired
        await updateInvitationStatus(invitation.token, 'expired');
        await logUserAction(invitation.inviter_user_id, 'invitation_expired', {
          family_id: invitation.family_id,
          invited_phone_hash: invitation.invited_phone,
          invitation_token: invitation.token,
          expired_at: expirationTime,
        });
        expiredCount++;
      }
    }

    console.log(`[CLEANUP] Expired ${expiredCount} invitations`);
    return expiredCount;
  } catch (error) {
    console.error('[CLEANUP] Error expiring invitations:', error);
    throw error;
  }
}

/**
 * Cleanup job entry point
 *
 * Called by cron job to run cleanup
 */
export async function runCleanupJob(): Promise<void> {
  console.log('[CLEANUP] Starting invitation cleanup job...');

  try {
    const expiredCount = await expirePendingInvitations();

    console.log(`[CLEANUP] Cleanup job completed. Expired: ${expiredCount}`);
  } catch (error) {
    console.error('[CLEANUP] Cleanup job failed:', error);
    throw error;
  }
}
