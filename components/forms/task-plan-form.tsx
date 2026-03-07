/**
 * Task Plan Form Component
 *
 * Story 2.1: Parent Creates Task Plan Template
 * Story 2.3: Parent Sets Task Date Rules
 * Task 2.1: Create TaskPlanForm component (using Shadcn UI)
 * Task 4.1-4.4: Integrate DateRuleSelector and ExclusionDatePicker
 *
 * This component allows parents to create task plan templates with:
 * - Template name (required, max 50 chars)
 * - Task type selection
 * - Assigned children selection
 * - Points value (1-100)
 * - Date rule selection (using DateRuleSelector)
 * - Excluded dates (using ExclusionDatePicker)
 * - Reminder time (optional)
 * - Save as draft / Publish buttons
 *
 * Source: Story 2.1 AC #1, Story 2.3 AC #1
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DateRuleSelector } from '@/components/forms/date-rule-selector';
import { ExclusionDatePicker } from '@/components/forms/exclusion-date-picker';
import type { TaskDateRule } from '@/types/task-rule';
import { validateTaskDateRule } from '@/lib/utils/validators/task-rule-validator';
import { PointsPresets } from '@/components/forms/points-suggestions';
import { getDefaultPoints } from '@/lib/constants/points-suggestions';

// Types for the form
export interface TaskPlanFormData {
  title: string;
  task_type: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  assigned_children: string[];
  points: number;
  dateRule: TaskDateRule;
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

const DEFAULT_FORM_DATA: TaskPlanFormData = {
  title: '',
  task_type: '刷牙',
  assigned_children: [],
  points: 5,
  dateRule: {
    frequency: 'daily',
    excludedDates: { dates: [], scope: 'permanent' }
  },
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

    // Date rule validation
    const ruleValidation = validateTaskDateRule(formData.dateRule);
    if (!ruleValidation.valid) {
      newErrors.dateRule = ruleValidation.errors[0] || '日期规则无效';
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
        ? prev.assigned_children.filter((id: string) => id !== childId)
        : [...prev.assigned_children, childId],
    }));
  };

  // Handle date rule change
  const handleDateRuleChange = (newRule: TaskDateRule) => {
    setFormData(prev => ({ ...prev, dateRule: newRule }));

    // Clear date rule error
    if (errors.dateRule) {
      setErrors(prev => ({ ...prev, dateRule: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (status: 'draft' | 'published') => {
    // Mark all fields as touched
    setTouched({
      title: true,
      task_type: true,
      points: true,
      dateRule: true,
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

        {/* Date Rule Selection */}
        <div className="space-y-4">
          <Label>
            日期规则 <span className="text-red-500">*</span>
          </Label>
          <DateRuleSelector
            value={formData.dateRule}
            onChange={handleDateRuleChange}
            disabled={isLoading}
            showExcludedDates={false}
          />
          {touched.dateRule && errors.dateRule && (
            <p className="text-sm text-red-500">{errors.dateRule}</p>
          )}
        </div>

        {/* Exclusion Dates - Now part of DateRuleSelector but can be separately configured */}
        <div className="space-y-4">
          <Label>排除日期（可选）</Label>
          <ExclusionDatePicker
            value={formData.dateRule.excludedDates}
            onChange={(newExclusion) => {
              handleDateRuleChange({
                ...formData.dateRule,
                excludedDates: newExclusion
              });
            }}
            disabled={isLoading}
            showScope={true}
          />
          <p className="text-xs text-muted-foreground">
            选择不需要生成任务的日期（如节假日、特殊日期）
          </p>
        </div>

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
