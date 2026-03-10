CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user_id` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notifications_is_read` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_notifications_user_created` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `task_plans` ADD `paused_until` integer;--> statement-breakpoint
ALTER TABLE `task_plans` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `idx_task_plans_deleted_at` ON `task_plans` (`deleted_at`);--> statement-breakpoint
ALTER TABLE `tasks` ADD `is_manual` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `proof_image` text;--> statement-breakpoint
CREATE INDEX `idx_tasks_is_manual` ON `tasks` (`is_manual`);