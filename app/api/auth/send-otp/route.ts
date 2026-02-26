import { NextRequest, NextResponse } from 'next/server';
import { isValidChinesePhone } from '@/lib/utils';
import { getUserByPhonePlain } from '@/lib/db/queries/users';

/**
 * Send OTP API Endpoint (For Login)
 *
 * Sends OTP verification code to phone number
 * Only for registered users
 *
 * Source: Story 1.2 AC #1 - OTP code delivery within 60 seconds
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    // Validate phone number format
    if (!phone || !isValidChinesePhone(phone)) {
      return NextResponse.json({
        success: false,
        message: '请输入有效的11位手机号',
      }, { status: 400 });
    }

    // Check if user exists
    const user = await getUserByPhonePlain(phone);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: '手机号未注册',
      }, { status: 404 });
    }

    // Send OTP (for MVP, use fixed debug code)
    // In production, integrate with SMS providers
    const otpCode = '111111'; // Fixed debug code for development
    const expiresAt = new Date(Date.now() + 60 * 1000);

    console.log(`[OTP-DEV] Phone: ${phone}, Code: ${otpCode}, ExpiresAt: ${expiresAt.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: '验证码已发送',
      otpCode, // Include for testing purposes
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({
      success: false,
      message: '发送验证码失败，请稍后重试',
    }, { status: 500 });
  }
}
