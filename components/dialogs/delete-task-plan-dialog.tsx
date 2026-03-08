/**
 * Delete Task Plan Dialog
 *
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 *
 * Shows confirmation warning before deleting a task plan.
 * Warns that deletion cannot be undone, but existing task instances will be preserved.
 *
 * Uses Shadcn UI Dialog and Alert components
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteTaskPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  taskPlanTitle: string;
}

export function DeleteTaskPlanDialog({
  open,
  onOpenChange,
  onConfirm,
  taskPlanTitle,
}: DeleteTaskPlanDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      toast.success('任务计划已删除');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete task plan:', error);
      toast.error('删除任务计划失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            删除任务计划
          </DialogTitle>
          <DialogDescription className="pt-2">
            确认要删除任务计划「{taskPlanTitle}」吗？
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <div className="space-y-2">
                <p className="font-medium">此操作无法撤销</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>任务计划将被永久删除</li>
                  <li><strong>已生成的任务实例将保留</strong></li>
                  <li>子任务的完成进度不受影响</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
