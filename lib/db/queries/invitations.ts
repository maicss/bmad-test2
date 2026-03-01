import db from '../index';
import { pendingInvitations } from '../schema';
import { eq, and, lt, gte } from 'drizzle-orm';
import type { PendingInvitation, NewPendingInvitation } from '../schema';

/**
 * Query functions for pending_invitations table
 *
 * Source: AGENTS.md - All queries must be in lib/db/queries/ directory, per-table files
 * Source: Story 1.4 Task 2 - Create invitation query functions
 */

/**
 * Create new invitation
 *
 * Creates a new invitation record with encrypted phone number
 * Uses Bun.password.hash() for phone encryption
 *
 * @param inviterUserId - ID of the user sending the invitation
 * @param familyId - ID of the family
 * @param invitedPhone - Phone number to invite
 * @param expiresHours - Expiration time in hours (default: 24)
 * @returns Created invitation
 */
export async function createInvitation(
  inviterUserId: string,
  familyId: string,
  invitedPhone: string,
  expiresHours: number = 24
): Promise<PendingInvitation> {
  // Generate unique token (UUID + timestamp)
  const token = `${Bun.randomUUIDv7()}-${Date.now()}`;

  // Encrypt invited phone using Bun.password.hash()
  const invitedPhoneHash = await Bun.password.hash(invitedPhone);

  // Calculate expiration time
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresHours);

  const result = await db
    .insert(pendingInvitations)
    .values({
      id: Bun.randomUUIDv7(),
      token,
      inviter_user_id: inviterUserId,
      family_id: familyId,
      invited_phone: invitedPhoneHash,
      status: 'pending',
      created_at: new Date(),
      expires_at: expiresAt,
    })
    .returning() as any;

  const invitation = Array.isArray(result) && result.length > 0 ? result[0] as PendingInvitation : null;
  if (!invitation) {
    throw new Error('Failed to create invitation');
  }
  return invitation;
}

/**
 * Get invitation by token
 *
 * Fetches invitation by token and verifies status and expiration
 *
 * @param token - Invitation token
 * @returns Invitation or null
 */
export async function getInvitationByToken(token: string): Promise<PendingInvitation | null> {
  const result = await db
    .select()
    .from(pendingInvitations)
    .where(eq(pendingInvitations.token, token))
    .limit(1) as any;

  return Array.isArray(result) && result.length > 0 ? result[0] as PendingInvitation : null;
}

/**
 * Update invitation status
 *
 * Updates invitation status (e.g., pending -> accepted or expired)
 *
 * @param token - Invitation token
 * @param status - New status ('pending' | 'accepted' | 'expired')
 * @returns Updated invitation
 */
export async function updateInvitationStatus(
  token: string,
  status: 'pending' | 'accepted' | 'expired'
): Promise<PendingInvitation> {
  const result = await db
    .update(pendingInvitations)
    .set({ status })
    .where(eq(pendingInvitations.token, token))
    .returning() as any;

  const invitation = Array.isArray(result) && result.length > 0 ? result[0] as PendingInvitation : null;
  if (!invitation) {
    throw new Error('Failed to update invitation status');
  }
  return invitation;
}

/**
 * Get family invitations
 *
 * Fetches all invitations for a family
 *
 * @param familyId - Family ID
 * @returns List of invitations
 */
export async function getFamilyInvitations(familyId: string): Promise<PendingInvitation[]> {
  const result = await db
    .select()
    .from(pendingInvitations)
    .where(eq(pendingInvitations.family_id, familyId))
    .orderBy(pendingInvitations.created_at) as any;

  return Array.isArray(result) ? result as PendingInvitation[] : [];
}

/**
 * Verify invitation token is valid
 *
 * Checks if token exists, is pending, and not expired
 *
 * @param token - Invitation token
 * @returns Invitation if valid, null otherwise
 */
export async function verifyInvitationToken(token: string): Promise<PendingInvitation | null> {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return null; // Token not found
  }

  if (invitation.status !== 'pending') {
    return null; // Already used or expired
  }

  if (new Date() > new Date(invitation.expires_at)) {
    return null; // Expired
  }

  return invitation; // Valid
}

/**
 * Check if phone number already has a pending invitation
 *
 * @param phone - Phone number to check
 * @returns Pending invitation if exists, null otherwise
 */
export async function getPendingInvitationByPhone(phone: string): Promise<PendingInvitation | null> {
  // Encrypt phone number to match stored hash
  const phoneHash = await Bun.password.hash(phone);

  const result = await db
    .select()
    .from(pendingInvitations)
    .where(
      and(
        eq(pendingInvitations.invited_phone, phoneHash),
        eq(pendingInvitations.status, 'pending')
      )
    )
    .limit(1) as any;

  return Array.isArray(result) && result.length > 0 ? result[0] as PendingInvitation : null;
}
