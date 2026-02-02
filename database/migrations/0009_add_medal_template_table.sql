-- Migration: Add medal_template table for badge/achievement system
-- Date: 2024-02-02

-- Create medal_template table
CREATE TABLE IF NOT EXISTS medal_template (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon_type TEXT NOT NULL CHECK (icon_type IN ('lucide', 'custom')),
    icon_value TEXT NOT NULL,
    icon_color TEXT,
    border_style TEXT NOT NULL CHECK (border_style IN ('circle', 'hexagon', 'square')),
    level_mode TEXT NOT NULL CHECK (level_mode IN ('single', 'multiple')),
    level_count INTEGER NOT NULL DEFAULT 1,
    tier_colors TEXT,
    threshold_counts TEXT NOT NULL,
    is_continuous INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (family_id) REFERENCES family(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES user(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_medal_template_family ON medal_template(family_id);
CREATE INDEX IF NOT EXISTS idx_medal_template_active ON medal_template(is_active);
CREATE INDEX IF NOT EXISTS idx_medal_template_created_at ON medal_template(created_at DESC);
