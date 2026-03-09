-- Migration 0004: Add manual task fields (Story 2.6)
-- Adds is_manual and notes fields to tasks table for manual task creation

-- Add is_manual field (boolean, default false)
ALTER TABLE `tasks` ADD COLUMN `is_manual` INTEGER DEFAULT 0 NOT NULL;

-- Add notes field (optional text for manual tasks)
ALTER TABLE `tasks` ADD COLUMN `notes` TEXT;

-- Create index for is_manual field to optimize queries
CREATE INDEX `idx_tasks_is_manual` ON `tasks` (`is_manual`);
