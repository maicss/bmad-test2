-- Migration: Add wish_template table for managing wish templates
-- Date: 2025-02-02

-- Create wish_template table
CREATE TABLE IF NOT EXISTS wish_template (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('item', 'activity')),
    points_required REAL NOT NULL CHECK (points_required > 0),
    image_url TEXT,
    due_date TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_wish_template_active ON wish_template(is_active);
CREATE INDEX IF NOT EXISTS idx_wish_template_status ON wish_template(status);
CREATE INDEX IF NOT EXISTS idx_wish_template_created_at ON wish_template(created_at DESC);
