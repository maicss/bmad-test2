-- Migration: Add task template columns to task_definition table
-- Date: 2024-02-02

-- Add is_template column to mark template tasks
ALTER TABLE task_definition ADD COLUMN is_template INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint

-- Add template_name for template display name
ALTER TABLE task_definition ADD COLUMN template_name TEXT;
--> statement-breakpoint

-- Add combo_strategy_type for combo task strategies
ALTER TABLE task_definition ADD COLUMN combo_strategy_type TEXT;
