/**
 * Test API: Clear Sessions
 *
 * Helper endpoint for E2E tests to clear sessions for test users
 * This handles the single-device restriction for child accounts during testing
 */
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { sessions, userSessionDevices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Delete all sessions for the user
    await db.delete(sessions).where(eq(sessions.user_id, userId));

    // Delete session devices for the user
    await db.delete(userSessionDevices).where(eq(userSessionDevices.user_id, userId));

    return NextResponse.json({
      success: true,
      message: `Sessions cleared for user: ${userId}`,
    });
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return NextResponse.json(
      { error: 'Failed to clear sessions' },
      { status: 500 }
    );
  }
}
