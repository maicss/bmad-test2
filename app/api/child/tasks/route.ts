/**
 * Child Tasks API Endpoint
 *
 * Story 2.8: Child Views Today's Task List
 * Task 2.4: 实现任务数据加载
 *
 * GET /api/child/tasks - 获取儿童今日任务列表
 *
 * 认证: 需要儿童PIN登录
 * RBAC: 只能返回当前登录儿童的任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getTodayTasksByChild, getTaskProgressByChild, getTaskStatusDisplay } from '@/lib/db/queries/tasks';
import { cookies } from 'next/headers';

/**
 * GET /api/child/tasks
 * 获取当前儿童用户的今日任务列表
 */
export async function GET(request: NextRequest) {
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

    // 获取今日任务
    const tasks = await getTodayTasksByChild(user.id);

    // 获取任务进度
    const progress = await getTaskProgressByChild(user.id);

    // 转换任务状态为显示状态
    const tasksWithDisplayStatus = tasks.map(task => ({
      ...task,
      displayStatus: getTaskStatusDisplay(task.status),
    }));

    return NextResponse.json({
      tasks: tasksWithDisplayStatus,
      progress,
    });
  } catch (error) {
    console.error('获取儿童任务失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
