/**
 * Task Plans API Endpoint
 *
 * Story 2.1: Parent Creates Task Plan Template
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 *
 * POST /api/task-plans - Create a new task plan
 * GET /api/task-plans - List task plans for the authenticated user's family
 * PUT /api/task-plans/:id - Update a task plan
 * DELETE /api/task-plans?id=xxx - Delete a task plan
 *
 * Source: Story 2.1 AC #1-#3
 * Source: _bmad-output/project-context.md - RED LIST rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import {
  createTaskPlan,
  getTaskPlansByFamily,
  updateTaskPlan,
  deleteTaskPlan,
  softDeleteTaskPlan,
  canUserModifyTaskPlan,
  type CreateTaskPlanDTO,
  type UpdateTaskPlanDTO,
} from '@/lib/db/queries/task-plans';
import {
  batchCreateTasks,
  deleteTasksByTaskPlan,
} from '@/lib/db/queries/tasks';
import {
  parseTaskPlanRule,
  generateTasksForImmediatePublish,
  isValidTaskPlanRule,
} from '@/lib/services/task-engine';
import { z } from 'zod';

/**
 * Validation schema for creating a task plan
 */
const createTaskPlanSchema = z.object({
  title: z.string().min(1, '模板名称不能为空').max(50, '模板名称最多50个字符'),
  task_type: z.enum(['刷牙', '学习', '运动', '家务', '自定义'], {
    errorMap: () => ({ message: '请选择有效的任务类型' }),
  }),
  points: z.number().int('积分必须是整数').min(1, '积分最少1分').max(100, '积分最多100分'),
  rule: z.string().min(1, '循环规则不能为空'),
  excluded_dates: z.string().optional(),
  reminder_time: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  assigned_children: z.array(z.string()).optional(),
});

/**
 * Validation schema for updating a task plan
 */
const updateTaskPlanSchema = z.object({
  title: z.string().min(1).max(50).optional(),
  task_type: z.enum(['刷牙', '学习', '运动', '家务', '自定义']).optional(),
  points: z.number().int().min(1).max(100).optional(),
  rule: z.string().optional(),
  excluded_dates: z.string().optional(),
  reminder_time: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  assigned_children: z.array(z.string()).optional(),
});

/**
 * GET /api/task-plans - List task plans for the family
 *
 * Returns all task plans for the authenticated user's family
 *
 * Query parameters:
 * - status: Filter by status (draft/published)
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
        { error: '只有家长可以查看任务模板' },
        { status: 403 }
      );
    }

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as 'draft' | 'published' | null;

    // Get task plans
    const plans = await getTaskPlansByFamily(
      user.family_id!,
      statusFilter ?? undefined
    );

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error('Get task plans error:', error);
    return NextResponse.json(
      { error: '获取任务模板失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/task-plans - Create a new task plan
 *
 * Creates a new task plan template and optionally generates task instances
 *
 * Request body:
 * - title: Template name (required, max 50 chars)
 * - task_type: Task type (required)
 * - points: Points value (required, 1-100)
 * - rule: Date strategy rule as JSON string (required)
 * - excluded_dates: Excluded dates as JSON array string (optional)
 * - reminder_time: Reminder time in HH:mm format (optional)
 * - status: 'draft' or 'published' (default: 'draft')
 * - assigned_children: Array of child user IDs (optional)
 *
 * Response:
 * - 201: Task plan created successfully
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
        { error: '只有家长可以创建任务模板' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = createTaskPlanSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join('; ');
      return NextResponse.json(
        { error: '表单验证失败: ' + errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validate rule format
    let rule;
    try {
      rule = JSON.parse(data.rule);
      if (!isValidTaskPlanRule(rule)) {
        return NextResponse.json(
          { error: '循环规则格式无效' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: '循环规则必须是有效的JSON格式' },
        { status: 400 }
      );
    }

    // Validate excluded_dates format if provided
    if (data.excluded_dates) {
      try {
        JSON.parse(data.excluded_dates);
      } catch {
        return NextResponse.json(
          { error: '排除日期必须是有效的JSON数组格式' },
          { status: 400 }
        );
      }
    }

    // Prepare task plan data
    const taskPlanData: CreateTaskPlanDTO = {
      family_id: user.family_id!,
      title: data.title,
      task_type: data.task_type,
      points: data.points,
      rule: data.rule,
      excluded_dates: data.excluded_dates ?? null,
      reminder_time: data.reminder_time ?? null,
      status: data.status,
      created_by: user.id,
      assigned_children: data.assigned_children ?? [],
    };

    // Create task plan
    const taskPlan = await createTaskPlan(taskPlanData);

    // If status is 'published', generate task instances for the next 7 days
    if (data.status === 'published') {
      const generatedTasks = generateTasksForImmediatePublish({
        task_plan_id: taskPlan.id,
        family_id: user.family_id!,
        title: taskPlan.title,
        task_type: taskPlan.task_type,
        points: taskPlan.points,
        rule: parseTaskPlanRule(taskPlan.rule),
        excluded_dates: taskPlan.excluded_dates
          ? JSON.parse(taskPlan.excluded_dates)
          : [],
        assigned_children: data.assigned_children ?? [],
      });

      // Batch create tasks
      if (generatedTasks.length > 0) {
        await batchCreateTasks(generatedTasks);
      }
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Log response time for monitoring (NFR3: P95 < 500ms)
    if (responseTime >= 500) {
      console.warn(`[PERFORMANCE] POST /api/task-plans took ${responseTime}ms`);
    }

    return NextResponse.json(
      {
        success: true,
        message: data.status === 'published'
          ? '任务模板已发布并生成任务实例'
          : '任务模板已保存为草稿',
        task_plan: taskPlan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create task plan error:', error);
    return NextResponse.json(
      { error: '创建任务模板失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/task-plans - Update a task plan (not implemented in this story)
 *
 * This will be implemented in Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 */
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: '此功能尚未实现' },
    { status: 501 }
  );
}

/**
 * DELETE /api/task-plans - Soft delete a task plan
 *
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 *
 * Soft deletes a task plan (sets deleted_at timestamp).
 * Already generated task instances are preserved.
 *
 * Query parameters:
 * - id: Task plan ID to delete
 *
 * Response:
 * - 200: Task plan deleted successfully
 * - 400: Missing task plan ID
 * - 401: Unauthorized
 * - 403: Forbidden (not a parent or not the creator)
 * - 404: Task plan not found
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
        { error: '只有家长可以删除任务模板' },
        { status: 403 }
      );
    }

    // Get task plan ID from query parameter
    const { searchParams } = new URL(request.url);
    const taskPlanId = searchParams.get('id');

    if (!taskPlanId) {
      return NextResponse.json(
        { error: '缺少任务模板ID' },
        { status: 400 }
      );
    }

    // Check if task plan exists and user can modify it
    const canModify = await canUserModifyTaskPlan(taskPlanId, user.id, user.family_id!);
    if (!canModify) {
      return NextResponse.json(
        { error: '无权删除此任务模板' },
        { status: 403 }
      );
    }

    // Story 2.5: Soft delete the task plan (preserves existing tasks)
    const deletedPlan = await softDeleteTaskPlan(taskPlanId);

    if (!deletedPlan) {
      return NextResponse.json(
        { error: '任务模板不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '任务模板已删除（已生成的任务实例保留）',
    });
  } catch (error) {
    console.error('Delete task plan error:', error);
    return NextResponse.json(
      { error: '删除任务模板失败，请稍后重试' },
      { status: 500 }
    );
  }
}
