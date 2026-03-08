import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
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
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  phoneNumber: text('phoneNumber'),
  phoneNumberVerified: integer('phoneNumberVerified').default(0),
  name: text('name'),
  email: text('email'),
  emailVerified: integer('emailVerified').default(0),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  remember_me: integer('remember_me', { mode: 'boolean' }).notNull().default(false),
  // Story 1.7: Account suspension fields
  is_suspended: integer('is_suspended', { mode: 'boolean' }).notNull().default(false),
  suspended_at: integer('suspended_at', { mode: 'timestamp' }),
  suspended_by: text('suspended_by').references(() => users.id),
  suspended_reason: text('suspended_reason'),
  // Story 1.7: Primary role transfer tracking fields
  primary_parent_transfer_count: integer('primary_parent_transfer_count').notNull().default(0),
  last_primary_transfer_at: integer('last_primary_transfer_at', { mode: 'timestamp' }),
}, (table) => [
  index('idx_users_phone_hash').on(table.phone_hash),
  index('idx_users_family_id').on(table.family_id),
  index('idx_users_is_suspended').on(table.is_suspended),
  index('idx_users_primary_transfer_count').on(table.primary_parent_transfer_count),
  index('idx_users_last_primary_transfer_at').on(table.last_primary_transfer_at),
]);

export const families = sqliteTable('families', {
  id: text('id').primaryKey(),
  primary_parent_id: text('primary_parent_id').references(() => users.id, { onDelete: 'restrict' }),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_families_primary_parent_id').on(table.primary_parent_id),
]);

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  action_type: text('action_type').notNull(),
  metadata: text('metadata'),
  ip_address: text('ip_address'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
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
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  index('idx_pending_invitations_token').on(table.token),
  index('idx_pending_invitations_family_id').on(table.family_id),
  index('idx_pending_invitations_status').on(table.status),
  index('idx_pending_invitations_expires').on(table.expires_at),
]);

// Sessions table for multi-device login (Story 1.6)
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  device_id: text('device_id').notNull(),
  device_type: text('device_type', { enum: ['mobile', 'tablet', 'desktop'] }).notNull(),
  user_agent: text('user_agent'),
  ip_address: text('ip_address'),
  last_activity_at: integer('last_activity_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  remember_me: integer('remember_me', { mode: 'boolean' }).notNull().default(false),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_sessions_user_id').on(table.user_id),
  index('idx_sessions_device_id').on(table.device_id),
  index('idx_sessions_token').on(table.token),
  index('idx_sessions_expires_at').on(table.expires_at),
  index('idx_sessions_user_active').on(table.user_id, table.is_active),
]);

// User session devices for device verification (Story 1.6)
export const userSessionDevices = sqliteTable('user_session_devices', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  device_id: text('device_id').notNull().unique(),
  device_type: text('device_type', { enum: ['mobile', 'tablet', 'desktop'] }).notNull(),
  device_name: text('device_name'),
  first_login_at: integer('first_login_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  last_login_at: integer('last_login_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  is_trusted: integer('is_trusted', { mode: 'boolean' }).notNull().default(false),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_user_session_devices_user_id').on(table.user_id),
  index('idx_user_session_devices_device_id').on(table.device_id),
  index('idx_user_session_devices_trusted').on(table.user_id, table.is_trusted),
]);

