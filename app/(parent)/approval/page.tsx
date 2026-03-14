/**
 * Task Approval Page
 *
 * Story 2.7: Parent Batch Approves Tasks
 *
 * Parent view for batch approving completed tasks
 * - Shows list of tasks pending approval (completed by child, waiting parent approval)
 * - Supports single and batch approval/rejection
 * - Shows proof images when available
 *
 * Route: /parent/approval
 * Access: Parent role only
 */

import { redirect } from 'next/navigation';
import { TaskApprovalList } from '@/components/features/task-approval-list';
import { AuditLogList } from '@/components/features/audit-log-list';
import { getTasksByFilter } from '@/lib/db/queries/tasks';
import { getFamilyChildren } from '@/lib/db/queries/users';
import { getSessionByToken } from '@/lib/db/queries/sessions';
import { getUserById } from '@/lib/db/queries/users';
import { cookies } from 'next/headers';

async function getParentUser(familyId: string) {
  'use server';

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('better-auth.session_token')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await getSessionByToken(sessionToken);
  if (!session || new Date(session.expires_at) < new Date()) {
    return null;
  }

  const user = await getUserById(session.user_id);
  if (!user || user.role !== 'parent' || user.family_id !== familyId) {
    return null;
  }

  return user;
}

export default async function ApprovalPage({
  searchParams,
}: {
  searchParams: { family_id?: string };
}) {
  // Get family ID from search params or user session
  const familyId = searchParams.family_id;

  if (!familyId) {
    redirect('/tasks');
  }

  // Verify parent user
  const parent = await getParentUser(familyId);
  if (!parent) {
    redirect('/login');
  }

  // Get data - fetch tasks waiting for parent approval
  const [tasksResult, familyChildren] = await Promise.all([
    getTasksByFilter({
      family_id: familyId,
      status: ['pending_approval', 'completed', 'rejected']
    }),
    getFamilyChildren(familyId),
  ]);

  const tasks = tasksResult.map(task => ({
    ...task,
    completed_at: task.completed_at ? new Date(task.completed_at) : null,
  }));

  const children = familyChildren.map(child => ({
    id: child.id,
    name: child.name || '未知儿童',
  }));

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">任务审批</h1>
        <p className="text-muted-foreground">
          审批孩子已完成的任务，通过后积分将自动累加
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main task approval list */}
        <div className="lg:col-span-2">
          <TaskApprovalList
            familyId={familyId}
            tasks={tasks}
            familyChildren={children}
            onRefresh={async () => {
              'use server';
              // This would trigger a revalidation
              console.log('Refreshing task list...');
            }}
          />
        </div>

        {/* Audit log sidebar */}
        <div className="lg:col-span-1">
          <AuditLogList userId={parent.id} limit={10} />
        </div>
      </div>
    </div>
  );
}
