-- Migration: Fix medal_template family_id to allow NULL for system templates
-- Date: 2024-02-02

-- Since SQLite doesn't support ALTER COLUMN, we need to recreate the table
-- Step 1: Create temporary table with corrected schema
CREATE TABLE medal_template_new (
    id TEXT PRIMARY KEY,
    family_id TEXT, -- Allow NULL for system-level templates
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

-- Step 2: Copy data from old table if it exists
INSERT INTO medal_template_new 
SELECT * FROM medal_template WHERE family_id IN (SELECT id FROM family);

-- Step 3: Drop old table
DROP TABLE IF EXISTS medal_template;

-- Step 4: Rename new table to final name
ALTER TABLE medal_template_new RENAME TO medal_template;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_medal_template_family ON medal_template(family_id);
CREATE INDEX IF NOT EXISTS idx_medal_template_active ON medal_template(is_active);
CREATE INDEX IF NOT EXISTS idx_medal_template_created_at ON medal_template(created_at DESC);
