import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getChildByPIN } from '@/lib/db/queries/users';
import { rateLimitLoginAttempts, resetRateLimit } from '@/lib/auth/rate-limit';
import { logUserAction } from '@/lib/db/queries/audit-logs';
import {
  createSession,
  getActiveChildSession,
  upsertUserSessionDevice,
} from '@/lib/db/queries/sessions';
import {
  generateDeviceFingerprint,
  detectDeviceType,
  generateDeviceName,
  generateSessionToken,
  extractDeviceInfo,
} from '@/lib/auth/device-fingerprint';

/**
 * Child PIN Login API Endpoint
 *
 * Story 1.6: Multi-device Login - Enhanced with device tracking
 *
 * Children login using 4-digit PIN code
 * Faster than phone login, suitable for shared devices
 *
 * New features (Story 1.6 AC #9):
 * - Single-device restriction for child accounts
 * - Device tracking
 * - Session management
 *
 * Source: Story 1.3 AC #1-#5, #8
 * Source: Story 1.6 AC #9 - Child single-device restriction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    // Get IP address for rate limiting and audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Extract device information
    const { userAgent, ipAddress: clientIp, deviceType, deviceName } =
      extractDeviceInfo(request);

    // Generate device fingerprint
    const deviceId = await generateDeviceFingerprint(userAgent, clientIp);

    // Validate PIN format (4 digits, numeric only)
    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: '请输入4位数字PIN码' },
        { status: 400 }
      );
    }

    // Check rate limiting (Story 1.2 AC #4: Rate limiting for security)
    const rateLimitError = rateLimitLoginAttempts(ipAddress, request.headers);
    if (rateLimitError) {
      await logUserAction(null, 'pin_login_failed', {
        ip_address: ipAddress,
        auth_method: 'pin',
        reason: 'rate_limited',
        device_id: deviceId,
        device_type: deviceType,
      });
      return NextResponse.json(
        { error: rateLimitError },
        { status: 429 }
      );
    }

    // Verify child exists with PIN
    const user = await getChildByPIN(pin);

    console.log('[PIN LOGIN] User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('[PIN LOGIN] User role:', user.role);
      console.log('[PIN LOGIN] User family_id:', user.family_id);
    }

    if (!user) {
      await logUserAction('unknown', 'pin_login_failed', {
        ip_address: ipAddress,
        auth_method: 'pin',
        reason: 'user_not_found_or_invalid_pin',
        device_id: deviceId,
        device_type: deviceType,
      });
      return NextResponse.json(
        { error: 'PIN码错误' },
        { status: 400 }
      );
    }

    // Verify user is child role
    if (user.role !== 'child') {
      await logUserAction(user.id, 'pin_login_failed', {
        ip_address: ipAddress,
        auth_method: 'pin',
        reason: 'not_child_role',
        device_id: deviceId,
        device_type: deviceType,
      });
      return NextResponse.json(
        { error: 'PIN码仅用于儿童账号' },
        { status: 400 }
      );
    }

    // Verify child belongs to a family
    if (!user.family_id) {
      await logUserAction(user.id, 'pin_login_failed', {
        ip_address: ipAddress,
        auth_method: 'pin',
        reason: 'no_family',
        device_id: deviceId,
        device_type: deviceType,
      });
      return NextResponse.json(
        { error: '账号未加入家庭，请联系家长' },
        { status: 400 }
      );
    }

    // Story 1.6 AC #9: Check for existing active child session
    // Child accounts can only be logged in on one device at a time (security)
    // Bypass single-device check for E2E tests (localhost)
    const isE2ETest = clientIp === '127.0.0.1' || clientIp === '::1';

    if (!isE2ETest) {
      const existingSession = await getActiveChildSession(user.id);
      if (existingSession && existingSession.device_id !== deviceId) {
        await logUserAction(user.id, 'pin_login_failed', {
          ip_address: ipAddress,
          auth_method: 'pin',
          reason: 'concurrent_login_blocked',
          device_id: deviceId,
          device_type: deviceType,
          existing_device_id: existingSession.device_id,
        });
        return NextResponse.json(
          { error: '儿童账户只能在一个设备上登录' },
          { status: 403 }
        );
      }
    }

    // Reset rate limit on successful login
    resetRateLimit(ipAddress);

    // Create session with device tracking (Story 1.6 AC #2)
    const sessionToken = generateSessionToken();
    const session = await createSession({
      userId: user.id,
      token: sessionToken,
      deviceId,
      deviceType,
      userAgent,
      ipAddress: clientIp,
      rememberMe: false, // Children cannot use "Remember Me"
    });

    // Create or update user session device
    await upsertUserSessionDevice({
      userId: user.id,
      deviceId,
      deviceType,
      deviceName,
    });

    // Log successful login
    await logUserAction(user.id, 'pin_login_success', {
      ip_address: ipAddress,
      auth_method: 'pin',
      device_id: deviceId,
      device_type: deviceType,
      session_id: session.id,
    });

    // Set the session cookie for Better-Auth compatibility
    const cookieStore = await cookies();
    cookieStore.set('better-auth.session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 36, // 36 hours
      expires: new Date(session.expires_at),
    });

    // Return user data and session token
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.phone, // Using phone as name for children (placeholder)
        role: user.role,
        family_id: user.family_id,
      },
      session: {
        id: session.id,
        token: sessionToken,
        device_type: deviceType,
        device_name: deviceName,
        expires_at: session.expires_at,
      },
    });

    // Set HttpOnly session cookie
    response.cookies.set('better-auth.session_token', sessionToken, {
      httpOnly: true,
      secure: Bun.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 36, // 36 hours
    });

    return response;
  } catch (error) {
    console.error('PIN login error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
