/**
 * Child Dashboard Page
 *
 * Story 2.8: Child Views Today's Task List
 *
 * 儿童端首页 - 显示今日任务列表
 */

'use client';

import { useEffect, useState } from 'react';
import { ProgressHeader } from '@/components/features/progress-header';
import { TaskGridList } from '@/components/features/task-grid-list';
import { TaskDetailDialog } from '@/components/dialogs/task-detail-dialog';
import { useTaskStore, Task } from '@/lib/store/task-store';
import { toast } from 'sonner';
import { TaskSortSelector, TaskSortOption } from '@/components/features/task-sort-selector';

export default function ChildDashboardPage() {
  const [currentChildId, setCurrentChildId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [sortOption, setSortOption] = useState<TaskSortOption>('created');

  // Get state and actions from task store
  const { tasks, progress, isLoading, error, fetchTasks, refreshTasks, setSortOption: setStoreSortOption } = useTaskStore();

  // Get current child ID from session
  useEffect(() => {
    const getChildId = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role === 'child') {
            setCurrentChildId(data.user.id);
            fetchTasks(data.user.id);
          }
        }
      } catch (error) {
        console.error('Failed to get child info:', error);
      }
    };

    getChildId();
  }, []);

  // Auto-refresh (every 5 seconds)
  useEffect(() => {
    if (!currentChildId) return;
    const interval = setInterval(() => refreshTasks(currentChildId), 5000);
    return () => clearInterval(interval);
  }, [currentChildId, refreshTasks]);

  // Handle sort option change
  const handleSortChange = (newSort: TaskSortOption) => {
    setSortOption(newSort);
    if (currentChildId) {
      setStoreSortOption(newSort, currentChildId);
    }
  };

  // Handle task click - show detail dialog
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  // Handle task completion
  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/child/tasks/${taskId}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '标记任务失败');
      }

      const data = await response.json();

      // Show success toast
      toast.success('任务已完成！等待家长审批', {
        description: '太棒了！',
      });

      // Refresh tasks
      if (currentChildId) {
        await refreshTasks(currentChildId);
      }

      return data;
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error(error instanceof Error ? error.message : '标记任务失败');
      throw error;
    }
  };

  // Loading state
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
          <p className="text-xl text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with sort selector */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">我的主页</h1>
        <TaskSortSelector
          value={sortOption}
          onChange={handleSortChange}
        />
      </div>

      {/* Progress display */}
      {progress && <ProgressHeader progress={progress} />}

      {/* Task list */}
      <TaskGridList
        tasks={tasks}
        isLoading={isLoading}
        onTaskClick={handleTaskClick}
      />

      {/* Task detail dialog */}
      <TaskDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        task={selectedTask}
        onComplete={handleCompleteTask}
      />
    </div>
  );
}
