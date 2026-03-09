-- Story 2.7: Add proof_image column to tasks table
-- Stores task completion proof images (Base64 or URL)

ALTER TABLE `tasks` ADD COLUMN `proof_image` text;
