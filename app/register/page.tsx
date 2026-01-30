"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ArrowLeft,
  Home,
  Loader2,
  CheckCircle2,
  Users,
  Gift,
  User,
  Phone,
  Key,
  Sparkles,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface RegisterFormData {
  familyName: string
  parentPhone: string
  verificationCode: string
  parentName: string
  gender: "male" | "female"
  title: string
  parentCount: string
  childCount: string
  inviteCode: string
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState<RegisterFormData>({
    familyName: "",
    parentPhone: "",
    verificationCode: "",
    parentName: "",
    gender: "male",
    title: "",
    parentCount: "2",
    childCount: "1",
    inviteCode: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({})

  const validatePhone = (phone: string): boolean => {
    return /^1[3-9]\d{9}$/.test(phone)
  }

  const handleSendVerificationCode = async () => {
    if (!validatePhone(formData.parentPhone)) {
      setErrors((prev) => ({ ...prev, parentPhone: "请输入有效的11位手机号" }))
      return
    }

    setIsSendingCode(true)
    setErrors((prev) => ({ ...prev, parentPhone: undefined }))

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.parentPhone }),
      })

      const data = await response.json()

      if (data.success) {
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setErrors((prev) => ({ ...prev, parentPhone: data.message || "发送验证码失败" }))
      }
    } catch {
      setErrors((prev) => ({ ...prev, parentPhone: "发送验证码过程中发生错误" }))
    } finally {
      setIsSendingCode(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {}

    if (!formData.familyName || formData.familyName.length < 2) {
      newErrors.familyName = "家庭名称至少需要2个字符"
    }

    if (!validatePhone(formData.parentPhone)) {
      newErrors.parentPhone = "请输入有效的11位手机号"
    }

    if (!formData.verificationCode || formData.verificationCode.length !== 6) {
      newErrors.verificationCode = "请输入6位验证码"
    }

    if (!formData.parentName || formData.parentName.length < 2) {
      newErrors.parentName = "家长姓名至少需要2个字符"
    }

    if (!formData.title) {
      newErrors.title = "请选择称呼"
    }

    const parentCount = parseInt(formData.parentCount)
    if (isNaN(parentCount) || parentCount < 2 || parentCount > 10) {
      newErrors.parentCount = "家长人数必须在2-10之间"
    }

    const childCount = parseInt(formData.childCount)
    if (isNaN(childCount) || childCount < 1 || childCount > 10) {
      newErrors.childCount = "儿童人数必须在1-10之间"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parentCount: parseInt(formData.parentCount),
          childCount: parseInt(formData.childCount),
        }),
      })

      if (response.ok) {
        setShowSuccess(true)
      } else {
        const data = await response.json()
        setErrors((prev) => ({ ...prev, parentPhone: data.message || "注册失败" }))
      }
    } catch {
      setErrors((prev) => ({ ...prev, parentPhone: "网络错误，请稍后重试" }))
    } finally {
      setIsLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-slate-900 hover:text-blue-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">返回首页</span>
            </Link>
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-slate-900">家庭积分奖励</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-md px-4 py-12">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800">提交成功</AlertTitle>
            <AlertDescription className="text-green-700">
              已发送请求，等待审核。审核通过后，您将收到短信通知。
            </AlertDescription>
          </Alert>

          <div className="mt-8 text-center">
            <Link href="/family/login">
              <Button>前往登录页面</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-900 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">返回首页</span>
          </Link>
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-slate-900">家庭积分奖励</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8">
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Home className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">注册家庭账户</CardTitle>
            <CardDescription>创建您的家庭，开始积分奖励之旅</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="familyName" className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-slate-500" />
                  家庭名称
                </Label>
                <Input
                  id="familyName"
                  placeholder="例如：张家、李家"
                  value={formData.familyName}
                  onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                  className={cn(errors.familyName && "border-red-500")}
                />
                {errors.familyName && <p className="text-sm text-red-500">{errors.familyName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-500" />
                  家长手机号
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="parentPhone"
                    type="tel"
                    inputMode="tel"
                    placeholder="请输入11位手机号"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className={cn("flex-1", errors.parentPhone && "border-red-500")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendVerificationCode}
                    disabled={isSendingCode || countdown > 0 || !formData.parentPhone}
                    className="whitespace-nowrap"
                  >
                    {isSendingCode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : countdown > 0 ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {countdown}秒
                      </span>
                    ) : (
                      "获取验证码"
                    )}
                  </Button>
                </div>
                {errors.parentPhone && <p className="text-sm text-red-500">{errors.parentPhone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-slate-500" />
                  验证码
                </Label>
                <Input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="请输入6位验证码"
                  maxLength={6}
                  value={formData.verificationCode}
                  onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                  className={cn(errors.verificationCode && "border-red-500")}
                />
                {errors.verificationCode && <p className="text-sm text-red-500">{errors.verificationCode}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentName" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  家长姓名
                </Label>
                <Input
                  id="parentName"
                  placeholder="请输入您的姓名"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className={cn(errors.parentName && "border-red-500")}
                />
                {errors.parentName && <p className="text-sm text-red-500">{errors.parentName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    性别
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value: "male" | "female") => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男</SelectItem>
                      <SelectItem value="female">女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-slate-500" />
                    称呼
                  </Label>
                  <Select
                    value={formData.title}
                    onValueChange={(value) => setFormData({ ...formData, title: value })}
                  >
                    <SelectTrigger className={cn(errors.title && "border-red-500")}>
                      <SelectValue placeholder="选择称呼" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="爸爸">爸爸</SelectItem>
                      <SelectItem value="妈妈">妈妈</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentCount" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  家长人数
                </Label>
                <Input
                  id="parentCount"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.parentCount}
                  onChange={(e) => setFormData({ ...formData, parentCount: e.target.value })}
                  className={cn(errors.parentCount && "border-red-500")}
                />
                <p className="text-xs text-slate-500">最少2人，最多10人</p>
                {errors.parentCount && <p className="text-sm text-red-500">{errors.parentCount}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="childCount" className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-slate-500" />
                  儿童人数
                </Label>
                <Input
                  id="childCount"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.childCount}
                  onChange={(e) => setFormData({ ...formData, childCount: e.target.value })}
                  className={cn(errors.childCount && "border-red-500")}
                />
                <p className="text-xs text-slate-500">最少1人，最多10人</p>
                {errors.childCount && <p className="text-sm text-red-500">{errors.childCount}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteCode" className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-slate-500" />
                  邀请码（可选）
                </Label>
                <Input
                  id="inviteCode"
                  placeholder="如有邀请码请输入"
                  value={formData.inviteCode}
                  onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  "创建家庭"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                已有家庭账户？{" "}
                <Link href="/family/login" className="text-blue-600 hover:underline">
                  立即登录
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
            <div className="text-2xl font-bold text-blue-600">积分</div>
            <div className="text-sm text-slate-600">奖励好习惯</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
            <div className="text-2xl font-bold text-green-600">愿望</div>
            <div className="text-sm text-slate-600">兑换心愿</div>
          </div>
        </div>
      </main>
    </div>
  )
}
