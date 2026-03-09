/**
 * Quick Task Form Component
 *
 * Story 2.6: Parent Uses Template to Quickly Create Task
 *
 * Form for creating manual tasks from templates.
 * Parents can modify template values before creating the task.
 *
 * Source: Story 2.6 Task 3
 * Source: _bmad-output/project-context.md - RED LIST rules
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

// Task plan type from database
interface TaskPlan {
  id: string;
  title: string;
  task_type: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  points: number;
}

// Child user type
interface Child {
  id: string;
  name: string;
}

/**
 * Form validation schema
 */
const quickTaskSchema = z.object({
  title: z.string().min(1, '任务名称不能为空').max(100, '任务名称最多100个字符'),
  task_type: z.enum(['刷牙', '学习', '运动', '家务', '自定义']),
  points: z.number().int('积分必须是整数').min(1, '积分最少1分').max(100, '积分最多100分'),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须是YYYY-MM-DD'),
  child_ids: z.array(z.string()).min(1, '请至少选择一个儿童'),
  notes: z.string().max(500, '备注最多500个字符').optional(),
});

type QuickTaskFormData = z.infer<typeof quickTaskSchema>;

interface QuickTaskFormProps {
  template?: TaskPlan | null;
  children: Child[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Quick Task Form Component
 *
 * Creates manual tasks from templates with editable fields.
 */
export function QuickTaskForm({ template, children, onSuccess, onCancel }: QuickTaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [originalTemplate, setOriginalTemplate] = useState<TaskPlan | null>(template || null);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<QuickTaskFormData>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: {
      title: template?.title || '',
      task_type: template?.task_type || '自定义',
      points: template?.points || 5,
      scheduled_date: getTodayDate(),
      child_ids: [],
      notes: '',
    },
  });

  // Update form when template changes
  useEffect(() => {
    if (template) {
      setValue('title', template.title);
      setValue('task_type', template.task_type);
      setValue('points', template.points);
      setOriginalTemplate(template);
    }
  }, [template, setValue]);

  /**
   * Reset form to template values
   */
  const handleResetToTemplate = () => {
    if (originalTemplate) {
      setValue('title', originalTemplate.title);
      setValue('task_type', originalTemplate.task_type);
      setValue('points', originalTemplate.points);
    } else {
      setValue('title', '');
      setValue('task_type', '自定义');
      setValue('points', 5);
    }
    setValue('child_ids', []);
    setValue('notes', '');
  };

  /**
   * Handle child selection toggle
   */
  const toggleChild = (childId: string) => {
    const currentChildIds = watch('child_ids') || [];
    const newChildIds = currentChildIds.includes(childId)
      ? currentChildIds.filter(id => id !== childId)
      : [...currentChildIds, childId];
    setValue('child_ids', newChildIds);
  };

  /**
   * Submit form to create manual tasks
   */
  const onSubmit = async (data: QuickTaskFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_plan_id: template?.id || null,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '创建任务失败');
      }

      toast.success(result.message || '任务创建成功');

      // Reset form
      reset();

      // Call success callback
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error(error instanceof Error ? error.message : '创建任务失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // Task type options
  const taskTypes = ['刷牙', '学习', '运动', '家务', '自定义'];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Task name */}
      <div className="space-y-2">
        <Label htmlFor="title">
          任务名称 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="例如：每日刷牙30分钟"
          {...register('title')}
          disabled={loading}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      {/* Task type and points */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task_type">
            任务类型 <span className="text-red-500">*</span>
          </Label>
          <Select
            value={watch('task_type')}
            onValueChange={(value) => setValue('task_type', value as any)}
            disabled={loading}
          >
            <SelectTrigger id="task_type">
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              {taskTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.task_type && (
            <p className="text-sm text-red-500">{errors.task_type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="points">
            积分 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="points"
            type="number"
            min={1}
            max={100}
            placeholder="5"
            {...register('points', { valueAsNumber: true })}
            disabled={loading}
          />
          {errors.points && (
            <p className="text-sm text-red-500">{errors.points.message}</p>
          )}
        </div>
      </div>

      {/* Scheduled date */}
      <div className="space-y-2">
        <Label htmlFor="scheduled_date">
          执行日期 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="scheduled_date"
          type="date"
          min={getTodayDate()}
          {...register('scheduled_date')}
          disabled={loading}
        />
        {errors.scheduled_date && (
          <p className="text-sm text-red-500">{errors.scheduled_date.message}</p>
        )}
      </div>

      {/* Assigned children */}
      <div className="space-y-2">
        <Label>
          适用儿童 <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-2">
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无儿童，请先添加儿童</p>
          ) : (
            children.map(child => (
              <div key={child.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`child-${child.id}`}
                  checked={watch('child_ids')?.includes(child.id)}
                  onCheckedChange={() => toggleChild(child.id)}
                  disabled={loading}
                />
                <Label htmlFor={`child-${child.id}`} className="cursor-pointer">
                  {child.name}
                </Label>
              </div>
            ))
          )}
        </div>
        {errors.child_ids && (
          <p className="text-sm text-red-500">{errors.child_ids.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">备注（可选）</Label>
        <Textarea
          id="notes"
          placeholder="添加备注信息..."
          rows={3}
          {...register('notes')}
          disabled={loading}
        />
        {errors.notes && (
          <p className="text-sm text-red-500">{errors.notes.message}</p>
        )}
      </div>

      {/* Reset button */}
      {originalTemplate && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetToTemplate}
          disabled={loading}
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          重置为模板值
        </Button>
      )}

      {/* Form actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            取消
          </Button>
        )}
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          创建任务
        </Button>
      </div>
    </form>
  );
}
