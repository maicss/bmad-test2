import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Home, 
  Star, 
  Gift, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Trophy,
  Heart
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">家庭积分奖励</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/family/login">
                <Button variant="ghost">登录</Button>
              </Link>
              <Link href="/register">
                <Button>免费注册</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 mb-6">
              <Sparkles className="h-4 w-4" />
              让家庭教育变得简单有趣
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl mb-6">
              用积分激励
              <span className="text-blue-600"> 好习惯养成</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 mb-8">
              建立家庭积分体系，让孩子通过完成任务获得积分，兑换心愿奖励。
              培养责任感，让成长看得见。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="gap-2 text-lg px-8">
                  立即创建家庭
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  了解更多
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">10,000+</div>
              <div className="text-sm text-slate-600 mt-1">活跃家庭</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">500,000+</div>
              <div className="text-sm text-slate-600 mt-1">完成任务</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">100,000+</div>
              <div className="text-sm text-slate-600 mt-1">心愿达成</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">98%</div>
              <div className="text-sm text-slate-600 mt-1">家长满意度</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">
              轻松三步，开启积分之旅
            </h2>
            <p className="text-lg text-slate-600">
              简单设置，即刻享受科学的家庭教育方法
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-slate-200">
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  1. 创建家庭
                </h3>
                <p className="text-slate-600">
                  注册账户，添加家庭成员，设置家长和孩子角色
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Star className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  2. 设置任务
                </h3>
                <p className="text-slate-600">
                  创建日常任务，如完成作业、整理房间、按时起床等
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Gift className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  3. 兑换奖励
                </h3>
                <p className="text-slate-600">
                  孩子完成任务获得积分，用积分兑换心愿奖励
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                为什么选择家庭积分奖励？
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">培养责任感</h4>
                    <p className="text-slate-600">让孩子明白付出与收获的关系</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">正向激励</h4>
                    <p className="text-slate-600">用奖励代替惩罚，建立积极心态</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">家庭互动</h4>
                    <p className="text-slate-600">增进亲子沟通，共同参与成长</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">可视化管理</h4>
                    <p className="text-slate-600">清晰记录孩子每一步成长</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">完成作业</div>
                      <div className="text-sm text-slate-500">+10 积分</div>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Heart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">帮助家务</div>
                      <div className="text-sm text-slate-500">+5 积分</div>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between border-2 border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Gift className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">兑换：周末游乐园</div>
                      <div className="text-sm text-slate-500">-50 积分</div>
                    </div>
                  </div>
                  <div className="text-sm text-purple-600 font-medium">已兑换</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="bg-blue-600 rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              准备好开始了吗？
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              加入数千个家庭，开始使用积分奖励系统，让孩子的成长之路充满乐趣与动力
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 gap-2">
                免费创建家庭账户
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <p className="text-blue-200 text-sm mt-4">
              无需信用卡，永久免费使用基础功能
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">家庭积分奖励</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">首页</Link>
              <Link href="/register" className="hover:text-slate-900">注册</Link>
              <Link href="/family/login" className="hover:text-slate-900">登录</Link>
              <Link href="/admin" className="hover:text-slate-900">管理后台</Link>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 家庭积分奖励. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
