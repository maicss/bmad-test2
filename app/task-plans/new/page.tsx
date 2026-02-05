import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, isAdmin, isParent } from "@/lib/auth";
import { getUserByPhone } from "@/lib/db/queries";
import { getRawDb } from "@/database/db";
import { TaskPlanForm } from "@/components/task-plan-form";

export default async function NewTaskPlanPage() {
  // 1. Authentication & Authorization
  const requestHeaders = await headers();
  const session = await getSession(requestHeaders);

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await getUserByPhone(session?.user?.phone || "");
  if (!user) {
    redirect("/auth/login");
  }

  // Only admin and parent can create task plans
  if (!isAdmin(user) && !isParent(user)) {
    redirect("/child");
  }

  // 2. Get family context for parents
  const rawDb = getRawDb();
  let familyId: string | null = null;

  if (isParent(user)) {
    const member = rawDb
      .query(
        `
    SELECT family_id FROM family_member WHERE user_id = ?
  `,
      )
      .get(user.id) as { family_id: string } | null;
    familyId = member?.family_id || null;
  }

  // 3. Fetch initial data in parallel
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const [familyMembersResponse, dateStrategiesResponse, badgesResponse] =
    await Promise.all([
      // Family members (for parent role)
      familyId
        ? fetch(`${baseUrl}/api/family/members`, {
            headers: { cookie: requestHeaders.get("cookie") || "" },
          })
        : Promise.resolve({
            ok: true,
            json: async () => ({ data: { members: [] } }),
          }),

      // Date strategies based on role
      fetch(
        isAdmin(user)
          ? `${baseUrl}/api/admin/date-strategy-templates`
          : `${baseUrl}/api/family/date-strategies`,
        {
          headers: { cookie: requestHeaders.get("cookie") || "" },
        },
      ),

      // Badges/medals based on role
      fetch(`${baseUrl}/api/admin/medal-templates`, {
        headers: { cookie: requestHeaders.get("cookie") || "" },
      }),
    ]);

  // 4. Parse responses
  const [familyMembersData, strategiesData, badgesData] = await Promise.all([
    familyMembersResponse.json(),
    dateStrategiesResponse.json(),
    badgesResponse.json(),
  ]);

  // 5. Render form with server-fetched data
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isAdmin(user) ? "创建计划任务模板" : "创建计划任务"}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin(user)
            ? "创建可被所有家庭使用的任务模板"
            : "为您的家庭创建任务计划"}
        </p>
      </div>

      <TaskPlanForm
        initialData={{
          familyMembers: familyMembersData.data?.members || [],
          dateStrategies:
            strategiesData.data?.templates ||
            strategiesData.data?.strategies ||
            [],
          badges: badgesData.data || [],
        }}
        userRole={user.role}
        familyId={familyId}
      />
    </div>
  );
}
