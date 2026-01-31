"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Copy, Check, Home, Users, Calendar, Phone, User, Shield } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { CitySelector } from "@/components/city-selector"

interface CreateFamilyForm {
  parentPhone: string
  familyName: string
  parentName: string
  parentGender: "male" | "female"
  parentTitle: string
  parentCount: string
  childCount: string
  validityMonths: number
  province: string
  city: string
}

interface CreateResult {
  success: boolean
  familyId?: string
  password?: string
  link?: string
  message?: string
}

export default function CreateFamilyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [createResult, setCreateResult] = useState<CreateResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState<CreateFamilyForm>({
    parentPhone: "",
    familyName: "",
    parentName: "",
    parentGender: "male",
    parentTitle: "爸爸",
    parentCount: "2",
    childCount: "1",
    validityMonths: 12,
    province: "",
    city: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CreateFamilyForm, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateFamilyForm, string>> = {}

    if (!formData.parentPhone || !/^1[3-9]\d{9}$/.test(formData.parentPhone)) {
      newErrors.parentPhone = "请输入有效的11位手机号"
    }

    if (!formData.familyName || formData.familyName.length < 2) {
      newErrors.familyName = "家庭名称至少需要2个字符"
    }

    if (!formData.parentName || formData.parentName.length < 2) {
      newErrors.parentName = "家长姓名至少需要2个字符"
    }

    const parentCount = parseInt(formData.parentCount)
    if (isNaN(parentCount) || parentCount < 2 || parentCount > 10) {
      newErrors.parentCount = "家长人数必须在2-10之间"
    }

    const childCount = parseInt(formData.childCount)
    if (isNaN(childCount) || childCount < 1 || childCount > 10) {
      newErrors.childCount = "儿童人数必须在1-10之间"
    }

    if (!formData.province) {
      newErrors.province = "请选择省份"
    }

    if (!formData.city) {
      newErrors.city = "请选择城市"
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
      const response = await fetch("/api/admin/families", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          parentCount: parseInt(formData.parentCount),
          childCount: parseInt(formData.childCount),
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setCreateResult({
          success: true,
          familyId: result.data.familyId,
          password: result.data.password,
          link: result.data.link,
        })
        setShowResult(true)
      } else {
        setCreateResult({
          success: false,
          message: result.message || "创建家庭失败",
        })
        setShowResult(true)
      }
    } catch (error) {
      setCreateResult({
        success: false,
        message: "网络错误，请稍后重试",
      })
      setShowResult(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!createResult?.familyId || !createResult?.password) return

    const title = formData.parentGender === "male" ? "先生" : "女士"
    const content = `尊敬的家长 ${formData.parentName}${title}，您好！您的家庭入口是${createResult.link}，请使用手机号：${formData.parentPhone} 和密码：${createResult.password} 登录您的家庭`

    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  const handleClose = () => {
    setShowResult(false)
    if (createResult?.success) {
      router.push("/admin")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">创建新家庭</h1>
            <p className="text-sm text-slate-400">Create New Family</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 py-8">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Home className="h-5 w-5" />
              家庭信息
            </CardTitle>
            <CardDescription>填写新家庭的基本信息</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Parent Phone */}
              <div className="space-y-2">
                <Label htmlFor="parentPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-500" />
                  家长手机号
                </Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  inputMode="tel"
                  placeholder="请输入11位手机号"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className={cn(errors.parentPhone && "border-red-500")}
                />
                {errors.parentPhone && (
                  <p className="text-sm text-red-500">{errors.parentPhone}</p>
                )}
              </div>

              {/* Family Name */}
              <div className="space-y-2">
                <Label htmlFor="familyName" className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-slate-500" />
                  家庭名称
                </Label>
                <Input
                  id="familyName"
                  placeholder="如：张家、李家"
                  value={formData.familyName}
                  onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                  className={cn(errors.familyName && "border-red-500")}
                />
                {errors.familyName && (
                  <p className="text-sm text-red-500">{errors.familyName}</p>
                )}
              </div>

              {/* Parent Name */}
              <div className="space-y-2">
                <Label htmlFor="parentName" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  家长姓名
                </Label>
                <Input
                  id="parentName"
                  placeholder="请输入家长姓名"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className={cn(errors.parentName && "border-red-500")}
                />
                {errors.parentName && (
                  <p className="text-sm text-red-500">{errors.parentName}</p>
                )}
              </div>

              {/* Parent Gender & Title */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    家长性别
                  </Label>
                  <Select
                    value={formData.parentGender}
                    onValueChange={(value: "male" | "female") =>
                      setFormData({ ...formData, parentGender: value })
                    }
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
                    <Users className="h-4 w-4 text-slate-500" />
                    称呼
                  </Label>
                  <Select
                    value={formData.parentTitle}
                    onValueChange={(value) =>
                      setFormData({ ...formData, parentTitle: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择称呼" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="爸爸">爸爸</SelectItem>
                      <SelectItem value="妈妈">妈妈</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CitySelector
                value={{ province: formData.province, city: formData.city }}
                onChange={(value) =>
                  setFormData({ ...formData, province: value.province, city: value.city })
                }
                error={{
                  province: errors.province,
                  city: errors.city,
                }}
              />

              {/* Parent Count */}
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
                  placeholder="请输入家长人数"
                  value={formData.parentCount}
                  onChange={(e) =>
                    setFormData({ ...formData, parentCount: e.target.value })
                  }
                  className={cn(errors.parentCount && "border-red-500")}
                />
                <p className="text-xs text-slate-500">最少2人，最多10人</p>
                {errors.parentCount && (
                  <p className="text-sm text-red-500">{errors.parentCount}</p>
                )}
              </div>

              {/* Child Count */}
              <div className="space-y-2">
                <Label htmlFor="childCount" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  儿童人数
                </Label>
                <Input
                  id="childCount"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="请输入儿童人数"
                  value={formData.childCount}
                  onChange={(e) =>
                    setFormData({ ...formData, childCount: e.target.value })
                  }
                  className={cn(errors.childCount && "border-red-500")}
                />
                <p className="text-xs text-slate-500">最少1人，最多10人</p>
                {errors.childCount && (
                  <p className="text-sm text-red-500">{errors.childCount}</p>
                )}
              </div>

              {/* Validity Period */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  有效期限
                </Label>
                <Select
                  value={formData.validityMonths.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, validityMonths: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择有效期限" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1个月</SelectItem>
                    <SelectItem value="3">3个月</SelectItem>
                    <SelectItem value="6">6个月</SelectItem>
                    <SelectItem value="12">12个月</SelectItem>
                    <SelectItem value="18">18个月</SelectItem>
                    <SelectItem value="24">24个月</SelectItem>
                    <SelectItem value="36">36个月</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Link href="/admin" className="flex-1">
                  <Button variant="outline" type="button" className="w-full">
                    取消
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "创建中..." : "创建家庭"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Result Dialog */}
      <AlertDialog open={showResult} onOpenChange={setShowResult}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {createResult?.success ? (
                <>
                  <span className="bg-green-100 p-2 rounded-full inline-flex">
                    <Check className="h-5 w-5 text-green-600" />
                  </span>
                  家庭创建成功
                </>
              ) : (
                <>
                  <span className="bg-red-100 p-2 rounded-full inline-flex">
                    <Shield className="h-5 w-5 text-red-600" />
                  </span>
                  创建失败
                </>
              )}
            </AlertDialogTitle>
            <div className="text-muted-foreground text-sm space-y-4">
              {createResult?.success ? (
                <>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">家庭ID：</span>
                      {createResult.familyId}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">登录链接：</span>
                      <a
                        href={createResult.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {createResult.link}
                      </a>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">自动生成的密码：</span>
                      <code className="bg-slate-200 px-2 py-0.5 rounded font-mono text-sm">
                        {createResult.password}
                      </code>
                    </p>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>重要提示：</strong>请复制并保存以下信息，密码只会显示一次！
                    </p>
                  </div>

                  <Button
                    onClick={handleCopy}
                    className={`w-full flex items-center gap-2 transition-all duration-300 ${
                      copied 
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                        : ""
                    }`}
                    variant={copied ? "default" : "default"}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 animate-in zoom-in duration-300" />
                        <span className="animate-in fade-in duration-300">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        复制家庭信息
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    复制内容包含：问候语、家庭链接、手机号和密码
                  </p>
                </>
              ) : (
                <p className="text-red-600">{createResult?.message}</p>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleClose} className="w-full">
              {createResult?.success ? "完成并返回" : "关闭"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
