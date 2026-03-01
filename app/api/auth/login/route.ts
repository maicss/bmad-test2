import { NextRequest, NextResponse } from 'next/server';
import { isValidChinesePhone } from '@/lib/utils';
import { getUserByPhone, getUserByPhonePlain } from '@/lib/db/queries/users';
import { rateLimitLoginAttempts, resetRateLimit } from '@/lib/auth/rate-limit';
import { logUserAction } from '@/lib/db/queries/audit-logs';

/**
 * Parent Login API Endpoint
 *
 * Supports two authentication flows:
 * - OTP verification: phone (plain) + OTP code
 * - Password: phone (hashed) + password verification
 *
 * Source: Story 1.2 AC #1, #2, #4, #5, #7
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, authMethod, otp, password } = body;

    // Get IP address for rate limiting and audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Validate phone number format
    if (!isValidChinesePhone(phone)) {
      return NextResponse.json(
        { error: '请输入有效的11位手机号' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const rateLimitError = rateLimitLoginAttempts(ipAddress, request.headers);
    if (rateLimitError) {
      return NextResponse.json(
        { error: rateLimitError },
        { status: 429 }
      );
    }

    // Route based on authentication method
    if (authMethod === 'otp') {
      // OTP Login Flow
      return await handleOTPLogin(phone, otp, ipAddress);
    } else if (authMethod === 'password') {
      // Password Login Flow
      return await handlePasswordLogin(phone, password, ipAddress);
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
 * Logs successful/failed login attempts
 *
 * @param phone - Phone number (plain text)
 * @param otp - OTP code
 * @param ipAddress - Request IP address
 * @returns NextResponse
 */
async function handleOTPLogin(
  phone: string,
  otp: string,
  ipAddress: string
): Promise<NextResponse> {
  // Check if user exists (plain phone query for OTP)
  const user = await getUserByPhonePlain(phone);

  if (!user) {
    await logUserAction(user?.id, 'login_failed', {
      phone: phone,
      ip_address: ipAddress,
      auth_method: 'otp',
      query_type: 'plain',
      reason: 'user_not_found',
    });
    return NextResponse.json(
      { error: '手机号未注册' },
      { status: 400 }
    );
  }

  // Verify OTP using Better-Auth
  // Note: Better-Auth phone plugin should be used here
  // For MVP, we'll accept the debug code '111111'
  if (otp !== '111111') {
    await logUserAction(user.id, 'login_failed', {
      phone,
      ip_address: ipAddress,
      auth_method: 'otp',
      query_type: 'plain',
      reason: 'invalid_otp',
    });
    return NextResponse.json(
      { error: '验证码错误' },
      { status: 400 }
    );
  }

  // Reset rate limit on successful login
  resetRateLimit(ipAddress);

  // Log successful login
  await logUserAction(user.id, 'login_success', {
    phone,
    ip_address: ipAddress,
    auth_method: 'otp',
    query_type: 'plain',
  });

  // Return user data (excluding sensitive info)
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
      family_id: user.family_id,
    },
  });
}

/**
 * Handle password login flow
 *
 * Uses phone_hash query for enhanced security
 * Verifies password using Bun.password.verify()
 * Logs successful/failed login attempts
 *
 * @param phone - Phone number
 * @param password - Password
 * @param ipAddress - Request IP address
 * @returns NextResponse
 */
async function handlePasswordLogin(
  phone: string,
  password: string,
  ipAddress: string
): Promise<NextResponse> {
  // Get user by phone_hash (security enhancement)
  const user = await getUserByPhone(phone);

  if (!user) {
    await logUserAction(user?.id, 'login_failed', {
      phone,
      ip_address: ipAddress,
      auth_method: 'password',
      query_type: 'hashed',
      reason: 'user_not_found',
    });
    return NextResponse.json(
      { error: '手机号或密码错误' },
      { status: 400 }
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
    });
    return NextResponse.json(
      { error: '该账户未设置密码，请使用 OTP 方式登录' },
      { status: 400 }
    );
  }

  const passwordValid = await Bun.password.verify(password, user.password_hash);

  if (!passwordValid) {
    await logUserAction(user.id, 'login_failed', {
      phone,
      ip_address: ipAddress,
      auth_method: 'password',
      query_type: 'hashed',
      reason: 'invalid_password',
    });
    return NextResponse.json(
      { error: '手机号或密码错误' },
      { status: 400 }
    );
  }

  // Reset rate limit on successful login
  resetRateLimit(ipAddress);

  // Log successful login
  await logUserAction(user.id, 'login_success', {
    phone,
    ip_address: ipAddress,
    auth_method: 'password',
    query_type: 'hashed',
  });

  // Return user data (excluding sensitive info)
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role,
      family_id: user.family_id,
    },
  });
}
