/**
 * Task Detail Dialog Component
 *
 * Story 2.8: Child Views Today's Task List
 * Task 7: 实现任务点击交互
 *
 * 儿童端任务详情弹窗 - 游戏化设计
 * - 显示完整任务信息
 * - 大按钮设计（≥80x80pt触摸目标）
 * - 完成按钮（待审批状态禁用）
 * - 关闭按钮
 */

'use client';

import { useState } from 'react';
import { Task } from '@/lib/store/task-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onComplete?: (taskId: string) => Promise<void>;
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  onComplete,
}: TaskDetailDialogProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  // 根据任务类型获取emoji图标和描述
  const getTaskTypeInfo = (taskType: string) => {
    const info: Record<string, { icon: string; color: string; description: string }> = {
      '刷牙': { icon: '🦷', color: 'bg-blue-100 text-blue-700', description: '保持口腔健康' },
      '学习': { icon: '📚', color: 'bg-purple-100 text-purple-700', description: '增长知识' },
      '运动': { icon: '⚽', color: 'bg-green-100 text-green-700', description: '锻炼身体' },
      '家务': { icon: '🧹', color: 'bg-orange-100 text-orange-700', description: '帮助家里' },
      '自定义': { icon: '⭐', color: 'bg-pink-100 text-pink-700', description: '特别任务' },
    };
    return info[taskType] || { icon: '📝', color: 'bg-gray-100 text-gray-700', description: '任务' };
  };

  // 根据状态获取样式和文字
  const getStatusInfo = (displayStatus: string) => {
    switch (displayStatus) {
      case 'completed':
        return {
          label: '已完成',
          color: 'bg-green-500',
          icon: '✓',
          description: '太棒了！任务已完成',
        };
      case 'pending_approval':
        return {
          label: '待审批',
          color: 'bg-orange-500',
          icon: '🔒',
          description: '等待家长审批',
        };
      default:
        return {
          label: '待完成',
          color: 'bg-gray-400',
          icon: '⏳',
          description: '完成任务，赚取积分！',
        };
    }
  };

  if (!task) return null;

  const typeInfo = getTaskTypeInfo(task.task_type);
  const statusInfo = getStatusInfo(task.displayStatus);
  const canComplete = task.displayStatus === 'pending';
  const completedAt = task.status === 'completed' || task.status === 'approved'
    ? new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
    : null;

  const handleComplete = async () => {
    if (!canComplete || !onComplete) return;

    setIsCompleting(true);
    try {
      await onComplete(task.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <span className="text-4xl">{typeInfo.icon}</span>
            <span className="flex-1">{task.title}</span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            {typeInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* 任务类型 */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-lg">任务类型</span>
            <Badge className={`${typeInfo.color} text-lg px-4 py-2`}>
              <span className="mr-2">{typeInfo.icon}</span>
              {task.task_type}
            </Badge>
          </div>

          {/* 积分奖励 */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-lg">积分奖励</span>
            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
              <span className="text-3xl">⭐</span>
              <span className="text-2xl font-bold text-yellow-600">+{task.points}</span>
            </div>
          </div>

          {/* 任务状态 */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-lg">当前状态</span>
            <Badge className={`${statusInfo.color} text-white text-lg px-4 py-2`}>
              <span className="mr-2">{statusInfo.icon}</span>
              {statusInfo.label}
            </Badge>
          </div>

          {/* 状态描述 */}
          <div className={`
            p-4 rounded-2xl text-center text-lg font-medium
            ${task.displayStatus === 'completed'
              ? 'bg-green-100 text-green-700'
              : task.displayStatus === 'pending_approval'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-blue-100 text-blue-700'
            }
          `}>
            {statusInfo.description}
          </div>

          {/* 完成时间（如果已完成） */}
          {completedAt && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-lg">完成时间</span>
              <span className="text-lg font-medium">{completedAt}</span>
            </div>
          )}

          {/* 预定日期 */}
          <div className="flex items-center justify-between text-gray-500">
            <span>预定日期</span>
            <span>{task.scheduled_date}</span>
          </div>
        </div>

        <DialogFooter className="gap-3">
          {/* 关闭按钮 */}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-[50px] text-lg"
          >
            关闭
          </Button>

          {/* 完成按钮（仅待完成状态可点击） */}
          <Button
            onClick={handleComplete}
            disabled={!canComplete || isCompleting}
            className={`
              min-h-[50px] text-lg font-bold
              ${canComplete
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
          >
            {isCompleting ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                提交中...
              </span>
            ) : task.displayStatus === 'pending' ? (
              <span className="flex items-center gap-2">
                <span>✓</span>
                完成任务
              </span>
            ) : task.displayStatus === 'pending_approval' ? (
              <span className="flex items-center gap-2">
                <span>🔒</span>
                等待审批
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>✓</span>
                已完成
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
