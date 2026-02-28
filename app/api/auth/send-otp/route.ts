import { NextRequest, NextResponse } from 'next/server';
import { isValidChinesePhone } from '@/lib/utils';

/**
 * Send OTP API Endpoint (For Registration & Login)
 *
 * Development mode: returns fixed OTP code 111111
 * Production mode: would integrate with SMS providers (aliyun/tencent)
 *
 * Source: specs/init-project/index.md - dev phase uses hardcoded OTP 111111
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    // Validate phone number format
    if (!phone || !isValidChinesePhone(phone)) {
      return NextResponse.json({
        success: false,
        message: '请输入有效的中国手机号（11位，以1开头）',
      }, { status: 400 });
    }

    // Development mode: Use fixed OTP code 111111
    const otpProvider = Bun.env.OTP_PROVIDER || 'console-debug';
    const fixedCode = Bun.env.OTP_DEBUG_CODE || '111111';

    if (otpProvider === 'console-debug') {
      // Debug mode: Log and return fixed code
      console.log(`[OTP-DEBUG] Phone: ${phone}, Fixed Code: ${fixedCode}`);
      return NextResponse.json({
        success: true,
        message: '验证码已发送',
        expiresAt: new Date(Date.now() + 60 * 1000).toISOString(), // 60 seconds
      }, { status: 200 });
    }

    // Console mode: Log random code (for future SMS integration)
    console.log(`[OTP] Phone: ${phone}, Code: ${fixedCode}`);
    return NextResponse.json({
      success: true,
      message: '验证码已发送',
      expiresAt: new Date(Date.now() + 60 * 1000).toISOString(), // 60 seconds
    }, { status: 200 });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({
      success: false,
      message: '发送验证码失败，请稍后重试',
    }, { status: 500 });
  }
}
