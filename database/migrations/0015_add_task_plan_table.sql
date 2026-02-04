-- Migration: Add task_plan table
-- This migration creates the new task_plan table to replace task_definition

CREATE TABLE `task_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`is_template` integer DEFAULT false NOT NULL,
	`family_id` text,
	`name` text NOT NULL,
	`description` text,
	`task_name` text NOT NULL,
	`category` text,
	`points` real NOT NULL,
	`target_member_ids` text,
	`image_type` text DEFAULT 'icon' NOT NULL,
	`color` text,
	`image` text,
	`border_style` text DEFAULT 'circle' NOT NULL,
	`start_date` text,
	`end_date` text,
	`date_strategy_id` text,
	`enable_combo` integer DEFAULT false NOT NULL,
	`combo_strategy_type` text,
	`combo_strategy_config` text,
	`medal_template_id` text,
	`task_type` text DEFAULT 'daily' NOT NULL,
	`age_range_min` integer,
	`age_range_max` integer,
	`is_public` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`template_id` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`date_strategy_id`) REFERENCES `date_strategy`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`medal_template_id`) REFERENCES `medal_template`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

--> statement-breakpoint
CREATE INDEX `task_plan_family_id_idx` ON `task_plan` (`family_id`);