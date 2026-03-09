/**
 * Manual Tasks API Endpoint
 *
 * Story 2.6: Parent Uses Template to Quickly Create Task
 *
 * POST /api/tasks - Create manual tasks (not from task plans)
 * GET /api/tasks - Query tasks with optional filters
 *
 * Source: Story 2.6 AC #3-#5
 * Source: _bmad-output/project-context.md - RED LIST rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { createManualTask, getTasksByChild, getTaskById, updateTask, deleteTask } from '@/lib/db/queries/tasks';
import { getFamilyChildren } from '@/lib/db/queries/users';
import { z } from 'zod';

/**
 * Validation schema for creating manual tasks
 */
const createManualTaskSchema = z.object({
  task_plan_id: z.string().optional(), // Template ID for pre-filling (optional)
  title: z.string().min(1, '任务名称不能为空').max(100, '任务名称最多100个字符'),
  task_type: z.enum(['刷牙', '学习', '运动', '家务', '自定义']),
  points: z.number().int('积分必须是整数').min(1, '积分最少1分').max(100, '积分最多100分'),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须是YYYY-MM-DD'),
  child_ids: z.array(z.string()).min(1, '请至少选择一个儿童'),
  notes: z.string().max(500, '备注最多500个字符').optional(),
});

/**
 * GET /api/tasks - Query tasks with filters
 *
 * Query params:
 * - family_id: Family ID (required)
 * - child_id: Child ID to filter by (optional)
 * - is_manual: Filter by manual tasks (true/false) (optional)
 *
 * Response:
 * - 200: Tasks list
 * - 401: Unauthorized
 * - 403: Forbidden (not a parent)
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSessionByToken(sessionToken);
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: '会话已过期，请重新登录' },
        { status: 401 }
      );
    }

    // Get user
    const user = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // Check if user is a parent
    if (user.role !== 'parent') {
      return NextResponse.json(
        { error: '只有家长可以查询任务' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('family_id');
    const childId = searchParams.get('child_id');
    const isManual = searchParams.get('is_manual');

    // Validate family_id
    if (!familyId) {
      return NextResponse.json(
        { error: 'family_id 参数必填' },
        { status: 400 }
      );
    }

    // Verify user belongs to this family
    if (user.family_id !== familyId) {
      return NextResponse.json(
        { error: '无权访问此家庭的任务' },
        { status: 403 }
      );
    }

    // If child_id is specified, verify it belongs to the family
    if (childId) {
      const children = await getFamilyChildren(familyId);
      const childIds = children.map(c => c.id);
      if (!childIds.includes(childId)) {
        return NextResponse.json(
          { error: '指定的儿童不属于此家庭' },
          { status: 400 }
        );
      }

      // Query tasks for specific child
      const tasks = await getTasksByChild(
        familyId,
        childId,
        undefined, // scheduled_date
        isManual === 'true' ? true : isManual === 'false' ? false : undefined
      );

      return NextResponse.json({ tasks });
    }

    // If no child_id, return all family tasks (not implemented - return empty for now)
    return NextResponse.json({ tasks: [] });
  } catch (error) {
    console.error('Query tasks error:', error);
    return NextResponse.json(
      { error: '查询任务失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
  task_plan_id: z.string().optional(), // Template ID for pre-filling (optional)
  title: z.string().min(1, '任务名称不能为空').max(100, '任务名称最多100个字符'),
  task_type: z.enum(['刷牙', '学习', '运动', '家务', '自定义']),
  points: z.number().int('积分必须是整数').min(1, '积分最少1分').max(100, '积分最多100分'),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须是YYYY-MM-DD'),
  child_ids: z.array(z.string()).min(1, '请至少选择一个儿童'),
  notes: z.string().max(500, '备注最多500个字符').optional(),
});

/**
 * POST /api/tasks - Create manual tasks
 *
 * Creates manual task instances that are NOT linked to task plans.
 * Can optionally pre-fill data from a template (task_plan_id).
 *
 * Request body:
 * - task_plan_id: Optional template ID for pre-filling data
 * - title: Task name (required, max 100 chars)
 * - task_type: Task type (required)
 * - points: Points value (required, 1-100)
 * - scheduled_date: Date in YYYY-MM-DD format (required)
 * - child_ids: Array of child user IDs (required, min 1)
 * - notes: Optional notes (max 500 chars)
 *
 * Response:
 * - 201: Tasks created successfully
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (not a parent)
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSessionByToken(sessionToken);
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: '会话已过期，请重新登录' },
        { status: 401 }
      );
    }

    // Get user
    const user = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // Check if user is a parent
    if (user.role !== 'parent') {
      return NextResponse.json(
        { error: '只有家长可以创建手动任务' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = createManualTaskSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((e: any) => e.message).join('; ');
      return NextResponse.json(
        { error: '表单验证失败: ' + errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify all children belong to the same family
    const children = await getFamilyChildren(user.family_id!);
    const childIds = children.map(c => c.id);
    const invalidChildIds = data.child_ids.filter(id => !childIds.includes(id));

    if (invalidChildIds.length > 0) {
      return NextResponse.json(
        { error: '选择的儿童不属于当前家庭' },
        { status: 400 }
      );
    }

    // Validate date is not in the past
    const taskDate = new Date(data.scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (taskDate < today) {
      return NextResponse.json(
        { error: '任务日期不能早于今天' },
        { status: 400 }
      );
    }

    // Create manual tasks
    const tasks = await createManualTask({
      family_id: user.family_id!,
      title: data.title,
      task_type: data.task_type,
      points: data.points,
      scheduled_date: data.scheduled_date,
      child_ids: data.child_ids,
      notes: data.notes,
      is_manual: true,
    });

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Log response time for monitoring (NFR3: P95 < 500ms)
    if (responseTime >= 500) {
      console.warn(`[PERFORMANCE] POST /api/tasks took ${responseTime}ms`);
    }

    return NextResponse.json(
      {
        success: true,
        tasks,
        message: `成功创建 ${tasks.length} 个手动任务`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create manual tasks error:', error);
    return NextResponse.json(
      { error: '创建任务失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * Validation schema for updating manual tasks
 */
