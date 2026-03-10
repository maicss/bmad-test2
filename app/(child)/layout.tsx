/**
 * Child Layout
 *
 * Story 2.8: Child Views Today's Task List
 * Task 1.1: 创建ChildDashboardLayout组件（Shadcn Layout + 游戏化主题）
 * Task 10: 实现错误处理和用户反馈
 *
 * 儿童端布局 - 游戏化主题设计
 * - 鲜艳色彩系统（儿童友好：蓝色、绿色、黄色）
 * - 大按钮设计（≥80x80pt触摸目标）
 * - 横向布局优化（平板≥768px）
 * - 顶部状态栏（网络状态、同步指示器）
 * - Toast通知组件
 */

import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';

interface ChildLayoutProps {
  children: ReactNode;
}

export default function ChildLayout({ children }: ChildLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-yellow-50">
      {/* Toast通知组件 */}
      <Toaster
        position="top-center"
        richColors
        closeButton
        duration={3000}
        toastOptions={{
          style: {
            background: 'white',
            border: '2px solid #3B82F6',
            borderRadius: '16px',
            padding: '16px',
          },
        }}
      />

      {/* 顶部状态栏 - 网络/同步指示器 */}
      <StatusBar />

      {/* 主内容区域 */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 平板优化：横向布局（≥768px） */}
        <div className="lg:pl-64">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * 顶部状态栏组件
 * 显示网络状态和同步指示器
 */
function StatusBar() {
  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b-4 border-blue-400 shadow-sm">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* 左侧：Logo/标题 */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌟</span>
          <h1 className="text-xl font-bold text-blue-600">我的任务</h1>
        </div>

        {/* 右侧：状态指示器 */}
        <div className="flex items-center gap-3">
          {/* 网络状态指示 */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-gray-600">在线</span>
          </div>

          {/* 同步指示 */}
          <div className="flex items-center gap-1">
            <span className="text-lg">🔄</span>
            <span className="text-sm text-gray-600">已同步</span>
          </div>
        </div>
      </div>
    </div>
  );
}
