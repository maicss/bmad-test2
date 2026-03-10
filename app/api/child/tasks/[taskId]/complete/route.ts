/**
 * Complete Task API Endpoint
 *
 * Story 2.8: Child Views Today's Task List
 * Task 7: 实现任务点击交互
 *
 * POST /api/child/tasks/:taskId/complete - Child marks task as complete
 *
 * 认证: 需要儿童PIN登录
 * RBAC: 只能标记当前登录儿童的任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getTaskById, markTaskCompleted } from '@/lib/db/queries/tasks';
import { cookies } from 'next/headers';

/**
 * POST /api/child/tasks/:taskId/complete
 * Child marks a task as complete (pending parent approval)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // 获取session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const session = await getSessionByToken(sessionToken);
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session已过期' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // RBAC: 只允许儿童角色访问
    if (user.role !== 'child') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    // Get task
    const task = await getTaskById(params.taskId);
    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    // RBAC: 只能标记自己的任务
    if (task.assigned_child_id !== user.id) {
      return NextResponse.json(
        { error: '无权操作此任务' },
        { status: 403 }
      );
    }

    // Check if task is already completed or approved
    if (task.status === 'completed' || task.status === 'approved') {
      return NextResponse.json(
        { error: '任务已完成' },
        { status: 400 }
      );
    }

    // Mark task as completed
    const updatedTask = await markTaskCompleted(params.taskId);

    if (!updatedTask) {
      return NextResponse.json(
        { error: '标记任务失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: '任务已标记为完成，等待家长审批',
    });
  } catch (error) {
    console.error('Complete task error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
