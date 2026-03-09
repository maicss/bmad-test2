/**
 * Notifications Integration Tests
 *
 * Story 2.5 Task 7.6: Send Resume Notifications
 *
 * BDD Format: Given-When-Then
 * Business language, no technical terms in test descriptions
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import db from '@/lib/db';
import { notifications, users, families, taskPlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  createNotification,
  getNotificationsByUserId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  sendTaskPlanResumedNotification,
} from '@/lib/db/queries/notifications';

describe('Notifications (Story 2.5 Task 7.6)', () => {
  let testFamily: any;
  let testParent: any;
  let testTaskPlan: any;

  beforeEach(async () => {
    // Clean up test data
    await db.delete(notifications);
    await db.delete(taskPlans);
    await db.delete(users);
    await db.delete(families);

    // Create test family
    testFamily = await db.insert(families).values({
      id: Bun.randomUUIDv7(),
      primary_parent_id: 'test-parent',
    }).returning();
    testFamily = testFamily[0];

    // Create test parent
    testParent = await db.insert(users).values({
      id: Bun.randomUUIDv7(),
      phone: `1${Date.now()}`,
      phone_hash: `hash_${Date.now()}`,
      role: 'parent',
      family_id: testFamily.id,
      name: '测试家长',
    }).returning();
    testParent = testParent[0];

    // Create test task plan
    testTaskPlan = await db.insert(taskPlans).values({
      id: Bun.randomUUIDv7(),
      family_id: testFamily.id,
      title: '测试任务计划',
      task_type: '刷牙',
      points: 10,
      rule: JSON.stringify({ frequency: 'daily' }),
      status: 'published',
      created_by: testParent.id,
    }).returning();
    testTaskPlan = testTaskPlan[0];
  });

  it('given 系统创建通知，when 查询用户通知，then 返回该用户的所有通知', async () => {
    // Given: 系统为用户创建通知
    const notification = await createNotification({
      user_id: testParent.id,
      type: 'task_plan_resumed',
      title: '任务计划已恢复',
      message: '您的任务计划已自动恢复',
    });

    expect(notification).toBeDefined();
    expect(notification.user_id).toBe(testParent.id);
    expect(notification.type).toBe('task_plan_resumed');

    // When: 查询用户通知
    const userNotifications = await getNotificationsByUserId(testParent.id);

    // Then: 返回该用户的通知
    expect(userNotifications).toHaveLength(1);
    expect(userNotifications[0].id).toBe(notification.id);
  });

  it('given 用户有未读通知，when 标记为已读，then 通知状态变更为已读', async () => {
    // Given: 用户有未读通知
    const notification = await createNotification({
      user_id: testParent.id,
      type: 'task_plan_resumed',
      title: '任务计划已恢复',
      message: '您的任务计划已自动恢复',
    });

    expect(notification.is_read).toBe(false);

    // When: 标记为已读
    const updated = await markNotificationAsRead(notification.id);

    // Then: 通知状态变更为已读
    expect(updated?.is_read).toBe(true);
  });

  it('given 用户有多个未读通知，when 查询未读数量，then 返回正确的未读数量', async () => {
    // Given: 用户有多个未读通知
    await createNotification({
      user_id: testParent.id,
      type: 'task_plan_resumed',
      title: '通知1',
      message: '消息1',
    });

    await createNotification({
      user_id: testParent.id,
      type: 'points_earned',
      title: '通知2',
      message: '消息2',
    });

    // When: 查询未读数量
    const unreadCount = await getUnreadNotificationCount(testParent.id);

    // Then: 返回正确的未读数量
    expect(unreadCount).toBe(2);
  });

  it('given 用户有未读通知，when 全部标记为已读，then 未读数量变更为0', async () => {
    // Given: 用户有未读通知
    await createNotification({
      user_id: testParent.id,
      type: 'task_plan_resumed',
      title: '通知1',
      message: '消息1',
    });

    await createNotification({
      user_id: testParent.id,
      type: 'points_earned',
      title: '通知2',
      message: '消息2',
    });

    expect(await getUnreadNotificationCount(testParent.id)).toBe(2);

    // When: 全部标记为已读
    const markedCount = await markAllNotificationsAsRead(testParent.id);

    // Then: 未读数量变更为0
    expect(markedCount).toBe(2);
    expect(await getUnreadNotificationCount(testParent.id)).toBe(0);
  });

  it('given 任务计划自动恢复，when 发送通知，then 家庭中所有家长收到通知', async () => {
    // Given: 家庭有多个家长
    let secondParent = await db.insert(users).values({
      id: Bun.randomUUIDv7(),
      phone: `1${Date.now() + 1}`,
      phone_hash: `hash_${Date.now() + 1}`,
      role: 'parent',
      family_id: testFamily.id,
      name: '第二家长',
    }).returning();
    secondParent = secondParent[0];

    // When: 发送任务计划恢复通知
    const notificationsSent = await sendTaskPlanResumedNotification(
      testFamily.id,
      testTaskPlan.id,
      testTaskPlan.title
    );

    // Then: 所有家长都收到通知
    expect(notificationsSent).toBe(2);

    const parent1Notifications = await getNotificationsByUserId(testParent.id);
    const parent2Notifications = await getNotificationsByUserId(secondParent.id);

    expect(parent1Notifications).toHaveLength(1);
    expect(parent2Notifications).toHaveLength(1);

    expect(parent1Notifications[0].type).toBe('task_plan_resumed');
    expect(parent1Notifications[0].title).toBe('任务计划已自动恢复');

    // Verify metadata contains task plan info
    const metadata = JSON.parse(parent1Notifications[0].metadata!);
    expect(metadata.taskPlanId).toBe(testTaskPlan.id);
    expect(metadata.taskPlanTitle).toBe(testTaskPlan.title);
  });

  it('given 查询用户通知，when 只查询未读，then 不返回已读通知', async () => {
    // Given: 用户有已读和未读通知
    const unreadNotification = await createNotification({
      user_id: testParent.id,
      type: 'task_plan_resumed',
      title: '未读通知',
      message: '未读消息',
    });

    await createNotification({
      user_id: testParent.id,
      type: 'points_earned',
      title: '已读通知',
      message: '已读消息',
    });

    // Mark one as read
    await markNotificationAsRead(unreadNotification.id);

    // When: 只查询未读通知
    const unreadNotifications = await getNotificationsByUserId(testParent.id, true);

    // Then: 不返回已读通知
    expect(unreadNotifications).toHaveLength(1);
    expect(unreadNotifications[0].type).toBe('points_earned');
  });

  it('given 创建通知时包含元数据，when 查询通知，then 元数据正确存储和解析', async () => {
    // Given: 创建包含元数据的通知
    const metadata = {
      taskPlanId: 'plan-123',
      resumedAt: '2026-03-09T10:00:00Z',
      duration: 7,
    };

    const notification = await createNotification({
      user_id: testParent.id,
      type: 'task_plan_resumed',
      title: '任务计划已恢复',
      message: '您的任务计划已自动恢复',
      metadata,
    });

    // When: 解析元数据
    const parsedMetadata = JSON.parse(notification.metadata!);

    // Then: 元数据正确存储和解析
    expect(parsedMetadata.taskPlanId).toBe('plan-123');
    expect(parsedMetadata.resumedAt).toBe('2026-03-09T10:00:00Z');
    expect(parsedMetadata.duration).toBe(7);
  });
});
