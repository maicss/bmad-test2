/**
 * Template Selector Component
 *
 * Story 2.6: Parent Uses Template to Quickly Create Task
 *
 * Displays a list of task templates for quick task creation.
 * Parents can select a template to pre-fill task information.
 *
 * Source: Story 2.6 Task 2
 * Source: _bmad-output/project-context.md - RED LIST rules
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';

// Task plan type from database
interface TaskPlan {
  id: string;
  title: string;
  task_type: '刷牙' | '学习' | '运动' | '家务' | '自定义';
  points: number;
  status: string;
  created_by: string;
}

// Template types
interface ParentTemplate extends TaskPlan {}
interface AdminTemplate extends TaskPlan {}

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: TaskPlan) => void;
  familyId: string;
}

/**
 * Template filter type
 */
type TemplateFilter = 'all' | 'mine' | 'admin';

/**
 * Task type badge colors
 */
const TASK_TYPE_COLORS: Record<string, string> = {
  '刷牙': 'bg-blue-100 text-blue-800',
  '学习': 'bg-green-100 text-green-800',
  '运动': 'bg-orange-100 text-orange-800',
  '家务': 'bg-purple-100 text-purple-800',
  '自定义': 'bg-gray-100 text-gray-800',
};

/**
 * Template Selector Dialog Component
 *
 * Allows parents to select a task template for quick task creation.
 * Supports filtering by template type and searching by title.
 */
export function TemplateSelector({
  open,
  onOpenChange,
  onSelectTemplate,
  familyId,
}: TemplateSelectorProps) {
  const [parentTemplates, setParentTemplates] = useState<ParentTemplate[]>([]);
  const [adminTemplates, setAdminTemplates] = useState<AdminTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<TemplateFilter>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  /**
   * Fetch templates when dialog opens
   */
  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, familyId]);

  /**
   * Fetch templates from API
   */
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/task-plans/for-quick-create?familyId=${familyId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      if (data.success) {
        setParentTemplates(data.parentTemplates || []);
        setAdminTemplates(data.adminTemplates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get filtered templates based on search and filter
   */
  const getFilteredTemplates = (): TaskPlan[] => {
    let templates: TaskPlan[] = [];

    if (filter === 'all' || filter === 'mine') {
      templates = [...templates, ...parentTemplates];
    }
    if (filter === 'all' || filter === 'admin') {
      templates = [...templates, ...adminTemplates];
    }

    // Filter by search term
    if (searchTerm) {
      templates = templates.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return templates;
  };

  /**
   * Handle template selection
   */
  const handleSelectTemplate = () => {
    const selectedTemplate = getFilteredTemplates().find(t => t.id === selectedTemplateId);
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onOpenChange(false);
      setSelectedTemplateId(null);
      setSearchTerm('');
    }
  };

  const filteredTemplates = getFilteredTemplates();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>选择任务模板</DialogTitle>
          <DialogDescription>
            选择一个模板快速创建任务，您可以修改模板中的信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索模板..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              全部
            </Button>
            <Button
              type="button"
              variant={filter === 'mine' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('mine')}
            >
              我的模板
            </Button>
            <Button
              type="button"
              variant={filter === 'admin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('admin')}
            >
              管理员模板
            </Button>
          </div>

          {/* Template list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? '没有找到匹配的模板' : '暂无可用模板'}
            </div>
          ) : (
            <RadioGroup value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                      selectedTemplateId === template.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={template.id} className="font-medium cursor-pointer">
                        {template.title}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Badge className={TASK_TYPE_COLORS[template.task_type]}>
                          {template.task_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {template.points} 积分
                        </span>
                        {adminTemplates.some(t => t.id === template.id) && (
                          <Badge variant="secondary" className="text-xs">
                            管理员
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSelectTemplate}
            disabled={!selectedTemplateId || loading}
          >
            选择模板
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
