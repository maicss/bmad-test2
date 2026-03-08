/**
 * Task Plan List Component
 *
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 *
 * Displays all task plans with action buttons for pause/resume/delete.
 * Shows status badges and countdown for paused plans.
 *
 * Features:
 * - Lists all task plans for the family
 * - Shows status badges (已发布/已暂停/草稿)
 * - Action buttons based on status (暂停/恢复/删除)
 * - Pause countdown for paused plans
 * - Highlight paused plans
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PauseTaskPlanDialog } from '@/components/dialogs/pause-task-plan-dialog';
import { DeleteTaskPlanDialog } from '@/components/dialogs/delete-task-plan-dialog';
import { PausedCountdown } from '@/components/features/paused-countdown';
import { toast } from 'sonner';
import {
  Pause,
  Play,
  Trash2,
  MoreVertical,
  FileEdit,
} from 'lucide-react';
import type { TaskPlanStatus } from '@/lib/db/queries/task-plans';

export interface TaskPlan {
  id: string;
  title: string;
  task_type: string;
  points: number;
  status: TaskPlanStatus;
  paused_until?: Date | string | null;
  created_at: Date | string;
  rule: string;
}

interface TaskPlanListProps {
  taskPlans: TaskPlan[];
  onPause?: (planId: string, durationDays: number | null) => Promise<void>;
  onResume?: (planId: string) => Promise<void>;
  onDelete?: (planId: string) => Promise<void>;
  onEdit?: (planId: string) => void;
}

export function TaskPlanList({
  taskPlans,
  onPause,
  onResume,
  onDelete,
  onEdit,
}: TaskPlanListProps) {
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TaskPlan | null>(null);

  const handlePauseClick = (plan: TaskPlan) => {
    setSelectedPlan(plan);
    setPauseDialogOpen(true);
  };

  const handlePauseConfirm = async (durationDays: number | null) => {
    if (!selectedPlan || !onPause) return;
    await onPause(selectedPlan.id, durationDays);
  };

  const handleDeleteClick = (plan: TaskPlan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPlan || !onDelete) return;
    await onDelete(selectedPlan.id);
  };

  const handleResumeClick = async (plan: TaskPlan) => {
    if (!onResume) return;
    try {
      await onResume(plan.id);
      toast.success('任务计划已恢复');
    } catch (error) {
      console.error('Failed to resume task plan:', error);
      toast.error('恢复任务计划失败');
    }
  };

  const getStatusBadge = (status: TaskPlanStatus) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-500" data-testid="status-badge">已发布</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-orange-500 text-white" data-testid="status-badge">已暂停</Badge>;
      case 'draft':
        return <Badge variant="outline" data-testid="status-badge">草稿</Badge>;
    }
  };

  const getTaskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      '刷牙': '刷牙',
      '学习': '学习',
      '运动': '运动',
      '家务': '家务',
      '自定义': '自定义',
    };
    return labels[type] || type;
  };

  return (
    <>
      <div className="space-y-3">
        {taskPlans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无任务计划
          </div>
        ) : (
          taskPlans.map((plan) => (
            <div
              key={plan.id}
              data-testid="task-plan-item"
              className={`flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent ${
                plan.status === 'paused' ? 'border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{plan.title}</h3>
                  {getStatusBadge(plan.status)}
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{getTaskTypeLabel(plan.task_type)}</span>
                  <span>{plan.points} 积分</span>
                  {plan.status === 'paused' && plan.paused_until && (
                    <div data-testid="paused-countdown">
                      <PausedCountdown pausedUntil={plan.paused_until} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {plan.status === 'published' && onPause && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePauseClick(plan)}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    暂停
                  </Button>
                )}

                {plan.status === 'paused' && onResume && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResumeClick(plan)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    恢复
                  </Button>
                )}

                {onEdit && plan.status === 'draft' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(plan.id)}
                  >
                    <FileEdit className="h-4 w-4 mr-1" />
                    编辑
                  </Button>
                )}

                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(plan)}
                    className="text-destructive hover:text-destructive"
                    aria-label="删除任务计划"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedPlan && (
        <>
          <PauseTaskPlanDialog
            open={pauseDialogOpen}
            onOpenChange={setPauseDialogOpen}
            onConfirm={handlePauseConfirm}
            taskPlanTitle={selectedPlan.title}
          />
          <DeleteTaskPlanDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDeleteConfirm}
            taskPlanTitle={selectedPlan.title}
          />
        </>
      )}
    </>
  );
}
