-- Migration: Add icon fields to wish_template table
-- Date: 2025-02-02

-- Add new columns for icon support
ALTER TABLE wish_template ADD COLUMN icon_type TEXT NOT NULL DEFAULT 'lucide' CHECK (icon_type IN ('lucide', 'custom'));
ALTER TABLE wish_template ADD COLUMN icon_value TEXT;
ALTER TABLE wish_template ADD COLUMN icon_color TEXT;
ALTER TABLE wish_template ADD COLUMN border_style TEXT NOT NULL DEFAULT 'circle' CHECK (border_style IN ('circle', 'hexagon', 'square'));

-- Migrate existing data: if image_url exists, move it to icon_value with type 'custom'
UPDATE wish_template SET icon_type = 'custom', icon_value = image_url WHERE image_url IS NOT NULL;

-- Drop old image_url column (optional, can keep for backward compatibility)
-- ALTER TABLE wish_template DROP COLUMN image_url;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_wish_template_icon_type ON wish_template(icon_type);
