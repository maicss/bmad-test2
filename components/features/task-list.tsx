/**
 * Task List Component
 *
 * Story 2.6: Parent Uses Template to Quickly Create Task
 * Task 6.3: Add filter for planned/manual tasks
 *
 * Displays a list of tasks with:
 * - Filter by task type (all/manual/planned)
 * - Filter by status
 * - Search by title
 * - Sort by date/points
 *
 * Source: Story 2.6 AC #6
 */

'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskCard, type TaskCardProps } from '@/components/features/task-card';
import { Search, Filter, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface Task {
  id: string;
  title: string;
  taskType: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  points: number;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'skipped';
  scheduledDate: string;
  isManual: boolean;
  notes?: string | null;
}

export interface TaskListProps {
  tasks: Task[];
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canChangeStatus?: boolean;
  emptyMessage?: string;
}

type TaskTypeFilter = 'all' | 'manual' | 'planned';
type StatusFilter = 'all' | 'pending' | 'completed' | 'approved';
type SortBy = 'date' | 'points' | 'title';

/**
 * Task List Component
 *
 * Displays tasks with filtering and sorting capabilities
 */
export function TaskList({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  canEdit = false,
  canDelete = false,
  canChangeStatus = false,
  emptyMessage = '暂无任务',
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search by title
    if (searchQuery) {
      result = result.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by task type (manual/planned)
    if (taskTypeFilter === 'manual') {
      result = result.filter(task => task.isManual);
    } else if (taskTypeFilter === 'planned') {
      result = result.filter(task => !task.isManual);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(task => task.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
        case 'points':
          return b.points - a.points;
        case 'title':
          return a.title.localeCompare(b.title, 'zh');
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, searchQuery, taskTypeFilter, statusFilter, sortBy]);

  // Count tasks by type
  const taskCounts = useMemo(() => ({
    all: tasks.length,
    manual: tasks.filter(t => t.isManual).length,
    planned: tasks.filter(t => !t.isManual).length,
  }), [tasks]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索任务名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2">
          {/* Task Type Filter */}
          <Select value={taskTypeFilter} onValueChange={(value: TaskTypeFilter) => setTaskTypeFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="任务类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <span>全部</span>
                  <Badge variant="secondary" className="ml-auto">
                    {taskCounts.all}
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="manual">
                <div className="flex items-center gap-2">
                  <span>手动任务</span>
                  <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
                    {taskCounts.manual}
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="planned">
                <div className="flex items-center gap-2">
                  <span>计划任务</span>
                  <Badge variant="secondary" className="ml-auto">
                    {taskCounts.planned}
                  </Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待完成</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="approved">已通过</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">按日期</SelectItem>
              <SelectItem value="points">按积分</SelectItem>
              <SelectItem value="title">按名称</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        <div className="flex flex-wrap gap-2">
          {taskTypeFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {taskTypeFilter === 'manual' ? '手动任务' : '计划任务'}
              <button
                onClick={() => setTaskTypeFilter('all')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {statusFilter === 'pending' ? '待完成' : statusFilter === 'completed' ? '已完成' : '已通过'}
              <button
                onClick={() => setStatusFilter('all')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              搜索: {searchQuery}
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
              taskType={task.taskType}
              points={task.points}
              status={task.status}
              scheduledDate={task.scheduledDate}
              isManual={task.isManual}
              notes={task.notes}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              canEdit={canEdit && task.isManual}
              canDelete={canDelete && task.isManual}
              canChangeStatus={canChangeStatus}
            />
          ))}
        </div>
      )}

      {/* Result Count */}
      {filteredTasks.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          显示 {filteredTasks.length} / {tasks.length} 个任务
        </p>
      )}
    </div>
  );
}

export default TaskList;
