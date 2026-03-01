import { NextRequest, NextResponse } from 'next/server';
import { isValidChinesePhone } from '@/lib/utils';
import { getUserByPhone, getUserByPhonePlain } from '@/lib/db/queries/users';
import { isUserSuspended } from '@/lib/services/account-management';
import { rateLimitLoginAttempts, resetRateLimit } from '@/lib/auth/rate-limit';
import { logUserAction } from '@/lib/db/queries/audit-logs';
import {
  createSession,
  upsertUserSessionDevice,
  getDeviceLock,
  incrementFailedAttempts,
  resetDeviceLock,
} from '@/lib/db/queries/sessions';
import {
  generateDeviceFingerprint,
  detectDeviceType,
  generateDeviceName,
  generateSessionToken,
  extractDeviceInfo,
} from '@/lib/auth/device-fingerprint';

/**
 * Parent Login API Endpoint
 *
 * Story 1.6: Multi-device Login - Enhanced with device tracking
 *
 * Supports two authentication flows:
 * - OTP verification: phone (plain) + OTP code
 * - Password: phone (hashed) + password verification
 *
 * New features (Story 1.6):
 * - Device fingerprinting
 * - Multi-device session support
 * - Device-based rate limiting
 * - "Remember Me" functionality (7-day session)
 *
 * Source: Story 1.2 AC #1, #2, #4, #5, #7
 * Source: Story 1.6 AC #1, #2, #6, #7, #8
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, authMethod, otp, password, rememberMe } = body;

    // Get IP address for rate limiting and audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Extract device information
    const { userAgent, ipAddress: clientIp, deviceType, deviceName } =
      extractDeviceInfo(request);

    // Generate device fingerprint
    const deviceId = await generateDeviceFingerprint(userAgent, clientIp);

    // Validate phone number format
    if (!isValidChinesePhone(phone)) {
      return NextResponse.json(
        { error: '请输入有效的11位手机号' },
        { status: 400 }
      );
    }

    // Route based on authentication method
    if (authMethod === 'otp') {
      // OTP Login Flow
      return await handleOTPLogin(phone, otp, ipAddress, deviceId, deviceType, deviceName, userAgent, clientIp, rememberMe);
    } else if (authMethod === 'password') {
      // Password Login Flow
      return await handlePasswordLogin(phone, password, ipAddress, deviceId, deviceType, deviceName, userAgent, clientIp, rememberMe);
    } else {
      return NextResponse.json(
        { error: '请选择认证方式（OTP或密码）' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
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

/**
 * Handle OTP login flow
 *
 * Uses plain phone query for OTP verification
 * Creates session with device tracking
 * Logs successful/failed login attempts
 *
 * @param phone - Phone number (plain text)
 * @param otp - OTP code
 * @param ipAddress - Request IP address
 * @param deviceId - Device fingerprint
 * @param deviceType - Device type
 * @param deviceName - Device name
 * @param userAgent - User agent string
 * @param clientIp - Client IP address
 * @param rememberMe - Remember me flag
 * @returns NextResponse
 */
