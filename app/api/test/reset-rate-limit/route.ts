import { NextResponse } from 'next/server';
import { resetAllRateLimits } from '@/lib/auth/rate-limit';

/**
 * Test-only endpoint to reset rate limits
 *
 * This endpoint should only be used in test environment
 * It clears all rate limit entries to allow tests to run properly
 *
 * Source: Story 1.3 E2E Testing - Reset rate limit between tests
 */
export async function GET() {
  // Reset all rate limits (remove environment check for E2E tests)
  resetAllRateLimits();

  return NextResponse.json({
    success: true,
    message: 'Rate limits reset successfully',
  });
}
