-- Migration: Add image table for image bed functionality
-- Date: 2024-01-31

-- Create image table
CREATE TABLE IF NOT EXISTS image (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    uploader_id TEXT,
    uploader_name TEXT,
    uploader_phone TEXT,
    uploader_family_id TEXT,
    owner_type TEXT NOT NULL CHECK (owner_type IN ('admin', 'family')),
    owner_id TEXT NOT NULL,
    reference_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_image_owner ON image(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_image_created_at ON image(created_at DESC);
