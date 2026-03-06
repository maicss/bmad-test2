-- Migration: Add Points System Tables
-- Story: 2.2 - Parent Sets Task Points Value
-- Date: 2026-03-06
-- Description: Creates point_balances and points_history tables for points tracking

-- Create point_balances table
CREATE TABLE IF NOT EXISTS point_balances (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for child_id lookup
CREATE INDEX IF NOT EXISTS idx_point_balances_child_id ON point_balances(child_id);

-- Create points_history table for audit trail
CREATE TABLE IF NOT EXISTS points_history (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  task_id TEXT,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('task_completion', 'task_rejection', 'adjustment', 'reward', 'penalty')),
  description TEXT,
  previous_balance INTEGER NOT NULL DEFAULT 0,
  new_balance INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- Create indexes for points_history
CREATE INDEX IF NOT EXISTS idx_points_history_child_id ON points_history(child_id);
CREATE INDEX IF NOT EXISTS idx_points_history_task_id ON points_history(task_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at);
CREATE INDEX IF NOT EXISTS idx_points_history_child_created ON points_history(child_id, created_at);
