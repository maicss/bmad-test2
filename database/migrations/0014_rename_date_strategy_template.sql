-- Migration: Rename date_strategy_template to date_strategy
-- Date: 2026-02-03

-- Rename the table
ALTER TABLE date_strategy_template RENAME TO date_strategy;

-- Rename reference_count column to copy_count to match schema
ALTER TABLE date_strategy RENAME COLUMN reference_count TO copy_count;

-- Update indexes
DROP INDEX IF EXISTS idx_date_strategy_region;
DROP INDEX IF EXISTS idx_date_strategy_year;
DROP INDEX IF EXISTS idx_date_strategy_public;

CREATE INDEX IF NOT EXISTS idx_date_strategy_region ON date_strategy(region);
CREATE INDEX IF NOT EXISTS idx_date_strategy_year ON date_strategy(year);
CREATE INDEX IF NOT EXISTS idx_date_strategy_public ON date_strategy(is_public);
