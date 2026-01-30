import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getSession, isParent } from "@/lib/auth"
import { getRawDb } from "@/database/db"
import type { User } from "@/lib/db/schema"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/auth/logout-button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Plus, 
  Gift, 
  BarChart3, 
  Activity,
  Star,
  CheckCircle2,
  Clock
} from "lucide-react"
import Link from "next/link"

// Helper icon component
function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default async function ParentDashboardPage() {
  // Get current session
  const headersList = await headers()
  const session = await getSession(headersList)
  
  if (!session?.user) {
    redirect("/family/login")
  }

  if (!isParent(session.user as User)) {
    redirect("/child")
  }

  // 获取用户的家庭信息
  const rawDb = getRawDb()
  
  // 查找用户所属的家庭
  const familyMemberRow = rawDb.query(`
    SELECT fm.family_id, f.name as family_name 
    FROM family_member fm
    JOIN family f ON fm.family_id = f.id
    WHERE fm.user_id = ?
    LIMIT 1
  `).get(session.user.id) as { family_id: string; family_name: string } | null
  
  let familyData = null
  let members: any[] = []
  let tasks: any[] = []
  let wishes: any[] = []
  
  if (familyMemberRow) {
    const familyId = familyMemberRow.family_id
    
    // 获取家庭成员
    members = rawDb.query(`
      SELECT fm.id, fm.role, fm.display_name, fm.current_points, u.name, u.email
      FROM family_member fm
      JOIN user u ON fm.user_id = u.id
      WHERE fm.family_id = ?
    `).all(familyId) || []
    
    // 获取任务定义
    tasks = rawDb.query(`
      SELECT * FROM task_definition 
      WHERE family_id = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 6
    `).all(familyId) || []
    
    // 获取待处理愿望
    wishes = rawDb.query(`
      SELECT w.*, u.name as member_name
      FROM wish w
      JOIN family_member fm ON w.member_id = fm.id
      JOIN user u ON fm.user_id = u.id
      WHERE w.family_id = ? AND w.status = 'pending'
    `).all(familyId) || []
    
    familyData = {
      id: familyId,
      name: familyMemberRow.family_name
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">家长控制台</h1>
            <p className="text-sm text-muted-foreground">管理家庭和查看进度</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">
            欢迎回来，{session.user.name}
          </h2>
          <p className="text-muted-foreground">
            {familyData ? `管理 ${familyData.name} 的日常行为和奖励` : "开始设置您的家庭奖励系统"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/parent/tasks/new">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">添加任务</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/parent/wishes/new">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">添加愿望</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/parent/reports">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">查看报告</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/parent/family">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">家庭成员</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Family Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                家庭成员
              </CardTitle>
              <CardDescription>查看所有成员和他们的积分</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{member.display_name || member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.role === "primary" ? "主要家长" : 
                             member.role === "secondary" ? "家长" : "孩子"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">{member.current_points}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  暂无家庭成员
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity - 暂时显示空状态 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                最近活动
              </CardTitle>
              <CardDescription>最新的行为记录</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-4">
                暂无活动记录
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Wishes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              待处理愿望
            </CardTitle>
            <CardDescription>等待审核的愿望兑换请求</CardDescription>
          </CardHeader>
          <CardContent>
            {wishes.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {wishes.map((wish: any) => (
                  <div
                    key={wish.id}
                    className="p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{wish.title}</h4>
                      <Badge variant="secondary">待审核</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {wish.member_name} • {wish.points_required} 积分
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" className="flex-1">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        批准
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        拒绝
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                没有待处理的愿望
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              常用任务
            </CardTitle>
            <CardDescription>最近创建的任务定义</CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{task.name}</h4>
                      <Badge variant={task.points > 0 ? "default" : "destructive"}>
                        {task.points > 0 ? "+" : ""}{task.points}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {task.description || "暂无描述"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.category === "study" ? "学习" :
                       task.category === "housework" ? "家务" :
                       task.category === "behavior" ? "行为" :
                       task.category === "health" ? "健康" : "自定义"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">还没有创建任务</p>
                <Button asChild>
                  <Link href="/parent/tasks/new">创建第一个任务</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
