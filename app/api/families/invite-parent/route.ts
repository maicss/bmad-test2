import { NextRequest, NextResponse } from 'next/server';
import { createInvitation, getPendingInvitationByPhone, verifyInvitationToken } from '@/lib/db/queries/invitations';
import { getUserById } from '@/lib/db/queries/users';
import { logUserAction } from '@/lib/db/queries/audit-logs';
import { getFamilyById } from '@/lib/db/queries/families';

/**
 * Send Parent Invitation API Endpoint
 *
 * Primary parent can invite other parents to join their family
 *
 * Source: Story 1.4 Task 3 - Implement invitation creation API endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    // Get IP address for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // TODO: Get current user from session
    // For now, use test user ID
    const currentUserId = 'test-parent-1111';

    // Validate phone number format
    if (!phone || !/^1\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: '请输入有效的11位手机号' },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await getUserById(currentUserId);
    if (!currentUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      );
    }

    // Verify user is primary parent
    const family = await getFamilyById(currentUser.family_id || '');
    if (!family || family.primary_parent_id !== currentUserId) {
      return NextResponse.json(
        { error: '只有主要家长可以发送邀请' },
        { status: 403 }
      );
    }

    // Check if there's already a pending invitation for this phone
    const existingInvitation = await getPendingInvitationByPhone(phone);
    if (existingInvitation) {
      return NextResponse.json(
        { error: '该手机号已有待处理的邀请' },
        { status: 400 }
      );
    }

    // Create invitation
    const invitation = await createInvitation(
      currentUserId,
      currentUser.family_id || '',
      phone,
      24 // 24 hours expiration
    );

    // Generate invitation link
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT}`}/accept-invitation?token=${invitation.token}`;

    // Log invitation creation
    await logUserAction(currentUserId, 'invitation_created', {
      ip_address: ipAddress,
      family_id: currentUser.family_id,
      invited_phone: phone,
      invitation_token: invitation.token,
      invitation_link: invitationLink,
    });

    // TODO: Send invitation SMS using Better-Auth phone plugin
    // For now, just log the invitation link
    console.log(`[INVITATION] Phone: ${phone}, Link: ${invitationLink}`);

    return NextResponse.json({
      success: true,
      message: '邀请已发送',
      invitation: {
        token: invitation.token,
        expires_at: invitation.expires_at,
        link: invitationLink,
      },
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: '发送邀请失败，请稍后重试' },
      { status: 500 }
    );
  }
}