async function handleOTPLogin(
  phone: string,
  otp: string,
  ipAddress: string,
  deviceId: string,
  deviceType: 'mobile' | 'tablet' | 'desktop',
  deviceName: string,
  userAgent: string,
  clientIp: string,
  rememberMe: boolean = false
): Promise<NextResponse> {
  // Check if user exists (plain phone query for OTP)
  const user = await getUserByPhonePlain(phone);

  if (!user) {
    await logUserAction(null, 'login_failed', {
      phone: phone,
      ip_address: ipAddress,
      auth_method: 'otp',
      query_type: 'plain',
      reason: 'user_not_found',
      device_id: deviceId,
      device_type: deviceType,
    });
    return NextResponse.json(
      { error: '手机号未注册' },
      { status: 400 }
    );
  }

  // Check device lock (Story 1.6 AC #7 - device-based rate limiting)
  const deviceLock = await getDeviceLock(user.id, deviceId);
  if (deviceLock) {
    const remainingMinutes = Math.ceil(
      (new Date(deviceLock.lock_end_at!).getTime() - Date.now()) / 1000 / 60
    );
    return NextResponse.json(
      { error: `登录失败次数过多，请${remainingMinutes}分钟后再试` },
      { status: 429 }
    );
  }

  // Verify OTP using Better-Auth
  // Note: Better-Auth phone plugin should be used here
  // For MVP, we'll accept debug code '111111'
  if (otp !== '111111') {
    // Increment failed attempts
    const lock = await incrementFailedAttempts(user.id, deviceId);

    await logUserAction(user.id, 'login_failed', {
      phone,
      ip_address: ipAddress,
      auth_method: 'otp',
      query_type: 'plain',
      reason: 'invalid_otp',
      device_id: deviceId,
      device_type: deviceType,
      failed_attempts: lock?.failed_attempts || 1,
    });

    if (lock) {
      return NextResponse.json(
        { error: `登录失败次数过多，请${Math.ceil((new Date(lock.lock_end_at!).getTime() - Date.now()) / 1000 / 60)}分钟后再试` },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: '验证码错误' },
      { status: 400 }
    );
  }

  // Reset device lock on successful login
  await resetDeviceLock(user.id, deviceId);
  // Check if user account is suspended (Story 1.7 AC #2)
  const suspended = await isUserSuspended(user.id);
  if (suspended) {
    await logUserAction(user.id, 'login_failed', {
      phone,
      ip_address: ipAddress,
      auth_method: 'otp',
      query_type: 'plain',
      reason: 'account_suspended',
      device_id: deviceId,
      device_type: deviceType,
    });
    return NextResponse.json(
      { error: '该账户已被家长挂起' },
      { status: 403 }
    );
  }

  // Create session with device tracking (Story 1.6 AC #2)
  const sessionToken = generateSessionToken();
  const session = await createSession({
    userId: user.id,
    token: sessionToken,
    deviceId,
    deviceType,
    userAgent,
    ipAddress: clientIp,
    rememberMe: rememberMe || false,
  });

  // Create or update user session device (Story 1.6 AC #6)
  await upsertUserSessionDevice({
    userId: user.id,
    deviceId,
    deviceType,
    deviceName,
  });

  // Log successful login
  await logUserAction(user.id, 'login_success', {
    phone,
    ip_address: ipAddress,
    auth_method: 'otp',
    query_type: 'plain',
    device_id: deviceId,
    device_type: deviceType,
    session_id: session.id,
    remember_me: rememberMe,
  });

  // Return user data and session token
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
      family_id: user.family_id,
    },
    session: {
      id: session.id,
      token: sessionToken,
      device_type: deviceType,
      device_name: deviceName,
      remember_me: rememberMe,
      expires_at: session.expires_at,
    },
  });
  
  // Set HttpOnly session cookie
  const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 36; // 7 days or 36 hours
  response.cookies.set('better-auth.session_token', sessionToken, {
    httpOnly: true,
    secure: Bun.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: cookieMaxAge,
  });
  
  return response;
}

/**
 * Handle password login flow
 *
 * Uses phone_hash query for enhanced security
 * Verifies password using Bun.password.verify()
 * Creates session with device tracking
 *
 * @param phone - Phone number
 * @param password - Password
 * @param ipAddress - Request IP address
 * @param deviceId - Device fingerprint
 * @param deviceType - Device type
 * @param deviceName - Device name
 * @param userAgent - User agent string
 * @param clientIp - Client IP address
 * @param rememberMe - Remember me flag
 * @returns NextResponse
 */
