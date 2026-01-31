ALTER TABLE `family` ADD COLUMN `previous_status` text;
--> statement-breakpoint
ALTER TABLE `family` ADD COLUMN `suspended_at` integer;
--> statement-breakpoint
ALTER TABLE `family` ADD COLUMN `suspended_by` text;
--> statement-breakpoint
ALTER TABLE `family` ADD COLUMN `deleted_at` integer;
--> statement-breakpoint
ALTER TABLE `family` ADD COLUMN `deleted_by` text;
