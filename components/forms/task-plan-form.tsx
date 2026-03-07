/**
 * Task Plan Form Component
 *
 * Story 2.1: Parent Creates Task Plan Template
 * Task 2.1: Create TaskPlanForm component (using Shadcn UI)
 *
 * This component allows parents to create task plan templates with:
 * - Template name (required, max 50 chars)
 * - Task type selection
 * - Assigned children selection
 * - Points value (1-100)
 * - Frequency rule selection
 * - Excluded dates (optional)
 * - Reminder time (optional)
 * - Save as draft / Publish buttons
 *
 * Source: Story 2.1 AC #1
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PointsPresets } from '@/components/forms/points-suggestions';
import { getDefaultPoints } from '@/lib/constants/points-suggestions';

// Types for the form
export interface TaskPlanFormData {
  title: string;
  task_type: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  assigned_children: string[];
  points: number;
  frequency: 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';
  custom_days?: number[];
  excluded_dates?: string[];
  reminder_time?: string;
}

export interface ChildOption {
  id: string;
  name: string;
}

interface TaskPlanFormProps {
  onSubmit: (data: TaskPlanFormData, status: 'draft' | 'published') => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<TaskPlanFormData>;
  children?: ChildOption[];
  isLoading?: boolean;
}

const TASK_TYPES = [
  { value: '刷牙', label: '刷牙' },
  { value: '学习', label: '学习' },
  { value: '运动', label: '运动' },
  { value: '家务', label: '家务' },
  { value: '自定义', label: '自定义' },
] as const;

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'weekdays', label: '工作日（周一至周五）' },
  { value: 'weekends', label: '周末（周六、周日）' },
  { value: 'custom', label: '自定义' },
] as const;

const WEEK_DAYS = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
] as const;

const DEFAULT_FORM_DATA: TaskPlanFormData = {
  title: '',
  task_type: '刷牙',
  assigned_children: [],
  points: 5,
  frequency: 'daily',
  custom_days: [],
  excluded_dates: [],
  reminder_time: '',
};

/**
 * Task Plan Form Component
 *
 * Provides a complete form for creating task plan templates
 */
