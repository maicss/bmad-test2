import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getSession, isAdmin } from "@/lib/auth"
import { getRawDb } from "@/database/db"
import type { User } from "@/lib/db/schema"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Users, 
  Database,
  Activity,
  Settings,
  Home,
  Plus,
  CheckCircle2,
  Award,
  Star,
  MapPin,
  Image
} from "lucide-react"
import Link from "next/link"
import { LogoutButton } from "@/components/auth/logout-button"
import { PendingFamiliesList } from "./components/pending-families-list"
import { DateStrategySection } from "@/components/date-strategy-section"

function AdminIcon({ className }: { className?: string }) {
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
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

export default async function AdminDashboardPage() {
  const headersList = await headers()
  const session = await getSession(headersList)
  
  if (!session?.user) {
    redirect("/admin/login")
  }

  if (!isAdmin(session.user as User)) {
    redirect("/parent")
  }

  const rawDb = getRawDb()
  
  const userStats = rawDb.query(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
      SUM(CASE WHEN role = 'parent' THEN 1 ELSE 0 END) as parent_count,
      SUM(CASE WHEN role = 'child' THEN 1 ELSE 0 END) as child_count
    FROM user
  `).get() as { 
    total_users: number
    admin_count: number
    parent_count: number
    child_count: number
  }

  const familyStats = rawDb.query(`
    SELECT COUNT(*) as total_families
    FROM family
  `).get() as { total_families: number }

  const taskStats = rawDb.query(`
    SELECT 
      COUNT(*) as total_tasks,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_tasks
    FROM task_definition
  `).get() as { 
    total_tasks: number
    active_tasks: number
  }

  const wishStats = rawDb.query(`
    SELECT 
      COUNT(*) as total_wishes,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_wishes,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_wishes,
      SUM(CASE WHEN status = 'redeemed' THEN 1 ELSE 0 END) as redeemed_wishes
    FROM wish
  `).get() as { 
    total_wishes: number
    pending_wishes: number
    approved_wishes: number
    redeemed_wishes: number
  }

  const pendingFamilies = rawDb.query(`
    SELECT 
      f.id, 
      f.name, 
      f.max_parents,
      f.max_children,
      f.registration_type,
      f.status,
      f.submitted_at,
      f.created_at
    FROM family f
    WHERE f.status = 'pending'
    ORDER BY f.submitted_at DESC
  `).all() as Array<{
    id: string
    name: string
    max_parents: number
    max_children: number
    registration_type: string
    status: string
    submitted_at: string
    created_at: string
  }>

  const approvedFamilies = rawDb.query(`
    SELECT 
      f.id, 
      f.name, 
      f.invite_code,
      f.updated_at,
      COUNT(fm.id) as member_count
    FROM family f
    LEFT JOIN family_member fm ON f.id = fm.family_id
    WHERE f.status = 'approved'
    GROUP BY f.id
    ORDER BY f.updated_at DESC
    LIMIT 5
  `).all() as Array<{
    id: string
    name: string
    invite_code: string | null
    updated_at: string
    member_count: number
  }>

  const taskTemplates = rawDb.query(`
    SELECT id, name, category, is_active, template_name, combo_strategy_type
    FROM task_definition 
    WHERE is_template = 1 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all() as Array<{
    id: string;
    name: string;
    category: string;
    is_active: number;
    template_name: string;
    combo_strategy_type: string;
  }>
  
  const taskTemplateCount = rawDb.query(`
    SELECT COUNT(*) as count FROM task_definition WHERE is_template = 1
  `).get() as { count: number }

  const wishTemplates = [
    { id: "1", name: "去游乐园", type: "activity", points: 100 },
    { id: "2", name: "买新玩具", type: "item", points: 50 },
    { id: "3", name: "看电影", type: "activity", points: 80 },
    { id: "4", name: "吃冰淇淋", type: "item", points: 30 },
    { id: "5", name: "露营", type: "activity", points: 200 },
  ]

  const badgeTemplates = [
    { id: "1", name: "学习之星", description: "连续7天完成作业", level: "gold" },
    { id: "2", name: "家务能手", description: "完成10次家务任务", level: "silver" },
    { id: "3", name: "早起达人", description: "连续14天早起", level: "gold" },
    { id: "4", name: "阅读爱好者", description: "阅读20本书", level: "bronze" },
    { id: "5", name: "运动健将", description: "运动30天", level: "silver" },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">系统管理控制台</h1>
              <p className="text-sm text-slate-400">System Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/image-bed">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-400 hover:text-white hover:bg-slate-800"
                title="图床管理"
              >
                <Image className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <div className="text-right">
              <p className="text-sm font-medium text-white">{session.user.name}</p>
              <Badge className="bg-blue-600 text-white border-0 hover:bg-blue-700">
                管理员
              </Badge>
            </div>
            <LogoutButton 
              variant="outline" 
              size="sm" 
              className="border-slate-400 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-500"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 space-y-6">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white border border-slate-700">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <AdminIcon className="h-5 w-5" />
            欢迎回来，管理员
          </h2>
          <p className="text-slate-400">
            这里是系统管理控制台，您可以管理用户、家庭、监控统计数据等。
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/users">
            <Card className="bg-white border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">总用户数</p>
                    <p className="text-2xl font-bold text-slate-900">{userStats?.total_users || 0}</p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="text-slate-400">
                    家长: {userStats?.parent_count || 0}
                  </span>
                  <span className="text-slate-400">
                    儿童: {userStats?.child_count || 0}
                  </span>
                </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/families">
          <Card className="bg-white border-slate-200 hover:border-green-300 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">家庭总数</p>
                  <p className="text-2xl font-bold text-slate-900">{familyStats?.total_families || 0}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <Home className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">任务定义</p>
                <p className="text-2xl font-bold text-slate-900">{taskStats?.total_tasks || 0}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              活跃: {taskStats?.active_tasks || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">愿望总数</p>
                <p className="text-2xl font-bold text-slate-900">{wishStats?.total_wishes || 0}</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-orange-500">
                待审核: {wishStats?.pending_wishes || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

        <PendingFamiliesList initialFamilies={pendingFamilies} />

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Home className="h-5 w-5" />
                  家庭列表
                </CardTitle>
                <CardDescription className="mt-1">点击家庭查看详情</CardDescription>
              </div>
              <Link href="/admin/families/new">
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  创建
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {approvedFamilies && approvedFamilies.length > 0 ? (
                <div className="space-y-3">
                  {approvedFamilies.map((family: any) => (
                    <Link
                      key={family.id}
                      href={`/admin/families/${family.id}`}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Home className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{family.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {family.member_count} 成员
                            </span>
                            {family.invite_code && (
                              <span className="text-green-600">
                                邀请码: {family.invite_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary"
                        className="text-xs"
                      >
                        {new Date(family.updated_at).toLocaleDateString('zh-CN')}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-4">
                  暂无家庭数据
                </p>
              )}
            </CardContent>
          </Card>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <CheckCircle2 className="h-5 w-5" />
                  计划任务模板
                </CardTitle>
                <CardDescription className="mt-1">管理任务模板</CardDescription>
              </div>
              <Link href="/admin/task-templates/new">
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  创建
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="space-y-3">
                {taskTemplates.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">暂无任务模板</p>
                ) : (
                  <>
                    {taskTemplates.map((template) => (
                      <Link
                        key={template.id}
                        href={`/admin/task-templates/${template.id}`}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <Activity className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{template.template_name || template.name}</p>
                            <p className="text-xs text-slate-500">
                              {template.category === 'study' ? '学习' : 
                               template.category === 'housework' ? '家务' : 
                               template.category === 'health' ? '健康' : '其他'}
                              {template.combo_strategy_type === 'linear' ? ' · 线性连击' : ' · 阶梯连击'}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={template.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {template.is_active ? "启用" : "禁用"}
                        </Badge>
                      </Link>
                    ))}
                    {taskTemplateCount.count > 5 && (
                      <Link href="/admin/task-templates">
                        <Button variant="ghost" className="w-full text-muted-foreground">
                          查看更多 ({taskTemplateCount.count - 5})
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Star className="h-5 w-5" />
                  愿望模板
                </CardTitle>
                <CardDescription className="mt-1">管理愿望模板</CardDescription>
              </div>
              <Link href="/admin/wish-templates/new">
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  创建
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {wishTemplates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/admin/wish-templates/${template.id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-100 p-2 rounded-full">
                        <Star className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{template.name}</p>
                        <p className="text-xs text-slate-500">
                          {template.type === 'activity' ? '活动' : '物品'} · {template.points}积分
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Award className="h-5 w-5" />
                  徽章模板
                </CardTitle>
                <CardDescription className="mt-1">管理徽章模板和成就系统</CardDescription>
              </div>
              <Link href="/admin/badge-templates/new">
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  创建
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {badgeTemplates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/admin/badge-templates/${template.id}`}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className={`p-2 rounded-full ${
                      template.level === 'gold' ? 'bg-yellow-100' : 
                      template.level === 'silver' ? 'bg-slate-200' : 
                      'bg-orange-100'
                    }`}>
                      <Award className={`h-4 w-4 ${
                        template.level === 'gold' ? 'text-yellow-600' : 
                        template.level === 'silver' ? 'text-slate-600' : 
                        'text-orange-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{template.name}</p>
                      <p className="text-xs text-slate-500 truncate">{template.description}</p>
                    </div>
                    <Badge 
                      variant="outline"
                      className={`text-xs shrink-0 ${
                        template.level === 'gold' ? 'border-yellow-400 text-yellow-700' : 
                        template.level === 'silver' ? 'border-slate-400 text-slate-700' : 
                        'border-orange-400 text-orange-700'
                      }`}
                    >
                      {template.level === 'gold' ? '金牌' : 
                       template.level === 'silver' ? '银牌' : '铜牌'}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DateStrategySection />
        </div>

        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Activity className="h-5 w-5" />
              系统状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="bg-green-500 w-3 h-3 rounded-full" />
                <div>
                  <p className="font-medium text-green-900">数据库连接</p>
                  <p className="text-xs text-green-700">正常运行</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="bg-green-500 w-3 h-3 rounded-full" />
                <div>
                  <p className="font-medium text-green-900">认证服务</p>
                  <p className="text-xs text-green-700">正常运行</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="bg-blue-500 w-3 h-3 rounded-full" />
                <div>
                  <p className="font-medium text-blue-900">系统版本</p>
                  <p className="text-xs text-blue-700">v1.0.0</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}