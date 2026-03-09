/**
 * Batch Approve Dialog Component
 *
 * Story 2.7: Parent Batch Approves Tasks
 * Task 3: 实现批量通过功能
 *
 * Dialog for confirming batch approval of selected tasks
 * - Shows list of tasks to be approved
 * - Displays total points to be awarded
 * - Confirms approval action
 *
 * Source: Story 2.7 AC - 批量通过：一次性审批所有选中任务
 */

'use client';

import { useState } from 'react';
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
import { CheckCircle2 } from 'lucide-react';
import { taskTypeIcons } from '@/components/features/task-approval-list';

interface Task {
  id: string;
  title: string;
  task_type: string;
  points: number;
  assigned_child_id: string;
}

interface BatchApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskIds: string[];
  tasks: Task[];
  onConfirm: () => Promise<void>;
}

export function BatchApproveDialog({
  open,
  onOpenChange,
  taskIds: _taskIds,
  tasks,
  onConfirm,
}: BatchApproveDialogProps) {
  const [isApproving, setIsApproving] = useState(false);

  const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
  const uniqueChildren = Array.from(new Set(tasks.map(t => t.assigned_child_id)));
  const childrenCount = uniqueChildren.length;

  const handleConfirm = async () => {
    setIsApproving(true);
    try {
      await onConfirm();
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            确认通过任务
          </DialogTitle>
          <DialogDescription>
            您即将通过 {tasks.length} 个任务，共 {childrenCount} 个儿童完成
          </DialogDescription>
        </DialogHeader>

        {/* Tasks List */}
        <div className="max-h-60 overflow-y-auto py-4">
          <div className="space-y-2">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {taskTypeIcons[task.task_type] || '⭐'}
                  </span>
                  <span className="text-sm font-medium">{task.title}</span>
                </div>
                <Badge variant="secondary">+{task.points}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
          <span className="font-medium text-sm">总计积分</span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            +{totalPoints}
          </span>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApproving}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isApproving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isApproving ? '处理中...' : '确认通过'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
