/**
 * Task Card Component (Child Version)
 *
 * Story 2.8: Child Views Today's Task List
 * Task 3: 实现任务状态显示
 *
 * 儿童端任务卡片 - 游戏化设计
 * - 大按钮设计（≥80x80pt触摸目标）
 * - 鲜艳色彩系统
 * - 游戏化元素
 */

'use client';

import { Task } from '@/lib/store/task-store';

interface TaskCardChildProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCardChild({ task, onClick }: TaskCardChildProps) {
  // 根据任务类型获取emoji图标
  const getTaskIcon = (taskType: string) => {
    const icons: Record<string, string> = {
      '刷牙': '🦷',
      '学习': '📚',
      '运动': '⚽',
      '家务': '🧹',
      '自定义': '⭐',
    };
    return icons[taskType] || '📝';
  };

  // 根据状态获取样式
  const getStatusStyles = (displayStatus: string) => {
    switch (displayStatus) {
      case 'completed':
        return {
          bg: 'bg-gradient-to-br from-green-100 to-green-200',
          border: 'border-green-400',
          badge: 'bg-green-500',
          badgeText: '已完成',
          badgeIcon: '✓',
        };
      case 'pending_approval':
        return {
          bg: 'bg-gradient-to-br from-orange-100 to-yellow-200',
          border: 'border-orange-400',
          badge: 'bg-orange-500',
          badgeText: '待审批',
          badgeIcon: '🔒',
        };
      default: // pending
        return {
          bg: 'bg-gradient-to-br from-gray-100 to-gray-200',
          border: 'border-gray-300',
          badge: 'bg-gray-400',
          badgeText: '待完成',
          badgeIcon: '⏳',
        };
    }
  };

  const styles = getStatusStyles(task.displayStatus);
  const icon = getTaskIcon(task.task_type);

  return (
    <button
      onClick={onClick}
      className={`
        ${styles.bg}
        border-4 ${styles.border}
        rounded-3xl p-6
        min-h-[160px] min-w-[160px]
        flex flex-col items-center justify-between
        transition-all duration-200
        hover:scale-105 hover:shadow-xl
        active:scale-95
        focus:outline-none focus:ring-4 focus:ring-blue-400
        cursor-pointer
      `}
    >
      {/* 顶部：任务图标 */}
      <div className="text-6xl mb-3">
        {icon}
      </div>

      {/* 中部：任务名称 */}
      <h3 className="text-lg font-bold text-gray-900 text-center line-clamp-2 mb-2">
        {task.title}
      </h3>

      {/* 底部：积分和状态 */}
      <div className="flex items-center justify-between w-full">
        {/* 积分 */}
        <div className="flex items-center gap-1">
          <span className="text-2xl">⭐</span>
          <span className="text-xl font-bold text-yellow-600">
            +{task.points}
          </span>
        </div>

        {/* 状态徽章 */}
        <div className={`
          ${styles.badge}
          text-white px-3 py-1 rounded-full
          text-sm font-bold flex items-center gap-1
        `}>
          <span>{styles.badgeIcon}</span>
          <span>{styles.badgeText}</span>
        </div>
      </div>
    </button>
  );
}
