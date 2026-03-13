/**
 * E2E Test Tasks Seed
 *
 * Creates test tasks for E2E testing of Story 2.9
 * Uses test-family-1111 and test-child-9999
 */

import db from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const TEST_FAMILY_ID = 'test-family-1111';
const TEST_CHILD_ID = 'test-child-9999';

// Helper to generate task ID
function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Create test tasks with pending status (ready to be completed)
async function createE2ETestTasks() {
  console.log('🌱 Creating E2E test tasks for Story 2.9...');

  // Delete existing tasks for this family
  await db
    .delete(tasks)
    .where(eq(tasks.family_id, TEST_FAMILY_ID));
  console.log(`🗑️  Deleted existing tasks`);

  // Today's date for scheduled_date
  const today = new Date();
  const scheduledDate = formatDate(today);

  // Create test tasks with pending status (not yet completed)
  const testTasks = [
    {
      id: generateTaskId(),
      title: '刷牙',
      task_type: '刷牙',
      status: 'pending' as const,
      points: 5,
      proof_image: null,
    },
    {
      id: generateTaskId(),
      title: '完成数学作业',
      task_type: '学习',
      status: 'pending' as const,
      points: 10,
      proof_image: null,
    },
    {
      id: generateTaskId(),
      title: '整理房间',
      task_type: '家务',
      status: 'pending' as const,
      points: 8,
      proof_image: null,
    },
    {
      id: generateTaskId(),
      title: '阅读课外书',
      task_type: '学习',
      status: 'pending' as const,
      points: 10,
      proof_image: null,
    },
    {
      id: generateTaskId(),
      title: '帮妈妈洗碗',
      task_type: '家务',
      status: 'pending' as const,
      points: 6,
      proof_image: null,
    },
  ];

  const createdTasks = [];

  for (const taskData of testTasks) {
    const [task] = await db
      .insert(tasks)
      .values({
        id: taskData.id,
        family_id: TEST_FAMILY_ID,
        assigned_child_id: TEST_CHILD_ID,
        title: taskData.title,
        task_type: taskData.task_type as '刷牙' | '学习' | '运动' | '家务' | '自定义',
        points: taskData.points,
        scheduled_date: scheduledDate,
        status: taskData.status,
        proof_image: taskData.proof_image,
        is_manual: true,
      })
      .returning();

    createdTasks.push(task);
    console.log(`  ✅ Created task: ${task.title} (${task.status}) - ${task.points} points`);
  }

  console.log(`\n✨ Created ${createdTasks.length} E2E test tasks`);
  console.log(`   Family: ${TEST_FAMILY_ID}`);
  console.log(`   Child: ${TEST_CHILD_ID}`);
  console.log('');
  console.log('Task Summary:');
  createdTasks.forEach((task) => {
    console.log(`  - ${task.title}: ${task.points} points (${task.status})`);
  });
}

// Run the seed
createE2ETestTasks()
  .then(() => {
    console.log('\n✅ E2E test task seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding E2E test tasks:', error);
    process.exit(1);
  });
