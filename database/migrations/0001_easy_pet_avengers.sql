CREATE TABLE `pending_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`inviter_user_id` text NOT NULL,
	`family_id` text NOT NULL,
	`invited_phone` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pending_invitations_token_unique` ON `pending_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `idx_pending_invitations_token` ON `pending_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `idx_pending_invitations_family_id` ON `pending_invitations` (`family_id`);--> statement-breakpoint
CREATE INDEX `idx_pending_invitations_status` ON `pending_invitations` (`status`);--> statement-breakpoint
CREATE INDEX `idx_pending_invitations_expires` ON `pending_invitations` (`expires_at`);