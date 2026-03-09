import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByPhonePlain, getUserById } from '@/lib/db/queries/users';
import { createFamily, getFamilyByPrimaryParent } from '@/lib/db/queries/families';
import { logUserAction } from '@/lib/db/queries/audit-logs';
import { isValidChinesePhone, isStrongPassword, maskPhone } from '@/lib/utils';
import type { RegisterRequest, RegisterResponse } from '@/types/auth';
import { createSession } from '@/lib/db/queries/sessions';
import {
  generateDeviceFingerprint,
  detectDeviceType,
  generateDeviceName,
  generateSessionToken,
  extractDeviceInfo,
} from '@/lib/auth/device-fingerprint';

/**
 * Parent Registration API Endpoint
 *
 * Development mode: Uses fixed OTP code 111111
 * Production mode: Would integrate with Better-Auth for SMS verification
 *
 * Source: Story 1.1 Task 4
 * Source: Story 1.1 AC #1 - Phone format validation
 * Source: Story 1.1 AC #3 - Create session and redirect to dashboard
 * Source: Story 1.1 AC #4 - Double storage (phone + phone_hash)
 * Source: Story 1.1 AC #5 - Error handling with Chinese messages
 * Source: Story 1.1 AC #7 - Audit logging with auth_method
 * Source: specs/init-project/index.md - dev phase uses hardcoded OTP 111111
 */
export async function POST(req: NextRequest) {
  try {
    const body: RegisterRequest = await req.json();

    // Get client IP for audit logging
    const ipAddress = req.headers.get('x-forwarded-for') ||
                   req.headers.get('x-real-ip') ||
                   'unknown';

    // === Step 1: Validate phone number format ===
    if (!body.phone || !isValidChinesePhone(body.phone)) {
      return NextResponse.json<RegisterResponse>({
        success: false,
        message: '请输入有效的中国手机号（11位，以1开头）',
      }, { status: 400 });
    }

    // === Step 2: Check if phone already registered ===
    const existingUser = await getUserByPhonePlain(body.phone);
    if (existingUser) {
      return NextResponse.json<RegisterResponse>({
        success: false,
        message: '该手机号已注册，请直接登录',
      }, { status: 409 });
    }

    // === Step 3: Handle registration based on auth method ===
    if (body.type === 'otp') {
      // === OTP Registration Flow ===

      // Validate OTP code
      if (!body.otp || body.otp.length !== 6) {
        return NextResponse.json<RegisterResponse>({
          success: false,
          message: '请输入6位验证码',
        }, { status: 400 });
      }

      // Development mode: Verify fixed OTP code
      const otpProvider = Bun.env.OTP_PROVIDER || 'console';
      const fixedCode = Bun.env.OTP_DEBUG_CODE || '111111';

      if (otpProvider === 'console' || otpProvider === 'console-debug') {
        if (body.otp !== fixedCode) {
          return NextResponse.json<RegisterResponse>({
            success: false,
            message: '验证码错误或已过期，请重新获取',
          }, { status: 400 });
        }

        console.log(`[OTP-DEBUG] Verified: ${body.phone} with code ${body.otp}`);
      } else {
        console.log(`[OTP] Verifying ${body.phone} with code ${body.otp}`);
      }

      // Create user
      const userId = Bun.randomUUIDv7();
      const familyId = Bun.randomUUIDv7();

      // Create family
      await createFamily(userId);

      // Create user
      await createUser(
        body.phone,
        'parent',
        null, // No password for OTP users
        familyId
      );

      // Get created user
      const user = await getUserByPhonePlain(body.phone);
      if (!user) {
        return NextResponse.json<RegisterResponse>({
          success: false,
          message: '注册失败，请重试',
        }, { status: 500 });
      }

      // Log registration event (OTP method)
      await logUserAction(
        userId,
        'register',
        { auth_method: 'otp', phone: maskPhone(body.phone) },
        ipAddress
      );

      // Extract device info for session creation
      const { userAgent, ipAddress: clientIp, deviceType, deviceName } = extractDeviceInfo(req);
      const deviceId = await generateDeviceFingerprint(userAgent, clientIp);

      // Create session (AC#3: 36-hour HttpOnly Cookie session)
      const sessionToken = generateSessionToken();
      const session = await createSession({
        userId: user.id,
        token: sessionToken,
        deviceId,
        deviceType,
        userAgent,
        ipAddress: clientIp,
        rememberMe: false,
      });

      // Return success response with session cookie
      const response = NextResponse.json<RegisterResponse>({
        success: true,
        message: '注册成功！',
        user: {
          id: userId,
          phone: body.phone,
          role: 'parent',
        },
      }, { status: 200 });

      // Set HttpOnly session cookie (AC#3, AC#11)
      response.cookies.set('better-auth.session_token', sessionToken, {
        httpOnly: true,
        secure: Bun.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 36, // 36 hours
      });

      return response;

    } else if (body.type === 'password') {
      // === Password Registration Flow ===

      // Validate password
      if (!body.password || body.password.length < 8 || body.password.length > 20) {
        return NextResponse.json<RegisterResponse>({
          success: false,
          message: '密码长度必须在8-20位之间',
        }, { status: 400 });
      }

      // Validate password strength
      if (!isStrongPassword(body.password)) {
        return NextResponse.json<RegisterResponse>({
          success: false,
          message: '密码必须包含至少1个大写字母和1个数字',
        }, { status: 400 });
      }

      // Validate password confirmation
      if (body.password !== body.confirmPassword) {
        return NextResponse.json<RegisterResponse>({
          success: false,
          message: '两次输入的密码不一致',
        }, { status: 400 });
      }

      // Create user with password
      const userId = Bun.randomUUIDv7();
      const familyId = Bun.randomUUIDv7();

      // Create family
      await createFamily(userId);

      // Create user
      await createUser(
        body.phone,
        'parent',
        body.password,
        familyId
      );

      // Get created user
      const user = await getUserByPhonePlain(body.phone);
      if (!user) {
        return NextResponse.json<RegisterResponse>({
          success: false,
          message: '注册成功但用户信息获取失败，请重新登录',
        }, { status: 500 });
      }

      // Log registration event (password method)
      await logUserAction(
        userId,
        'register',
        { auth_method: 'password', phone: maskPhone(body.phone) },
        ipAddress
      );

      // Extract device info for session creation
      const { userAgent, ipAddress: clientIp, deviceType, deviceName } = extractDeviceInfo(req);
      const deviceId = await generateDeviceFingerprint(userAgent, clientIp);

      // Create session (AC#3: 36-hour HttpOnly Cookie session)
      const sessionToken = generateSessionToken();
      const session = await createSession({
        userId: user.id,
        token: sessionToken,
        deviceId,
        deviceType,
        userAgent,
        ipAddress: clientIp,
        rememberMe: false,
      });

      // Return success response with session cookie
      const response = NextResponse.json<RegisterResponse>({
        success: true,
        message: '注册成功！',
        user: {
          id: userId,
          phone: body.phone,
          role: 'parent',
        },
      }, { status: 200 });

      // Set HttpOnly session cookie (AC#3, AC#11)
      response.cookies.set('better-auth.session_token', sessionToken, {
        httpOnly: true,
        secure: Bun.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 36, // 36 hours
      });

      return response;

    } else {
      return NextResponse.json<RegisterResponse>({
        success: false,
        message: '请选择注册方式（验证码或密码）',
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[Register API] Error:', error);

    return NextResponse.json<RegisterResponse>({
      success: false,
      message: '服务器错误，请稍后重试',
    }, { status: 500 });
  }
}
