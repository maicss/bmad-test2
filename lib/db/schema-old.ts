import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Verification table - stores OTP codes for phone verification
 *
 * Required by Better-Auth phone plugin for OTP management
 *
 * Source: Better-Auth phone plugin internal requirements
 */
export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))__).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))__).notNull(),
}, (table) => [
  index('idx_verification_identifier').on(table.identifier),
  index('idx_verification_expires_at').on(table.expiresAt),
]);

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
  phone: text('phone').notNull().unique(),
  phone_hash: text('phone_hash').notNull(),
  password_hash: text('password_hash'),
  role: text('role', { enum: ['parent', 'child', 'admin'] }).notNull().default('parent'),
  family_id: text('family_id').references(() => families.id, { onDelete: 'cascade' }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))__).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))__).notNull(),
  // Better-Auth phone plugin required fields
  phoneNumber: text('phoneNumber'),
  phoneNumberVerified: integer('phoneNumberVerified', { mode: 'boolean' }).default(false),
  name: text('name'),
  email: text('email'),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).default(false),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))__).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))__).notNull(),
}, (table) => [
  index('idx_users_phone_hash').on(table.phone_hash),
  index('idx_users_family_id').on(table.family_id),
]);

/**
 * Families table - stores family information
 *
 * Source: Story 1.1 AC #2
 */
export const families = sqliteTable('families', {
  id: text('id').primaryKey(),
  primary_parent_id: text('primary_parent_id').references(() => users.id, { onDelete: 'restrict' }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))__).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))__).notNull(),
}, (table) => [
  index('idx_families_primary_parent_id').on(table.primary_parent_id),
]);

/**
 * Audit logs table - tracks all user actions for compliance and security
 *
 * Source: Story 1.1 AC #7 - NFR14
 */
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  action_type: text('action_type').notNull(),
  metadata: text('metadata', { mode: 'json' }),
  ip_address: text('ip_address'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))__).notNull(),
}, (table) => [
  index('idx_audit_logs_user_id').on(table.user_id),
  index('idx_audit_logs_action_type').on(table.action_type),
  index('idx_audit_logs_user_created').on(table.user_id, table.created_at),
]);

/**
 * Pending Invitations table - stores family invitation tokens
 *
 * Source: Story 1.4 AC #2 - Invitation token management
 */
export const pendingInvitations = sqliteTable('pending_invitations', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  inviter_user_id: text('inviter_user_id').notNull(),
  family_id: text('family_id').notNull(),
  invited_phone: text('invited_phone').notNull(),
  status: text('status', { enum: ['pending', 'accepted', 'expired'] }).notNull().default('pending'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))__).notNull(),
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  index('idx_pending_invitations_token').on(table.token),
  index('idx_pending_invitations_family_id').on(table.family_id),
  index('idx_pending_invitations_status').on(table.status),
  index('idx_pending_invitations_expires').on(table.expires_at),
]);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type PendingInvitation = typeof pendingInvitations.$inferSelect;
export type NewPendingInvitation = typeof pendingInvitations.$inferInsert;

// Alias for Better-Auth compatibility
export const verifications = verification;
