import { NextRequest, NextResponse } from 'next/server';
import { createChildAccount, getFamilyChildren } from '@/lib/db/queries/users';
import { logUserAction } from '@/lib/db/queries/audit-logs';

/**
 * Add Child to Family API Endpoint
 *
 * Parent can create child accounts with auto-generated PIN codes
 *
 * Source: Story 1.5 Task 2 - Implement child creation API endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, age } = body;

    // Get IP address for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // TODO: Get current user from session
    // For now, use test user ID
    const currentUserId = 'test-parent-1111';

    // Get current user to verify they're a parent
    const { getUserById } = await import('@/lib/db/queries/users');
    const currentUser = await getUserById(currentUserId);
    if (!currentUser || currentUser.role !== 'parent' || !currentUser.family_id) {
      return NextResponse.json(
        { error: '只有家长可以创建儿童账户' },
        { status: 403 }
      );
    }

    // Validate child name
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: '儿童姓名不能为空' },
        { status: 400 }
      );
    }

    if (name.trim().length > 50) {
      return NextResponse.json(
        { error: '儿童姓名不能超过50个字符' },
        { status: 400 }
      );
    }

    // Validate child age (6-12 years)
    const ageNum = Number(age);
    if (!age || isNaN(ageNum) || ageNum < 6 || ageNum > 12) {
      return NextResponse.json(
        { error: '儿童年龄必须在6-12岁之间' },
        { status: 400 }
      );
    }

    // Create child account with auto-generated PIN
    const child = await createChildAccount(name.trim(), ageNum, currentUser.family_id);

    // Log child creation event
    await logUserAction(currentUserId, 'child_account_created', {
      ip_address: ipAddress,
      family_id: currentUser.family_id,
      child_id: child.id,
      child_name: child.phone, // Using phone field to store name temporarily
      child_age: ageNum,
      child_pin: child.generatedPin, // Temporary property from createChildAccount
    });

    // Get all family children
    const children = await getFamilyChildren(currentUser.family_id);

    return NextResponse.json({
      success: true,
      message: '儿童账户创建成功',
      child: {
        id: child.id,
        name: child.phone, // Using phone field to store name temporarily
        age: ageNum,
        pin: child.generatedPin, // Auto-generated PIN
        family_id: child.family_id,
        role: child.role,
        created_at: child.created_at,
      },
      children: children.map(c => ({
        id: c.id,
        name: c.phone, // Using phone field to store name temporarily
        role: c.role,
        created_at: c.created_at,
        // Note: PIN is not returned for security reasons
      })),
    });
  } catch (error) {
    console.error('Add child error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: '创建儿童账户失败，请稍后重试' },
      { status: 500 }
    );
  }
}
