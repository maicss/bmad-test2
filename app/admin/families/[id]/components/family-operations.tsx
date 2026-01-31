"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pause, Clock, Trash2, Loader2, RefreshCw, Edit, KeyRound, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface FamilyOperationsProps {
  familyId: string
  currentStatus: string
  primaryParentPhone?: string | null
}

const VALIDITY_OPTIONS = [
  { value: "1", label: "1个月" },
  { value: "3", label: "3个月" },
  { value: "6", label: "6个月" },
  { value: "12", label: "12个月" },
  { value: "18", label: "18个月" },
  { value: "24", label: "24个月" },
  { value: "36", label: "36个月" },
]

const PHONE_REGEX = /^1[3-9]\d{9}$/

export function FamilyOperations({ familyId, currentStatus, primaryParentPhone }: FamilyOperationsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showExtendDialog, setShowExtendDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [extendMonths, setExtendMonths] = useState("12")
  
  const [showUpdatePhoneDialog, setShowUpdatePhoneDialog] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [phoneError, setPhoneError] = useState("")
  
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [showNewPasswordDialog, setShowNewPasswordDialog] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [copied, setCopied] = useState(false)

  const handleSuspend = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/families/${familyId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        setShowSuspendDialog(false)
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.message || "操作失败")
      }
    } catch {
      alert("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExtend = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/families/${familyId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validityMonths: parseInt(extendMonths) }),
      })

      if (response.ok) {
        setShowExtendDialog(false)
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.message || "操作失败")
      }
    } catch {
      alert("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/families/${familyId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        setShowDeleteDialog(false)
        if (isDeleted) {
          router.refresh()
        } else {
          router.push("/admin")
        }
      } else {
        const error = await response.json()
        alert(error.message || "操作失败")
      }
    } catch {
      alert("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePhone = async () => {
    if (!PHONE_REGEX.test(newPhone)) {
      setPhoneError("请输入有效的手机号码（11位，1开头）")
      return
    }
    
    setIsLoading(true)
    setPhoneError("")
    
    try {
      const response = await fetch(`/api/admin/families/${familyId}/update-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone }),
      })

      if (response.ok) {
        setShowUpdatePhoneDialog(false)
        setNewPhone("")
        router.refresh()
      } else {
        const error = await response.json()
        setPhoneError(error.message || "操作失败")
      }
    } catch {
      setPhoneError("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/admin/families/${familyId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const data = await response.json()
        setNewPassword(data.data.password)
        setShowResetPasswordDialog(false)
        setShowNewPasswordDialog(true)
      } else {
        const error = await response.json()
        alert(error.message || "操作失败")
      }
    } catch {
      alert("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  const copyPassword = () => {
    navigator.clipboard.writeText(newPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isSuspended = currentStatus === "suspended"
  const isDeleted = currentStatus === "deleted"

  return (
    <>
      <div className="space-y-2 pt-2">
        <div className="flex gap-2">
          {!isDeleted && (
            <Button
              variant="outline"
              size="sm"
              className={cn("flex-1", isSuspended && "bg-yellow-50 border-yellow-300")}
              onClick={() => setShowSuspendDialog(true)}
              disabled={isLoading}
            >
              <Pause className="h-4 w-4 mr-1" />
              {isSuspended ? "恢复家庭" : "挂起家庭"}
            </Button>
          )}
          {!isDeleted && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowExtendDialog(true)}
              disabled={isSuspended || isLoading}
            >
              <Clock className="h-4 w-4 mr-1" />
              延期
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className={cn("flex-1", isDeleted ? "bg-green-50 border-green-200 hover:bg-green-100" : "border-red-200 hover:bg-red-50")}
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
          >
            {isDeleted ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 text-green-600" />
                <span className="text-green-600">激活</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                <span className="text-red-500">删除</span>
              </>
            )}
          </Button>
        </div>
        
        {!isDeleted && primaryParentPhone && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowUpdatePhoneDialog(true)}
              disabled={isLoading}
            >
              <Edit className="h-4 w-4 mr-1" />
              修改手机号
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowResetPasswordDialog(true)}
              disabled={isLoading}
            >
              <KeyRound className="h-4 w-4 mr-1" />
              重置密码
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSuspended ? "恢复家庭" : "挂起家庭"}</DialogTitle>
            <DialogDescription>
              {isSuspended 
                ? "确定要恢复这个家庭吗？恢复后家庭将回到之前的状态。"
                : "确定要挂起这个家庭吗？挂起后家庭成员将无法登录和使用系统。"
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)} disabled={isLoading}>
              取消
            </Button>
            <Button 
              onClick={handleSuspend} 
              disabled={isLoading}
              variant={isSuspended ? "default" : "outline"}
              className={cn(isSuspended && "bg-green-600 hover:bg-green-700")}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSuspended ? "恢复" : "挂起")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>延期家庭有效期</DialogTitle>
            <DialogDescription>
              选择要延长的期限，将在当前到期日期基础上增加。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={extendMonths} onValueChange={setExtendMonths}>
              <SelectTrigger>
                <SelectValue placeholder="选择延期时长" />
              </SelectTrigger>
              <SelectContent>
                {VALIDITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)} disabled={isLoading}>
              取消
            </Button>
            <Button onClick={handleExtend} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "确定延期"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={isDeleted ? "text-green-600" : "text-red-600"}>
              {isDeleted ? "激活家庭" : "删除家庭"}
            </DialogTitle>
            <DialogDescription className={isDeleted ? "text-green-600" : "text-red-600"}>
              {isDeleted 
                ? "确定要激活这个家庭吗？激活后家庭将恢复正常使用。"
                : "此操作会删除家庭和所有家庭成员，确认删除吗？"
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isLoading}>
              取消
            </Button>
            <Button 
              onClick={handleDelete} 
              disabled={isLoading}
              variant={isDeleted ? "default" : "destructive"}
              className={cn(isDeleted && "bg-green-600 hover:bg-green-700")}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isDeleted ? "确认激活" : "确认删除")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpdatePhoneDialog} onOpenChange={setShowUpdatePhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改手机号</DialogTitle>
            <DialogDescription>
              请输入新的手机号码，当前号码：{primaryParentPhone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-phone">新手机号码</Label>
              <Input
                id="new-phone"
                type="tel"
                placeholder="请输入11位手机号码"
                value={newPhone}
                onChange={(e) => {
                  setNewPhone(e.target.value)
                  setPhoneError("")
                }}
                maxLength={11}
              />
              {phoneError && (
                <p className="text-sm text-red-500">{phoneError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUpdatePhoneDialog(false)
                setNewPhone("")
                setPhoneError("")
              }} 
              disabled={isLoading}
            >
              取消
            </Button>
            <Button 
              onClick={handleUpdatePhone} 
              disabled={isLoading || !newPhone}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "确认修改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>密码重置</DialogTitle>
            <DialogDescription>
              确定要重置主要家长的密码吗？重置后将生成新密码。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowResetPasswordDialog(false)} 
              disabled={isLoading}
            >
              取消
            </Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "确认重置"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewPasswordDialog} onOpenChange={setShowNewPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>密码重置成功</DialogTitle>
            <DialogDescription>
              您的新密码已生成，请妥善保管。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-slate-100 rounded-lg p-4 flex items-center justify-between">
              <code className="text-lg font-mono text-slate-900">{newPassword}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyPassword}
                className="ml-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              请复制此密码并告知家长妥善保管
            </p>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowNewPasswordDialog(false)
                setNewPassword("")
                setCopied(false)
              }}
            >
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
