/**
 * Rate limiting for login attempts
 *
 * Prevents brute force attacks by limiting failed login attempts
 * 5 failures → lock for 10 minutes
 *
 * Source: Story 1.2 AC #4 - Rate limiting for security
 */

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

// In-memory rate limit store (for production, consider Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Development mode: Skip rate limiting for easier testing
// TEST_MODE: Force enable rate limiting even in development mode
const DEV_MODE = Bun.env.NODE_ENV === 'development';
const TEST_MODE = Bun.env.TEST_MODE === 'true';

/**
 * Check if login should be rate limited
 *
 * Tracks failed login attempts by IP address
 * Returns error message if rate limit exceeded
 *
 * @param ipAddress - IP address of request
 * @param headers - Optional request headers (for X-Test-Rate-Limit override)
 * @returns Error message if rate limited, null otherwise
 */
export function rateLimitLoginAttempts(
  ipAddress: string,
  headers?: Headers | Record<string, string>
): string | null {
  // Check if rate limiting is forced via header (for testing)
  const forceRateLimit = headers && (
    (headers instanceof Headers && headers.get('X-Test-Rate-Limit') === 'true') ||
    (typeof headers === 'object' && headers['X-Test-Rate-Limit'] === 'true')
  );

  // Skip rate limiting in development mode (unless TEST_MODE or forced)
  if (DEV_MODE && !TEST_MODE && !forceRateLimit) {
    return null;
  }

  const now = Date.now();
  const entry = rateLimitStore.get(ipAddress);

  // First attempt
  if (!entry) {
    rateLimitStore.set(ipAddress, {
      attempts: 1,
      lastAttempt: now,
      lockedUntil: null,
    });
    return null;
  }

  // Check if locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const remainingTime = Math.ceil((entry.lockedUntil - now) / 1000 / 60); // minutes
    return `登录失败次数过多，请${remainingTime}分钟后再试`;
  }

  // Lock period expired, reset
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    entry.attempts = 0;
    entry.lockedUntil = null;
  }

  // Increment attempts
  entry.attempts++;
  entry.lastAttempt = now;

  // Check if should lock
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_DURATION;
    rateLimitStore.set(ipAddress, entry);
    return `登录失败次数过多，请10分钟后再试`;
  }

  rateLimitStore.set(ipAddress, entry);
  return null;
}

/**
 * Reset rate limit for successful login
 *
 * @param ipAddress - IP address of successful login
 */
export function resetRateLimit(ipAddress: string): void {
  rateLimitStore.delete(ipAddress);
}

/**
 * Get current rate limit status
 *
 * @param ipAddress - IP address to check
 * @returns Rate limit entry or null
 */
export function getRateLimitStatus(ipAddress: string): RateLimitEntry | null {
  return rateLimitStore.get(ipAddress) || null;
}

/**
 * Reset all rate limits
 *
 * Clears all rate limit entries
 * Used in tests to avoid interference between test cases
 *
 * Source: Testing helper function
 */
export function resetAllRateLimits(): void {
  rateLimitStore.clear();
}
