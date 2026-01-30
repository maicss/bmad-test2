"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Lock, Smartphone, KeyRound, MessageSquare, ArrowLeft, Loader2 } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [error, setError] = useState("")

  // Admin password login state
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")

  // Admin OTP login state
  const [otpPhone, setOtpPhone] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [debugOtpCode, setDebugOtpCode] = useState<string | null>(null)

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session-check", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.user?.role === "admin") {
            router.push("/admin")
            return
          }
        }
      } catch {
        // Silently fail - user not logged in
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [router])

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          password: password.trim(),
          loginType: "password",
        }),
      })

      const data = await response.json()

      if (data.success) {
        // 管理员登录成功，跳转到管理控制台
        router.push("/admin")
        router.refresh()
      } else {
        setError(data.error || "登录失败")
      }
    } catch {
      setError("登录过程中发生错误")
    } finally {
      setIsLoading(false)
    }
  }

  // OTP 发送验证码
  const handleSendOTP = async () => {
    const trimmedPhone = otpPhone.trim()
    if (!trimmedPhone || !/^1[3-9]\d{9}$/.test(trimmedPhone)) {
      setError("请输入有效的手机号")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmedPhone }),
      })

      const data = await response.json()

      if (data.success) {
        setOtpSent(true)
        setOtpCountdown(60)
        // 开发模式下显示验证码
        if (data.debugCode) {
          setDebugOtpCode(data.debugCode)
        }
        // 启动倒计时
        const timer = setInterval(() => {
          setOtpCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(data.error || "发送验证码失败")
      }
    } catch {
      setError("发送验证码过程中发生错误")
    } finally {
      setIsLoading(false)
    }
  }

  // OTP 登录
  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const trimmedPhone = otpPhone.trim()
    const trimmedOtp = otpCode.trim()
    
    if (!trimmedPhone || !/^1[3-9]\d{9}$/.test(trimmedPhone)) {
      setError("请输入有效的手机号")
      setIsLoading(false)
      return
    }

    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError("请输入6位验证码")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: trimmedPhone,
          otp: trimmedOtp,
          loginType: "otp",
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push("/admin")
        router.refresh()
      } else {
        setError(data.error || "验证码错误或已过期")
      }
    } catch {
      setError("登录过程中发生错误")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-slate-600">检查登录状态...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">管理员登录</CardTitle>
          <CardDescription>
            系统管理控制台 - 仅限授权管理员访问
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="password" 
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                密码登录
              </TabsTrigger>
              <TabsTrigger 
                value="otp" 
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                验证码
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="mt-4">
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    管理员手机号
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="请输入管理员手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    密码
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? "登录中..." : "管理员登录"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp" className="mt-4">
              <form onSubmit={handleOTPLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp-phone" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    管理员手机号
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="otp-phone"
                      type="tel"
                      placeholder="请输入管理员手机号"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      required
                      className="h-11 flex-1"
                      disabled={otpSent}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 px-4 whitespace-nowrap"
                      onClick={handleSendOTP}
                      disabled={isLoading || otpCountdown > 0 || !otpPhone}
                    >
                      {otpCountdown > 0 ? `${otpCountdown}秒` : "获取验证码"}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp-code" className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    验证码
                  </Label>
                  <Input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="请输入6位验证码"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "")
                      if (value.length <= 6) {
                        setOtpCode(value)
                      }
                    }}
                    required
                    disabled={!otpSent}
                    className="h-11 text-center text-2xl tracking-widest"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading || !otpSent || otpCode.length !== 6}
                >
                  {isLoading ? "登录中..." : "管理员登录"}
                </Button>
                {debugOtpCode && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
                    <p className="text-xs text-yellow-700">
                      🔧 开发模式验证码：<span className="font-mono font-bold text-sm">{debugOtpCode}</span>
                    </p>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link 
            href="/family/login" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回普通用户登录
          </Link>
          <p className="text-xs text-muted-foreground text-center">
            测试账号：13800000001 / 1111
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
