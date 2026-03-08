-- Migration: Add unique index for tasks table idempotency
-- Story 2.4: System Auto-Generates Task Instances
--
-- This unique index prevents duplicate task generation for the same
-- task_plan_id + assigned_child_id + scheduled_date combination.

-- Create unique index for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_unique_plan_child_date
ON tasks(task_plan_id, assigned_child_id, scheduled_date)
WHERE task_plan_id IS NOT NULL;

-- Note: We use a partial index (WHERE task_plan_id IS NOT NULL) because
-- one-time tasks (task_plan_id IS NULL) can be created multiple times
-- for the same child on the same date.
