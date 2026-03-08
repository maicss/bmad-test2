/**
 * Admin API: Manual Task Generation
 *
 * Story 2.4: System Auto-Generates Task Instances
 * Task 9: Manual trigger task generation
 *
 * POST /api/admin/generate-tasks
 *
 * Allows administrators to manually trigger task generation for a specific date.
 * This is useful for:
 * - Testing task generation logic
 * - Re-generating tasks after a system failure
 * - Generating tasks for future dates
 *
 * Source: Story 2.4 AC #9 - Administrator manual trigger
 */

import { NextRequest, NextResponse } from 'next/server';
import { taskScheduler } from '@/lib/schedulers/task-generation-scheduler';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';

/**
 * POST /api/admin/generate-tasks
 *
 * Request body:
 * {
 *   "date": "2026-03-08"  // Optional, defaults to today
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "successCount": 10,
 *     "errorCount": 0,
 *     "errors": []
 *   },
 *   "message": "Generated 10 tasks successfully"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No session' },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSessionByToken(sessionToken);
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    // Get user
    const user = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json() as { date?: string };
    const targetDate = body.date;

    // Validate date format if provided
    if (targetDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(targetDate)) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }

      // Validate it's a valid date
      const parsedDate = new Date(targetDate + 'T00:00:00Z');
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date' },
          { status: 400 }
        );
      }
    }

    // Trigger task generation
    const result = await taskScheduler.triggerManualGeneration(targetDate);

    // Return success response
    return NextResponse.json({
      success: true,
      data: result,
      message: `Generated ${result.successCount} tasks successfully${result.errorCount > 0 ? ` with ${result.errorCount} errors` : ''}`,
    });
  } catch (error) {
    console.error('[API] Admin task generation failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/generate-tasks
 *
 * Get scheduler status and health information
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No session' },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSessionByToken(sessionToken);
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    // Get user
    const user = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get scheduler status
    const status = taskScheduler.getStatus();
    const health = taskScheduler.healthCheck();

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        health,
      },
    });
  } catch (error) {
    console.error('[API] Get scheduler status failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
