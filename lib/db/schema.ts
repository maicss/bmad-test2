import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Users table - stores all users (parents, children, admins)
 *
 * Key design decisions:
 * - phone: Plain text storage for SMS sending (OTP codes)
 * - phone_hash: Hashed storage for secure login queries
 * - password_hash: Hashed password (nullable - OTP-only users don't have password)
 * - role: Enum for role-based access control
 *
 * Source: Story 1.1 AC #4 - NFR9, NFR10
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull().unique(), // Plain text for SMS
  phone_hash: text('phone_hash').notNull(), // Hashed for login queries
  password_hash: text('password_hash'), // Hashed password (nullable for OTP-only users)
  role: text('role', { enum: ['parent', 'child', 'admin'] }).notNull().default('parent'),
  family_id: text('family_id').references(() => families.id, { onDelete: 'cascade' }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).$onUpdate(() => new Date()),
}, (table) => [
  index('idx_users_phone_hash').on(table.phone_hash),
  index('idx_users_family_id').on(table.family_id),
]);

/**
 * Families table - stores family information
 *
 * Key design decisions:
 * - primary_parent_id: Reference to the main parent who created the family
 * - created_at: Track when family was registered
 *
 * Source: Story 1.1 AC #2
 */
export const families = sqliteTable('families', {
  id: text('id').primaryKey(),
  primary_parent_id: text('primary_parent_id').references(() => users.id, { onDelete: 'restrict' }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).$onUpdate(() => new Date()),
}, (table) => [
  index('idx_families_primary_parent_id').on(table.primary_parent_id),
]);

/**
 * Audit logs table - tracks all user actions for compliance and security
 *
 * Key design decisions:
 * - user_id: Reference to user who performed the action
 * - action_type: Type of action (register, login, task_create, etc.)
 * - metadata: JSON blob for additional context
 * - ip_address: Track request origin for security
 *
 * Source: Story 1.1 AC #7 - NFR14
 */
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  action_type: text('action_type').notNull(),
  metadata: text('metadata', { mode: 'json' }), // JSON blob for additional context
  ip_address: text('ip_address'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
}, (table) => [
  index('idx_audit_logs_user_id').on(table.user_id),
  index('idx_audit_logs_action_type').on(table.action_type),
  index('idx_audit_logs_user_created').on(table.user_id, table.created_at),
]);

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
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type PendingInvitation = typeof pendingInvitations.$inferSelect;
export type NewPendingInvitation = typeof pendingInvitations.$inferInsert;
