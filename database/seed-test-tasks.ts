/**
 * Seed test tasks for E2E testing of Story 2.7 - Batch Approval
 *
 * Creates tasks with 'completed' status that are pending parent approval
 */

import db from '../lib/db/index';
import { tasks, users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const FAMILY_ID = 'family-001';

// Get family members
async function getFamilyMembers(familyId: string) {
  const familyUsers = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.family_id, familyId));

  return familyUsers as Array<{ id: string; name: string | null; role: string }>;
}

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

// Create test tasks with completed status
async function createTestTasks() {
  console.log('🌱 Creating test tasks for E2E testing...');

  const familyMembers = await getFamilyMembers(FAMILY_ID);
  const children = familyMembers.filter((u: { role: string }) => u.role === 'child');

  if (children.length === 0) {
    console.error('❌ No children found in family. Please seed test users first.');
    return;
  }

  const childId = children[0].id;
  console.log(`👶 Using child: ${children[0].name} (${childId})`);

  // Delete existing tasks for this family
  await db
    .delete(tasks)
    .where(eq(tasks.family_id, FAMILY_ID));
  console.log(`🗑️  Deleted existing tasks`);

  // Today's date for scheduled_date
  const today = new Date();
  const scheduledDate = formatDate(today);

  // Create test tasks with various statuses
  const testTasks = [
    {
      id: generateTaskId(),
      title: '刷牙',
      task_type: '刷牙',
      status: 'completed' as const,
      points: 5,
      proof_image: null,
    },
    {
      id: generateTaskId(),
      title: '完成数学作业',
      task_type: '学习',
      status: 'completed' as const,
      points: 10,
      proof_image: 'https://placehold.co/400x300/e2e8f0/64748b?text=作业完成证明',
    },
    {
      id: generateTaskId(),
      title: '跑步30分钟',
      task_type: '运动',
      status: 'completed' as const,
      points: 15,
      proof_image: 'https://placehold.co/400x300/f0fdf4/166534?text=运动完成证明',
    },
    {
      id: generateTaskId(),
      title: '整理房间',
      task_type: '家务',
      status: 'completed' as const,
      points: 8,
      proof_image: 'https://placehold.co/400x300/fff7ed/ea580c?text=房间整洁',
    },
    {
      id: generateTaskId(),
      title: '阅读课外书',
      task_type: '学习',
      status: 'completed' as const,
      points: 10,
      proof_image: null,
    },
  ];

  const now = new Date();
  const createdTasks = [];

  for (const taskData of testTasks) {
    const [task] = await db
      .insert(tasks)
      .values({
        id: taskData.id,
        family_id: FAMILY_ID,
        assigned_child_id: childId,
        title: taskData.title,
        task_type: taskData.task_type as '刷牙' | '学习' | '运动' | '家务' | '自定义',
        points: taskData.points,
        scheduled_date: scheduledDate,
        status: taskData.status,
        proof_image: taskData.proof_image,
        completed_at: now,
        is_manual: true,
      })
      .returning();

    createdTasks.push(task);
    console.log(`  ✅ Created task: ${task.title} (${task.status})`);
  }

  console.log(`\n✨ Created ${createdTasks.length} test tasks for E2E testing`);
  console.log(`   Family: ${FAMILY_ID}`);
  console.log(`   Child: ${children[0].name}`);
  console.log('');
  console.log('Task Summary:');
  createdTasks.forEach((task) => {
    console.log(`  - ${task.title}: ${task.points} points ${task.proof_image ? '(with proof)' : ''}`);
  });
}

// Run the seed
createTestTasks()
  .then(() => {
    console.log('\n✅ Test task seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding test tasks:', error);
    process.exit(1);
  });
