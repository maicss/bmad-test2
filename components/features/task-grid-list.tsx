/**
 * Task Grid List Component
 *
 * Story 2.8: Child Views Today's Task List
 * Task 2: 实现今日任务列表组件
 *
 * 儿童端任务网格列表
 * - 任务卡片网格布局（2-3列，响应式）
 * - 空状态展示
 * - 加载状态
 */

'use client';

import { TaskCardChild } from './task-card-child';
import { Task } from '@/lib/store/task-store';

interface TaskGridListProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskClick?: (task: Task) => void;
}

export function TaskGridList({ tasks, isLoading, onTaskClick }: TaskGridListProps) {
  // 加载状态
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-3xl h-40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // 空状态
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-8xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          今天没有任务！
        </h3>
        <p className="text-lg text-gray-600">
          去玩吧！
        </p>
      </div>
    );
  }

  // 任务网格列表
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tasks.map((task) => (
        <TaskCardChild
          key={task.id}
          task={task}
          onComplete={onTaskClick ? (taskId) => onTaskClick(task) : undefined}
        />
      ))}
    </div>
  );
}
