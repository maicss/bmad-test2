'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByPhonePlain } from '@/lib/db/queries/users';
import { createFamily } from '@/lib/db/queries/families';
import { logUserAction } from '@/lib/db/queries/audit-logs';
import { isValidChinesePhone, isStrongPassword, maskPhone } from '@/lib/utils';
import { createSession } from '@/lib/db/queries/sessions';
import { cookies } from 'next/headers';
import {
  generateDeviceFingerprint,
  generateSessionToken,
  extractDeviceInfo,
} from '@/lib/auth/device-fingerprint';

/**
 * Server Action for User Registration
 *
 * This bypasses React 19's event system issues with Playwright
 * by using native HTML form submission
 */
export async function registerAction(formData: FormData) {
  // Get client IP for audit logging (simulate from headers)
  const ipAddress = 'unknown';

  // Extract form data
  const phone = formData.get('phone') as string;
  const type = formData.get('authMethod') as string;
  const otp = formData.get('otp') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // === Step 1: Validate phone number format ===
  if (!phone || !isValidChinesePhone(phone)) {
    return {
      success: false,
      message: '请输入有效的中国手机号（11位，以1开头）',
    };
  }

  // === Step 2: Check if phone already registered ===
  const existingUser = await getUserByPhonePlain(phone);
  if (existingUser) {
    return {
      success: false,
      message: '该手机号已注册，请直接登录',
    };
  }

  // === Step 3: Handle registration based on auth method ===
  if (type === 'otp') {
    // === OTP Registration Flow ===

    // Validate OTP code
    if (!otp || otp.length !== 6) {
      return {
        success: false,
        message: '请输入6位验证码',
      };
    }

    // Development mode: Verify fixed OTP code
    const otpProvider = Bun.env.OTP_PROVIDER || 'console-debug';
    const fixedCode = Bun.env.OTP_DEBUG_CODE || '111111';

    if (otpProvider === 'console-debug') {
      if (otp !== fixedCode) {
        return {
          success: false,
          message: '验证码错误或已过期，请重新获取',
        };
      }

      console.log(`[OTP-DEBUG] Verified: ${phone} with code ${otp}`);
    } else {
      console.log(`[OTP] Verifying ${phone} with code ${otp}`);
    }

    // Create user
    const userId = Bun.randomUUIDv7();
    const familyId = Bun.randomUUIDv7();

    // Create family
    await createFamily(userId);

    // Create user
    await createUser(
      phone,
      'parent',
      null, // No password for OTP users
      familyId
    );

    // Get created user
    const user = await getUserByPhonePlain(phone);
    if (!user) {
      return {
        success: false,
        message: '注册失败，请重试',
      };
    }

    // Log registration event (OTP method)
    await logUserAction(
      userId,
      'register',
      { auth_method: 'otp', phone: maskPhone(phone) },
      ipAddress
    );

    // Extract device info for session creation
    const { userAgent, ipAddress: clientIp, deviceType, deviceName } = extractDeviceInfo(new NextRequest());
    const deviceId = await generateDeviceFingerprint(userAgent, clientIp);

    // Create session
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

    // Set HttpOnly session cookie
    const cookieStore = await cookies();
    cookieStore.set('better-auth.session_token', sessionToken, {
      httpOnly: true,
      secure: Bun.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 36, // 36 hours
    });

    return {
      success: true,
      message: '注册成功！',
      user: {
        id: userId,
        phone: phone,
        role: 'parent',
      },
    };

  } else if (type === 'password') {
    // === Password Registration Flow ===

    // Validate password
    if (!password || password.length < 8 || password.length > 20) {
      return {
        success: false,
        message: '密码长度必须在8-20位之间',
      };
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return {
        success: false,
        message: '密码必须包含至少1个大写字母和1个数字',
      };
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return {
        success: false,
        message: '两次输入的密码不一致',
      };
    }

    // Create user with password
    const userId = Bun.randomUUIDv7();
    const familyId = Bun.randomUUIDv7();

    // Create family
    await createFamily(userId);

    // Create user
    await createUser(
      phone,
      'parent',
      password,
      familyId
    );

    // Get created user
    const user = await getUserByPhonePlain(phone);
    if (!user) {
      return {
        success: false,
        message: '注册成功但用户信息获取失败，请重新登录',
      };
    }

    // Log registration event (password method)
    await logUserAction(
      userId,
      'register',
      { auth_method: 'password', phone: maskPhone(phone) },
      ipAddress
    );

    // Extract device info for session creation
    const { userAgent, ipAddress: clientIp, deviceType, deviceName } = extractDeviceInfo(new NextRequest());
    const deviceId = await generateDeviceFingerprint(userAgent, clientIp);

    // Create session
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

    // Set HttpOnly session cookie
    const cookieStore = await cookies();
    cookieStore.set('better-auth.session_token', sessionToken, {
      httpOnly: true,
      secure: Bun.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 36, // 36 hours
    });

    return {
      success: true,
      message: '注册成功！',
      user: {
        id: userId,
        phone: phone,
        role: 'parent',
      },
    };

  } else {
    return {
      success: false,
      message: '请选择注册方式（验证码或密码）',
    };
  }
}
