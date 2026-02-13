import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUser, getUserByPhonePlain, getUserById } from '@/lib/db/queries/users';
import { createFamily, getFamilyByPrimaryParent } from '@/lib/db/queries/families';
import { logUserAction } from '@/lib/db/queries/audit-logs';
import { isValidChinesePhone, isStrongPassword, maskPhone } from '@/lib/utils';
import type { RegisterRequest, RegisterResponse } from '@/types/auth';

/**
 * Parent Registration API Endpoint
 *
 * Supports two registration flows:
 * 1. OTP-based registration: Phone verification only
 * 2. Password-based registration: Phone + password
 *
 * Source: Story 1.1 Task 4
 * Source: Story 1.1 AC #1 - Phone format validation
 * Source: Story 1.1 AC #4 - Double storage (phone + phone_hash)
 * Source: Story 1.1 AC #5 - Error handling with Chinese messages
 * Source: Story 1.1 AC #7 - Audit logging with auth_method
 */
export async function POST(req: NextRequest) {
  try {
    const body: RegisterRequest = await req.json();

    // Get client IP for audit logging
    const ipAddress = req.headers.get('x-forwarded-for') ||
                   req.headers.get('x-real-ip') ||
                   'unknown';

    // === Step 1: Validate phone number format ====
    if (!body.phone || !isValidChinesePhone(body.phone)) {
      return NextResponse.json<RegisterResponse>({
        success: false,
        message: '请输入有效的中国手机号（11位，以1开头）',
      }, { status: 400 });
    }

    // === Step 2: Check if phone already registered ====
    const existingUser = await getUserByPhonePlain(body.phone);
    if (existingUser) {
      return NextResponse.json<RegisterResponse>({
        success: false,
        message: '该手机号已注册，请直接登录',
      }, { status: 409 });
    }

    // === Step 3: Handle registration based on auth method ====
    if (body.type === 'otp') {
      // === OTP Registration Flow ===

      // Validate OTP code
      if (!body.otp || body.otp.length !== 6) {
        return NextResponse.json<RegisterResponse>({
          success: false,
          message: '请输入6位验证码',
        }, { status: 400 });
      }

      // Verify OTP via Better-Auth phone plugin
      const result = await auth.api.verifyPhoneNumber({
        body: {
          phoneNumber: body.phone,
          code: body.otp,
        },
        headers: req.headers,
      });

      if (!result || 'error' in result) {
        const errorMessage = typeof result?.error === 'string'
          ? result.error
          : '验证码错误或已过期，请重新获取';
        return NextResponse.json<RegisterResponse>({
          success: false,
          message: errorMessage,
        }, { status: 400 });
      }

      // OTP verification successful - user created by Better-Auth
      // Get user from database (Better-Auth doesn't return all fields)
      const authUser = result.user;
      const user = authUser ? await getUserById(authUser.id) : null;

      if (!user) {
        return NextResponse.json<RegisterResponse>({
          success: false,
          message: '注册失败，请重试',
        }, { status: 500 });
      }

      // Create family if not exists
      const existingFamily = await getFamilyByPrimaryParent(user.id);
      if (!existingFamily) {
        await createFamily(user.id);
      }

      // Log registration event (OTP method)
      await logUserAction(
        user.id,
        'register',
        { auth_method: 'otp', phone: maskPhone(body.phone) },
        ipAddress
      );

      // Return success response (session cookie already set by Better-Auth)
      return NextResponse.json<RegisterResponse>({
        success: true,
        message: '注册成功！',
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
        },
      }, { status: 200 });

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
      // Note: phone_hash is set internally by createUser()
      const userId = crypto.randomUUID();
      const familyId = crypto.randomUUID();

      // Create family
      await createFamily(userId);

      // Create user
      await createUser(
        body.phone,
        'parent',
        body.password,
        familyId
      );

      // Sign in user (create session) using Better-Auth sign-up API
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: `${body.phone}@bmad-temp.local`, // Use phone-based email for password auth
          password: body.password,
          name: `User-${body.phone.slice(-4)}`,
        },
        headers: req.headers,
      });

      if (!signUpResult || 'error' in signUpResult) {
        const errorMessage = typeof signUpResult?.error === 'string'
          ? signUpResult.error
          : '注册成功但登录失败，请重新登录';
        return NextResponse.json<RegisterResponse>({
          success: false,
          message: errorMessage,
        }, { status: 500 });
      }

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

      // Return success response (session cookie already set by Better-Auth)
      return NextResponse.json<RegisterResponse>({
        success: true,
        message: '注册成功！',
        user: {
          id: userId,
          phone: body.phone,
          role: 'parent',
        },
      }, { status: 200 });

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
