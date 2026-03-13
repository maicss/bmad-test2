/**
 * Date Rule Selector Component
 *
 * Story 2.3: Parent Sets Task Date Rules
 *
 * This component allows parents to select date generation rules for task plans.
 * Supports:
 * - Daily tasks
 * - Weekly tasks (select specific days)
 * - Weekdays only (Monday-Friday)
 * - Weekends only (Saturday-Sunday)
 * - Custom interval (every N days)
 * - Specific dates
 *
 * Source: Story 2.3 AC #1
 */

'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { TaskDateRule, FrequencyType } from '@/types/task-rule';

/**
 * Frequency options for the dropdown
 */
const FREQUENCY_OPTIONS = [
  { value: 'daily', label: '每天', description: '每天重复出现' },
  { value: 'weekly', label: '每周', description: '按星期选择（可多选）' },
  { value: 'weekdays', label: '工作日', description: '仅周一至周五' },
  { value: 'weekends', label: '周末', description: '仅周六、周日' },
  { value: 'interval', label: '自定义间隔', description: '每N天重复一次' },
  { value: 'specific', label: '特定日期', description: '仅在指定日期出现' },
] as const;

/**
 * Week day options for weekly frequency
 */
const WEEK_DAYS = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
] as const;

/**
 * Default rule state
 */
const DEFAULT_RULE: TaskDateRule = {
  frequency: 'daily',
  excludedDates: { dates: [], scope: 'permanent' }
};

interface DateRuleSelectorProps {
  value?: TaskDateRule;
  onChange: (rule: TaskDateRule) => void;
  disabled?: boolean;
  /** @deprecated Excluded dates are now managed separately via ExclusionDatePicker component */
  showExcludedDates?: boolean;
  /** Enable test mode - exposes helper functions to window object */
  testMode?: boolean;
}

/**
 * Date Rule Selector Component
 *
 * Provides a comprehensive interface for selecting task date rules
 */
export function DateRuleSelector({
  value = DEFAULT_RULE,
  onChange,
  disabled = false,
  showExcludedDates = true,
}: DateRuleSelectorProps) {
  const [specificDates, setSpecificDates] = useState<Date[]>([]);

  // Handle frequency change
  const handleFrequencyChange = (newFrequency: FrequencyType) => {
    const newRule: TaskDateRule = {
      frequency: newFrequency,
      excludedDates: value.excludedDates,
    };

    // Add default values for frequency-specific fields
    if (newFrequency === 'weekly') {
      newRule.daysOfWeek = [];
    } else if (newFrequency === 'interval') {
      newRule.intervalDays = 2;
    } else if (newFrequency === 'specific') {
      newRule.specificDates = [];
    }

    onChange(newRule);
  };

  // Handle day of week toggle for weekly frequency
  const toggleDayOfWeek = (dayValue: number) => {
    const currentDays = value.daysOfWeek || [];
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(d => d !== dayValue)
      : [...currentDays, dayValue].sort((a, b) => a - b);

    onChange({
      ...value,
      daysOfWeek: newDays,
    });
  };

  // Handle interval days change
  const handleIntervalDaysChange = (days: number) => {
    onChange({
      ...value,
      intervalDays: Math.max(1, Math.min(365, days)),
    });
  };

  // Handle specific date selection
  const handleSpecificDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const currentDates = value.specificDates || [];

    // Toggle date selection
    const newDates = currentDates.includes(dateStr)
      ? currentDates.filter(d => d !== dateStr)
      : [...currentDates, dateStr].sort();

    onChange({
      ...value,
      specificDates: newDates,
    });

    // Update calendar selection state
    if (currentDates.includes(dateStr)) {
      setSpecificDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
    } else {
      setSpecificDates(prev => [...prev, date]);
    }
  };

  // Remove specific date
  const removeSpecificDate = (dateStr: string) => {
    const newDates = (value.specificDates || []).filter(d => d !== dateStr);
    onChange({
      ...value,
      specificDates: newDates,
    });
    setSpecificDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
  };

  // Get selected frequency option
  const selectedFrequency = FREQUENCY_OPTIONS.find(opt => opt.value === value.frequency);

  // E2E Test helpers - expose functions to window object
  // Use useLayoutEffect to ensure helpers are available after DOM commit
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testSetFrequency = (freq: FrequencyType) => {
        handleFrequencyChange(freq);
      };
      (window as any).testToggleDayOfWeek = (dayValue: number) => {
        toggleDayOfWeek(dayValue);
      };
      (window as any).testSetIntervalDays = (days: number) => {
        handleIntervalDaysChange(days);
      };
      (window as any).testGetCurrentRule = () => value;
    }
  }); // Run on every render to capture latest handlers

  return (
    <div className="space-y-4">
      {/* Frequency Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="frequency">
          规则类型 <span className="text-red-500">*</span>
        </Label>
        <Select
          value={value.frequency}
          onValueChange={handleFrequencyChange}
          disabled={disabled}
        >
          <SelectTrigger id="frequency" data-testid="frequency-select-trigger">
            <SelectValue placeholder="选择规则类型" />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCY_OPTIONS.map(option => (
              <SelectItem
                key={option.value}
                value={option.value}
                data-testid={`frequency-option-${option.value}`}
              >
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedFrequency && (
          <p className="text-xs text-muted-foreground">{selectedFrequency.description}</p>
        )}
      </div>

      {/* Weekly: Days of Week Selection */}
      {value.frequency === 'weekly' && (
        <div className="space-y-2">
          <Label>
            选择星期 <span className="text-red-500">*</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {WEEK_DAYS.map(day => (
              <Button
                key={day.value}
                type="button"
                variant={(value.daysOfWeek || []).includes(day.value) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleDayOfWeek(day.value)}
                disabled={disabled}
              >
                {day.label}
              </Button>
            ))}
          </div>
          {(!value.daysOfWeek || value.daysOfWeek.length === 0) && (
            <p className="text-sm text-red-500">请至少选择一天</p>
          )}
        </div>
      )}

      {/* Interval: Custom Interval Input */}
      {value.frequency === 'interval' && (
        <div className="space-y-2">
          <Label htmlFor="intervalDays">
            间隔天数 <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">每</span>
            <Input
              id="intervalDays"
              type="number"
              min={1}
              max={365}
              value={value.intervalDays || 2}
              onChange={e => handleIntervalDaysChange(parseInt(e.target.value) || 2)}
              disabled={disabled}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">天</span>
          </div>
          <p className="text-xs text-muted-foreground">
            任务将每隔 {value.intervalDays || 2} 天重复一次
          </p>
        </div>
      )}

      {/* Specific Dates: Calendar Picker */}
      {value.frequency === 'specific' && (
        <div className="space-y-2">
          <Label>
            选择日期 <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                点击选择日期
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="multiple"
                selected={specificDates}
                onSelect={(dates) => {
                  if (dates && dates.length > 0) {
                    const latestDate = dates[dates.length - 1];
                    handleSpecificDateSelect(latestDate);
                  }
                }}
                locale={zhCN}
                disabled={disabled}
              />
            </PopoverContent>
          </Popover>
          {value.specificDates && value.specificDates.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {value.specificDates.map(dateStr => (
                <Badge key={dateStr} variant="secondary" className="flex items-center gap-1">
                  {dateStr}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeSpecificDate(dateStr)}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
          {(!value.specificDates || value.specificDates.length === 0) && (
            <p className="text-sm text-red-500">请至少选择一个日期</p>
          )}
        </div>
      )}
    </div>
  );
}

export default DateRuleSelector;
