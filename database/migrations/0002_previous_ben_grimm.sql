CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_verification_identifier` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `idx_verification_expires_at` ON `verification` (`expires_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_families` (
	`id` text PRIMARY KEY NOT NULL,
	`primary_parent_id` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`primary_parent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_families`("id", "primary_parent_id", "created_at", "updated_at") SELECT "id", "primary_parent_id", "created_at", "updated_at" FROM `families`;--> statement-breakpoint
DROP TABLE `families`;--> statement-breakpoint
ALTER TABLE `__new_families` RENAME TO `families`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_families_primary_parent_id` ON `families` (`primary_parent_id`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`phone_hash` text NOT NULL,
	`password_hash` text,
	`role` text DEFAULT 'parent' NOT NULL,
	`family_id` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`phoneNumber` text,
	`phoneNumberVerified` integer DEFAULT 0,
	`name` text,
	`email` text,
	`emailVerified` integer DEFAULT 0,
	`image` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "phone", "phone_hash", "password_hash", "role", "family_id", "created_at", "updated_at", "phoneNumber", "phoneNumberVerified", "name", "email", "emailVerified", "image", "createdAt", "updatedAt") SELECT "id", "phone", "phone_hash", "password_hash", "role", "family_id", "created_at", "updated_at", "phoneNumber", "phoneNumberVerified", "name", "email", "emailVerified", "image", "createdAt", "updatedAt" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE INDEX `idx_users_phone_hash` ON `users` (`phone_hash`);--> statement-breakpoint
CREATE INDEX `idx_users_family_id` ON `users` (`family_id`);