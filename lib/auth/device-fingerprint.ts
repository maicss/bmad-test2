/**
 * Device fingerprinting and session management utilities
 *
 * Source: Story 1.6 Task 2
 */
import { randomUUID } from 'node:crypto';

/**
 * Generate device fingerprint from request
 *
 * Combines user-agent + IP to create stable device identifier
 * Hashed for security (NFR10: device_id encryption)
 *
 * Note: Excluding timestamp ensures same device has consistent fingerprint
 * across requests, enabling proper rate limiting and session tracking
 * Uses SHA-256 (not bcrypt) to ensure same input produces same output
 *
 * @param userAgent - User-Agent header
 * @param ipAddress - IP address
 * @returns Device fingerprint
 */
export async function generateDeviceFingerprint(
  userAgent: string,
  ipAddress: string
): Promise<string> {
  // Combine user-agent and IP for stable device identification
  const fingerprintData = `${userAgent}|${ipAddress}`;

  // Use crypto.subtle.digest for stable hashing (same input = same output)
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprintData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Return base64 encoded hash for compact storage
  return Buffer.from(hashBuffer).toString('base64').slice(0, 64);
}

/**
 * Detect device type from user-agent
 *
 * @param userAgent - User-Agent header
 * @returns Device type: 'mobile' | 'tablet' | 'desktop'
 */
export function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();

  // Tablet detection
  if (/ipad|android(?!.*mobile)|tablet|kindle|silk/i.test(ua)) {
    return 'tablet';
  }

  // Mobile detection
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  }

  // Default to desktop
  return 'desktop';
}

/**
 * Generate device name from user-agent
 *
 * Creates human-readable device name for session list UI
 * e.g., "iPhone 13", "Chrome on Windows PC", "iPad Air"
 *
 * @param userAgent - User-Agent header
 * @returns Human-readable device name
 */
export function generateDeviceName(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  // iOS detection
  if (ua.includes('iphone')) {
    const match = ua.match(/iphone\s([^\s;]+)/);
    return match ? `iPhone ${match[1].replace(/_/g, ' ')}` : 'iPhone';
  }
  if (ua.includes('ipad')) {
    const match = ua.match(/ipad\s([^\s;]+)/);
    return match ? `iPad ${match[1].replace(/_/g, ' ')}` : 'iPad';
  }

  // Android detection
  if (ua.includes('android')) {
    return 'Android 设备';
  }

  // Chrome detection
  if (ua.includes('chrome')) {
    if (ua.includes('windows')) return 'Chrome on Windows';
    if (ua.includes('mac')) return 'Chrome on Mac';
    if (ua.includes('linux')) return 'Chrome on Linux';
    return 'Chrome 浏览器';
  }

  // Safari detection
  if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'Safari 浏览器';
  }

  // Firefox detection
  if (ua.includes('firefox')) {
    return 'Firefox 浏览器';
  }

  // Edge detection
  if (ua.includes('edg')) {
    return 'Edge 浏览器';
  }

  // Default
  return '未知设备';
}

/**
 * Generate unique session token
 *
 * @returns Session token (UUID)
 */
export function generateSessionToken(): string {
  return randomUUID();
}

/**
 * Generate unique session ID
 *
 * @returns Session ID (UUID)
 */
export function generateSessionId(): string {
  return randomUUID();
}

/**
 * Calculate session expiration time
 *
 * @param rememberMe - Whether user selected "Remember Me"
 * @param hoursOverride - Override default hours for testing
 * @returns Expiration timestamp
 */
export function calculateSessionExpiration(
  rememberMe: boolean = false,
  hoursOverride?: number
): number {
  // Default: 36 hours (NFR13)
  // Remember Me: 7 days = 168 hours
  const hours = hoursOverride || (rememberMe ? 168 : 36);

  return Math.floor(Date.now() / 1000) + (hours * 3600);
}

/**
 * Validate if session is still active
 *
 * @param expiresAt - Session expiration timestamp
 * @returns True if session is still active
 */
export function isSessionActive(expiresAt: number): boolean {
  return Math.floor(Date.now() / 1000) < expiresAt;
}

/**
 * Extract device info from request
 *
 * @param request - NextRequest object
 * @returns Device info object
 */
export function extractDeviceInfo(request: Request) {
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipAddress = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

  return {
    userAgent,
    ipAddress,
    deviceType: detectDeviceType(userAgent),
    deviceName: generateDeviceName(userAgent),
  };
}
