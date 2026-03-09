/**
 * Child Dashboard Page
 *
 * Story 2.8: Child Views Today's Task List
 *
 * 儿童端首页 - 显示今日任务列表
 * - 任务进度显示
 * - 任务卡片网格布局
 * - 自动刷新机制
 */

'use client';

import { useEffect, useState } from 'react';
import { ProgressHeader } from '@/components/features/progress-header';
import { TaskGridList } from '@/components/features/task-grid-list';
import { useTaskStore, Task } from '@/lib/store/task-store';

interface ChildData {
  tasks: Task[];
  progress: {
    completed: number;
    total: number;
    progress: number;
  };
}

export default function ChildDashboardPage() {
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载任务数据
  const loadTasks = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch('/api/child/tasks');
      if (!response.ok) {
        throw new Error('加载任务失败');
      }

      const data = await response.json();
      setChildData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载任务失败');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadTasks();
  }, []);

  // 自动刷新（每5秒）
  useEffect(() => {
    const interval = setInterval(() => {
      loadTasks(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 任务点击处理
  const handleTaskClick = (task: Task) => {
    // Story 2.9: 实现任务完成功能
    console.log('Task clicked:', task);
  };

  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
          <p className="text-xl text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8">
          <div className="text-6xl mb-4">😢</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadTasks()}
            className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          我的主页
        </h1>
        <p className="text-gray-600">
          完成任务，赚取积分！
        </p>
      </div>

      {/* 刷新指示器 */}
      {isRefreshing && (
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>同步中...</span>
        </div>
      )}

      {/* 进度显示 */}
      {childData?.progress && <ProgressHeader progress={childData.progress} />}

      {/* 任务列表 */}
      <TaskGridList
        tasks={childData?.tasks || []}
        isLoading={isLoading}
        onTaskClick={handleTaskClick}
      />

      {/* 下拉刷新提示 */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>💡 任务列表会自动刷新</p>
      </div>
    </div>
  );
}
