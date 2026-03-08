-- Migration: Add Task Plan Lifecycle Fields
-- Story: 2.5 - Parent Pauses/Resumes/Deletes Task Plan
-- Date: 2026-03-08
-- Description: Adds status enum extension (paused), paused_until timestamp, and deleted_at for soft delete

-- Step 1: Add paused status to the status enum (SQLite requires recreating the table for enum changes)
-- First, create a new table with the updated schema
CREATE TABLE IF NOT EXISTS task_plans_new (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK(task_type IN ('刷牙', '学习', '运动', '家务', '自定义')),
  points INTEGER NOT NULL,
  rule TEXT NOT NULL,
  excluded_dates TEXT,
  reminder_time TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft', 'published', 'paused')) DEFAULT 'draft',
  paused_until INTEGER, -- Story 2.5: Pause expiry timestamp (null = permanent or not paused)
  deleted_at INTEGER, -- Story 2.5: Soft delete timestamp (null = not deleted)
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Step 2: Copy data from old table to new table
INSERT INTO task_plans_new (
  id, family_id, title, task_type, points, rule, excluded_dates,
  reminder_time, status, created_by, created_at, updated_at, paused_until, deleted_at
)
SELECT
  id, family_id, title, task_type, points, rule, excluded_dates,
  reminder_time, status, created_by, created_at, updated_at, NULL, NULL
FROM task_plans;

-- Step 3: Drop old table
DROP TABLE task_plans;

-- Step 4: Rename new table to original name
ALTER TABLE task_plans_new RENAME TO task_plans;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_task_plans_family_id ON task_plans(family_id);
CREATE INDEX IF NOT EXISTS idx_task_plans_status ON task_plans(status);
CREATE INDEX IF NOT EXISTS idx_task_plans_created_by ON task_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_task_plans_deleted_at ON task_plans(deleted_at);
