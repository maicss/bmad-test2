/**
 * Batch Reject Dialog Component
 *
 * Story 2.7: Parent Batch Approves Tasks
 * Task 4: 实现批量驳回功能
 *
 * Dialog for rejecting tasks with reason
 * - Shows list of tasks to be rejected
 * - Requires rejection reason (required, max 200 chars)
 * - Preset rejection reasons for quick selection
 *
 * Source: Story 2.7 AC - 批量驳回：一次性驳回所有选中任务，需填写驳回原因
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle } from 'lucide-react';
import { taskTypeIcons } from '@/components/features/task-approval-list';

interface Task {
  id: string;
  title: string;
  task_type: string;
  points: number;
}

interface BatchRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskIds: string[];
  tasks: Task[];
  onConfirm: (reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  '任务没有完成',
  '完成质量不达标',
  '完成证明不清晰',
  '需要重新完成',
  '其他原因',
];

export function BatchRejectDialog({
  open,
  onOpenChange,
  taskIds: _taskIds,
  tasks,
  onConfirm,
}: BatchRejectDialogProps) {
  const [reason, setReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const handlePresetReason = (preset: string) => {
    if (preset === '其他原因') {
      return; // Let user type custom reason
    }
    setReason(preset);
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsRejecting(true);
    try {
      await onConfirm(reason);
      setReason('');
    } finally {
      setIsRejecting(false);
    }
  };

  const isValid = reason.trim().length > 0 && reason.length <= 200;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            驳回任务
          </DialogTitle>
          <DialogDescription>
            您即将驳回 {tasks.length} 个任务，任务将返回待完成状态
          </DialogDescription>
        </DialogHeader>

        {/* Tasks List */}
        <div className="max-h-40 overflow-y-auto py-2">
          <div className="space-y-2">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                <span className="text-lg">
                  {taskTypeIcons[task.task_type] || '⭐'}
                </span>
                <span className="text-sm">{task.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rejection Reason */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="reason">
              驳回原因 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="请输入驳回原因..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              rows={3}
              className="mt-1.5"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                请说明驳回原因，帮助孩子改进
              </span>
              <span className={`text-xs ${reason.length > 200 ? 'text-red-500' : 'text-muted-foreground'}`} data-testid="char-counter">
                {reason.length}/200
              </span>
            </div>
          </div>

          {/* Preset Reasons */}
          <div className="flex flex-wrap gap-2">
            {PRESET_REASONS.map(preset => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetReason(preset)}
                className="text-xs"
              >
                {preset}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            请说明驳回原因，帮助孩子改进
          </span>
          <span className={`text-xs ${reason.length > 200 ? 'text-red-500' : 'text-muted-foreground'}`} data-testid="char-counter">
            {reason.length}/200
          </span>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRejecting}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isRejecting || !isValid}
            variant="destructive"
          >
            {isRejecting ? '处理中...' : '确认驳回'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
