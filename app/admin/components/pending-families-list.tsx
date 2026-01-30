"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Shield, Home, CheckCircle2, XCircle, Loader2, Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface PendingFamily {
  id: string
  name: string
  max_parents: number
  max_children: number
  registration_type: string
  status: string
  submitted_at: string
  created_at: string
}

interface ApproveResult {
  success: boolean
  familyId: string
  password: string
  link: string
  message?: string
}

interface PendingFamiliesListProps {
  initialFamilies: PendingFamily[]
}

export function PendingFamiliesList({ initialFamilies }: PendingFamiliesListProps) {
  const [families, setFamilies] = useState(initialFamilies)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [approveResult, setApproveResult] = useState<ApproveResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleAction = async (familyId: string, action: "approve" | "reject") => {
    setProcessingId(familyId)
    setActionType(action)

    try {
      const response = await fetch(`/api/admin/families/${familyId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (response.ok) {
        setFamilies(families.filter((f) => f.id !== familyId))
        if (action === "approve" && data.data?.password) {
          setApproveResult({
            success: true,
            familyId: data.data.familyId,
            password: data.data.password,
            link: data.data.link,
          })
          setShowResult(true)
        }
      } else {
        alert(data.message || "操作失败")
      }
    } catch {
      alert("网络错误，请稍后重试")
    } finally {
      setProcessingId(null)
      setActionType(null)
    }
  }

  const handleCopy = () => {
    if (!approveResult) return
    const content = `家庭ID: ${approveResult.familyId}\n登录链接: ${approveResult.link}\n密码: ${approveResult.password}`
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setShowResult(false)
    setApproveResult(null)
    setCopied(false)
  }

  if (families.length === 0) {
    return null
  }

  return (
    <>
      <Card className="bg-white border-slate-200 mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Shield className="h-5 w-5 text-orange-600" />
              待审核家庭
              <Badge variant="secondary" className="ml-2">
                {families.length}
              </Badge>
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">用户主动注册，等待审核</p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {families.map((family) => (
              <div
                key={family.id}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Home className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{family.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>家长: {family.max_parents}人</span>
                      <span>儿童: {family.max_children}人</span>
                      <span className="text-orange-600">
                        提交于:{" "}
                        {new Date(family.submitted_at || family.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(family.id, "approve")}
                    disabled={processingId === family.id}
                    className={cn(
                      processingId === family.id && actionType === "approve" && "opacity-70"
                    )}
                  >
                    {processingId === family.id && actionType === "approve" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    )}
                    批准
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(family.id, "reject")}
                    disabled={processingId === family.id}
                    className={cn(
                      processingId === family.id && actionType === "reject" && "opacity-70"
                    )}
                  >
                    {processingId === family.id && actionType === "reject" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-1" />
                    )}
                    拒绝
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showResult} onOpenChange={setShowResult}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="bg-green-100 p-2 rounded-full inline-flex">
                <Check className="h-5 w-5 text-green-600" />
              </span>
              家庭批准成功
            </AlertDialogTitle>
            <div className="text-muted-foreground text-sm space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">家庭ID：</span>
                  {approveResult?.familyId}
                </p>
                <p className="text-sm">
                  <span className="font-medium">登录链接：</span>
                  <a
                    href={approveResult?.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {approveResult?.link}
                  </a>
                </p>
                <p className="text-sm">
                  <span className="font-medium">自动生成的密码：</span>
                  <code className="bg-slate-200 px-2 py-0.5 rounded font-mono text-sm">
                    {approveResult?.password}
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
                复制内容包含：家庭ID、链接和密码
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleClose} className="w-full">
              完成
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
