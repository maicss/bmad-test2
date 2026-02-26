import { NextRequest, NextResponse } from 'next/server';
import { getChildByPIN } from '@/lib/db/queries/users';
import { rateLimitLoginAttempts, resetRateLimit } from '@/lib/auth/rate-limit';
import { logUserAction } from '@/lib/db/queries/audit-logs';

/**
 * Child PIN Login API Endpoint
 *
 * Children login using 4-digit PIN code
 * Faster than phone login, suitable for shared devices
 *
 * Source: Story 1.3 AC #1-#5, #8
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    // Get IP address for rate limiting and audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Validate PIN format (4 digits, numeric only)
    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: '请输入4位数字PIN码' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const rateLimitError = rateLimitLoginAttempts(ipAddress);
    if (rateLimitError) {
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
      await logUserAction(user?.id, 'pin_login_failed', {
        ip_address: ipAddress,
        auth_method: 'pin',
        reason: 'user_not_found_or_invalid_pin',
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
      });
      return NextResponse.json(
        { error: '账号未加入家庭，请联系家长' },
        { status: 400 }
      );
    }

    // Reset rate limit on successful login
    resetRateLimit(ipAddress);

    // Log successful login
    await logUserAction(user.id, 'pin_login_success', {
      ip_address: ipAddress,
      auth_method: 'pin',
    });

    // Return user data (excluding sensitive info)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.phone, // Using phone as name for children (placeholder)
        role: user.role,
        family_id: user.family_id,
      },
    });
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
