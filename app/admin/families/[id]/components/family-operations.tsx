"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { Pause, Clock, Trash2, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface FamilyOperationsProps {
  familyId: string
  currentStatus: string
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

export function FamilyOperations({ familyId, currentStatus }: FamilyOperationsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showExtendDialog, setShowExtendDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [extendMonths, setExtendMonths] = useState("12")

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

  const isSuspended = currentStatus === "suspended"
  const isDeleted = currentStatus === "deleted"

  return (
    <>
      <div className="flex gap-2 pt-2">
        {!isDeleted && (
          <Button
            variant="outline"
            size="sm"
            className={cn("flex-1", isSuspended && "bg-yellow-50 border-yellow-300")}
            onClick={() => setShowSuspendDialog(true)}
            disabled={isLoading}
          >
            <Pause className="h-4 w-4 mr-1" />
            {isSuspended ? "恢复" : "挂起"}
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

      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSuspended ? "恢复" : "挂起"}</DialogTitle>
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
    </>
  )
}