export function TaskPlanForm({
  onSubmit,
  onCancel,
  initialData,
  children = [],
  isLoading = false,
}: TaskPlanFormProps) {
  const [formData, setFormData] = useState<TaskPlanFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TaskPlanFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof TaskPlanFormData, boolean>>>({});

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TaskPlanFormData, string>> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = '模板名称不能为空';
    } else if (formData.title.length > 50) {
      newErrors.title = '模板名称最多50个字符';
    }

    // Points validation
    if (formData.points < 1) {
      newErrors.points = '积分最少1分';
    } else if (formData.points > 100) {
      newErrors.points = '积分最多100分';
    }

    // Custom days validation for custom frequency
    if (formData.frequency === 'custom' && (!formData.custom_days || formData.custom_days.length === 0)) {
      newErrors.custom_days = '请至少选择一天';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field change
  const handleFieldChange = <K extends keyof TaskPlanFormData>(
    field: K,
    value: TaskPlanFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Auto-fill points based on task type (only if points is still default)
    if (field === 'task_type' && formData.points === 5) {
      const taskTypeToDifficulty: Record<TaskPlanFormData['task_type'], 'simple' | 'medium' | 'hard' | 'special'> = {
        '刷牙': 'simple',
        '学习': 'hard',
        '运动': 'medium',
        '家务': 'medium',
        '自定义': 'medium',
      };
      const difficulty = taskTypeToDifficulty[value];
      const suggestedPoints = getDefaultPoints(difficulty);
      setFormData(prev => ({ ...prev, points: suggestedPoints }));
    }
  };

  // Handle child selection toggle
  const toggleChildSelection = (childId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_children: prev.assigned_children.includes(childId)
        ? prev.assigned_children.filter(id => id !== childId)
        : [...prev.assigned_children, childId],
    }));
  };

  // Handle custom day selection toggle
  const toggleCustomDay = (dayValue: number) => {
    const currentDays = formData.custom_days || [];
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(d => d !== dayValue)
      : [...currentDays, dayValue];

    setFormData(prev => ({ ...prev, custom_days: newDays }));

    // Clear error for custom_days
    if (errors.custom_days && newDays.length > 0) {
      setErrors(prev => ({ ...prev, custom_days: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (status: 'draft' | 'published') => {
    // Mark all fields as touched
    setTouched({
      title: true,
      task_type: true,
      points: true,
      frequency: true,
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Submit form
    await onSubmit(formData, status);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>创建任务模板</CardTitle>
        <CardDescription>
          创建可重复使用的任务模板，系统会根据规则自动生成任务实例
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Template Name */}
        <div className="space-y-2">
          <Label htmlFor="title">
            模板名称 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="例如：每日刷牙"
            value={formData.title}
            onChange={e => handleFieldChange('title', e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
            maxLength={50}
            className={touched.title && errors.title ? 'border-red-500' : ''}
          />
          {touched.title && errors.title && (
            <p className="text-sm text-red-500">{errors.title}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formData.title.length}/50 字符
          </p>
        </div>

        {/* Task Type */}
        <div className="space-y-2">
          <Label htmlFor="task_type">
            任务类型 <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.task_type}
            onValueChange={(value) => handleFieldChange('task_type', value as TaskPlanFormData['task_type'])}
          >
            <SelectTrigger id="task_type">
              <SelectValue placeholder="选择任务类型" />
            </SelectTrigger>
            <SelectContent>
              {TASK_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Points Value */}
        <div className="space-y-3">
          <Label htmlFor="points">
            积分值 <span className="text-red-500">*</span>
          </Label>

          {/* Points Presets - Quick selection buttons */}
          <PointsPresets
            onSelectPoints={(points) => handleFieldChange('points', points)}
            currentPoints={formData.points}
          />

          {/* Points Input */}
          <Input
            id="points"
            type="number"
            min={1}
            max={100}
            value={formData.points}
            onChange={e => handleFieldChange('points', parseInt(e.target.value) || 0)}
            onBlur={() => setTouched(prev => ({ ...prev, points: true }))}
            className={touched.points && errors.points ? 'border-red-500' : ''}
          />
          {touched.points && errors.points && (
            <p className="text-sm text-red-500">{errors.points}</p>
          )}
          <p className="text-xs text-muted-foreground">
            任务完成后，儿童可获得此积分（1-100分）
          </p>
        </div>

        {/* Assigned Children */}
        {children.length > 0 && (
          <div className="space-y-2">
            <Label>适用儿童</Label>
            <div className="flex flex-wrap gap-2">
              {children.map(child => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => toggleChildSelection(child.id)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${formData.assigned_children.includes(child.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }
                  `}
                >
                  {child.name}
                  {formData.assigned_children.includes(child.id) && ' ✓'}
                </button>
              ))}
            </div>
            {formData.assigned_children.length === 0 && (
              <p className="text-xs text-muted-foreground">
                未选择儿童时，任务需要手动分配
              </p>
            )}
          </div>
        )}

        {/* Frequency Rule */}
        <div className="space-y-2">
          <Label htmlFor="frequency">
            循环规则 <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.frequency}
            onValueChange={(value) => handleFieldChange('frequency', value as TaskPlanFormData['frequency'])}
          >
            <SelectTrigger id="frequency">
              <SelectValue placeholder="选择循环规则" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Days Selection (shown only when frequency is 'custom') */}
        {formData.frequency === 'custom' && (
          <div className="space-y-2">
            <Label>
              选择星期 <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleCustomDay(day.value)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${(formData.custom_days || []).includes(day.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }
                  `}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {errors.custom_days && (
              <p className="text-sm text-red-500">{errors.custom_days}</p>
            )}
          </div>
        )}

        {/* Reminder Time (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="reminder_time">任务提醒时间（可选）</Label>
          <Input
            id="reminder_time"
            type="time"
            value={formData.reminder_time || ''}
            onChange={e => handleFieldChange('reminder_time', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            设置后，系统会在指定时间提醒儿童完成任务
          </p>
        </div>

        {/* Excluded Dates (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="excluded_dates">排除日期（可选）</Label>
          <Input
            id="excluded_dates"
            type="text"
            placeholder="例如: 2026-03-10,2026-03-15"
            value={formData.excluded_dates && formData.excluded_dates.length > 0 ? formData.excluded_dates.join(',') : ''}
            onChange={e => handleFieldChange('excluded_dates', e.target.value.split(',').filter(d => d.trim()))}
          />
          <p className="text-xs text-muted-foreground">
            输入要排除的日期，用逗号分隔（格式：YYYY-MM-DD）
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            取消
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={isLoading}
          >
            保存草稿
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={isLoading}
          >
            立即发布
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
