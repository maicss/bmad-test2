/**
 * Create test tasks for E2E testing
 *
 * Creates sample tasks for the test child user
 */

import db from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const testChildId = 'test-child-9999';
const testFamilyId = 'test-family-1111';

async function createTestTasks() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Create sample tasks with proper types
  const sampleTasks = [
    {
      id: 'test-task-1',
      family_id: testFamilyId,
      task_plan_id: null,
      assigned_child_id: testChildId,
      title: '每日刷牙',
      task_type: '刷牙' as const,
      points: 5,
      scheduled_date: today,
      status: 'pending' as const,
      is_manual: true,
    },
    {
      id: 'test-task-2',
      family_id: testFamilyId,
      task_plan_id: null,
      assigned_child_id: testChildId,
      title: '完成作业',
      task_type: '学习' as const,
      points: 20,
      scheduled_date: today,
      status: 'completed' as const,
      is_manual: true,
    },
    {
      id: 'test-task-3',
      family_id: testFamilyId,
      task_plan_id: null,
      assigned_child_id: testChildId,
      title: '整理房间',
      task_type: '家务' as const,
      points: 10,
      scheduled_date: today,
      status: 'pending' as const,
      is_manual: true,
    },
  ];

  try {
    // Delete existing test tasks
    await db.delete(tasks).where(eq(tasks.assigned_child_id, testChildId));

    // Insert new test tasks
    for (const task of sampleTasks) {
      await db.insert(tasks).values(task);
    }

    console.log('✅ Test tasks created successfully');
    console.log(`  Created ${sampleTasks.length} tasks for child ${testChildId}`);
    console.log(`  Date: ${today}`);
    console.log('\nTasks:');
    sampleTasks.forEach(task => {
      console.log(`  - ${task.title} (${task.status})`);
    });
  } catch (error) {
    console.error('❌ Failed to create test tasks:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  createTestTasks();
}

export { createTestTasks };
