/**
 * Pause Task Plan Dialog
 *
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 *
 * Allows parent to pause a task plan with duration options:
 * - 1 day, 3 days, 7 days
 * - Custom duration (days)
 * - Permanent pause
 *
 * Uses Shadcn UI Dialog and RadioGroup components
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CalendarClock } from 'lucide-react';

export type PauseDuration = '1' | '3' | '7' | 'custom' | 'permanent';

interface PauseTaskPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (durationDays: number | null) => Promise<void>;
  taskPlanTitle: string;
}

export function PauseTaskPlanDialog({
  open,
  onOpenChange,
  onConfirm,
  taskPlanTitle,
}: PauseTaskPlanDialogProps) {
  const [duration, setDuration] = useState<PauseDuration>('1');
  const [customDays, setCustomDays] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDurationDays = (): number | null => {
    if (duration === 'permanent') return null;
    if (duration === 'custom') {
      const days = parseInt(customDays, 10);
      return isNaN(days) || days < 1 ? 1 : days;
    }
    return parseInt(duration, 10);
  };

  const getDurationLabel = (): string => {
    if (duration === 'permanent') return '永久暂停';
    if (duration === 'custom') {
      const days = parseInt(customDays, 10);
      return isNaN(days) || days < 1 ? '1天' : `${days}天`;
    }
    return `${duration}天`;
  };

  const handleConfirm = async () => {
    const durationDays = getDurationDays();

    // Validate custom days
    if (duration === 'custom') {
      const days = parseInt(customDays, 10);
      if (isNaN(days) || days < 1) {
        toast.error('请输入有效的天数（至少1天）');
        return;
      }
      if (days > 365) {
        toast.error('暂停时长不能超过365天');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onConfirm(durationDays);
      toast.success(`任务计划已暂停${getDurationLabel()}`);
      onOpenChange(false);
      // Reset form
      setDuration('1');
      setCustomDays('1');
    } catch (error) {
      console.error('Failed to pause task plan:', error);
      toast.error('暂停任务计划失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset form
    setDuration('1');
    setCustomDays('1');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-orange-500" />
            暂停任务计划
          </DialogTitle>
          <DialogDescription>
            暂停「{taskPlanTitle}」将停止生成新的任务实例，已生成的任务不受影响。
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="text-base font-medium">选择暂停时长</Label>
          <RadioGroup value={duration} onValueChange={(v) => setDuration(v as PauseDuration)} className="mt-3">
            <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent">
              <RadioGroupItem value="1" id="pause-1" />
              <Label htmlFor="pause-1" className="flex-1 cursor-pointer font-normal">
                暂停 1 天
              </Label>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent">
              <RadioGroupItem value="3" id="pause-3" />
              <Label htmlFor="pause-3" className="flex-1 cursor-pointer font-normal">
                暂停 3 天
              </Label>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent">
              <RadioGroupItem value="7" id="pause-7" />
              <Label htmlFor="pause-7" className="flex-1 cursor-pointer font-normal">
                暂停 7 天
              </Label>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent">
              <RadioGroupItem value="custom" id="pause-custom" />
              <div className="flex-1">
                <Label htmlFor="pause-custom" className="cursor-pointer font-normal">
                  自定义时长
                </Label>
                {duration === 'custom' && (
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      className="h-8 w-24"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm text-muted-foreground">天</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border border-orange-200 bg-orange-50 p-3 hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950">
              <RadioGroupItem value="permanent" id="pause-permanent" />
              <Label htmlFor="pause-permanent" className="flex-1 cursor-pointer font-normal">
                永久暂停（需手动恢复）
              </Label>
            </div>
          </RadioGroup>

          {duration !== 'permanent' && (
            <p className="mt-3 text-sm text-muted-foreground">
              {duration === 'custom'
                ? `将在 ${parseInt(customDays, 10) || 1} 天后自动恢复`
                : `将在 ${duration} 天后自动恢复`}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? '暂停中...' : '确认暂停'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
