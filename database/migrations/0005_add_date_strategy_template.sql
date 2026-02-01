-- Migration: Add date strategy template table
-- Date: 2024-01-31

CREATE TABLE IF NOT EXISTS date_strategy_template (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    region TEXT NOT NULL,
    year INTEGER NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 1,
    dates TEXT NOT NULL,
    reference_count INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_date_strategy_region ON date_strategy_template(region);
CREATE INDEX IF NOT EXISTS idx_date_strategy_year ON date_strategy_template(year);
CREATE INDEX IF NOT EXISTS idx_date_strategy_public ON date_strategy_template(is_public);
