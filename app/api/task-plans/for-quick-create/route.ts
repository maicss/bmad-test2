/**
 * Task Templates for Quick Create API Endpoint
 *
 * Story 2.6: Parent Uses Template to Quickly Create Task
 *
 * GET /api/task-plans/for-quick-create - Get templates for quick task creation
 *
 * Source: Story 2.6 AC #1-#2
 * Source: _bmad-output/project-context.md - RED LIST rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { getTaskTemplatesForQuickCreate } from '@/lib/db/queries/tasks';

/**
 * GET /api/task-plans/for-quick-create - Get templates for quick task creation
 *
 * Returns parent's published templates and admin templates for quick task creation.
 * Only published templates are included (drafts are excluded).
 *
 * Query parameters:
 * - search: Optional search term to filter templates by title
 * - type: Optional filter ('mine' | 'admin' | 'all', default: 'all')
 *
 * Response:
 * - 200: Templates retrieved successfully
 * - 401: Unauthorized
 * - 403: Forbidden (not a parent)
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // Verify session
    const session = await getSessionByToken(sessionToken);
    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: '会话已过期，请重新登录' },
        { status: 401 }
      );
    }

    // Get user
    const user = await getUserById(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // Check if user is a parent
    if (user.role !== 'parent') {
      return NextResponse.json(
        { error: '只有家长可以使用模板创建任务' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search')?.toLowerCase() || '';
    const typeFilter = searchParams.get('type') || 'all';

    // Get templates
    const { parentTemplates, adminTemplates } = await getTaskTemplatesForQuickCreate(user.family_id!);

    // Filter by search term if provided
    let filteredParentTemplates = parentTemplates;
    let filteredAdminTemplates = adminTemplates;

    if (searchTerm) {
      filteredParentTemplates = parentTemplates.filter(t =>
        t.title.toLowerCase().includes(searchTerm)
      );
      filteredAdminTemplates = adminTemplates.filter(t =>
        t.title.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by type
    let resultParentTemplates = filteredParentTemplates;
    let resultAdminTemplates = filteredAdminTemplates;

    if (typeFilter === 'mine') {
      resultAdminTemplates = [];
    } else if (typeFilter === 'admin') {
      resultParentTemplates = [];
    }

    return NextResponse.json({
      success: true,
      parentTemplates: resultParentTemplates,
      adminTemplates: resultAdminTemplates,
    });
  } catch (error) {
    console.error('Get task templates error:', error);
    return NextResponse.json(
      { error: '获取模板失败，请稍后重试' },
      { status: 500 }
    );
  }
}
