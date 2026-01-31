import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getSession, isAdmin } from "@/lib/auth"
import { getRawDb } from "@/database/db"
import type { User } from "@/lib/db/schema"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Home, 
  Users, 
  User as UserIcon, 
  Phone, 
  Calendar, 
  CheckCircle2,
  XCircle,
  Pause,
  Clock,
  Award,
  Trash2,
  RefreshCw,
  Edit
} from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FamilyDetailPage({ params }: PageProps) {
  const headersList = await headers()
  const session = await getSession(headersList)

  if (!session?.user) {
    redirect("/admin/login")
  }

  if (!isAdmin(session.user as User)) {
    redirect("/family/login")
  }

  const { id } = await params
  const rawDb = getRawDb()

  const family = rawDb
    .query(
      `
      SELECT 
        f.id,
        f.name,
        f.max_parents,
        f.max_children,
        f.validity_months,
        f.registration_type,
        f.status,
        f.invite_code,
        f.invite_code_expires_at,
        f.submitted_at,
        f.reviewed_at,
        f.created_at,
        f.updated_at
      FROM family f
      WHERE f.id = ?
    `
    )
    .get(id) as {
      id: string
      name: string
      max_parents: number
      max_children: number
      validity_months: number
      registration_type: string
      status: string
      invite_code: string | null
      invite_code_expires_at: string
      submitted_at: string
      reviewed_at: string
      created_at: string
      updated_at: string
    } | null

  if (!family) {
    redirect("/admin")
  }

  const primaryParent = rawDb
    .query(
      `
      SELECT 
        u.id,
        u.name,
        u.phone,
        u.created_at as first_login_at
      FROM family_member fm
      JOIN user u ON fm.user_id = u.id
      WHERE fm.family_id = ? AND fm.role = 'primary'
      LIMIT 1
    `
    )
    .get(id) as {
      id: string
      name: string
      phone: string
      first_login_at: string
    } | null

  const stats = rawDb
    .query(
      `
      SELECT 
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
        COUNT(DISTINCT w.id) as wish_count,
        COUNT(DISTINCT CASE WHEN w.status = 'redeemed' THEN w.id END) as redeemed_wishes,
        MAX(u.updated_at) as last_active_at,
        COUNT(DISTINCT fm.id) as total_members
      FROM family f
      LEFT JOIN family_member fm ON f.id = fm.family_id
      LEFT JOIN user u ON fm.user_id = u.id
      LEFT JOIN task_completion tc ON u.id = tc.user_id
      LEFT JOIN task t ON tc.task_id = t.id
      LEFT JOIN wish w ON w.family_member_id = fm.id
      WHERE f.id = ?
    `
    )
    .get(id) as {
      task_count: number
      completed_tasks: number
      wish_count: number
      redeemed_wishes: number
      last_active_at: string | null
      total_members: number
    }

  const now = new Date()
  const createdAt = new Date(family.created_at)
  const daysInUse = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  
  const expiresAt = family.invite_code_expires_at 
    ? new Date(family.invite_code_expires_at)
    : new Date(createdAt.getTime() + family.validity_months * 30 * 24 * 60 * 60 * 1000)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">家庭详情</h1>
              <p className="text-sm text-slate-400">Family Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-400" />
            <span className="text-white font-medium">{family.name}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <UserIcon className="h-5 w-5" />
                主要家长信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">家长名称</span>
                <span className="font-medium">{primaryParent?.name || "未设置"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">手机号</span>
                <span className="font-medium">{primaryParent?.phone || "未设置"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">首次登录</span>
                <span className="font-medium">
                  {primaryParent?.first_login_at 
                    ? new Date(primaryParent.first_login_at).toLocaleDateString('zh-CN')
                    : "未登录"
                  }
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  修改手机号
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  重置密码
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Home className="h-5 w-5" />
                家庭信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">家庭名称</span>
                <span className="font-medium">{family.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">家长人数</span>
                <span className="font-medium">{family.max_parents} 人</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">儿童人数</span>
                <span className="font-medium">{family.max_children} 人</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">当前成员</span>
                <span className="font-medium">{stats.total_members} 人</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardDescription>使用天数</CardDescription>
              <CardTitle className="text-3xl">{daysInUse} <span className="text-sm font-normal text-slate-500">天</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-500">
                自 {new Date(family.created_at).toLocaleDateString('zh-CN')} 起
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardDescription>到期日期</CardDescription>
              <CardTitle className="text-3xl">{expiresAt.toLocaleDateString('zh-CN')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-500">
                有效期 {family.validity_months} 个月
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardDescription>最近活跃</CardDescription>
              <CardTitle className="text-3xl">
                {stats.last_active_at 
                  ? new Date(stats.last_active_at).toLocaleDateString('zh-CN')
                  : "无"
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-500">
                最后活动日期
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <CheckCircle2 className="h-5 w-5" />
                任务统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">计划任务数</span>
                <span className="font-medium text-lg">{stats.task_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">已完成任务</span>
                <span className="font-medium text-lg text-green-600">{stats.completed_tasks || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Award className="h-5 w-5" />
                愿望统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">愿望总数</span>
                <span className="font-medium text-lg">{stats.wish_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">已兑换愿望</span>
                <span className="font-medium text-lg text-purple-600">{stats.redeemed_wishes || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Calendar className="h-5 w-5" />
              状态信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">是否已批准</span>
              <Badge variant={family.status === 'approved' ? 'default' : 'secondary'}>
                {family.status === 'approved' ? '已批准' : '待审核'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">是否已激活</span>
              <Badge variant={primaryParent ? 'default' : 'secondary'}>
                {primaryParent ? '已激活' : '未激活'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">注册类型</span>
              <span className="text-sm">
                {family.registration_type === 'admin' ? '管理员创建' : '自主注册'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">创建日期</span>
              <span>{new Date(family.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">审核日期</span>
              <span>{family.reviewed_at ? new Date(family.reviewed_at).toLocaleDateString('zh-CN') : '未审核'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Users className="h-5 w-5" />
              操作
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Pause className="h-5 w-5" />
                <span className="text-xs">挂起家庭</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Clock className="h-5 w-5" />
                <span className="text-xs">延期</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2 border-red-200 hover:bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
                <span className="text-xs text-red-500">删除</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
