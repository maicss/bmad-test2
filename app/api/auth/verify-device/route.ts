import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session-utils';
import { getUserSessionDevices, isDeviceTrusted } from '@/lib/db/queries/sessions';
import { upsertUserSessionDevice } from '@/lib/db/queries/sessions';
import { extractDeviceInfo, generateDeviceFingerprint } from '@/lib/auth/device-fingerprint';

/**
 * Verify device before login
 *
 * Story 1.6 Task 6 - Device verification on new device
 *
 * POST /api/auth/verify-device
 *
 * Checks if device is trusted for the user
 * If not trusted, requires password/PIN re-verification
 *
 * AC #6: 系统在用户更换设备时（如从手机换到电脑），要求输入密码或PIN码进行二次验证
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, deviceId } = await request.json();

    if (!userId || !deviceId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // Check if device is trusted
    const isTrusted = await isDeviceTrusted(userId, deviceId);

    if (isTrusted) {
      return NextResponse.json({
        success: true,
        trusted: true,
        message: '设备已验证，可直接登录',
      });
    } else {
      return NextResponse.json({
        success: true,
        trusted: false,
        message: '新设备，请输入密码或PIN码进行验证',
        requireVerification: true,
      });
    }
  } catch (error) {
    console.error('Verify device error:', error);
    return NextResponse.json(
      { error: '设备验证失败' },
      { status: 500 }
    );
  }
}

/**
 * Trust a device after successful verification
 *
 * POST /api/auth/verify-device/trust
 *
 * Marks device as trusted for future logins
 */
export async function POST_TRUST(request: NextRequest) {
  try {
    // Verify session
    const session = await verifySessionToken(request);
    if (!session) {
      return NextResponse.json(
        { error: '未登录或会话已过期' },
        { status: 401 }
      );
    }

    const { deviceName } = await request.json();

    // Extract device info
    const { deviceType } = extractDeviceInfo(request);

    // Update device as trusted
    const device = await upsertUserSessionDevice({
      userId: session.user_id,
      deviceId: session.device_id,
      deviceType,
      deviceName: deviceName || '未知设备',
      isTrusted: true,
    });

    return NextResponse.json({
      success: true,
      message: '设备已标记为可信设备',
      device: {
        id: device.id,
        deviceName: device.device_name,
        isTrusted: true,
      },
    });
  } catch (error) {
    console.error('Trust device error:', error);
    return NextResponse.json(
      { error: '标记设备失败' },
      { status: 500 }
    );
  }
}
