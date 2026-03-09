/**
 * Resume Task Plan API Endpoint
 *
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 * Story 2.5 Task 3.6: Trigger immediate task generation when resuming
 *
 * POST /api/task-plans/:id/resume
 *
 * Resumes a paused task plan, changing its status back to 'published'.
 * This clears the paused_until timestamp and task generation will resume.
 *
 * Request body:
 * {
 *   "generateTodayTasks": boolean  // Optional: generate tasks for today
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { resumeTaskPlan, canUserModifyTaskPlan, isTaskPlanDeleted } from '@/lib/db/queries/task-plans';
import { getUserFamilyId } from '@/lib/db/queries/users';
import { taskGenerator } from '@/lib/services/task-engine/task-generator';
import { logUserAction } from '@/lib/db/queries/audit-logs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized: No session token', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate session
    const session = await getSessionByToken(sessionToken);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Unauthorized: Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    const userId = session.user_id;
    const taskPlanId = (await params).id;

    // Get request body (optional)
    let generateTodayTasks = false;
    try {
      const body = await request.json();
      generateTodayTasks = body.generateTodayTasks === true;
    } catch {
      // No body provided, use default
    }

    // Get user's family ID
    const familyId = await getUserFamilyId(userId);
    if (!familyId) {
      return NextResponse.json(
        { error: 'User not associated with a family', code: 'NO_FAMILY' },
        { status: 400 }
      );
    }

    // Story 2.5 Task 9.3: Check if task plan is deleted
    const isDeleted = await isTaskPlanDeleted(taskPlanId);
    if (isDeleted) {
      return NextResponse.json(
        { error: 'Task plan has been deleted', code: 'TASK_PLAN_DELETED' },
        { status: 410 }
      );
    }

    // Check if user can modify this task plan
    const canModify = await canUserModifyTaskPlan(taskPlanId, userId, familyId);
    if (!canModify) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to modify this task plan', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Resume the task plan
    const updatedPlan = await resumeTaskPlan(taskPlanId);

    if (!updatedPlan) {
      return NextResponse.json(
        { error: 'Task plan not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Story 2.5 Task 9.5: Log audit action
    await logUserAction(
      userId,
      'task_plan_resume',
      {
        taskPlanId,
        taskPlanTitle: updatedPlan.title,
        generateTodayTasks,
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    );

    // Story 2.5 Task 3.6: Generate tasks for today if requested
    let generationResult = null;
    if (generateTodayTasks) {
      const today = new Date().toISOString().split('T')[0];
      generationResult = await taskGenerator.generateForDate(today);
      console.log(`[Resume] Generated tasks for ${today}:`, generationResult);
    }

    return NextResponse.json({
      success: true,
      taskPlan: {
        id: updatedPlan.id,
        status: updatedPlan.status,
        pausedUntil: null,
      },
      generationResult,
      message: generateTodayTasks
        ? 'Task plan resumed and today\'s tasks generated'
        : 'Task plan resumed successfully',
    });

  } catch (error) {
    console.error('Error resuming task plan:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
