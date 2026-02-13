import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByPhonePlain } from '@/lib/db/queries/users';
import { isValidChinesePhone } from '@/lib/utils';
import type { SendOTPRequest, SendOTPResponse } from '@/types/auth';

/**
 * Send OTP API Endpoint
 *
 * Sends OTP verification code to phone number
 *
 * Source: Story 1.1 AC #1 - OTP code delivery within 60 seconds
 */
export async function POST(req: NextRequest) {
  try {
    const body: SendOTPRequest = await req.json();

    // Validate phone number format
    if (!body.phone || !isValidChinesePhone(body.phone)) {
      return NextResponse.json<SendOTPResponse>({
        success: false,
        message: '请输入有效的中国手机号（11位，以1开头）',
      }, { status: 400 });
    }

    // Check if phone already registered
    const existingUser = await getUserByPhonePlain(body.phone);
    if (existingUser) {
      return NextResponse.json<SendOTPResponse>({
        success: false,
        message: '该手机号已注册，请直接登录',
      }, { status: 409 });
    }

    // Send OTP via Better-Auth phone plugin
    const result = await auth.api.sendPhoneNumberOTP({
      body: {
        phoneNumber: body.phone,
      },
      headers: req.headers,
    });

    if (!result || 'error' in result) {
      const errorMessage = typeof result?.error === 'string'
        ? result.error
        : '发送验证码失败，请稍后重试';
      return NextResponse.json<SendOTPResponse>({
        success: false,
        message: errorMessage,
      }, { status: 500 });
    }

    // Return success response
    return NextResponse.json<SendOTPResponse>({
      success: true,
      message: '验证码已发送，请在60秒内输入',
      expiresAt: Date.now() + 60 * 1000, // 60 seconds from now
    }, { status: 200 });

  } catch (error) {
    console.error('[Send OTP API] Error:', error);

    return NextResponse.json<SendOTPResponse>({
      success: false,
      message: '服务器错误，请稍后重试',
    }, { status: 500 });
  }
}