const updateManualTaskSchema = z.object({
  title: z.string().min(1, '任务名称不能为空').max(100, '任务名称最多100个字符').optional(),
  task_type: z.enum(['刷牙', '学习', '运动', '家务', '自定义']).optional(),
  points: z.number().int('积分必须是整数').min(1, '积分最少1分').max(100, '积分最多100分').optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须是YYYY-MM-DD').optional(),
  notes: z.string().max(500, '备注最多500个字符').optional(),
});

/**
 * PATCH /api/tasks - Update a manual task
 *
 * Only manual tasks (is_manual=true) can be edited.
 * Scheduled tasks (from task plans) cannot be edited directly.
 *
 * Query params:
 * - id: Task ID (required)
 *
 * Request body (all optional):
 * - title: Task name
 * - task_type: Task type
 * - points: Points value
 * - scheduled_date: Task date
 * - notes: Task notes
 *
 * Response:
 * - 200: Task updated successfully
 * - 400: Validation error or task is not manual
 * - 401: Unauthorized
 * - 403: Forbidden (not a parent or not the task owner)
 * - 404: Task not found
 * - 500: Server error
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSessionByToken(sessionToken);
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: '会话已过期，请重新登录' },
        { status: 401 }
      );
    }

    // Get user
    const user = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // Check if user is a parent
    if (user.role !== 'parent') {
      return NextResponse.json(
        { error: '只有家长可以编辑手动任务' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');

    if (!taskId) {
      return NextResponse.json(
        { error: '任务ID必填' },
        { status: 400 }
      );
    }

    // Get the task
    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    // Verify user owns this task
    if (task.family_id !== user.family_id) {
      return NextResponse.json(
        { error: '无权编辑此任务' },
        { status: 403 }
      );
    }

    // Only manual tasks can be edited
    if (!task.is_manual) {
      return NextResponse.json(
        { error: '只能编辑手动创建的任务，不能编辑计划任务' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = updateManualTaskSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((e: any) => e.message).join('; ');
      return NextResponse.json(
        { error: '表单验证失败: ' + errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validate date is not in the past (if provided)
    if (data.scheduled_date) {
      const taskDate = new Date(data.scheduled_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (taskDate < today) {
        return NextResponse.json(
          { error: '任务日期不能早于今天' },
          { status: 400 }
        );
      }
    }

    // Update the task
    const updatedTask = await updateTask(taskId, {
      ...data,
      scheduled_date: data.scheduled_date,
    });

    if (!updatedTask) {
      return NextResponse.json(
        { error: '更新任务失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
    });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: '更新任务失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks - Delete a manual task
 *
 * Only manual tasks (is_manual=true) can be deleted.
 * Scheduled tasks (from task plans) cannot be deleted directly.
 *
 * Query params:
 * - id: Task ID (required)
 *
 * Response:
 * - 200: Task deleted successfully
 * - 400: Task is not manual
 * - 401: Unauthorized
 * - 403: Forbidden (not a parent or not the task owner)
 * - 404: Task not found
 * - 500: Server error
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSessionByToken(sessionToken);
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: '会话已过期，请重新登录' },
        { status: 401 }
      );
    }

    // Get user
    const user = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // Check if user is a parent
    if (user.role !== 'parent') {
      return NextResponse.json(
        { error: '只有家长可以删除手动任务' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');

    if (!taskId) {
      return NextResponse.json(
        { error: '任务ID必填' },
        { status: 400 }
      );
    }

    // Get the task
    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    // Verify user owns this task
    if (task.family_id !== user.family_id) {
      return NextResponse.json(
        { error: '无权删除此任务' },
        { status: 403 }
      );
    }

    // Only manual tasks can be deleted
    if (!task.is_manual) {
      return NextResponse.json(
        { error: '只能删除手动创建的任务，不能删除计划任务' },
        { status: 400 }
      );
    }

    // Delete the task
    const deleted = await deleteTask(taskId);

    if (!deleted) {
      return NextResponse.json(
        { error: '删除任务失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '任务已删除',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: '删除任务失败，请稍后重试' },
      { status: 500 }
    );
  }
}
