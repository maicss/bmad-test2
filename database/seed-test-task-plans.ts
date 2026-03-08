/**
 * Seed Comprehensive Test Task Plans for E2E Testing
 *
 * Creates enough test task plans to support parallel E2E test execution
 * without conflicts between tests.
 */

import db from '../lib/db/index';
import { taskPlans } from '../lib/db/schema';
import type { TaskPlanStatus } from '../lib/db/queries/task-plans';

const TEST_FAMILY_ID = 'family-001';
const TEST_PARENT_ID = 'user-zhang-1';

async function seedComprehensiveTestTaskPlans() {
  console.log('🌱 Seeding comprehensive test task plans for parallel E2E testing...');

  // Helper function to generate ID
  const generateId = () => Bun.randomUUIDv7();

  // Create test task plans with different statuses for E2E testing
  // We create multiple plans for each status to avoid test conflicts
  const testPlans = [
    // Published plans for pause testing (multiple tests need published plans)
    { id: generateId(), family_id: TEST_FAMILY_ID, created_by: TEST_PARENT_ID, title: '刷牙测试A', task_type: '刷牙' as const, points: 5, status: 'published' as TaskPlanStatus, rule: 'daily' },
    { id: generateId(), family_id: TEST_FAMILY_ID, created_by: TEST_PARENT_ID, title: '刷牙测试B', task_type: '刷牙' as const, points: 5, status: 'published' as TaskPlanStatus, rule: 'daily' },
    { id: generateId(), family_id: TEST_FAMILY_ID, created_by: TEST_PARENT_ID, title: '学习测试A', task_type: '学习' as const, points: 10, status: 'published' as TaskPlanStatus, rule: 'weekly' },
    { id: generateId(), family_id: TEST_FAMILY_ID, created_by: TEST_PARENT_ID, title: '学习测试B', task_type: '学习' as const, points: 10, status: 'published' as TaskPlanStatus, rule: 'weekly' },
    { id: generateId(), family_id: TEST_FAMILY_ID, created_by: TEST_PARENT_ID, title: '阅读测试A', task_type: '学习' as const, points: 15, status: 'published' as TaskPlanStatus, rule: 'daily' },
    { id: generateId(), family_id: TEST_FAMILY_ID, created_by: TEST_PARENT_ID, title: '阅读测试B', task_type: '学习' as const, points: 15, status: 'published' as TaskPlanStatus, rule: 'daily' },
    { id: generateId(), family_id: TEST_FAMILY_ID, created_by: TEST_PARENT_ID, title: '整理房间测试A', task_type: '家务' as const, points: 12, status: 'published' as TaskPlanStatus, rule: 'weekly' },
    { id: generateId(), family_id: TEST_FAMILY_ID, created_by: TEST_PARENT_ID, title: '整理房间测试B', task_type: '家务' as const, points: 12, status: 'published' as TaskPlanStatus, rule: 'weekly' },

    // Paused plan for resume testing
    { id: generateId(), family_id: TEST_FAMILY_ID, created_by: TEST_PARENT_ID, title: '运动测试A', task_type: '运动' as const, points: 15, status: 'paused' as TaskPlanStatus, rule: 'daily', paused_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { id: generateId(), family_id: TEST_FAMILY_ID, created_by: TEST_PARENT_ID, title: '运动测试B', task_type: '运动' as const, points: 15, status: 'paused' as TaskPlanStatus, rule: 'daily', paused_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },

    // Draft plan
    { id: generateId(), family_id: TEST_FAMILY_ID, created_by: TEST_PARENT_ID, title: '家务测试A', task_type: '家务' as const, points: 8, status: 'draft' as TaskPlanStatus, rule: 'daily' },
    { id: generateId(), family_id: TEST_FAMILY_ID, created_by: TEST_PARENT_ID, title: '家务测试B', task_type: '家务' as const, points: 8, status: 'draft' as TaskPlanStatus, rule: 'daily' },
  ];

  for (const plan of testPlans) {
    try {
      await db.insert(taskPlans).values(plan).onConflictDoNothing();
      console.log(`✅ Created test task plan: ${plan.title} (${plan.status})`);
    } catch (error) {
      console.error(`❌ Failed to create test task plan: ${plan.title}`, error);
    }
  }

  console.log(`🎉 Test task plans seeded successfully! Created ${testPlans.length} test task plans for E2E testing`);
}

seedComprehensiveTestTaskPlans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding test task plans:', error);
    process.exit(1);
  });
