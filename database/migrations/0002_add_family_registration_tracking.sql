ALTER TABLE `family` ADD COLUMN `registration_type` text DEFAULT 'self' NOT NULL;
--> statement-breakpoint
ALTER TABLE `family` ADD COLUMN `status` text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE `family` ADD COLUMN `submitted_at` integer;
--> statement-breakpoint
ALTER TABLE `family` ADD COLUMN `reviewed_at` integer;
--> statement-breakpoint
ALTER TABLE `family` ADD COLUMN `reviewed_by` text;
--> statement-breakpoint
ALTER TABLE `family` ADD COLUMN `rejection_reason` text;