async function handlePasswordLogin(
  phone: string,
  password: string,
  ipAddress: string,
  deviceId: string,
  deviceType: 'mobile' | 'tablet' | 'desktop',
  deviceName: string,
  userAgent: string,
  clientIp: string,
  rememberMe: boolean = false
): Promise<NextResponse> {
  // Get user by phone_hash (security enhancement)
  const user = await getUserByPhone(phone);

  if (!user) {
    await logUserAction(null, 'login_failed', {
      phone,
      ip_address: ipAddress,
      auth_method: 'password',
      query_type: 'hashed',
      reason: 'user_not_found',
      device_id: deviceId,
      device_type: deviceType,
    });
    return NextResponse.json(
      { error: '手机号或密码错误' },
      { status: 400 }
    );
  }

  // Check device lock (Story 1.6 AC #7 - device-based rate limiting)
  const deviceLock = await getDeviceLock(user.id, deviceId);
  if (deviceLock) {
    const remainingMinutes = Math.ceil(
      (new Date(deviceLock.lock_end_at!).getTime() - Date.now()) / 1000 / 60
    );
    return NextResponse.json(
      { error: `登录失败次数过多，请${remainingMinutes}分钟后再试` },
      { status: 429 }
    );
  }

  // Verify password using Bun.password.verify
  if (!user.password_hash) {
    await logUserAction(user.id, 'login_failed', {
      phone,
      ip_address: ipAddress,
      auth_method: 'password',
      query_type: 'hashed',
      reason: 'no_password_set',
      device_id: deviceId,
      device_type: deviceType,
    });
    return NextResponse.json(
      { error: '该账户未设置密码，请使用 OTP 方式登录' },
      { status: 400 }
    );
  }

  const passwordValid = await Bun.password.verify(password, user.password_hash);

  if (!passwordValid) {
    // Increment failed attempts
    const lock = await incrementFailedAttempts(user.id, deviceId);

    await logUserAction(user.id, 'login_failed', {
      phone,
      ip_address: ipAddress,
      auth_method: 'password',
      query_type: 'hashed',
      reason: 'invalid_password',
      device_id: deviceId,
      device_type: deviceType,
      failed_attempts: lock?.failed_attempts || 1,
    });

    if (lock) {
      return NextResponse.json(
        { error: `登录失败次数过多，请${Math.ceil((new Date(lock.lock_end_at!).getTime() - Date.now()) / 1000 / 60)}分钟后再试` },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: '手机号或密码错误' },
      { status: 400 }
    );
  }

  // Reset device lock on successful login
  await resetDeviceLock(user.id, deviceId);
  // Check if user account is suspended (Story 1.7 AC #2)
  const suspended = await isUserSuspended(user.id);
  if (suspended) {
    await logUserAction(user.id, 'login_failed', {
      phone,
      ip_address: ipAddress,
      auth_method: 'otp',
      query_type: 'plain',
      reason: 'account_suspended',
      device_id: deviceId,
      device_type: deviceType,
    });
    return NextResponse.json(
      { error: '该账户已被家长挂起' },
      { status: 403 }
    );
  }

  // Create session with device tracking (Story 1.6 AC #2)
  const sessionToken = generateSessionToken();
  const session = await createSession({
    userId: user.id,
    token: sessionToken,
    deviceId,
    deviceType,
    userAgent,
    ipAddress: clientIp,
    rememberMe: rememberMe || false,
  });

  // Create or update user session device (Story 1.6 AC #6)
  await upsertUserSessionDevice({
    userId: user.id,
    deviceId,
    deviceType,
    deviceName,
  });

  // Log successful login
  await logUserAction(user.id, 'login_success', {
    phone,
    ip_address: ipAddress,
    auth_method: 'password',
    query_type: 'hashed',
    device_id: deviceId,
    device_type: deviceType,
    session_id: session.id,
    remember_me: rememberMe,
  });

  // Return user data and session token
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
      family_id: user.family_id,
    },
    session: {
      id: session.id,
      token: sessionToken,
      device_type: deviceType,
      device_name: deviceName,
      remember_me: rememberMe,
      expires_at: session.expires_at,
    },
  });
  
  // Set HttpOnly session cookie
  const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 36; // 7 days or 36 hours
  response.cookies.set('better-auth.session_token', sessionToken, {
    httpOnly: true,
    secure: Bun.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: cookieMaxAge,
  });
  
  return response;
}
