-- Fix migration tracking for existing database
-- Run this SQL to mark migrations 0001 and 0002 as applied
-- since their columns already exist in the database

-- Mark migration 0001 as applied (adds max_parents, max_children, validity_months)
INSERT OR IGNORE INTO __drizzle_migrations (name, applied_at) 
VALUES ('0001_expand_family_settings.sql', CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER));

-- Mark migration 0002 as applied (adds registration_type, status, etc.)
INSERT OR IGNORE INTO __drizzle_migrations (name, applied_at) 
VALUES ('0002_add_family_registration_tracking.sql', CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER));

-- Migration 0003 and 0004 will run automatically if their columns/tables don't exist
-- 0003 adds: previous_status, suspended_at, suspended_by, deleted_at, deleted_by
-- 0004 adds: image table
