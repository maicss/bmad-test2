CREATE TABLE `device_locks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`device_id` text NOT NULL,
	`lock_reason` text NOT NULL,
	`lock_start_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`lock_end_at` integer,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_device_locks_user_id` ON `device_locks` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_device_locks_device_id` ON `device_locks` (`device_id`);--> statement-breakpoint
CREATE INDEX `idx_device_locks_active` ON `device_locks` (`user_id`,`lock_end_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`device_id` text NOT NULL,
	`device_type` text NOT NULL,
	`user_agent` text,
	`ip_address` text,
	`last_activity_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`expires_at` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`remember_me` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_device_id` ON `sessions` (`device_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_token` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_sessions_user_active` ON `sessions` (`user_id`,`is_active`);--> statement-breakpoint
CREATE TABLE `task_plan_children` (
	`id` text PRIMARY KEY NOT NULL,
	`task_plan_id` text NOT NULL,
	`child_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`task_plan_id`) REFERENCES `task_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`child_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_task_plan_children_plan_id` ON `task_plan_children` (`task_plan_id`);--> statement-breakpoint
CREATE INDEX `idx_task_plan_children_child_id` ON `task_plan_children` (`child_id`);--> statement-breakpoint
CREATE TABLE `task_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`title` text NOT NULL,
	`task_type` text NOT NULL,
	`points` integer NOT NULL,
	`rule` text NOT NULL,
	`excluded_dates` text,
	`reminder_time` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_task_plans_family_id` ON `task_plans` (`family_id`);--> statement-breakpoint
CREATE INDEX `idx_task_plans_status` ON `task_plans` (`status`);--> statement-breakpoint
CREATE INDEX `idx_task_plans_created_by` ON `task_plans` (`created_by`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`task_plan_id` text,
	`assigned_child_id` text,
	`title` text NOT NULL,
	`task_type` text NOT NULL,
	`points` integer NOT NULL,
	`scheduled_date` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`completed_at` integer,
	`approved_by` text,
	`approved_at` integer,
	`rejection_reason` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_plan_id`) REFERENCES `task_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_child_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_family_id` ON `tasks` (`family_id`);--> statement-breakpoint
CREATE INDEX `idx_tasks_task_plan_id` ON `tasks` (`task_plan_id`);--> statement-breakpoint
CREATE INDEX `idx_tasks_assigned_child_id` ON `tasks` (`assigned_child_id`);--> statement-breakpoint
CREATE INDEX `idx_tasks_scheduled_date` ON `tasks` (`scheduled_date`);--> statement-breakpoint
CREATE INDEX `idx_tasks_status` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_family_scheduled` ON `tasks` (`family_id`,`scheduled_date`);--> statement-breakpoint
CREATE TABLE `user_session_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`device_id` text NOT NULL,
	`device_type` text NOT NULL,
	`device_name` text,
	`first_login_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`last_login_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`is_trusted` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_session_devices_device_id_unique` ON `user_session_devices` (`device_id`);--> statement-breakpoint
CREATE INDEX `idx_user_session_devices_user_id` ON `user_session_devices` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_session_devices_device_id` ON `user_session_devices` (`device_id`);--> statement-breakpoint
CREATE INDEX `idx_user_session_devices_trusted` ON `user_session_devices` (`user_id`,`is_trusted`);--> statement-breakpoint
ALTER TABLE `users` ADD `remember_me` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_suspended` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `suspended_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `suspended_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `users` ADD `suspended_reason` text;--> statement-breakpoint
ALTER TABLE `users` ADD `primary_parent_transfer_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_primary_transfer_at` integer;--> statement-breakpoint
CREATE INDEX `idx_users_is_suspended` ON `users` (`is_suspended`);--> statement-breakpoint
CREATE INDEX `idx_users_primary_transfer_count` ON `users` (`primary_parent_transfer_count`);--> statement-breakpoint
CREATE INDEX `idx_users_last_primary_transfer_at` ON `users` (`last_primary_transfer_at`);