"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  redirectTo?: string
}

export function LogoutButton({
  variant = "outline",
  size = "sm",
  className = "",
  redirectTo = "/family/login",
}: LogoutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      // 1. 先获取当前用户信息以确定角色
      const sessionResponse = await fetch("/api/auth/session", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }).catch(() => null)
      
      let userRole: string | null = null
      if (sessionResponse?.ok) {
        const sessionData = await sessionResponse.json()
        userRole = sessionData?.user?.role || null
      }
      
      // 2. 调用logout API清除服务器端session
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      // 3. 清除本地存储的任何数据（如果有的话）
      localStorage.removeItem("family-reward-session")
      
      // 4. 根据用户角色决定跳转目标
      const targetRedirect = userRole === "admin" ? "/admin/login" : "/family/login"
      
      if (response.ok) {
        // 5. 跳转到对应的登录页面
        router.push(targetRedirect)
        router.refresh()
      } else {
        console.error("Logout failed")
        // 即使API调用失败，也跳转回对应的登录页
        router.push(targetRedirect)
      }
    } catch (error) {
      console.error("Logout error:", error)
      // 出错时默认跳转到家庭登录页
      router.push("/family/login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? "退出中..." : "退出"}
    </Button>
  )
}