// Device locks for rate limiting (Story 1.6)
export const deviceLocks = sqliteTable('device_locks', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  device_id: text('device_id').notNull(),
  lock_reason: text('lock_reason', { enum: ['rate_limit', 'security', 'suspicious'] }).notNull(),
  lock_start_at: integer('lock_start_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  lock_end_at: integer('lock_end_at', { mode: 'timestamp' }),
  failed_attempts: integer('failed_attempts').notNull().default(0),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_device_locks_user_id').on(table.user_id),
  index('idx_device_locks_device_id').on(table.device_id),
  index('idx_device_locks_active').on(table.user_id, table.lock_end_at),
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
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type UserSessionDevice = typeof userSessionDevices.$inferSelect;
export type NewUserSessionDevice = typeof userSessionDevices.$inferInsert;
export type DeviceLock = typeof deviceLocks.$inferSelect;
export type NewDeviceLock = typeof deviceLocks.$inferInsert;

// Alias for Better-Auth compatibility
export const verifications = verification;

// Task Plans table (Story 2.1)
// Stores task plan templates created by parents
// Story 2.5: Added paused/deleted status support
export const taskPlans = sqliteTable('task_plans', {
  id: text('id').primaryKey(),
  family_id: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  title: text('title').notNull(), // Template name, max 50 chars
  task_type: text('task_type', { enum: ['刷牙', '学习', '运动', '家务', '自定义'] }).notNull(),
  points: integer('points').notNull(), // 1-100
  rule: text('rule').notNull(), // JSON: stores date strategy (daily/weekly/weekdays/weekends/custom)
  excluded_dates: text('excluded_dates'), // JSON array: optional date strings
  reminder_time: text('reminder_time'), // Optional: time string (HH:mm format)
  status: text('status', { enum: ['draft', 'published', 'paused'] }).notNull().default('draft'), // Story 2.5: Added 'paused'
  paused_until: integer('paused_until', { mode: 'timestamp' }), // Story 2.5: Pause expiry timestamp (null = permanent)
  deleted_at: integer('deleted_at', { mode: 'timestamp' }), // Story 2.5: Soft delete timestamp (null = not deleted)
  created_by: text('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_task_plans_family_id').on(table.family_id),
  index('idx_task_plans_status').on(table.status),
  index('idx_task_plans_created_by').on(table.created_by),
  index('idx_task_plans_deleted_at').on(table.deleted_at), // Story 2.5: Index for soft delete queries
]);

// Tasks table (Story 2.1, 2.4)
// Stores concrete task instances generated from task plans
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  family_id: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  task_plan_id: text('task_plan_id').references(() => taskPlans.id, { onDelete: 'cascade' }),
  assigned_child_id: text('assigned_child_id').references(() => users.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  task_type: text('task_type', { enum: ['刷牙', '学习', '运动', '家务', '自定义'] }).notNull(),
  points: integer('points').notNull(),
  scheduled_date: text('scheduled_date').notNull(), // YYYY-MM-DD format
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'approved', 'rejected', 'skipped'] }).notNull().default('pending'),
  completed_at: integer('completed_at', { mode: 'timestamp' }),
  approved_by: text('approved_by').references(() => users.id, { onDelete: 'restrict' }),
  approved_at: integer('approved_at', { mode: 'timestamp' }),
  rejection_reason: text('rejection_reason'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_tasks_family_id').on(table.family_id),
  index('idx_tasks_task_plan_id').on(table.task_plan_id),
  index('idx_tasks_assigned_child_id').on(table.assigned_child_id),
  index('idx_tasks_scheduled_date').on(table.scheduled_date),
  index('idx_tasks_status').on(table.status),
  index('idx_tasks_family_scheduled').on(table.family_id, table.scheduled_date),
]);

// Task Plan Children junction table (Story 2.1)
// Stores many-to-many relationship between task plans and children
export const taskPlanChildren = sqliteTable('task_plan_children', {
  id: text('id').primaryKey(),
  task_plan_id: text('task_plan_id').notNull().references(() => taskPlans.id, { onDelete: 'cascade' }),
  child_id: text('child_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_task_plan_children_plan_id').on(table.task_plan_id),
  index('idx_task_plan_children_child_id').on(table.child_id),
]);

// Points Balances table (Story 2.2)
// Stores current points balance for each child
export const pointBalances = sqliteTable('point_balances', {
  id: text('id').primaryKey(),
  child_id: text('child_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  balance: integer('balance').notNull().default(0),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_point_balances_child_id').on(table.child_id),
]);

// Points History table (Story 2.2)
// Stores all points changes for auditing and COPPA/GDPR compliance
export const pointsHistory = sqliteTable('points_history', {
  id: text('id').primaryKey(),
  child_id: text('child_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  task_id: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  points: integer('points').notNull(),
  type: text('type', { enum: ['task_completion', 'task_rejection', 'adjustment', 'reward', 'penalty'] }).notNull(),
  description: text('description'),
  previous_balance: integer('previous_balance').notNull().default(0),
  new_balance: integer('new_balance').notNull().default(0),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().default(sql `(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_points_history_child_id').on(table.child_id),
  index('idx_points_history_task_id').on(table.task_id),
  index('idx_points_history_created_at').on(table.created_at),
]);

// Type exports for task-related tables
export type TaskPlan = typeof taskPlans.$inferSelect;
export type NewTaskPlan = typeof taskPlans.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskPlanChild = typeof taskPlanChildren.$inferSelect;
export type NewTaskPlanChild = typeof taskPlanChildren.$inferInsert;
export type PointsBalance = typeof pointBalances.$inferSelect;
export type NewPointsBalance = typeof pointBalances.$inferInsert;
export type PointsHistory = typeof pointsHistory.$inferSelect;
export type NewPointsHistory = typeof pointsHistory.$inferInsert;
