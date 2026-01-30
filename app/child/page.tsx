"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/auth/logout-button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Star, 
  Trophy, 
  Gift, 
  CheckCircle2, 
  Target,
  Sparkles,
  Flame,
  Medal,
  Crown,
  Zap
} from "lucide-react"

interface Task {
  id: string
  name: string
  points: number
  completed: boolean
  icon?: string
}

interface Wish {
  id: string
  title: string
  pointsRequired: number
  currentPoints: number
  imageUrl?: string
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: Date
}

export default function ChildDashboardPage() {
  const router = useRouter()
  const [points, setPoints] = useState(0)
  const [displayPoints, setDisplayPoints] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", name: "完成作业", points: 10, completed: false, icon: "book" },
    { id: "2", name: "整理房间", points: 5, completed: true, icon: "home" },
    { id: "3", name: "帮忙洗碗", points: 8, completed: false, icon: "utensils" },
    { id: "4", name: "阅读30分钟", points: 5, completed: false, icon: "book-open" },
  ])
  const [wishes] = useState<Wish[]>([
    { id: "1", title: "去游乐园", pointsRequired: 100, currentPoints: 65 },
    { id: "2", title: "买新玩具", pointsRequired: 50, currentPoints: 35 },
  ])
  const [achievements] = useState<Achievement[]>([
    { id: "1", name: "连续7天", description: "连续7天完成任务", icon: "flame", unlockedAt: new Date() },
    { id: "2", name: "积分达人", description: "累计获得100积分", icon: "star", unlockedAt: new Date() },
    { id: "3", name: "任务大师", description: "完成50个任务", icon: "trophy" },
    { id: "4", name: "愿望实现者", description: "兑换第一个愿望", icon: "gift" },
  ])

  // Animate points on mount
  useEffect(() => {
    const targetPoints = 150
    const duration = 1000
    const steps = 30
    const increment = targetPoints / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= targetPoints) {
        setDisplayPoints(targetPoints)
        clearInterval(timer)
      } else {
        setDisplayPoints(Math.floor(current))
      }
    }, duration / steps)

    setPoints(targetPoints)
    return () => clearInterval(timer)
  }, [])

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
  }

  const completedTasksCount = tasks.filter(t => t.completed).length
  const totalTasksCount = tasks.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">我的奖励</h1>
          </div>
          <LogoutButton variant="ghost" size="sm" />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Points Display */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none">
          <CardContent className="p-6 text-center">
            <p className="text-primary-foreground/80 text-sm mb-2">我的积分</p>
            <div className="flex items-center justify-center gap-2">
              <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
              <span className="text-5xl font-bold tabular-nums">
                {displayPoints}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm">
              <Badge variant="secondary" className="bg-white/20 text-white border-none">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                今日完成 {completedTasksCount}/{totalTasksCount}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              今日任务
            </CardTitle>
            <CardDescription>完成任务赚取积分</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  task.completed 
                    ? "bg-muted/50 border-muted" 
                    : "bg-white border-border hover:border-primary/50"
                }`}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="h-5 w-5"
                />
                <div className="flex-1">
                  <p className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.name}
                  </p>
                </div>
                <Badge 
                  variant={task.completed ? "secondary" : "default"}
                  className={task.completed ? "" : "bg-green-100 text-green-700 hover:bg-green-100"}
                >
                  +{task.points}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Wishes Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5 text-primary" />
              我的愿望
            </CardTitle>
            <CardDescription>攒够积分兑换愿望</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {wishes.map((wish) => {
              const progress = Math.min(100, (wish.currentPoints / wish.pointsRequired) * 100)
              const remaining = wish.pointsRequired - wish.currentPoints
              
              return (
                <div key={wish.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{wish.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {wish.currentPoints} / {wish.pointsRequired}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    还需 {remaining} 积分即可兑换
                  </p>
                </div>
              )
            })}
            <Button variant="outline" className="w-full" size="sm">
              <Gift className="h-4 w-4 mr-2" />
              添加新愿望
            </Button>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              我的成就
            </CardTitle>
            <CardDescription>解锁徽章获得荣誉</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {achievements.map((achievement) => {
                const isUnlocked = !!achievement.unlockedAt
                const Icon = getAchievementIcon(achievement.icon)
                
                return (
                  <div
                    key={achievement.id}
                    className={`flex flex-col items-center text-center p-2 rounded-lg transition-all ${
                      isUnlocked 
                        ? "bg-yellow-50 border border-yellow-200" 
                        : "bg-muted/50 border border-transparent opacity-60"
                    }`}
                  >
                    <div className={`p-2 rounded-full mb-1 ${
                      isUnlocked ? "bg-yellow-100" : "bg-muted"
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isUnlocked ? "text-yellow-600" : "text-muted-foreground"
                      }`} />
                    </div>
                    <span className="text-xs font-medium leading-tight">
                      {achievement.name}
                    </span>
                    {isUnlocked && (
                      <span className="text-[10px] text-yellow-600 mt-0.5">已解锁</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-orange-50 border-orange-100">
            <CardContent className="p-3 text-center">
              <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-orange-700">7</p>
              <p className="text-xs text-orange-600">连续天数</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-3 text-center">
              <Zap className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-700">12</p>
              <p className="text-xs text-blue-600">本周任务</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-100">
            <CardContent className="p-3 text-center">
              <Medal className="h-5 w-5 text-purple-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-purple-700">3</p>
              <p className="text-xs text-purple-600">已获得徽章</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

// Helper function to get achievement icon
function getAchievementIcon(iconName: string) {
  switch (iconName) {
    case "flame":
      return Flame
    case "star":
      return Star
    case "trophy":
      return Trophy
    case "gift":
      return Gift
    case "crown":
      return Crown
    case "medal":
      return Medal
    default:
      return Star
  }
}
