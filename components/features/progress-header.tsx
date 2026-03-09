/**
 * Progress Header Component
 *
 * Story 2.8: Child Views Today's Task List
 * Task 5: 实现任务进度显示
 *
 * 显示儿童今日任务进度
 * - 任务数量显示："今日任务(X/Y)"
 * - 进度条可视化
 */

import { TaskProgress } from '@/lib/store/task-store';

interface ProgressHeaderProps {
  progress: TaskProgress | null;
}

export function ProgressHeader({ progress }: ProgressHeaderProps) {
  if (!progress) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const { completed, total, progress: percentage } = progress;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-4 border-blue-400">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">📋</span>
          <h2 className="text-2xl font-bold text-gray-900">
            今日任务
          </h2>
        </div>

        {/* 任务数量显示 */}
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {completed}/{total}
          </div>
          <div className="text-sm text-gray-600">
            已完成
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="relative">
        {/* 背景条 */}
        <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
          {/* 进度填充 */}
          <div
            className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* 进度百分比文字 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white drop-shadow-lg">
            {percentage}%
          </span>
        </div>
      </div>

      {/* 鼓励文字 */}
      {percentage === 100 && (
        <div className="mt-3 text-center">
          <span className="text-xl">🎉 太棒了！所有任务都完成了！</span>
        </div>
      )}
    </div>
  );
}
