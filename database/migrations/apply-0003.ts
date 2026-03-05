/**
 * Migration 0003: Apply task_plans and tasks tables
 *
 * Story 2.1: Parent Creates Task Plan Template
 *
 * This script applies the migration for task-related tables.
 */

import { Database } from 'bun:sqlite';

const db = new Database('database/db.sqlite');

// Read and execute the migration SQL
const migrationSQL = `
-- Create task_plan_children table
CREATE TABLE IF NOT EXISTS task_plan_children (
	id text PRIMARY KEY NOT NULL,
	task_plan_id text NOT NULL,
	child_id text NOT NULL,
	created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (task_plan_id) REFERENCES task_plans(id) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (child_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
);

-- Create indexes for task_plan_children
CREATE INDEX IF NOT EXISTS idx_task_plan_children_plan_id ON task_plan_children (task_plan_id);
CREATE INDEX IF NOT EXISTS idx_task_plan_children_child_id ON task_plan_children (child_id);

-- Create task_plans table
CREATE TABLE IF NOT EXISTS task_plans (
	id text PRIMARY KEY NOT NULL,
	family_id text NOT NULL,
	title text NOT NULL,
	task_type text NOT NULL,
	points integer NOT NULL,
	rule text NOT NULL,
	excluded_dates text,
	reminder_time text,
	status text DEFAULT 'draft' NOT NULL,
	created_by text NOT NULL,
	created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	updated_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (family_id) REFERENCES families(id) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE no action ON DELETE restrict
);

-- Create indexes for task_plans
CREATE INDEX IF NOT EXISTS idx_task_plans_family_id ON task_plans (family_id);
CREATE INDEX IF NOT EXISTS idx_task_plans_status ON task_plans (status);
CREATE INDEX IF NOT EXISTS idx_task_plans_created_by ON task_plans (created_by);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
	id text PRIMARY KEY NOT NULL,
	family_id text NOT NULL,
	task_plan_id text,
	assigned_child_id text,
	title text NOT NULL,
	task_type text NOT NULL,
	points integer NOT NULL,
	scheduled_date text NOT NULL,
	status text DEFAULT 'pending' NOT NULL,
	completed_at integer,
	approved_by text,
	approved_at integer,
	rejection_reason text,
	created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	updated_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (family_id) REFERENCES families(id) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (task_plan_id) REFERENCES task_plans(id) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (assigned_child_id) REFERENCES users(id) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (approved_by) REFERENCES users(id) ON UPDATE no action ON DELETE restrict
);

-- Create indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_family_id ON tasks (family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_plan_id ON tasks (task_plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_child_id ON tasks (assigned_child_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_family_scheduled ON tasks (family_id,scheduled_date);
`;

try {
  // Execute the migration
  db.exec(migrationSQL);
  console.log('Migration 0003 applied successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
