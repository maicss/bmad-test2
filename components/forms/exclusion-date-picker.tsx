/**
 * Exclusion Date Picker Component
 *
 * Story 2.3: Parent Sets Task Date Rules
 *
 * This component allows parents to select dates to exclude from task generation.
 * Supports:
 * - Multiple date selection via calendar
 * - Permanent vs. one-time exclusion scope
 * - Quick presets (holidays, birthdays)
 * - Visual display and removal of excluded dates
 *
 * Source: Story 2.3 AC #1
 */

'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ExclusionDates } from '@/types/task-rule';

/**
 * Scope options for exclusion dates
 */
const SCOPE_OPTIONS = [
  { value: 'permanent', label: '永久', description: '所有年份都在此日期排除' },
  { value: 'once', label: '仅本周', description: '仅当前周排除' },
] as const;

/**
 * Quick preset exclusion dates (common holidays)
 */
const HOLIDAY_PRESETS = [
  { label: '元旦', month: 0, day: 1 }, // January 1
  { label: '春节', month: 0, day: 29 }, // Approximate (varies by lunar calendar)
  { label: '清明节', month: 3, day: 4 }, // April 4
  { label: '劳动节', month: 4, day: 1 }, // May 1
  { label: '端午节', month: 5, day: 10 }, // Approximate
  { label: '中秋节', month: 8, day: 15 }, // Approximate
  { label: '国庆节', month: 9, day: 1 }, // October 1
] as const;

interface ExclusionDatePickerProps {
  value?: ExclusionDates;
  onChange: (exclusionDates: ExclusionDates) => void;
  disabled?: boolean;
  showScope?: boolean;
}

/**
 * Exclusion Date Picker Component
 *
 * Provides interface for selecting dates to exclude from task generation
 */
export function ExclusionDatePicker({
  value = { dates: [], scope: 'permanent' },
  onChange,
  disabled = false,
  showScope = true,
}: ExclusionDatePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>(
    (value.dates || []).map(d => new Date(d))
  );

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const currentDates = value.dates || [];

    // Toggle date selection
    const newDates = currentDates.includes(dateStr)
      ? currentDates.filter(d => d !== dateStr)
      : [...currentDates, dateStr].sort();

    onChange({
      ...value,
      dates: newDates,
    });

    // Update calendar selection state
    setSelectedDates(newDates.map(d => new Date(d)));
  };

  // Handle manual date input
  const handleManualDateAdd = (dateString: string) => {
    // Validate YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const currentDates = value.dates || [];

    if (!currentDates.includes(dateStr)) {
      const newDates = [...currentDates, dateStr].sort();
      onChange({
        ...value,
        dates: newDates,
      });
      setSelectedDates(newDates.map(d => new Date(d)));
    }
  };

  // Remove excluded date
  const removeDate = (dateStr: string) => {
    const newDates = (value.dates || []).filter(d => d !== dateStr);
    onChange({
      ...value,
      dates: newDates,
    });
    setSelectedDates(newDates.map(d => new Date(d)));
  };

  // Add preset holiday (for current year)
  const addPresetHoliday = (preset: typeof HOLIDAY_PRESETS[number]) => {
    const currentYear = new Date().getFullYear();
    const date = new Date(currentYear, preset.month, preset.day);
    const dateStr = format(date, 'yyyy-MM-dd');

    const currentDates = value.dates || [];
    if (!currentDates.includes(dateStr)) {
      const newDates = [...currentDates, dateStr].sort();
      onChange({
        ...value,
        dates: newDates,
      });
      setSelectedDates(newDates.map(d => new Date(d)));
    }
  };

  // Handle scope change
  const handleScopeChange = (newScope: 'once' | 'permanent') => {
    onChange({
      ...value,
      scope: newScope,
    });
  };

  return (
    <div className="space-y-4">
      {/* Scope Selection */}
      {showScope && (
        <div className="space-y-2">
          <Label htmlFor="scope">排除范围</Label>
          <Select
            value={value.scope}
            onValueChange={handleScopeChange}
            disabled={disabled}
          >
            <SelectTrigger id="scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Calendar Date Picker */}
      <div className="space-y-2">
        <Label>选择排除日期</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDates.length > 0
                ? `已选择 ${selectedDates.length} 个日期`
                : '点击选择日期'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => {
                if (dates && dates.length > 0) {
                  const latestDate = dates[dates.length - 1];
                  handleDateSelect(latestDate);
                }
              }}
              locale={zhCN}
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Manual Date Input */}
      <div className="space-y-2">
        <Label htmlFor="manualDate">手动添加日期</Label>
        <div className="flex gap-2">
          <Input
            id="manualDate"
            type="text"
            placeholder="YYYY-MM-DD"
            disabled={disabled}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                handleManualDateAdd(target.value);
                target.value = '';
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const input = document.getElementById('manualDate') as HTMLInputElement;
              if (input) {
                handleManualDateAdd(input.value);
                input.value = '';
              }
            }}
            disabled={disabled}
          >
            添加
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          输入日期格式：YYYY-MM-DD，按回车或点击添加
        </p>
      </div>

      {/* Quick Preset Holidays */}
      <div className="space-y-2">
        <Label>快速添加节假日</Label>
        <div className="flex flex-wrap gap-2">
          {HOLIDAY_PRESETS.map(preset => (
            <Button
              key={preset.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addPresetHoliday(preset)}
              disabled={disabled}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Excluded Dates Display */}
      {value.dates && value.dates.length > 0 && (
        <div className="space-y-2">
          <Label>已排除的日期 ({value.dates.length})</Label>
          <div className="flex flex-wrap gap-2">
            {value.dates.map(dateStr => (
              <Badge key={dateStr} variant="secondary" className="flex items-center gap-1">
                {dateStr}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeDate(dateStr)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!value.dates || value.dates.length === 0) && (
        <p className="text-sm text-muted-foreground">
          暂无排除日期。任务将在所有符合条件的日期生成。
        </p>
      )}
    </div>
  );
}

export default ExclusionDatePicker;
