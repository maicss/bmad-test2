import { NextRequest, NextResponse } from 'next/server';
import { verifyInvitationToken, updateInvitationStatus } from '@/lib/db/queries/invitations';
import { getUserByPhonePlain } from '@/lib/db/queries/users';
import { createUser } from '@/lib/db/queries/users';
import { logUserAction } from '@/lib/db/queries/audit-logs';

/**
 * Accept Invitation API Endpoint
 *
 * Invited parent accepts family invitation and joins existing family
 *
 * Source: Story 1.4 Task 4 - Implement invitation verification and registration API endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, phone, password } = body;

    // Get IP address for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Validate token
    if (!token) {
      return NextResponse.json(
        { error: '缺少邀请码' },
        { status: 400 }
      );
    }

    // Verify invitation token
    const invitation = await verifyInvitationToken(token);
    if (!invitation) {
      return NextResponse.json(
        { error: '邀请码无效或已过期' },
        { status: 400 }
      );
    }

    // Check if user already exists with this phone
    const existingUser = await getUserByPhonePlain(phone);
    if (existingUser) {
      // User already exists, associate them with the family
      // TODO: Update user's family_id
      // For now, return an error
      return NextResponse.json(
        { error: '该手机号已注册，请登录后在设置中加入家庭' },
        { status: 400 }
      );
    }

    // Create new user account
    const newUser = await createUser(phone, 'parent', password, invitation.family_id);

    // Update invitation status to 'accepted'
    await updateInvitationStatus(token, 'accepted');

    // Log invitation acceptance
    await logUserAction(invitation.inviter_user_id, 'invitation_accepted', {
      ip_address: ipAddress,
      family_id: invitation.family_id,
      invited_user_id: newUser.id,
      invitation_token: token,
    });

    await logUserAction(newUser.id, 'user_joined_family', {
      ip_address: ipAddress,
      family_id: invitation.family_id,
      invitation_token: token,
      invited_by_user_id: invitation.inviter_user_id,
    });

    // TODO: Send confirmation notifications
    // - Primary parent: invitation accepted
    // - Invited parent: joined family
    console.log(`[NOTIFICATION] Invitation accepted by ${phone}`);

    return NextResponse.json({
      success: true,
      message: '已成功加入家庭',
      user: {
        id: newUser.id,
        phone: newUser.phone,
        role: newUser.role,
        family_id: newUser.family_id,
      },
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: '接受邀请失败，请稍后重试' },
      { status: 500 }
    );
  }
}
