import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Pending Invitations table - stores family invitation tokens
 *
 * Key design decisions:
 * - token: UUID + timestamp for uniqueness
 * - invited_phone: Encrypted using Bun.password.hash() for security
 * - status: Enum for tracking invitation state
 * - expires_at: Automatic expiration (24 hours)
 *
 * Source: Story 1.4 AC #2 - Invitation token management
 */
export const pendingInvitations = sqliteTable('pending_invitations', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(), // UUID + timestamp for uniqueness
  inviter_user_id: text('inviter_user_id').notNull(), // Reference to users.id
  family_id: text('family_id').notNull(), // Reference to families.id
  invited_phone: text('invited_phone').notNull(), // Encrypted phone number
  status: text('status', { enum: ['pending', 'accepted', 'expired'] }).notNull().default('pending'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(), // 24 hours from creation
}, (table) => [
  index('idx_pending_invitations_token').on(table.token),
  index('idx_pending_invitations_family_id').on(table.family_id),
  index('idx_pending_invitations_status').on(table.status),
  index('idx_pending_invitations_expires').on(table.expires_at),
]);

// Type exports for use in query functions and API endpoints
export type PendingInvitation = typeof pendingInvitations.$inferSelect;
export type NewPendingInvitation = typeof pendingInvitations.$inferInsert;
