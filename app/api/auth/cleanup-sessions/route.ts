import { NextRequest, NextResponse } from 'next/server';
import { manualSessionCleanup } from '@/lib/services/session-cleanup';

/**
 * Trigger manual session cleanup
 *
 * Story 1.6 Task 4 - Automatic session cleanup
 *
 * GET /api/auth/cleanup-sessions
 *
 * Manually triggers the session cleanup job
 * For testing and admin use
 *
 * In production, this should be:
 * - Protected by admin authentication
 * - Called by a cron job every 30 minutes
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // For MVP, we'll allow manual cleanup without auth

    const result = await manualSessionCleanup();

    return NextResponse.json({
      success: true,
      message: `已清理 ${result.cleanedCount} 个过期会话`,
      ...result,
    });
  } catch (error) {
    console.error('Manual session cleanup error:', error);
    return NextResponse.json(
      {
        error: '清理会话失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
