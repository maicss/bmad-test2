-- Migration: Add reward_points column to medal_template table
-- Created: 2026-02-02

-- Add reward_points column with default value 0
ALTER TABLE medal_template ADD COLUMN reward_points REAL NOT NULL DEFAULT 0;
