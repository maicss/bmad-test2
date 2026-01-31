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
import { Edit, KeyRound, Loader2, Copy, Check } from "lucide-react"

interface ParentOperationsProps {
  familyId: string
  primaryParentPhone: string | null
}

const PHONE_REGEX = /^1[3-9]\d{9}$/

export function ParentOperations({ familyId, primaryParentPhone }: ParentOperationsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [showUpdatePhoneDialog, setShowUpdatePhoneDialog] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [phoneError, setPhoneError] = useState("")
  
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [showNewPasswordDialog, setShowNewPasswordDialog] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [copied, setCopied] = useState(false)

  const handleUpdatePhone = async () => {
    if (!PHONE_REGEX.test(newPhone)) {
      setPhoneError("请输入有效的手机号码（11位，1开头）")
      return
    }
    
    if (newPhone === primaryParentPhone) {
      setPhoneError("新手机号不能与当前手机号相同")
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

  return (
    <>
      <div className="flex gap-2 pt-2">
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
