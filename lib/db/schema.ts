import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_verification_identifier').on(table.identifier),
  index('idx_verification_expires_at').on(table.expiresAt),
]);

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull().unique(),
  phone_hash: text('phone_hash').notNull(),
  password_hash: text('password_hash'),
  role: text('role', { enum: ['parent', 'child', 'admin'] }).notNull().default('parent'),
  family_id: text('family_id').references(() => families.id, { onDelete: 'cascade' }),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  phoneNumber: text('phoneNumber'),
  phoneNumberVerified: integer('phoneNumberVerified').default(0),
  name: text('name'),
  email: text('email'),
  emailVerified: integer('emailVerified').default(0),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_users_phone_hash').on(table.phone_hash),
  index('idx_users_family_id').on(table.family_id),
]);

export const families = sqliteTable('families', {
  id: text('id').primaryKey(),
  primary_parent_id: text('primary_parent_id').references(() => users.id, { onDelete: 'restrict' }),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_families_primary_parent_id').on(table.primary_parent_id),
]);

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  action_type: text('action_type').notNull(),
  metadata: text('metadata'),
  ip_address: text('ip_address'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_audit_logs_user_id').on(table.user_id),
  index('idx_audit_logs_action_type').on(table.action_type),
  index('idx_audit_logs_user_created').on(table.user_id, table.created_at),
]);

export const pendingInvitations = sqliteTable('pending_invitations', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  inviter_user_id: text('inviter_user_id').notNull(),
  family_id: text('family_id').notNull(),
  invited_phone: text('invited_phone').notNull(),
  status: text('status', { enum: ['pending', 'accepted', 'expired'] }).notNull().default('pending'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
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
