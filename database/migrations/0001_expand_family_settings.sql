ALTER TABLE `family` ADD COLUMN `max_parents` integer DEFAULT 2 NOT NULL;
--> statement-breakpoint
ALTER TABLE `family` ADD COLUMN `max_children` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `family` ADD COLUMN `validity_months` integer DEFAULT 12 NOT NULL;
