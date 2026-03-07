CREATE TABLE `point_balances` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_point_balances_child_id` ON `point_balances` (`child_id`);--> statement-breakpoint
CREATE TABLE `points_history` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`task_id` text,
	`points` integer NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`previous_balance` integer DEFAULT 0 NOT NULL,
	`new_balance` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_points_history_child_id` ON `points_history` (`child_id`);--> statement-breakpoint
CREATE INDEX `idx_points_history_task_id` ON `points_history` (`task_id`);--> statement-breakpoint
CREATE INDEX `idx_points_history_created_at` ON `points_history` (`created_at`);