/**
 * Task Complete Dialog Component
 *
 * Story 2.9: Child Marks Task Complete
 * Task 2: Implement task completion dialog UI
 *
 * Dialog for children to confirm task completion:
 * - Displays task information (name, points)
 * - Optional proof image upload
 * - Confirm and Cancel buttons
 * - Loading states during submission
 *
 * Source: Story 2.9 Dev Notes - Task Complete Dialog
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
import { ImageUpload } from '@/components/forms/image-upload';
import { Loader2, Star, CheckCircle2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  points: number;
  task_type: string;
}

interface TaskCompleteDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Task to complete */
  task: Task;
  /** Callback when task is confirmed complete */
  onConfirm: (proofImage?: string) => Promise<void>;
  /** Whether the submission is in progress */
  isSubmitting?: boolean;
  /** Test ID prefix for E2E testing */
  taskCardTestId?: string;
}

export function TaskCompleteDialog({
  open,
  onOpenChange,
  task,
  onConfirm,
  isSubmitting = false,
  taskCardTestId,
}: TaskCompleteDialogProps) {
  const [proofImage, setProofImage] = useState<string | undefined>();
  const [uploadError, setUploadError] = useState<string>();

  const handleConfirm = async () => {
    try {
      await onConfirm(proofImage);
      // Reset state on success
      setProofImage(undefined);
      setUploadError(undefined);
    } catch (error) {
      console.error('Task completion failed:', error);
    }
  };

  const handleCancel = () => {
    setProofImage(undefined);
    setUploadError(undefined);
    onOpenChange(false);
  };

  const getTaskIcon = (taskType: string) => {
    const icons: Record<string, string> = {
      '刷牙': '🦷',
      '学习': '📚',
      '运动': '⚽',
      '家务': '🧹',
      '签到': '✅',
      '自定义': '⭐',
    };
    return icons[taskType] || '📝';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="task-complete-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">完成任务</DialogTitle>
          <DialogDescription className="text-center">
            确认完成这个任务吗？
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {/* Task icon */}
          <div className="text-6xl mb-4">{getTaskIcon(task.task_type)}</div>

          {/* Task name */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {task.title}
          </h3>

          {/* Points display */}
          <div className="flex items-center gap-2 text-yellow-600">
            <Star className="w-5 h-5 fill-yellow-400" />
            <span className="text-2xl font-bold">+{task.points}</span>
            <span className="text-sm">积分</span>
          </div>
        </div>

        {/* Image upload section */}
        <div className="py-4 border-t border-b border-gray-200" data-testid="image-upload-area">
          <p className="text-sm text-gray-600 mb-2 text-center">
            上传完成证明（可选）
          </p>
          <ImageUpload
            value={proofImage}
            onChange={(value) => {
              setProofImage(value);
              setUploadError(undefined);
            }}
            error={uploadError}
            disabled={isSubmitting}
            testIdPrefix="task-complete"
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1"
            data-testid="cancel-complete-button"
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            data-testid="confirm-complete-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                确认完成
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
