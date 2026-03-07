/**
 * Task Preview Component
 *
 * Story 2.3: Parent Sets Task Date Rules
 * Task 7: 实现规则预览功能
 *
 * This component allows parents to preview when tasks will be generated
 * based on the date rule configuration.
 *
 * Features:
 * - Calendar view showing task generation dates
 * - Real-time preview updates when rule changes
 * - Task generation statistics
 * - Warnings for gaps caused by exclusion dates
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { TaskDateRule } from '@/types/task-rule';
import { DateRuleParser } from '@/lib/services/task-engine/date-rule-parser';

interface TaskPreviewProps {
  rule: TaskDateRule;
  planStartDate: Date;
  previewDays?: number;
  className?: string;
}

/**
 * Task Preview Component
 *
 * Shows parents a calendar preview of when tasks will be generated
 */
export function TaskPreview({
  rule,
  planStartDate,
  previewDays = 30,
  className = '',
}: TaskPreviewProps) {
  const parser = useMemo(() => new DateRuleParser(), []);

  // Calculate preview date range
  const previewStartDate = planStartDate;
  const previewEndDate = addDays(planStartDate, previewDays - 1);

  // Get generation statistics
  const stats = useMemo(() => {
    return parser.getGenerationStats(
      rule,
      previewStartDate,
      previewEndDate,
      planStartDate
    );
  }, [rule, previewStartDate, previewEndDate, planStartDate, parser]);

  // Get generation dates (highlighted in calendar)
  const generationDates = useMemo(() => {
    return stats.dates;
  }, [stats.dates]);

  // Get excluded dates in preview range
  const excludedDatesInRange = useMemo(() => {
    const allExcludedDates: Date[] = [];
    rule.excludedDates.dates.forEach(dateStr => {
      const date = new Date(dateStr);
      if (date >= previewStartDate && date <= previewEndDate) {
        allExcludedDates.push(date);
      }
    });
    return allExcludedDates;
  }, [rule.excludedDates.dates, previewStartDate, previewEndDate]);

  // Calculate statistics for different ranges
  const stats7Days = useMemo(() => {
    const endDate = addDays(planStartDate, 6);
    return parser.getGenerationStats(rule, planStartDate, endDate, planStartDate);
  }, [rule, planStartDate, parser]);

  const stats30Days = stats;
  const stats90Days = useMemo(() => {
    const endDate = addDays(planStartDate, 89);
    return parser.getGenerationStats(rule, planStartDate, endDate, planStartDate);
  }, [rule, planStartDate, parser]);

  // Check for warnings (gaps in task generation)
  const warnings = useMemo(() => {
    const result: string[] = [];

    // Warning if excluded dates cause gaps
    if (excludedDatesInRange.length > 0 && stats.count === 0) {
      result.push('排除日期导致预览期内没有任务生成');
    }

    // Warning for specific dates with many exclusions
    if (rule.frequency === 'specific' && stats.count < 3) {
      result.push('特定日期规则生成的任务较少，请确认日期设置');
    }

    // Warning for interval rules with large intervals
    if (rule.frequency === 'interval' && (rule.intervalDays || 0) > 14) {
      result.push(`间隔天数较长(${rule.intervalDays}天)，任务生成频率较低`);
    }

    return result;
  }, [excludedDatesInRange.length, rule, stats.count]);

  // Format date for display
  const formatDateRange = () => {
    return `${format(previewStartDate, 'yyyy年MM月dd日')} - ${format(previewEndDate, 'yyyy年MM月dd日')}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          任务生成预览
        </CardTitle>
        <CardDescription>
          {formatDateRange()} · 共{previewDays}天
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats7Days.count}</div>
            <div className="text-xs text-muted-foreground">未来7天</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats30Days.count}</div>
            <div className="text-xs text-muted-foreground">未来30天</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats90Days.count}</div>
            <div className="text-xs text-muted-foreground">未来90天</div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Calendar Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">日历预览</h4>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary"></div>
                <span>任务生成日</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span>排除日期</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-background">
            <Calendar
              mode="single"
              month={previewStartDate}
              selected={generationDates}
              modifiers={{
                excluded: excludedDatesInRange,
              }}
              modifiersStyles={{
                selected: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: '4px',
                },
                excluded: {
                  backgroundColor: 'hsl(var(--destructive) / 0.2)',
                  color: 'hsl(var(--destructive))',
                  borderRadius: '4px',
                  textDecoration: 'line-through',
                },
              }}
              disabled={false}
              locale={zhCN}
              className="justify-start"
            />
          </div>
        </div>

        {/* Excluded Dates List */}
        {excludedDatesInRange.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">排除日期 ({excludedDatesInRange.length})</h4>
            <div className="flex flex-wrap gap-2">
              {excludedDatesInRange.map(date => (
                <Badge key={date.toISOString()} variant="destructive">
                  {format(date, 'MM月dd日')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Next Generation Dates */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">即将生成的任务</h4>
          {generationDates.length > 0 ? (
            <div className="space-y-1">
              {generationDates.slice(0, 5).map(date => (
                <div key={date.toISOString()} className="text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span>{format(date, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}</span>
                </div>
              ))}
              {generationDates.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  还有 {generationDates.length - 5} 个日期...
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              预览期内没有任务生成，请检查日期规则设置
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskPreview;
