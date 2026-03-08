/**
 * Pause Task Plan API Endpoint
 *
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 *
 * POST /api/task-plans/:id/pause
 *
 * Pauses a task plan for a specified duration.
 * - durationDays: number of days to pause (null = permanent)
 *
 * Request body:
 * {
 *   "durationDays": number | null  // null for permanent pause
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { pauseTaskPlan, canUserModifyTaskPlan } from '@/lib/db/queries/task-plans';
import { getUserFamilyId } from '@/lib/db/queries/users';

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

    // Get request body
    const body = await request.json();
    const { durationDays } = body as { durationDays?: number | null };

    // Validate durationDays
    if (durationDays !== null && durationDays !== undefined) {
      if (typeof durationDays !== 'number' || durationDays < 1 || durationDays > 365) {
        return NextResponse.json(
          { error: 'Invalid durationDays. Must be between 1 and 365, or null for permanent pause.', code: 'INVALID_DURATION' },
          { status: 400 }
        );
      }
    }

    // Get user's family ID
    const familyId = await getUserFamilyId(userId);
    if (!familyId) {
      return NextResponse.json(
        { error: 'User not associated with a family', code: 'NO_FAMILY' },
        { status: 400 }
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

    // Pause the task plan
    const updatedPlan = await pauseTaskPlan(taskPlanId, durationDays ?? null);

    if (!updatedPlan) {
      return NextResponse.json(
        { error: 'Task plan not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Calculate resume time for response
    const resumeAt = updatedPlan.paused_until
      ? new Date(updatedPlan.paused_until).toISOString()
      : null;

    return NextResponse.json({
      success: true,
      taskPlan: {
        id: updatedPlan.id,
        status: updatedPlan.status,
        pausedUntil: resumeAt,
      },
      message: durationDays === null || durationDays === undefined
        ? 'Task plan permanently paused'
        : `Task plan paused for ${durationDays} day(s)`,
    });

  } catch (error) {
    console.error('Error pausing task plan:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
